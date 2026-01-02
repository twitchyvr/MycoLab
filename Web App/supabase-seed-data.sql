-- ============================================================================
-- SPORELY SEED DATA (Idempotent - Safe to run multiple times)
-- Run this AFTER supabase-schema.sql to populate default data
-- ============================================================================
--
-- DATA TIERS:
-- 1. SYSTEM DATA (user_id = NULL): Read-only reference data all users can see
--    - Containers, Substrate Types, Inventory Categories, Recipe Categories, Grain Types
--    - Location Types, Location Classifications
--    - (Species & Strains in separate file: supabase-species-data.sql)
--    Users cannot modify/delete these - they are global defaults
--
-- 2. DEFAULT USER DATA: Created when a user signs up
--    - Example locations they can customize
--    - Starter recipes to get them going
--    Users CAN modify/delete these but probably won't want to
--
-- 3. USER DATA: Empty - users create their own
--    - Cultures, Grows, Inventory Items, Purchase Orders, etc.
-- ============================================================================

-- ============================================================================
-- SECTION 1: SYSTEM-LEVEL SEED DATA (user_id = NULL)
-- These are global defaults visible to all users but not editable
-- ============================================================================
-- NOTE: Species and Strains data has been moved to supabase-species-data.sql
-- Run that file separately to load species/strains data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CONTAINERS - Unified container types (culture and grow)
-- Replaces former 'vessels' and 'container_types' tables
-- is_sterilizable: true = can withstand autoclave/pressure cooker (glass, metal)
--                  false = plastic/disposable or outdoor environment
-- ----------------------------------------------------------------------------
INSERT INTO containers (id, name, category, volume_ml, is_reusable, is_sterilizable, usage_context, notes, user_id)
VALUES
  -- Culture Containers (formerly vessels)
  -- Jars (glass - sterilizable)
  ('00000000-0000-0000-0002-000000000001', 'Half Pint Mason Jar (8 oz)', 'jar', 237, true, true, ARRAY['culture'], 'Small jar for BRF cakes or small LC batches', NULL),
  ('00000000-0000-0000-0002-000000000002', 'Pint Mason Jar (16 oz)', 'jar', 473, true, true, ARRAY['culture'], 'Standard grain spawn jar, good for smaller batches', NULL),
  ('00000000-0000-0000-0002-000000000003', 'Quart Mason Jar (32 oz)', 'jar', 946, true, true, ARRAY['culture', 'grow'], 'Most common grain spawn jar size', NULL),
  ('00000000-0000-0000-0002-000000000004', 'Half Gallon Mason Jar (64 oz)', 'jar', 1893, true, true, ARRAY['culture'], 'Large LC or grain jar, reduces number of containers', NULL),
  ('00000000-0000-0000-0002-000000000005', '500ml Media Bottle', 'bottle', 500, true, true, ARRAY['culture'], 'Lab media bottle for LC or agar, autoclavable', NULL),
  ('00000000-0000-0000-0002-000000000006', '1000ml Media Bottle', 'bottle', 1000, true, true, ARRAY['culture'], 'Large lab media bottle for bulk LC', NULL),

  -- Petri Dishes (plastic - not sterilizable, disposable)
  ('00000000-0000-0000-0002-000000000010', '60mm Petri Dish', 'plate', 10, false, false, ARRAY['culture'], 'Small agar plate, good for slants or samples', NULL),
  ('00000000-0000-0000-0002-000000000011', '90mm Petri Dish', 'plate', 20, false, false, ARRAY['culture'], 'Standard agar plate size (European)', NULL),
  ('00000000-0000-0000-0002-000000000012', '100mm Petri Dish', 'plate', 25, false, false, ARRAY['culture'], 'Standard agar plate size (American)', NULL),
  ('00000000-0000-0000-0002-000000000013', '150mm Petri Dish', 'plate', 60, false, false, ARRAY['culture'], 'Large agar plate for sectoring or multiple transfers', NULL),

  -- Tubes (glass - sterilizable)
  ('00000000-0000-0000-0002-000000000020', 'Test Tube Slant (16x150mm)', 'tube', 15, true, true, ARRAY['culture'], 'Standard slant tube for long-term storage', NULL),
  ('00000000-0000-0000-0002-000000000021', 'Screw Cap Culture Tube', 'tube', 20, true, true, ARRAY['culture'], 'Reusable culture tube with screw cap', NULL),
  ('00000000-0000-0000-0002-000000000022', 'Cryo Vial (2ml)', 'tube', 2, false, false, ARRAY['culture'], 'For cryogenic storage with glycerol', NULL),

  -- Syringes (plastic - not sterilizable)
  ('00000000-0000-0000-0002-000000000030', '10cc Syringe', 'syringe', 10, false, false, ARRAY['culture'], 'Standard spore or LC syringe', NULL),
  ('00000000-0000-0000-0002-000000000031', '20cc Syringe', 'syringe', 20, false, false, ARRAY['culture'], 'Larger syringe for LC distribution', NULL),
  ('00000000-0000-0000-0002-000000000032', '60cc Syringe', 'syringe', 60, false, false, ARRAY['culture'], 'Large syringe for bulk LC inoculation', NULL),

  -- Bags (plastic - not sterilizable, disposable)
  ('00000000-0000-0000-0002-000000000040', '3lb Spawn Bag (0.2 micron)', 'bag', 2000, false, false, ARRAY['culture'], 'Small unicorn bag with filter patch', NULL),
  ('00000000-0000-0000-0002-000000000041', '5lb Spawn Bag (0.2 micron)', 'bag', 3500, false, false, ARRAY['culture', 'grow'], 'Standard unicorn bag with filter patch', NULL),
  ('00000000-0000-0000-0002-000000000042', '10lb Spawn Bag (0.5 micron)', 'bag', 7000, false, false, ARRAY['culture', 'grow'], 'Large spawn bag, 0.5 micron filter', NULL),
  ('00000000-0000-0000-0002-000000000043', 'All-in-One Grow Bag', 'bag', 4000, false, false, ARRAY['grow'], 'Pre-made grain + substrate bag, inject and grow', NULL),

  -- Grow Containers (formerly container_types)
  -- Tubs (plastic - sanitizable but not autoclavable)
  ('00000000-0000-0000-0003-000000000001', '6qt Shoebox', 'tub', 5700, true, false, ARRAY['grow'], 'Small personal grow, great for testing genetics', NULL),
  ('00000000-0000-0000-0003-000000000002', '15qt Tub', 'tub', 14200, true, false, ARRAY['grow'], 'Medium grow container, good yield per footprint', NULL),
  ('00000000-0000-0000-0003-000000000003', '32qt Tub', 'tub', 30300, true, false, ARRAY['grow'], 'Large tub, requires more spawn', NULL),
  ('00000000-0000-0000-0003-000000000004', '56qt Tub', 'tub', 53000, true, false, ARRAY['grow'], 'Standard monotub size, popular choice', NULL),
  ('00000000-0000-0000-0003-000000000005', '66qt Monotub', 'tub', 62500, true, false, ARRAY['grow'], 'Large monotub for bulk grows', NULL),
  ('00000000-0000-0000-0003-000000000006', '105qt Tub', 'tub', 99400, true, false, ARRAY['grow'], 'Extra large monotub for maximum yield', NULL),
  ('00000000-0000-0000-0003-000000000007', 'Dub Tub (2x 6qt)', 'tub', 11400, true, false, ARRAY['grow'], 'Two shoeboxes stacked for extra height', NULL),

  -- Bags (grow context - fruiting bags, plastic - not sterilizable)
  ('00000000-0000-0000-0003-000000000010', '5lb Grow Bag', 'bag', 4000, false, false, ARRAY['grow'], 'All-in-one style grow bag', NULL),
  ('00000000-0000-0000-0003-000000000011', '10lb Grow Bag', 'bag', 8000, false, false, ARRAY['grow'], 'Large grow bag for sawdust fruiting blocks', NULL),
  ('00000000-0000-0000-0003-000000000012', 'Fruiting Block Bag (2.5kg)', 'bag', 5000, false, false, ARRAY['grow'], 'Commercial style fruiting block', NULL),

  -- Buckets (plastic - sanitizable but not autoclavable)
  ('00000000-0000-0000-0003-000000000020', '5 Gallon Bucket', 'bucket', 19000, true, false, ARRAY['grow'], 'Bucket tek for oysters, low-tech method', NULL),
  ('00000000-0000-0000-0003-000000000021', '3 Gallon Bucket', 'bucket', 11400, true, false, ARRAY['grow'], 'Smaller bucket for limited space', NULL),

  -- Jars (grow context - PF tek, glass - sterilizable)
  ('00000000-0000-0000-0003-000000000030', 'Half Pint PF Tek Jar', 'jar', 240, true, true, ARRAY['grow'], 'Classic PF tek BRF cake container', NULL),
  ('00000000-0000-0000-0003-000000000031', 'Wide Mouth Pint Jar', 'jar', 470, true, true, ARRAY['grow'], 'Alternative BRF or mini-grain grow', NULL),

  -- Beds (outdoor - not applicable)
  ('00000000-0000-0000-0003-000000000040', 'Outdoor Garden Bed (4x8)', 'bed', 500000, false, false, ARRAY['grow'], 'Raised bed for wine caps, king stropharia', NULL),
  ('00000000-0000-0000-0003-000000000041', 'Small Outdoor Patch (2x4)', 'bed', 125000, false, false, ARRAY['grow'], 'Smaller outdoor cultivation area', NULL),

  -- Other (plastic/fabric - sanitizable but not autoclavable)
  ('00000000-0000-0000-0003-000000000050', 'Martha Tent', 'other', 500000, true, false, ARRAY['grow'], 'Greenhouse-style fruiting chamber', NULL),
  ('00000000-0000-0000-0003-000000000051', 'Shotgun Fruiting Chamber', 'other', 50000, true, false, ARRAY['grow'], 'Simple SGFC for PF tek cakes', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  volume_ml = EXCLUDED.volume_ml,
  is_reusable = EXCLUDED.is_reusable,
  is_sterilizable = EXCLUDED.is_sterilizable,
  usage_context = EXCLUDED.usage_context,
  notes = EXCLUDED.notes;

-- ----------------------------------------------------------------------------
-- SUBSTRATE TYPES - Growing media
-- ----------------------------------------------------------------------------
INSERT INTO substrate_types (id, name, code, category, spawn_rate_min, spawn_rate_optimal, spawn_rate_max, field_capacity, notes, user_id)
VALUES
  -- Bulk Substrates
  ('00000000-0000-0000-0004-000000000001', 'CVG (Coco Coir/Vermiculite/Gypsum)', 'cvg', 'bulk', 10, 20, 30, 75, 'Standard bulk substrate for most species. Pasteurize only.', NULL),
  ('00000000-0000-0000-0004-000000000002', 'Coco Coir (Plain)', 'coir', 'bulk', 10, 20, 30, 70, 'Simple and effective. Just coir and water.', NULL),
  ('00000000-0000-0000-0004-000000000003', 'Manure-Based', 'manure', 'bulk', 15, 25, 35, 70, 'Horse or cow manure based. Higher nutrition, higher contam risk.', NULL),
  ('00000000-0000-0000-0004-000000000004', 'Pasteurized Straw', 'straw', 'bulk', 10, 15, 25, 65, 'Great for oysters and bucket tek. Chop or shred before use.', NULL),
  ('00000000-0000-0000-0004-000000000005', 'Hardwood Sawdust', 'hwsd', 'bulk', 15, 20, 30, 65, 'Oak, maple, beech. Needs supplementation for most species.', NULL),
  ('00000000-0000-0000-0004-000000000006', 'Masters Mix (50/50)', 'masters', 'bulk', 10, 15, 25, 60, '50% hardwood sawdust, 50% soy hulls. Great for gourmet species.', NULL),
  ('00000000-0000-0000-0004-000000000007', 'Hardwood Fuel Pellets (HWFP)', 'hwfp', 'bulk', 10, 20, 30, 65, 'Hydrated wood pellets. Easy to prepare, consistent results.', NULL),
  ('00000000-0000-0000-0004-000000000008', 'Supplemented Sawdust', 'supp_sd', 'bulk', 10, 15, 25, 60, 'Sawdust + wheat bran or soy hulls. Sterilize required.', NULL),
  ('00000000-0000-0000-0004-000000000009', 'Straw + Coffee Grounds', 'straw_coffee', 'bulk', 10, 20, 30, 65, 'Budget option using waste coffee. Good for oysters.', NULL),
  ('00000000-0000-0000-0004-000000000010', 'Wood Chips', 'chips', 'bulk', 5, 10, 20, 55, 'For outdoor beds. Wine caps, garden giants.', NULL),

  -- Grain Types
  ('00000000-0000-0000-0004-000000000020', 'Oat Groats (Whole)', 'oat', 'grain', 5, 10, 15, NULL, 'Budget-friendly grain. Easy to prepare, some burst.', NULL),
  ('00000000-0000-0000-0004-000000000021', 'Rye Berries', 'rye', 'grain', 5, 10, 15, NULL, 'Premium grain spawn. Excellent water retention.', NULL),
  ('00000000-0000-0000-0004-000000000022', 'Wheat Berries', 'wheat', 'grain', 5, 10, 15, NULL, 'Good all-around grain. Similar to rye.', NULL),
  ('00000000-0000-0000-0004-000000000023', 'Millet', 'millet', 'grain', 5, 10, 15, NULL, 'Small grains = more inoculation points. Fast colonization.', NULL),
  ('00000000-0000-0000-0004-000000000024', 'Popcorn Kernels', 'popcorn', 'grain', 5, 10, 15, NULL, 'Easy to find, large kernels. Can be dry.', NULL),
  ('00000000-0000-0000-0004-000000000025', 'Wild Bird Seed', 'wbs', 'grain', 5, 10, 15, NULL, 'Mixed seeds (millet heavy). Budget option.', NULL),
  ('00000000-0000-0000-0004-000000000026', 'Sorghum', 'sorghum', 'grain', 5, 10, 15, NULL, 'Milo. Good water retention, less common.', NULL),
  ('00000000-0000-0000-0004-000000000027', 'Brown Rice', 'br', 'grain', 5, 10, 15, NULL, 'Easy prep, common in Uncle Ben tek.', NULL),

  -- Agar Media
  ('00000000-0000-0000-0004-000000000030', 'Malt Extract Agar (MEA)', 'mea', 'agar', 0, 0, 0, NULL, 'Standard agar recipe. 10g malt + 10g agar per 500ml.', NULL),
  ('00000000-0000-0000-0004-000000000031', 'Potato Dextrose Agar (PDA)', 'pda', 'agar', 0, 0, 0, NULL, 'Alternative agar. Good for isolation work.', NULL),
  ('00000000-0000-0000-0004-000000000032', 'Light Malt Extract Agar (LMEA)', 'lmea', 'agar', 0, 0, 0, NULL, 'Lower nutrition, helps isolate strong genetics.', NULL),
  ('00000000-0000-0000-0004-000000000033', 'Dog Food Agar (DFA)', 'dfa', 'agar', 0, 0, 0, NULL, 'Cheap alternative using grain-free dog food.', NULL),
  ('00000000-0000-0000-0004-000000000034', 'No-Pour Agar (Ketchup Cups)', 'nopour', 'agar', 0, 0, 0, NULL, 'Pre-made agar in small containers. Beginner friendly.', NULL),

  -- Liquid Culture Media
  ('00000000-0000-0000-0004-000000000040', 'Honey LC (4%)', 'honey_lc', 'liquid', 0, 0, 0, NULL, '40g honey per 1L water. Simple and effective.', NULL),
  ('00000000-0000-0000-0004-000000000041', 'Light Malt Extract LC', 'lme_lc', 'liquid', 0, 0, 0, NULL, '20g LME per 1L water. Standard LC recipe.', NULL),
  ('00000000-0000-0000-0004-000000000042', 'Karo/Corn Syrup LC', 'karo_lc', 'liquid', 0, 0, 0, NULL, '4% corn syrup solution. Budget LC option.', NULL),
  ('00000000-0000-0000-0004-000000000043', 'Dextrose LC', 'dex_lc', 'liquid', 0, 0, 0, NULL, '4% dextrose solution. Clean fermentation.', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  spawn_rate_min = EXCLUDED.spawn_rate_min,
  spawn_rate_optimal = EXCLUDED.spawn_rate_optimal,
  spawn_rate_max = EXCLUDED.spawn_rate_max,
  field_capacity = EXCLUDED.field_capacity,
  notes = EXCLUDED.notes;

-- ----------------------------------------------------------------------------
-- INVENTORY CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO inventory_categories (id, name, color, icon, user_id)
VALUES
  ('00000000-0000-0000-0005-000000000001', 'Grains', '#f59e0b', '🌾', NULL),
  ('00000000-0000-0000-0005-000000000002', 'Substrates', '#84cc16', '🪵', NULL),
  ('00000000-0000-0000-0005-000000000003', 'Lab Supplies', '#06b6d4', '🧪', NULL),
  ('00000000-0000-0000-0005-000000000004', 'Containers', '#8b5cf6', '📦', NULL),
  ('00000000-0000-0000-0005-000000000005', 'Chemicals', '#ef4444', '⚗️', NULL),
  ('00000000-0000-0000-0005-000000000006', 'Equipment', '#6366f1', '🔧', NULL),
  ('00000000-0000-0000-0005-000000000007', 'Media', '#ec4899', '🧫', NULL),
  ('00000000-0000-0000-0005-000000000008', 'Cultures', '#10b981', '🍄', NULL),
  ('00000000-0000-0000-0005-000000000009', 'Packaging', '#78716c', '🏷️', NULL),
  ('00000000-0000-0000-0005-000000000010', 'Safety', '#dc2626', '🦺', NULL),
  ('00000000-0000-0000-0005-000000000011', 'Cleaning Supplies', '#14b8a6', '🧴', NULL),
  ('00000000-0000-0000-0005-000000000012', 'Surfaces & Work Areas', '#a855f7', '🪑', NULL),
  ('00000000-0000-0000-0005-000000000013', 'Tools', '#f97316', '🔨', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon;

-- ----------------------------------------------------------------------------
-- RECIPE CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO recipe_categories (id, name, code, icon, color, user_id)
VALUES
  ('00000000-0000-0000-0006-000000000001', 'Agar Media', 'agar', '🧫', 'text-purple-400 bg-purple-950/50', NULL),
  ('00000000-0000-0000-0006-000000000002', 'Liquid Culture', 'liquid_culture', '💧', 'text-blue-400 bg-blue-950/50', NULL),
  ('00000000-0000-0000-0006-000000000003', 'Grain Spawn', 'grain_spawn', '🌾', 'text-amber-400 bg-amber-950/50', NULL),
  ('00000000-0000-0000-0006-000000000004', 'Bulk Substrate', 'bulk_substrate', '🪵', 'text-emerald-400 bg-emerald-950/50', NULL),
  ('00000000-0000-0000-0006-000000000005', 'Casing Layer', 'casing', '🧱', 'text-orange-400 bg-orange-950/50', NULL),
  ('00000000-0000-0000-0006-000000000006', 'Supplement', 'supplement', '💊', 'text-pink-400 bg-pink-950/50', NULL),
  ('00000000-0000-0000-0006-000000000007', 'Other', 'other', '📦', 'text-zinc-400 bg-zinc-800', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- ----------------------------------------------------------------------------
-- GRAIN TYPES
-- ----------------------------------------------------------------------------
INSERT INTO grain_types (id, name, code, notes, user_id)
VALUES
  ('00000000-0000-0000-0007-000000000001', 'Oat Groats', 'oat_groats', 'Budget-friendly, widely available. Some burst during prep.', NULL),
  ('00000000-0000-0000-0007-000000000002', 'Rye Berries', 'rye_berries', 'Premium grain, excellent water retention and colonization.', NULL),
  ('00000000-0000-0000-0007-000000000003', 'Wheat Berries', 'wheat', 'Good all-around grain, similar to rye.', NULL),
  ('00000000-0000-0000-0007-000000000004', 'Millet', 'millet', 'Small grains = more inoculation points, fast colonization.', NULL),
  ('00000000-0000-0000-0007-000000000005', 'Popcorn', 'popcorn', 'Large kernels, easy to find at grocery stores.', NULL),
  ('00000000-0000-0000-0007-000000000006', 'Brown Rice Flour (BRF)', 'brf', 'For PF tek cakes, mixed with vermiculite.', NULL),
  ('00000000-0000-0000-0007-000000000007', 'Wild Bird Seed (WBS)', 'wbs', 'Mixed seeds, budget option. Mostly millet.', NULL),
  ('00000000-0000-0000-0007-000000000008', 'Sorghum (Milo)', 'sorghum', 'Good water retention, less common.', NULL),
  ('00000000-0000-0000-0007-000000000009', 'Brown Rice (Whole)', 'brown_rice', 'Uncle Ben tek ready rice or whole grain.', NULL),
  ('00000000-0000-0000-0007-000000000010', 'Corn (Cracked)', 'cracked_corn', 'Larger surface area than popcorn.', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  notes = EXCLUDED.notes;

-- ----------------------------------------------------------------------------
-- LOCATION TYPES (for custom location categorization)
-- ----------------------------------------------------------------------------
INSERT INTO location_types (id, name, code, description, user_id)
VALUES
  ('00000000-0000-0000-0008-000000000001', 'Incubation', 'incubation', 'Warm area for colonization phase', NULL),
  ('00000000-0000-0000-0008-000000000002', 'Fruiting', 'fruiting', 'High humidity area for fruiting phase', NULL),
  ('00000000-0000-0000-0008-000000000003', 'Lab/Clean Room', 'lab', 'Sterile work area for inoculation', NULL),
  ('00000000-0000-0000-0008-000000000004', 'Cold Storage', 'cold_storage', 'Refrigerated storage for cultures', NULL),
  ('00000000-0000-0000-0008-000000000005', 'Dry Storage', 'dry_storage', 'Room temperature storage for supplies', NULL),
  ('00000000-0000-0000-0008-000000000006', 'Outdoor', 'outdoor', 'Garden beds, outdoor cultivation', NULL),
  ('00000000-0000-0000-0008-000000000007', 'Prep Area', 'prep', 'Substrate preparation, pasteurization', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- LOCATION CLASSIFICATIONS (for environment ratings)
-- ----------------------------------------------------------------------------
INSERT INTO location_classifications (id, name, code, description, user_id)
VALUES
  ('00000000-0000-0000-0009-000000000001', 'Sterile', 'sterile', 'Flow hood, SAB, cleanroom environment', NULL),
  ('00000000-0000-0000-0009-000000000002', 'Clean', 'clean', 'Low traffic, regularly cleaned', NULL),
  ('00000000-0000-0000-0009-000000000003', 'Semi-Clean', 'semi_clean', 'General indoor space', NULL),
  ('00000000-0000-0000-0009-000000000004', 'Uncontrolled', 'uncontrolled', 'Outdoor or high-traffic area', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description;


-- ============================================================================
-- SECTION 2: DEFAULT USER DATA FUNCTION
-- Creates starter data when a new user signs up
-- ============================================================================

-- Function to populate default data for new users
CREATE OR REPLACE FUNCTION populate_default_user_data()
RETURNS TRIGGER AS $$
DECLARE
  facility_id UUID;
  lab_id UUID;
  grow_room_id UUID;
  storage_id UUID;
BEGIN
  -- Create default hierarchical locations for the new user

  -- Level 1: Facility (top level)
  INSERT INTO locations (name, type, level, room_purpose, room_purposes, notes, user_id, sort_order)
  VALUES ('My Lab', 'lab', 'facility', 'general', ARRAY['general']::TEXT[], 'Main facility - customize this to match your setup', NEW.id, 1)
  RETURNING id INTO facility_id;

  -- Level 2: Rooms (with multi-purpose support via room_purposes array)
  INSERT INTO locations (name, type, type_id, level, room_purpose, room_purposes, parent_id, temp_min, temp_max, humidity_min, humidity_max, notes, user_id, sort_order, code, path)
  VALUES
    ('Lab/Clean Room', 'lab', '00000000-0000-0000-0008-000000000003', 'room', 'inoculation', ARRAY['inoculation']::TEXT[], facility_id, 20, 25, NULL, NULL, 'Clean work area for inoculation and agar work', NEW.id, 1, 'LAB', 'My Lab / Lab/Clean Room'),
    ('Incubation Room', 'incubation', '00000000-0000-0000-0008-000000000001', 'room', 'colonization', ARRAY['colonization']::TEXT[], facility_id, 24, 28, 70, 80, 'Temperature controlled space for colonization', NEW.id, 2, 'INC', 'My Lab / Incubation Room'),
    ('Grow Room', 'fruiting', '00000000-0000-0000-0008-000000000002', 'room', 'fruiting', ARRAY['fruiting', 'colonization']::TEXT[], facility_id, 18, 24, 85, 95, 'Multi-purpose room for fruiting and colonization', NEW.id, 3, 'GRW', 'My Lab / Grow Room'),
    ('Storage Area', 'storage', '00000000-0000-0000-0008-000000000005', 'room', 'storage', ARRAY['storage']::TEXT[], facility_id, NULL, NULL, NULL, NULL, 'Supplies and equipment storage', NEW.id, 4, 'STR', 'My Lab / Storage Area');

  -- Get the room IDs we just created
  SELECT id INTO lab_id FROM locations WHERE user_id = NEW.id AND code = 'LAB';
  SELECT id INTO grow_room_id FROM locations WHERE user_id = NEW.id AND code = 'GRW';
  SELECT id INTO storage_id FROM locations WHERE user_id = NEW.id AND code = 'STR';

  -- Level 3: Equipment/Zones within rooms
  INSERT INTO locations (name, type, type_id, level, parent_id, temp_min, temp_max, notes, user_id, sort_order, code, path, capacity)
  VALUES
    ('Lab Fridge', 'storage', '00000000-0000-0000-0008-000000000004', 'zone', lab_id, 2, 6, 'Refrigerated culture storage (slants, LC, spore syringes)', NEW.id, 1, 'LAB-FR', 'My Lab / Lab/Clean Room / Lab Fridge', 50),
    ('Flow Hood', 'lab', '00000000-0000-0000-0008-000000000003', 'zone', lab_id, NULL, NULL, 'Laminar flow hood for sterile work', NEW.id, 2, 'LAB-FH', 'My Lab / Lab/Clean Room / Flow Hood', NULL),
    ('Incubation Rack 1', 'incubation', '00000000-0000-0000-0008-000000000001', 'rack', grow_room_id, NULL, NULL, 'Wire shelving for colonizing jars/bags', NEW.id, 1, 'GRW-R1', 'My Lab / Grow Room / Incubation Rack 1', 24),
    ('Martha Tent', 'fruiting', '00000000-0000-0000-0008-000000000002', 'zone', grow_room_id, 18, 22, 'Humidity-controlled fruiting tent', NEW.id, 2, 'GRW-MT', 'My Lab / Grow Room / Martha Tent', 12),
    ('Supply Shelf', 'storage', '00000000-0000-0000-0008-000000000005', 'rack', storage_id, NULL, NULL, 'Dry goods and supplies', NEW.id, 1, 'STR-SH', 'My Lab / Storage Area / Supply Shelf', 100);

  -- Create default recipes for the new user
  -- Standard MEA Recipe
  INSERT INTO recipes (name, category, description, yield_amount, yield_unit, prep_time_minutes, instructions, notes, user_id)
  VALUES
    ('Standard MEA (Malt Extract Agar)', 'agar', 'Basic malt extract agar for culture work. Makes approximately 20 plates.',
     500, 'ml', 15,
     '1. Add 10g agar powder and 10g light malt extract to 500ml distilled water
2. Stir until dissolved (heating helps)
3. Pour into media bottle, cover with foil
4. Pressure cook at 15 PSI for 45 minutes
5. Let cool to ~50°C, then pour plates in front of flow hood
6. Let plates solidify, store upside down',
     'Pour plates while agar is still liquid but not too hot. Store upside down to prevent condensation.', NEW.id),

    ('4% Honey Liquid Culture', 'liquid_culture', 'Simple honey-based liquid culture medium.',
     1000, 'ml', 10,
     '1. Mix 40g raw honey with 1000ml distilled water
2. Stir until fully dissolved
3. Pour into jars with modified lids (filter + injection port)
4. Pressure cook at 15 PSI for 30 minutes
5. Let cool completely before inoculating
6. Shake or stir daily to encourage growth',
     'Use raw honey for best results. LC is ready when you see fluffy mycelium clouds.', NEW.id),

    ('Standard CVG Substrate', 'substrate', 'Classic coco coir, vermiculite, and gypsum bulk substrate.',
     10, 'quarts', 30,
     '1. Break up coco coir brick into a 5-gallon bucket
2. Add 2 quarts vermiculite and 1 cup gypsum
3. Mix dry ingredients thoroughly
4. Pour 4 quarts boiling water over mixture
5. Cover and let sit 2-4 hours
6. Mix thoroughly, check field capacity (squeeze test)
7. Let cool to room temperature before use',
     'Field capacity is key - should release only a few drops when squeezed. Too wet promotes contamination.', NEW.id),

    ('Oat Grain Spawn', 'grain_spawn', 'Whole oat groats for grain spawn production.',
     946, 'ml', 60,
     '1. Rinse oats thoroughly to remove dust
2. Soak in water for 12-24 hours
3. Drain and rinse again
4. Simmer 15-20 minutes until slightly soft (not mushy)
5. Drain and spread on towels to dry surface moisture
6. Load into jars with modified lids
7. Pressure cook at 15 PSI for 90 minutes
8. Let cool in PC, shake to break up clumps',
     'Oats should crack when bitten but not be mushy. Too wet = bacterial contamination.', NEW.id);

  -- Create default user settings
  INSERT INTO user_settings (user_id, default_units, default_currency, altitude, timezone)
  VALUES (NEW.id, 'metric', 'USD', 0, 'America/Chicago')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_created_populate_data ON auth.users;

-- Create trigger to run after user profile is created
-- This runs after handle_new_user() which creates the user_profiles entry
CREATE TRIGGER on_user_created_populate_data
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION populate_default_user_data();


-- ============================================================================
-- SECTION 3: REDACTION PRESETS FOR PUBLIC SHARING
-- System presets available to all users (user_id = NULL, is_system = true)
-- ============================================================================

-- Default redaction presets for field visibility in public passports
INSERT INTO redaction_presets (id, name, description, field_visibility, applies_to, is_system, user_id)
VALUES
  (
    '00000000-0000-0000-0100-000000000001',
    'Customer View (Default)',
    'Standard view for customers - shows product quality, hides business details. Ideal for Etsy, farmers markets, and retail sales.',
    '{
      "strain": true,
      "species": true,
      "substrate_type": true,
      "spawn_weight": false,
      "substrate_weight": false,
      "container": true,
      "location": true,
      "location_address": false,
      "inoculation_date": true,
      "colonization_date": true,
      "fruiting_date": true,
      "harvest_dates": true,
      "total_yield": true,
      "flush_weights": true,
      "biological_efficiency": true,
      "observations": true,
      "photos": true,
      "cost": false,
      "failures": false,
      "contamination_history": false,
      "supplier_info": false,
      "recipe_details": false,
      "notes": false,
      "lot_number": false
    }'::JSONB,
    ARRAY['grow', 'culture', 'batch'],
    true,
    NULL
  ),
  (
    '00000000-0000-0000-0100-000000000002',
    'Auditor View',
    'Full transparency for auditors/inspectors - shows everything except personal addresses. Use for compliance reviews and lab audits.',
    '{
      "strain": true,
      "species": true,
      "substrate_type": true,
      "spawn_weight": true,
      "substrate_weight": true,
      "container": true,
      "location": true,
      "location_address": false,
      "inoculation_date": true,
      "colonization_date": true,
      "fruiting_date": true,
      "harvest_dates": true,
      "total_yield": true,
      "flush_weights": true,
      "biological_efficiency": true,
      "observations": true,
      "photos": true,
      "cost": true,
      "failures": true,
      "contamination_history": true,
      "supplier_info": true,
      "recipe_details": true,
      "notes": true,
      "lot_number": true
    }'::JSONB,
    ARRAY['grow', 'culture', 'batch'],
    true,
    NULL
  ),
  (
    '00000000-0000-0000-0100-000000000003',
    'Minimal View',
    'Bare minimum for privacy-conscious sellers - shows only strain, harvest dates, yield, and photos. Maximum privacy.',
    '{
      "strain": true,
      "species": true,
      "substrate_type": false,
      "spawn_weight": false,
      "substrate_weight": false,
      "container": false,
      "location": false,
      "location_address": false,
      "inoculation_date": false,
      "colonization_date": false,
      "fruiting_date": false,
      "harvest_dates": true,
      "total_yield": true,
      "flush_weights": false,
      "biological_efficiency": true,
      "observations": false,
      "photos": true,
      "cost": false,
      "failures": false,
      "contamination_history": false,
      "supplier_info": false,
      "recipe_details": false,
      "notes": false,
      "lot_number": false
    }'::JSONB,
    ARRAY['grow', 'culture', 'batch'],
    true,
    NULL
  ),
  (
    '00000000-0000-0000-0100-000000000004',
    'Genetics Focus',
    'Emphasizes lineage and genetic information - ideal for culture sales, spore syringes, and LC. Shows full lineage tree.',
    '{
      "strain": true,
      "species": true,
      "substrate_type": false,
      "spawn_weight": false,
      "substrate_weight": false,
      "container": true,
      "location": false,
      "location_address": false,
      "inoculation_date": true,
      "colonization_date": true,
      "fruiting_date": false,
      "harvest_dates": false,
      "total_yield": false,
      "flush_weights": false,
      "biological_efficiency": false,
      "observations": true,
      "photos": true,
      "cost": false,
      "failures": false,
      "contamination_history": false,
      "supplier_info": false,
      "recipe_details": false,
      "notes": false,
      "lot_number": true,
      "lineage": true,
      "generation": true,
      "parent_culture": true
    }'::JSONB,
    ARRAY['culture'],
    true,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  field_visibility = EXCLUDED.field_visibility,
  applies_to = EXCLUDED.applies_to,
  is_system = EXCLUDED.is_system;


-- ============================================================================
-- SECTION 4: SCHEMA VERSION UPDATE
-- ============================================================================

UPDATE schema_version SET version = 5, updated_at = NOW() WHERE id = 1;


-- ============================================================================
-- SECTION 5: AI & IOT TABLES (No seed data required)
-- ============================================================================
-- The following tables are user-generated and don't need seed data:
--
-- AI Tables:
-- - ai_chat_sessions: User chat sessions (created when user starts chat)
-- - ai_chat_messages: Messages in chat sessions
-- - ai_usage: Token/cost tracking for billing
-- - ai_user_settings: User preferences (defaults in app code)
--
-- Knowledge Library:
-- - knowledge_documents: Admin-curated content (add via admin panel)
-- - knowledge_suggestions: User-submitted suggestions
--
-- IoT Tables:
-- - iot_devices: User-registered sensors
-- - iot_readings: Sensor data (auto-populated by devices)
-- - iot_alerts: Alert instances (auto-generated)
-- - iot_alert_thresholds: User-defined thresholds
--
-- NOTE: Knowledge documents should be added by admin through the app
-- or via a separate knowledge-seed.sql file when content is ready.
-- ============================================================================


-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see this, the seed data was applied successfully!
--
-- Summary of what was created:
-- - 40 Containers (unified: jars, plates, tubes, syringes, tubs, bags, buckets, beds)
-- NOTE: Species/Strains are now in supabase-species-data.sql
-- - 30+ Substrate Types (bulk, grain, agar, liquid)
-- - 10 Inventory Categories
-- - 7 Recipe Categories
-- - 10 Grain Types
-- - 7 Location Types
-- - 4 Location Classifications
-- - 4 Redaction Presets (Customer View, Auditor View, Minimal View, Genetics Focus)
--
-- New users will automatically receive:
-- - 10 hierarchical locations (facility > rooms > zones/racks)
--   - 1 Facility (My Lab)
--   - 4 Rooms (Lab, Incubation, Grow Room, Storage)
--   - 5 Zones/Racks (Fridge, Flow Hood, Rack, Martha Tent, Supply Shelf)
-- - 4 essential recipes (MEA, LC, CVG, Grain Spawn)
-- - Default settings
--
-- PUBLIC SHARING SYSTEM (v21):
-- - Redaction Presets: Templates for field visibility in public passports
--   - Customer View: Standard for retail sales (hides costs, supplier info)
--   - Auditor View: Full transparency for inspectors (shows all except addresses)
--   - Minimal View: Maximum privacy (only strain, yield, photos)
--   - Genetics Focus: For culture sales (emphasizes lineage)
--
-- AI & IoT (v22):
-- - Tables created but no seed data needed
-- - Knowledge content should be added by admin
-- - IoT thresholds are user-specific
-- ============================================================================
