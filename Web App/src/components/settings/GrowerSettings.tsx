// ============================================================================
// GROWER SETTINGS - Settings for authenticated non-admin users
// Profile, Preferences, Notifications, Library Suggestions, Data Management
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useData, useTheme, ThemeSelector } from '../../store';
import { useAuth } from '../../lib/AuthContext';
import { SettingsSection } from './common/SettingsSection';
import { notificationService } from '../../store/NotificationService';
import type { AppSettings, ExperienceLevel, NotificationCategory } from '../../store/types';

type GrowerTab = 'profile' | 'preferences' | 'notifications' | 'library' | 'data';

const Icons = {
  User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Book: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Database: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
};

const tabConfig: { id: GrowerTab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <Icons.User /> },
  { id: 'preferences', label: 'Preferences', icon: <Icons.Settings /> },
  { id: 'notifications', label: 'Notifications', icon: <Icons.Bell /> },
  { id: 'library', label: 'Library', icon: <Icons.Book /> },
  { id: 'data', label: 'My Data', icon: <Icons.Database /> },
];

const experienceLevelConfig: { value: ExperienceLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'New to cultivation - show guidance and simplified options' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience - balanced feature set' },
  { value: 'advanced', label: 'Advanced', description: 'Experienced grower - show advanced options' },
  { value: 'expert', label: 'Expert', description: 'Power user - full customization and all features' },
];

