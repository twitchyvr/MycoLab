// ============================================================================
// SUPABASE CLIENT
// Database client configuration with Anonymous Authentication support
// ============================================================================

import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

// Get credentials from environment variables ONLY
// Security: Database credentials should never be configurable from the client side
// These must be set at build time via environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
                        import.meta.env.VITE_SUPABASE_KEY ||
                        import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Debug logging for configuration issues (only in development or when there's a problem)
if (!isSupabaseConfigured) {
  console.warn(
    '%c[MycoLab] Supabase not configured',
    'color: #f59e0b; font-weight: bold',
    '\n\nAuthentication and cloud sync are disabled.',
    '\n\nTo enable:',
    '\n1. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables',
    '\n2. For Netlify: Add these in Site Settings > Environment Variables',
    '\n3. Trigger a new build after adding the variables',
    '\n\nCurrent values detected:',
    '\n  - VITE_SUPABASE_URL:', supabaseUrl ? '(set)' : '(not set)',
    '\n  - VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '(set)' : '(not set)'
  );
} else {
  console.log(
    '%c[MycoLab] Supabase configured',
    'color: #10b981; font-weight: bold',
    '\n  - URL:', supabaseUrl.substring(0, 30) + '...'
  );
}

// Create client (will be null if not configured)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'mycolab-auth',
        autoRefreshToken: true,
        detectSessionInUrl: true, // Required for OAuth redirects to work
      }
    })
  : null;

// Note: Client reinitialization removed for security
// Database credentials are now set only via environment variables at build time

// ============================================================================
// ANONYMOUS AUTHENTICATION
// Creates a persistent anonymous user session for pre-auth data storage
// ============================================================================

// Track if anonymous auth is available (set after first attempt)
let anonymousAuthAvailable: boolean | null = null;

/**
 * Ensure we have an authenticated session (anonymous or real user)
 * This allows storing user-specific data without requiring login
 *
 * @returns The current session (anonymous or authenticated), or null if no session
 */
export const ensureSession = async (): Promise<Session | null> => {
  if (!supabase) return null;

  try {
    // Check for existing session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return null;
    }

    // If we have a session, return it
    if (session) {
      return session;
    }

    // No session - check if we should try anonymous sign-in
    // Skip if we already know anonymous auth is disabled
    if (anonymousAuthAvailable === false) {
      return null;
    }

    // Try anonymous sign-in
    // NOTE: Anonymous auth must be enabled in Supabase Dashboard:
    // Authentication > Providers > Anonymous Sign-Ins > Enable
    const { data, error: signInError } = await supabase.auth.signInAnonymously();

    if (signInError) {
      // Mark anonymous auth as unavailable to prevent repeated attempts
      anonymousAuthAvailable = false;

      // Handle common error cases with helpful messages
      if (signInError.message?.includes('Anonymous sign-ins are disabled') ||
          signInError.status === 422) {
        console.warn(
          '%c[MycoLab] Anonymous auth not enabled. To persist settings:',
          'color: #f59e0b',
          '\n1. Go to Supabase Dashboard > Authentication > Providers',
          '\n2. Enable "Anonymous Sign-Ins"',
          '\nUsing localStorage fallback for now.'
        );
      } else if (signInError.message?.toLowerCase().includes('captcha') ||
                 signInError.status === 500) {
        // CAPTCHA is enabled which blocks anonymous auth - this is expected behavior
        console.warn(
          '%c[MycoLab] Anonymous auth blocked by CAPTCHA protection.',
          'color: #f59e0b',
          '\nTo enable anonymous auth, disable CAPTCHA in Supabase:',
          '\n  Authentication > Attack Protection > Disable Captcha',
          '\nOr use email/password sign-in for cloud sync.',
          '\nUsing localStorage fallback for now.'
        );
      } else {
        console.warn('[MycoLab] Anonymous sign-in unavailable:', signInError.message);
      }
      return null;
    }

    anonymousAuthAvailable = true;
    console.log('Anonymous session created:', data.session?.user.id);
    return data.session;
  } catch (err) {
    console.error('Session error:', err);
    return null;
  }
};

/**
 * Reset the anonymous auth availability flag (call after logout)
 */
export const resetAnonymousAuthState = () => {
  anonymousAuthAvailable = null;
};

/**
 * Check if anonymous auth is available
 */
export const isAnonymousAuthAvailable = () => anonymousAuthAvailable !== false;

/**
 * Get the current user ID (from session or null)
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  if (!supabase) return null;
  
  const session = await ensureSession();
  return session?.user?.id || null;
};

/**
 * Check if current user is anonymous
 */
export const isAnonymousUser = async (): Promise<boolean> => {
  if (!supabase) return true;
  
  const { data: { user } } = await supabase.auth.getUser();
  return user?.is_anonymous ?? true;
};

/**
 * Link anonymous user to a real account (call during registration)
 * This preserves all their existing data
 */
export const linkAnonymousUser = async (email: string, password: string) => {
  if (!supabase) return { error: new Error('Supabase not configured') };
  
  const isAnon = await isAnonymousUser();
  if (!isAnon) {
    return { error: new Error('Current user is not anonymous') };
  }
  
  // Update the anonymous user with email/password
  const { data, error } = await supabase.auth.updateUser({
    email,
    password,
  });
  
  return { data, error };
};

// ============================================================================
// LOCAL STORAGE FALLBACK
// For settings persistence when Supabase is offline or anon auth disabled
// ============================================================================

const SETTINGS_STORAGE_KEY = 'mycolab-settings';

