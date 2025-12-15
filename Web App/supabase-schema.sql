-- ============================================================================
-- MYCOLAB DATABASE SCHEMA (Idempotent - Safe to run multiple times)
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================================
--
-- AUTH TRIGGER ARCHITECTURE
-- ============================================================================
-- When a new user signs up, three triggers fire on auth.users:
--
-- 1. on_auth_user_created -> handle_new_user()
--    Creates a user_profiles row with user_id and email
--
-- 2. on_user_created_populate_data -> populate_default_user_data()
--    Creates user_settings and default locations
--    IMPORTANT: Uses exception handlers to prevent signup failures
--
-- 3. on_auth_user_updated -> handle_user_update()
--    Syncs email to user_profiles when user upgrades from anonymous
--
-- CRITICAL SAFEGUARDS (learned from production issues):
-- - populate_default_user_data() MUST NOT reference lookup table FKs
--   (type_id, classification_id) as these tables may be empty
-- - All inserts in trigger functions wrapped in EXCEPTION blocks
-- - Use RAISE WARNING instead of RAISE EXCEPTION for non-critical failures
-- - user_profiles.user_id references auth.users(id), NOT public.users
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LOOKUP TABLES
-- ============================================================================

-- Species (master list of mushroom species)
CREATE TABLE IF NOT EXISTS species (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  scientific_name TEXT,
  common_names TEXT[],
  category TEXT CHECK (category IN ('gourmet', 'medicinal', 'research', 'other')) DEFAULT 'gourmet',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Strains
CREATE TABLE IF NOT EXISTS strains (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  species_id UUID REFERENCES species(id),
  species TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
  colonization_days_min INTEGER DEFAULT 14,
  colonization_days_max INTEGER DEFAULT 21,
  fruiting_days_min INTEGER DEFAULT 7,
  fruiting_days_max INTEGER DEFAULT 14,
  optimal_temp_colonization INTEGER DEFAULT 24,
  optimal_temp_fruiting INTEGER DEFAULT 22,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Location Types (customizable location type lookup)
CREATE TABLE IF NOT EXISTS location_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Location Classifications (customizable location classification lookup)
CREATE TABLE IF NOT EXISTS location_classifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Locations (with enhanced fields for procurement tracking)
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('incubation', 'fruiting', 'storage', 'lab', 'other')) DEFAULT 'lab',
  type_id UUID REFERENCES location_types(id),
  classification_id UUID REFERENCES location_classifications(id),
  temp_min INTEGER,
  temp_max INTEGER,
  humidity_min INTEGER,
  humidity_max INTEGER,
  has_power BOOLEAN DEFAULT false,
  power_usage TEXT,
  has_air_circulation BOOLEAN DEFAULT false,
  size TEXT,
  supplier_id UUID, -- FK constraint added via ALTER TABLE after suppliers table exists
  cost DECIMAL(10,2),
  procurement_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add columns to existing locations table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'type_id') THEN
    ALTER TABLE locations ADD COLUMN type_id UUID REFERENCES location_types(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'classification_id') THEN
    ALTER TABLE locations ADD COLUMN classification_id UUID REFERENCES location_classifications(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'has_power') THEN
    ALTER TABLE locations ADD COLUMN has_power BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'power_usage') THEN
    ALTER TABLE locations ADD COLUMN power_usage TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'has_air_circulation') THEN
    ALTER TABLE locations ADD COLUMN has_air_circulation BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'size') THEN
    ALTER TABLE locations ADD COLUMN size TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'supplier_id') THEN
    ALTER TABLE locations ADD COLUMN supplier_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'cost') THEN
    ALTER TABLE locations ADD COLUMN cost DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'procurement_date') THEN
    ALTER TABLE locations ADD COLUMN procurement_date DATE;
  END IF;
END $$;

-- Vessels (culture containers)
CREATE TABLE IF NOT EXISTS vessels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('jar', 'bag', 'plate', 'tube', 'bottle', 'syringe', 'other')) DEFAULT 'jar',
  volume_ml INTEGER,
  is_reusable BOOLEAN DEFAULT true,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Container types (grow containers)
CREATE TABLE IF NOT EXISTS container_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('tub', 'bag', 'bucket', 'bed', 'jar', 'other')) DEFAULT 'tub',
  volume_l DECIMAL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Substrate types
CREATE TABLE IF NOT EXISTS substrate_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  category TEXT CHECK (category IN ('bulk', 'grain', 'agar', 'liquid')) DEFAULT 'bulk',
  spawn_rate_min INTEGER DEFAULT 10,
  spawn_rate_optimal INTEGER DEFAULT 20,
  spawn_rate_max INTEGER DEFAULT 30,
  field_capacity INTEGER DEFAULT 65,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Inventory categories
CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#10b981',
  icon TEXT DEFAULT '📦',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Recipe categories (for custom recipe categories)
CREATE TABLE IF NOT EXISTS recipe_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT 'text-zinc-400 bg-zinc-800',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Grain types (for spawn type dropdown)
CREATE TABLE IF NOT EXISTS grain_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  status TEXT CHECK (status IN ('draft', 'pending', 'ordered', 'shipped', 'partial', 'received', 'cancelled')) DEFAULT 'draft',
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'paid', 'partial', 'refunded')) DEFAULT 'unpaid',
  items JSONB DEFAULT '[]',
  subtotal DECIMAL DEFAULT 0,
  shipping DECIMAL DEFAULT 0,
  tax DECIMAL DEFAULT 0,
  total DECIMAL DEFAULT 0,
  order_date DATE DEFAULT CURRENT_DATE,
  expected_date DATE,
  received_date DATE,
  tracking_number TEXT,
  tracking_url TEXT,
  order_url TEXT,
  receipt_image TEXT,
  invoice_image TEXT,
  images TEXT[],
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================================
-- CORE DATA TABLES
-- ============================================================================

-- Inventory items (must be created before inventory_lots due to FK)
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES inventory_categories(id),
  sku TEXT,
  quantity DECIMAL DEFAULT 0,
  unit TEXT DEFAULT 'units',
  min_quantity DECIMAL DEFAULT 0,
  reorder_qty DECIMAL,
  cost_per_unit DECIMAL,
  supplier_id UUID REFERENCES suppliers(id),
  location_id UUID REFERENCES locations(id),
  expiration_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Inventory lots (individual stock units)
CREATE TABLE IF NOT EXISTS inventory_lots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inventory_item_id UUID REFERENCES inventory_items(id),
  quantity DECIMAL DEFAULT 0,
  original_quantity DECIMAL DEFAULT 0,
  unit TEXT DEFAULT 'g',
  status TEXT CHECK (status IN ('available', 'low', 'empty', 'expired', 'reserved')) DEFAULT 'available',
  purchase_order_id UUID REFERENCES purchase_orders(id),
  supplier_id UUID REFERENCES suppliers(id),
  purchase_date DATE,
  purchase_cost DECIMAL,
  location_id UUID REFERENCES locations(id),
  expiration_date DATE,
  lot_number TEXT,
  images TEXT[],
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Inventory usage (track what's used from which lot)
CREATE TABLE IF NOT EXISTS inventory_usages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lot_id UUID REFERENCES inventory_lots(id),
  inventory_item_id UUID REFERENCES inventory_items(id),
  quantity DECIMAL NOT NULL,
  unit TEXT DEFAULT 'g',
  usage_type TEXT CHECK (usage_type IN ('recipe', 'grow', 'culture', 'waste', 'adjustment', 'other')) DEFAULT 'other',
  reference_type TEXT CHECK (reference_type IN ('recipe', 'grow', 'culture')),
  reference_id UUID,
  reference_name TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  used_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipes (must be created before cultures due to FK)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('substrate', 'agar', 'liquid_culture', 'casing', 'supplement', 'other')) DEFAULT 'substrate',
  description TEXT,
  instructions TEXT,
  yield_amount DECIMAL,
  yield_unit TEXT DEFAULT 'g',
  prep_time_minutes INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Cultures
CREATE TABLE IF NOT EXISTS cultures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  label TEXT NOT NULL,
  strain_id UUID REFERENCES strains(id),
  type TEXT CHECK (type IN ('spore_syringe', 'liquid_culture', 'agar', 'slant', 'grain_master', 'grain_spawn', 'other')) DEFAULT 'agar',
  generation INTEGER DEFAULT 0,
  parent_id UUID REFERENCES cultures(id),
  vessel_id UUID REFERENCES vessels(id),
  location_id UUID REFERENCES locations(id),
  recipe_id UUID REFERENCES recipes(id),
  volume_ml INTEGER,
  fill_volume_ml INTEGER,
  status TEXT CHECK (status IN ('active', 'contaminated', 'exhausted', 'archived', 'in_use')) DEFAULT 'active',
  inoculation_date DATE,
  prep_date DATE,
  sterilization_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Culture observations
CREATE TABLE IF NOT EXISTS culture_observations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  culture_id UUID REFERENCES cultures(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT NOW(),
  type TEXT CHECK (type IN ('growth', 'contamination', 'transfer', 'general')) DEFAULT 'general',
  notes TEXT,
  colonization_percent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Culture transfers
CREATE TABLE IF NOT EXISTS culture_transfers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_culture_id UUID REFERENCES cultures(id),
  target_culture_id UUID REFERENCES cultures(id),
  date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Grows
CREATE TABLE IF NOT EXISTS grows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  strain_id UUID REFERENCES strains(id),
  source_culture_id UUID REFERENCES cultures(id),
  container_type_id UUID REFERENCES container_types(id),
  substrate_type_id UUID REFERENCES substrate_types(id),
  location_id UUID REFERENCES locations(id),
  stage TEXT CHECK (stage IN ('spawning', 'colonizing', 'fruiting', 'harvesting', 'completed', 'contaminated')) DEFAULT 'spawning',
  spawn_date DATE,
  colonization_start DATE,
  fruiting_start DATE,
  harvest_date DATE,
  substrate_weight_g DECIMAL,
  spawn_weight_g DECIMAL,
  container_count INTEGER DEFAULT 1,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Grow observations
CREATE TABLE IF NOT EXISTS grow_observations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  grow_id UUID REFERENCES grows(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT NOW(),
  type TEXT CHECK (type IN ('colonization', 'pinning', 'fruiting', 'contamination', 'environmental', 'general')) DEFAULT 'general',
  notes TEXT,
  colonization_percent INTEGER,
  temp_reading DECIMAL,
  humidity_reading DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Flushes (harvests)
CREATE TABLE IF NOT EXISTS flushes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  grow_id UUID REFERENCES grows(id) ON DELETE CASCADE,
  flush_number INTEGER DEFAULT 1,
  harvest_date DATE,
  wet_weight_g DECIMAL,
  dry_weight_g DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Recipe ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id),
  name TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  default_units TEXT DEFAULT 'metric',
  default_currency TEXT DEFAULT 'USD',
  altitude INTEGER DEFAULT 0,
  timezone TEXT DEFAULT 'America/Chicago',
  notifications_enabled BOOLEAN DEFAULT true,
  harvest_reminders BOOLEAN DEFAULT true,
  low_stock_alerts BOOLEAN DEFAULT true,
  contamination_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (for role management - admin vs customer)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin audit log for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  target_email TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin notifications for alerting admins of important events
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('user_signup', 'user_deactivated', 'data_change', 'system', 'warning', 'error')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_email TEXT,
  related_table TEXT,
  related_id TEXT,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  read_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update user profile when anonymous user is upgraded to permanent
-- This handles the case where an anonymous user adds email/password to their account
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user_profiles email when user email changes (anonymous upgrade)
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.user_profiles
    SET email = NEW.email, updated_at = NOW()
    WHERE user_id = NEW.id;

    -- If no profile exists yet, create one
    IF NOT FOUND THEN
      INSERT INTO public.user_profiles (user_id, email)
      VALUES (NEW.id, NEW.email)
      ON CONFLICT (user_id) DO UPDATE SET email = NEW.email, updated_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update profile when user is updated (e.g., anonymous to permanent)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_update();

-- ============================================================================
-- POPULATE DEFAULT USER DATA
-- ============================================================================
-- IMPORTANT: This function creates default data for new users.
-- It uses EXCEPTION blocks to prevent signup failures if any insert fails.
--
-- SAFEGUARDS APPLIED (2024-12):
-- 1. NO foreign key references to lookup tables (type_id, classification_id, etc.)
--    These may not have data for new users, causing FK violations
-- 2. Each insert is wrapped in its own BEGIN/EXCEPTION block
-- 3. Failures are logged as warnings, not errors, so signup completes
-- 4. Uses SECURITY DEFINER to run with elevated privileges
-- ============================================================================

CREATE OR REPLACE FUNCTION populate_default_user_data()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default user settings
  -- Wrapped in exception block to prevent signup failure
  BEGIN
    INSERT INTO user_settings (user_id, default_units, default_currency, altitude, timezone)
    VALUES (NEW.id, 'metric', 'USD', 0, 'America/Chicago')
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[populate_default_user_data] Failed to create user_settings for user %: %', NEW.id, SQLERRM;
  END;

  -- Create default locations for the user
  -- IMPORTANT: Do NOT use type_id or classification_id - these reference lookup tables
  -- that may be empty for new users, causing foreign key violations
  BEGIN
    INSERT INTO locations (name, type, temp_min, temp_max, humidity_min, humidity_max, notes, user_id)
    VALUES
      ('Incubation Chamber', 'incubation', 24, 28, 70, 80, 'Main incubation space', NEW.id),
      ('Fruiting Chamber', 'fruiting', 18, 24, 85, 95, 'High humidity fruiting area', NEW.id),
      ('Main Lab', 'lab', 20, 25, NULL, NULL, 'Clean work area', NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[populate_default_user_data] Failed to create default locations for user %: %', NEW.id, SQLERRM;
  END;

  -- Always return NEW to allow the trigger to complete
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to populate default data for new users
-- Fires after user profile is created by handle_new_user
DROP TRIGGER IF EXISTS on_user_created_populate_data ON auth.users;
CREATE TRIGGER on_user_created_populate_data
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION populate_default_user_data();

-- ============================================================================
-- ADMIN NOTIFICATION FUNCTIONS
-- ============================================================================

-- Function to create admin notification for new user signups
CREATE OR REPLACE FUNCTION notify_admins_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create notification for admins when a new user signs up
  BEGIN
    INSERT INTO admin_notifications (type, title, message, severity, target_user_id, target_user_email, metadata)
    VALUES (
      'user_signup',
      'New User Signup',
      COALESCE('New user registered: ' || NEW.email, 'New anonymous user registered'),
      'info',
      NEW.user_id,
      NEW.email,
      jsonb_build_object(
        'display_name', NEW.display_name,
        'subscription_tier', NEW.subscription_tier
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Don't fail user signup if notification fails
    RAISE WARNING '[notify_admins_new_user] Failed to create notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify admins when new user profile is created
DROP TRIGGER IF EXISTS on_user_profile_created_notify ON user_profiles;
CREATE TRIGGER on_user_profile_created_notify
  AFTER INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION notify_admins_new_user();

-- Function to create admin notification helper (for use in application code)
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_severity TEXT DEFAULT 'info',
  p_target_user_id UUID DEFAULT NULL,
  p_target_user_email TEXT DEFAULT NULL,
  p_related_table TEXT DEFAULT NULL,
  p_related_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO admin_notifications (
    type, title, message, severity, target_user_id, target_user_email,
    related_table, related_id, metadata
  )
  VALUES (
    p_type, p_title, p_message, p_severity, p_target_user_id, p_target_user_email,
    p_related_table, p_related_id, p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEMA MIGRATIONS (Add columns that may be missing from older schemas)
-- ============================================================================

-- Add species_id to strains if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strains' AND column_name = 'species_id') THEN
    ALTER TABLE strains ADD COLUMN species_id UUID REFERENCES species(id);
  END IF;
END $$;

-- Add any other missing columns here as schema evolves
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'type') THEN
    ALTER TABLE locations ADD COLUMN type TEXT CHECK (type IN ('incubation', 'fruiting', 'storage', 'lab', 'other')) DEFAULT 'lab';
  END IF;
END $$;

-- Add recipe_id to cultures for tracking what media recipe is in each culture container
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'recipe_id') THEN
    ALTER TABLE cultures ADD COLUMN recipe_id UUID REFERENCES recipes(id);
  END IF;
END $$;

-- Add fill_volume_ml to cultures (actual fill amount vs container capacity)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'fill_volume_ml') THEN
    ALTER TABLE cultures ADD COLUMN fill_volume_ml INTEGER;
  END IF;
END $$;

-- Add volume_ml to cultures (container capacity, may be different from vessel default)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'volume_ml') THEN
    ALTER TABLE cultures ADD COLUMN volume_ml INTEGER;
  END IF;
END $$;

-- Add prep_date to cultures (when media was prepared)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'prep_date') THEN
    ALTER TABLE cultures ADD COLUMN prep_date DATE;
  END IF;
END $$;

-- Add sterilization_date to cultures
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'sterilization_date') THEN
    ALTER TABLE cultures ADD COLUMN sterilization_date DATE;
  END IF;
END $$;

-- Add altitude column to user_settings if it doesn't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'altitude') THEN
    ALTER TABLE user_settings ADD COLUMN altitude INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add timezone column to user_settings if it doesn't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'timezone') THEN
    ALTER TABLE user_settings ADD COLUMN timezone TEXT DEFAULT 'America/Chicago';
  END IF;
END $$;

-- Add columns to existing suppliers table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'website') THEN
    ALTER TABLE suppliers ADD COLUMN website TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'email') THEN
    ALTER TABLE suppliers ADD COLUMN email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'phone') THEN
    ALTER TABLE suppliers ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'notes') THEN
    ALTER TABLE suppliers ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Add FK constraint from locations to suppliers (now that suppliers table exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'locations_supplier_id_fkey'
    AND table_name = 'locations'
  ) THEN
    ALTER TABLE locations ADD CONSTRAINT locations_supplier_id_fkey
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
  END IF;
END $$;

-- ============================================================================
-- GROWS TABLE MIGRATIONS
-- Add missing columns used by the application
-- ============================================================================
DO $$
BEGIN
  -- Status field (active, paused, completed, failed)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'status') THEN
    ALTER TABLE grows ADD COLUMN status TEXT CHECK (status IN ('active', 'paused', 'completed', 'failed')) DEFAULT 'active';
  END IF;

  -- Current stage (app uses current_stage, schema had stage)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'current_stage') THEN
    ALTER TABLE grows ADD COLUMN current_stage TEXT CHECK (current_stage IN ('spawning', 'colonization', 'fruiting', 'harvesting', 'completed', 'contaminated', 'aborted')) DEFAULT 'spawning';
  END IF;

  -- Spawn type (grain type used)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'spawn_type') THEN
    ALTER TABLE grows ADD COLUMN spawn_type TEXT DEFAULT 'grain';
  END IF;

  -- Spawn weight (app uses spawn_weight, not spawn_weight_g)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'spawn_weight') THEN
    ALTER TABLE grows ADD COLUMN spawn_weight DECIMAL;
  END IF;

  -- Substrate weight (app uses substrate_weight)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'substrate_weight') THEN
    ALTER TABLE grows ADD COLUMN substrate_weight DECIMAL;
  END IF;

  -- Spawn rate percentage
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'spawn_rate') THEN
    ALTER TABLE grows ADD COLUMN spawn_rate DECIMAL DEFAULT 20;
  END IF;

  -- Spawned at timestamp (app uses spawned_at, not spawn_date)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'spawned_at') THEN
    ALTER TABLE grows ADD COLUMN spawned_at TIMESTAMPTZ;
  END IF;

  -- Colonization started at (app uses colonization_started_at)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'colonization_started_at') THEN
    ALTER TABLE grows ADD COLUMN colonization_started_at TIMESTAMPTZ;
  END IF;

  -- Fruiting started at (app uses fruiting_started_at)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'fruiting_started_at') THEN
    ALTER TABLE grows ADD COLUMN fruiting_started_at TIMESTAMPTZ;
  END IF;

  -- Completed at timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'completed_at') THEN
    ALTER TABLE grows ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;

  -- First pins at timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'first_pins_at') THEN
    ALTER TABLE grows ADD COLUMN first_pins_at TIMESTAMPTZ;
  END IF;

  -- First harvest at timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'first_harvest_at') THEN
    ALTER TABLE grows ADD COLUMN first_harvest_at TIMESTAMPTZ;
  END IF;

  -- Target temperatures and humidity
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'target_temp_colonization') THEN
    ALTER TABLE grows ADD COLUMN target_temp_colonization INTEGER DEFAULT 24;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'target_temp_fruiting') THEN
    ALTER TABLE grows ADD COLUMN target_temp_fruiting INTEGER DEFAULT 22;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'target_humidity') THEN
    ALTER TABLE grows ADD COLUMN target_humidity INTEGER DEFAULT 90;
  END IF;

  -- Total yield tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'total_yield') THEN
    ALTER TABLE grows ADD COLUMN total_yield DECIMAL DEFAULT 0;
  END IF;

  -- Estimated cost
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'estimated_cost') THEN
    ALTER TABLE grows ADD COLUMN estimated_cost DECIMAL DEFAULT 0;
  END IF;

  -- Recipe ID for substrate recipe used
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'recipe_id') THEN
    ALTER TABLE grows ADD COLUMN recipe_id UUID REFERENCES recipes(id);
  END IF;