export const GrowerSettings: React.FC = () => {
  const { state, updateSettings, isConnected } = useData();
  const { profile, user, signOut, updatePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<GrowerTab>('profile');
  const [localSettings, setLocalSettings] = useState<AppSettings>(state.settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setLocalSettings(state.settings);
  }, [state.settings]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateSettings(localSettings);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }
    setSaving(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password updated successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setSaving(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <SettingsSection
        title="Account Information"
        description="Your account details"
        icon="👤"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Display Name</label>
            <input
              type="text"
              value={profile?.display_name || ''}
              disabled
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-400 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-500 mt-1">Contact an admin to change your display name</p>
          </div>
          {profile?.subscription_tier && (
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium capitalize">{profile.subscription_tier} Plan</p>
                  <p className="text-xs text-zinc-500 mt-0.5 capitalize">Status: {profile.subscription_status}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  profile.subscription_status === 'active'
                    ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-700'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  {profile.subscription_status}
                </span>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Change Password"
        description="Update your account password"
        icon="🔐"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={saving || !newPassword}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Sign Out"
        description="End your current session"
        icon="🚪"
      >
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30"
        >
          Sign Out
        </button>
      </SettingsSection>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      {/* Theme */}
      <SettingsSection
        title="Appearance"
        description="Choose your preferred visual theme"
        icon="🎨"
      >
        <ThemeSelector />
      </SettingsSection>

      {/* Experience Level */}
      <SettingsSection
        title="Experience Level"
        description="Adjust the complexity of the interface to match your skill level"
        icon="📊"
      >
        <div className="space-y-3">
          {experienceLevelConfig.map(level => (
            <button
              key={level.value}
              onClick={() => setLocalSettings(prev => ({ ...prev, experienceLevel: level.value }))}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${
                localSettings.experienceLevel === level.value
                  ? 'bg-emerald-950/30 border-emerald-700 text-white'
                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{level.label}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">{level.description}</p>
                </div>
                {localSettings.experienceLevel === level.value && (
                  <span className="text-emerald-400"><Icons.CheckCircle /></span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Advanced Mode Override */}
        <div className="mt-4 pt-4 border-t border-zinc-700">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              onClick={() => setLocalSettings(prev => ({ ...prev, advancedMode: !prev.advancedMode }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.advancedMode ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localSettings.advancedMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <div>
              <p className="text-sm font-medium text-white">Advanced Mode</p>
              <p className="text-xs text-zinc-500">Override experience level to show all options</p>
            </div>
          </label>
        </div>
      </SettingsSection>

      {/* General Settings */}
      <SettingsSection
        title="General Settings"
        description="Measurement units, currency, and location"
        icon="⚙️"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Units</label>
            <select
              value={localSettings.defaultUnits}
              onChange={e => setLocalSettings(prev => ({ ...prev, defaultUnits: e.target.value as 'metric' | 'imperial' }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white"
            >
              <option value="metric">Metric (°C, g, ml)</option>
              <option value="imperial">Imperial (°F, oz, fl oz)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Currency</label>
            <select
              value={localSettings.defaultCurrency}
              onChange={e => setLocalSettings(prev => ({ ...prev, defaultCurrency: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Timezone</label>
            <select
              value={localSettings.timezone}
              onChange={e => setLocalSettings(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white"
            >
              <option value="America/New_York">Eastern (New York)</option>
              <option value="America/Chicago">Central (Chicago)</option>
              <option value="America/Denver">Mountain (Denver)</option>
              <option value="America/Los_Angeles">Pacific (Los Angeles)</option>
              <option value="Europe/London">GMT (London)</option>
              <option value="Europe/Paris">CET (Paris)</option>
              <option value="Asia/Tokyo">JST (Tokyo)</option>
              <option value="Australia/Sydney">AEST (Sydney)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Altitude (ft)</label>
            <input
              type="number"
              value={localSettings.altitude}
              onChange={e => setLocalSettings(prev => ({ ...prev, altitude: parseInt(e.target.value) || 0 }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white"
              placeholder="0"
            />
            <p className="text-xs text-zinc-500 mt-1">Used for pressure cooking calculations</p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="mt-6 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white rounded-lg font-medium"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </SettingsSection>

      {/* UI Preferences */}
      <SettingsSection
        title="Interface Options"
        description="Control tooltips and guided workflows"
        icon="✨"
      >
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div>
              <p className="text-sm font-medium text-white">Show Tooltips</p>
              <p className="text-xs text-zinc-500">Display helpful hints on hover</p>
            </div>
            <button
              onClick={() => setLocalSettings(prev => ({ ...prev, showTooltips: !prev.showTooltips }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.showTooltips !== false ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localSettings.showTooltips !== false ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div>
              <p className="text-sm font-medium text-white">Guided Workflows</p>
              <p className="text-xs text-zinc-500">Step-by-step wizards for complex tasks</p>
            </div>
            <button
              onClick={() => setLocalSettings(prev => ({ ...prev, showGuidedWorkflows: !prev.showGuidedWorkflows }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.showGuidedWorkflows !== false ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localSettings.showGuidedWorkflows !== false ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </label>
        </div>
      </SettingsSection>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <SettingsSection
        title="In-App Notifications"
        description="Control which events trigger notifications"
        icon="🔔"
      >
        <div className="space-y-4">
          {[
            { key: 'enabled', label: 'Enable Notifications', desc: 'Master toggle for all notifications' },
            { key: 'harvestReminders', label: 'Harvest Reminders', desc: 'When grows are ready to harvest' },
            { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'When inventory falls below reorder point' },
            { key: 'contaminationAlerts', label: 'Contamination Alerts', desc: 'When contamination is detected' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
              <button
                onClick={() => setLocalSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, [item.key]: !prev.notifications[item.key as keyof typeof prev.notifications] }
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.notifications[item.key as keyof typeof localSettings.notifications] ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.notifications[item.key as keyof typeof localSettings.notifications] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </label>
          ))}
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="mt-6 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white rounded-lg font-medium"
        >
          {saving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </SettingsSection>

      {/* Email/SMS settings - shown based on experience level or advanced mode */}
      {(localSettings.experienceLevel === 'advanced' || localSettings.experienceLevel === 'expert' || localSettings.advancedMode) && (
        <SettingsSection
          title="Email & SMS Notifications"
          description="Receive alerts via email or text message"
          icon="📧"
        >
          <p className="text-sm text-zinc-400 mb-4">
            Configure external notification channels for important alerts.
          </p>
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <p className="text-sm text-zinc-400">
              Email and SMS notification settings are available here. Enable email or SMS notifications,
              set up verification, and configure which events trigger external notifications.
            </p>
          </div>
        </SettingsSection>
      )}
    </div>
  );

  const renderLibraryTab = () => (
    <div className="space-y-6">
      <SettingsSection
        title="Global Library Access"
        description="Browse the community-maintained species and strain database"
        icon="📚"
      >
        <p className="text-sm text-zinc-400 mb-4">
          You have read access to all global library entries (species, strains, substrates, etc.).
          These are maintained by administrators but you can suggest additions or corrections.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Species', count: state.species?.length || 0 },
            { label: 'Strains', count: state.strains?.length || 0 },
            { label: 'Containers', count: state.containers?.length || 0 },
            { label: 'Substrates', count: state.substrateTypes?.length || 0 },
          ].map(item => (
            <div key={item.label} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700 text-center">
              <p className="text-2xl font-bold text-emerald-400">{item.count}</p>
              <p className="text-xs text-zinc-500">{item.label}</p>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Suggest Library Entry"
        description="Propose new species, strains, or other library additions"
        icon="💡"
      >
        <p className="text-sm text-zinc-400 mb-4">
          Help improve the community library by suggesting new entries or corrections.
          Administrators will review your suggestions.
        </p>
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium">
          Submit Suggestion
        </button>
      </SettingsSection>

      <SettingsSection
        title="My Suggestions"
        description="Track the status of your library contributions"
        icon="📝"
      >
        <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 text-center">
          <p className="text-zinc-500">No suggestions submitted yet</p>
          <p className="text-xs text-zinc-600 mt-1">Your suggestions will appear here</p>
        </div>
      </SettingsSection>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <SettingsSection
        title="Data Summary"
        description="Overview of your cultivation data"
        icon="📊"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Cultures', count: state.cultures?.length || 0 },
            { label: 'Grows', count: state.grows?.length || 0 },
            { label: 'Recipes', count: state.recipes?.length || 0 },
            { label: 'Inventory Items', count: state.inventoryItems?.length || 0 },
          ].map(item => (
            <div key={item.label} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700 text-center">
              <p className="text-2xl font-bold text-emerald-400">{item.count}</p>
              <p className="text-xs text-zinc-500">{item.label}</p>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Export Data"
        description="Download your cultivation data"
        icon="📥"
      >
        <p className="text-sm text-zinc-400 mb-4">
          Export all your data for backup or analysis. Data is exported in JSON format.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 flex items-center gap-2">
            <Icons.Download /> Export All Data (JSON)
          </button>
          <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 flex items-center gap-2">
            <Icons.Download /> Export Grows (CSV)
          </button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Import Data"
        description="Import data from a previous export"
        icon="📤"
      >
        <p className="text-sm text-zinc-400 mb-4">
          Import data from a JSON export file. This will merge with your existing data.
        </p>
        <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700">
          Import JSON File
        </button>
      </SettingsSection>

      {isConnected && (
        <SettingsSection
          title="Sync Status"
          description="Cloud synchronization status"
          icon="☁️"
        >
          <div className="flex items-center gap-3 p-3 bg-emerald-950/30 rounded-lg border border-emerald-700">
            <span className="text-emerald-400"><Icons.CheckCircle /></span>
            <div>
              <p className="text-sm font-medium text-emerald-300">Connected to Cloud</p>
              <p className="text-xs text-zinc-500">Your data is synced to the cloud</p>
            </div>
          </div>
        </SettingsSection>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'preferences': return renderPreferencesTab();
      case 'notifications': return renderNotificationsTab();
      case 'library': return renderLibraryTab();
      case 'data': return renderDataTab();
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Message Toast */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-emerald-950/30 border-emerald-700 text-emerald-300'
            : 'bg-red-950/30 border-red-700 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
        {tabConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default GrowerSettings;
