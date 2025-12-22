// ============================================================================
// AUTH MODAL
// Login, Signup, and Password Reset Modal Component
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, SignUpResult } from '../../lib/AuthContext';
import { isSupabaseConfigured, checkEmailAccount } from '../../lib/supabase';
import { TurnstileCaptcha } from './TurnstileCaptcha';
import { AccountLinkingModal } from './AccountLinkingModal';
import { EmailToGoogleLinkingModal, EmailToGoogleLinkingState } from './EmailToGoogleLinkingModal';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  Loader: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 animate-spin">
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Sparkles: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
      <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z"/>
      <path d="M19 12l1 2 1-2 2-1-2-1-1-2-1 2-2 1 2 1z"/>
    </svg>
  ),
  Inbox: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Google: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
};

// ============================================================================
// AUTH MODAL COMPONENT
// ============================================================================

// Timeout duration for auth operations (30 seconds)
const AUTH_TIMEOUT_MS = 30000;

// Helper to wrap a promise with a timeout
const withTimeout = <T,>(promise: Promise<T>, ms: number, timeoutError: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutError)), ms)
    )
  ]);
};

export const AuthModal: React.FC = () => {
  const {
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    setAuthModalMode,
    signIn,
    signUp,
    signInWithMagicLink,
    signInWithGoogle,
    resetPassword,
    upgradeAnonymousAccount,
    isAnonymous,
    isAuthenticated,
    user,
    accountLinkingState,
    handleLinkAccounts,
    handleKeepSeparate,
    closeAccountLinking,
  } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Captcha state
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const captchaKeyRef = useRef(0);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Signup completion state (for showing dedicated success view)
  const [signupComplete, setSignupComplete] = useState<{
    email: string;
    needsEmailConfirmation: boolean;
    dataPreserved: boolean;
  } | null>(null);

  // State for showing account linking from email signup flow
  const [showEmailAccountLinking, setShowEmailAccountLinking] = useState<EmailToGoogleLinkingState | null>(null);

  // Track if we're in the middle of an auth attempt
  const authInProgressRef = useRef(false);

  // Captcha handlers
  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
    setCaptchaError(false);
  }, []);

  const handleCaptchaError = useCallback(() => {
    setCaptchaToken(null);
    setCaptchaError(true);
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  // Reset captcha by changing key (forces remount)
  const resetCaptcha = useCallback(() => {
    captchaKeyRef.current += 1;
    setCaptchaToken(null);
    setCaptchaError(false);
  }, []);

  // Clear loading state and close modal when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && authInProgressRef.current) {
      // User just authenticated while we had an auth attempt in progress
      setIsLoading(false);
      authInProgressRef.current = false;
      // Modal will be closed by AuthContext's onAuthStateChange handler
    }
  }, [isAuthenticated]);

  // Reset loading state when modal is closed/reopened
  useEffect(() => {
    if (!showAuthModal) {
      setIsLoading(false);
      authInProgressRef.current = false;
    }
  }, [showAuthModal]);

  if (!showAuthModal) return null;

  // Reset form when mode changes
  const handleModeChange = (mode: 'login' | 'signup' | 'reset') => {
    setAuthModalMode(mode);
    setError(null);
    setSuccess(null);
    setSignupComplete(null);
    setPassword('');
    setConfirmPassword('');
    resetCaptcha();
  };

  // Helper to extract error message
  const getErrorMessage = (error: any): string => {
    if (!error) return 'An unknown error occurred';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error_description) return error.error_description;
    if (error.msg) return error.msg;
    // Try to stringify if it's an object
    try {
      const str = JSON.stringify(error);
      if (str !== '{}') return str;
    } catch {}
    return 'An error occurred. Please try again.';
  };

  // Check if error is likely captcha-related (for showing config hint)
  const isCaptchaConfigError = (errorMsg: string | null): boolean => {
    if (!errorMsg) return false;
    const lowerMsg = errorMsg.toLowerCase();
    return lowerMsg.includes('captcha') ||
           lowerMsg.includes('authentication failed') ||
           (lowerMsg.includes('400') && !lowerMsg.includes('invalid'));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Check for captcha token
    if (!captchaToken) {
      setError('Please complete the captcha verification');
      return;
    }

    setIsLoading(true);
    authInProgressRef.current = true;

    try {
      if (authModalMode === 'login') {
        const { error } = await withTimeout(
          signIn(email, password, captchaToken),
          AUTH_TIMEOUT_MS,
          'Sign in timed out. Please check your connection and try again.'
        );
        if (error) {
          setError(getErrorMessage(error));
          resetCaptcha(); // Reset captcha on error
        }
      } else if (authModalMode === 'signup') {
        // Validate passwords match
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          authInProgressRef.current = false;
          return;
        }

        // Validate password strength
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsLoading(false);
          authInProgressRef.current = false;
          return;
        }

        // Check if email already exists with a different provider (e.g., Google)
        const existingAccount = await checkEmailAccount(email);
        if (existingAccount?.exists_in_system && existingAccount.has_google && !existingAccount.has_password) {
          // There's an existing Google account - show linking option
          console.log('[Auth] Email has existing Google account, showing linking modal');
          setShowEmailAccountLinking({
            show: true,
            email,
          });
          setIsLoading(false);
          authInProgressRef.current = false;
          return;
        }

        let signupResult: SignUpResult;
        let dataPreserved = false;

        // If user is anonymous, try to upgrade their account
        if (isAnonymous) {
          const upgradeResult = await withTimeout(
            upgradeAnonymousAccount(email, password, captchaToken),
            AUTH_TIMEOUT_MS,
            'Account upgrade timed out. Please try again.'
          );

          if (upgradeResult.error) {
            // If upgrade fails, try regular signup as fallback
            // Note: This won't preserve the anonymous user's data
            console.log('Upgrade failed, trying regular signup. Error:', upgradeResult.error);

            signupResult = await withTimeout(
              signUp(email, password, captchaToken),
              AUTH_TIMEOUT_MS,
              'Sign up timed out. Please try again.'
            );
            dataPreserved = false;
          } else {
            signupResult = upgradeResult;
            dataPreserved = true;
          }
        } else {
          signupResult = await withTimeout(
            signUp(email, password, captchaToken),
            AUTH_TIMEOUT_MS,
            'Sign up timed out. Please try again.'
          );
          dataPreserved = false;
        }

        // Handle the result
        if (signupResult.error) {
          // Check for common issues
          const msg = getErrorMessage(signupResult.error);
          if (msg.includes('already registered') || msg.includes('email_exists')) {
            setError('This email is already registered. Try signing in instead.');
          } else if (msg.includes('rate limit')) {
            setError('Too many attempts. Please wait a few minutes and try again.');
          } else {
            setError(msg || 'Failed to create account. Please check your Supabase configuration.');
          }
          resetCaptcha(); // Reset captcha on error
        } else if (!signupResult.user) {
          // No error but also no user - something went wrong silently
          setError('Account creation failed. Please try again or contact support if the problem persists.');
          resetCaptcha();
        } else {
          // Success! Show the success screen
          setSignupComplete({
            email,
            needsEmailConfirmation: signupResult.needsEmailConfirmation,
            dataPreserved,
          });
          setError(null);
        }
      } else if (authModalMode === 'reset') {
        const { error } = await withTimeout(
          resetPassword(email, captchaToken),
          AUTH_TIMEOUT_MS,
          'Password reset request timed out. Please try again.'
        );
        if (error) {
          setError(getErrorMessage(error));
          resetCaptcha(); // Reset captcha on error
        } else {
          setSuccess('Password reset email sent! Check your inbox.');
        }
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
      resetCaptcha(); // Reset captcha on error
    } finally {
      setIsLoading(false);
      authInProgressRef.current = false;
    }
  };

  // Handle magic link sign in
  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Check for captcha token
    if (!captchaToken) {
      setError('Please complete the captcha verification');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);
    authInProgressRef.current = true;

    try {
      const { error } = await withTimeout(
        signInWithMagicLink(email, captchaToken),
        AUTH_TIMEOUT_MS,
        'Magic link request timed out. Please try again.'
      );
      if (error) {
        setError(error.message);
        resetCaptcha(); // Reset captcha on error
      } else {
        setSuccess('Magic link sent! Check your email to sign in.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      resetCaptcha(); // Reset captcha on error
    } finally {
      setIsLoading(false);
      authInProgressRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70"
        onClick={() => setShowAuthModal(false)}
      />

      {/* Modal - slides up from bottom on mobile, centered on desktop */}
      <div className="relative w-full sm:max-w-md bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto safe-area-bottom">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-emerald-950/50 to-teal-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-xl">🍄</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {authModalMode === 'login' && 'Welcome Back'}
                  {authModalMode === 'signup' && (isAnonymous ? 'Create Your Account' : 'Sign Up')}
                  {authModalMode === 'reset' && 'Reset Password'}
                </h2>
                <p className="text-sm text-zinc-400">
                  {authModalMode === 'login' && 'Sign in to your MycoLab account'}
                  {authModalMode === 'signup' && (isAnonymous ? 'Save your data to the cloud' : 'Start tracking your grows')}
                  {authModalMode === 'reset' && 'We\'ll send you a reset link'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAuthModal(false)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Icons.X />
            </button>
          </div>
        </div>

        {/* Configuration warning - show when Supabase is not configured */}
        {!isSupabaseConfigured && (
          <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="text-red-400 mt-0.5">
                <Icons.AlertCircle />
              </div>
              <div>
                <p className="text-sm font-medium text-red-400">Cloud services not available</p>
                <p className="text-sm text-zinc-400 mt-1">
                  Authentication requires server configuration. The app is currently running in offline mode.
                  {' '}If you're the site administrator, check that environment variables are set correctly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Anonymous upgrade notice */}
        {authModalMode === 'signup' && isAnonymous && isSupabaseConfigured && !signupComplete && (
          <div className="mx-6 mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="text-emerald-400 mt-0.5">
                <Icons.Sparkles />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-400">Your data is safe!</p>
                <p className="text-sm text-zinc-400 mt-1">
                  Creating an account will preserve all your existing data, cultures, and grows.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Screen - shown after successful signup */}
        {signupComplete && (
          <div className="p-6 space-y-6">
            {/* Success Header */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <div className="text-emerald-400">
                  <Icons.CheckCircle />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Account Created Successfully!
              </h3>
              <p className="text-zinc-400">
                Your MycoLab account has been set up for <span className="text-emerald-400 font-medium">{signupComplete.email}</span>
              </p>
            </div>

            {/* Email Confirmation Notice */}
            {signupComplete.needsEmailConfirmation && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="text-amber-400 mt-0.5">
                    <Icons.Inbox />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-400">Check your inbox</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      We've sent a confirmation email to <strong>{signupComplete.email}</strong>.
                      Click the link in the email to verify your account and complete setup.
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                      Didn't receive the email? Check your spam folder, or{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setSignupComplete(null);
                          setAuthModalMode('login');
                        }}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        try signing in
                      </button>{' '}
                      to resend it.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Data Preserved Notice */}
            {signupComplete.dataPreserved && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="text-emerald-400 mt-0.5">
                    <Icons.Check />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-400">Your data has been preserved</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      All your existing cultures, grows, and settings have been linked to your new account.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-300">Next steps:</p>
              <ol className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-medium">1.</span>
                  {signupComplete.needsEmailConfirmation
                    ? 'Open your email and click the confirmation link'
                    : 'Your email is confirmed - you\'re ready to go!'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-medium">2.</span>
                  {signupComplete.needsEmailConfirmation
                    ? 'Return to MycoLab and sign in with your credentials'
                    : 'Your account is now active and syncing'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-medium">3.</span>
                  Start tracking your grows!
                </li>
              </ol>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {signupComplete.needsEmailConfirmation ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSignupComplete(null);
                      setAuthModalMode('login');
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <span>Go to Sign In</span>
                    <Icons.ArrowRight />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors border border-zinc-700"
                  >
                    I'll confirm later
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <span>Continue to MycoLab</span>
                  <Icons.ArrowRight />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form - hidden when signup is complete */}
        {!signupComplete && (
        <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="on">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-3 text-red-400">
                <Icons.AlertCircle />
                <p className="text-sm">{error}</p>
              </div>
              {/* Show configuration hint for captcha-related errors */}
              {isCaptchaConfigError(error) && (
                <div className="text-xs text-zinc-400 pl-8">
                  <p className="font-medium text-zinc-300">If you're the site administrator:</p>
                  <p className="mt-1">Supabase captcha verification may need to be configured with test keys for non-Cloudflare deployments.</p>
                  <p className="mt-1">In Supabase Dashboard: Authentication → Captcha Protection → Use test secret key: <code className="text-emerald-400">1x0000000000000000000000000000000AA</code></p>
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-3 text-emerald-400">
                <Icons.Check />
                <p className="text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Social Login Options - Show for login and signup */}
          {authModalMode !== 'reset' && isSupabaseConfigured && (
            <>
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setIsLoading(true);
                  const { error } = await signInWithGoogle();
                  if (error) {
                    setError(error.message);
                    setIsLoading(false);
                  }
                  // If no error, user will be redirected to Google
                }}
                disabled={isLoading}
                className="w-full py-3 px-4 min-h-[48px] bg-white hover:bg-zinc-100 text-zinc-800 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-zinc-300"
              >
                <Icons.Google />
                <span>Continue with Google</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-zinc-900 text-zinc-500">or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <Icons.Mail />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email username"
                className="w-full pl-11 pr-4 py-3 min-h-[48px] bg-zinc-800 border border-zinc-700 rounded-xl text-white text-base placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          {authModalMode !== 'reset' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Icons.Lock />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={authModalMode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full pl-11 pr-12 py-3 min-h-[48px] bg-zinc-800 border border-zinc-700 rounded-xl text-white text-base placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-2 -mr-2"
                >
                  {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password Field (Signup only) */}
          {authModalMode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Icons.Lock />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirm-password"
                  name="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full pl-11 pr-4 py-3 min-h-[48px] bg-zinc-800 border border-zinc-700 rounded-xl text-white text-base placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Forgot Password Link */}
          {authModalMode === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleModeChange('reset')}
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Captcha Widget */}
          {isSupabaseConfigured && (
            <div className="py-2">
              <TurnstileCaptcha
                key={captchaKeyRef.current}
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
                onExpire={handleCaptchaExpire}
              />
              {captchaError && (
                <p className="text-sm text-red-400 text-center mt-2">
                  Captcha failed to load. Please refresh and try again.
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isSupabaseConfigured || !captchaToken}
            className="w-full py-3 px-4 min-h-[48px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {isLoading ? (
              <>
                <Icons.Loader />
                <span>Please wait...</span>
              </>
            ) : (
              <>
                {authModalMode === 'login' && 'Sign In'}
                {authModalMode === 'signup' && 'Create Account'}
                {authModalMode === 'reset' && 'Send Reset Link'}
              </>
            )}
          </button>

          {/* Magic Link Option (Login only) */}
          {authModalMode === 'login' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-zinc-900 text-zinc-500">or</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleMagicLink}
                disabled={isLoading || !isSupabaseConfigured || !captchaToken}
                className="w-full py-3 px-4 min-h-[48px] bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-zinc-700"
              >
                <Icons.Mail />
                <span>Sign in with Magic Link</span>
              </button>
            </>
          )}
        </form>
        )}

        {/* Footer - hidden when signup is complete */}
        {!signupComplete && (
        <div className="p-6 pt-0 text-center">
          {authModalMode === 'login' && (
            <p className="text-sm text-zinc-400">
              Don't have an account?{' '}
              <button
                onClick={() => handleModeChange('signup')}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Sign up
              </button>
            </p>
          )}
          {authModalMode === 'signup' && (
            <p className="text-sm text-zinc-400">
              Already have an account?{' '}
              <button
                onClick={() => handleModeChange('login')}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          )}
          {authModalMode === 'reset' && (
            <p className="text-sm text-zinc-400">
              Remember your password?{' '}
              <button
                onClick={() => handleModeChange('login')}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
        )}
      </div>

      {/* Email Account Linking Modal - shown when email signup detects existing Google account */}
      <EmailToGoogleLinkingModal
        state={showEmailAccountLinking}
        onClose={() => setShowEmailAccountLinking(null)}
        onSignInWithGoogle={async () => {
          setShowAuthModal(false);
          await signInWithGoogle();
        }}
      />

      {/* Global Account Linking Modal - shown when Google OAuth detects existing email account */}
      <AccountLinkingModal
        state={accountLinkingState}
        onClose={closeAccountLinking}
        onLinkAccounts={handleLinkAccounts}
        onKeepSeparate={handleKeepSeparate}
        onSignInWithExisting={() => {
          closeAccountLinking();
          setAuthModalMode('login');
          setShowAuthModal(true);
        }}
      />
    </div>
  );
};

export default AuthModal;
