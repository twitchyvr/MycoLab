// ============================================================================
// AUTH CONTEXT
// Authentication state management with anonymous + email support
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  ensureSession,
  signInWithEmail,
  linkEmailToAnonymousAccount,
  signUpWithEmail,
  signOut as supabaseSignOut,
  onAuthStateChange,
} from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  linkEmail: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const defaultAuthState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAnonymous: false,
  isAuthenticated: false,
  error: null,
};

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
  onAuthChange?: (user: User | null, isAnonymous: boolean) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, onAuthChange }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  // Initialize auth on mount
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthState({
        ...defaultAuthState,
        isLoading: false,
      });
      return;
    }

    const initAuth = async () => {
      try {
        // Ensure we have a session (creates anonymous if needed)
        const session = await ensureSession();

        if (session?.user) {
          const isAnonymous = session.user.is_anonymous ?? false;
          setAuthState({
            user: session.user,
            session,
            isLoading: false,
            isAnonymous,
            isAuthenticated: true,
            error: null,
          });
          onAuthChange?.(session.user, isAnonymous);
        } else {
          setAuthState({
            ...defaultAuthState,
            isLoading: false,
          });
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setAuthState({
          ...defaultAuthState,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id, session?.user?.email);

      if (session?.user) {
        const isAnonymous = session.user.is_anonymous ?? false;
        setAuthState({
          user: session.user,
          session,
          isLoading: false,
          isAnonymous,
          isAuthenticated: true,
          error: null,
        });
        onAuthChange?.(session.user, isAnonymous);
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          ...defaultAuthState,
          isLoading: false,
        });
        onAuthChange?.(null, false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onAuthChange]);

  // Sign in with email
  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return { error: error.message };
    }

    // Auth state will be updated by the listener
    setAuthState(prev => ({ ...prev, isLoading: false }));
    return { error: null };
  }, []);

  // Sign up new user
  const signUp = useCallback(async (email: string, password: string): Promise<{ error: string | null; needsConfirmation: boolean }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const { user, error } = await signUpWithEmail(email, password);

    if (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return { error: error.message, needsConfirmation: false };
    }

    // Check if email confirmation is required
    const needsConfirmation = user?.email_confirmed_at === null;

    setAuthState(prev => ({ ...prev, isLoading: false }));
    return { error: null, needsConfirmation };
  }, []);

  // Link email to anonymous account
  const linkEmail = useCallback(async (email: string, password: string): Promise<{ error: string | null; needsConfirmation: boolean }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const { user, error } = await linkEmailToAnonymousAccount(email, password);

    if (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return { error: error.message, needsConfirmation: false };
    }

    // When linking, email confirmation may be required
    const needsConfirmation = user?.email_confirmed_at === null;

    setAuthState(prev => ({ ...prev, isLoading: false }));
    return { error: null, needsConfirmation };
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    await supabaseSignOut();

    // After signing out, create a new anonymous session
    const session = await ensureSession();

    if (session?.user) {
      const isAnonymous = session.user.is_anonymous ?? false;
      setAuthState({
        user: session.user,
        session,
        isLoading: false,
        isAnonymous,
        isAuthenticated: true,
        error: null,
      });
      onAuthChange?.(session.user, isAnonymous);
    } else {
      setAuthState({
        ...defaultAuthState,
        isLoading: false,
      });
      onAuthChange?.(null, false);
    }
  }, [onAuthChange]);

  // Refresh auth state
  const refreshAuth = useCallback(async () => {
    if (!supabase) return;

    setAuthState(prev => ({ ...prev, isLoading: true }));

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const isAnonymous = session.user.is_anonymous ?? false;
      setAuthState({
        user: session.user,
        session,
        isLoading: false,
        isAnonymous,
        isAuthenticated: true,
        error: null,
      });
    } else {
      setAuthState({
        ...defaultAuthState,
        isLoading: false,
      });
    }
  }, []);

  const contextValue: AuthContextValue = {
    ...authState,
    signIn,
    signUp,
    linkEmail,
    signOut,
    refreshAuth,
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
