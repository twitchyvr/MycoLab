// ============================================================================
// INFO PREFERENCES - Settings for the info/help system
// Controls tooltips, warnings, tips, and informational UI elements
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useInfoOptional, InfoVerbosity, InfoCategory, InfoPriority } from '../../store/InfoContext';
import { SettingsSection } from './common/SettingsSection';

const Icons = {
  Info: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  Help: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>,
  Warning: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Tip: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 18h6M10 22h4M12 2v1M12 9a3 3 0 1 0 0 6v0"/><path d="M21 12h1M3 12h1M18.364 5.636l-.707.707M6.343 17.657l-.707.707M5.636 5.636l.707.707M17.657 17.657l.707.707"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
  Volume: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
  VolumeMuted: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>,
  Reset: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>,
};

// Verbosity level config
const verbosityLevels: { value: InfoVerbosity; label: string; description: string }[] = [
  { value: 'minimal', label: 'Minimal', description: 'Only show critical warnings and errors' },
  { value: 'standard', label: 'Standard', description: 'Balanced help and tips for most users' },
  { value: 'verbose', label: 'Verbose', description: 'More explanations and suggestions' },
  { value: 'exhaustive', label: 'Exhaustive', description: 'Maximum detail and guidance for learning' },
];

// Warning priority config
const warningPriorities: { value: InfoPriority; label: string; description: string }[] = [
  { value: 'low', label: 'All Warnings', description: 'Show all warnings including minor suggestions' },
  { value: 'medium', label: 'Important+', description: 'Hide low-priority warnings' },
  { value: 'high', label: 'High Priority', description: 'Only show high and critical warnings' },
  { value: 'critical', label: 'Critical Only', description: 'Only show critical warnings that need immediate attention' },
];

// Category config
const categoryConfig: { id: InfoCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'culture', label: 'Cultures', icon: <span>🧫</span> },
  { id: 'grow', label: 'Grows', icon: <span>🍄</span> },
  { id: 'recipe', label: 'Recipes', icon: <span>📋</span> },
  { id: 'inventory', label: 'Inventory', icon: <span>📦</span> },
  { id: 'location', label: 'Locations', icon: <span>📍</span> },
  { id: 'strain', label: 'Strains', icon: <span>🧬</span> },
  { id: 'workflow', label: 'Workflows', icon: <span>🔄</span> },
  { id: 'data', label: 'Data', icon: <span>💾</span> },
  { id: 'settings', label: 'Settings', icon: <span>⚙️</span> },
];

