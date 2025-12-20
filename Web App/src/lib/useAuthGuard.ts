// ============================================================================
// USE AUTH GUARD HOOK
// Protects actions from anonymous users by showing auth modal
// ============================================================================

import { useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface AuthGuardOptions {
  /** Custom message to show (not currently used, but available for future enhancement) */
  message?: string;
  /** Which mode to open the auth modal in */
  mode?: 'login' | 'signup';
}

export interface AuthGuardResult {
  /** Whether the user is authenticated (not anonymous) */
  isAuthenticated: boolean;
  /** Whether the user is in an anonymous session */
  isAnonymous: boolean;
  /**
   * Guard function - call before protected actions.
   * Returns true if action should proceed, false if blocked (modal shown).
   */
  guardAction: (options?: AuthGuardOptions) => boolean;
  /**
   * Wrapper for async handlers - shows auth modal if not authenticated.
   * Use this to wrap onClick handlers for protected buttons.
   */
  withAuthGuard: <T extends (...args: any[]) => any>(
    handler: T,
    options?: AuthGuardOptions
  ) => (...args: Parameters<T>) => ReturnType<T> | undefined;
  /**
   * Show the auth modal directly
   */
  showAuthModal: () => void;
}

/**
 * Hook for guarding actions that require authentication.
 *
 * Usage:
 * ```tsx
 * const { guardAction, isAuthenticated } = useAuthGuard();
 *
 * const handleAdd = () => {
 *   if (!guardAction()) return; // Shows auth modal if not authenticated
 *   // ... proceed with action
 * };
 *
 * // Or use withAuthGuard wrapper:
 * const handleAdd = withAuthGuard(() => {
 *   // ... this only runs if authenticated
 * });
 * ```
 */
export function useAuthGuard(): AuthGuardResult {
  const {
    isAuthenticated,
    isAnonymous,
    setShowAuthModal,
    setAuthModalMode
  } = useAuth();

  const guardAction = useCallback((options?: AuthGuardOptions): boolean => {
    if (isAuthenticated) {
      return true;
    }

    // User is not authenticated - show auth modal
    setAuthModalMode(options?.mode || 'signup');
    setShowAuthModal(true);
    return false;
  }, [isAuthenticated, setShowAuthModal, setAuthModalMode]);

  const withAuthGuard = useCallback(<T extends (...args: any[]) => any>(
    handler: T,
    options?: AuthGuardOptions
  ) => {
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      if (!guardAction(options)) {
        return undefined;
      }
      return handler(...args);
    };
  }, [guardAction]);

  const showAuthModal = useCallback(() => {
    setAuthModalMode('signup');
    setShowAuthModal(true);
  }, [setShowAuthModal, setAuthModalMode]);

  return {
    isAuthenticated,
    isAnonymous,
    guardAction,
    withAuthGuard,
    showAuthModal,
  };
}

export default useAuthGuard;