export interface LocalSettings {
  defaultUnits: 'metric' | 'imperial';
  defaultCurrency: string;
  altitude: number;
  timezone: string;
  notifications: {
    enabled: boolean;
    harvestReminders: boolean;
    lowStockAlerts: boolean;
    contaminationAlerts: boolean;
  };
}

const defaultSettings: LocalSettings = {
  defaultUnits: 'metric',
  defaultCurrency: 'USD',
  altitude: 0,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  notifications: {
    enabled: true,
    harvestReminders: true,
    lowStockAlerts: true,
    contaminationAlerts: true,
  },
};

/**
 * Get settings from localStorage
 */
export const getLocalSettings = (): LocalSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (err) {
    console.error('Error reading local settings:', err);
  }
  return defaultSettings;
};

/**
 * Save settings to localStorage
 */
export const saveLocalSettings = (settings: Partial<LocalSettings>): void => {
  try {
    const current = getLocalSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving local settings:', err);
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if we're in offline mode (Supabase not configured)
 */
export const isOfflineMode = () => !isSupabaseConfigured;

/**
 * Clear all local data (localStorage keys used by MycoLab)
 * Call this on logout or account deletion
 */
export const clearLocalData = (options: { preserveSettings?: boolean } = {}): void => {
  const keysToRemove = [
    'mycolab-auth',
    'mycolab-last-sync',
  ];

  // Only remove settings if not preserving them
  if (!options.preserveSettings) {
    keysToRemove.push(SETTINGS_STORAGE_KEY);
  }

  // Remove all MycoLab keys
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error(`Error removing ${key}:`, err);
    }
  });

  // Also remove any other mycolab-prefixed keys that might exist
  try {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('mycolab-') && !keysToRemove.includes(key)) {
        // Skip settings if preserving
        if (options.preserveSettings && key === SETTINGS_STORAGE_KEY) return;
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.error('Error clearing local storage:', err);
  }

  console.log('[MycoLab] Local data cleared');
};

// ============================================================================
// ACCOUNT LINKING UTILITIES
// Functions to detect and link accounts with the same email
// ============================================================================

export interface EmailAccountInfo {
  exists_in_system: boolean;
  has_password: boolean;
  has_google: boolean;
  user_id: string | null;
  created_at: string | null;
}

/**
 * Check if an email already exists in the system and get provider info
 * Uses the check_email_account database function
 */
export const checkEmailAccount = async (email: string): Promise<EmailAccountInfo | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc('check_email_account', {
      p_email: email,
    });

    if (error) {
      console.error('[Auth] Error checking email account:', error);
      return null;
    }

    // The function returns a table, so data is an array
    if (data && data.length > 0) {
      return data[0] as EmailAccountInfo;
    }

    return null;
  } catch (err) {
    console.error('[Auth] Exception checking email account:', err);
    return null;
  }
};

/**
 * Get the identities linked to the current user
 * Returns an array of provider names (e.g., ['email', 'google'])
 */
export const getCurrentUserIdentities = async (): Promise<string[]> => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.auth.getUserIdentities();

    if (error) {
      console.error('[Auth] Error getting user identities:', error);
      return [];
    }

    return data?.identities?.map((i) => i.provider) || [];
  } catch (err) {
    console.error('[Auth] Exception getting user identities:', err);
    return [];
  }
};

/**
 * Link a Google OAuth identity to the current user
 * User must be logged in with email/password first
 */
export const linkGoogleIdentity = async (): Promise<{ error: Error | null; url?: string }> => {
  if (!supabase) return { error: new Error('Supabase not configured') };

  try {
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      return { error };
    }

    // In browser, user is automatically redirected
    return { error: null, url: data?.url };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Failed to link Google identity') };
  }
};

/**
 * Migrate data from one user account to the current user
 * Used after linking accounts to consolidate data
 */
export const migrateUserData = async (
  fromUserId: string,
  toUserId: string
): Promise<{ success: boolean; tablesUpdated: number; message: string }> => {
  if (!supabase) {
    return { success: false, tablesUpdated: 0, message: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase.rpc('migrate_user_data', {
      p_from_user_id: fromUserId,
      p_to_user_id: toUserId,
    });

    if (error) {
      console.error('[Auth] Error migrating user data:', error);
      return { success: false, tablesUpdated: 0, message: error.message };
    }

    // The function returns a table, so data is an array
    if (data && data.length > 0) {
      return {
        success: data[0].success,
        tablesUpdated: data[0].tables_updated,
        message: data[0].message,
      };
    }

    return { success: false, tablesUpdated: 0, message: 'No response from migration function' };
  } catch (err) {
    console.error('[Auth] Exception migrating user data:', err);
    return {
      success: false,
      tablesUpdated: 0,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
};

// ============================================================================
// DATABASE TYPES
// Generated from Supabase schema
// ============================================================================

export interface Database {
  public: {
    Tables: {
      strains: {
        Row: {
          id: string;
          name: string;
          species: string;
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          colonization_days_min: number;
          colonization_days_max: number;
          fruiting_days_min: number;
          fruiting_days_max: number;
          optimal_temp_colonization: number;
          optimal_temp_fruiting: number;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['strains']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['strains']['Insert']>;
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string | null;
          default_units: string;
          default_currency: string;
          altitude: number;
          timezone: string;
          notifications_enabled: boolean;
          harvest_reminders: boolean;
          low_stock_alerts: boolean;
          contamination_alerts: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_settings']['Insert']>;
      };
      // ... other tables remain the same
    };
  };
}
