// ============================================================================
// ACCOUNT MENU
// User account dropdown with auth status and actions
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  LogIn: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  ),
  LogOut: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  UserPlus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/>
      <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Cloud: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  ),
  CloudOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M18.73 18.73A8 8 0 1 1 5.27 5.27"/>
      <path d="M9.12 9.12A8 8 0 0 0 9 10"/>
      <path d="M18 10h-1.26A8 8 0 0 0 9 10"/>
      <path d="M22 16a5 5 0 0 0-5-5"/>
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

// ============================================================================
// CONFIRMATION MODAL
// ============================================================================

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmStyle?: 'danger' | 'warning';
  isLoading?: boolean;
  children?: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmStyle = 'danger',
  isLoading = false,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <Icons.X />
        </button>

        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          confirmStyle === 'danger' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          <Icons.AlertTriangle />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>

        {/* Message */}
        <p className="text-zinc-400 text-sm mb-4">{message}</p>

        {/* Additional content */}
        {children}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
              confirmStyle === 'danger'
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ACCOUNT MENU COMPONENT
// ============================================================================

// Emergency logout function - bypasses React state entirely
const forceLogout = () => {
  try {
    // Clear all storage
    localStorage.removeItem('mycolab-auth');
    localStorage.removeItem('mycolab-settings');
    localStorage.removeItem('mycolab-last-sync');
    // Clear any other mycolab keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mycolab-')) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
    // Force reload
    window.location.href = window.location.origin;
  } catch (e) {
    console.error('Force logout error:', e);
    window.location.reload();
  }
};

export const AccountMenu: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isAnonymous,
    isLoading,
    signOut,
    deleteAccount,
    setShowAuthModal,
    setAuthModalMode,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Emergency keyboard shortcut: Press Escape 3 times quickly to force logout
  useEffect(() => {
    let escapeCount = 0;
    let escapeTimer: NodeJS.Timeout | null = null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        escapeCount++;
        if (escapeTimer) clearTimeout(escapeTimer);

        if (escapeCount >= 3) {
          console.log('[MycoLab] Emergency logout triggered (Escape x3)');
          forceLogout();
        } else {
          escapeTimer = setTimeout(() => {
            escapeCount = 0;
          }, 1000);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (escapeTimer) clearTimeout(escapeTimer);
    };
  }, []);

  // Handle sign out click - show confirmation
  const handleSignOutClick = () => {
    setIsOpen(false);
    setShowLogoutModal(true);
  };

  // Confirm sign out
  const handleSignOutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      // Force page reload to ensure clean state after sign out
      window.location.reload();
    } catch (err) {
      console.error('Sign out error:', err);
      // Even if signOut throws, force logout to clear state
      forceLogout();
    }
  };

  // Handle delete account click - show confirmation
  const handleDeleteClick = () => {
    setIsOpen(false);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  // Confirm delete account
  const handleDeleteConfirm = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setIsDeleting(true);
    const { error } = await deleteAccount();
    setIsDeleting(false);

    if (error) {
      console.error('Account deletion failed:', error);
      alert('Failed to delete account: ' + error.message);
    } else {
      setShowDeleteModal(false);
    }
  };

  // Handle login click
  const handleLoginClick = () => {
    setIsOpen(false);
    setAuthModalMode('login');
    setShowAuthModal(true);
  };

  // Handle signup click
  const handleSignupClick = () => {
    setIsOpen(false);
    setAuthModalMode('signup');
    setShowAuthModal(true);
  };

  // Loading state - still allow sign out!
  if (isLoading) {
    return (
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 animate-pulse flex items-center justify-center"
          title="Account menu - click to sign out (or press Escape 3x)"
        >
          <Icons.User />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="p-4 border-b border-zinc-800">
              <p className="text-sm text-zinc-400">Loading account...</p>
              <p className="text-xs text-zinc-500 mt-1">Stuck? Use options below</p>
            </div>
            <div className="p-2">
              <button
                onClick={handleSignOutClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
              >
                <Icons.LogOut />
                <span>Sign Out</span>
              </button>
            </div>
            <div className="p-2 border-t border-zinc-800">
              <button
                onClick={forceLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Icons.Trash />
                <span>Force Logout (Clear All Data)</span>
              </button>
              <p className="text-xs text-zinc-600 mt-2 px-3">Or press Escape 3 times quickly</p>
            </div>
          </div>
        )}

        {/* Logout Confirmation Modal */}
        <ConfirmModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleSignOutConfirm}
          title="Sign Out"
          message="Sign out and clear your session? This can help fix stuck loading issues."
          confirmText="Sign Out"
          confirmStyle="warning"
          isLoading={isLoggingOut}
        />
      </div>
    );
  }

  // Not authenticated - show login button
  if (!user || (isAnonymous && !isAuthenticated)) {
    return (
      <div className="flex items-center gap-2">
        {/* Sign Up Button - Prominent */}
        <button
          onClick={handleSignupClick}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-emerald-500/20"
        >
          <Icons.UserPlus />
          <span>Sign Up</span>
        </button>
        
        {/* Login Button */}
        <button
          onClick={handleLoginClick}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors border border-zinc-700"
        >
          <Icons.LogIn />
          <span>Login</span>
        </button>
      </div>
    );
  }

  // Anonymous user - show upgrade prompt
  if (isAnonymous) {
    return (
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700"
        >
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Icons.CloudOff />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-white">Guest Mode</p>
            <p className="text-xs text-amber-400">Data not synced</p>
          </div>
          <Icons.ChevronDown />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
            {/* Status */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Icons.CloudOff />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Guest Mode</p>
                  <p className="text-xs text-zinc-400">Data stored locally only</p>
                </div>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="p-4 bg-gradient-to-r from-emerald-950/50 to-teal-950/50">
              <p className="text-sm text-zinc-300 mb-3">
                Create an account to sync your data across devices and keep it safe in the cloud.
              </p>
              <button
                onClick={handleSignupClick}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Icons.Cloud />
                <span>Create Account</span>
              </button>
            </div>

            {/* Already have account */}
            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={handleLoginClick}
                className="w-full py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Already have an account? <span className="text-emerald-400">Sign in</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Authenticated user - show account menu
  const userEmail = user.email || 'User';
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium text-sm">
          {userInitial}
        </div>
        <div className="hidden sm:block text-left max-w-[140px]">
          <p className="text-sm font-medium text-white truncate">{userEmail}</p>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Synced
          </p>
        </div>
        <Icons.ChevronDown />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* User Info */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-lg">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userEmail}</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <Icons.Cloud />
                  <span>Data synced to cloud</span>
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to settings/account - could add this
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Icons.Shield />
              <span>Account Security</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="p-2 border-t border-zinc-800">
            <button
              onClick={handleSignOutClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
            >
              <Icons.LogOut />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Delete Account */}
          <div className="p-2 border-t border-zinc-800">
            <button
              onClick={handleDeleteClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Icons.Trash />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleSignOutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out? Your data will remain synced to the cloud and available when you sign back in."
        confirmText="Sign Out"
        confirmStyle="warning"
        isLoading={isLoggingOut}
      />

      {/* Delete Account Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Account"
        message="This action is permanent and cannot be undone. All your data including cultures, grows, recipes, and settings will be permanently deleted."
        confirmText="Delete Account"
        confirmStyle="danger"
        isLoading={isDeleting}
      >
        <div className="mt-4">
          <label className="block text-sm text-zinc-300 mb-2">
            Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm:
          </label>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            autoComplete="off"
          />
        </div>
      </ConfirmModal>
    </div>
  );
};

export default AccountMenu;