export const InfoPreferences: React.FC = () => {
  const infoContext = useInfoOptional();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // If info context not available, show placeholder
  if (!infoContext) {
    return (
      <div className="p-4 bg-amber-950/30 rounded-lg border border-amber-700/50">
        <p className="text-sm text-amber-400">
          Info system is not initialized. Please refresh the page.
        </p>
      </div>
    );
  }

  const { preferences, updatePreferences, resetPreferences } = infoContext;

  // Toggle helper
  const Toggle: React.FC<{
    checked: boolean;
    onChange: () => void;
    label: string;
    description?: string;
    disabled?: boolean;
  }> = ({ checked, onChange, label, description, disabled }) => (
    <label className={`flex items-center justify-between cursor-pointer p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-zinc-500">{description}</p>}
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : 'bg-zinc-700'
        } ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </label>
  );

  return (
    <div className="space-y-6">
      {/* Master Control */}
      <SettingsSection
        title="Information Display"
        description="Control how much guidance and help you see throughout the app"
        icon="ℹ️"
      >
        <Toggle
          checked={preferences.enabled}
          onChange={() => updatePreferences({ enabled: !preferences.enabled })}
          label="Enable Info System"
          description="Master toggle for all tooltips, warnings, and tips"
        />

        {preferences.enabled && (
          <div className="mt-4 pt-4 border-t border-zinc-700">
            <label className="block text-sm font-medium text-zinc-300 mb-3">Information Level</label>
            <div className="grid grid-cols-2 gap-2">
              {verbosityLevels.map(level => (
                <button
                  key={level.value}
                  onClick={() => updatePreferences({ verbosity: level.value })}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    preferences.verbosity === level.value
                      ? 'bg-emerald-950/30 border-emerald-700 text-white'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <p className="font-medium text-sm">{level.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{level.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </SettingsSection>

      {/* Feature Toggles */}
      {preferences.enabled && (
        <SettingsSection
          title="Help Features"
          description="Choose which types of guidance to display"
          icon="🔧"
        >
          <div className="space-y-3">
            <Toggle
              checked={preferences.showTooltips}
              onChange={() => updatePreferences({ showTooltips: !preferences.showTooltips })}
              label="Hover Tooltips"
              description="Quick hints when you hover over elements"
            />

            <Toggle
              checked={preferences.showHelpIcons}
              onChange={() => updatePreferences({ showHelpIcons: !preferences.showHelpIcons })}
              label="Help Icons"
              description="Show (?) icons next to form fields and options"
            />

            <Toggle
              checked={preferences.showTips}
              onChange={() => updatePreferences({ showTips: !preferences.showTips })}
              label="Pro Tips"
              description="Proactive suggestions to improve your workflow"
            />

            <Toggle
              checked={preferences.showGuides}
              onChange={() => updatePreferences({ showGuides: !preferences.showGuides })}
              label="Guided Workflows"
              description="Step-by-step guidance for complex tasks"
            />

            <Toggle
              checked={preferences.showValidation}
              onChange={() => updatePreferences({ showValidation: !preferences.showValidation })}
              label="Validation Feedback"
              description="Real-time form validation hints"
            />

            <Toggle
              checked={preferences.showSuccessFeedback}
              onChange={() => updatePreferences({ showSuccessFeedback: !preferences.showSuccessFeedback })}
              label="Success Messages"
              description="Confirmation when actions complete"
            />
          </div>
        </SettingsSection>
      )}

      {/* Warnings */}
      {preferences.enabled && (
        <SettingsSection
          title="Warnings & Alerts"
          description="Control warning visibility and delivery"
          icon="⚠️"
        >
          <Toggle
            checked={preferences.showWarnings}
            onChange={() => updatePreferences({ showWarnings: !preferences.showWarnings })}
            label="Show Warnings"
            description="Display contextual warnings about potential issues"
          />

          {preferences.showWarnings && (
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <label className="block text-sm font-medium text-zinc-300 mb-3">Warning Threshold</label>
              <div className="space-y-2">
                {warningPriorities.map(priority => (
                  <button
                    key={priority.value}
                    onClick={() => updatePreferences({ warningThreshold: priority.value })}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      preferences.warningThreshold === priority.value
                        ? 'bg-amber-950/30 border-amber-700 text-white'
                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{priority.label}</p>
                        <p className="text-xs text-zinc-500">{priority.description}</p>
                      </div>
                      {preferences.warningThreshold === priority.value && (
                        <span className="text-amber-400">
                          <Icons.Check />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </SettingsSection>
      )}

      {/* Delivery Preferences */}
      {preferences.enabled && (
        <SettingsSection
          title="Notification Delivery"
          description="How information is presented to you"
          icon="📬"
        >
          <div className="space-y-3">
            <Toggle
              checked={preferences.useToasts}
              onChange={() => updatePreferences({ useToasts: !preferences.useToasts })}
              label="Toast Notifications"
              description="Pop-up messages in the corner of the screen"
            />

            {preferences.useToasts && (
              <div className="pl-4 pt-2">
                <label className="block text-xs text-zinc-500 mb-2">Toast Duration</label>
                <select
                  value={preferences.toastDuration}
                  onChange={(e) => updatePreferences({ toastDuration: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value={3000}>3 seconds</option>
                  <option value={5000}>5 seconds</option>
                  <option value={8000}>8 seconds</option>
                  <option value={10000}>10 seconds</option>
                </select>
              </div>
            )}

            <Toggle
              checked={preferences.useInline}
              onChange={() => updatePreferences({ useInline: !preferences.useInline })}
              label="Inline Messages"
              description="Show info directly next to relevant content"
            />

            <Toggle
              checked={preferences.usePopovers}
              onChange={() => updatePreferences({ usePopovers: !preferences.usePopovers })}
              label="Popovers"
              description="Detailed info panels on hover or click"
            />

            <Toggle
              checked={preferences.soundEnabled}
              onChange={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
              label="Sound Alerts"
              description="Play sound for important warnings"
            />
          </div>
        </SettingsSection>
      )}

      {/* Advanced: Category Filters */}
      {preferences.enabled && (
        <SettingsSection
          title="Category Filters"
          description="Choose which areas show informational content"
          icon="🎯"
        >
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-2"
          >
            {showAdvanced ? 'Hide' : 'Show'} category settings
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showAdvanced && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categoryConfig.map(cat => {
                const isEnabled = preferences.enabledCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      const newCategories = isEnabled
                        ? preferences.enabledCategories.filter(c => c !== cat.id)
                        : [...preferences.enabledCategories, cat.id];
                      updatePreferences({ enabledCategories: newCategories });
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors flex items-center gap-2 ${
                      isEnabled
                        ? 'bg-emerald-950/30 border-emerald-700 text-white'
                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </SettingsSection>
      )}

      {/* Dismissed Items */}
      {preferences.enabled && (preferences.dismissedWarnings.length > 0 || preferences.dismissedTips.length > 0) && (
        <SettingsSection
          title="Dismissed Items"
          description="Reset dismissed warnings and tips"
          icon="🗑️"
        >
          <div className="space-y-4">
            {preferences.dismissedWarnings.length > 0 && (
              <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {preferences.dismissedWarnings.length} dismissed warning{preferences.dismissedWarnings.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-zinc-500">These warnings won't appear again</p>
                  </div>
                  <button
                    onClick={() => updatePreferences({ dismissedWarnings: [] })}
                    className="text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded border border-emerald-700/50 hover:bg-emerald-950/30"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            )}

            {preferences.dismissedTips.length > 0 && (
              <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {preferences.dismissedTips.length} dismissed tip{preferences.dismissedTips.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-zinc-500">These tips won't appear again</p>
                  </div>
                  <button
                    onClick={() => updatePreferences({ dismissedTips: [] })}
                    className="text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded border border-emerald-700/50 hover:bg-emerald-950/30"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            )}
          </div>
        </SettingsSection>
      )}

      {/* Reset to Defaults */}
      <SettingsSection
        title="Reset Preferences"
        description="Restore all info settings to default values"
        icon="🔄"
      >
        <button
          onClick={() => {
            if (window.confirm('Reset all info preferences to defaults?')) {
              resetPreferences();
            }
          }}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 flex items-center gap-2"
        >
          <Icons.Reset />
          Reset to Defaults
        </button>
      </SettingsSection>
    </div>
  );
};

export default InfoPreferences;
