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

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('incubation', 'fruiting', 'storage', 'lab', 'other')) DEFAULT 'lab',
  temp_min INTEGER,
  temp_max INTEGER,
  humidity_min INTEGER,
  humidity_max INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

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

-- ============================================================================
-- CORE DATA TABLES
-- ============================================================================

-- Inventory items
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
  quantity DECIMAL,
  unit TEXT,
  to_type TEXT,
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

-- Recipes
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

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE species ENABLE ROW LEVEL SECURITY;
ALTER TABLE strains ENABLE ROW LEVEL SECURITY;
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

-- ============================================================================
-- OPTION A: ANONYMOUS ACCESS (for testing/single-user without auth)
-- Drop existing policies first, then create new ones
-- ============================================================================

-- Species policies
DROP POLICY IF EXISTS "anon_species_select" ON species;
DROP POLICY IF EXISTS "anon_species_insert" ON species;
DROP POLICY IF EXISTS "anon_species_update" ON species;
DROP POLICY IF EXISTS "anon_species_delete" ON species;
CREATE POLICY "anon_species_select" ON species FOR SELECT USING (true);
CREATE POLICY "anon_species_insert" ON species FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_species_update" ON species FOR UPDATE USING (true);
CREATE POLICY "anon_species_delete" ON species FOR DELETE USING (true);

-- Strains policies
DROP POLICY IF EXISTS "anon_strains_select" ON strains;
DROP POLICY IF EXISTS "anon_strains_insert" ON strains;
DROP POLICY IF EXISTS "anon_strains_update" ON strains;
DROP POLICY IF EXISTS "anon_strains_delete" ON strains;
CREATE POLICY "anon_strains_select" ON strains FOR SELECT USING (true);
CREATE POLICY "anon_strains_insert" ON strains FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_strains_update" ON strains FOR UPDATE USING (true);
CREATE POLICY "anon_strains_delete" ON strains FOR DELETE USING (true);

-- Locations policies
DROP POLICY IF EXISTS "anon_locations_select" ON locations;
DROP POLICY IF EXISTS "anon_locations_insert" ON locations;
DROP POLICY IF EXISTS "anon_locations_update" ON locations;
DROP POLICY IF EXISTS "anon_locations_delete" ON locations;
CREATE POLICY "anon_locations_select" ON locations FOR SELECT USING (true);
CREATE POLICY "anon_locations_insert" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_locations_update" ON locations FOR UPDATE USING (true);
CREATE POLICY "anon_locations_delete" ON locations FOR DELETE USING (true);

-- Vessels policies
DROP POLICY IF EXISTS "anon_vessels_select" ON vessels;
DROP POLICY IF EXISTS "anon_vessels_insert" ON vessels;
DROP POLICY IF EXISTS "anon_vessels_update" ON vessels;
DROP POLICY IF EXISTS "anon_vessels_delete" ON vessels;
CREATE POLICY "anon_vessels_select" ON vessels FOR SELECT USING (true);
CREATE POLICY "anon_vessels_insert" ON vessels FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_vessels_update" ON vessels FOR UPDATE USING (true);
CREATE POLICY "anon_vessels_delete" ON vessels FOR DELETE USING (true);

-- Container types policies
DROP POLICY IF EXISTS "anon_container_types_select" ON container_types;
DROP POLICY IF EXISTS "anon_container_types_insert" ON container_types;
DROP POLICY IF EXISTS "anon_container_types_update" ON container_types;
DROP POLICY IF EXISTS "anon_container_types_delete" ON container_types;
CREATE POLICY "anon_container_types_select" ON container_types FOR SELECT USING (true);
CREATE POLICY "anon_container_types_insert" ON container_types FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_container_types_update" ON container_types FOR UPDATE USING (true);
CREATE POLICY "anon_container_types_delete" ON container_types FOR DELETE USING (true);

-- Substrate types policies
DROP POLICY IF EXISTS "anon_substrate_types_select" ON substrate_types;
DROP POLICY IF EXISTS "anon_substrate_types_insert" ON substrate_types;
DROP POLICY IF EXISTS "anon_substrate_types_update" ON substrate_types;
DROP POLICY IF EXISTS "anon_substrate_types_delete" ON substrate_types;
CREATE POLICY "anon_substrate_types_select" ON substrate_types FOR SELECT USING (true);
CREATE POLICY "anon_substrate_types_insert" ON substrate_types FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_substrate_types_update" ON substrate_types FOR UPDATE USING (true);
CREATE POLICY "anon_substrate_types_delete" ON substrate_types FOR DELETE USING (true);