END $$;

-- ============================================================================
-- CULTURES TABLE MIGRATIONS
-- Add missing columns used by the application
-- ============================================================================
DO $$
BEGIN
  -- Health rating (1-5 scale)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'health_rating') THEN
    ALTER TABLE cultures ADD COLUMN health_rating INTEGER DEFAULT 5;
  END IF;

  -- Cost tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'cost') THEN
    ALTER TABLE cultures ADD COLUMN cost DECIMAL DEFAULT 0;
  END IF;

  -- Supplier reference (where culture was purchased)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'supplier_id') THEN
    ALTER TABLE cultures ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
  END IF;

  -- Lot number for tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'lot_number') THEN
    ALTER TABLE cultures ADD COLUMN lot_number TEXT;
  END IF;

  -- Expiration date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'expires_at') THEN
    ALTER TABLE cultures ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Update cultures status constraint to include all app statuses
-- First drop the old constraint if it exists, then add new one
DO $$
BEGIN
  -- Drop old constraint (may fail if doesn't exist, that's ok)
  BEGIN
    ALTER TABLE cultures DROP CONSTRAINT IF EXISTS cultures_status_check;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore error
  END;

  -- Add new constraint with all valid statuses
  BEGIN
    ALTER TABLE cultures ADD CONSTRAINT cultures_status_check
      CHECK (status IN ('active', 'colonizing', 'ready', 'contaminated', 'archived', 'depleted', 'exhausted', 'in_use'));
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Constraint already exists
  END;
END $$;

-- ============================================================================
-- RECIPES TABLE MIGRATIONS
-- Add missing columns used by the application
-- ============================================================================
DO $$
BEGIN
  -- Prep time in minutes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'prep_time_minutes') THEN
    ALTER TABLE recipes ADD COLUMN prep_time_minutes INTEGER;
  END IF;

  -- Yield amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'yield_amount') THEN
    ALTER TABLE recipes ADD COLUMN yield_amount DECIMAL;
  END IF;

  -- Yield unit
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'yield_unit') THEN
    ALTER TABLE recipes ADD COLUMN yield_unit TEXT DEFAULT 'g';
  END IF;

  -- Sterilization time in minutes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'sterilization_time') THEN
    ALTER TABLE recipes ADD COLUMN sterilization_time INTEGER;
  END IF;

  -- Sterilization PSI
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'sterilization_psi') THEN
    ALTER TABLE recipes ADD COLUMN sterilization_psi INTEGER DEFAULT 15;
  END IF;

  -- Tips array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'tips') THEN
    ALTER TABLE recipes ADD COLUMN tips TEXT[];
  END IF;

  -- Source URL for recipe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'source_url') THEN
    ALTER TABLE recipes ADD COLUMN source_url TEXT;
  END IF;

  -- Cost per batch
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'cost_per_batch') THEN
    ALTER TABLE recipes ADD COLUMN cost_per_batch DECIMAL;
  END IF;
END $$;

-- Update recipes category constraint to include all app categories
DO $$
BEGIN
  BEGIN
    ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_category_check;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE recipes ADD CONSTRAINT recipes_category_check
      CHECK (category IN ('substrate', 'agar', 'liquid_culture', 'grain_spawn', 'bulk_substrate', 'casing', 'supplement', 'other'));
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- ============================================================================
-- FLUSHES TABLE MIGRATIONS
-- Add missing columns used by the application
-- ============================================================================
DO $$
BEGIN
  -- Mushroom count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flushes' AND column_name = 'mushroom_count') THEN
    ALTER TABLE flushes ADD COLUMN mushroom_count INTEGER;
  END IF;

  -- Quality rating
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flushes' AND column_name = 'quality') THEN
    ALTER TABLE flushes ADD COLUMN quality TEXT CHECK (quality IN ('excellent', 'good', 'fair', 'poor')) DEFAULT 'good';
  END IF;
END $$;

-- ============================================================================
-- INVENTORY_ITEMS TABLE MIGRATIONS
-- Add missing columns used by the application
-- ============================================================================
DO $$
BEGIN
  -- SKU / Part number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'sku') THEN
    ALTER TABLE inventory_items ADD COLUMN sku TEXT;
  END IF;

  -- Reorder point (low stock alert threshold)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'reorder_point') THEN
    ALTER TABLE inventory_items ADD COLUMN reorder_point DECIMAL DEFAULT 0;
  END IF;

  -- Reorder quantity (how much to order)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'reorder_qty') THEN
    ALTER TABLE inventory_items ADD COLUMN reorder_qty DECIMAL;
  END IF;

  -- Unit cost (legacy column - kept for backwards compatibility)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'unit_cost') THEN
    ALTER TABLE inventory_items ADD COLUMN unit_cost DECIMAL;
  END IF;

  -- Cost per unit (app uses this column name)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'cost_per_unit') THEN
    ALTER TABLE inventory_items ADD COLUMN cost_per_unit DECIMAL;
  END IF;
END $$;

-- ============================================================================
-- STRAINS TABLE MIGRATIONS
-- Add species reference and variety/phenotype tracking
-- ============================================================================
DO $$
BEGIN
  -- Species ID reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strains' AND column_name = 'species_id') THEN
    ALTER TABLE strains ADD COLUMN species_id UUID REFERENCES species(id);
  END IF;

  -- Variety/Cultivar (e.g., "var. alba")
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strains' AND column_name = 'variety') THEN
    ALTER TABLE strains ADD COLUMN variety TEXT;
  END IF;

  -- Phenotype (e.g., "Albino", "Leucistic", "APE")
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strains' AND column_name = 'phenotype') THEN
    ALTER TABLE strains ADD COLUMN phenotype TEXT;
  END IF;

  -- Genetics source (vendor, trade, wild isolation)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strains' AND column_name = 'genetics_source') THEN
    ALTER TABLE strains ADD COLUMN genetics_source TEXT;
  END IF;

  -- Isolation type (multispore, clone, agar_isolation, spore_isolation, lc_isolation, unknown)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strains' AND column_name = 'isolation_type') THEN
    ALTER TABLE strains ADD COLUMN isolation_type TEXT CHECK (isolation_type IN ('multispore', 'clone', 'agar_isolation', 'spore_isolation', 'lc_isolation', 'unknown'));
  END IF;

  -- Generation from original (G0, G1, G2, etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strains' AND column_name = 'generation') THEN
    ALTER TABLE strains ADD COLUMN generation INTEGER DEFAULT 0;
  END IF;

  -- Geographic origin or breeder
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strains' AND column_name = 'origin') THEN
    ALTER TABLE strains ADD COLUMN origin TEXT;
  END IF;

  -- Detailed description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strains' AND column_name = 'description') THEN
    ALTER TABLE strains ADD COLUMN description TEXT;
  END IF;
END $$;

-- ============================================================================
-- SUBSTRATE_TYPES TABLE MIGRATIONS
-- Add code column if missing
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'substrate_types' AND column_name = 'code') THEN
    ALTER TABLE substrate_types ADD COLUMN code TEXT;
  END IF;
END $$;

-- ============================================================================
-- SPECIES TABLE MIGRATIONS
-- Add comprehensive growing parameters, substrate preferences, and characteristics
-- ============================================================================
DO $$
BEGIN
  -- Growing parameters (JSONB for flexibility)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'spawn_colonization') THEN
    ALTER TABLE species ADD COLUMN spawn_colonization JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'bulk_colonization') THEN
    ALTER TABLE species ADD COLUMN bulk_colonization JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'pinning') THEN
    ALTER TABLE species ADD COLUMN pinning JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'maturation') THEN
    ALTER TABLE species ADD COLUMN maturation JSONB;
  END IF;

  -- Substrate preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'preferred_substrates') THEN
    ALTER TABLE species ADD COLUMN preferred_substrates TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'substrate_notes') THEN
    ALTER TABLE species ADD COLUMN substrate_notes TEXT;
  END IF;

  -- Growing characteristics
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'difficulty') THEN
    ALTER TABLE species ADD COLUMN difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'characteristics') THEN
    ALTER TABLE species ADD COLUMN characteristics TEXT;
  END IF;

  -- Culinary/Usage info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'flavor_profile') THEN
    ALTER TABLE species ADD COLUMN flavor_profile TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'culinary_notes') THEN
    ALTER TABLE species ADD COLUMN culinary_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'medicinal_properties') THEN
    ALTER TABLE species ADD COLUMN medicinal_properties TEXT;
  END IF;

  -- Community knowledge
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'community_tips') THEN
    ALTER TABLE species ADD COLUMN community_tips TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'important_facts') THEN
    ALTER TABLE species ADD COLUMN important_facts TEXT;
  END IF;

  -- Yield expectations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'typical_yield') THEN
    ALTER TABLE species ADD COLUMN typical_yield TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'flush_count') THEN
    ALTER TABLE species ADD COLUMN flush_count TEXT;
  END IF;

  -- Shelf life
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'shelf_life_days_min') THEN
    ALTER TABLE species ADD COLUMN shelf_life_days_min INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'shelf_life_days_max') THEN
    ALTER TABLE species ADD COLUMN shelf_life_days_max INTEGER;
  END IF;

  -- Automation configuration (JSONB for IoT/sensor integration)
  -- Stores: requiredSensors, controllerTypes, alertConfig, dataCollection preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'automation_config') THEN
    ALTER TABLE species ADD COLUMN automation_config JSONB;
  END IF;

  -- Stage-specific notes (easily accessible TEXT fields for UI display)
  -- These provide human-readable guidance for each growth stage
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'spawn_colonization_notes') THEN
    ALTER TABLE species ADD COLUMN spawn_colonization_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'bulk_colonization_notes') THEN
    ALTER TABLE species ADD COLUMN bulk_colonization_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'pinning_notes') THEN
    ALTER TABLE species ADD COLUMN pinning_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'maturation_notes') THEN
    ALTER TABLE species ADD COLUMN maturation_notes TEXT;
  END IF;
END $$;

-- ============================================================================
-- DEFAULT SPECIES SEED DATA
-- Global species available to all users (user_id = NULL)
-- Comprehensive growing parameters based on community knowledge
-- All temperatures in Fahrenheit
-- ============================================================================

-- Check if we should seed species data
-- Only seed if there are fewer than 5 global species (first run or reset)
-- This prevents duplicate/conflict errors on re-runs
DO $$
DECLARE
  species_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO species_count FROM species WHERE user_id IS NULL;

  IF species_count >= 5 THEN
    RAISE NOTICE 'Species seed data skipped - % global species already exist', species_count;
    RETURN;
  END IF;

  -- Clear existing global species ONLY if not referenced by strains
  -- This prevents FK violation errors when strains reference these species
  DELETE FROM species
  WHERE user_id IS NULL
  AND id NOT IN (SELECT DISTINCT species_id FROM strains WHERE species_id IS NOT NULL);

  RAISE NOTICE 'Seeding species data...';
END $$;

-- Create partial unique index for global species (user_id IS NULL)
-- This allows ON CONFLICT DO NOTHING to work for seed data
CREATE UNIQUE INDEX IF NOT EXISTS species_name_global_unique
ON species (name) WHERE user_id IS NULL;

