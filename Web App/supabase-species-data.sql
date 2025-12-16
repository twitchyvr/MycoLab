-- ============================================================================
-- MYCOLAB SPECIES & STRAINS DATA (Idempotent - Safe to run multiple times)
-- Run this AFTER supabase-schema.sql to populate species and strain data
-- ============================================================================
--
-- This file contains the reference data for mushroom species and strains.
-- It is separated from the main seed data for easier maintenance.
--
-- To run: Execute this in your Supabase SQL Editor after running schema.sql
-- ============================================================================

-- ============================================================================
-- SPECIES - Common cultivated mushroom species
-- ============================================================================
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

-- ============================================================================
-- STRAINS - Popular strains for each species
-- ============================================================================
INSERT INTO strains (id, name, species_id, species, difficulty, colonization_days_min, colonization_days_max, fruiting_days_min, fruiting_days_max, optimal_temp_colonization, optimal_temp_fruiting, notes, user_id)
VALUES
  -- Oyster Strains
  ('00000000-0000-0000-0001-000000000001', 'Blue Oyster', '00000000-0000-0000-0000-000000000004', 'Pleurotus columbinus', 'beginner', 7, 14, 5, 10, 22, 18, 'Cold-tolerant variety, fruits at lower temps. Aggressive colonizer.', NULL),
  ('00000000-0000-0000-0001-000000000002', 'Pink Oyster', '00000000-0000-0000-0000-000000000003', 'Pleurotus djamor', 'beginner', 5, 10, 4, 7, 28, 25, 'Tropical species, needs warmth (75-85F). Fast grower, short shelf life.', NULL),
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
  ('00000000-0000-0000-0001-000000000090', 'Enoki', '00000000-0000-0000-0000-000000000009', 'Flammulina velutipes', 'intermediate', 14, 21, 14, 21, 22, 10, 'Cold fruiting (40-50F). High CO2 elongates stems.', NULL)
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

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see this, the species/strains data was applied successfully!
--
-- Summary:
-- - 20 Species (gourmet, medicinal, research)
-- - 18 Strains (oyster, lions mane, shiitake, reishi, etc.)
-- ============================================================================
