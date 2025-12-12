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
        detectSessionInUrl: false,
      }
    })
  : null;

// Note: Client reinitialization removed for security
// Database credentials are now set only via environment variables at build time

// ============================================================================
// ANONYMOUS AUTHENTICATION
// Creates a persistent anonymous user session for pre-auth data storage
// ============================================================================

/**
 * Ensure we have an authenticated session (anonymous or real user)
 * This allows storing user-specific data without requiring login
 * 
 * @returns The current session (anonymous or authenticated)
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
    
    // No session - try anonymous sign-in
    // NOTE: Anonymous auth must be enabled in Supabase Dashboard:
    // Authentication > Providers > Anonymous Sign-Ins > Enable
    const { data, error: signInError } = await supabase.auth.signInAnonymously();
    
    if (signInError) {
      // If anonymous auth is not enabled, log a helpful message
      if (signInError.message?.includes('Anonymous sign-ins are disabled')) {
        console.warn(
          'Anonymous auth not enabled. To persist settings:\n' +
          '1. Go to Supabase Dashboard > Authentication > Providers\n' +
          '2. Enable "Anonymous Sign-Ins"\n' +
          'Using localStorage fallback for now.'
        );
      } else {
        console.error('Anonymous sign-in failed:', signInError);
      }
      return null;
    }
    
    console.log('Anonymous session created:', data.session?.user.id);
    return data.session;
  } catch (err) {
    console.error('Session error:', err);
    return null;
  }
};

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