-- GOURMET SPECIES (will be skipped if species already exist due to unique index)
-- Pearl Oyster
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, spawn_colonization_notes, bulk_colonization_notes, pinning_notes, maturation_notes, notes, user_id)
VALUES (
  'Pearl Oyster', 'Pleurotus ostreatus',
  ARRAY['Oyster Mushroom', 'Tree Oyster', 'Hiratake'],
  'gourmet', 'beginner',
  '{
    "tempRange": {"min": 70, "max": 75, "optimal": 72, "warningLow": 65, "warningHigh": 80, "criticalLow": 60, "criticalHigh": 85, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 80, "warningHigh": 98, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 5000, "optimal": 2000, "warningHigh": 8000, "criticalHigh": 15000, "unit": "ppm"},
    "daysMin": 10, "daysMax": 21, "daysTypical": 14,
    "co2Tolerance": "moderate",
    "faeFrequency": "2x daily during colonization",
    "lightRequirement": "none",
    "lightSchedule": {"photoperiod": 0, "intensity": "low"},
    "transitionCriteria": {"minDays": 10, "maxDays": 21, "typicalDays": 14, "colonizationPercent": 100, "visualIndicators": ["fully white mycelium", "no visible grain"], "autoTransition": false, "transitionAlertDays": 2},
    "criticalParameters": ["temperature", "humidity"],
    "equipmentNotes": "Standard incubation chamber, minimal FAE needed"
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 75, "optimal": 70, "warningLow": 60, "warningHigh": 80, "criticalLow": 55, "criticalHigh": 85, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 80, "warningHigh": 98, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 2000, "optimal": 800, "warningHigh": 3000, "criticalHigh": 5000, "unit": "ppm"},
    "daysMin": 7, "daysMax": 14, "daysTypical": 10,
    "co2Tolerance": "low",
    "faeFrequency": "4x daily or continuous passive",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "low", "spectrum": "cool"},
    "transitionCriteria": {"minDays": 7, "maxDays": 14, "typicalDays": 10, "colonizationPercent": 100, "visualIndicators": ["substrate fully colonized", "pins forming at holes"], "autoTransition": false, "transitionAlertDays": 2},
    "criticalParameters": ["humidity", "co2", "fae"],
    "equipmentNotes": "Martha tent or fruiting chamber with FAE"
  }'::jsonb,
  '{
    "tempRange": {"min": 55, "max": 65, "optimal": 60, "warningLow": 50, "warningHigh": 70, "criticalLow": 45, "criticalHigh": 75, "rampRate": 1},
    "humidityRange": {"min": 85, "max": 95, "optimal": 92, "warningLow": 80, "warningHigh": 98, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 0, "max": 1000, "optimal": 500, "warningHigh": 1500, "criticalHigh": 2500, "unit": "ppm"},
    "daysMin": 3, "daysMax": 5, "daysTypical": 4,
    "co2Tolerance": "low",
    "faeFrequency": "6x daily or continuous",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 3, "maxDays": 5, "typicalDays": 4, "visualIndicators": ["primordia visible", "small pins 1-2cm"], "autoTransition": true, "transitionAlertDays": 1},
    "criticalParameters": ["humidity", "fae", "co2"],
    "equipmentNotes": "High humidity critical, increase FAE, drop temperature"
  }'::jsonb,
  '{
    "tempRange": {"min": 55, "max": 65, "optimal": 60, "warningLow": 50, "warningHigh": 70, "criticalLow": 45, "criticalHigh": 75, "rampRate": 1},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 80, "warningHigh": 98, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 0, "max": 1000, "optimal": 500, "warningHigh": 1500, "criticalHigh": 2500, "unit": "ppm"},
    "daysMin": 3, "daysMax": 5, "daysTypical": 4,
    "co2Tolerance": "low",
    "faeFrequency": "6x daily or continuous",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool"},
    "transitionCriteria": {"minDays": 3, "maxDays": 5, "typicalDays": 4, "visualIndicators": ["caps flattening", "edges uncurling", "gills visible"], "autoTransition": false, "transitionAlertDays": 1},
    "criticalParameters": ["humidity", "fae"],
    "equipmentNotes": "Harvest when cap edges still slightly curled"
  }'::jsonb,
  ARRAY['straw', 'hardwood sawdust', 'hardwood chips', 'cardboard', 'coffee grounds', 'paper', 'masters mix'],
  'Pasteurized straw is traditional and economical. Supplemented hardwood sawdust produces denser fruits. Can fruit on almost any cellulose-based material.',
  'Aggressive colonizer that outcompetes most contaminants. Fan-shaped clusters with gills running down short stem. Color varies from white to gray to brown.',
  'Mild, slightly anise-like when raw. Savory and earthy when cooked.',
  'Excellent sautéed with garlic and butter. Holds up well in soups and stir-fries. Can be dried for long-term storage.',
  'Spore load can be heavy during fruiting—ensure good ventilation. Harvest when cap edges are still slightly curled for best texture.',
  'Most forgiving species for beginners. Yields 1-2 lbs per 5lb block over 2-3 flushes.',
  '1-2 lbs per 5lb block', '2-3 flushes', 7, 10,
  '{
    "automationTested": true,
    "automationNotes": "Excellent species for automation due to forgiving nature. Tolerates parameter fluctuations well.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "light", "weight"],
    "controllerTypes": ["inkbird", "ac_infinity", "custom_arduino", "raspberry_pi"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 10,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 90
  }'::jsonb,
  'SPAWN COLONIZATION (70-75°F, 10-21 days): Inoculate grain spawn and keep at 72°F optimal. Store in dark, warm place. Minimal FAE needed—just check for contamination. Wait for complete colonization (fully white, no visible grain). Shake at 30% colonization to speed up.',
  'BULK COLONIZATION (65-75°F, 7-14 days): Transfer colonized spawn to bulk substrate. Maintain 70°F with higher humidity (85-95%). Begin introducing indirect light. Watch for primordia formation at air holes. Ready for fruiting when surface is fully colonized.',
  'PINNING (55-65°F, 3-5 days): Drop temperature to 60°F to trigger pinning. Increase FAE significantly—CO2 must stay below 1000ppm. High humidity (90%+) critical. Indirect light 12hr/day. Pins should appear within 3-5 days.',
  'MATURATION (55-65°F, 3-5 days): Maintain fruiting conditions. Harvest when cap edges are still slightly curled inward before they flatten. Twist and pull to harvest. Expect 1-2lbs per 5lb block. Second flush in 1-2 weeks after soaking.',
  'The most widely cultivated oyster mushroom worldwide. Fast colonizer, aggressive, forgiving for beginners.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Blue Oyster
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, notes, user_id)
VALUES (
  'Blue Oyster', 'Pleurotus columbinus',
  ARRAY['Blue Pearl'],
  'gourmet', 'beginner',
  '{
    "tempRange": {"min": 65, "max": 75, "optimal": 70, "warningLow": 60, "warningHigh": 78, "criticalLow": 55, "criticalHigh": 82, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 80, "warningHigh": 98, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 5000, "optimal": 2000, "warningHigh": 8000, "criticalHigh": 15000, "unit": "ppm"},
    "daysMin": 12, "daysMax": 21, "daysTypical": 16,
    "co2Tolerance": "moderate",
    "faeFrequency": "2x daily during colonization",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 12, "maxDays": 21, "typicalDays": 16, "colonizationPercent": 100, "visualIndicators": ["fully white mycelium"], "autoTransition": false},
    "criticalParameters": ["temperature", "humidity"],
    "equipmentNotes": "Standard incubation, tolerates cooler temps than most oysters"
  }'::jsonb,
  '{
    "tempRange": {"min": 60, "max": 70, "optimal": 65, "warningLow": 55, "warningHigh": 75, "criticalLow": 50, "criticalHigh": 80, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 80, "warningHigh": 98, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 2000, "optimal": 800, "warningHigh": 3000, "criticalHigh": 5000, "unit": "ppm"},
    "daysMin": 7, "daysMax": 14, "daysTypical": 10,
    "co2Tolerance": "low",
    "faeFrequency": "4x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "low", "spectrum": "cool"},
    "transitionCriteria": {"minDays": 7, "maxDays": 14, "typicalDays": 10, "visualIndicators": ["pins forming"]},
    "criticalParameters": ["humidity", "co2"],
    "equipmentNotes": "Benefits from cold shock to initiate pinning"
  }'::jsonb,
  '{
    "tempRange": {"min": 45, "max": 55, "optimal": 50, "warningLow": 40, "warningHigh": 60, "criticalLow": 35, "criticalHigh": 65, "rampRate": 1},
    "humidityRange": {"min": 85, "max": 95, "optimal": 92, "warningLow": 80, "warningHigh": 98, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 0, "max": 1000, "optimal": 500, "warningHigh": 1500, "criticalHigh": 2500, "unit": "ppm"},
    "daysMin": 3, "daysMax": 5, "daysTypical": 4,
    "co2Tolerance": "low",
    "faeFrequency": "continuous or 6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool"},
    "transitionCriteria": {"minDays": 3, "maxDays": 5, "visualIndicators": ["primordia developing", "pins 1-2cm"]},
    "criticalParameters": ["temperature", "humidity", "fae"],
    "equipmentNotes": "Prefers cold fruiting conditions"
  }'::jsonb,
  '{
    "tempRange": {"min": 45, "max": 65, "optimal": 55, "warningLow": 40, "warningHigh": 70, "criticalLow": 35, "criticalHigh": 75, "rampRate": 1},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 80, "warningHigh": 98, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 0, "max": 1000, "optimal": 500, "warningHigh": 1500, "criticalHigh": 2500, "unit": "ppm"},
    "daysMin": 4, "daysMax": 6, "daysTypical": 5,
    "co2Tolerance": "low",
    "faeFrequency": "continuous or 6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool"},
    "transitionCriteria": {"minDays": 4, "maxDays": 6, "visualIndicators": ["caps flattening", "blue-gray color developing"]},
    "criticalParameters": ["humidity", "fae"],
    "equipmentNotes": "Harvest when edges still curled for best color"
  }'::jsonb,
  ARRAY['straw', 'hardwood sawdust', 'hardwood chips', 'masters mix'],
  'Same substrates as Pearl Oyster. Excels in cooler conditions.',
  'Cold-tolerant oyster producing blue-gray caps that fade to gray-brown with age. Slightly firmer texture than pearl oyster.',
  'Mild, earthy flavor. Slightly firmer texture than pearl oyster.',
  'Excellent for unheated spaces, basements, and garages. Can fruit outdoors in fall/spring in temperate climates.',
  'Prefers cooler temperatures than most oysters. Harvest when edges still slightly curled.',
  'Best choice for cool-weather cultivation. Deep blue/steel gray caps when young.',
  '1-2 lbs per 5lb block', '2-3 flushes', 7, 10,
  '{
    "automationTested": true,
    "automationNotes": "Great for unheated spaces. Cold-tolerant, ideal for basement/garage setups without heating.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "light"],
    "controllerTypes": ["inkbird", "ac_infinity", "custom_arduino"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 10,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 90
  }'::jsonb,
  'Cold-tolerant oyster variety producing blue-gray caps. Popular commercial variety.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Pink Oyster
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, notes, user_id)
VALUES (
  'Pink Oyster', 'Pleurotus djamor',
  ARRAY['Flamingo Oyster', 'Salmon Oyster'],
  'gourmet', 'beginner',
  '{
    "tempRange": {"min": 75, "max": 85, "optimal": 80, "warningLow": 70, "warningHigh": 88, "criticalLow": 40, "criticalHigh": 95, "rampRate": 2},
    "humidityRange": {"min": 80, "max": 90, "optimal": 85, "warningLow": 75, "warningHigh": 95, "criticalLow": 65, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 5000, "optimal": 2000, "warningHigh": 8000, "criticalHigh": 15000, "unit": "ppm"},
    "daysMin": 7, "daysMax": 14, "daysTypical": 10,
    "co2Tolerance": "moderate",
    "faeFrequency": "2x daily",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 7, "maxDays": 14, "typicalDays": 10, "colonizationPercent": 100, "visualIndicators": ["fully colonized", "pink tinge visible"], "autoTransition": false, "transitionAlertDays": 2},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "CRITICAL: Keep above 40°F at ALL times. Use heating mat if needed. Dies below 40°F."
  }'::jsonb,
  '{
    "tempRange": {"min": 75, "max": 85, "optimal": 80, "warningLow": 70, "warningHigh": 88, "criticalLow": 40, "criticalHigh": 95, "rampRate": 2},
    "humidityRange": {"min": 80, "max": 90, "optimal": 85, "warningLow": 75, "warningHigh": 95, "criticalLow": 65, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 2000, "optimal": 800, "warningHigh": 3000, "criticalHigh": 5000, "unit": "ppm"},
    "daysMin": 5, "daysMax": 10, "daysTypical": 7,
    "co2Tolerance": "low",
    "faeFrequency": "4x daily or continuous",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "warm"},
    "transitionCriteria": {"minDays": 5, "maxDays": 10, "typicalDays": 7, "visualIndicators": ["pins forming rapidly"]},
    "criticalParameters": ["temperature", "humidity"],
    "equipmentNotes": "Fastest fruiting oyster. Keep warm."
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 80, "optimal": 75, "warningLow": 55, "warningHigh": 85, "criticalLow": 40, "criticalHigh": 90, "rampRate": 2},
    "humidityRange": {"min": 80, "max": 90, "optimal": 85, "warningLow": 75, "warningHigh": 95, "criticalLow": 65, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 1000, "optimal": 500, "warningHigh": 1500, "criticalHigh": 2500, "unit": "ppm"},
    "daysMin": 2, "daysMax": 3, "daysTypical": 2,
    "co2Tolerance": "low",
    "faeFrequency": "6x daily or continuous",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "warm"},
    "transitionCriteria": {"minDays": 2, "maxDays": 3, "visualIndicators": ["primordia developing rapidly", "pink color intensifying"], "autoTransition": true},
    "criticalParameters": ["temperature", "humidity"],
    "equipmentNotes": "Very fast development. Monitor closely."
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 85, "optimal": 75, "warningLow": 55, "warningHigh": 88, "criticalLow": 40, "criticalHigh": 95, "rampRate": 2},
    "humidityRange": {"min": 80, "max": 90, "optimal": 85, "warningLow": 75, "warningHigh": 95, "criticalLow": 65, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 1000, "optimal": 500, "warningHigh": 1500, "criticalHigh": 2500, "unit": "ppm"},
    "daysMin": 2, "daysMax": 3, "daysTypical": 2,
    "co2Tolerance": "low",
    "faeFrequency": "continuous",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "warm"},
    "transitionCriteria": {"minDays": 2, "maxDays": 3, "visualIndicators": ["caps fully developed", "bright pink color", "edges slightly curled"]},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Harvest immediately when ready. Very short shelf life."
  }'::jsonb,
  ARRAY['straw', 'hardwood sawdust', 'coffee grounds', 'masters mix'],
  'Thrives in warm conditions. Does not tolerate cold.',
  'Stunning bright pink coloration. Tropical species that dies below 40°F. Fastest fruiting oyster.',
  'Delicate, bacon-like flavor when sautéed. Color fades significantly when cooked.',
  'Best cooked hot and fast. Excellent in stir-fries. Very short shelf life—use immediately after harvest.',
  'CRITICAL: Dies below 40°F—NEVER refrigerate spawn or cultures. Aggressive colonizer, good for beginners in warm climates.',
  'Fastest fruiting oyster (3-5 days from pins to harvest). Beautiful but ephemeral.',
  '0.75-1.5 lbs per 5lb block', '2-3 flushes', 2, 4,
  '{
    "automationTested": true,
    "automationNotes": "CRITICAL: Temperature must NEVER drop below 40°F or mycelium dies. Requires heating in cold climates. Fastest fruiting oyster - tight monitoring needed.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2"],
    "controllerTypes": ["inkbird", "ac_infinity"],
    "alertOnTempDeviation": 3,
    "alertOnHumidityDeviation": 8,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 180,
    "dataRetentionDays": 60
  }'::jsonb,
  'Tropical species with stunning pink coloration. Needs warmth, dies below 40°F.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Golden Oyster
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, notes, user_id)
VALUES (
  'Golden Oyster', 'Pleurotus citrinopileatus',
  ARRAY['Yellow Oyster', 'Tamogitake'],
  'gourmet', 'beginner',
  '{
    "tempRange": {"min": 70, "max": 80, "optimal": 75, "warningLow": 65, "warningHigh": 83, "criticalLow": 45, "criticalHigh": 90, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 5000, "optimal": 2000, "warningHigh": 8000, "criticalHigh": 15000, "unit": "ppm"},
    "daysMin": 10, "daysMax": 14, "daysTypical": 12,
    "co2Tolerance": "moderate",
    "faeFrequency": "2x daily",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 10, "maxDays": 14, "typicalDays": 12, "colonizationPercent": 100, "visualIndicators": ["fully colonized"], "autoTransition": false},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Cold sensitive like pink oyster but more tolerant. Do not refrigerate spawn."
  }'::jsonb,
  '{
    "tempRange": {"min": 70, "max": 80, "optimal": 75, "warningLow": 65, "warningHigh": 83, "criticalLow": 50, "criticalHigh": 88, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 2000, "optimal": 800, "warningHigh": 3000, "criticalHigh": 5000, "unit": "ppm"},
    "daysMin": 5, "daysMax": 10, "daysTypical": 7,
    "co2Tolerance": "low",
    "faeFrequency": "4x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "warm"},
    "transitionCriteria": {"minDays": 5, "maxDays": 10, "typicalDays": 7, "visualIndicators": ["pins forming"]},
    "criticalParameters": ["humidity", "co2"],
    "equipmentNotes": "Introduce light and FAE to trigger pinning"
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 80, "optimal": 72, "warningLow": 60, "warningHigh": 83, "criticalLow": 50, "criticalHigh": 88, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 90, "optimal": 88, "warningLow": 80, "warningHigh": 95, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 1000, "optimal": 500, "warningHigh": 1500, "criticalHigh": 2500, "unit": "ppm"},
    "daysMin": 2, "daysMax": 4, "daysTypical": 3,
    "co2Tolerance": "low",
    "faeFrequency": "6x daily or continuous",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "warm"},
    "transitionCriteria": {"minDays": 2, "maxDays": 4, "visualIndicators": ["primordia visible", "yellow color developing"]},
    "criticalParameters": ["humidity", "fae"],
    "equipmentNotes": "High humidity and FAE critical for pin development"
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 85, "optimal": 75, "warningLow": 60, "warningHigh": 88, "criticalLow": 50, "criticalHigh": 90, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 1000, "optimal": 500, "warningHigh": 1500, "criticalHigh": 2500, "unit": "ppm"},
    "daysMin": 3, "daysMax": 4, "daysTypical": 3,
    "co2Tolerance": "low",
    "faeFrequency": "continuous",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "warm"},
    "transitionCriteria": {"minDays": 3, "maxDays": 4, "visualIndicators": ["bright yellow clusters", "caps developing"]},
    "criticalParameters": ["humidity"],
    "equipmentNotes": "Harvest promptly. Turns bitter when old."
  }'::jsonb,
  ARRAY['hardwood sawdust', 'straw', 'masters mix'],
  'Similar to pink oyster. Does not tolerate cold storage.',
  'Beautiful bright yellow clusters. Delicate, handle carefully. More delicate than other oysters.',
  'Nutty, cashew-like flavor. Can turn bitter or ammonia-scented when old.',
  'MUST be sautéed thoroughly—bitter if undercooked. Great for Asian cuisine.',
  'Like pink oyster, sensitive to cold—do not refrigerate spawn. Harvest promptly for best flavor.',
  'Fruits in dense clusters. Short shelf life (3-5 days).',
  '0.75-1.5 lbs per 5lb block', '2-3 flushes', 3, 5,
  '{
    "automationTested": true,
    "automationNotes": "Cold sensitive - do not refrigerate spawn. Short shelf life requires prompt harvesting. Use harvest weight sensors if available.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "weight"],
    "controllerTypes": ["inkbird", "ac_infinity"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 8,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 60
  }'::jsonb,
  'Beautiful bright yellow clusters with delicate, nutty, cashew-like flavor. Sensitive to cold.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- King Oyster
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, notes, user_id)
VALUES (
  'King Oyster', 'Pleurotus eryngii',
  ARRAY['King Trumpet', 'French Horn Mushroom', 'Eryngii', 'Trumpet Royale'],
  'gourmet', 'intermediate',
  '{
    "tempRange": {"min": 70, "max": 75, "optimal": 72, "warningLow": 65, "warningHigh": 78, "criticalLow": 60, "criticalHigh": 82, "rampRate": 1},
    "humidityRange": {"min": 80, "max": 90, "optimal": 85, "warningLow": 75, "warningHigh": 95, "criticalLow": 65, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 8000, "optimal": 4000, "warningHigh": 12000, "criticalHigh": 20000, "unit": "ppm"},
    "daysMin": 14, "daysMax": 28, "daysTypical": 21,
    "co2Tolerance": "moderate",
    "faeFrequency": "1x daily during colonization",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 14, "maxDays": 28, "typicalDays": 21, "colonizationPercent": 100, "visualIndicators": ["fully colonized", "substrate browning"], "autoTransition": false, "transitionAlertDays": 3},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Longer colonization than other oysters. Patience required."
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 75, "optimal": 70, "warningLow": 60, "warningHigh": 78, "criticalLow": 55, "criticalHigh": 82, "rampRate": 1},
    "humidityRange": {"min": 80, "max": 90, "optimal": 85, "warningLow": 75, "warningHigh": 95, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 6000, "optimal": 3000, "warningHigh": 10000, "criticalHigh": 15000, "unit": "ppm"},
    "daysMin": 10, "daysMax": 18, "daysTypical": 14,
    "co2Tolerance": "moderate",
    "faeFrequency": "2x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "low", "spectrum": "cool", "dawnDuskRamp": 15},
    "transitionCriteria": {"minDays": 10, "maxDays": 18, "typicalDays": 14, "colonizationPercent": 100, "visualIndicators": ["fully consolidated", "primordia forming"], "autoTransition": true, "transitionAlertDays": 2, "tempTransitionHours": 24, "humidityTransitionHours": 12},
    "criticalParameters": ["temperature", "humidity"],
    "equipmentNotes": "Bulk colonization complete when fully white. Watch for primordia formation."
  }'::jsonb,
  '{
    "tempRange": {"min": 55, "max": 65, "optimal": 60, "warningLow": 50, "warningHigh": 68, "criticalLow": 45, "criticalHigh": 72, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 80, "warningHigh": 98, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 400, "max": 1000, "optimal": 600, "warningHigh": 1500, "criticalHigh": 2000, "unit": "ppm"},
    "daysMin": 4, "daysMax": 6, "daysTypical": 5,
    "co2Tolerance": "moderate",
    "faeFrequency": "4-6x daily or continuous low",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 4, "maxDays": 6, "typicalDays": 5, "visualIndicators": ["pins visible", "primordia developing"], "autoTransition": true, "transitionAlertDays": 1, "tempTransitionHours": 12},
    "criticalParameters": ["temperature", "humidity", "co2", "fae"],
    "equipmentNotes": "Temperature drop critical for pinning. King oysters pin individually, not in clusters."
  }'::jsonb,
  '{
    "tempRange": {"min": 55, "max": 65, "optimal": 60, "warningLow": 50, "warningHigh": 68, "criticalLow": 45, "criticalHigh": 72, "rampRate": 1},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 80, "warningHigh": 98, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 400, "max": 1200, "optimal": 800, "warningHigh": 2000, "criticalHigh": 3000, "unit": "ppm"},
    "daysMin": 5, "daysMax": 8, "daysTypical": 6,
    "co2Tolerance": "moderate",
    "faeFrequency": "4-6x daily or continuous low",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 5, "maxDays": 8, "typicalDays": 6, "visualIndicators": ["caps flattening", "stems thickening", "gills exposed"], "autoTransition": false, "transitionAlertDays": 1},
    "criticalParameters": ["humidity", "co2", "fae"],
    "equipmentNotes": "Harvest when caps flatten. Stems are the prize - thick and meaty."
  }'::jsonb,
  ARRAY['supplemented hardwood sawdust', 'masters mix'],
  'Requires supplemented sawdust (10-20% wheat bran). Pure straw does not work well.',
  'Premium gourmet with thick, meaty stems. Individual fruits rather than clusters. Longer grow cycle than other oysters.',
  'Mild, umami-rich. Excellent meaty texture.',
  'Stems are the prize—harvest when caps flatten. Excellent seared, grilled, or sliced into steaks.',
  'Tolerates higher CO2 than other oysters. Requires good nutrition (supplementation) for best results.',
  'Worth the longer wait. Excellent shelf life (10-14 days).',
  '0.75-1 lb per 5lb block', '2-3 flushes', 10, 14,
  '{
    "automationTested": false,
    "automationNotes": "Individual fruiting pattern differs from cluster oysters. May require different harvest detection.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "light", "camera"],
    "controllerTypes": ["climate controller", "humidifier", "exhaust fan", "lighting timer"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 10,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 365
  }'::jsonb,
  'Premium gourmet mushroom with thick, meaty stems prized for texture. Requires supplementation.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Phoenix Oyster
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, notes, user_id)
VALUES (
  'Phoenix Oyster', 'Pleurotus pulmonarius',
  ARRAY['Lung Oyster', 'Indian Oyster', 'Italian Oyster', 'Summer Oyster'],
  'gourmet', 'beginner',
  '{
    "tempRange": {"min": 75, "max": 80, "optimal": 77, "warningLow": 70, "warningHigh": 85, "criticalLow": 65, "criticalHigh": 90, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 80, "warningHigh": 98, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 10000, "optimal": 5000, "warningHigh": 15000, "criticalHigh": 20000, "unit": "ppm"},
    "daysMin": 10, "daysMax": 18, "daysTypical": 14,
    "co2Tolerance": "moderate",
    "faeFrequency": "1x daily during colonization",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 10, "maxDays": 18, "typicalDays": 14, "colonizationPercent": 100, "visualIndicators": ["fully colonized", "mycelium consolidating"], "autoTransition": true, "transitionAlertDays": 2},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Heat-tolerant species. Colonizes well at higher temps than other oysters."
  }'::jsonb,
  '{
    "tempRange": {"min": 70, "max": 80, "optimal": 75, "warningLow": 65, "warningHigh": 85, "criticalLow": 60, "criticalHigh": 90, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 80, "warningHigh": 98, "criticalLow": 75, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 2000, "optimal": 1000, "warningHigh": 3000, "criticalHigh": 5000, "unit": "ppm"},
    "daysMin": 7, "daysMax": 12, "daysTypical": 9,
    "co2Tolerance": "low",
    "faeFrequency": "4-6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "low", "spectrum": "cool", "dawnDuskRamp": 15},
    "transitionCriteria": {"minDays": 7, "maxDays": 12, "typicalDays": 9, "colonizationPercent": 100, "visualIndicators": ["primordia forming", "knots visible"], "autoTransition": true, "transitionAlertDays": 2, "tempTransitionHours": 12},
    "criticalParameters": ["temperature", "humidity", "co2"],
    "equipmentNotes": "Excellent summer species. Tolerates higher ambient temps."
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 80, "optimal": 72, "warningLow": 60, "warningHigh": 85, "criticalLow": 55, "criticalHigh": 90, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 80, "warningHigh": 98, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 400, "max": 1000, "optimal": 600, "warningHigh": 1500, "criticalHigh": 2500, "unit": "ppm"},
    "daysMin": 3, "daysMax": 5, "daysTypical": 4,
    "co2Tolerance": "low",
    "faeFrequency": "continuous or 6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 3, "maxDays": 5, "typicalDays": 4, "visualIndicators": ["pins elongating", "cap edges visible"], "autoTransition": true, "transitionAlertDays": 1},
    "criticalParameters": ["humidity", "co2", "fae"],
    "equipmentNotes": "Fast pinning. Responds quickly to environmental triggers."
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 85, "optimal": 75, "warningLow": 60, "warningHigh": 88, "criticalLow": 55, "criticalHigh": 92, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 80, "warningHigh": 98, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 400, "max": 1200, "optimal": 800, "warningHigh": 2000, "criticalHigh": 3000, "unit": "ppm"},
    "daysMin": 3, "daysMax": 5, "daysTypical": 4,
    "co2Tolerance": "low",
    "faeFrequency": "continuous or 6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 3, "maxDays": 5, "typicalDays": 4, "visualIndicators": ["caps flattening", "gills visible", "cap edges curling up"], "autoTransition": false, "transitionAlertDays": 1},
    "criticalParameters": ["humidity", "co2", "fae"],
    "equipmentNotes": "Harvest before caps fully flatten. More delicate than P. ostreatus."
  }'::jsonb,
  ARRAY['straw', 'hardwood sawdust', 'masters mix'],
  'Responds well to straw. Similar cultivation to pearl oyster.',
  'Heat-tolerant oyster ideal for summer growing. Slightly thinner caps, more delicate than P. ostreatus.',
  'Mild, delicate flavor similar to pearl oyster.',
  'Good choice when ambient temps exceed 70°F. Often lighter colored than P. ostreatus.',
  'Fast colonizer with similar aggressive characteristics to other oysters. Excels in warm conditions.',
  'Best summer oyster variety. Tolerates 65-85°F fruiting temps.',
  '1-2 lbs per 5lb block', '2-3 flushes', 5, 8,
  '{
    "automationTested": false,
    "automationNotes": "Excellent summer species for warm climates. More temperature tolerant than other oysters.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "light"],
    "controllerTypes": ["climate controller", "humidifier", "exhaust fan"],
    "alertOnTempDeviation": 8,
    "alertOnHumidityDeviation": 10,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 180
  }'::jsonb,
  'Heat-tolerant oyster ideal for summer growing. Good choice when ambient temps exceed 70°F.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Lion's Mane
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  medicinal_properties, community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, notes, user_id)
VALUES (
  'Lion''s Mane', 'Hericium erinaceus',
  ARRAY['Monkey Head', 'Bearded Tooth', 'Pom Pom', 'Satyr''s Beard', 'Hedgehog Mushroom'],
  'gourmet', 'intermediate',
  '{
    "tempRange": {"min": 70, "max": 75, "optimal": 72, "warningLow": 65, "warningHigh": 78, "criticalLow": 60, "criticalHigh": 82, "rampRate": 1},
    "humidityRange": {"min": 90, "max": 95, "optimal": 92, "warningLow": 85, "warningHigh": 98, "criticalLow": 80, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 0, "max": 5000, "optimal": 2500, "warningHigh": 8000, "criticalHigh": 12000, "unit": "ppm"},
    "daysMin": 14, "daysMax": 21, "daysTypical": 17,
    "co2Tolerance": "low",
    "faeFrequency": "2x daily during colonization",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 14, "maxDays": 21, "typicalDays": 17, "colonizationPercent": 100, "visualIndicators": ["fully colonized", "mycelium thick and ropy"], "autoTransition": true, "transitionAlertDays": 3},
    "criticalParameters": ["temperature", "humidity"],
    "equipmentNotes": "Slower colonizer than oysters. Requires patience and high humidity throughout."
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 75, "optimal": 70, "warningLow": 60, "warningHigh": 78, "criticalLow": 55, "criticalHigh": 82, "rampRate": 1},
    "humidityRange": {"min": 90, "max": 95, "optimal": 92, "warningLow": 85, "warningHigh": 98, "criticalLow": 80, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 0, "max": 2000, "optimal": 1000, "warningHigh": 3000, "criticalHigh": 5000, "unit": "ppm"},
    "daysMin": 10, "daysMax": 16, "daysTypical": 12,
    "co2Tolerance": "low",
    "faeFrequency": "4-6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "low", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 10, "maxDays": 16, "typicalDays": 12, "colonizationPercent": 100, "visualIndicators": ["primordia bumps visible", "surface texture changing"], "autoTransition": true, "transitionAlertDays": 2, "tempTransitionHours": 24, "humidityTransitionHours": 6},
    "criticalParameters": ["humidity", "co2", "temperature"],
    "equipmentNotes": "Very sensitive to low humidity. Browning indicates humidity too low."
  }'::jsonb,
  '{
    "tempRange": {"min": 60, "max": 70, "optimal": 65, "warningLow": 55, "warningHigh": 73, "criticalLow": 50, "criticalHigh": 78, "rampRate": 2},
    "humidityRange": {"min": 90, "max": 95, "optimal": 93, "warningLow": 88, "warningHigh": 98, "criticalLow": 85, "criticalHigh": 100, "rampRate": 2},
    "co2Range": {"min": 400, "max": 800, "optimal": 500, "warningHigh": 1000, "criticalHigh": 1500, "unit": "ppm"},
    "daysMin": 3, "daysMax": 5, "daysTypical": 4,
    "co2Tolerance": "low",
    "faeFrequency": "continuous or 8x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 3, "maxDays": 5, "typicalDays": 4, "visualIndicators": ["teeth/spines beginning to form", "white pom-pom shape visible"], "autoTransition": true, "transitionAlertDays": 1},
    "criticalParameters": ["humidity", "co2", "fae"],
    "equipmentNotes": "VERY CO2 SENSITIVE. Must maintain excellent air exchange. Browning = humidity problem."
  }'::jsonb,
  '{
    "tempRange": {"min": 60, "max": 70, "optimal": 65, "warningLow": 55, "warningHigh": 73, "criticalLow": 50, "criticalHigh": 78, "rampRate": 1},
    "humidityRange": {"min": 90, "max": 95, "optimal": 93, "warningLow": 88, "warningHigh": 98, "criticalLow": 85, "criticalHigh": 100, "rampRate": 2},
    "co2Range": {"min": 400, "max": 800, "optimal": 500, "warningHigh": 1000, "criticalHigh": 1500, "unit": "ppm"},
    "daysMin": 4, "daysMax": 7, "daysTypical": 5,
    "co2Tolerance": "low",
    "faeFrequency": "continuous or 8x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 4, "maxDays": 7, "typicalDays": 5, "visualIndicators": ["spines 0.5-1cm long", "bright white color", "before any yellowing"], "autoTransition": false, "transitionAlertDays": 1},
    "criticalParameters": ["humidity", "co2", "fae"],
    "equipmentNotes": "Harvest when spines are 0.5-1cm BEFORE browning. Yellow/brown = past prime."
  }'::jsonb,
  ARRAY['supplemented hardwood sawdust', 'masters mix'],
  'Requires supplemented hardwood sawdust (15-20% bran). Masters mix works well.',
  'Unique appearance with cascading white spines. No caps—forms single globular mass with teeth. Turning yellow/brown indicates age or low humidity.',
  'Lobster/crab-like flavor and texture. Exceptional culinary mushroom.',
  'Excellent seafood substitute. Tear into pieces and sear in butter. Great in pasta, risotto, or as crab cake alternative.',
  'Studied for nerve growth factor (NGF) stimulation. Contains hericenones and erinacines.',
  'HIGH HUMIDITY CRITICAL (90-95%). Does not tolerate CO2 buildup well. Heavy FAE needed.',
  'Harvest when spines are 0.5-1cm, before browning.',
  '0.5-1 lb per 5lb block', '2-3 flushes', 5, 7,
  '{
    "automationTested": false,
    "automationNotes": "Extremely humidity and CO2 sensitive. Requires robust humidity control and excellent FAE. Yellowing/browning is first sign of problems.",
    "requiredSensors": ["temperature", "humidity", "co2"],
    "optionalSensors": ["light", "camera"],
    "controllerTypes": ["climate controller", "humidifier", "exhaust fan", "intake fan", "lighting timer"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 5,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 180,
    "dataRetentionDays": 365
  }'::jsonb,
  'Unique appearance with cascading white spines. Both culinary and medicinal. Lobster-like flavor.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Shiitake
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  medicinal_properties, community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, notes, user_id)
VALUES (
  'Shiitake', 'Lentinula edodes',
  ARRAY['Black Forest Mushroom', 'Oak Mushroom', 'Donko', 'Shanku'],
  'gourmet', 'intermediate',
  '{
    "tempRange": {"min": 70, "max": 75, "optimal": 72, "warningLow": 65, "warningHigh": 80, "criticalLow": 60, "criticalHigh": 85, "rampRate": 1},
    "humidityRange": {"min": 80, "max": 90, "optimal": 85, "warningLow": 75, "warningHigh": 95, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 10000, "optimal": 5000, "warningHigh": 15000, "criticalHigh": 20000, "unit": "ppm"},
    "daysMin": 30, "daysMax": 60, "daysTypical": 45,
    "co2Tolerance": "moderate",
    "faeFrequency": "1x daily during colonization",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 30, "maxDays": 60, "typicalDays": 45, "colonizationPercent": 100, "visualIndicators": ["fully colonized", "brown-out beginning", "popcorning/bumps on surface"], "autoTransition": false, "transitionAlertDays": 7},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Long colonization 30-60 days on blocks, 60-120 days on logs. Watch for brown-out phase.",
    "notes": "60-120 days on logs"
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 75, "optimal": 70, "warningLow": 60, "warningHigh": 80, "criticalLow": 55, "criticalHigh": 85, "rampRate": 1},
    "humidityRange": {"min": 80, "max": 90, "optimal": 85, "warningLow": 75, "warningHigh": 95, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 8000, "optimal": 4000, "warningHigh": 12000, "criticalHigh": 18000, "unit": "ppm"},
    "daysMin": 14, "daysMax": 30, "daysTypical": 21,
    "co2Tolerance": "moderate",
    "faeFrequency": "2x daily",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 14, "maxDays": 30, "typicalDays": 21, "colonizationPercent": 100, "visualIndicators": ["brown-out complete", "surface turned brown", "popcorn texture visible"], "autoTransition": false, "transitionAlertDays": 5},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Brown-out phase critical. Block turns brown when ready. Do not mistake for contamination.",
    "notes": "Brown-out phase critical"
  }'::jsonb,
  '{
    "tempRange": {"min": 50, "max": 60, "optimal": 55, "warningLow": 45, "warningHigh": 65, "criticalLow": 40, "criticalHigh": 70, "rampRate": 5},
    "humidityRange": {"min": 80, "max": 90, "optimal": 85, "warningLow": 75, "warningHigh": 95, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 400, "max": 1500, "optimal": 800, "warningHigh": 2500, "criticalHigh": 4000, "unit": "ppm"},
    "daysMin": 5, "daysMax": 10, "daysTypical": 7,
    "co2Tolerance": "moderate",
    "faeFrequency": "4-6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 5, "maxDays": 10, "typicalDays": 7, "visualIndicators": ["pins emerging", "primordia visible", "small bumps developing caps"], "autoTransition": true, "transitionAlertDays": 2, "tempTransitionHours": 48},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "REQUIRES COLD SHOCK (50°F for 24-72 hrs) or soaking to initiate pins. Critical step.",
    "notes": "Requires cold shock"
  }'::jsonb,
  '{
    "tempRange": {"min": 55, "max": 70, "optimal": 62, "warningLow": 50, "warningHigh": 75, "criticalLow": 45, "criticalHigh": 80, "rampRate": 2},
    "humidityRange": {"min": 80, "max": 90, "optimal": 85, "warningLow": 75, "warningHigh": 95, "criticalLow": 70, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 400, "max": 1500, "optimal": 800, "warningHigh": 2500, "criticalHigh": 4000, "unit": "ppm"},
    "daysMin": 5, "daysMax": 8, "daysTypical": 6,
    "co2Tolerance": "moderate",
    "faeFrequency": "4-6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 5, "maxDays": 8, "typicalDays": 6, "visualIndicators": ["veil breaking", "gills exposed", "caps flattening"], "autoTransition": false, "transitionAlertDays": 1},
    "criticalParameters": ["humidity"],
    "equipmentNotes": "Harvest before caps fully flatten. Multiple flushes possible (3-5)."
  }'::jsonb,
  ARRAY['supplemented hardwood sawdust', 'oak logs', 'hardwood logs'],
  'Oak/hardwood logs (traditional, 60-120 day colonization) or supplemented hardwood sawdust blocks (faster, 30-60 days).',
  'Second most cultivated mushroom worldwide. Brown-out phase critical—fully colonized blocks turn brown before fruiting.',
  'Rich umami flavor. Different grades: donko (cold-weather, thick, cracked caps—premium), koshin (thin caps, warm weather).',
  'Excellent dried. Rehydrates well. Essential in Asian cuisine.',
  'Contains lentinan (beta-glucan) studied in cancer research. AHCC extract derived from shiitake mycelium.',
  'Requires cold shock (50°F for 24-72 hrs) or soaking to initiate pins. Patience rewarded.',
  'Longer colonization than oysters but worth the wait. Excellent shelf life.',
  '0.5-1 lb per 5lb block', '3-5 flushes', 14, 21,
  '{
    "automationTested": false,
    "automationNotes": "Unique cold shock requirement for pinning. Automation must include refrigeration capability or cold room. Brown-out phase may confuse visual detection systems.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "light", "camera"],
    "controllerTypes": ["climate controller", "humidifier", "exhaust fan", "refrigeration unit", "lighting timer"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 10,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 365
  }'::jsonb,
  'Second most cultivated mushroom worldwide. Rich umami flavor. Requires longer colonization, rewards patience.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Maitake
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  medicinal_properties, community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, notes, user_id)
VALUES (
  'Maitake', 'Grifola frondosa',
  ARRAY['Hen of the Woods', 'Dancing Mushroom', 'Sheep''s Head', 'Ram''s Head'],
  'gourmet', 'advanced',
  '{
    "tempRange": {"min": 70, "max": 75, "optimal": 72, "warningLow": 65, "warningHigh": 78, "criticalLow": 60, "criticalHigh": 82, "rampRate": 1},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 0, "max": 8000, "optimal": 4000, "warningHigh": 12000, "criticalHigh": 18000, "unit": "ppm"},
    "daysMin": 30, "daysMax": 60, "daysTypical": 45,
    "co2Tolerance": "moderate",
    "faeFrequency": "1x daily during colonization",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 30, "maxDays": 60, "typicalDays": 45, "colonizationPercent": 100, "visualIndicators": ["fully colonized", "mycelium consolidating"], "autoTransition": false, "transitionAlertDays": 7},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Very long colonization. Patience critical. May take multiple attempts."
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 75, "optimal": 70, "warningLow": 60, "warningHigh": 78, "criticalLow": 55, "criticalHigh": 82, "rampRate": 1},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 0, "max": 5000, "optimal": 2500, "warningHigh": 8000, "criticalHigh": 12000, "unit": "ppm"},
    "daysMin": 20, "daysMax": 40, "daysTypical": 30,
    "co2Tolerance": "moderate",
    "faeFrequency": "2-4x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "low", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 20, "maxDays": 40, "typicalDays": 30, "colonizationPercent": 100, "visualIndicators": ["surface texture changing", "primordia bumps"], "autoTransition": false, "transitionAlertDays": 5, "tempTransitionHours": 48},
    "criticalParameters": ["temperature", "humidity"],
    "equipmentNotes": "Light cycles important. Gradual temp drop helps initiate fruiting."
  }'::jsonb,
  '{
    "tempRange": {"min": 55, "max": 65, "optimal": 60, "warningLow": 50, "warningHigh": 68, "criticalLow": 45, "criticalHigh": 72, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 400, "max": 1500, "optimal": 800, "warningHigh": 2500, "criticalHigh": 4000, "unit": "ppm"},
    "daysMin": 7, "daysMax": 14, "daysTypical": 10,
    "co2Tolerance": "low",
    "faeFrequency": "6x daily or continuous",
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 60},
    "transitionCriteria": {"minDays": 7, "maxDays": 14, "typicalDays": 10, "visualIndicators": ["rosette formation beginning", "fronds developing"], "autoTransition": true, "transitionAlertDays": 2},
    "criticalParameters": ["temperature", "humidity", "light", "co2"],
    "equipmentNotes": "12hr light cycle CRITICAL. Temperature drop to 55-65°F required."
  }'::jsonb,
  '{
    "tempRange": {"min": 55, "max": 65, "optimal": 60, "warningLow": 50, "warningHigh": 68, "criticalLow": 45, "criticalHigh": 72, "rampRate": 1},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 400, "max": 1500, "optimal": 800, "warningHigh": 2500, "criticalHigh": 4000, "unit": "ppm"},
    "daysMin": 7, "daysMax": 14, "daysTypical": 10,
    "co2Tolerance": "low",
    "faeFrequency": "6x daily or continuous",
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 60},
    "transitionCriteria": {"minDays": 7, "maxDays": 14, "typicalDays": 10, "visualIndicators": ["fronds mature", "caps firm", "edges curling slightly"], "autoTransition": false, "transitionAlertDays": 2},
    "criticalParameters": ["humidity", "co2"],
    "equipmentNotes": "Can reach several pounds per cluster. Harvest when fronds are firm."
  }'::jsonb,
  ARRAY['supplemented hardwood sawdust', 'oak sawdust'],
  'Oak preferred. Challenging indoor cultivation—easier on buried logs/stumps outdoors.',
  'Large polypore clusters prized for rich umami. Forms large rosettes with overlapping gray-brown caps.',
  'Rich, earthy, umami flavor. One of the most flavorful gourmet mushrooms.',
  'Can reach several pounds per cluster. Excellent sautéed, roasted, or in soups.',
  'Beta-glucan rich (D-fraction). Studied for immune support, blood sugar regulation.',
  'Needs 12hr light cycles and temperature drop to initiate fruiting. Indoor blocks may take multiple attempts.',
  'Challenging for beginners. Often takes 2+ years on logs outdoors.',
  '1-3 lbs per large block', '1-2 flushes', 7, 10,
  '{
    "automationTested": false,
    "automationNotes": "Advanced species. Requires precise light cycle control (12hr on/off) and temperature drop capability. May take multiple attempts even with perfect conditions.",
    "requiredSensors": ["temperature", "humidity", "light"],
    "optionalSensors": ["co2", "camera", "weight"],
    "controllerTypes": ["climate controller", "humidifier", "exhaust fan", "lighting timer", "temperature controller"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 8,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 365
  }'::jsonb,
  'Large cluster-forming polypore. Both culinary and medicinal value. Challenging indoor cultivation.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Enoki
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, notes, user_id)
VALUES (
  'Enoki', 'Flammulina velutipes',
  ARRAY['Enokitake', 'Golden Needle', 'Velvet Foot', 'Winter Mushroom'],
  'gourmet', 'advanced',
  '{
    "tempRange": {"min": 70, "max": 75, "optimal": 72, "warningLow": 65, "warningHigh": 78, "criticalLow": 60, "criticalHigh": 82, "rampRate": 1},
    "humidityRange": {"min": 90, "max": 95, "optimal": 92, "warningLow": 85, "warningHigh": 98, "criticalLow": 80, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 0, "max": 10000, "optimal": 5000, "warningHigh": 15000, "criticalHigh": 20000, "unit": "ppm"},
    "daysMin": 14, "daysMax": 21, "daysTypical": 17,
    "co2Tolerance": "moderate",
    "faeFrequency": "1x daily during colonization",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 14, "maxDays": 21, "typicalDays": 17, "colonizationPercent": 100, "visualIndicators": ["fully colonized", "mycelium dense"], "autoTransition": true, "transitionAlertDays": 3},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Standard colonization temps. Prepare for dramatic temp drop after."
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 72, "optimal": 68, "warningLow": 60, "warningHigh": 75, "criticalLow": 55, "criticalHigh": 80, "rampRate": 1},
    "humidityRange": {"min": 90, "max": 95, "optimal": 92, "warningLow": 85, "warningHigh": 98, "criticalLow": 80, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 2000, "max": 10000, "optimal": 6000, "warningLow": 1000, "warningHigh": 15000, "criticalHigh": 20000, "unit": "ppm"},
    "daysMin": 10, "daysMax": 16, "daysTypical": 13,
    "co2Tolerance": "high",
    "faeFrequency": "minimal - high CO2 desired",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 10, "maxDays": 16, "typicalDays": 13, "colonizationPercent": 100, "visualIndicators": ["primordia forming", "surface bumpy"], "autoTransition": true, "transitionAlertDays": 2, "tempTransitionHours": 72},
    "criticalParameters": ["temperature", "co2"],
    "equipmentNotes": "HIGH CO2 DESIRED during this phase to elongate stems. Reduce FAE."
  }'::jsonb,
  '{
    "tempRange": {"min": 40, "max": 50, "optimal": 45, "warningLow": 35, "warningHigh": 55, "criticalLow": 32, "criticalHigh": 60, "rampRate": 3},
    "humidityRange": {"min": 90, "max": 95, "optimal": 92, "warningLow": 85, "warningHigh": 98, "criticalLow": 80, "criticalHigh": 100, "rampRate": 2},
    "co2Range": {"min": 2000, "max": 10000, "optimal": 6000, "warningLow": 1000, "warningHigh": 15000, "criticalHigh": 25000, "unit": "ppm"},
    "daysMin": 7, "daysMax": 14, "daysTypical": 10,
    "co2Tolerance": "high",
    "faeFrequency": "minimal - high CO2 elongates stems",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 8, "intensity": "low", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 7, "maxDays": 14, "typicalDays": 10, "visualIndicators": ["pins elongating", "thin stems forming"], "autoTransition": true, "transitionAlertDays": 2},
    "criticalParameters": ["temperature", "co2"],
    "equipmentNotes": "REQUIRES REFRIGERATION (40-50°F). High CO2 critical for long thin stems."
  }'::jsonb,
  '{
    "tempRange": {"min": 40, "max": 50, "optimal": 45, "warningLow": 35, "warningHigh": 55, "criticalLow": 32, "criticalHigh": 60, "rampRate": 2},
    "humidityRange": {"min": 90, "max": 95, "optimal": 92, "warningLow": 85, "warningHigh": 98, "criticalLow": 80, "criticalHigh": 100, "rampRate": 2},
    "co2Range": {"min": 2000, "max": 10000, "optimal": 5000, "warningLow": 800, "warningHigh": 15000, "criticalHigh": 25000, "unit": "ppm"},
    "daysMin": 7, "daysMax": 12, "daysTypical": 9,
    "co2Tolerance": "high",
    "faeFrequency": "minimal",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 8, "intensity": "low", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 7, "maxDays": 12, "typicalDays": 9, "visualIndicators": ["stems 3-4 inches", "tiny caps formed", "bundle tight"], "autoTransition": false, "transitionAlertDays": 1},
    "criticalParameters": ["temperature", "co2"],
    "equipmentNotes": "High CO2 elongates stems. Commercial uses bottle collars to force tall growth.",
    "notes": "High CO2 elongates stems"
  }'::jsonb,
  ARRAY['supplemented hardwood sawdust'],
  'Commercial enoki grown in bottles with restrictive collars for elongated stem shape. High CO2 during fruiting elongates stems.',
  'Long thin stems with tiny caps. Wild form has brown velvety stems; commercial is pure white.',
  'Mild, slightly fruity. Crunchy raw, softens when cooked.',
  'Crunchy raw in salads. Popular in hot pot, soups, and Asian cuisine.',
  'Named "winter mushroom" for cold-fruiting nature. Requires refrigeration or cold room to fruit (40-50°F).',
  'Very cold fruiting temperatures required. Not for warm climates without cooling.',
  '0.5-0.75 lb per container', '2-3 flushes', 7, 14,
  '{
    "automationTested": false,
    "automationNotes": "UNIQUE REQUIREMENTS: Very cold temps (40-50°F) and HIGH CO2 desired (opposite of most species). Requires dedicated refrigeration. CO2 control may need to be inverted (less FAE = better).",
    "requiredSensors": ["temperature", "humidity", "co2"],
    "optionalSensors": ["light", "camera"],
    "controllerTypes": ["refrigeration unit", "humidifier", "CO2 controller", "lighting timer"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 8,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 365
  }'::jsonb,
  'Long thin stems with tiny caps. Cold-loving species. Commercial variety differs from wild form.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Beech Mushroom / Shimeji
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, notes, user_id)
VALUES (
  'Beech Mushroom', 'Hypsizygus tessellatus',
  ARRAY['Shimeji', 'Clamshell Mushroom', 'Bunapi'],
  'gourmet', 'intermediate',
  '{
    "tempRange": {"min": 68, "max": 75, "optimal": 72, "warningLow": 65, "warningHigh": 78, "criticalLow": 60, "criticalHigh": 82, "rampRate": 1},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 0, "max": 10000, "optimal": 5000, "warningHigh": 15000, "criticalHigh": 20000, "unit": "ppm"},
    "daysMin": 21, "daysMax": 35, "daysTypical": 28,
    "co2Tolerance": "moderate",
    "faeFrequency": "1x daily during colonization",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 21, "maxDays": 35, "typicalDays": 28, "colonizationPercent": 100, "visualIndicators": ["fully colonized", "mycelium dense"], "autoTransition": true, "transitionAlertDays": 5},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Longer colonization than oysters. Patience required."
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 72, "optimal": 68, "warningLow": 60, "warningHigh": 75, "criticalLow": 55, "criticalHigh": 80, "rampRate": 1},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 0, "max": 8000, "optimal": 4000, "warningHigh": 12000, "criticalHigh": 18000, "unit": "ppm"},
    "daysMin": 14, "daysMax": 21, "daysTypical": 17,
    "co2Tolerance": "moderate",
    "faeFrequency": "2x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "low", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 14, "maxDays": 21, "typicalDays": 17, "colonizationPercent": 100, "visualIndicators": ["primordia bumps forming"], "autoTransition": true, "transitionAlertDays": 3, "tempTransitionHours": 72},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Prepare for cold shock phase. Consolidation important before fruiting."
  }'::jsonb,
  '{
    "tempRange": {"min": 50, "max": 60, "optimal": 55, "warningLow": 45, "warningHigh": 65, "criticalLow": 40, "criticalHigh": 70, "rampRate": 3},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 400, "max": 1500, "optimal": 800, "warningHigh": 2500, "criticalHigh": 4000, "unit": "ppm"},
    "daysMin": 5, "daysMax": 10, "daysTypical": 7,
    "co2Tolerance": "moderate",
    "faeFrequency": "4-6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 5, "maxDays": 10, "typicalDays": 7, "visualIndicators": ["pins emerging in clusters", "small caps visible"], "autoTransition": true, "transitionAlertDays": 2},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "REQUIRES COLD SHOCK (40-50°F for 3-5 days). Critical for pinning initiation.",
    "notes": "Requires cold shock"
  }'::jsonb,
  '{
    "tempRange": {"min": 55, "max": 65, "optimal": 60, "warningLow": 50, "warningHigh": 68, "criticalLow": 45, "criticalHigh": 72, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 400, "max": 1500, "optimal": 800, "warningHigh": 2500, "criticalHigh": 4000, "unit": "ppm"},
    "daysMin": 5, "daysMax": 8, "daysTypical": 6,
    "co2Tolerance": "moderate",
    "faeFrequency": "4-6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 5, "maxDays": 8, "typicalDays": 6, "visualIndicators": ["caps developed", "stems firm", "cluster intact"], "autoTransition": false, "transitionAlertDays": 1},
    "criticalParameters": ["humidity"],
    "equipmentNotes": "Cluster integrity important for market value. Excellent shelf life."
  }'::jsonb,
  ARRAY['supplemented hardwood sawdust', 'masters mix'],
  'Commercial production uses bottles. Brown (buna-shimeji) and white (bunapi) varieties available.',
  'Clusters of small capped mushrooms with crunchy texture. Cluster integrity important for market.',
  'Bitter when raw, nutty and mild when cooked. MUST be cooked.',
  'DO NOT eat raw—bitter. Nutty, mild flavor when cooked. Excellent in stir-fries and soups.',
  'Needs cold shock (40-50°F for 3-5 days) to initiate pinning.',
  'Excellent shelf life (10-14 days).',
  '0.5-0.75 lb per container', '2-3 flushes', 10, 14,
  '{
    "automationTested": false,
    "automationNotes": "Requires cold shock similar to shiitake. Refrigeration capability needed. Commercial production uses bottles with collars.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "light", "camera"],
    "controllerTypes": ["climate controller", "humidifier", "exhaust fan", "refrigeration unit", "lighting timer"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 8,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 365
  }'::jsonb,
  'Clusters of small capped mushrooms. Bitter when raw, nutty and mild when cooked.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Pioppino
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, notes, user_id)
VALUES (
  'Pioppino', 'Cyclocybe aegerita',
  ARRAY['Black Poplar', 'Velvet Pioppini', 'Swordbelt Agrocybe', 'Chestnut Mushroom'],
  'gourmet', 'intermediate',
  '{
    "tempRange": {"min": 70, "max": 75, "optimal": 72, "warningLow": 65, "warningHigh": 78, "criticalLow": 60, "criticalHigh": 82, "rampRate": 1},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 0, "max": 10000, "optimal": 5000, "warningHigh": 15000, "criticalHigh": 20000, "unit": "ppm"},
    "daysMin": 21, "daysMax": 35, "daysTypical": 28,
    "co2Tolerance": "moderate",
    "faeFrequency": "1x daily during colonization",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 21, "maxDays": 35, "typicalDays": 28, "colonizationPercent": 100, "visualIndicators": ["fully colonized", "mycelium dense"], "autoTransition": true, "transitionAlertDays": 5},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Slower colonizer than oysters. Patience required."
  }'::jsonb,
  '{
    "tempRange": {"min": 65, "max": 75, "optimal": 70, "warningLow": 60, "warningHigh": 78, "criticalLow": 55, "criticalHigh": 82, "rampRate": 1},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 0, "max": 6000, "optimal": 3000, "warningHigh": 10000, "criticalHigh": 15000, "unit": "ppm"},
    "daysMin": 14, "daysMax": 21, "daysTypical": 17,
    "co2Tolerance": "moderate",
    "faeFrequency": "2x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "low", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 14, "maxDays": 21, "typicalDays": 17, "colonizationPercent": 100, "visualIndicators": ["primordia forming"], "autoTransition": true, "transitionAlertDays": 3, "tempTransitionHours": 24},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Temperature fluctuation helps initiate fruiting."
  }'::jsonb,
  '{
    "tempRange": {"min": 55, "max": 65, "optimal": 60, "warningLow": 50, "warningHigh": 68, "criticalLow": 45, "criticalHigh": 72, "rampRate": 3},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 400, "max": 1200, "optimal": 700, "warningHigh": 2000, "criticalHigh": 3500, "unit": "ppm"},
    "daysMin": 5, "daysMax": 10, "daysTypical": 7,
    "co2Tolerance": "low",
    "faeFrequency": "4-6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 5, "maxDays": 10, "typicalDays": 7, "visualIndicators": ["pins visible", "cluster formation"], "autoTransition": true, "transitionAlertDays": 2},
    "criticalParameters": ["temperature", "humidity", "co2"],
    "equipmentNotes": "Temperature drop to 55-65°F helps trigger pinning."
  }'::jsonb,
  '{
    "tempRange": {"min": 55, "max": 65, "optimal": 60, "warningLow": 50, "warningHigh": 68, "criticalLow": 45, "criticalHigh": 72, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 90, "optimal": 87, "warningLow": 80, "warningHigh": 95, "criticalLow": 75, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 400, "max": 1200, "optimal": 700, "warningHigh": 2000, "criticalHigh": 3500, "unit": "ppm"},
    "daysMin": 5, "daysMax": 8, "daysTypical": 6,
    "co2Tolerance": "low",
    "faeFrequency": "4-6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 5, "maxDays": 8, "typicalDays": 6, "visualIndicators": ["caps flattening", "veil breaking"], "autoTransition": false, "transitionAlertDays": 1},
    "criticalParameters": ["humidity", "co2"],
    "equipmentNotes": "Harvest before caps fully flatten for best texture."
  }'::jsonb,
  ARRAY['supplemented hardwood sawdust', 'straw with supplements', 'masters mix'],
  'Benefits from temperature fluctuation to initiate fruiting.',
  'Italian favorite. Forms clusters on long thin stems with brown caps. Caps often have small scales.',
  'Nutty, earthy flavor with excellent crunchy texture.',
  'Firm texture holds up excellently in cooking—popular for pasta dishes. Harvest before caps fully flatten for best texture.',
  'Relatively slow colonizer. Also sold as "Agrocybe aegerita" in older literature.',
  'Benefits from temperature fluctuation.',
  '0.5-1 lb per 5lb block', '2-3 flushes', 7, 10,
  '{
    "automationTested": false,
    "automationNotes": "Benefits from temperature fluctuation. Consider programming temp cycling to initiate fruiting.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "light"],
    "controllerTypes": ["climate controller", "humidifier", "exhaust fan", "lighting timer"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 8,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 180
  }'::jsonb,
  'Italian favorite with crunchy texture and nutty flavor. Popular for pasta dishes.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Wood Ear
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, notes, user_id)
VALUES (
  'Wood Ear', 'Auricularia auricula-judae',
  ARRAY['Jelly Ear', 'Judas''s Ear', 'Black Fungus', 'Cloud Ear', 'Kikurage'],
  'gourmet', 'beginner',
  '{
    "tempRange": {"min": 75, "max": 80, "optimal": 77, "warningLow": 70, "warningHigh": 85, "criticalLow": 65, "criticalHigh": 90, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 75, "warningHigh": 98, "criticalLow": 65, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 10000, "optimal": 5000, "warningHigh": 15000, "criticalHigh": 20000, "unit": "ppm"},
    "daysMin": 14, "daysMax": 28, "daysTypical": 21,
    "co2Tolerance": "moderate",
    "faeFrequency": "1x daily during colonization",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 14, "maxDays": 28, "typicalDays": 21, "colonizationPercent": 100, "visualIndicators": ["fully colonized"], "autoTransition": true, "transitionAlertDays": 5},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Heat-loving species. Warm colonization temps (75-80°F)."
  }'::jsonb,
  '{
    "tempRange": {"min": 75, "max": 82, "optimal": 78, "warningLow": 70, "warningHigh": 85, "criticalLow": 65, "criticalHigh": 90, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 75, "warningHigh": 98, "criticalLow": 65, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 8000, "optimal": 4000, "warningHigh": 12000, "criticalHigh": 18000, "unit": "ppm"},
    "daysMin": 10, "daysMax": 18, "daysTypical": 14,
    "co2Tolerance": "moderate",
    "faeFrequency": "2x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "low", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 10, "maxDays": 18, "typicalDays": 14, "colonizationPercent": 100, "visualIndicators": ["primordia visible"], "autoTransition": true, "transitionAlertDays": 3},
    "criticalParameters": ["temperature", "humidity"],
    "equipmentNotes": "Tolerates humidity fluctuations better than most species."
  }'::jsonb,
  '{
    "tempRange": {"min": 70, "max": 82, "optimal": 76, "warningLow": 65, "warningHigh": 85, "criticalLow": 60, "criticalHigh": 90, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 75, "warningHigh": 98, "criticalLow": 65, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 400, "max": 2000, "optimal": 1000, "warningHigh": 3000, "criticalHigh": 5000, "unit": "ppm"},
    "daysMin": 5, "daysMax": 10, "daysTypical": 7,
    "co2Tolerance": "moderate",
    "faeFrequency": "4x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 5, "maxDays": 10, "typicalDays": 7, "visualIndicators": ["ear shapes forming"], "autoTransition": true, "transitionAlertDays": 2},
    "criticalParameters": ["humidity"],
    "equipmentNotes": "More forgiving than other species. Tolerates fluctuations."
  }'::jsonb,
  '{
    "tempRange": {"min": 70, "max": 85, "optimal": 78, "warningLow": 65, "warningHigh": 88, "criticalLow": 60, "criticalHigh": 92, "rampRate": 2},
    "humidityRange": {"min": 85, "max": 95, "optimal": 90, "warningLow": 75, "warningHigh": 98, "criticalLow": 65, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 400, "max": 2000, "optimal": 1000, "warningHigh": 3000, "criticalHigh": 5000, "unit": "ppm"},
    "daysMin": 5, "daysMax": 10, "daysTypical": 7,
    "co2Tolerance": "moderate",
    "faeFrequency": "4x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 5, "maxDays": 10, "typicalDays": 7, "visualIndicators": ["ears fully developed", "rubbery texture"], "autoTransition": false, "transitionAlertDays": 2},
    "criticalParameters": ["humidity"],
    "equipmentNotes": "Multiple flushes possible (3-5). Dries very well."
  }'::jsonb,
  ARRAY['supplemented hardwood sawdust', 'elder wood'],
  'Grows well on elder. Tolerates humidity fluctuations better than most species.',
  'Gelatinous ear-shaped fungus. Unique rubbery/crunchy texture.',
  'Mild, slightly woody flavor. Valued for texture more than taste.',
  'Used in hot and sour soup, stir-fries, salads. Rehydrates well from dried—expands 5-10x.',
  'Don''t wash—briefly rinse if needed. Easy to grow, tolerates humidity fluctuations.',
  'Dries very well and stores for years.',
  '0.5-1 lb per 5lb block', '3-5 flushes', 7, 14,
  '{
    "automationTested": false,
    "automationNotes": "Very forgiving species. Tolerates humidity fluctuations better than most. Good choice for beginners learning automation.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "light"],
    "controllerTypes": ["climate controller", "humidifier", "exhaust fan"],
    "alertOnTempDeviation": 10,
    "alertOnHumidityDeviation": 15,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 600,
    "dataRetentionDays": 180
  }'::jsonb,
  'Gelatinous ear-shaped fungus common in Asian cuisine. Easy to cultivate.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Wine Cap
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, notes, user_id)
VALUES (
  'Wine Cap', 'Stropharia rugosoannulata',
  ARRAY['King Stropharia', 'Garden Giant', 'Burgundy Mushroom'],
  'gourmet', 'beginner',
  '{
    "tempRange": {"min": 60, "max": 75, "optimal": 68, "warningLow": 50, "warningHigh": 80, "criticalLow": 45, "criticalHigh": 85, "rampRate": 2},
    "humidityRange": {"min": 70, "max": 90, "optimal": 80, "warningLow": 60, "warningHigh": 95, "criticalLow": 50, "criticalHigh": 100, "rampRate": 10},
    "co2Range": {"min": 400, "max": 20000, "optimal": 5000, "warningHigh": 30000, "criticalHigh": 50000, "unit": "ppm"},
    "daysMin": 14, "daysMax": 28, "daysTypical": 21,
    "co2Tolerance": "high",
    "faeFrequency": "outdoor - natural",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 14, "maxDays": 28, "typicalDays": 21, "colonizationPercent": 75, "visualIndicators": ["mycelium visible in wood chips", "white rhizomorphs spreading"], "autoTransition": true, "transitionAlertDays": 7},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "OUTDOOR SPECIES. Spawn run in wood chip beds 4-8 inches deep.",
    "notes": "Outdoor spawn run"
  }'::jsonb,
  '{
    "tempRange": {"min": 55, "max": 70, "optimal": 62, "warningLow": 45, "warningHigh": 78, "criticalLow": 40, "criticalHigh": 85, "rampRate": 2},
    "humidityRange": {"min": 70, "max": 90, "optimal": 80, "warningLow": 60, "warningHigh": 95, "criticalLow": 50, "criticalHigh": 100, "rampRate": 10},
    "co2Range": {"min": 400, "max": 20000, "optimal": 5000, "warningHigh": 30000, "criticalHigh": 50000, "unit": "ppm"},
    "daysMin": 21, "daysMax": 60, "daysTypical": 40,
    "co2Tolerance": "high",
    "faeFrequency": "outdoor - natural",
    "lightRequirement": "indirect",
    "transitionCriteria": {"minDays": 21, "maxDays": 60, "typicalDays": 40, "visualIndicators": ["mycelium throughout bed", "consolidating"], "autoTransition": true, "transitionAlertDays": 14},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Colonizing wood chip beds. Keep moist but not waterlogged.",
    "notes": "In wood chip beds"
  }'::jsonb,
  '{
    "tempRange": {"min": 55, "max": 70, "optimal": 62, "warningLow": 50, "warningHigh": 75, "criticalLow": 45, "criticalHigh": 80, "rampRate": 2},
    "humidityRange": {"min": 75, "max": 90, "optimal": 82, "warningLow": 65, "warningHigh": 95, "criticalLow": 55, "criticalHigh": 100, "rampRate": 10},
    "co2Range": {"min": 400, "max": 10000, "optimal": 2000, "warningHigh": 15000, "criticalHigh": 25000, "unit": "ppm"},
    "daysMin": 7, "daysMax": 14, "daysTypical": 10,
    "co2Tolerance": "high",
    "faeFrequency": "outdoor - natural",
    "lightRequirement": "indirect",
    "transitionCriteria": {"minDays": 7, "maxDays": 14, "typicalDays": 10, "visualIndicators": ["primordia emerging from bed", "small pins visible"], "autoTransition": true, "transitionAlertDays": 3},
    "criticalParameters": ["temperature", "humidity"],
    "equipmentNotes": "Fruits spring/fall when ground temps 60-70°F with moisture."
  }'::jsonb,
  '{
    "tempRange": {"min": 60, "max": 70, "optimal": 65, "warningLow": 55, "warningHigh": 75, "criticalLow": 50, "criticalHigh": 80, "rampRate": 2},
    "humidityRange": {"min": 75, "max": 90, "optimal": 82, "warningLow": 65, "warningHigh": 95, "criticalLow": 55, "criticalHigh": 100, "rampRate": 10},
    "co2Range": {"min": 400, "max": 10000, "optimal": 2000, "warningHigh": 15000, "criticalHigh": 25000, "unit": "ppm"},
    "daysMin": 5, "daysMax": 10, "daysTypical": 7,
    "co2Tolerance": "high",
    "faeFrequency": "outdoor - natural",
    "lightRequirement": "indirect",
    "transitionCriteria": {"minDays": 5, "maxDays": 10, "typicalDays": 7, "visualIndicators": ["caps fully developed", "wine-red color", "veil intact or just breaking"], "autoTransition": false, "transitionAlertDays": 2},
    "criticalParameters": ["humidity"],
    "equipmentNotes": "Large caps 4-12 inches. Harvest when veil begins to break."
  }'::jsonb,
  ARRAY['hardwood chips', 'straw', 'garden beds'],
  'Best grown outdoors in wood chip beds 4-8" deep. Establish bed and inoculate with grain/sawdust spawn.',
  'Premier outdoor garden species with wine-red caps that fade to tan with age. Large caps (4-12").',
  'Mild, potato-like flavor.',
  'Excellent for permaculture and food forests. Benefits garden by breaking down wood chips.',
  'Easy entry point for outdoor cultivation. Can produce for years once established.',
  'Fruits spring/fall when ground temps 60-70°F with moisture.',
  'Variable—pounds per established bed', 'Multiple years', 5, 7,
  '{
    "automationTested": false,
    "automationNotes": "OUTDOOR SPECIES - automation less critical. Soil moisture sensors may be useful for irrigation triggers.",
    "requiredSensors": ["temperature"],
    "optionalSensors": ["humidity", "soil moisture"],
    "controllerTypes": ["irrigation controller", "soil moisture sensor"],
    "alertOnTempDeviation": 15,
    "alertOnHumidityDeviation": 20,
    "alertOnStageDuration": false,
    "sensorPollingInterval": 3600,
    "dataRetentionDays": 365
  }'::jsonb,
  'Premier outdoor garden species. Large wine-red caps. Excellent for permaculture.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Nameko
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max, notes, user_id)
VALUES (
  'Nameko', 'Pholiota nameko',
  ARRAY['Butterscotch Mushroom'],
  'gourmet', 'intermediate',
  '{"tempRange": {"min": 70, "max": 75, "optimal": 72}, "humidityRange": {"min": 90, "max": 95}, "daysMin": 21, "daysMax": 30, "co2Tolerance": "moderate", "lightRequirement": "none"}'::jsonb,
  '{"tempRange": {"min": 65, "max": 72, "optimal": 68}, "humidityRange": {"min": 90, "max": 95}, "daysMin": 14, "daysMax": 21, "co2Tolerance": "moderate", "lightRequirement": "indirect"}'::jsonb,
  '{"tempRange": {"min": 50, "max": 60, "optimal": 55}, "humidityRange": {"min": 90, "max": 95}, "daysMin": 5, "daysMax": 10, "co2Tolerance": "moderate", "lightRequirement": "indirect"}'::jsonb,
  '{"tempRange": {"min": 50, "max": 60, "optimal": 55}, "humidityRange": {"min": 90, "max": 95}, "daysMin": 5, "daysMax": 8, "co2Tolerance": "moderate", "lightRequirement": "indirect"}'::jsonb,
  ARRAY['supplemented hardwood sawdust', 'hardwood logs'],
  'Prefers cooler temperatures. Works well on logs outdoors.',
  'Amber-orange caps with distinctive gelatinous coating (mucilage). Clusters of small caps.',
  'Mild, woodsy flavor.',
  'The slime layer is prized in Japanese cuisine, especially miso soup. DO NOT wash off the slime—it''s the point!',
  'Prefers cooler temperatures. Easier than it looks once dialed in.',
  'Short shelf life (5-7 days).',
  '0.5-0.75 lb per container', '2-3 flushes', 5, 7,
  'Amber-orange caps with distinctive gelatinous coating. Popular in Japanese cuisine, especially miso soup.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Button Mushroom (Agaricus bisporus)
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max, notes, user_id)
VALUES (
  'Button Mushroom', 'Agaricus bisporus',
  ARRAY['White Mushroom', 'Cremini', 'Crimini', 'Portobello', 'Portabella', 'Baby Bella'],
  'gourmet', 'advanced',
  '{"tempRange": {"min": 70, "max": 75, "optimal": 72}, "humidityRange": {"min": 85, "max": 90}, "daysMin": 14, "daysMax": 21, "co2Tolerance": "moderate", "lightRequirement": "none"}'::jsonb,
  '{"tempRange": {"min": 70, "max": 75, "optimal": 72}, "humidityRange": {"min": 85, "max": 90}, "daysMin": 10, "daysMax": 16, "co2Tolerance": "moderate", "lightRequirement": "none", "notes": "Requires casing layer"}'::jsonb,
  '{"tempRange": {"min": 60, "max": 65, "optimal": 62}, "humidityRange": {"min": 85, "max": 90}, "daysMin": 7, "daysMax": 14, "co2Tolerance": "moderate", "lightRequirement": "indirect"}'::jsonb,
  '{"tempRange": {"min": 60, "max": 65, "optimal": 62}, "humidityRange": {"min": 85, "max": 90}, "daysMin": 5, "daysMax": 10, "co2Tolerance": "moderate", "lightRequirement": "indirect"}'::jsonb,
  ARRAY['composted substrate'],
  'UNIQUELY requires composted substrate (Phase I and II composting process). Cannot fruit on sawdust/straw like other species. Commercial operations use horse manure-based compost.',
  'Most commercially cultivated mushroom worldwide. Same species at different stages: Button=young white, cremini=young brown, portobello=mature brown.',
  'Mild, earthy flavor. Intensifies when dried or cooked.',
  'Universal culinary use. Can be eaten raw or cooked.',
  'Challenging for home cultivators due to composting requirements. Requires casing layer (peat/verm mix).',
  'Different marketing names for same species at different maturity/color.',
  '2-4 lbs per tray over multiple flushes', '3-5 flushes', 7, 10,
  'Most commercially cultivated mushroom worldwide. Challenging for home cultivators due to composting requirements.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- MEDICINAL SPECIES

-- Reishi
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  medicinal_properties, community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max, notes, user_id)
VALUES (
  'Reishi', 'Ganoderma lucidum',
  ARRAY['Lingzhi', 'Varnish Conk', 'Mushroom of Immortality', 'Divine Mushroom'],
  'medicinal', 'intermediate',
  '{"tempRange": {"min": 70, "max": 80, "optimal": 75}, "humidityRange": {"min": 80, "max": 90}, "daysMin": 30, "daysMax": 60, "co2Tolerance": "moderate", "lightRequirement": "none"}'::jsonb,
  '{"tempRange": {"min": 70, "max": 80, "optimal": 75}, "humidityRange": {"min": 80, "max": 90}, "daysMin": 20, "daysMax": 40, "co2Tolerance": "high", "lightRequirement": "none", "notes": "High CO2 = antler form"}'::jsonb,
  '{"tempRange": {"min": 70, "max": 80, "optimal": 75}, "humidityRange": {"min": 80, "max": 90}, "daysMin": 10, "daysMax": 20, "co2Tolerance": "low", "lightRequirement": "12hr_cycle"}'::jsonb,
  '{"tempRange": {"min": 70, "max": 80, "optimal": 75}, "humidityRange": {"min": 80, "max": 90}, "daysMin": 30, "daysMax": 90, "co2Tolerance": "low", "lightRequirement": "12hr_cycle"}'::jsonb,
  ARRAY['supplemented hardwood sawdust', 'oak sawdust', 'maple sawdust'],
  'Oak/maple preferred. High CO2 produces antler form; normal FAE produces conk (kidney-shaped with lacquered surface).',
  'Forms either antler (high CO2, elongated) or conk (normal FAE, kidney-shaped with lacquered surface) based on conditions.',
  'Extremely bitter. Not a culinary mushroom.',
  'Woody texture—not culinary, used for tea, tinctures, extracts. Dual extraction (water + alcohol) captures full spectrum.',
  'Most studied medicinal mushroom with 2000+ years of use. Contains triterpenoids, beta-glucans, polysaccharides.',
  '12hr light cycles trigger conk formation. Long grow cycle (3-6 months total).',
  'Dual extraction recommended for full medicinal benefit.',
  '0.25-0.5 lb per 5lb block', '1-2 flushes', 365, 730,
  'Most studied medicinal mushroom. Woody texture, used for tea/extracts. Long grow cycle (3-6 months).',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Turkey Tail
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  medicinal_properties, community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max, notes, user_id)
VALUES (
  'Turkey Tail', 'Trametes versicolor',
  ARRAY['Yun Zhi', 'Kawaratake', 'Cloud Mushroom'],
  'medicinal', 'beginner',
  '{"tempRange": {"min": 70, "max": 75, "optimal": 72}, "humidityRange": {"min": 85, "max": 95}, "daysMin": 14, "daysMax": 28, "co2Tolerance": "moderate", "lightRequirement": "none"}'::jsonb,
  '{"tempRange": {"min": 65, "max": 75, "optimal": 70}, "humidityRange": {"min": 85, "max": 95}, "daysMin": 14, "daysMax": 21, "co2Tolerance": "moderate", "lightRequirement": "indirect"}'::jsonb,
  '{"tempRange": {"min": 60, "max": 75, "optimal": 68}, "humidityRange": {"min": 85, "max": 95}, "daysMin": 7, "daysMax": 14, "co2Tolerance": "moderate", "lightRequirement": "indirect"}'::jsonb,
  '{"tempRange": {"min": 60, "max": 75, "optimal": 68}, "humidityRange": {"min": 85, "max": 95}, "daysMin": 7, "daysMax": 14, "co2Tolerance": "moderate", "lightRequirement": "indirect"}'::jsonb,
  ARRAY['hardwood sawdust', 'hardwood logs', 'wood chips', 'stumps', 'straw'],
  'Very adaptable. Can establish outdoors on hardwood logs/stumps for continuous production.',
  'Colorful thin bracket fungus with concentric color zones on cap. One of easiest medicinal mushrooms to cultivate.',
  'Not culinary—thin leathery texture.',
  'Used for tea/extract only. Not a culinary mushroom.',
  'Contains PSK and PSP polysaccharides extensively studied in cancer research for immune support.',
  'Fast colonizer, aggressive. Easy to grow on many substrates.',
  'One of the best-researched medicinal mushrooms.',
  '0.25-0.5 lb per log/block', 'Continuous on logs', 365, 730,
  'Colorful thin bracket fungus. One of easiest medicinal mushrooms. Extensively researched for immune support.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Cordyceps militaris
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  medicinal_properties, community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max, notes, user_id)
VALUES (
  'Cordyceps', 'Cordyceps militaris',
  ARRAY['Caterpillar Fungus', 'Orange Caterpillar', 'Military Cordyceps'],
  'medicinal', 'advanced',
  '{"tempRange": {"min": 68, "max": 72, "optimal": 70}, "humidityRange": {"min": 90, "max": 95}, "daysMin": 14, "daysMax": 21, "co2Tolerance": "moderate", "lightRequirement": "none"}'::jsonb,
  '{"tempRange": {"min": 65, "max": 70, "optimal": 68}, "humidityRange": {"min": 90, "max": 95}, "daysMin": 14, "daysMax": 21, "co2Tolerance": "moderate", "lightRequirement": "none"}'::jsonb,
  '{"tempRange": {"min": 60, "max": 68, "optimal": 64}, "humidityRange": {"min": 90, "max": 95}, "daysMin": 10, "daysMax": 20, "co2Tolerance": "low", "lightRequirement": "12hr_cycle", "notes": "12-16hr light triggers fruiting"}'::jsonb,
  '{"tempRange": {"min": 60, "max": 68, "optimal": 64}, "humidityRange": {"min": 90, "max": 95}, "daysMin": 20, "daysMax": 40, "co2Tolerance": "low", "lightRequirement": "12hr_cycle"}'::jsonb,
  ARRAY['grain + silkworm pupae', 'rice-based substrate'],
  'Unique substrate requirements: grain + silkworm pupae or specialized rice-based formulas. Requires specialized conditions.',
  'Orange club-shaped fruiting bodies. Requires 12-16hr light daily to trigger fruiting.',
  'Mild, slightly sweet.',
  'Can be added to soups or teas. Also available as extract.',
  'Contains cordycepin and adenosine. Traditional use for energy, athletic performance.',
  'Wild C. sinensis (on caterpillar hosts) costs $20,000+/lb and cannot be cultivated. C. militaris is the accessible alternative.',
  'Challenging but achievable with proper setup.',
  '0.1-0.25 lb per container', '1-2 flushes', 30, 60,
  'Orange club-shaped fruiting bodies. Cultivated alternative to wild C. sinensis. Contains cordycepin.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Chaga (included for reference - cannot be cultivated)
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  medicinal_properties, community_tips, important_facts, typical_yield, flush_count, notes, user_id)
VALUES (
  'Chaga', 'Inonotus obliquus',
  ARRAY['Clinker Polypore', 'Birch Conk', 'Black Mass'],
  'medicinal', 'expert',
  '{"notes": "Cannot be conventionally cultivated"}'::jsonb,
  '{"notes": "Requires living birch tree host"}'::jsonb,
  '{"notes": "Not applicable - wild harvest only"}'::jsonb,
  '{"notes": "10-20+ years to develop significant size"}'::jsonb,
  ARRAY['living birch trees'],
  'Not technically a mushroom—parasitic sterile conk (sclerotium) on birch trees. Cannot be conventionally cultivated.',
  'Black exterior is melanin-rich; interior orange-brown. Parasitic on living birch trees. 10-20+ years to develop significant size.',
  'Earthy, slightly vanilla when prepared as tea.',
  'Traditional use: tea/decoction. Not eaten directly.',
  'Contains betulinic acid (from birch), antioxidants. Overharvesting is a conservation concern.',
  'Wild-harvested only. Some lab cultivation of mycelium exists but lacks compounds developed in wild sclerotia.',
  'Sustainable sourcing important. Home cultivation not practical.',
  'Wild harvest only', 'N/A',
  'Parasitic on birch trees. Wild-harvested sclerotia used medicinally. Cannot be conventionally cultivated.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- RESEARCH SPECIES

-- Psilocybe cubensis
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile, culinary_notes,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max,
  automation_config, spawn_colonization_notes, bulk_colonization_notes, pinning_notes, maturation_notes, notes, user_id)
