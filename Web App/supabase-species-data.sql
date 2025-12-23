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
-- SPECIES - Cultivated mushroom species
-- ============================================================================
INSERT INTO species (id, name, scientific_name, common_names, category, notes, user_id)
VALUES
  -- ========== GOURMET SPECIES ==========
  ('00000000-0000-0000-0000-000000000001', 'Oyster', 'Pleurotus ostreatus', ARRAY['Pearl Oyster', 'Tree Oyster'], 'gourmet', 'Fast-growing, beginner-friendly. Many color varieties available.', NULL),
  ('00000000-0000-0000-0000-000000000002', 'King Oyster', 'Pleurotus eryngii', ARRAY['King Trumpet', 'French Horn', 'Trumpet Royale'], 'gourmet', 'Meaty texture, excellent culinary mushroom. Slower than regular oyster.', NULL),
  ('00000000-0000-0000-0000-000000000003', 'Pink Oyster', 'Pleurotus djamor', ARRAY['Flamingo Oyster', 'Salmon Oyster'], 'gourmet', 'Tropical species, needs warmth (75-85°F). Vibrant pink color, delicate flavor.', NULL),
  ('00000000-0000-0000-0000-000000000004', 'Blue Oyster', 'Pleurotus columbinus', ARRAY['Blue Pearl', 'Blue King'], 'gourmet', 'Cold-tolerant variety. Deep blue caps when young, fading to gray.', NULL),
  ('00000000-0000-0000-0000-000000000005', 'Shiitake', 'Lentinula edodes', ARRAY['Oak Mushroom', 'Black Forest', 'Donko'], 'gourmet', 'Traditional Asian mushroom. Longer colonization but excellent flavor and shelf life.', NULL),
  ('00000000-0000-0000-0000-000000000006', 'Maitake', 'Grifola frondosa', ARRAY['Hen of the Woods', 'Dancing Mushroom', 'Ram''s Head'], 'gourmet', 'Prized gourmet with medicinal properties. Challenging to cultivate.', NULL),
  ('00000000-0000-0000-0000-000000000007', 'Chestnut', 'Pholiota adiposa', ARRAY['Cinnamon Cap', 'Fat Pholiota'], 'gourmet', 'Nutty flavor, crunchy texture. Good for supplemented substrates.', NULL),
  ('00000000-0000-0000-0000-000000000008', 'Pioppino', 'Cyclocybe aegerita', ARRAY['Black Poplar', 'Velvet Pioppini', 'Agrocybe'], 'gourmet', 'Italian delicacy with firm texture. Grows in clusters.', NULL),
  ('00000000-0000-0000-0000-000000000009', 'Enoki', 'Flammulina velutipes', ARRAY['Winter Mushroom', 'Velvet Foot', 'Enokitake'], 'gourmet', 'Long thin stems, mild flavor. Needs cold fruiting temps (40-50°F).', NULL),
  ('00000000-0000-0000-0000-000000000010', 'Nameko', 'Pholiota nameko', ARRAY['Butterscotch Mushroom', 'Viscid Mushroom'], 'gourmet', 'Slimy cap, used in miso soup. Prefers cooler temperatures.', NULL),
  ('00000000-0000-0000-0000-000000000016', 'Wine Cap', 'Stropharia rugosoannulata', ARRAY['King Stropharia', 'Garden Giant', 'Burgundy Cap'], 'gourmet', 'Outdoor garden species. Great for wood chips and garden beds.', NULL),
  ('00000000-0000-0000-0000-000000000017', 'Chicken of the Woods', 'Laetiporus sulphureus', ARRAY['Sulphur Shelf', 'Chicken Fungus'], 'gourmet', 'Bright orange shelf fungus. Challenging indoor cultivation.', NULL),
  ('00000000-0000-0000-0000-000000000018', 'Black Pearl Oyster', 'Pleurotus ostreatus var. black', ARRAY['Black King', 'Black Pearl'], 'gourmet', 'Dark oyster variety with robust flavor. Similar care to standard oyster.', NULL),
  ('00000000-0000-0000-0000-000000000019', 'Golden Oyster', 'Pleurotus citrinopileatus', ARRAY['Yellow Oyster', 'Tamogitake'], 'gourmet', 'Tropical species, bright yellow. Needs warmth, delicate texture.', NULL),
  ('00000000-0000-0000-0000-000000000020', 'Elm Oyster', 'Hypsizygus ulmarius', ARRAY['Elm Leech', 'White Elm'], 'gourmet', 'Large white caps, mild flavor. Cold tolerant.', NULL),
  ('00000000-0000-0000-0000-000000000021', 'Almond Mushroom', 'Agaricus subrufescens', ARRAY['Royal Sun Agaricus', 'Himematsutake', 'Cogumelo do Sol'], 'gourmet', 'Sweet almond aroma. Also known as ABM (Agaricus blazei Murill). Medicinal properties.', NULL),
  ('00000000-0000-0000-0000-000000000022', 'Shaggy Mane', 'Coprinus comatus', ARRAY['Lawyer''s Wig', 'Inky Cap'], 'gourmet', 'Delicate gourmet, deliquesces quickly after harvest. Must be eaten fresh.', NULL),
  ('00000000-0000-0000-0000-000000000023', 'Black Morel', 'Morchella elata', ARRAY['True Morel', 'Sponge Mushroom'], 'gourmet', 'Highly prized gourmet. Extremely challenging indoor cultivation.', NULL),
  ('00000000-0000-0000-0000-000000000024', 'Tiger Sawgill', 'Lentinus tigrinus', ARRAY['Tiger Lentinus', 'Panther Cap'], 'gourmet', 'Striking tiger-striped cap. Firm texture, good for stir-fry.', NULL),
  ('00000000-0000-0000-0000-000000000025', 'Aspen Oyster', 'Pleurotus populinus', ARRAY['Cottonwood Oyster'], 'gourmet', 'Native to North American aspens. Similar to pearl oyster.', NULL),
  ('00000000-0000-0000-0000-000000000026', 'Shimeji', 'Hypsizygus tessellatus', ARRAY['Beech Mushroom', 'Buna Shimeji'], 'gourmet', 'Japanese staple mushroom. Bitter raw, sweet when cooked.', NULL),
  ('00000000-0000-0000-0000-000000000027', 'Phoenix Oyster', 'Pleurotus pulmonarius', ARRAY['Indian Oyster', 'Lung Oyster'], 'gourmet', 'Warm weather oyster variety. Faster than P. ostreatus.', NULL),
  ('00000000-0000-0000-0000-000000000028', 'Nebrodini Bianco', 'Pleurotus nebrodensis', ARRAY['White Ferula', 'Sicilian King'], 'gourmet', 'Rare Italian species. Dense flesh, excellent flavor.', NULL),
  ('00000000-0000-0000-0000-000000000029', 'Abalone Oyster', 'Pleurotus cystidiosus', ARRAY['Maple Oyster', 'Abalone Mushroom'], 'gourmet', 'Dense texture similar to abalone. Slower growing than regular oyster.', NULL),
  ('00000000-0000-0000-0000-000000000030', 'Ghost Fungus', 'Omphalotus nidiformis', ARRAY['Australian Ghost Fungus'], 'other', 'Bioluminescent Australian species. Not edible - for display/research only.', NULL),

  -- ========== MEDICINAL SPECIES ==========
  ('00000000-0000-0000-0000-000000000011', 'Lions Mane', 'Hericium erinaceus', ARRAY['Bearded Tooth', 'Pom Pom', 'Hedgehog Mushroom'], 'medicinal', 'Brain-boosting medicinal. Needs high humidity, no caps - just teeth.', NULL),
  ('00000000-0000-0000-0000-000000000012', 'Reishi', 'Ganoderma lucidum', ARRAY['Lingzhi', 'Mushroom of Immortality', 'Varnished Conk'], 'medicinal', 'Classic red reishi. Woody polypore, primarily for tea/tinctures. Long grow cycle.', NULL),
  ('00000000-0000-0000-0000-000000000013', 'Turkey Tail', 'Trametes versicolor', ARRAY['Yun Zhi', 'Kawaratake', 'Cloud Mushroom'], 'medicinal', 'Thin shelf fungus, powerful immune support. Easy outdoor cultivation.', NULL),
  ('00000000-0000-0000-0000-000000000014', 'Cordyceps', 'Cordyceps militaris', ARRAY['Caterpillar Fungus', 'Dong Chong Xia Cao'], 'medicinal', 'Orange club-shaped fruiting bodies. Requires specialized substrate and light.', NULL),
  ('00000000-0000-0000-0000-000000000015', 'Chaga', 'Inonotus obliquus', ARRAY['Clinker Polypore', 'Birch Conk'], 'medicinal', 'Wild-harvested primarily. Sclerotia, not fruiting body.', NULL),
  ('00000000-0000-0000-0000-000000000031', 'Oregon Reishi', 'Ganoderma oregonense', ARRAY['Western Varnished Conk'], 'medicinal', 'North American reishi species. Large fruiting bodies.', NULL),
  ('00000000-0000-0000-0000-000000000032', 'Artists Conk', 'Ganoderma applanatum', ARRAY['Artists Bracket'], 'medicinal', 'Large shelf fungus. Used medicinally and for artwork on undersurface.', NULL),
  ('00000000-0000-0000-0000-000000000033', 'Bears Head', 'Hericium americanum', ARRAY['Bears Head Tooth', 'Coral Hericium'], 'medicinal', 'Branching hericium species. Similar properties to lions mane.', NULL),
  ('00000000-0000-0000-0000-000000000034', 'Coral Tooth', 'Hericium coralloides', ARRAY['Comb Tooth', 'Coral Hedgehog'], 'medicinal', 'Delicate branching structure. Similar to lions mane medicinally.', NULL),
  ('00000000-0000-0000-0000-000000000035', 'Tinder Conk', 'Fomes fomentarius', ARRAY['Hoof Fungus', 'Ice Man Fungus', 'Amadou'], 'medicinal', 'Ancient medicinal. Used historically for fire-starting (amadou).', NULL),
  ('00000000-0000-0000-0000-000000000036', 'Red Belted Conk', 'Fomitopsis pinicola', ARRAY['Red Belt Polypore'], 'medicinal', 'Colorful shelf fungus. Medicinal properties being researched.', NULL),
  ('00000000-0000-0000-0000-000000000037', 'Birch Polypore', 'Fomitopsis betulina', ARRAY['Razor Strop Fungus', 'Birch Bracket'], 'medicinal', 'Traditional European medicinal. Anti-inflammatory properties.', NULL),
  ('00000000-0000-0000-0000-000000000038', 'Meshima', 'Phellinus linteus', ARRAY['Black Hoof Mushroom', 'Sang Hwang'], 'medicinal', 'Traditional Korean/Japanese medicinal. Immune support.', NULL),
  ('00000000-0000-0000-0000-000000000039', 'Agarikon', 'Laricifomes officinalis', ARRAY['Quinine Conk', 'Brown Trunk Rot'], 'medicinal', 'Ancient medicinal, now rare. Antiviral properties being researched.', NULL),
  ('00000000-0000-0000-0000-000000000040', 'Split Gill', 'Schizophyllum commune', ARRAY['Split Gill Polypore'], 'medicinal', 'One of most widely distributed fungi. Medicinal and model organism.', NULL),

  -- ========== RESEARCH SPECIES (Psilocybin-containing) ==========
  ('00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'Psilocybe cubensis', ARRAY['Golden Cap', 'Gold Top', 'Cubes'], 'research', 'Most widely cultivated psilocybin species. Hundreds of strains available. Research/microscopy use only.', NULL),
  ('00000000-0000-0000-0000-000000000101', 'Psilocybe azurescens', 'Psilocybe azurescens', ARRAY['Azzies', 'Flying Saucers', 'Blue Angels'], 'research', 'One of the most potent psilocybin species. Native to Pacific Northwest. Wood-loving, outdoor cultivation.', NULL),
  ('00000000-0000-0000-0000-000000000102', 'Psilocybe cyanescens', 'Psilocybe cyanescens', ARRAY['Wavy Caps', 'Cyans'], 'research', 'Potent wood-loving species. Distinctive wavy cap margins. Cold climate preference.', NULL),
  ('00000000-0000-0000-0000-000000000103', 'Psilocybe semilanceata', 'Psilocybe semilanceata', ARRAY['Liberty Cap', 'Witches Hat'], 'research', 'Famous European species. Not cultivated - grassland species.', NULL),
  ('00000000-0000-0000-0000-000000000104', 'Psilocybe tampanensis', 'Psilocybe tampanensis', ARRAY['Philosophers Stone', 'Magic Truffle'], 'research', 'Produces sclerotia (truffles). Rare in wild, common in cultivation.', NULL),
  ('00000000-0000-0000-0000-000000000105', 'Psilocybe mexicana', 'Psilocybe mexicana', ARRAY['Teonanacatl', 'Flesh of the Gods'], 'research', 'Historic ceremonial species. Produces sclerotia. Used by Mazatec shamans.', NULL),
  ('00000000-0000-0000-0000-000000000106', 'Psilocybe caerulescens', 'Psilocybe caerulescens', ARRAY['Landslide Mushroom', 'Derrumbe'], 'research', 'Mexican species with strong bluing reaction. Ceremonial use.', NULL),
  ('00000000-0000-0000-0000-000000000107', 'Psilocybe natalensis', 'Psilocybe natalensis', ARRAY['Natal Super Strength', 'NSS'], 'research', 'South African species. High potency, fast colonization.', NULL),
  ('00000000-0000-0000-0000-000000000108', 'Psilocybe ovoideocystidiata', 'Psilocybe ovoideocystidiata', ARRAY['Ovoids', 'Ovoid Psilocybe'], 'research', 'Eastern North American wood-loving species. Cold tolerant.', NULL),
  ('00000000-0000-0000-0000-000000000109', 'Psilocybe allenii', 'Psilocybe allenii', ARRAY['Allen''s Psilocybe'], 'research', 'Pacific Northwest wood-lover. Similar to P. cyanescens.', NULL),
  ('00000000-0000-0000-0000-000000000110', 'Psilocybe subaeruginosa', 'Psilocybe subaeruginosa', ARRAY['Subs', 'Australian Psilocybe'], 'research', 'Australian and New Zealand wood-loving species.', NULL),
  ('00000000-0000-0000-0000-000000000111', 'Psilocybe hoogshagenii', 'Psilocybe hoogshagenii', ARRAY['Little Birds of the Woods'], 'research', 'Mexican species. Forms in grassy areas and coffee plantations.', NULL),
  ('00000000-0000-0000-0000-000000000112', 'Psilocybe zapotecorum', 'Psilocybe zapotecorum', ARRAY['Zapotec Mushroom', 'Crown of Thorns'], 'research', 'Large Mexican species with distinctive crown-like cap.', NULL),
  ('00000000-0000-0000-0000-000000000113', 'Psilocybe baeocystis', 'Psilocybe baeocystis', ARRAY['Bottle Caps', 'Knobby Tops'], 'research', 'Pacific Northwest species. Found in mulched garden beds.', NULL),
  ('00000000-0000-0000-0000-000000000114', 'Psilocybe stuntzii', 'Psilocybe stuntzii', ARRAY['Stuntz''s Blue Legs', 'Blue Ringers'], 'research', 'Pacific Northwest urban species. Found in wood chips.', NULL),
  ('00000000-0000-0000-0000-000000000115', 'Panaeolus cyanescens', 'Panaeolus cyanescens', ARRAY['Blue Meanies', 'Pan Cyans'], 'research', 'Tropical dung-loving species. Very potent. Fast growing.', NULL),
  ('00000000-0000-0000-0000-000000000116', 'Panaeolus tropicalis', 'Panaeolus tropicalis', ARRAY['Tropical Panaeolus'], 'research', 'Tropical species similar to P. cyanescens.', NULL),
  ('00000000-0000-0000-0000-000000000117', 'Panaeolus cambodginiensis', 'Panaeolus cambodginiensis', ARRAY['Cambodian Panaeolus'], 'research', 'Southeast Asian species. Dung-loving.', NULL),
  ('00000000-0000-0000-0000-000000000118', 'Gymnopilus luteofolius', 'Gymnopilus luteofolius', ARRAY['Yellow-gilled Gymnopilus'], 'research', 'Wood-rotting species with psilocybin. Bitter taste.', NULL),
  ('00000000-0000-0000-0000-000000000119', 'Gymnopilus junonius', 'Gymnopilus junonius', ARRAY['Spectacular Rustgill', 'Big Laughing Gym'], 'research', 'Large wood-rotting species. Variable psilocybin content.', NULL),
  ('00000000-0000-0000-0000-000000000120', 'Pluteus salicinus', 'Pluteus salicinus', ARRAY['Knackers Crumpet'], 'research', 'Wood-rotting species. Low psilocybin content.', NULL)

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
  -- ========== OYSTER STRAINS ==========
  ('00000000-0000-0000-0001-000000000001', 'Blue Oyster', '00000000-0000-0000-0000-000000000004', 'Pleurotus columbinus', 'beginner', 7, 14, 5, 10, 22, 18, 'Cold-tolerant variety, fruits at lower temps. Aggressive colonizer.', NULL),
  ('00000000-0000-0000-0001-000000000002', 'Pink Oyster', '00000000-0000-0000-0000-000000000003', 'Pleurotus djamor', 'beginner', 5, 10, 4, 7, 28, 25, 'Tropical species, needs warmth (75-85°F). Fast grower, short shelf life.', NULL),
  ('00000000-0000-0000-0001-000000000003', 'Pearl Oyster', '00000000-0000-0000-0000-000000000001', 'Pleurotus ostreatus', 'beginner', 7, 14, 5, 10, 24, 20, 'Classic oyster mushroom. Very forgiving, great for beginners.', NULL),
  ('00000000-0000-0000-0001-000000000004', 'Golden Oyster', '00000000-0000-0000-0000-000000000019', 'Pleurotus citrinopileatus', 'beginner', 7, 12, 5, 8, 26, 24, 'Bright yellow clusters, tropical species. Delicate, use fresh.', NULL),
  ('00000000-0000-0000-0001-000000000005', 'Italian Oyster', '00000000-0000-0000-0000-000000000001', 'Pleurotus ostreatus', 'beginner', 10, 14, 5, 10, 24, 21, 'Brown caps, excellent flavor. Slightly longer colonization.', NULL),
  ('00000000-0000-0000-0001-000000000006', 'King Oyster', '00000000-0000-0000-0000-000000000002', 'Pleurotus eryngii', 'intermediate', 14, 21, 7, 14, 24, 18, 'Thick stems, meaty texture. Needs specific fruiting conditions.', NULL),
  ('00000000-0000-0000-0001-000000000007', 'Black Pearl Oyster', '00000000-0000-0000-0000-000000000018', 'Pleurotus ostreatus var. black', 'beginner', 7, 14, 5, 10, 24, 20, 'Dark caps with robust umami flavor. Easy to cultivate.', NULL),
  ('00000000-0000-0000-0001-000000000008', 'Phoenix Oyster', '00000000-0000-0000-0000-000000000027', 'Pleurotus pulmonarius', 'beginner', 5, 12, 4, 8, 26, 22, 'Warm weather variety. Faster than P. ostreatus.', NULL),
  ('00000000-0000-0000-0001-000000000009', 'Aspen Oyster', '00000000-0000-0000-0000-000000000025', 'Pleurotus populinus', 'beginner', 7, 14, 5, 10, 24, 20, 'North American native. Similar care to pearl oyster.', NULL),

  -- ========== LIONS MANE / HERICIUM STRAINS ==========
  ('00000000-0000-0000-0001-000000000010', 'Lions Mane', '00000000-0000-0000-0000-000000000011', 'Hericium erinaceus', 'intermediate', 14, 21, 7, 14, 22, 18, 'Standard lions mane. High humidity crucial for tooth formation.', NULL),
  ('00000000-0000-0000-0001-000000000011', 'Bears Head', '00000000-0000-0000-0000-000000000033', 'Hericium americanum', 'intermediate', 14, 21, 7, 14, 22, 18, 'Branching variety with shorter teeth. Similar care to standard.', NULL),
  ('00000000-0000-0000-0001-000000000012', 'Coral Tooth', '00000000-0000-0000-0000-000000000034', 'Hericium coralloides', 'intermediate', 14, 21, 7, 14, 22, 18, 'Delicate branching structure. Needs high humidity.', NULL),

  -- ========== SHIITAKE STRAINS ==========
  ('00000000-0000-0000-0001-000000000020', 'Shiitake Cold Weather', '00000000-0000-0000-0000-000000000005', 'Lentinula edodes', 'intermediate', 60, 90, 7, 14, 24, 16, 'Cold-shock variety for fruiting. Traditional log or sawdust cultivation.', NULL),
  ('00000000-0000-0000-0001-000000000021', 'Shiitake Warm Weather', '00000000-0000-0000-0000-000000000005', 'Lentinula edodes', 'intermediate', 45, 75, 7, 14, 24, 21, 'Faster colonization, fruits at warmer temps. Good for indoor cultivation.', NULL),
  ('00000000-0000-0000-0001-000000000022', 'Donko Shiitake', '00000000-0000-0000-0000-000000000005', 'Lentinula edodes', 'advanced', 60, 90, 10, 18, 24, 14, 'Thick, cracked caps. Slow fruiting produces premium quality.', NULL),
  ('00000000-0000-0000-0001-000000000023', 'Night Velvet Shiitake', '00000000-0000-0000-0000-000000000005', 'Lentinula edodes', 'intermediate', 45, 60, 7, 14, 24, 18, 'Dark colored variety. Good supplemented sawdust producer.', NULL),
  ('00000000-0000-0000-0001-000000000024', 'West Wind Shiitake', '00000000-0000-0000-0000-000000000005', 'Lentinula edodes', 'intermediate', 60, 90, 7, 14, 24, 18, 'Traditional variety. Excellent for log cultivation.', NULL),

  -- ========== REISHI / GANODERMA STRAINS ==========
  ('00000000-0000-0000-0001-000000000030', 'Red Reishi', '00000000-0000-0000-0000-000000000012', 'Ganoderma lucidum', 'intermediate', 30, 60, 30, 90, 26, 26, 'Classic medicinal reishi. Conk or antler forms depending on CO2.', NULL),
  ('00000000-0000-0000-0001-000000000031', 'Oregon Reishi', '00000000-0000-0000-0000-000000000031', 'Ganoderma oregonense', 'intermediate', 30, 60, 30, 90, 24, 24, 'Large native North American reishi. Robust grower.', NULL),
  ('00000000-0000-0000-0001-000000000032', 'Artists Conk', '00000000-0000-0000-0000-000000000032', 'Ganoderma applanatum', 'intermediate', 30, 60, 60, 120, 24, 22, 'Very large shelf fungus. Slow growing. Pore surface used for art.', NULL),
  ('00000000-0000-0000-0001-000000000033', 'Antler Reishi', '00000000-0000-0000-0000-000000000012', 'Ganoderma lucidum', 'intermediate', 30, 60, 30, 90, 26, 26, 'High CO2 produces antler form. Same species as red reishi.', NULL),

  -- ========== MAITAKE ==========
  ('00000000-0000-0000-0001-000000000040', 'Maitake', '00000000-0000-0000-0000-000000000006', 'Grifola frondosa', 'advanced', 45, 90, 14, 28, 22, 18, 'Challenging species. Needs specific conditions and patience.', NULL),

  -- ========== WINE CAP ==========
  ('00000000-0000-0000-0001-000000000050', 'Wine Cap', '00000000-0000-0000-0000-000000000016', 'Stropharia rugosoannulata', 'beginner', 30, 60, 14, 28, 20, 18, 'Best for outdoor beds. Wood chips + straw substrate.', NULL),

  -- ========== CHESTNUT ==========
  ('00000000-0000-0000-0001-000000000060', 'Chestnut', '00000000-0000-0000-0000-000000000007', 'Pholiota adiposa', 'intermediate', 14, 21, 10, 14, 24, 20, 'Nutty flavor, firm texture. Supplemented sawdust preferred.', NULL),

  -- ========== PIOPPINO ==========
  ('00000000-0000-0000-0001-000000000070', 'Pioppino', '00000000-0000-0000-0000-000000000008', 'Cyclocybe aegerita', 'intermediate', 21, 30, 10, 18, 24, 18, 'Italian gourmet. Long stems, clusters. Needs cold shock.', NULL),

  -- ========== CORDYCEPS ==========
  ('00000000-0000-0000-0001-000000000080', 'Cordyceps militaris', '00000000-0000-0000-0000-000000000014', 'Cordyceps militaris', 'advanced', 21, 35, 30, 60, 24, 20, 'Requires rice substrate and specific light cycle. Orange clubs.', NULL),

  -- ========== ENOKI ==========
  ('00000000-0000-0000-0001-000000000090', 'Enoki', '00000000-0000-0000-0000-000000000009', 'Flammulina velutipes', 'intermediate', 14, 21, 14, 21, 22, 10, 'Cold fruiting (40-50°F). High CO2 elongates stems.', NULL),

  -- ========== OTHER GOURMET STRAINS ==========
  ('00000000-0000-0000-0001-000000000091', 'Almond Mushroom', '00000000-0000-0000-0000-000000000021', 'Agaricus subrufescens', 'intermediate', 21, 35, 14, 21, 26, 24, 'Sweet almond aroma. Requires composted substrate.', NULL),
  ('00000000-0000-0000-0001-000000000092', 'Shimeji', '00000000-0000-0000-0000-000000000026', 'Hypsizygus tessellatus', 'intermediate', 21, 30, 10, 14, 22, 18, 'Japanese beech mushroom. Clusters of small caps.', NULL),
  ('00000000-0000-0000-0001-000000000093', 'Tiger Sawgill', '00000000-0000-0000-0000-000000000024', 'Lentinus tigrinus', 'intermediate', 14, 21, 7, 14, 24, 22, 'Distinctive tiger-striped cap. Firm texture.', NULL),
  ('00000000-0000-0000-0001-000000000094', 'Nameko', '00000000-0000-0000-0000-000000000010', 'Pholiota nameko', 'intermediate', 21, 35, 10, 14, 22, 16, 'Slimy cap mushroom for miso soup. Cool temps preferred.', NULL),
  ('00000000-0000-0000-0001-000000000095', 'Nebrodini Bianco', '00000000-0000-0000-0000-000000000028', 'Pleurotus nebrodensis', 'advanced', 21, 35, 10, 18, 22, 16, 'Rare Sicilian king oyster. Dense flesh, exceptional flavor.', NULL),

  -- ========== MEDICINAL STRAINS ==========
  ('00000000-0000-0000-0001-000000000096', 'Turkey Tail', '00000000-0000-0000-0000-000000000013', 'Trametes versicolor', 'beginner', 14, 21, 21, 42, 24, 22, 'Easy outdoor cultivation. Thin shelf fungus for immune support.', NULL),
  ('00000000-0000-0000-0001-000000000097', 'Tinder Conk', '00000000-0000-0000-0000-000000000035', 'Fomes fomentarius', 'advanced', 30, 60, 60, 120, 22, 20, 'Ancient medicinal. Slow growing perennial polypore.', NULL),
  ('00000000-0000-0000-0001-000000000098', 'Birch Polypore', '00000000-0000-0000-0000-000000000037', 'Fomitopsis betulina', 'advanced', 30, 60, 60, 120, 22, 18, 'Birch-specific. Anti-inflammatory properties.', NULL),
  ('00000000-0000-0000-0001-000000000099', 'Meshima', '00000000-0000-0000-0000-000000000038', 'Phellinus linteus', 'expert', 60, 90, 90, 180, 26, 24, 'Traditional Korean medicinal. Very slow growing.', NULL),

  -- ========== PSILOCYBE CUBENSIS STRAINS ==========
  -- Classic/Foundation Strains
  ('00000000-0000-0000-0001-000000000100', 'B+', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Most popular strain. Very forgiving, large fruits, great for beginners.', NULL),
  ('00000000-0000-0000-0001-000000000101', 'Golden Teacher', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Classic strain with golden caps. Reliable and moderate potency.', NULL),
  ('00000000-0000-0000-0001-000000000102', 'Cambodian', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 7, 12, 5, 10, 28, 26, 'Fast colonizer from Southeast Asia. Smaller but prolific fruits.', NULL),
  ('00000000-0000-0000-0001-000000000103', 'Ecuador', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Highland origin strain. Large dense fruits.', NULL),
  ('00000000-0000-0000-0001-000000000104', 'Mazatapec', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 12, 18, 7, 14, 24, 22, 'Mexican ceremonial strain. Spiritual heritage.', NULL),
  ('00000000-0000-0000-0001-000000000105', 'PES Amazonian', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Large meaty fruits from Amazon region. Reliable producer.', NULL),
  ('00000000-0000-0000-0001-000000000106', 'Koh Samui', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 7, 12, 5, 10, 28, 26, 'Thai island strain. Fast, small dense fruits.', NULL),
  ('00000000-0000-0000-0001-000000000107', 'Burma', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 7, 12, 5, 10, 28, 26, 'Southeast Asian origin. Fast colonizer, good beginner choice.', NULL),
  ('00000000-0000-0000-0001-000000000108', 'Costa Rican', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Central American strain. Warm climate adapted.', NULL),
  ('00000000-0000-0000-0001-000000000109', 'Treasure Coast', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Florida origin. Good producer, beginner friendly.', NULL),
  ('00000000-0000-0000-0001-000000000110', 'Z-Strain', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 7, 12, 5, 10, 26, 24, 'Very aggressive colonizer. Heavy yielder.', NULL),
  ('00000000-0000-0000-0001-000000000111', 'Tidal Wave', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'PE x B+ hybrid. Higher potency than standard cubensis.', NULL),

  -- Penis Envy Variants
  ('00000000-0000-0000-0001-000000000120', 'Penis Envy', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'advanced', 14, 21, 10, 18, 26, 24, 'Classic PE. Significantly higher potency. Requires experience.', NULL),
  ('00000000-0000-0000-0001-000000000121', 'Penis Envy Uncut', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'advanced', 14, 21, 10, 18, 26, 24, 'PE variant with attached cap. Very potent.', NULL),
  ('00000000-0000-0000-0001-000000000122', 'Albino Penis Envy', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'expert', 14, 21, 10, 18, 26, 24, 'Leucistic PE variant. High potency, slower grower.', NULL),
  ('00000000-0000-0000-0001-000000000123', 'Penis Envy 6', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'advanced', 14, 21, 10, 18, 26, 24, 'PE x Texas hybrid. More forgiving than classic PE.', NULL),
  ('00000000-0000-0000-0001-000000000124', 'Trans Envy', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'advanced', 14, 21, 10, 18, 26, 24, 'PE x Transkei hybrid. South African genetics.', NULL),
  ('00000000-0000-0000-0001-000000000125', 'Melmac', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'advanced', 14, 21, 10, 18, 26, 24, 'Original PE homeomorph variant. Wavy cap, thick stem.', NULL),
  ('00000000-0000-0000-0001-000000000126', 'Enigma', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'expert', 21, 35, 21, 42, 26, 24, 'Blob mutation. Does not drop spores, clone only. Very potent.', NULL),
  ('00000000-0000-0000-0001-000000000127', 'Pearly Gates', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'advanced', 14, 21, 10, 18, 26, 24, 'Albino PE variant. White fruits with high potency.', NULL),

  -- TAT/True Albino Teacher Variants
  ('00000000-0000-0000-0001-000000000130', 'True Albino Teacher', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'Albino Golden Teacher. White fruits, good producer.', NULL),
  ('00000000-0000-0000-0001-000000000131', 'TAT Smurfs', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'TAT variant with blue staining. Leucistic.', NULL),
  ('00000000-0000-0000-0001-000000000132', 'White Rabbit', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 12, 16, 7, 14, 26, 24, 'Albino Moby Dick. Pure white, good potency.', NULL),

  -- Albino/Leucistic Varieties
  ('00000000-0000-0000-0001-000000000140', 'Albino A+', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'Leucistic variant. Creamy white caps, moderate potency.', NULL),
  ('00000000-0000-0000-0001-000000000141', 'AA+', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'Albino A+ variant. White to cream colored.', NULL),
  ('00000000-0000-0000-0001-000000000142', 'Moby Dick', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 12, 16, 7, 14, 26, 24, 'Albino A+ x Golden Teacher. Large white fruits.', NULL),
  ('00000000-0000-0000-0001-000000000143', 'Jack Frost', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'TAT x APE hybrid. Frosted appearance. Popular new variety.', NULL),
  ('00000000-0000-0000-0001-000000000144', 'Yeti', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'advanced', 14, 21, 10, 18, 26, 24, 'TAT x APE hybrid. White, thick stemmed.', NULL),
  ('00000000-0000-0000-0001-000000000145', 'Ghost', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'advanced', 14, 21, 10, 18, 26, 24, 'TAT x Ghost hybrid. White ethereal appearance.', NULL),
  ('00000000-0000-0000-0001-000000000146', 'Avery Albino', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'Cambodian albino variant. Fast colonization.', NULL),
  ('00000000-0000-0000-0001-000000000147', 'Great White Monster', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'Puerto Rican albino. Large dense white fruits.', NULL),

  -- Regional/Wild Origin Strains
  ('00000000-0000-0000-0001-000000000150', 'Hillbilly', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Arkansas origin. Brown caps, reliable producer.', NULL),
  ('00000000-0000-0000-0001-000000000151', 'Texas', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Southern US strain. Medium sized, good producer.', NULL),
  ('00000000-0000-0000-0001-000000000152', 'Texas Orange Cap', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Texas variant with distinctive orange caps.', NULL),
  ('00000000-0000-0000-0001-000000000153', 'Gulf Coast', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Florida/Gulf strain. Subtropical adapted.', NULL),
  ('00000000-0000-0000-0001-000000000154', 'Colombian', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'South American origin. Classic brown caps.', NULL),
  ('00000000-0000-0000-0001-000000000155', 'Transkei', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'South African strain from Wild Coast. Unique genetics.', NULL),
  ('00000000-0000-0000-0001-000000000156', 'Vietnamese', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 7, 12, 5, 10, 28, 26, 'Southeast Asian origin. Fast tropical strain.', NULL),
  ('00000000-0000-0000-0001-000000000157', 'Ban Hua Thai', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 7, 12, 5, 10, 28, 26, 'Thai strain. Fast, prolific fruiter.', NULL),
  ('00000000-0000-0000-0001-000000000158', 'Thai Pink Buffalo', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 7, 12, 5, 10, 28, 26, 'Thai strain found in buffalo dung. Unique history.', NULL),
  ('00000000-0000-0000-0001-000000000159', 'Nepal Chitwan', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Himalayan foothills origin. Handles temp variation.', NULL),
  ('00000000-0000-0000-0001-000000000160', 'South American', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Brazilian origin. Good beginner strain.', NULL),
  ('00000000-0000-0000-0001-000000000161', 'Argentina', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 24, 22, 'Southern origin. Handles cooler temps.', NULL),
  ('00000000-0000-0000-0001-000000000162', 'Australian', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Australian wild collection. Large caps.', NULL),
  ('00000000-0000-0000-0001-000000000163', 'Hawaiian', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 8, 12, 5, 10, 28, 26, 'Pacific island strain. Tropical adapted.', NULL),
  ('00000000-0000-0000-0001-000000000164', 'Puerto Rican', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Caribbean origin. Dense meaty fruits.', NULL),
  ('00000000-0000-0000-0001-000000000165', 'Cuba', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Original type locality strain from Cuba.', NULL),
  ('00000000-0000-0000-0001-000000000166', 'Jamaica', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 28, 26, 'Caribbean tropical strain.', NULL),

  -- Specialty/Unique Strains
  ('00000000-0000-0000-0001-000000000170', 'Blue Magnolia Rust', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'Mississippi strain with rusty colored spores. Higher potency.', NULL),
  ('00000000-0000-0000-0001-000000000171', 'Blue Meanie (cubensis)', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Cubensis strain, not Panaeolus. Australian origin.', NULL),
  ('00000000-0000-0000-0001-000000000172', 'Rusty Whyte', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'Leucistic with rusty spores. Unique appearance.', NULL),
  ('00000000-0000-0000-0001-000000000173', 'Golden Mammoth', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'Selectively bred for size and consistency.', NULL),
  ('00000000-0000-0000-0001-000000000174', 'Hanoi', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 7, 12, 5, 10, 28, 26, 'Vietnamese city strain. Fast colonizing.', NULL),
  ('00000000-0000-0000-0001-000000000175', 'Huautla', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 12, 18, 7, 14, 24, 22, 'Oaxacan strain, Maria Sabina lineage claim.', NULL),
  ('00000000-0000-0000-0001-000000000176', 'Jedi Mind Fuck', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'Z-strain mutation. Higher than average potency.', NULL),
  ('00000000-0000-0000-0001-000000000177', 'Lizard King', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Northern Mexican origin. Good all-around strain.', NULL),
  ('00000000-0000-0000-0001-000000000178', 'McKennaii', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'Dutch bred strain. Higher potency, slower growth.', NULL),
  ('00000000-0000-0000-0001-000000000179', 'Orissa India', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 28, 26, 'Tall fruits from Indian state. Elephant dung origin.', NULL),
  ('00000000-0000-0000-0001-000000000180', 'PES Hawaiian', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 8, 12, 5, 10, 28, 26, 'Pacific Exotic Spora Hawaiian. Aggressive colonizer.', NULL),
  ('00000000-0000-0000-0001-000000000181', 'Penis Envy x Melmac', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'advanced', 14, 21, 10, 18, 26, 24, 'Cross of two PE variants. Very potent.', NULL),
  ('00000000-0000-0000-0001-000000000182', 'Stargazer', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'advanced', 14, 18, 10, 16, 26, 24, 'Blue bruising, high potency hybrid.', NULL),
  ('00000000-0000-0000-0001-000000000183', 'Wollongong', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Australian coastal city origin.', NULL),
  ('00000000-0000-0000-0001-000000000184', 'Amazonian PES', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 26, 24, 'Pacific Exotica Amazonian. Dense fleshy fruits.', NULL),
  ('00000000-0000-0000-0001-000000000185', 'Shakti', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'Indian strain. Spiritual significance.', NULL),
  ('00000000-0000-0000-0001-000000000186', 'Tasmanian', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'beginner', 10, 14, 7, 14, 24, 22, 'Cool climate Australian strain.', NULL),
  ('00000000-0000-0000-0001-000000000187', 'Trinity', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'advanced', 14, 21, 10, 18, 26, 24, 'PE x Aztec God hybrid. Three-strain lineage.', NULL),
  ('00000000-0000-0000-0001-000000000188', 'Aztec God', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'Mexican origin with higher potency claims.', NULL),
  ('00000000-0000-0000-0001-000000000189', 'Albino Goldies', '00000000-0000-0000-0000-000000000100', 'Psilocybe cubensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'Leucistic Golden Teacher variant.', NULL),

  -- ========== OTHER PSILOCYBE SPECIES STRAINS ==========
  ('00000000-0000-0000-0001-000000000200', 'Psilocybe azurescens', '00000000-0000-0000-0000-000000000101', 'Psilocybe azurescens', 'expert', 60, 90, 21, 42, 18, 14, 'One of most potent species. Wood-loving, outdoor beds required.', NULL),
  ('00000000-0000-0000-0001-000000000201', 'Psilocybe cyanescens', '00000000-0000-0000-0000-000000000102', 'Psilocybe cyanescens', 'expert', 60, 90, 21, 42, 18, 12, 'Wavy cap. Wood-loving, requires outdoor bed cultivation.', NULL),
  ('00000000-0000-0000-0001-000000000202', 'Psilocybe tampanensis', '00000000-0000-0000-0000-000000000104', 'Psilocybe tampanensis', 'advanced', 30, 60, 30, 60, 24, 22, 'Sclerotia producer (truffles). Indoor cultivation possible.', NULL),
  ('00000000-0000-0000-0001-000000000203', 'Psilocybe mexicana Jalisco', '00000000-0000-0000-0000-000000000105', 'Psilocybe mexicana', 'advanced', 30, 60, 30, 60, 24, 22, 'Classic Mexican strain. Produces sclerotia and mushrooms.', NULL),
  ('00000000-0000-0000-0001-000000000204', 'Psilocybe mexicana A', '00000000-0000-0000-0000-000000000105', 'Psilocybe mexicana', 'advanced', 30, 60, 30, 60, 24, 22, 'Galindoi variety. Good sclerotia producer.', NULL),
  ('00000000-0000-0000-0001-000000000205', 'Psilocybe natalensis', '00000000-0000-0000-0000-000000000107', 'Psilocybe natalensis', 'intermediate', 10, 14, 7, 14, 26, 24, 'South African species. High potency, faster than cubensis.', NULL),
  ('00000000-0000-0000-0001-000000000206', 'Psilocybe ovoideocystidiata', '00000000-0000-0000-0000-000000000108', 'Psilocybe ovoideocystidiata', 'advanced', 45, 75, 14, 28, 20, 16, 'Eastern US wood-lover. Outdoor cultivation.', NULL),
  ('00000000-0000-0000-0001-000000000207', 'Psilocybe subaeruginosa', '00000000-0000-0000-0000-000000000110', 'Psilocybe subaeruginosa', 'advanced', 60, 90, 21, 42, 18, 14, 'Australian wood-lover. Cool climate outdoor cultivation.', NULL),
  ('00000000-0000-0000-0001-000000000208', 'Psilocybe allenii', '00000000-0000-0000-0000-000000000109', 'Psilocybe allenii', 'advanced', 60, 90, 21, 42, 18, 14, 'Pacific Northwest wood-lover. Similar to cyanescens.', NULL),

  -- ========== PANAEOLUS STRAINS ==========
  ('00000000-0000-0000-0001-000000000210', 'Panaeolus cyanescens (Blue Meanies)', '00000000-0000-0000-0000-000000000115', 'Panaeolus cyanescens', 'advanced', 7, 14, 5, 10, 28, 26, 'True Blue Meanies (not cubensis). Very potent. Dung-loving.', NULL),
  ('00000000-0000-0000-0001-000000000211', 'Panaeolus cyanescens Jamaica', '00000000-0000-0000-0000-000000000115', 'Panaeolus cyanescens', 'advanced', 7, 14, 5, 10, 28, 26, 'Jamaican origin. Tropical dung species.', NULL),
  ('00000000-0000-0000-0001-000000000212', 'Panaeolus cyanescens Hawaii', '00000000-0000-0000-0000-000000000115', 'Panaeolus cyanescens', 'advanced', 7, 14, 5, 10, 28, 26, 'Hawaiian collection. Prolific fruiter.', NULL),
  ('00000000-0000-0000-0001-000000000213', 'Panaeolus tropicalis', '00000000-0000-0000-0000-000000000116', 'Panaeolus tropicalis', 'advanced', 7, 14, 5, 10, 28, 26, 'Tropical species. Similar care to P. cyanescens.', NULL),
  ('00000000-0000-0000-0001-000000000214', 'Panaeolus cambodginiensis', '00000000-0000-0000-0000-000000000117', 'Panaeolus cambodginiensis', 'advanced', 7, 14, 5, 10, 28, 26, 'Southeast Asian species. Fast colonizing.', NULL)

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
-- - 41 Species total:
--   - 19 Gourmet species
--   - 10 Medicinal species
--   - 12 Research species (Psilocybe, Panaeolus, Gymnopilus)
-- - 115+ Strains total:
--   - Oyster family (9 strains)
--   - Lions Mane/Hericium (3 strains)
--   - Shiitake (5 strains)
--   - Reishi/Ganoderma (4 strains)
--   - Other gourmet (10+ strains)
--   - Medicinal (4 strains)
--   - Psilocybe cubensis (90+ strains including PE, TAT, Albino variants)
--   - Other Psilocybe species (8 strains)
--   - Panaeolus (5 strains)
-- ============================================================================
