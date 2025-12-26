// ============================================================================
// AI SETTINGS SECTION
// Settings for AI Assistant features including privacy and data sharing
// ============================================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { DataSharingLevel, AIUserSettings } from '../../lib/ai/types';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Bot: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Image: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  Activity: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  MessageSquare: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
};

// ============================================================================
// DATA SHARING LEVEL DESCRIPTIONS
// ============================================================================

const dataSharingLevels: Array<{
  level: DataSharingLevel;
  name: string;
  description: string;
  details: string[];
}> = [
  {
    level: 0,
    name: 'None',
    description: 'Private mode - no data leaves your account',
    details: [
      'AI uses only your personal data',
      'No contribution to community insights',
      'Full privacy, local context only',
    ],
  },
  {
    level: 1,
    name: 'Anonymous Aggregate',
    description: 'Share anonymized statistics only',
    details: [
      'General success rates (no strain names)',
      'Anonymous contamination patterns',
      'Helps improve AI for everyone',
    ],
  },
  {
    level: 2,
    name: 'Strain Performance',
    description: 'Share strain-specific growing data',
    details: [
      'Yield data by strain',
      'Optimal growing conditions',
      'Helps others growing same strains',
    ],
  },
  {
    level: 3,
    name: 'Full Share',
    description: 'Share detailed cultivation data',
    details: [
      'Full recipes and techniques',
      'Environmental correlations',
      'Maximum community benefit',
    ],
  },
];

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const defaultAISettings: Partial<AIUserSettings> = {
  aiEnabled: true,
  imageAnalysisEnabled: true,
  iotAnalysisEnabled: true,
  dataSharingLevel: 0,
  shareYieldData: false,
  shareEnvironmentalData: false,
  shareSuccessPatterns: false,
  retainConversations: true,
  conversationRetentionDays: 30,
  preferredResponseLength: 'balanced',
  includeCitations: true,
  proactiveSuggestions: true,
};

// ============================================================================
// COMPONENT
// ============================================================================

interface AISettingsSectionProps {
  onSave?: () => void;
}

