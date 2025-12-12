// ============================================================================
// AUTH CONTEXT
// Global authentication state management with Supabase
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, ensureSession, isAnonymousUser } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  is_admin: boolean;
  is_active: boolean;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'expired' | 'trial';
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface AuthContextValue extends AuthState {
  // Auth actions (captchaToken is optional for backward compatibility)
  signUp: (email: string, password: string, captchaToken?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: AuthError | null }>;
  signInWithMagicLink: (email: string, captchaToken?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string, captchaToken?: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  upgradeAnonymousAccount: (email: string, password: string, captchaToken?: string) => Promise<{ error: AuthError | null }>;
  
  // UI state
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalMode: 'login' | 'signup' | 'reset';
  setAuthModalMode: (mode: 'login' | 'signup' | 'reset') => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(true);

  // UI state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'reset'>('login');

  // Derived state
  const isAuthenticated = !!user && !isAnonymous;
  const isAdmin = profile?.is_admin ?? false;

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Profile might not exist yet for new users - that's ok
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }
        return null;
      }

      return data as UserProfile;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    const initAuth = async () => {
      try {
        // Try to get existing session
        const { data: { session: existingSession } } = await supabase!.auth.getSession();

        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
          setIsAnonymous(existingSession.user.is_anonymous ?? false);

          // Fetch profile for authenticated users
          if (!existingSession.user.is_anonymous) {
            const userProfile = await fetchProfile(existingSession.user.id);
            setProfile(userProfile);
          }
        } else {
          // No session - create anonymous session for data persistence
          const anonSession = await ensureSession();
          if (anonSession) {
            setSession(anonSession);
            setUser(anonSession.user);
            setIsAnonymous(true);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change:', event);

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setIsAnonymous(newSession.user.is_anonymous ?? false);

          // Fetch profile for authenticated users
          if (!newSession.user.is_anonymous) {
            const userProfile = await fetchProfile(newSession.user.id);
            setProfile(userProfile);
          } else {
            setProfile(null);
          }
        } else {
          setIsAnonymous(true);
          setProfile(null);
        }

        // Close modal on successful auth
        if (event === 'SIGNED_IN' && newSession?.user && !newSession.user.is_anonymous) {
          setShowAuthModal(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================================
  // AUTH ACTIONS
  // ============================================================================

  const signUp = useCallback(async (email: string, password: string, captchaToken?: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };

    // Retry configuration for transient failures
    const MAX_RETRIES = 3;
    const INITIAL_DELAY_MS = 1000;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    let lastError: any = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Retrying signup after ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
        await delay(delayMs);
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          captchaToken,
        },
      });

      if (!error) {
        return { error: null };
      }

      lastError = error;

      // Log detailed error for debugging
      console.error('[Auth] Sign up error:', {
        status: error.status,
        message: error.message,
        name: error.name,
        code: (error as any).code,
      });

      // Only retry on transient errors (not captcha failures)
      const isRetryable = error.status === 504 ||
                         error.name === 'AuthRetryableFetchError' ||
                         error.message?.includes('Gateway Timeout');
      const isCaptchaError = error.message?.toLowerCase().includes('captcha') ||
                            (error as any).code === 'captcha_failed' ||
                            error.status === 400;
      if (!isRetryable || isCaptchaError) {
        break;
      }
    }

    // Improve error messages for common issues
    let message = lastError?.message || 'An error occurred';
    const errorCode = (lastError as any)?.code;

    if (lastError?.status === 504 || lastError?.name === 'AuthRetryableFetchError') {
      message = 'Server is temporarily unavailable. Please try again in a moment.';
    } else if (lastError?.status === 406) {
      message = 'Request not acceptable. Please check your Supabase configuration.';
    } else if (lastError?.message?.toLowerCase().includes('captcha') || errorCode === 'captcha_failed') {
      message = 'Captcha verification failed. This may be a server configuration issue. Please try again or contact support.';
    } else if (lastError?.status === 400 && !lastError?.message?.includes('already registered')) {
      // Generic 400 error might be captcha-related
      console.warn('[Auth] 400 error - possibly captcha verification failed on server. Check Supabase Turnstile secret key configuration.');
      message = 'Sign up failed. This may be due to captcha verification. Please try again.';
    }
    return { error: { ...lastError, message } as AuthError };
  }, []);

  const signIn = useCallback(async (email: string, password: string, captchaToken?: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };

    // Retry configuration for transient failures
    const MAX_RETRIES = 3;
    const INITIAL_DELAY_MS = 1000;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    let lastError: any = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Retrying signin after ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
        await delay(delayMs);
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken,
        },
      });

      if (!error) {
        return { error: null };
      }

      lastError = error;

      // Log detailed error for debugging
      console.error('[Auth] Sign in error:', {
        status: error.status,
        message: error.message,
        name: error.name,
        code: (error as any).code,
      });

      // Only retry on transient errors (not auth failures like wrong password or captcha errors)
      const isRetryable = error.status === 504 ||
                         error.name === 'AuthRetryableFetchError' ||
                         error.message?.includes('Gateway Timeout');
      const isCaptchaError = error.message?.toLowerCase().includes('captcha') ||
                            (error as any).code === 'captcha_failed' ||
                            error.status === 400;
      if (!isRetryable || isCaptchaError) {
        break;
      }
    }

    // Improve error messages for common issues
    let message = lastError?.message || 'An error occurred';
    const errorCode = (lastError as any)?.code;

    if (lastError?.status === 504 || lastError?.name === 'AuthRetryableFetchError') {
      message = 'Server is temporarily unavailable. Please try again in a moment.';
    } else if (lastError?.status === 406) {
      message = 'Request not acceptable. Please check your Supabase configuration.';
    } else if (lastError?.message?.includes('Invalid login credentials')) {
      message = 'Invalid email or password. Please check your credentials.';
    } else if (lastError?.message?.toLowerCase().includes('captcha') || errorCode === 'captcha_failed') {
      message = 'Captcha verification failed. This may be a server configuration issue. Please try again or contact support.';
    } else if (lastError?.status === 400 && !lastError?.message?.includes('Invalid login')) {
      // Generic 400 error might be captcha-related
      console.warn('[Auth] 400 error - possibly captcha verification failed on server. Check Supabase Turnstile secret key configuration.');
      message = 'Authentication failed. This may be due to captcha verification. Please try again.';
    }
    return { error: { ...lastError, message } as AuthError };
  }, []);

  const signInWithMagicLink = useCallback(async (email: string, captchaToken?: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        captchaToken,
      },
    });

    if (error?.message?.toLowerCase().includes('captcha')) {
      return { error: { ...error, message: 'Captcha verification failed. Please try again.' } as AuthError };
    }

    return { error };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    
    await supabase.auth.signOut();
    
    // Create new anonymous session after logout
    const anonSession = await ensureSession();
    if (anonSession) {
      setSession(anonSession);
      setUser(anonSession.user);
      setIsAnonymous(true);
    }
  }, []);

  const resetPassword = useCallback(async (email: string, captchaToken?: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken,
    });

    if (error?.message?.toLowerCase().includes('captcha')) {
      return { error: { ...error, message: 'Captcha verification failed. Please try again.' } as AuthError };
    }

    return { error };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    return { error };
  }, []);

  const upgradeAnonymousAccount = useCallback(async (email: string, password: string, captchaToken?: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };

    // Check if current user is anonymous
    const isAnon = await isAnonymousUser();
    if (!isAnon) {
      return { error: new Error('Current user is not anonymous') as AuthError };
    }

    // Retry configuration for handling transient failures (504s, network issues)
    const MAX_RETRIES = 3;
    const INITIAL_DELAY_MS = 1000;

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const attemptUpgrade = async (attempt: number): Promise<{ data: any; error: any }> => {
      try {
        console.log(`Upgrade attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
        // Note: updateUser doesn't support captchaToken directly in options
        // The captcha should have been verified on a previous sign-in/sign-up attempt
        const result = await supabase!.auth.updateUser({
          email,
          password,
        });
        return result;
      } catch (err: any) {
        // Network errors or timeouts - these are retryable
        const isCaptchaError = err.message?.toLowerCase().includes('captcha');
        if (!isCaptchaError && attempt < MAX_RETRIES && (
          err.name === 'AuthRetryableFetchError' ||
          err.message?.includes('fetch') ||
          err.message?.includes('network') ||
          err.message?.includes('timeout')
        )) {
          const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt);
          console.log(`Retrying in ${delayMs}ms...`);
          await delay(delayMs);
          return attemptUpgrade(attempt + 1);
        }
        throw err;
      }
    };

    try {
      // Update anonymous user with email/password (this preserves their data)
      const { data, error } = await attemptUpgrade(0);

      if (error) {
        // Check if this is a retryable error (but not captcha errors)
        const isCaptchaError = error.message?.toLowerCase().includes('captcha');
        const isRetryable = !isCaptchaError && (
                           error.status === 504 ||
                           error.name === 'AuthRetryableFetchError' ||
                           error.message?.includes('Gateway Timeout'));

        if (isRetryable) {
          // Try again with exponential backoff
          for (let retry = 0; retry < MAX_RETRIES; retry++) {
            const delayMs = INITIAL_DELAY_MS * Math.pow(2, retry);
            console.log(`Retrying upgrade after ${delayMs}ms (attempt ${retry + 2}/${MAX_RETRIES + 1})`);
            await delay(delayMs);

            const retryResult = await supabase.auth.updateUser({ email, password });
            if (!retryResult.error) {
              if (retryResult.data?.user) {
                setIsAnonymous(false);
              }
              return { error: null };
            }

            // If non-retryable error, break out
            if (retryResult.error.status !== 504 &&
                retryResult.error.name !== 'AuthRetryableFetchError') {
              break;
            }
          }
        }

        console.error('Upgrade anonymous account error:', error);
        // Provide more helpful error messages
        let message = error.message;
        if (error.message?.includes('email_exists') || error.message?.includes('already registered')) {
          message = 'This email is already registered. Try signing in instead.';
        } else if (error.message?.includes('weak_password')) {
          message = 'Password is too weak. Please use a stronger password.';
        } else if (error.status === 422) {
          message = 'Unable to create account. The email may already be in use.';
        } else if (error.status === 504 || error.name === 'AuthRetryableFetchError') {
          message = 'Server is temporarily unavailable. Please wait a moment and try again.';
        } else if (error.status === 406) {
          message = 'Request not acceptable. Please check your Supabase configuration.';
        } else if (error.message?.toLowerCase().includes('captcha')) {
          message = 'Captcha verification failed. Please try again.';
        }
        return { error: { ...error, message } as AuthError };
      }

      if (data?.user) {
        setIsAnonymous(false);
      }

      return { error: null };
    } catch (err: any) {
      console.error('Upgrade anonymous account exception:', err);
      let message = err.message || 'Failed to create account';
      if (err.message?.toLowerCase().includes('captcha')) {
        message = 'Captcha verification failed. Please try again.';
      }
      return { error: { message } as AuthError };
    }
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: AuthContextValue = {
    // State
    user,
    session,
    profile,
    isLoading,
    isAnonymous,
    isAuthenticated,
    isAdmin,

    // Actions
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    resetPassword,
    updatePassword,
    upgradeAnonymousAccount,

    // UI state
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    setAuthModalMode,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