-- Suppliers policies
DROP POLICY IF EXISTS "anon_suppliers_select" ON suppliers;
DROP POLICY IF EXISTS "anon_suppliers_insert" ON suppliers;
DROP POLICY IF EXISTS "anon_suppliers_update" ON suppliers;
DROP POLICY IF EXISTS "anon_suppliers_delete" ON suppliers;
CREATE POLICY "anon_suppliers_select" ON suppliers FOR SELECT USING (true);
CREATE POLICY "anon_suppliers_insert" ON suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_suppliers_update" ON suppliers FOR UPDATE USING (true);
CREATE POLICY "anon_suppliers_delete" ON suppliers FOR DELETE USING (true);

-- Inventory categories policies
DROP POLICY IF EXISTS "anon_inventory_categories_select" ON inventory_categories;
DROP POLICY IF EXISTS "anon_inventory_categories_insert" ON inventory_categories;
DROP POLICY IF EXISTS "anon_inventory_categories_update" ON inventory_categories;
DROP POLICY IF EXISTS "anon_inventory_categories_delete" ON inventory_categories;
CREATE POLICY "anon_inventory_categories_select" ON inventory_categories FOR SELECT USING (true);
CREATE POLICY "anon_inventory_categories_insert" ON inventory_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_inventory_categories_update" ON inventory_categories FOR UPDATE USING (true);
CREATE POLICY "anon_inventory_categories_delete" ON inventory_categories FOR DELETE USING (true);

-- Inventory items policies
DROP POLICY IF EXISTS "anon_inventory_items_select" ON inventory_items;
DROP POLICY IF EXISTS "anon_inventory_items_insert" ON inventory_items;
DROP POLICY IF EXISTS "anon_inventory_items_update" ON inventory_items;
DROP POLICY IF EXISTS "anon_inventory_items_delete" ON inventory_items;
CREATE POLICY "anon_inventory_items_select" ON inventory_items FOR SELECT USING (true);
CREATE POLICY "anon_inventory_items_insert" ON inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_inventory_items_update" ON inventory_items FOR UPDATE USING (true);
CREATE POLICY "anon_inventory_items_delete" ON inventory_items FOR DELETE USING (true);

-- Cultures policies
DROP POLICY IF EXISTS "anon_cultures_select" ON cultures;
DROP POLICY IF EXISTS "anon_cultures_insert" ON cultures;
DROP POLICY IF EXISTS "anon_cultures_update" ON cultures;
DROP POLICY IF EXISTS "anon_cultures_delete" ON cultures;
CREATE POLICY "anon_cultures_select" ON cultures FOR SELECT USING (true);
CREATE POLICY "anon_cultures_insert" ON cultures FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_cultures_update" ON cultures FOR UPDATE USING (true);
CREATE POLICY "anon_cultures_delete" ON cultures FOR DELETE USING (true);

-- Culture observations policies
DROP POLICY IF EXISTS "anon_culture_observations_select" ON culture_observations;
DROP POLICY IF EXISTS "anon_culture_observations_insert" ON culture_observations;
DROP POLICY IF EXISTS "anon_culture_observations_update" ON culture_observations;
DROP POLICY IF EXISTS "anon_culture_observations_delete" ON culture_observations;
CREATE POLICY "anon_culture_observations_select" ON culture_observations FOR SELECT USING (true);
CREATE POLICY "anon_culture_observations_insert" ON culture_observations FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_culture_observations_update" ON culture_observations FOR UPDATE USING (true);
CREATE POLICY "anon_culture_observations_delete" ON culture_observations FOR DELETE USING (true);

-- Culture transfers policies
DROP POLICY IF EXISTS "anon_culture_transfers_select" ON culture_transfers;
DROP POLICY IF EXISTS "anon_culture_transfers_insert" ON culture_transfers;
DROP POLICY IF EXISTS "anon_culture_transfers_update" ON culture_transfers;
DROP POLICY IF EXISTS "anon_culture_transfers_delete" ON culture_transfers;
CREATE POLICY "anon_culture_transfers_select" ON culture_transfers FOR SELECT USING (true);
CREATE POLICY "anon_culture_transfers_insert" ON culture_transfers FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_culture_transfers_update" ON culture_transfers FOR UPDATE USING (true);
CREATE POLICY "anon_culture_transfers_delete" ON culture_transfers FOR DELETE USING (true);

-- Grows policies
DROP POLICY IF EXISTS "anon_grows_select" ON grows;
DROP POLICY IF EXISTS "anon_grows_insert" ON grows;
DROP POLICY IF EXISTS "anon_grows_update" ON grows;
DROP POLICY IF EXISTS "anon_grows_delete" ON grows;
CREATE POLICY "anon_grows_select" ON grows FOR SELECT USING (true);
CREATE POLICY "anon_grows_insert" ON grows FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_grows_update" ON grows FOR UPDATE USING (true);
CREATE POLICY "anon_grows_delete" ON grows FOR DELETE USING (true);