export const AISettingsSection: React.FC<AISettingsSectionProps> = ({ onSave }) => {
  const [settings, setSettings] = useState<Partial<AIUserSettings>>(defaultAISettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('ai_user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading AI settings:', error);
      }

      if (data) {
        setSettings({
          aiEnabled: data.ai_enabled ?? true,
          imageAnalysisEnabled: data.image_analysis_enabled ?? true,
          iotAnalysisEnabled: data.iot_analysis_enabled ?? true,
          dataSharingLevel: data.data_sharing_level ?? 0,
          shareYieldData: data.share_yield_data ?? false,
          shareEnvironmentalData: data.share_environmental_data ?? false,
          shareSuccessPatterns: data.share_success_patterns ?? false,
          retainConversations: data.retain_conversations ?? true,
          conversationRetentionDays: data.conversation_retention_days ?? 30,
          preferredResponseLength: data.preferred_response_length ?? 'balanced',
          includeCitations: data.include_citations ?? true,
          proactiveSuggestions: data.proactive_suggestions ?? true,
        });
      }
    } catch (err) {
      console.error('Error loading AI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!supabase) {
        setError('Database connection not available');
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to save settings');
        return;
      }

      const { error } = await supabase
        .from('ai_user_settings')
        .upsert({
          user_id: user.id,
          ai_enabled: settings.aiEnabled,
          image_analysis_enabled: settings.imageAnalysisEnabled,
          iot_analysis_enabled: settings.iotAnalysisEnabled,
          data_sharing_level: settings.dataSharingLevel,
          share_yield_data: settings.shareYieldData,
          share_environmental_data: settings.shareEnvironmentalData,
          share_success_patterns: settings.shareSuccessPatterns,
          retain_conversations: settings.retainConversations,
          conversation_retention_days: settings.conversationRetentionDays,
          preferred_response_length: settings.preferredResponseLength,
          include_citations: settings.includeCitations,
          proactive_suggestions: settings.proactiveSuggestions,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      setSuccess('AI settings saved successfully');
      onSave?.();
    } catch (err) {
      console.error('Error saving AI settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof AIUserSettings>(
    key: K,
    value: AIUserSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Toggle component
  const Toggle: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-emerald-500' : 'bg-zinc-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (loading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="animate-pulse bg-zinc-700 rounded-lg w-6 h-6" />
          <div className="animate-pulse bg-zinc-700 rounded h-6 w-32" />
        </div>
        <div className="mt-4 space-y-3">
          <div className="animate-pulse bg-zinc-800 rounded h-10 w-full" />
          <div className="animate-pulse bg-zinc-800 rounded h-10 w-full" />
          <div className="animate-pulse bg-zinc-800 rounded h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main AI Toggle */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Icons.Bot />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
            <p className="text-sm text-zinc-400">MycoLab AI helps you grow better mushrooms</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* AI Enabled */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-white">Enable AI Features</h4>
              <p className="text-xs text-zinc-500">Chat, analysis, and smart suggestions</p>
            </div>
            <Toggle
              enabled={settings.aiEnabled ?? true}
              onChange={(v) => updateSetting('aiEnabled', v)}
            />
          </div>

          {/* Image Analysis */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Icons.Image />
              <div>
                <h4 className="text-sm font-medium text-white">Image Analysis</h4>
                <p className="text-xs text-zinc-500">Contamination detection, species ID</p>
              </div>
            </div>
            <Toggle
              enabled={settings.imageAnalysisEnabled ?? true}
              onChange={(v) => updateSetting('imageAnalysisEnabled', v)}
              disabled={!settings.aiEnabled}
            />
          </div>

          {/* IoT Analysis */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Icons.Activity />
              <div>
                <h4 className="text-sm font-medium text-white">IoT Analysis</h4>
                <p className="text-xs text-zinc-500">Environmental data insights</p>
              </div>
            </div>
            <Toggle
              enabled={settings.iotAnalysisEnabled ?? true}
              onChange={(v) => updateSetting('iotAnalysisEnabled', v)}
              disabled={!settings.aiEnabled}
            />
          </div>
        </div>
      </div>

      {/* Privacy & Data Sharing */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
            <Icons.Shield />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Privacy & Data Sharing</h3>
            <p className="text-sm text-zinc-400">Control how your data is used</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Choose how much data you want to share with the community. Higher sharing levels
            help improve AI recommendations for everyone.
          </p>

          {/* Data Sharing Level Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dataSharingLevels.map((level) => (
              <button
                key={level.level}
                onClick={() => updateSetting('dataSharingLevel', level.level)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  settings.dataSharingLevel === level.level
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {settings.dataSharingLevel === level.level && (
                    <Icons.CheckCircle />
                  )}
                  <h4 className={`text-sm font-medium ${
                    settings.dataSharingLevel === level.level
                      ? 'text-emerald-400'
                      : 'text-white'
                  }`}>
                    Level {level.level}: {level.name}
                  </h4>
                </div>
                <p className="text-xs text-zinc-400 mb-2">{level.description}</p>
                <ul className="space-y-1">
                  {level.details.map((detail, i) => (
                    <li key={i} className="text-xs text-zinc-500 flex items-start gap-1">
                      <span className="text-zinc-600">-</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation Settings */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
            <Icons.MessageSquare />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Conversation Settings</h3>
            <p className="text-sm text-zinc-400">Manage your AI chat history</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Retain Conversations */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-white">Save Conversation History</h4>
              <p className="text-xs text-zinc-500">Keep chat history for context</p>
            </div>
            <Toggle
              enabled={settings.retainConversations ?? true}
              onChange={(v) => updateSetting('retainConversations', v)}
            />
          </div>

          {/* Retention Days */}
          {settings.retainConversations && (
            <div className="pl-4 border-l-2 border-zinc-700">
              <label className="block text-sm text-zinc-400 mb-2">Retention Period</label>
              <select
                value={settings.conversationRetentionDays ?? 30}
                onChange={(e) => updateSetting('conversationRetentionDays', parseInt(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Response Preferences */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
            <Icons.Eye />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Response Preferences</h3>
            <p className="text-sm text-zinc-400">Customize how AI responds to you</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Response Length */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Response Style</label>
            <div className="grid grid-cols-3 gap-2">
              {(['concise', 'balanced', 'detailed'] as const).map((length) => (
                <button
                  key={length}
                  onClick={() => updateSetting('preferredResponseLength', length)}
                  className={`p-3 rounded-lg border text-sm capitalize transition-all ${
                    settings.preferredResponseLength === length
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {length}
                </button>
              ))}
            </div>
          </div>

          {/* Include Citations */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-white">Include Citations</h4>
              <p className="text-xs text-zinc-500">Reference knowledge library sources</p>
            </div>
            <Toggle
              enabled={settings.includeCitations ?? true}
              onChange={(v) => updateSetting('includeCitations', v)}
            />
          </div>

          {/* Proactive Suggestions */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-white">Proactive Suggestions</h4>
              <p className="text-xs text-zinc-500">Get AI tips without asking</p>
            </div>
            <Toggle
              enabled={settings.proactiveSuggestions ?? true}
              onChange={(v) => updateSetting('proactiveSuggestions', v)}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
        >
          {saving ? 'Saving...' : 'Save AI Settings'}
        </button>

        {success && (
          <span className="text-sm text-emerald-400 flex items-center gap-1">
            <Icons.CheckCircle /> {success}
          </span>
        )}
        {error && (
          <span className="text-sm text-red-400">{error}</span>
        )}
      </div>
    </div>
  );
};

export default AISettingsSection;
