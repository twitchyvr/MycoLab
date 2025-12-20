// ============================================================================
// AUTH CONTEXT
// Global authentication state management with Supabase
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, ensureSession, isAnonymousUser, clearLocalData, isAnonymousAuthAvailable, checkEmailAccount, migrateUserData, linkGoogleIdentity, EmailAccountInfo } from './supabase';
import { notificationService } from '../store/NotificationService';
import { AccountLinkingState } from '../components/auth/AccountLinkingModal';

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

// Signup result with detailed info for better UX
export interface SignUpResult {
  error: AuthError | null;
  user: User | null;
  session: Session | null;
  needsEmailConfirmation: boolean;
}

export interface AuthContextValue extends AuthState {
  // Auth actions (captchaToken is optional for backward compatibility)
  signUp: (email: string, password: string, captchaToken?: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: AuthError | null }>;
  signInWithMagicLink: (email: string, captchaToken?: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: (options?: { clearData?: boolean }) => Promise<void>;
  resetPassword: (email: string, captchaToken?: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  upgradeAnonymousAccount: (email: string, password: string, captchaToken?: string) => Promise<SignUpResult>;
  deleteAccount: () => Promise<{ error: Error | null }>;

  // UI state
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalMode: 'login' | 'signup' | 'reset';
  setAuthModalMode: (mode: 'login' | 'signup' | 'reset') => void;

  // Account linking
  accountLinkingState: AccountLinkingState;
  checkForExistingAccount: (email: string) => Promise<EmailAccountInfo | null>;
  handleLinkAccounts: () => Promise<void>;
  handleKeepSeparate: () => void;
  closeAccountLinking: () => void;
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

  // Account linking state
  const [accountLinkingState, setAccountLinkingState] = useState<AccountLinkingState>({
    show: false,
    email: '',
    existingAccount: null,
    currentProvider: 'email',
    currentUserId: null,
  });

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

    // Check if this is an OAuth callback (tokens in URL hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasOAuthTokens = hashParams.has('access_token');

    if (hasOAuthTokens) {
      console.log('[Auth] OAuth callback detected in URL hash');
    }

    // Listen for auth changes FIRST - this handles OAuth callbacks
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] Auth state change:', event, newSession?.user?.email || 'no user');

        // Clear OAuth tokens from URL for cleaner appearance
        if (hasOAuthTokens && window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);

        // Set user ID for notification service
        notificationService.setUserId(newSession?.user?.id ?? null);

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

          // Check if this is an OAuth sign-in (Google) and there might be a duplicate account
          // We detect this by checking if the user just signed in with an OAuth provider
          const identities = newSession.user.identities || [];
          const hasGoogleIdentity = identities.some(i => i.provider === 'google');
          const hasEmailIdentity = identities.some(i => i.provider === 'email');
          const userEmail = newSession.user.email;

          // Only check for duplicates if user has exactly one identity (just signed up)
          // and it's a Google OAuth sign-in
          if (userEmail && hasGoogleIdentity && !hasEmailIdentity && identities.length === 1) {
            // Check if there's an existing account with this email
            checkEmailAccount(userEmail).then(existingAccount => {
              if (existingAccount?.exists_in_system &&
                  existingAccount.user_id &&
                  existingAccount.user_id !== newSession.user.id) {
                // Found a different account with the same email!
                console.log('[Auth] Detected duplicate account for email:', userEmail);
                setAccountLinkingState({
                  show: true,
                  email: userEmail,
                  existingAccount,
                  currentProvider: 'google',
                  currentUserId: newSession.user.id,
                });
              }
            }).catch(err => {
              console.warn('[Auth] Error checking for duplicate account:', err);
            });
          }
        }
      }
    );

    // Get initial session (only if NOT an OAuth callback - let onAuthStateChange handle that)
    const initAuth = async () => {
      // If we have OAuth tokens, onAuthStateChange will handle it
      if (hasOAuthTokens) {
        console.log('[Auth] Waiting for onAuthStateChange to process OAuth tokens...');
        return;
      }

      try {
        // Try to get existing session
        const { data: { session: existingSession }, error: sessionError } = await supabase!.auth.getSession();

        if (sessionError) {
          console.error('[Auth] Error getting session:', sessionError);
        }

        if (existingSession) {
          console.log('[Auth] Existing session found:', existingSession.user.email);
          setSession(existingSession);
          setUser(existingSession.user);
          setIsAnonymous(existingSession.user.is_anonymous ?? false);

          // Fetch profile for authenticated users
          if (!existingSession.user.is_anonymous) {
            const userProfile = await fetchProfile(existingSession.user.id);
            setProfile(userProfile);
          }
        } else {
          // No session - try to create anonymous session for data persistence
          // This is optional and will gracefully fail if anonymous auth is disabled
          const anonSession = await ensureSession();
          if (anonSession) {
            setSession(anonSession);
            setUser(anonSession.user);
            setIsAnonymous(true);
          } else {
            // No session available - app will work in unauthenticated mode
            // User needs to sign up or sign in to sync data
            setSession(null);
            setUser(null);
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================================
  // AUTH ACTIONS
  // ============================================================================

  const signUp = useCallback(async (email: string, password: string, captchaToken?: string): Promise<SignUpResult> => {
    const emptyResult: SignUpResult = { error: null, user: null, session: null, needsEmailConfirmation: false };

    if (!supabase) {
      return { ...emptyResult, error: new Error('Supabase not configured') as AuthError };
    }

    // Retry configuration for transient failures
    const MAX_RETRIES = 3;
    const INITIAL_DELAY_MS = 1000;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    let lastError: any = null;
    let lastData: any = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Retrying signup after ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
        await delay(delayMs);
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          captchaToken,
        },
      });

      lastData = data;
      lastError = error;

      if (!error) {
        // Success - check if user was actually created
        const userCreated = !!data?.user;
        const hasSession = !!data?.session;
        const needsEmailConfirmation = userCreated && !hasSession;

        // Log for debugging
        console.log('[Auth] Sign up result:', {
          userCreated,
          hasSession,
          needsEmailConfirmation,
          userId: data?.user?.id,
          email: data?.user?.email,
          emailConfirmedAt: data?.user?.email_confirmed_at,
        });

        // If no user was created, this is a silent failure
        if (!userCreated) {
          console.warn('[Auth] Sign up returned success but no user was created');
          return {
            ...emptyResult,
            error: { message: 'Account creation failed. Please try again or contact support.' } as AuthError,
          };
        }

        return {
          error: null,
          user: data.user,
          session: data.session,
          needsEmailConfirmation,
        };
      }

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

    return {
      ...emptyResult,
      error: { ...lastError, message } as AuthError,
    };
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

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    return { error };
  }, []);

  const signOut = useCallback(async (options: { clearData?: boolean } = {}) => {
    console.log('[Auth] signOut called');

    // FIRST: Clear state immediately - don't wait for anything else
    // This ensures the user sees logout even if network calls hang
    setSession(null);
    setUser(null);
    setIsAnonymous(true);
    setProfile(null);
    console.log('[Auth] State cleared');

    // Clear local data (preserves settings by default)
    if (options.clearData) {
      clearLocalData({ preserveSettings: false });
    } else {
      clearLocalData({ preserveSettings: true });
    }

    // NOW try to sign out from Supabase - but don't block on it
    if (supabase) {
      // Capture supabase reference for closure (TypeScript null safety)
      const supabaseRef = supabase;

      // Fire and forget with a short timeout - don't await it blocking the UI
      const signOutWithTimeout = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          // Try to sign out but don't let it hang
          await Promise.race([
            supabaseRef.auth.signOut(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Sign out timed out')), 3000)
            )
          ]);

          clearTimeout(timeoutId);
          console.log('[Auth] Supabase signOut completed');
        } catch (err) {
          console.warn('[Auth] signOut background cleanup failed (UI already cleared):', err);
        }
      };

      // Run sign out in background - don't await, UI is already cleared
      signOutWithTimeout().catch(() => {});
    }

    console.log('[Auth] signOut complete (UI cleared)');
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

  // Delete account and all user data
  const deleteAccount = useCallback(async (): Promise<{ error: Error | null }> => {
    if (!supabase || !user) {
      return { error: new Error('Not authenticated') };
    }

    const userId = user.id;

    try {
      console.log('[Auth] Deleting account data for user:', userId);

      // Delete user data from all tables (RLS will ensure we only delete our own data)
      // Order matters for foreign key constraints
      const tablesToDelete = [
        'culture_observations',
        'grow_observations',
        'flushes',
        'culture_transfers',
        'recipe_ingredients',
        'grows',
        'cultures',
        'recipes',
        'inventory_items',
        'user_settings',
      ];

      for (const table of tablesToDelete) {
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.warn(`[Auth] Error deleting from ${table}:`, deleteError.message);
          // Continue with other tables even if one fails
        }
      }

      // Mark user profile as inactive (we can't delete auth users from client)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (profileError) {
        console.warn('[Auth] Error deactivating profile:', profileError.message);
      }

      // Clear all local data
      clearLocalData({ preserveSettings: false });

      // Sign out
      await supabase.auth.signOut();

      // Try anonymous session only if available
      if (isAnonymousAuthAvailable()) {
        const anonSession = await ensureSession();
        if (anonSession) {
          setSession(anonSession);
          setUser(anonSession.user);
          setIsAnonymous(true);
          setProfile(null);
          console.log('[Auth] Account deletion completed');
          return { error: null };
        }
      }

      // No anonymous session - clear everything
      setSession(null);
      setUser(null);
      setIsAnonymous(true);
      setProfile(null);

      console.log('[Auth] Account deletion completed');
      return { error: null };
    } catch (err) {
      console.error('[Auth] Account deletion error:', err);
      return { error: err instanceof Error ? err : new Error('Failed to delete account') };
    }
  }, [user]);

  const upgradeAnonymousAccount = useCallback(async (email: string, password: string, captchaToken?: string): Promise<SignUpResult> => {
    const emptyResult: SignUpResult = { error: null, user: null, session: null, needsEmailConfirmation: false };

    if (!supabase) {
      return { ...emptyResult, error: new Error('Supabase not configured') as AuthError };
    }

    // Check if current user is anonymous
    const isAnon = await isAnonymousUser();
    if (!isAnon) {
      return { ...emptyResult, error: new Error('Current user is not anonymous') as AuthError };
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

              // Get current session to check if email confirmation needed
              const { data: sessionData } = await supabase.auth.getSession();
              const needsEmailConfirmation = !retryResult.data?.user?.email_confirmed_at;

              return {
                error: null,
                user: retryResult.data?.user || null,
                session: sessionData?.session || null,
                needsEmailConfirmation,
              };
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
        return { ...emptyResult, error: { ...error, message } as AuthError };
      }

      // Success - check results
      if (data?.user) {
        setIsAnonymous(false);
      }

      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const needsEmailConfirmation = !data?.user?.email_confirmed_at;

      console.log('[Auth] Upgrade result:', {
        userUpdated: !!data?.user,
        hasSession: !!sessionData?.session,
        needsEmailConfirmation,
        userId: data?.user?.id,
        email: data?.user?.email,
      });

      return {
        error: null,
        user: data?.user || null,
        session: sessionData?.session || null,
        needsEmailConfirmation,
      };
    } catch (err: any) {
      console.error('Upgrade anonymous account exception:', err);
      let message = err.message || 'Failed to create account';
      if (err.message?.toLowerCase().includes('captcha')) {
        message = 'Captcha verification failed. Please try again.';
      }
      return { ...emptyResult, error: { message } as AuthError };
    }
  }, []);

  // ============================================================================
  // ACCOUNT LINKING FUNCTIONS
  // ============================================================================

  /**
   * Check if an email already exists in the system
   * Returns account info if found, null otherwise
   */
  const checkForExistingAccount = useCallback(async (email: string): Promise<EmailAccountInfo | null> => {
    return await checkEmailAccount(email);
  }, []);

  /**
   * Trigger the account linking flow
   * Called when we detect an existing account with a different provider
   */
  const triggerAccountLinking = useCallback((
    email: string,
    existingAccount: EmailAccountInfo,
    currentProvider: 'email' | 'google',
    currentUserId: string | null
  ) => {
    setAccountLinkingState({
      show: true,
      email,
      existingAccount,
      currentProvider,
      currentUserId,
    });
  }, []);

  /**
   * Handle linking accounts
   * This will migrate data from the old account to the current account
   */
  const handleLinkAccounts = useCallback(async () => {
    const { existingAccount, currentUserId } = accountLinkingState;

    if (!existingAccount?.user_id || !currentUserId) {
      throw new Error('Missing account information for linking');
    }

    // Determine which account has the data we want to preserve
    // The older account is likely the one with more data
    const fromUserId = existingAccount.user_id;
    const toUserId = currentUserId;

    console.log('[Auth] Linking accounts:', { from: fromUserId, to: toUserId });

    // Migrate data from the old account to the new one
    const result = await migrateUserData(fromUserId, toUserId);

    if (!result.success) {
      throw new Error(result.message);
    }

    console.log('[Auth] Account linking successful:', result);

    // If current user is logged in with email and existing account has Google,
    // offer to link Google identity
    if (accountLinkingState.currentProvider === 'email' && existingAccount.has_google) {
      // User can now use linkGoogleIdentity() to add Google to their account
      console.log('[Auth] User can now link Google identity if desired');
    }

    // Close the linking modal
    setAccountLinkingState(prev => ({ ...prev, show: false }));
  }, [accountLinkingState]);

  /**
   * User chose to keep accounts separate
   */
  const handleKeepSeparate = useCallback(() => {
    console.log('[Auth] User chose to keep accounts separate');
    setAccountLinkingState({
      show: false,
      email: '',
      existingAccount: null,
      currentProvider: 'email',
      currentUserId: null,
    });
  }, []);

  /**
   * Close the account linking modal
   */
  const closeAccountLinking = useCallback(() => {
    setAccountLinkingState({
      show: false,
      email: '',
      existingAccount: null,
      currentProvider: 'email',
      currentUserId: null,
    });
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
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    upgradeAnonymousAccount,
    deleteAccount,

    // UI state
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    setAuthModalMode,

    // Account linking
    accountLinkingState,
    checkForExistingAccount,
    handleLinkAccounts,
    handleKeepSeparate,
    closeAccountLinking,
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