-- Grow observations policies
DROP POLICY IF EXISTS "anon_grow_observations_select" ON grow_observations;
DROP POLICY IF EXISTS "anon_grow_observations_insert" ON grow_observations;
DROP POLICY IF EXISTS "anon_grow_observations_update" ON grow_observations;
DROP POLICY IF EXISTS "anon_grow_observations_delete" ON grow_observations;
CREATE POLICY "anon_grow_observations_select" ON grow_observations FOR SELECT USING (true);
CREATE POLICY "anon_grow_observations_insert" ON grow_observations FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_grow_observations_update" ON grow_observations FOR UPDATE USING (true);
CREATE POLICY "anon_grow_observations_delete" ON grow_observations FOR DELETE USING (true);

-- Flushes policies
DROP POLICY IF EXISTS "anon_flushes_select" ON flushes;
DROP POLICY IF EXISTS "anon_flushes_insert" ON flushes;
DROP POLICY IF EXISTS "anon_flushes_update" ON flushes;
DROP POLICY IF EXISTS "anon_flushes_delete" ON flushes;
CREATE POLICY "anon_flushes_select" ON flushes FOR SELECT USING (true);
CREATE POLICY "anon_flushes_insert" ON flushes FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_flushes_update" ON flushes FOR UPDATE USING (true);
CREATE POLICY "anon_flushes_delete" ON flushes FOR DELETE USING (true);

-- Recipes policies
DROP POLICY IF EXISTS "anon_recipes_select" ON recipes;
DROP POLICY IF EXISTS "anon_recipes_insert" ON recipes;
DROP POLICY IF EXISTS "anon_recipes_update" ON recipes;
DROP POLICY IF EXISTS "anon_recipes_delete" ON recipes;
CREATE POLICY "anon_recipes_select" ON recipes FOR SELECT USING (true);
CREATE POLICY "anon_recipes_insert" ON recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_recipes_update" ON recipes FOR UPDATE USING (true);
CREATE POLICY "anon_recipes_delete" ON recipes FOR DELETE USING (true);

-- Recipe ingredients policies
DROP POLICY IF EXISTS "anon_recipe_ingredients_select" ON recipe_ingredients;
DROP POLICY IF EXISTS "anon_recipe_ingredients_insert" ON recipe_ingredients;
DROP POLICY IF EXISTS "anon_recipe_ingredients_update" ON recipe_ingredients;
DROP POLICY IF EXISTS "anon_recipe_ingredients_delete" ON recipe_ingredients;
CREATE POLICY "anon_recipe_ingredients_select" ON recipe_ingredients FOR SELECT USING (true);
CREATE POLICY "anon_recipe_ingredients_insert" ON recipe_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_recipe_ingredients_update" ON recipe_ingredients FOR UPDATE USING (true);
CREATE POLICY "anon_recipe_ingredients_delete" ON recipe_ingredients FOR DELETE USING (true);

-- User settings policies
DROP POLICY IF EXISTS "anon_user_settings_select" ON user_settings;
DROP POLICY IF EXISTS "anon_user_settings_insert" ON user_settings;
DROP POLICY IF EXISTS "anon_user_settings_update" ON user_settings;
DROP POLICY IF EXISTS "anon_user_settings_delete" ON user_settings;
CREATE POLICY "anon_user_settings_select" ON user_settings FOR SELECT USING (true);
CREATE POLICY "anon_user_settings_insert" ON user_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_user_settings_update" ON user_settings FOR UPDATE USING (true);
CREATE POLICY "anon_user_settings_delete" ON user_settings FOR DELETE USING (true);

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

CREATE TRIGGER update_species_updated_at BEFORE UPDATE ON species FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_strains_updated_at BEFORE UPDATE ON strains FOR EACH ROW EXECUTE FUNCTION update_updated_at();
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

INSERT INTO schema_version (id, version) VALUES (1, 1)
ON CONFLICT (id) DO UPDATE SET version = 1, updated_at = NOW();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see this, the schema was applied successfully!
-- You can now connect your MycoLab app to this database.

-- Add missing columns to culture_transfers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'culture_transfers' AND column_name = 'quantity') THEN
    ALTER TABLE culture_transfers ADD COLUMN quantity DECIMAL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'culture_transfers' AND column_name = 'unit') THEN
    ALTER TABLE culture_transfers ADD COLUMN unit TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'culture_transfers' AND column_name = 'to_type') THEN
    ALTER TABLE culture_transfers ADD COLUMN to_type TEXT;
  END IF;
END $$;
