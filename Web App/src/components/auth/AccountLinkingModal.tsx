// ============================================================================
// ACCOUNT LINKING MODAL
// UI for detecting and linking accounts with the same email from different providers
// ============================================================================

import React, { useState } from 'react';
import { EmailAccountInfo, migrateUserData, linkGoogleIdentity } from '../../lib/supabase';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Link: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
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
  Google: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Database: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
};

// ============================================================================
// TYPES
// ============================================================================

export interface AccountLinkingState {
  show: boolean;
  email: string;
  existingAccount: EmailAccountInfo | null;
  currentProvider: 'email' | 'google';
  currentUserId: string | null;
}

interface AccountLinkingModalProps {
  state: AccountLinkingState;
  onClose: () => void;
  onLinkAccounts: () => Promise<void>;
  onKeepSeparate: () => void;
  onSignInWithExisting: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AccountLinkingModal: React.FC<AccountLinkingModalProps> = ({
  state,
  onClose,
  onLinkAccounts,
  onKeepSeparate,
  onSignInWithExisting,
}) => {
  const [isLinking, setIsLinking] = useState(false);
  const [linkResult, setLinkResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!state.show || !state.existingAccount) return null;

  const { email, existingAccount, currentProvider } = state;
  const existingProvider = existingAccount.has_google ? 'Google' : 'email/password';
  const currentProviderName = currentProvider === 'google' ? 'Google' : 'email/password';

  const handleLinkAccounts = async () => {
    setIsLinking(true);
    setLinkResult(null);

    try {
      await onLinkAccounts();
      setLinkResult({
        success: true,
        message: 'Accounts linked successfully! Your data has been merged.',
      });
    } catch (err) {
      setLinkResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to link accounts',
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden safe-area-bottom">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-amber-950/50 to-orange-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Icons.Link />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Existing Account Found
                </h2>
                <p className="text-sm text-zinc-400">
                  {email}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center"
            >
              <Icons.X />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Explanation */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="text-amber-400 mt-0.5">
                <Icons.AlertTriangle />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-400">
                  This email is already registered
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  An account with <strong className="text-white">{email}</strong> already exists
                  using <strong className="text-white">{existingProvider}</strong> sign-in.
                  You're currently trying to sign in with <strong className="text-white">{currentProviderName}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Link Result */}
          {linkResult && (
            <div className={`p-4 rounded-xl border ${
              linkResult.success
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="flex items-start gap-3">
                <div className={linkResult.success ? 'text-emerald-400' : 'text-red-400'}>
                  {linkResult.success ? <Icons.CheckCircle /> : <Icons.AlertTriangle />}
                </div>
                <p className={`text-sm ${linkResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {linkResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Options */}
          {!linkResult?.success && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-zinc-300">What would you like to do?</p>

              {/* Option 1: Sign in with existing method */}
              <button
                onClick={onSignInWithExisting}
                className="w-full p-4 min-h-[72px] bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 min-w-[44px] rounded-lg bg-zinc-700 flex items-center justify-center group-hover:bg-zinc-600 transition-colors">
                    {existingAccount.has_google ? <Icons.Google /> : <Icons.Mail />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      Sign in with {existingProvider} instead
                    </p>
                    <p className="text-xs text-zinc-500">
                      Use your existing sign-in method to access your data
                    </p>
                  </div>
                  <Icons.ArrowRight />
                </div>
              </button>

              {/* Option 2: Link accounts */}
              <button
                onClick={handleLinkAccounts}
                disabled={isLinking}
                className="w-full p-4 min-h-[72px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 min-w-[44px] rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                    {isLinking ? <Icons.Loader /> : <Icons.Link />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-400">
                      {isLinking ? 'Linking accounts...' : 'Link both sign-in methods'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Merge your data and use either method to sign in
                    </p>
                  </div>
                  {!isLinking && <Icons.ArrowRight />}
                </div>
              </button>

              {/* Option 3: Keep separate (not recommended) */}
              <button
                onClick={onKeepSeparate}
                className="w-full p-4 min-h-[72px] bg-zinc-900 hover:bg-zinc-800/50 border border-zinc-800 rounded-xl transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 min-w-[44px] rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                    <Icons.Database />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-400">
                      Keep as separate accounts
                    </p>
                    <p className="text-xs text-zinc-600">
                      Not recommended - your data will remain split
                    </p>
                  </div>
                  <Icons.ArrowRight />
                </div>
              </button>
            </div>
          )}

          {/* Success actions */}
          {linkResult?.success && (
            <button
              onClick={onClose}
              className="w-full py-3.5 min-h-[48px] px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>Continue to Sporely</span>
              <Icons.ArrowRight />
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 pb-6">
          <p className="text-xs text-zinc-600 text-center">
            Linking accounts will merge all your cultures, grows, and settings into a single account.
            You'll be able to sign in using either method.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountLinkingModal;
