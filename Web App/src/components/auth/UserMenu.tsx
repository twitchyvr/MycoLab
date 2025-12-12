// ============================================================================
// USER MENU
// Displays auth status in header with login/logout options
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { LoginModal } from './LoginModal';

// ============================================================================
// COMPONENT
// ============================================================================

export const UserMenu: React.FC = () => {
  const { user, isAnonymous, isAuthenticated, isLoading, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't show if Supabase is not configured
  if (!isSupabaseConfigured) {
    return null;
  }

  const handleOpenLogin = (mode: 'login' | 'signup') => {
    setLoginMode(mode);
    setShowLoginModal(true);
    setShowMenu(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setShowMenu(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
    );
  }

  // Anonymous user - show signup prompt
  if (isAnonymous) {
    return (
      <>
        <button
          onClick={() => handleOpenLogin('signup')}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 text-amber-400 rounded-lg text-sm font-medium transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="hidden sm:inline">Sign Up</span>
        </button>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          mode={loginMode}
        />
      </>
    );
  }

  // Authenticated user with email
  if (isAuthenticated && user?.email) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
            <span className="text-xs text-emerald-400 font-medium">
              {user.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="hidden sm:inline text-zinc-300 max-w-[120px] truncate">
            {user.email}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`w-4 h-4 text-zinc-400 transition-transform ${showMenu ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50">
            <div className="p-3 border-b border-zinc-800">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Signed in</p>
            </div>
            <div className="p-1">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          mode={loginMode}
        />
      </div>
    );
  }

  // Not authenticated (no Supabase connection or error)
  return (
    <>
      <button
        onClick={() => handleOpenLogin('login')}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        <span className="hidden sm:inline">Sign In</span>
      </button>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        mode={loginMode}
      />
    </>
  );
};

export default UserMenu;
