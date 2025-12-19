// ============================================================================
// ANONYMOUS SETTINGS - Minimal settings for non-authenticated users
// Only shows local-storage preferences (units, theme, currency)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useData, useTheme, ThemeSelector } from '../../store';
import { SettingsSection } from './common/SettingsSection';
import type { AppSettings } from '../../store/types';

interface AnonymousSettingsProps {
  onSignUpClick?: () => void;
}

export const AnonymousSettings: React.FC<AnonymousSettingsProps> = ({ onSignUpClick }) => {
  const { state, updateSettings } = useData();
  const [localSettings, setLocalSettings] = useState<AppSettings>(state.settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(state.settings);
  }, [state.settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sign Up Prompt */}
      <div className="bg-gradient-to-r from-emerald-950/50 to-teal-950/50 border border-emerald-800/50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-emerald-400">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-emerald-300">Create an Account</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Sign up to sync your data across devices, access the full species library,
              track your grows in the cloud, and get personalized recommendations.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={onSignUpClick}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Create Account
              </button>
              <button
                onClick={onSignUpClick}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Local Data Notice */}
      <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-amber-400 text-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium text-amber-300">Local Storage Only</p>
            <p className="text-sm text-zinc-400 mt-0.5">
              Your settings and data are stored only on this device. Create an account to sync across devices.
            </p>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <SettingsSection
        title="Appearance"
        description="Choose your preferred visual theme"
        icon="🎨"
      >
        <ThemeSelector />
      </SettingsSection>

      {/* Basic Preferences */}
      <SettingsSection
        title="Quick Settings"
        description="Basic preferences for calculations and display"
        icon="⚙️"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Measurement Units</label>
            <select
              value={localSettings.defaultUnits}
              onChange={e => setLocalSettings(prev => ({ ...prev, defaultUnits: e.target.value as 'metric' | 'imperial' }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white"
            >
              <option value="metric">Metric (°C, grams, ml)</option>
              <option value="imperial">Imperial (°F, oz, fl oz)</option>
            </select>
            <p className="text-xs text-zinc-500 mt-1.5">
              Affects temperature, weight, and volume displays
            </p>
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
            <p className="text-xs text-zinc-500 mt-1.5">
              For cost tracking and inventory values
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-6 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </SettingsSection>

      {/* Library Info */}
      <SettingsSection
        title="Species Library"
        description="Browse the cultivation knowledge base"
        icon="📚"
      >
        <p className="text-sm text-zinc-400 mb-4">
          You have read-only access to our community-maintained species and strain library.
          Create an account to suggest additions or corrections.
        </p>
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Global Library</p>
              <p className="text-xs text-zinc-500 mt-0.5">Species, strains, and cultivation parameters</p>
            </div>
            <span className="text-emerald-400 text-sm">Read Access</span>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export default AnonymousSettings;
