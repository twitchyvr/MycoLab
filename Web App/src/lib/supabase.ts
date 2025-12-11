// ============================================================================
// SUPABASE CLIENT
// Database client configuration for cloud data persistence
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get credentials from environment variables or localStorage
const getCredentials = () => {
  // Try environment variables first (supports multiple key names)
  let url = import.meta.env.VITE_SUPABASE_URL || '';
  let key = import.meta.env.VITE_SUPABASE_ANON_KEY || 
            import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
  
  // Fall back to localStorage (set via Settings page)
  if (!url || !key) {
    url = localStorage.getItem('mycolab-supabase-url') || '';
    key = localStorage.getItem('mycolab-supabase-key') || '';
  }
  
  return { url, key };
};

const { url: supabaseUrl, key: supabaseAnonKey } = getCredentials();

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create client (will be null if not configured)
export const supabase: SupabaseClient | null = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Re-initialize client (called after settings change)
export const reinitializeSupabase = () => {
  const { url, key } = getCredentials();
  if (url && key) {
    return createClient(url, key);
  }
  return null;
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
      locations: {
        Row: {
          id: string;
          name: string;
          type: 'incubation' | 'fruiting' | 'storage' | 'lab';
          temp_min: number | null;
          temp_max: number | null;
          humidity_min: number | null;
          humidity_max: number | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['locations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['locations']['Insert']>;
      };
      cultures: {
        Row: {
          id: string;
          type: 'spore_syringe' | 'liquid_culture' | 'agar' | 'slant';
          label: string;
          strain_id: string;
          status: 'active' | 'colonizing' | 'ready' | 'contaminated' | 'expired' | 'used';
          created_at: string;
          updated_at: string;
          parent_id: string | null;
          generation: number;
          location_id: string;
          vessel_id: string;
          volume_ml: number | null;
          health_rating: number;
          notes: string | null;
          cost: number;
          supplier_id: string | null;
          lot_number: string | null;
          expires_at: string | null;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['cultures']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['cultures']['Insert']>;
      };
      grows: {
        Row: {
          id: string;
          name: string;
          strain_id: string;
          status: 'active' | 'paused' | 'completed' | 'failed';
          current_stage: 'spawning' | 'colonization' | 'fruiting' | 'harvesting' | 'completed' | 'contaminated' | 'aborted';
          source_culture_id: string | null;
          spawn_type: string;
          spawn_weight: number;
          substrate_type_id: string;
          substrate_weight: number;
          spawn_rate: number;
          container_type_id: string;
          container_count: number;
          spawned_at: string;
          colonization_started_at: string | null;
          fruiting_started_at: string | null;
          completed_at: string | null;
          location_id: string;
          total_yield: number;
          estimated_cost: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['grows']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['grows']['Insert']>;
      };
      recipes: {
        Row: {
          id: string;
          name: string;
          category: 'agar' | 'liquid_culture' | 'grain_spawn' | 'bulk_substrate' | 'casing' | 'other';
          description: string;
          yield_amount: number;
          yield_unit: string;
          prep_time: number | null;
          sterilization_time: number | null;
          sterilization_psi: number | null;
          instructions: string[];
          tips: string[] | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['recipes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['recipes']['Insert']>;
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          category_id: string;
          quantity: number;
          unit: string;
          unit_cost: number;
          reorder_point: number | null;
          supplier_id: string | null;
          location_id: string | null;
          expires_at: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['inventory_items']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['inventory_items']['Insert']>;
      };
    };
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if we're in offline mode (Supabase not configured)
 */
export const isOfflineMode = () => !isSupabaseConfigured;

/**
 * Get current user ID (for row-level security)
 */
export const getCurrentUserId = async () => {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};