VALUES (
  'Psilocybe cubensis', 'Psilocybe cubensis',
  ARRAY['Golden Teacher', 'B+', 'Penis Envy', 'APE', 'Jack Frost', 'Cubes', 'Mexican Mushroom', 'Golden Cap'],
  'research', 'beginner',
  '{
    "tempRange": {"min": 75, "max": 80, "optimal": 77, "warningLow": 70, "warningHigh": 85, "criticalLow": 65, "criticalHigh": 90, "rampRate": 2},
    "humidityRange": {"min": 90, "max": 95, "optimal": 92, "warningLow": 85, "warningHigh": 98, "criticalLow": 80, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 8000, "optimal": 4000, "warningHigh": 12000, "criticalHigh": 18000, "unit": "ppm"},
    "daysMin": 10, "daysMax": 14, "daysTypical": 12,
    "co2Tolerance": "moderate",
    "faeFrequency": "1x daily for gas exchange",
    "lightRequirement": "none",
    "transitionCriteria": {"minDays": 10, "maxDays": 14, "typicalDays": 12, "colonizationPercent": 100, "visualIndicators": ["fully colonized", "no visible grain", "mycelium consolidating"], "autoTransition": false, "transitionAlertDays": 2},
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Dark, warm incubation. 75-80°F optimal. Break and shake at 30% colonization for faster results."
  }'::jsonb,
  '{
    "tempRange": {"min": 72, "max": 78, "optimal": 75, "warningLow": 68, "warningHigh": 82, "criticalLow": 65, "criticalHigh": 85, "rampRate": 2},
    "humidityRange": {"min": 90, "max": 95, "optimal": 92, "warningLow": 85, "warningHigh": 98, "criticalLow": 80, "criticalHigh": 100, "rampRate": 5},
    "co2Range": {"min": 0, "max": 5000, "optimal": 2500, "warningHigh": 8000, "criticalHigh": 12000, "unit": "ppm"},
    "daysMin": 7, "daysMax": 14, "daysTypical": 10,
    "co2Tolerance": "moderate",
    "faeFrequency": "2x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "low", "spectrum": "cool", "dawnDuskRamp": 15},
    "transitionCriteria": {"minDays": 7, "maxDays": 14, "typicalDays": 10, "colonizationPercent": 100, "visualIndicators": ["surface fully colonized", "hyphal knots forming", "primordia visible"], "autoTransition": true, "transitionAlertDays": 2, "tempTransitionHours": 12},
    "criticalParameters": ["temperature", "humidity"],
    "equipmentNotes": "Monotub or shoebox tek. Maintain surface conditions. Watch for primordia at day 7-10."
  }'::jsonb,
  '{
    "tempRange": {"min": 70, "max": 75, "optimal": 72, "warningLow": 65, "warningHigh": 78, "criticalLow": 60, "criticalHigh": 82, "rampRate": 2},
    "humidityRange": {"min": 90, "max": 95, "optimal": 93, "warningLow": 88, "warningHigh": 98, "criticalLow": 85, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 400, "max": 1200, "optimal": 700, "warningHigh": 2000, "criticalHigh": 3000, "unit": "ppm"},
    "daysMin": 5, "daysMax": 10, "daysTypical": 7,
    "co2Tolerance": "low",
    "faeFrequency": "4-6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 5, "maxDays": 10, "typicalDays": 7, "visualIndicators": ["pins visible", "primordia elongating", "small caps forming"], "autoTransition": true, "transitionAlertDays": 2},
    "criticalParameters": ["humidity", "co2", "fae"],
    "equipmentNotes": "Slight temperature drop helps initiate pinning. Increase FAE. Maintain high humidity with misting."
  }'::jsonb,
  '{
    "tempRange": {"min": 70, "max": 75, "optimal": 72, "warningLow": 65, "warningHigh": 78, "criticalLow": 60, "criticalHigh": 82, "rampRate": 1},
    "humidityRange": {"min": 90, "max": 95, "optimal": 92, "warningLow": 88, "warningHigh": 98, "criticalLow": 85, "criticalHigh": 100, "rampRate": 3},
    "co2Range": {"min": 400, "max": 1200, "optimal": 700, "warningHigh": 2000, "criticalHigh": 3000, "unit": "ppm"},
    "daysMin": 5, "daysMax": 7, "daysTypical": 6,
    "co2Tolerance": "low",
    "faeFrequency": "4-6x daily",
    "lightRequirement": "indirect",
    "lightSchedule": {"photoperiod": 12, "intensity": "medium", "spectrum": "cool", "dawnDuskRamp": 30},
    "transitionCriteria": {"minDays": 5, "maxDays": 7, "typicalDays": 6, "visualIndicators": ["veil stretching", "veil breaking", "caps expanding"], "autoTransition": false, "transitionAlertDays": 1},
    "criticalParameters": ["humidity", "fae"],
    "equipmentNotes": "Harvest just before or as veil breaks. Twist and pull. Second flush 7-14 days after rehydration."
  }'::jsonb,
  ARRAY['brown rice flour/vermiculite (PF Tek)', 'grain spawn to coir/verm', 'manure-based substrate'],
  'Many cultivation methods: PF Tek (beginner), grain spawn to bulk substrate (intermediate). Coir/verm or manure-based.',
  'Subtropical/tropical origin. Many cultivars exist (B+, Golden Teacher, Penis Envy, APE, Jack Frost, etc.) with varying characteristics. PE/APE strains colonize slower but are denser.',
  'Not relevant for this category.',
  'Not consumed as food.',
  'Most widely studied and cultivated psilocybin species for research. Strain characteristics: Golden Teacher (balanced, moderate), B+ (vigorous, large fruits), PE/APE (slow, dense, potent), Jack Frost (fast, leucistic/albino).',
  'Legal status varies by jurisdiction—federally scheduled in US, decriminalized or legal elsewhere. For microscopy and taxonomy study only where applicable.',
  '1-2 oz dried per quart spawn', '3-5 flushes', 7, 14,
  '{
    "automationTested": false,
    "automationNotes": "Standard monotub conditions work well. Temperature and humidity are most critical. Different strains (PE, APE, Golden Teacher) may have slightly different timing but similar conditions.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "light", "camera"],
    "controllerTypes": ["climate controller", "humidifier", "exhaust fan", "lighting timer"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 8,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 180
  }'::jsonb,
  'SPAWN COLONIZATION (75-80°F, 10-14 days): Inoculate grain jars with spore syringe or LC. Keep in dark at 75-80°F. No light needed. Shake at 30% colonization. Wait for 100% colonization—visible when no grain shows through mycelium. Golden Teacher/B+ colonize fast (10-12 days), PE/APE slower (14-21 days). Watch for contam—green/black colors are bad.',
  'BULK COLONIZATION (72-78°F, 7-14 days): Spawn to bulk at 1:2-1:4 ratio with coir/verm or manure substrate. Maintain surface conditions (tiny droplets visible). Introduce indirect light 12hr/day. Keep lid closed or cracked until surface fully colonized. Watch for hyphal knots/primordia around day 7-10. PE/APE may take longer.',
  'PINNING (70-75°F, 5-10 days): Once primordia visible, increase FAE significantly. Maintain 90%+ humidity with misting. Drop temp slightly to 70-72°F to encourage pinning. CO2 below 1200ppm critical. Pins should multiply rapidly. Aborts (dark caps that stop growing) indicate environmental stress. Fan 4-6x daily.',
  'MATURATION (70-75°F, 5-7 days): Maintain fruiting conditions. Harvest JUST BEFORE or AS VEIL BREAKS—this is critical timing. Twist and pull fruits to remove cleanly. Spore drop after veil break is normal but messy. Dry immediately using dehydrator at 160°F or desiccant. Second flush 7-14 days after dunking substrate for 12-24 hours.',
  'Most widely studied psilocybin species. Legal status varies by jurisdiction. For microscopy/research only.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Psilocybe cyanescens
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile,
  community_tips, important_facts, typical_yield, flush_count, notes, user_id)
