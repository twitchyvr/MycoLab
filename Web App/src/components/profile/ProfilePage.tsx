// ============================================================================
// PROFILE PAGE
// User profile management - personal info, password, account details
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

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
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  CreditCard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
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
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  Monitor: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
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
// TYPES
// ============================================================================

interface ProfileFormData {
  displayName: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// SECTION CARD COMPONENT
// ============================================================================

interface SectionCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, description, icon, children, className = '' }) => (
  <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl ${className}`}>
    <div className="p-5 border-b border-zinc-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          {description && <p className="text-sm text-zinc-500">{description}</p>}
        </div>
      </div>
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
);

// ============================================================================
// DELETE ACCOUNT MODAL
// ============================================================================

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const DeleteAccountModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!isOpen) setConfirmText('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <Icons.X />
        </button>

        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
          <Icons.AlertTriangle />
        </div>

        <h3 className="text-lg font-semibold text-white mb-2">Delete Account</h3>
        <p className="text-zinc-400 text-sm mb-4">
          This action is permanent and cannot be undone. All your data including cultures, grows, recipes, and settings will be permanently deleted.
        </p>

        <div className="mb-4">
          <label className="block text-sm text-zinc-300 mb-2">
            Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            autoComplete="off"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || confirmText !== 'DELETE'}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PROFILE PAGE COMPONENT
// ============================================================================

export const ProfilePage: React.FC = () => {
  const { user, profile, isAuthenticated, isAnonymous, updatePassword, deleteAccount } = useAuth();

  // Profile form state
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    displayName: profile?.display_name || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setProfileForm({
        displayName: profile.display_name || '',
      });
    }
  }, [profile]);

  // Clear success messages after delay
  useEffect(() => {
    if (profileSuccess) {
      const timer = setTimeout(() => setProfileSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccess]);

  useEffect(() => {
    if (passwordSuccess) {
      const timer = setTimeout(() => setPasswordSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordSuccess]);

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;

    setProfileSaving(true);
    setProfileError(null);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: profileForm.displayName || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        setProfileError(error.message);
      } else {
        setProfileSuccess(true);
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Validate password strength
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setPasswordSaving(true);

    const { error } = await updatePassword(passwordForm.newPassword);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }

    setPasswordSaving(false);
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const { error } = await deleteAccount();
    setIsDeleting(false);

    if (error) {
      alert('Failed to delete account: ' + error.message);
    } else {
      setShowDeleteModal(false);
    }
  };

  // Not authenticated
  if (!isAuthenticated || isAnonymous) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
            <Icons.User />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Sign in to manage your profile</h2>
          <p className="text-zinc-400 mb-6">Create an account or sign in to access profile settings.</p>
        </div>
      </div>
    );
  }

  const userEmail = user?.email || 'Unknown';
  const userInitial = userEmail.charAt(0).toUpperCase();
  const memberSince = user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'Unknown';
  const subscriptionTier = profile?.subscription_tier || 'free';
  const lastSignIn = user?.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy h:mm a') : 'Unknown';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-emerald-500/20">
          {userInitial}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {profile?.display_name || userEmail}
          </h1>
          <p className="text-zinc-400">{userEmail}</p>
          <p className="text-sm text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Account verified
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <SectionCard
        title="Personal Information"
        description="Update your display name and profile details"
        icon={<Icons.User />}
      >
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={profileForm.displayName}
              onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
              placeholder="Enter your display name"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="text-xs text-zinc-500 mt-1">
              This name will be shown in the app instead of your email
            </p>
          </div>

          {profileError && (
            <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-400 text-sm">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
              <Icons.Check />
              Profile updated successfully
            </div>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {profileSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </SectionCard>

      {/* Email */}
      <SectionCard
        title="Email Address"
        description="Your email is used for signing in and notifications"
        icon={<Icons.Mail />}
      >
        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
          <div>
            <p className="text-white font-medium">{userEmail}</p>
            <p className="text-sm text-emerald-400 flex items-center gap-1 mt-1">
              <Icons.Check />
              Verified
            </p>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-3">
          Contact support if you need to change your email address
        </p>
      </SectionCard>

      {/* Password */}
      <SectionCard
        title="Password"
        description="Update your password to keep your account secure"
        icon={<Icons.Lock />}
      >
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showNewPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {passwordError && (
            <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-400 text-sm">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
              <Icons.Check />
              Password updated successfully
            </div>
          )}

          <button
            type="submit"
            disabled={passwordSaving || !passwordForm.newPassword || !passwordForm.confirmPassword}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </SectionCard>

      {/* Account Details */}
      <SectionCard
        title="Account Details"
        description="Your account information and subscription status"
        icon={<Icons.CreditCard />}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Icons.Calendar />
                <span className="text-sm">Member Since</span>
              </div>
              <p className="text-white font-medium">{memberSince}</p>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Icons.Shield />
                <span className="text-sm">Plan</span>
              </div>
              <p className="text-white font-medium capitalize">{subscriptionTier}</p>
            </div>
          </div>
          <div className="p-4 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Icons.Monitor />
              <span className="text-sm">Last Sign In</span>
            </div>
            <p className="text-white font-medium">{lastSignIn}</p>
          </div>
        </div>
      </SectionCard>

      {/* Danger Zone */}
      <SectionCard
        title="Danger Zone"
        description="Irreversible account actions"
        icon={<Icons.AlertTriangle />}
        className="border-red-900/50"
      >
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-white font-medium">Delete Account</h4>
              <p className="text-sm text-zinc-400 mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <Icons.Trash />
              Delete
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProfilePage;
