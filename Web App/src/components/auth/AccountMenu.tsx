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
};

// ============================================================================
// ACCOUNT MENU COMPONENT
// ============================================================================

export const AccountMenu: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isAnonymous,
    isLoading,
    signOut,
    setShowAuthModal,
    setAuthModalMode,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
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

  // Handle sign out
  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
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

  // Loading state
  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
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
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Icons.LogOut />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