VALUES (
  'Psilocybe cyanescens', 'Psilocybe cyanescens',
  ARRAY['Wavy Caps', 'Blue Halo', 'Cyans'],
  'research', 'advanced',
  '{"tempRange": {"min": 60, "max": 75, "optimal": 68}, "humidityRange": {"min": 85, "max": 95}, "daysMin": 60, "daysMax": 120, "co2Tolerance": "high", "lightRequirement": "none", "notes": "Summer colonization in wood chips"}'::jsonb,
  '{"tempRange": {"min": 55, "max": 70, "optimal": 62}, "humidityRange": {"min": 85, "max": 95}, "daysMin": 30, "daysMax": 90, "co2Tolerance": "high", "lightRequirement": "indirect"}'::jsonb,
  '{"tempRange": {"min": 40, "max": 55, "optimal": 48}, "humidityRange": {"min": 85, "max": 95}, "daysMin": 7, "daysMax": 14, "co2Tolerance": "high", "lightRequirement": "indirect", "notes": "Requires cold temps"}'::jsonb,
  '{"tempRange": {"min": 40, "max": 55, "optimal": 48}, "humidityRange": {"min": 85, "max": 95}, "daysMin": 5, "daysMax": 10, "co2Tolerance": "high", "lightRequirement": "indirect"}'::jsonb,
  ARRAY['wood chips', 'hardwood mulch'],
  'OUTDOOR CULTIVATION ONLY—will not fruit indoors in typical conditions. Requires wood chip beds, cool fall temperatures with humidity.',
  'Wood-loving species native to Pacific Northwest. Wavy cap margins distinctive. Strong blue-staining reaction.',
  'Not relevant for this category.',
  'Cannot be cultivated like P. cubensis. Colonization in wood chips over summer, fruits fall/early winter when temps drop to 40-55°F.',
  'Spreading as invasive in Europe on landscape mulch. Higher research compound potency than cubensis.',
  'Variable—outdoor bed dependent', 'Annual (fall)',
  'Potent wood-loving species. Outdoor cultivation only. Native to Pacific Northwest.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Psilocybe azurescens
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile,
  community_tips, important_facts, typical_yield, flush_count, notes, user_id)
