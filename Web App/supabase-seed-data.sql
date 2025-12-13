-- ============================================================================
-- MYCOLAB SEED DATA (Idempotent - Safe to run multiple times)
-- Run this AFTER supabase-schema.sql to populate default data
-- ============================================================================
--
-- DATA TIERS:
-- 1. SYSTEM DATA (user_id = NULL): Read-only reference data all users can see
--    - Species, Strains, Vessels, Container Types, Substrate Types
--    - Inventory Categories, Recipe Categories, Grain Types
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

-- ----------------------------------------------------------------------------
-- SPECIES - Common cultivated mushroom species
-- ----------------------------------------------------------------------------
INSERT INTO species (id, name, scientific_name, common_names, category, notes, user_id)
VALUES
  -- Gourmet Species
  ('00000000-0000-0000-0000-000000000001', 'Oyster', 'Pleurotus ostreatus', ARRAY['Pearl Oyster', 'Tree Oyster'], 'gourmet', 'Fast-growing, beginner-friendly. Many color varieties available.', NULL),
  ('00000000-0000-0000-0000-000000000002', 'King Oyster', 'Pleurotus eryngii', ARRAY['King Trumpet', 'French Horn'], 'gourmet', 'Meaty texture, excellent culinary mushroom. Slower than regular oyster.', NULL),
  ('00000000-0000-0000-0000-000000000003', 'Pink Oyster', 'Pleurotus djamor', ARRAY['Flamingo Oyster'], 'gourmet', 'Tropical species, needs warmth. Vibrant pink color, delicate flavor.', NULL),
  ('00000000-0000-0000-0000-000000000004', 'Blue Oyster', 'Pleurotus columbinus', ARRAY['Blue Pearl'], 'gourmet', 'Cold-tolerant variety. Deep blue caps when young, fading to gray.', NULL),
  ('00000000-0000-0000-0000-000000000005', 'Shiitake', 'Lentinula edodes', ARRAY['Oak Mushroom', 'Black Forest'], 'gourmet', 'Traditional Asian mushroom. Longer colonization but excellent flavor and shelf life.', NULL),
  ('00000000-0000-0000-0000-000000000006', 'Maitake', 'Grifola frondosa', ARRAY['Hen of the Woods', 'Dancing Mushroom'], 'gourmet', 'Prized gourmet with medicinal properties. Challenging to cultivate.', NULL),
  ('00000000-0000-0000-0000-000000000007', 'Chestnut', 'Pholiota adiposa', ARRAY['Cinnamon Cap'], 'gourmet', 'Nutty flavor, crunchy texture. Good for supplemented substrates.', NULL),
  ('00000000-0000-0000-0000-000000000008', 'Pioppino', 'Cyclocybe aegerita', ARRAY['Black Poplar', 'Velvet Pioppini'], 'gourmet', 'Italian delicacy with firm texture. Grows in clusters.', NULL),
  ('00000000-0000-0000-0000-000000000009', 'Enoki', 'Flammulina velutipes', ARRAY['Winter Mushroom', 'Velvet Foot'], 'gourmet', 'Long thin stems, mild flavor. Needs cold fruiting temps.', NULL),
  ('00000000-0000-0000-0000-000000000010', 'Nameko', 'Pholiota nameko', ARRAY['Butterscotch Mushroom'], 'gourmet', 'Slimy cap, used in miso soup. Prefers cooler temperatures.', NULL),

  -- Medicinal Species
  ('00000000-0000-0000-0000-000000000011', 'Lions Mane', 'Hericium erinaceus', ARRAY['Bearded Tooth', 'Pom Pom'], 'medicinal', 'Brain-boosting medicinal. Needs high humidity, no caps - just teeth.', NULL),
  ('00000000-0000-0000-0000-000000000012', 'Reishi', 'Ganoderma lucidum', ARRAY['Lingzhi', 'Mushroom of Immortality'], 'medicinal', 'Woody polypore, primarily for tea/tinctures. Long grow cycle.', NULL),
  ('00000000-0000-0000-0000-000000000013', 'Turkey Tail', 'Trametes versicolor', ARRAY['Yun Zhi', 'Kawaratake'], 'medicinal', 'Thin shelf fungus, powerful immune support. Easy outdoor cultivation.', NULL),
  ('00000000-0000-0000-0000-000000000014', 'Cordyceps', 'Cordyceps militaris', ARRAY['Caterpillar Fungus'], 'medicinal', 'Orange club-shaped fruiting bodies. Requires specialized substrate and light.', NULL),
  ('00000000-0000-0000-0000-000000000015', 'Chaga', 'Inonotus obliquus', ARRAY['Clinker Polypore'], 'medicinal', 'Wild-harvested primarily. Sclerotia, not fruiting body.', NULL),

  -- Research/Other Species
  ('00000000-0000-0000-0000-000000000016', 'Wine Cap', 'Stropharia rugosoannulata', ARRAY['King Stropharia', 'Garden Giant'], 'other', 'Outdoor garden species. Great for wood chips and garden beds.', NULL),
  ('00000000-0000-0000-0000-000000000017', 'Chicken of the Woods', 'Laetiporus sulphureus', ARRAY['Sulphur Shelf'], 'gourmet', 'Bright orange shelf fungus. Challenging indoor cultivation.', NULL),
  ('00000000-0000-0000-0000-000000000018', 'Black Pearl', 'Pleurotus ostreatus var', ARRAY['Black King'], 'gourmet', 'Dark oyster variety with robust flavor. Similar care to standard oyster.', NULL),
  ('00000000-0000-0000-0000-000000000019', 'Golden Oyster', 'Pleurotus citrinopileatus', ARRAY['Yellow Oyster'], 'gourmet', 'Tropical species, bright yellow. Needs warmth, delicate texture.', NULL),
  ('00000000-0000-0000-0000-000000000020', 'Elm Oyster', 'Hypsizygus ulmarius', ARRAY['Elm Leech'], 'gourmet', 'Large white caps, mild flavor. Cold tolerant.', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  scientific_name = EXCLUDED.scientific_name,
  common_names = EXCLUDED.common_names,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes;

-- ----------------------------------------------------------------------------
-- STRAINS - Popular strains for each species
-- ----------------------------------------------------------------------------
INSERT INTO strains (id, name, species_id, species, difficulty, colonization_days_min, colonization_days_max, fruiting_days_min, fruiting_days_max, optimal_temp_colonization, optimal_temp_fruiting, notes, user_id)
VALUES
  -- Oyster Strains
  ('00000000-0000-0000-0001-000000000001', 'Blue Oyster', '00000000-0000-0000-0000-000000000004', 'Pleurotus columbinus', 'beginner', 7, 14, 5, 10, 22, 18, 'Cold-tolerant variety, fruits at lower temps. Aggressive colonizer.', NULL),
  ('00000000-0000-0000-0001-000000000002', 'Pink Oyster', '00000000-0000-0000-0000-000000000003', 'Pleurotus djamor', 'beginner', 5, 10, 4, 7, 28, 25, 'Tropical species, needs warmth (75-85°F). Fast grower, short shelf life.', NULL),
  ('00000000-0000-0000-0001-000000000003', 'Pearl Oyster', '00000000-0000-0000-0000-000000000001', 'Pleurotus ostreatus', 'beginner', 7, 14, 5, 10, 24, 20, 'Classic oyster mushroom. Very forgiving, great for beginners.', NULL),
  ('00000000-0000-0000-0001-000000000004', 'Golden Oyster', '00000000-0000-0000-0000-000000000019', 'Pleurotus citrinopileatus', 'beginner', 7, 12, 5, 8, 26, 24, 'Bright yellow clusters, tropical species. Delicate, use fresh.', NULL),
  ('00000000-0000-0000-0001-000000000005', 'Italian Oyster', '00000000-0000-0000-0000-000000000001', 'Pleurotus ostreatus', 'beginner', 10, 14, 5, 10, 24, 21, 'Brown caps, excellent flavor. Slightly longer colonization.', NULL),
  ('00000000-0000-0000-0001-000000000006', 'King Oyster', '00000000-0000-0000-0000-000000000002', 'Pleurotus eryngii', 'intermediate', 14, 21, 7, 14, 24, 18, 'Thick stems, meaty texture. Needs specific fruiting conditions.', NULL),

  -- Lions Mane Strains
  ('00000000-0000-0000-0001-000000000010', 'Lions Mane', '00000000-0000-0000-0000-000000000011', 'Hericium erinaceus', 'intermediate', 14, 21, 7, 14, 22, 18, 'Standard lions mane. High humidity crucial for tooth formation.', NULL),
  ('00000000-0000-0000-0001-000000000011', 'Bears Head', '00000000-0000-0000-0000-000000000011', 'Hericium americanum', 'intermediate', 14, 21, 7, 14, 22, 18, 'Branching variety with shorter teeth. Similar care to standard.', NULL),

  -- Shiitake Strains
  ('00000000-0000-0000-0001-000000000020', 'Shiitake (Cold Weather)', '00000000-0000-0000-0000-000000000005', 'Lentinula edodes', 'intermediate', 60, 90, 7, 14, 24, 16, 'Cold-shock variety for fruiting. Traditional log or sawdust cultivation.', NULL),
  ('00000000-0000-0000-0001-000000000021', 'Shiitake (Warm Weather)', '00000000-0000-0000-0000-000000000005', 'Lentinula edodes', 'intermediate', 45, 75, 7, 14, 24, 21, 'Faster colonization, fruits at warmer temps. Good for indoor cultivation.', NULL),
  ('00000000-0000-0000-0001-000000000022', 'Donko Shiitake', '00000000-0000-0000-0000-000000000005', 'Lentinula edodes', 'advanced', 60, 90, 10, 18, 24, 14, 'Thick, cracked caps. Slow fruiting produces premium quality.', NULL),

  -- Reishi Strains
  ('00000000-0000-0000-0001-000000000030', 'Red Reishi', '00000000-0000-0000-0000-000000000012', 'Ganoderma lucidum', 'intermediate', 30, 60, 30, 90, 26, 26, 'Classic medicinal reishi. Conk or antler forms depending on CO2.', NULL),

  -- Maitake
  ('00000000-0000-0000-0001-000000000040', 'Maitake', '00000000-0000-0000-0000-000000000006', 'Grifola frondosa', 'advanced', 45, 90, 14, 28, 22, 18, 'Challenging species. Needs specific conditions and patience.', NULL),

  -- Wine Cap
  ('00000000-0000-0000-0001-000000000050', 'Wine Cap (Garden Giant)', '00000000-0000-0000-0000-000000000016', 'Stropharia rugosoannulata', 'beginner', 30, 60, 14, 28, 20, 18, 'Best for outdoor beds. Wood chips + straw substrate.', NULL),

  -- Chestnut
  ('00000000-0000-0000-0001-000000000060', 'Chestnut', '00000000-0000-0000-0000-000000000007', 'Pholiota adiposa', 'intermediate', 14, 21, 10, 14, 24, 20, 'Nutty flavor, firm texture. Supplemented sawdust preferred.', NULL),

  -- Pioppino
  ('00000000-0000-0000-0001-000000000070', 'Pioppino', '00000000-0000-0000-0000-000000000008', 'Cyclocybe aegerita', 'intermediate', 21, 30, 10, 18, 24, 18, 'Italian gourmet. Long stems, clusters. Needs cold shock.', NULL),

  -- Cordyceps
  ('00000000-0000-0000-0001-000000000080', 'Cordyceps militaris', '00000000-0000-0000-0000-000000000014', 'Cordyceps militaris', 'advanced', 21, 35, 30, 60, 24, 20, 'Requires rice substrate and specific light cycle. Orange clubs.', NULL),

  -- Enoki
  ('00000000-0000-0000-0001-000000000090', 'Enoki', '00000000-0000-0000-0000-000000000009', 'Flammulina velutipes', 'intermediate', 14, 21, 14, 21, 22, 10, 'Cold fruiting (40-50°F). High CO2 elongates stems.', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  species_id = EXCLUDED.species_id,
  species = EXCLUDED.species,
  difficulty = EXCLUDED.difficulty,
  colonization_days_min = EXCLUDED.colonization_days_min,
  colonization_days_max = EXCLUDED.colonization_days_max,
  fruiting_days_min = EXCLUDED.fruiting_days_min,
  fruiting_days_max = EXCLUDED.fruiting_days_max,
  optimal_temp_colonization = EXCLUDED.optimal_temp_colonization,
  optimal_temp_fruiting = EXCLUDED.optimal_temp_fruiting,
  notes = EXCLUDED.notes;

-- ----------------------------------------------------------------------------
-- VESSELS - Culture container types
-- ----------------------------------------------------------------------------
INSERT INTO vessels (id, name, type, volume_ml, is_reusable, notes, user_id)
VALUES
  -- Jars
  ('00000000-0000-0000-0002-000000000001', 'Half Pint Mason Jar (8 oz)', 'jar', 237, true, 'Small jar for BRF cakes or small LC batches', NULL),
  ('00000000-0000-0000-0002-000000000002', 'Pint Mason Jar (16 oz)', 'jar', 473, true, 'Standard grain spawn jar, good for smaller batches', NULL),
  ('00000000-0000-0000-0002-000000000003', 'Quart Mason Jar (32 oz)', 'jar', 946, true, 'Most common grain spawn jar size', NULL),
  ('00000000-0000-0000-0002-000000000004', 'Half Gallon Mason Jar (64 oz)', 'jar', 1893, true, 'Large LC or grain jar, reduces number of vessels', NULL),
  ('00000000-0000-0000-0002-000000000005', '500ml Media Bottle', 'bottle', 500, true, 'Lab media bottle for LC or agar, autoclavable', NULL),
  ('00000000-0000-0000-0002-000000000006', '1000ml Media Bottle', 'bottle', 1000, true, 'Large lab media bottle for bulk LC', NULL),

  -- Petri Dishes
  ('00000000-0000-0000-0002-000000000010', '60mm Petri Dish', 'plate', 10, false, 'Small agar plate, good for slants or samples', NULL),
  ('00000000-0000-0000-0002-000000000011', '90mm Petri Dish', 'plate', 20, false, 'Standard agar plate size (European)', NULL),
  ('00000000-0000-0000-0002-000000000012', '100mm Petri Dish', 'plate', 25, false, 'Standard agar plate size (American)', NULL),
  ('00000000-0000-0000-0002-000000000013', '150mm Petri Dish', 'plate', 60, false, 'Large agar plate for sectoring or multiple transfers', NULL),

  -- Tubes
  ('00000000-0000-0000-0002-000000000020', 'Test Tube Slant (16x150mm)', 'tube', 15, true, 'Standard slant tube for long-term storage', NULL),
  ('00000000-0000-0000-0002-000000000021', 'Screw Cap Culture Tube', 'tube', 20, true, 'Reusable culture tube with screw cap', NULL),
  ('00000000-0000-0000-0002-000000000022', 'Cryo Vial (2ml)', 'tube', 2, false, 'For cryogenic storage with glycerol', NULL),

  -- Syringes
  ('00000000-0000-0000-0002-000000000030', '10cc Syringe', 'syringe', 10, false, 'Standard spore or LC syringe', NULL),
  ('00000000-0000-0000-0002-000000000031', '20cc Syringe', 'syringe', 20, false, 'Larger syringe for LC distribution', NULL),
  ('00000000-0000-0000-0002-000000000032', '60cc Syringe', 'syringe', 60, false, 'Large syringe for bulk LC inoculation', NULL),

  -- Bags
  ('00000000-0000-0000-0002-000000000040', '3lb Spawn Bag (0.2 micron)', 'bag', 2000, false, 'Small unicorn bag with filter patch', NULL),
  ('00000000-0000-0000-0002-000000000041', '5lb Spawn Bag (0.2 micron)', 'bag', 3500, false, 'Standard unicorn bag with filter patch', NULL),
  ('00000000-0000-0000-0002-000000000042', '10lb Spawn Bag (0.5 micron)', 'bag', 7000, false, 'Large spawn bag, 0.5 micron filter', NULL),
  ('00000000-0000-0000-0002-000000000043', 'All-in-One Grow Bag', 'bag', 4000, false, 'Pre-made grain + substrate bag, inject and grow', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  volume_ml = EXCLUDED.volume_ml,
  is_reusable = EXCLUDED.is_reusable,
  notes = EXCLUDED.notes;

-- ----------------------------------------------------------------------------
-- CONTAINER TYPES - Grow containers
-- ----------------------------------------------------------------------------
INSERT INTO container_types (id, name, category, volume_l, notes, user_id)
VALUES
  -- Tubs
  ('00000000-0000-0000-0003-000000000001', '6qt Shoebox', 'tub', 5.7, 'Small personal grow, great for testing genetics', NULL),
  ('00000000-0000-0000-0003-000000000002', '15qt Tub', 'tub', 14.2, 'Medium grow container, good yield per footprint', NULL),
  ('00000000-0000-0000-0003-000000000003', '32qt Tub', 'tub', 30.3, 'Large tub, requires more spawn', NULL),
  ('00000000-0000-0000-0003-000000000004', '56qt Tub', 'tub', 53, 'Standard monotub size, popular choice', NULL),
  ('00000000-0000-0000-0003-000000000005', '66qt Monotub', 'tub', 62.5, 'Large monotub for bulk grows', NULL),
  ('00000000-0000-0000-0003-000000000006', '105qt Tub', 'tub', 99.4, 'Extra large monotub for maximum yield', NULL),
  ('00000000-0000-0000-0003-000000000007', 'Dub Tub (2x 6qt)', 'tub', 11.4, 'Two shoeboxes stacked for extra height', NULL),

  -- Bags
  ('00000000-0000-0000-0003-000000000010', '5lb Grow Bag', 'bag', 4, 'All-in-one style grow bag', NULL),
  ('00000000-0000-0000-0003-000000000011', '10lb Grow Bag', 'bag', 8, 'Large grow bag for sawdust fruiting blocks', NULL),
  ('00000000-0000-0000-0003-000000000012', 'Fruiting Block Bag (2.5kg)', 'bag', 5, 'Commercial style fruiting block', NULL),

  -- Buckets
  ('00000000-0000-0000-0003-000000000020', '5 Gallon Bucket', 'bucket', 19, 'Bucket tek for oysters, low-tech method', NULL),
  ('00000000-0000-0000-0003-000000000021', '3 Gallon Bucket', 'bucket', 11.4, 'Smaller bucket for limited space', NULL),

  -- Jars
  ('00000000-0000-0000-0003-000000000030', 'Half Pint PF Tek Jar', 'jar', 0.24, 'Classic PF tek BRF cake container', NULL),
  ('00000000-0000-0000-0003-000000000031', 'Wide Mouth Pint Jar', 'jar', 0.47, 'Alternative BRF or mini-grain grow', NULL),

  -- Beds
  ('00000000-0000-0000-0003-000000000040', 'Outdoor Garden Bed (4x8)', 'bed', 500, 'Raised bed for wine caps, king stropharia', NULL),
  ('00000000-0000-0000-0003-000000000041', 'Small Outdoor Patch (2x4)', 'bed', 125, 'Smaller outdoor cultivation area', NULL),

  -- Other
  ('00000000-0000-0000-0003-000000000050', 'Martha Tent', 'other', 500, 'Greenhouse-style fruiting chamber', NULL),
  ('00000000-0000-0000-0003-000000000051', 'Shotgun Fruiting Chamber', 'other', 50, 'Simple SGFC for PF tek cakes', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  volume_l = EXCLUDED.volume_l,
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
  ('00000000-0000-0000-0005-000000000010', 'Safety', '#dc2626', '🦺', NULL)
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
BEGIN
  -- Create default locations for the new user
  INSERT INTO locations (name, type, type_id, temp_min, temp_max, humidity_min, humidity_max, notes, user_id)
  VALUES
    ('Incubation Chamber', 'incubation', '00000000-0000-0000-0008-000000000001', 24, 28, 70, 80, 'Main incubation space - adjust temps based on species', NEW.id),
    ('Fruiting Chamber', 'fruiting', '00000000-0000-0000-0008-000000000002', 18, 24, 85, 95, 'High humidity fruiting area - mist regularly', NEW.id),
    ('Main Lab', 'lab', '00000000-0000-0000-0008-000000000003', 20, 25, NULL, NULL, 'Clean work area for inoculation', NEW.id),
    ('Lab Fridge', 'storage', '00000000-0000-0000-0008-000000000004', 2, 6, NULL, NULL, 'Refrigerated culture storage (slants, LC, spore syringes)', NEW.id),
    ('Supply Closet', 'storage', '00000000-0000-0000-0008-000000000005', NULL, NULL, NULL, NULL, 'Dry goods and supplies storage', NEW.id);

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
-- SECTION 3: SCHEMA VERSION UPDATE
-- ============================================================================

UPDATE schema_version SET version = 4, updated_at = NOW() WHERE id = 1;


-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see this, the seed data was applied successfully!
--
-- Summary of what was created:
-- - 20 Species (gourmet, medicinal, research)
-- - 18 Strains (oyster, lions mane, shiitake, etc.)
-- - 20 Vessels (jars, plates, tubes, syringes, bags)
-- - 18 Container Types (tubs, bags, buckets, beds)
-- - 30+ Substrate Types (bulk, grain, agar, liquid)
-- - 10 Inventory Categories
-- - 7 Recipe Categories
-- - 10 Grain Types
-- - 7 Location Types
-- - 4 Location Classifications
--
-- New users will automatically receive:
-- - 5 starter locations
-- - 4 essential recipes (MEA, LC, CVG, Grain Spawn)
-- - Default settings
-- ============================================================================
