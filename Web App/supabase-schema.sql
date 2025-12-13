-- ============================================================================
-- MYCOLAB DATABASE SCHEMA (Idempotent - Safe to run multiple times)
-- Run this in your Supabase SQL Editor to set up the database
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
  supplier_id UUID REFERENCES suppliers(id),
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
  quantity DECIMAL DEFAULT 0,
  unit TEXT DEFAULT 'units',
  min_quantity DECIMAL DEFAULT 0,
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
  
  -- Other indexes
  CREATE INDEX IF NOT EXISTS idx_flushes_grow_id ON flushes(grow_id);
  CREATE INDEX IF NOT EXISTS idx_grow_observations_grow_id ON grow_observations(grow_id);
  CREATE INDEX IF NOT EXISTS idx_culture_observations_culture_id ON culture_observations(culture_id);
  CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
  CREATE INDEX IF NOT EXISTS idx_inventory_items_category_id ON inventory_items(category_id);
  CREATE INDEX IF NOT EXISTS idx_inventory_lots_inventory_item_id ON inventory_lots(inventory_item_id);
  CREATE INDEX IF NOT EXISTS idx_inventory_usages_lot_id ON inventory_usages(lot_id);
  CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
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

INSERT INTO schema_version (id, version) VALUES (1, 4)
ON CONFLICT (id) DO UPDATE SET version = 4, updated_at = NOW();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see this, the schema was applied successfully!
-- You can now connect your MycoLab app to this database.