VALUES (
  'Psilocybe azurescens', 'Psilocybe azurescens',
  ARRAY['Azzies', 'Flying Saucers', 'Blue Angels', 'Indigo Psilocybe'],
  'research', 'expert',
  '{"tempRange": {"min": 55, "max": 70, "optimal": 62}, "humidityRange": {"min": 85, "max": 95}, "daysMin": 90, "daysMax": 180, "co2Tolerance": "high", "lightRequirement": "none"}'::jsonb,
  '{"tempRange": {"min": 50, "max": 65, "optimal": 58}, "humidityRange": {"min": 85, "max": 95}, "daysMin": 60, "daysMax": 120, "co2Tolerance": "high", "lightRequirement": "indirect"}'::jsonb,
  '{"tempRange": {"min": 35, "max": 50, "optimal": 42}, "humidityRange": {"min": 85, "max": 95}, "daysMin": 10, "daysMax": 21, "co2Tolerance": "high", "lightRequirement": "indirect", "notes": "Fruits near freezing"}'::jsonb,
  '{"tempRange": {"min": 35, "max": 50, "optimal": 42}, "humidityRange": {"min": 85, "max": 95}, "daysMin": 7, "daysMax": 14, "co2Tolerance": "high", "lightRequirement": "indirect"}'::jsonb,
  ARRAY['wood chips', 'hardwood debris'],
  'Outdoor cultivation only. Requires wood chip beds, coastal climate conditions. Very cold-tolerant—fruits in temperatures near freezing.',
  'Most potent known Psilocybe species. Native to small coastal Oregon area. Caramel-colored caps with pronounced umbo. Strong bluing reaction.',
  'Not relevant for this category.',
  'Cultivation requires specific conditions difficult to replicate outside native range. Spreading slowly in Pacific Northwest.',
  'For academic/research interest regarding potency studies.',
  'Variable—outdoor bed dependent', 'Annual (late fall/winter)',
  'Most potent known Psilocybe species. Native to coastal Oregon. Outdoor only, very cold-tolerant.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- Panaeolus cyanescens
INSERT INTO species (name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics, flavor_profile,
  community_tips, important_facts, typical_yield, flush_count, shelf_life_days_min, shelf_life_days_max, notes, user_id)
VALUES (
  'Panaeolus cyanescens', 'Panaeolus cyanescens',
  ARRAY['Blue Meanies', 'Pan Cyan', 'Copelandia cyanescens'],
  'research', 'intermediate',
  '{"tempRange": {"min": 75, "max": 85, "optimal": 80}, "humidityRange": {"min": 95, "max": 99}, "daysMin": 7, "daysMax": 10, "co2Tolerance": "moderate", "lightRequirement": "none"}'::jsonb,
  '{"tempRange": {"min": 78, "max": 85, "optimal": 82}, "humidityRange": {"min": 95, "max": 99}, "daysMin": 5, "daysMax": 10, "co2Tolerance": "moderate", "lightRequirement": "indirect"}'::jsonb,
  '{"tempRange": {"min": 75, "max": 85, "optimal": 80}, "humidityRange": {"min": 95, "max": 99}, "daysMin": 3, "daysMax": 7, "co2Tolerance": "low", "lightRequirement": "indirect"}'::jsonb,
  '{"tempRange": {"min": 75, "max": 85, "optimal": 80}, "humidityRange": {"min": 95, "max": 99}, "daysMin": 3, "daysMax": 5, "co2Tolerance": "low", "lightRequirement": "indirect"}'::jsonb,
  ARRAY['dung-based substrate', 'pasteurized manure'],
  'Prefers dung-based substrate. Fast colonizer but more contamination-prone than cubensis.',
  'Tropical dung-loving species. Mottled black gills when mature. Strong bluing reaction. DISTINCT from P. cubensis "Blue Meanie" strain—different species.',
  'Not relevant for this category.',
  'Requires tropical conditions (75-85°F) and very high humidity (95%+).',
  'Note: name "Blue Meanie" also used for P. cubensis strain—different species. Higher research compound concentration than cubensis.',
  '0.5-1 oz dried per quart spawn', '3-5 flushes', 5, 7,
  'Tropical dung-loving species. Distinct from P. cubensis "Blue Meanie" strain. Higher potency.',
  NULL
) ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE species ENABLE ROW LEVEL SECURITY;
ALTER TABLE strains ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE substrate_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultures ENABLE ROW LEVEL SECURITY;
ALTER TABLE culture_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE culture_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE grows ENABLE ROW LEVEL SECURITY;
ALTER TABLE grow_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE flushes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE grain_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- SECURITY MODEL:
-- - Users can only see and modify their own data (user_id = auth.uid())
-- - Admins can see and modify all data
-- - Lookup tables (species, strains, etc.) allow shared defaults (user_id IS NULL)
-- ============================================================================

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DROP ALL EXISTING POLICIES (both old and new naming conventions)
-- ============================================================================

-- User profiles
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete" ON user_profiles;

-- Admin audit log
DROP POLICY IF EXISTS "admin_audit_log_select" ON admin_audit_log;
DROP POLICY IF EXISTS "admin_audit_log_insert" ON admin_audit_log;

-- Admin notifications
DROP POLICY IF EXISTS "admin_notifications_select" ON admin_notifications;
DROP POLICY IF EXISTS "admin_notifications_insert" ON admin_notifications;
DROP POLICY IF EXISTS "admin_notifications_update" ON admin_notifications;
DROP POLICY IF EXISTS "admin_notifications_delete" ON admin_notifications;

-- Species
DROP POLICY IF EXISTS "anon_species_select" ON species;
DROP POLICY IF EXISTS "anon_species_insert" ON species;
DROP POLICY IF EXISTS "anon_species_update" ON species;
DROP POLICY IF EXISTS "anon_species_delete" ON species;
DROP POLICY IF EXISTS "species_select" ON species;
DROP POLICY IF EXISTS "species_insert" ON species;
DROP POLICY IF EXISTS "species_update" ON species;
DROP POLICY IF EXISTS "species_delete" ON species;

-- Strains
DROP POLICY IF EXISTS "anon_strains_select" ON strains;
DROP POLICY IF EXISTS "anon_strains_insert" ON strains;
DROP POLICY IF EXISTS "anon_strains_update" ON strains;
DROP POLICY IF EXISTS "anon_strains_delete" ON strains;
DROP POLICY IF EXISTS "strains_select" ON strains;
DROP POLICY IF EXISTS "strains_insert" ON strains;
DROP POLICY IF EXISTS "strains_update" ON strains;
DROP POLICY IF EXISTS "strains_delete" ON strains;

-- Location Types
DROP POLICY IF EXISTS "anon_location_types_select" ON location_types;
DROP POLICY IF EXISTS "anon_location_types_insert" ON location_types;
DROP POLICY IF EXISTS "anon_location_types_update" ON location_types;
DROP POLICY IF EXISTS "anon_location_types_delete" ON location_types;
DROP POLICY IF EXISTS "location_types_select" ON location_types;
DROP POLICY IF EXISTS "location_types_insert" ON location_types;
DROP POLICY IF EXISTS "location_types_update" ON location_types;
DROP POLICY IF EXISTS "location_types_delete" ON location_types;

-- Location Classifications
DROP POLICY IF EXISTS "anon_location_classifications_select" ON location_classifications;
DROP POLICY IF EXISTS "anon_location_classifications_insert" ON location_classifications;
DROP POLICY IF EXISTS "anon_location_classifications_update" ON location_classifications;
DROP POLICY IF EXISTS "anon_location_classifications_delete" ON location_classifications;
DROP POLICY IF EXISTS "location_classifications_select" ON location_classifications;
DROP POLICY IF EXISTS "location_classifications_insert" ON location_classifications;
DROP POLICY IF EXISTS "location_classifications_update" ON location_classifications;
DROP POLICY IF EXISTS "location_classifications_delete" ON location_classifications;

-- Locations
DROP POLICY IF EXISTS "anon_locations_select" ON locations;
DROP POLICY IF EXISTS "anon_locations_insert" ON locations;
DROP POLICY IF EXISTS "anon_locations_update" ON locations;
DROP POLICY IF EXISTS "anon_locations_delete" ON locations;
DROP POLICY IF EXISTS "locations_select" ON locations;
DROP POLICY IF EXISTS "locations_insert" ON locations;
DROP POLICY IF EXISTS "locations_update" ON locations;
DROP POLICY IF EXISTS "locations_delete" ON locations;

-- Vessels
DROP POLICY IF EXISTS "anon_vessels_select" ON vessels;
DROP POLICY IF EXISTS "anon_vessels_insert" ON vessels;
DROP POLICY IF EXISTS "anon_vessels_update" ON vessels;
DROP POLICY IF EXISTS "anon_vessels_delete" ON vessels;
DROP POLICY IF EXISTS "vessels_select" ON vessels;
DROP POLICY IF EXISTS "vessels_insert" ON vessels;
DROP POLICY IF EXISTS "vessels_update" ON vessels;
DROP POLICY IF EXISTS "vessels_delete" ON vessels;

-- Container types
DROP POLICY IF EXISTS "anon_container_types_select" ON container_types;
DROP POLICY IF EXISTS "anon_container_types_insert" ON container_types;
DROP POLICY IF EXISTS "anon_container_types_update" ON container_types;
DROP POLICY IF EXISTS "anon_container_types_delete" ON container_types;
DROP POLICY IF EXISTS "container_types_select" ON container_types;
DROP POLICY IF EXISTS "container_types_insert" ON container_types;
DROP POLICY IF EXISTS "container_types_update" ON container_types;
DROP POLICY IF EXISTS "container_types_delete" ON container_types;

-- Substrate types
DROP POLICY IF EXISTS "anon_substrate_types_select" ON substrate_types;
DROP POLICY IF EXISTS "anon_substrate_types_insert" ON substrate_types;
DROP POLICY IF EXISTS "anon_substrate_types_update" ON substrate_types;
DROP POLICY IF EXISTS "anon_substrate_types_delete" ON substrate_types;
DROP POLICY IF EXISTS "substrate_types_select" ON substrate_types;
DROP POLICY IF EXISTS "substrate_types_insert" ON substrate_types;
DROP POLICY IF EXISTS "substrate_types_update" ON substrate_types;
DROP POLICY IF EXISTS "substrate_types_delete" ON substrate_types;

-- Suppliers
DROP POLICY IF EXISTS "anon_suppliers_select" ON suppliers;
DROP POLICY IF EXISTS "anon_suppliers_insert" ON suppliers;
DROP POLICY IF EXISTS "anon_suppliers_update" ON suppliers;
DROP POLICY IF EXISTS "anon_suppliers_delete" ON suppliers;
DROP POLICY IF EXISTS "suppliers_select" ON suppliers;
DROP POLICY IF EXISTS "suppliers_insert" ON suppliers;
DROP POLICY IF EXISTS "suppliers_update" ON suppliers;
DROP POLICY IF EXISTS "suppliers_delete" ON suppliers;

-- Inventory categories
DROP POLICY IF EXISTS "anon_inventory_categories_select" ON inventory_categories;
DROP POLICY IF EXISTS "anon_inventory_categories_insert" ON inventory_categories;
DROP POLICY IF EXISTS "anon_inventory_categories_update" ON inventory_categories;
DROP POLICY IF EXISTS "anon_inventory_categories_delete" ON inventory_categories;
DROP POLICY IF EXISTS "inventory_categories_select" ON inventory_categories;
DROP POLICY IF EXISTS "inventory_categories_insert" ON inventory_categories;
DROP POLICY IF EXISTS "inventory_categories_update" ON inventory_categories;
DROP POLICY IF EXISTS "inventory_categories_delete" ON inventory_categories;

-- Recipe categories
DROP POLICY IF EXISTS "anon_recipe_categories_select" ON recipe_categories;
DROP POLICY IF EXISTS "anon_recipe_categories_insert" ON recipe_categories;
DROP POLICY IF EXISTS "anon_recipe_categories_update" ON recipe_categories;
DROP POLICY IF EXISTS "anon_recipe_categories_delete" ON recipe_categories;
DROP POLICY IF EXISTS "recipe_categories_select" ON recipe_categories;
DROP POLICY IF EXISTS "recipe_categories_insert" ON recipe_categories;
DROP POLICY IF EXISTS "recipe_categories_update" ON recipe_categories;
DROP POLICY IF EXISTS "recipe_categories_delete" ON recipe_categories;

-- Inventory items
DROP POLICY IF EXISTS "anon_inventory_items_select" ON inventory_items;
DROP POLICY IF EXISTS "anon_inventory_items_insert" ON inventory_items;
DROP POLICY IF EXISTS "anon_inventory_items_update" ON inventory_items;
DROP POLICY IF EXISTS "anon_inventory_items_delete" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_select" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_insert" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_update" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_delete" ON inventory_items;

-- Cultures
DROP POLICY IF EXISTS "anon_cultures_select" ON cultures;
DROP POLICY IF EXISTS "anon_cultures_insert" ON cultures;
DROP POLICY IF EXISTS "anon_cultures_update" ON cultures;
DROP POLICY IF EXISTS "anon_cultures_delete" ON cultures;
DROP POLICY IF EXISTS "cultures_select" ON cultures;
DROP POLICY IF EXISTS "cultures_insert" ON cultures;
DROP POLICY IF EXISTS "cultures_update" ON cultures;
DROP POLICY IF EXISTS "cultures_delete" ON cultures;

-- Culture observations
DROP POLICY IF EXISTS "anon_culture_observations_select" ON culture_observations;
DROP POLICY IF EXISTS "anon_culture_observations_insert" ON culture_observations;
DROP POLICY IF EXISTS "anon_culture_observations_update" ON culture_observations;
DROP POLICY IF EXISTS "anon_culture_observations_delete" ON culture_observations;
DROP POLICY IF EXISTS "culture_observations_select" ON culture_observations;
DROP POLICY IF EXISTS "culture_observations_insert" ON culture_observations;
DROP POLICY IF EXISTS "culture_observations_update" ON culture_observations;
DROP POLICY IF EXISTS "culture_observations_delete" ON culture_observations;

-- Culture transfers
DROP POLICY IF EXISTS "anon_culture_transfers_select" ON culture_transfers;
DROP POLICY IF EXISTS "anon_culture_transfers_insert" ON culture_transfers;
DROP POLICY IF EXISTS "anon_culture_transfers_update" ON culture_transfers;
DROP POLICY IF EXISTS "anon_culture_transfers_delete" ON culture_transfers;
DROP POLICY IF EXISTS "culture_transfers_select" ON culture_transfers;
DROP POLICY IF EXISTS "culture_transfers_insert" ON culture_transfers;
DROP POLICY IF EXISTS "culture_transfers_update" ON culture_transfers;
DROP POLICY IF EXISTS "culture_transfers_delete" ON culture_transfers;

-- Grows
DROP POLICY IF EXISTS "anon_grows_select" ON grows;
DROP POLICY IF EXISTS "anon_grows_insert" ON grows;
DROP POLICY IF EXISTS "anon_grows_update" ON grows;
DROP POLICY IF EXISTS "anon_grows_delete" ON grows;
DROP POLICY IF EXISTS "grows_select" ON grows;
DROP POLICY IF EXISTS "grows_insert" ON grows;
DROP POLICY IF EXISTS "grows_update" ON grows;
DROP POLICY IF EXISTS "grows_delete" ON grows;

-- Grow observations
DROP POLICY IF EXISTS "anon_grow_observations_select" ON grow_observations;
DROP POLICY IF EXISTS "anon_grow_observations_insert" ON grow_observations;
DROP POLICY IF EXISTS "anon_grow_observations_update" ON grow_observations;
DROP POLICY IF EXISTS "anon_grow_observations_delete" ON grow_observations;
DROP POLICY IF EXISTS "grow_observations_select" ON grow_observations;
DROP POLICY IF EXISTS "grow_observations_insert" ON grow_observations;
DROP POLICY IF EXISTS "grow_observations_update" ON grow_observations;
DROP POLICY IF EXISTS "grow_observations_delete" ON grow_observations;

-- Flushes
DROP POLICY IF EXISTS "anon_flushes_select" ON flushes;
DROP POLICY IF EXISTS "anon_flushes_insert" ON flushes;
DROP POLICY IF EXISTS "anon_flushes_update" ON flushes;
DROP POLICY IF EXISTS "anon_flushes_delete" ON flushes;
DROP POLICY IF EXISTS "flushes_select" ON flushes;
DROP POLICY IF EXISTS "flushes_insert" ON flushes;
DROP POLICY IF EXISTS "flushes_update" ON flushes;
DROP POLICY IF EXISTS "flushes_delete" ON flushes;

-- Recipes
DROP POLICY IF EXISTS "anon_recipes_select" ON recipes;
DROP POLICY IF EXISTS "anon_recipes_insert" ON recipes;
DROP POLICY IF EXISTS "anon_recipes_update" ON recipes;
DROP POLICY IF EXISTS "anon_recipes_delete" ON recipes;
DROP POLICY IF EXISTS "recipes_select" ON recipes;
DROP POLICY IF EXISTS "recipes_insert" ON recipes;
DROP POLICY IF EXISTS "recipes_update" ON recipes;
DROP POLICY IF EXISTS "recipes_delete" ON recipes;

-- Recipe ingredients
DROP POLICY IF EXISTS "anon_recipe_ingredients_select" ON recipe_ingredients;
DROP POLICY IF EXISTS "anon_recipe_ingredients_insert" ON recipe_ingredients;
DROP POLICY IF EXISTS "anon_recipe_ingredients_update" ON recipe_ingredients;
DROP POLICY IF EXISTS "anon_recipe_ingredients_delete" ON recipe_ingredients;
DROP POLICY IF EXISTS "recipe_ingredients_select" ON recipe_ingredients;
DROP POLICY IF EXISTS "recipe_ingredients_insert" ON recipe_ingredients;
DROP POLICY IF EXISTS "recipe_ingredients_update" ON recipe_ingredients;
DROP POLICY IF EXISTS "recipe_ingredients_delete" ON recipe_ingredients;

-- User settings
DROP POLICY IF EXISTS "anon_user_settings_select" ON user_settings;
DROP POLICY IF EXISTS "anon_user_settings_insert" ON user_settings;
DROP POLICY IF EXISTS "anon_user_settings_update" ON user_settings;
DROP POLICY IF EXISTS "anon_user_settings_delete" ON user_settings;
DROP POLICY IF EXISTS "user_settings_select" ON user_settings;
DROP POLICY IF EXISTS "user_settings_insert" ON user_settings;
DROP POLICY IF EXISTS "user_settings_update" ON user_settings;
DROP POLICY IF EXISTS "user_settings_delete" ON user_settings;

-- Grain types
DROP POLICY IF EXISTS "anon_grain_types_select" ON grain_types;
DROP POLICY IF EXISTS "anon_grain_types_insert" ON grain_types;
DROP POLICY IF EXISTS "anon_grain_types_update" ON grain_types;
DROP POLICY IF EXISTS "anon_grain_types_delete" ON grain_types;
DROP POLICY IF EXISTS "grain_types_select" ON grain_types;
DROP POLICY IF EXISTS "grain_types_insert" ON grain_types;
DROP POLICY IF EXISTS "grain_types_update" ON grain_types;
DROP POLICY IF EXISTS "grain_types_delete" ON grain_types;

-- Purchase orders
DROP POLICY IF EXISTS "anon_purchase_orders_select" ON purchase_orders;
DROP POLICY IF EXISTS "anon_purchase_orders_insert" ON purchase_orders;
DROP POLICY IF EXISTS "anon_purchase_orders_update" ON purchase_orders;
DROP POLICY IF EXISTS "anon_purchase_orders_delete" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_select" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_delete" ON purchase_orders;

-- Inventory lots
DROP POLICY IF EXISTS "anon_inventory_lots_select" ON inventory_lots;
DROP POLICY IF EXISTS "anon_inventory_lots_insert" ON inventory_lots;
DROP POLICY IF EXISTS "anon_inventory_lots_update" ON inventory_lots;
DROP POLICY IF EXISTS "anon_inventory_lots_delete" ON inventory_lots;
DROP POLICY IF EXISTS "inventory_lots_select" ON inventory_lots;
DROP POLICY IF EXISTS "inventory_lots_insert" ON inventory_lots;
DROP POLICY IF EXISTS "inventory_lots_update" ON inventory_lots;
DROP POLICY IF EXISTS "inventory_lots_delete" ON inventory_lots;

-- Inventory usages
DROP POLICY IF EXISTS "anon_inventory_usages_select" ON inventory_usages;
DROP POLICY IF EXISTS "anon_inventory_usages_insert" ON inventory_usages;
DROP POLICY IF EXISTS "anon_inventory_usages_update" ON inventory_usages;
DROP POLICY IF EXISTS "anon_inventory_usages_delete" ON inventory_usages;
DROP POLICY IF EXISTS "inventory_usages_select" ON inventory_usages;
DROP POLICY IF EXISTS "inventory_usages_insert" ON inventory_usages;
DROP POLICY IF EXISTS "inventory_usages_update" ON inventory_usages;
DROP POLICY IF EXISTS "inventory_usages_delete" ON inventory_usages;

-- ============================================================================
-- CREATE ALL POLICIES
-- ============================================================================

-- User profiles policies (users can only see their own, admins see all)
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "user_profiles_delete" ON user_profiles FOR DELETE USING (is_admin());

-- Admin audit log policies (admin only)
CREATE POLICY "admin_audit_log_select" ON admin_audit_log FOR SELECT USING (is_admin());
CREATE POLICY "admin_audit_log_insert" ON admin_audit_log FOR INSERT WITH CHECK (is_admin());

-- Admin notifications policies (admin only)
CREATE POLICY "admin_notifications_select" ON admin_notifications FOR SELECT USING (is_admin());
CREATE POLICY "admin_notifications_insert" ON admin_notifications FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "admin_notifications_update" ON admin_notifications FOR UPDATE USING (is_admin());
CREATE POLICY "admin_notifications_delete" ON admin_notifications FOR DELETE USING (is_admin());

-- Species policies (shared defaults + user's own)
CREATE POLICY "species_select" ON species FOR SELECT USING (user_id IS NULL OR user_id = auth.uid() OR is_admin());
CREATE POLICY "species_insert" ON species FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "species_update" ON species FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "species_delete" ON species FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Strains policies (shared defaults + user's own)
CREATE POLICY "strains_select" ON strains FOR SELECT USING (user_id IS NULL OR user_id = auth.uid() OR is_admin());
CREATE POLICY "strains_insert" ON strains FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "strains_update" ON strains FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "strains_delete" ON strains FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Location Types policies (shared defaults + user's own)
CREATE POLICY "location_types_select" ON location_types FOR SELECT USING (user_id IS NULL OR user_id = auth.uid() OR is_admin());
CREATE POLICY "location_types_insert" ON location_types FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "location_types_update" ON location_types FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "location_types_delete" ON location_types FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Location Classifications policies (shared defaults + user's own)
CREATE POLICY "location_classifications_select" ON location_classifications FOR SELECT USING (user_id IS NULL OR user_id = auth.uid() OR is_admin());
CREATE POLICY "location_classifications_insert" ON location_classifications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "location_classifications_update" ON location_classifications FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "location_classifications_delete" ON location_classifications FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Locations policies (user's own only)
CREATE POLICY "locations_select" ON locations FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "locations_insert" ON locations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "locations_update" ON locations FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "locations_delete" ON locations FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Vessels policies (shared defaults + user's own)
CREATE POLICY "vessels_select" ON vessels FOR SELECT USING (user_id IS NULL OR user_id = auth.uid() OR is_admin());
CREATE POLICY "vessels_insert" ON vessels FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "vessels_update" ON vessels FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "vessels_delete" ON vessels FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Container types policies (shared defaults + user's own)
CREATE POLICY "container_types_select" ON container_types FOR SELECT USING (user_id IS NULL OR user_id = auth.uid() OR is_admin());
CREATE POLICY "container_types_insert" ON container_types FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "container_types_update" ON container_types FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "container_types_delete" ON container_types FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Substrate types policies (shared defaults + user's own)
CREATE POLICY "substrate_types_select" ON substrate_types FOR SELECT USING (user_id IS NULL OR user_id = auth.uid() OR is_admin());
CREATE POLICY "substrate_types_insert" ON substrate_types FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "substrate_types_update" ON substrate_types FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "substrate_types_delete" ON substrate_types FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Suppliers policies (user's own only)
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Inventory categories policies (shared defaults + user's own)
CREATE POLICY "inventory_categories_select" ON inventory_categories FOR SELECT USING (user_id IS NULL OR user_id = auth.uid() OR is_admin());
CREATE POLICY "inventory_categories_insert" ON inventory_categories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "inventory_categories_update" ON inventory_categories FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "inventory_categories_delete" ON inventory_categories FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Recipe categories policies (shared defaults + user's own)
CREATE POLICY "recipe_categories_select" ON recipe_categories FOR SELECT USING (user_id IS NULL OR user_id = auth.uid() OR is_admin());
CREATE POLICY "recipe_categories_insert" ON recipe_categories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "recipe_categories_update" ON recipe_categories FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "recipe_categories_delete" ON recipe_categories FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Inventory items policies (user's own only - private data)
CREATE POLICY "inventory_items_select" ON inventory_items FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "inventory_items_insert" ON inventory_items FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "inventory_items_update" ON inventory_items FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "inventory_items_delete" ON inventory_items FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Cultures policies (user's own only - private data)
CREATE POLICY "cultures_select" ON cultures FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "cultures_insert" ON cultures FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "cultures_update" ON cultures FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "cultures_delete" ON cultures FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Culture observations policies (user's own only)
CREATE POLICY "culture_observations_select" ON culture_observations FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "culture_observations_insert" ON culture_observations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "culture_observations_update" ON culture_observations FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "culture_observations_delete" ON culture_observations FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Culture transfers policies (user's own only)
CREATE POLICY "culture_transfers_select" ON culture_transfers FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "culture_transfers_insert" ON culture_transfers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "culture_transfers_update" ON culture_transfers FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "culture_transfers_delete" ON culture_transfers FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Grows policies (user's own only - private data)
CREATE POLICY "grows_select" ON grows FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "grows_insert" ON grows FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "grows_update" ON grows FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "grows_delete" ON grows FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Grow observations policies (user's own only)
CREATE POLICY "grow_observations_select" ON grow_observations FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "grow_observations_insert" ON grow_observations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "grow_observations_update" ON grow_observations FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "grow_observations_delete" ON grow_observations FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Flushes policies (user's own only)
CREATE POLICY "flushes_select" ON flushes FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "flushes_insert" ON flushes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "flushes_update" ON flushes FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "flushes_delete" ON flushes FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Recipes policies (user's own only - private data)
CREATE POLICY "recipes_select" ON recipes FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "recipes_insert" ON recipes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "recipes_update" ON recipes FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "recipes_delete" ON recipes FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Recipe ingredients policies (user's own only)
CREATE POLICY "recipe_ingredients_select" ON recipe_ingredients FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "recipe_ingredients_insert" ON recipe_ingredients FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "recipe_ingredients_update" ON recipe_ingredients FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "recipe_ingredients_delete" ON recipe_ingredients FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- User settings policies (user's own only)
CREATE POLICY "user_settings_select" ON user_settings FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "user_settings_insert" ON user_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_settings_update" ON user_settings FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "user_settings_delete" ON user_settings FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Grain types policies (shared defaults + user's own)
CREATE POLICY "grain_types_select" ON grain_types FOR SELECT USING (user_id IS NULL OR user_id = auth.uid() OR is_admin());
CREATE POLICY "grain_types_insert" ON grain_types FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "grain_types_update" ON grain_types FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "grain_types_delete" ON grain_types FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Purchase orders policies (user's own only - private data)
CREATE POLICY "purchase_orders_select" ON purchase_orders FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "purchase_orders_insert" ON purchase_orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "purchase_orders_update" ON purchase_orders FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "purchase_orders_delete" ON purchase_orders FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Inventory lots policies (user's own only)
CREATE POLICY "inventory_lots_select" ON inventory_lots FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "inventory_lots_insert" ON inventory_lots FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "inventory_lots_update" ON inventory_lots FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "inventory_lots_delete" ON inventory_lots FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Inventory usages policies (user's own only)
CREATE POLICY "inventory_usages_select" ON inventory_usages FOR SELECT USING (used_by = auth.uid() OR is_admin());
CREATE POLICY "inventory_usages_insert" ON inventory_usages FOR INSERT WITH CHECK (used_by = auth.uid());
CREATE POLICY "inventory_usages_update" ON inventory_usages FOR UPDATE USING (used_by = auth.uid() OR is_admin());
CREATE POLICY "inventory_usages_delete" ON inventory_usages FOR DELETE USING (used_by = auth.uid() OR is_admin());

-- ============================================================================
-- TRIGGERS (using CREATE OR REPLACE for idempotency)
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist, then recreate
DROP TRIGGER IF EXISTS update_species_updated_at ON species;
DROP TRIGGER IF EXISTS update_strains_updated_at ON strains;
DROP TRIGGER IF EXISTS update_location_types_updated_at ON location_types;
DROP TRIGGER IF EXISTS update_location_classifications_updated_at ON location_classifications;
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
DROP TRIGGER IF EXISTS update_vessels_updated_at ON vessels;
DROP TRIGGER IF EXISTS update_container_types_updated_at ON container_types;
DROP TRIGGER IF EXISTS update_substrate_types_updated_at ON substrate_types;
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
DROP TRIGGER IF EXISTS update_inventory_categories_updated_at ON inventory_categories;
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
DROP TRIGGER IF EXISTS update_cultures_updated_at ON cultures;
DROP TRIGGER IF EXISTS update_grows_updated_at ON grows;
DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP TRIGGER IF EXISTS update_grain_types_updated_at ON grain_types;
DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
DROP TRIGGER IF EXISTS update_inventory_lots_updated_at ON inventory_lots;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_recipe_categories_updated_at ON recipe_categories;

CREATE TRIGGER update_species_updated_at BEFORE UPDATE ON species FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_strains_updated_at BEFORE UPDATE ON strains FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_location_types_updated_at BEFORE UPDATE ON location_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_location_classifications_updated_at BEFORE UPDATE ON location_classifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_vessels_updated_at BEFORE UPDATE ON vessels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_container_types_updated_at BEFORE UPDATE ON container_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_substrate_types_updated_at BEFORE UPDATE ON substrate_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inventory_categories_updated_at BEFORE UPDATE ON inventory_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cultures_updated_at BEFORE UPDATE ON cultures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_grows_updated_at BEFORE UPDATE ON grows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_grain_types_updated_at BEFORE UPDATE ON grain_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inventory_lots_updated_at BEFORE UPDATE ON inventory_lots FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_recipe_categories_updated_at BEFORE UPDATE ON recipe_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- INDEXES (wrapped in DO blocks for safety)
-- ============================================================================

-- Create indexes only if the columns exist
DO $$ 
BEGIN
  -- Species indexes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'species' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_species_user_id ON species(user_id);
  END IF;
  
  -- Strains indexes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strains' AND column_name = 'species_id') THEN
    CREATE INDEX IF NOT EXISTS idx_strains_species_id ON strains(species_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strains' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_strains_user_id ON strains(user_id);
  END IF;
  
  -- Cultures indexes
  CREATE INDEX IF NOT EXISTS idx_cultures_strain_id ON cultures(strain_id);
  CREATE INDEX IF NOT EXISTS idx_cultures_parent_id ON cultures(parent_id);
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_cultures_user_id ON cultures(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'recipe_id') THEN
    CREATE INDEX IF NOT EXISTS idx_cultures_recipe_id ON cultures(recipe_id);
  END IF;
  
  -- Grows indexes
  CREATE INDEX IF NOT EXISTS idx_grows_strain_id ON grows(strain_id);
  CREATE INDEX IF NOT EXISTS idx_grows_source_culture_id ON grows(source_culture_id);
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_grows_user_id ON grows(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_grows_status ON grows(status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'current_stage') THEN
    CREATE INDEX IF NOT EXISTS idx_grows_current_stage ON grows(current_stage);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grows' AND column_name = 'recipe_id') THEN
    CREATE INDEX IF NOT EXISTS idx_grows_recipe_id ON grows(recipe_id);
  END IF;

  -- Cultures additional indexes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_cultures_status ON cultures(status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'supplier_id') THEN
    CREATE INDEX IF NOT EXISTS idx_cultures_supplier_id ON cultures(supplier_id);
  END IF;

  -- Other indexes
  CREATE INDEX IF NOT EXISTS idx_flushes_grow_id ON flushes(grow_id);
  CREATE INDEX IF NOT EXISTS idx_grow_observations_grow_id ON grow_observations(grow_id);
  CREATE INDEX IF NOT EXISTS idx_culture_observations_culture_id ON culture_observations(culture_id);
  CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
  CREATE INDEX IF NOT EXISTS idx_inventory_items_category_id ON inventory_items(category_id);
  CREATE INDEX IF NOT EXISTS idx_inventory_lots_inventory_item_id ON inventory_lots(inventory_item_id);
  CREATE INDEX IF NOT EXISTS idx_inventory_usages_lot_id ON inventory_usages(lot_id);
  CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);

  -- Admin notifications indexes
  CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
  CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
  CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
END $$;

-- ============================================================================
-- SCHEMA VERSION (for tracking migrations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_version (
  id INTEGER PRIMARY KEY DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO schema_version (id, version) VALUES (1, 15)
ON CONFLICT (id) DO UPDATE SET version = 15, updated_at = NOW();

-- ============================================================================
-- VERSION HISTORY
-- ============================================================================
-- v15 (2024-12): Fix species seed data re-run safety:
--               - Added conditional check to skip seeding if 5+ species exist
--               - Added partial unique index on species.name for global species
--               - Added ON CONFLICT DO NOTHING to all species INSERTs
--               - Fixed DELETE to exclude species referenced by strains
-- v14 (2024-12): Schema robustness improvements:
--               - Fixed FK ordering issue: locations.supplier_id now added via
--                 ALTER TABLE after suppliers table exists
--               - Added species stage notes columns (spawn_colonization_notes,
--                 bulk_colonization_notes, pinning_notes, maturation_notes)
--               - Fixed recipe transforms for sourceUrl and costPerBatch
-- v13 (2024-12): Fix inventory_items column name - add cost_per_unit migration
--               for databases missing this column
-- v12 (2024-12): Automation-ready species data enhancements:
--                - automation_config JSONB column for IoT/sensor integration
--                - JSONB grow phase columns now support extended structure:
--                  * co2Range, lightSchedule for detailed environmental control
--                  * transitionCriteria for automated stage advancement
--                  * criticalParameters for prioritized monitoring
--                  * faeFrequency, equipmentNotes for controller hints
--                - EnvironmentalRange types now support warning/critical thresholds
--                - Ready for future sensor polling, alerts, and data retention config
-- v11 (2024-12): Comprehensive species data with grow cycle parameters:
--                - spawn_colonization, bulk_colonization, pinning, maturation (JSONB)
--                  Each contains tempRange, humidityRange, daysMin/Max, co2Tolerance, lightRequirement
--                - preferred_substrates (TEXT[]), substrate_notes
--                - difficulty, characteristics, flavor_profile, culinary_notes, medicinal_properties
--                - community_tips, important_facts, typical_yield, flush_count
--                - shelf_life_days_min/max
--                Updated seed data with accurate temperatures and parameters for 20+ species
-- v10 (2024-12): Enhanced strains table with taxonomy tracking:
--                - variety, phenotype, genetics_source, isolation_type
--                - generation, origin, description fields
--                Enables precise tracking of genetic lineage and phenotypes
-- v9 (2024-12): Added default species seed data with proper scientific names,
--               common names, and categories. 35 species across gourmet (21),
--               medicinal (8), and research (6) categories.
-- v8 (2024-12): Comprehensive schema sync with application types
--               - grows: status, current_stage, spawn_type, spawn_weight, substrate_weight,
--                 spawn_rate, spawned_at, colonization_started_at, fruiting_started_at,
--                 completed_at, first_pins_at, first_harvest_at, target_temp_colonization,
--                 target_temp_fruiting, target_humidity, total_yield, estimated_cost, recipe_id
--               - cultures: health_rating, cost, supplier_id, lot_number, expires_at,
--                 updated status constraint with all app statuses
--               - recipes: sterilization_time, sterilization_psi, tips, source_url,
--                 cost_per_batch, updated category constraint
--               - flushes: mushroom_count, quality
--               - inventory_items: sku, reorder_point, reorder_qty, unit_cost
--               - strains: species_id FK
--               - substrate_types: code column
-- v7 (2024-12): Added migration for suppliers table columns (website, email,
--               phone, notes) for existing databases
-- v6 (2024-12): Added admin_notifications table for admin alerting system
--               with automatic notifications for user signups
-- v5 (2024-12): Added populate_default_user_data function with error handling
--               to prevent signup failures from FK violations
-- v4: Added user_profiles table and admin functionality
-- v3: Added purchase orders and inventory lots
-- v2: Added location types, classifications, and enhanced fields
-- v1: Initial schema

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see this, the schema was applied successfully!
-- You can now connect your MycoLab app to this database.