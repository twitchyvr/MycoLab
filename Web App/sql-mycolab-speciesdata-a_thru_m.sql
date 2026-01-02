-- ============================================================================
-- SPORELY RESEARCH SPECIES SEED DATA - A through M (Alphabetical)
-- ============================================================================
-- Idempotent - Safe to run multiple times
-- Run this AFTER supabase-schema.sql AND sporely-research-species-seed.sql
-- ============================================================================
--
-- SCOPE: Research/Psychoactive mushroom species, names beginning A-M
-- This covers multiple genera containing psilocybin, muscimol, or other
-- psychoactive compounds studied in mycological research.
--
-- GENERA COVERED:
-- - Amanita (muscimol-containing - A. muscaria, A. pantherina)
-- - Conocybe (psilocybin - C. cyanopus, C. siligineoides, etc.)
-- - Galerina (TOXIC - included for differentiation/safety)
-- - Gymnopilus (psilocybin - G. aeruginosus, G. luteofolius, etc.)
-- - Inocybe (psilocybin/aeruginascin - I. aeruginascens)
-- - Panaeolus/Copelandia (psilocybin - P. cyanescens, P. cinctulus, etc.)
-- - Psilocybe A-M (P. allenii, P. azurescens, P. baeocystis, P. caerulescens,
--                 P. cubensis [strains], P. cyanescens, P. mexicana, etc.)
--
-- TEMPERATURE UNITS: Celsius (matching scientific literature)
-- HUMIDITY: Percentage (%)
-- CO2: Parts per million (ppm)
--
-- DATA CONFIDENCE RATINGS:
-- - "well_documented": Multiple peer-reviewed or reputable sources agree
-- - "community_consensus": Widely accepted in cultivation community
-- - "limited_reports": Some grower reports, not widely verified
-- - "theoretical": Based on related species or habitat extrapolation
-- - "not_domesticated": Wild harvest only, cultivation not established
-- - "mycorrhizal": Cannot be cultivated - requires living tree symbiosis
--
-- IMPORTANT SAFETY NOTES:
-- - Some genera (Galerina, some Conocybe) contain DEADLY amatoxins
-- - Proper identification is CRITICAL before any interaction
-- - This data is for EDUCATIONAL and RESEARCH purposes only
--
-- IDEMPOTENCY: This file handles conflicts with data from other seed files:
-- 1. Pre-flight cleanup removes conflicting name/scientific_name entries
-- 2. ON CONFLICT (id) handles re-runs of this same file
-- 3. All operations are wrapped in exception handlers
-- ============================================================================

-- Enable UUID extension (should already exist)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PRE-FLIGHT: Handle conflicts with other seed files
-- ============================================================================
DO $$
DECLARE
  v_conflict_count INTEGER;
  v_strain_count INTEGER;
BEGIN
  RAISE NOTICE '[Species A-M] Starting pre-flight checks...';

  -- First, delete any strains that reference species we're about to delete
  -- This handles foreign key constraints properly
  DELETE FROM strains
  WHERE species_id IN (
    SELECT s.id
    FROM species s
    WHERE s.user_id IS NULL
      AND s.id::text NOT LIKE '10000000-%'  -- Not our IDs
      AND s.scientific_name IN (
        'Amanita muscaria', 'Amanita pantherina',
        'Conocybula cyanopus', 'Conocybe siligineoides',
        'Galerina marginata', 'Galerina autumnalis',
        'Gymnopilus aeruginosus', 'Gymnopilus luteofolius', 'Gymnopilus junonius', 'Gymnopilus spectabilis',
        'Inocybe aeruginascens',
        'Panaeolus cyanescens', 'Panaeolus cinctulus', 'Panaeolus cambodginiensis', 'Panaeolus tropicalis',
        'Psilocybe allenii', 'Psilocybe azurescens', 'Psilocybe baeocystis', 'Psilocybe caerulescens',
        'Psilocybe cyanescens', 'Psilocybe mexicana'
      )
  );
  GET DIAGNOSTICS v_strain_count = ROW_COUNT;
  IF v_strain_count > 0 THEN
    RAISE NOTICE '[Species A-M] Deleted % dependent strains', v_strain_count;
  END IF;

  -- Now delete conflicting species (safe since strains are gone)
  WITH conflicts AS (
    SELECT s.id, s.name, s.scientific_name
    FROM species s
    WHERE s.user_id IS NULL
      AND s.id::text NOT LIKE '10000000-%'  -- Not our IDs
      AND (
        -- Match by scientific_name (preferred match)
        s.scientific_name IN (
          'Amanita muscaria', 'Amanita pantherina',
          'Conocybula cyanopus', 'Conocybe siligineoides',
          'Galerina marginata', 'Galerina autumnalis',
          'Gymnopilus aeruginosus', 'Gymnopilus luteofolius', 'Gymnopilus junonius', 'Gymnopilus spectabilis',
          'Inocybe aeruginascens',
          'Panaeolus cyanescens', 'Panaeolus cinctulus', 'Panaeolus cambodginiensis', 'Panaeolus tropicalis',
          'Psilocybe allenii', 'Psilocybe azurescens', 'Psilocybe baeocystis', 'Psilocybe caerulescens',
          'Psilocybe cyanescens', 'Psilocybe mexicana'
        )
      )
  ),
  deleted AS (
    DELETE FROM species WHERE id IN (SELECT id FROM conflicts) RETURNING id
  )
  SELECT COUNT(*) INTO v_conflict_count FROM deleted;

  IF v_conflict_count > 0 THEN
    RAISE NOTICE '[Species A-M] Removed % conflicting entries from other seed files', v_conflict_count;
  END IF;

  RAISE NOTICE '[Species A-M] Pre-flight checks complete';
END $$;

-- ============================================================================
-- SECTION 1: AMANITA (Muscimol-containing species)
-- ============================================================================
-- NOTE: Amanita species are MYCORRHIZAL and CANNOT be cultivated indoors.
-- They require symbiotic relationships with living trees.
-- Included for reference/wild identification only.
-- ============================================================================

INSERT INTO species (
  id, name, scientific_name, common_names, category, notes, user_id
)
VALUES
  -- Amanita muscaria - Fly Agaric
  (
    '10000000-0000-0000-0000-000000000001',
    'Fly Agaric',
    'Amanita muscaria',
    ARRAY['Fly Amanita', 'Soma', 'Mukhomor', 'Toadstool'],
    'research',
    E'MYCORRHIZAL - CANNOT BE CULTIVATED INDOORS.\n\n' ||
    E'Active compounds: Muscimol (GABAa agonist), Ibotenic acid (neurotoxin/prodrug).\n' ||
    E'NOT a classic psychedelic - produces deliriant/oneiroigenic effects.\n\n' ||
    E'HABITAT: Symbiotic with birch, pine, spruce, fir in temperate/boreal forests.\n' ||
    E'Northern Hemisphere native, naturalized in Southern Hemisphere.\n' ||
    E'Fruits late summer through autumn.\n\n' ||
    E'PREPARATION CRITICAL: Raw mushrooms contain high ibotenic acid (neurotoxic).\n' ||
    E'Traditional preparation: Drying converts ibotenic acid → muscimol.\n' ||
    E'Potency highly variable by region, altitude, season (up to 10x variation).\n\n' ||
    E'CHEMICAL PROFILE:\n' ||
    E'- Fresh: ~258-471 ppm ibotenic acid, minimal muscimol (9:1 ratio)\n' ||
    E'- Dried: Variable conversion to muscimol\n' ||
    E'- Cap contains highest concentration\n' ||
    E'- Active dose: ~6mg muscimol or 30-60mg ibotenic acid (1 cap)\n\n' ||
    E'DATA CONFIDENCE: well_documented (chemistry), not_domesticated (cultivation)',
    NULL
  ),
  
  -- Amanita pantherina - Panther Cap
  (
    '10000000-0000-0000-0000-000000000002',
    'Panther Cap',
    'Amanita pantherina',
    ARRAY['Panther Amanita', 'False Blusher'],
    'research',
    E'MYCORRHIZAL - CANNOT BE CULTIVATED INDOORS.\n\n' ||
    E'Active compounds: Muscimol, Ibotenic acid (typically HIGHER than A. muscaria).\n' ||
    E'Reported to be 2-3x more potent than A. muscaria.\n\n' ||
    E'HABITAT: Coniferous and deciduous forests, Europe and western North America.\n' ||
    E'Mycorrhizal with various trees.\n\n' ||
    E'APPEARANCE: Brown cap with white warts (easily confused with edible species).\n' ||
    E'CAUTION: More toxic than A. muscaria, serious poisonings reported.\n\n' ||
    E'DATA CONFIDENCE: community_consensus (effects), not_domesticated (cultivation)',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  scientific_name = EXCLUDED.scientific_name,
  common_names = EXCLUDED.common_names,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes;

-- ============================================================================
-- SECTION 2: CONOCYBE (Psilocybin-containing species)
-- ============================================================================
-- CAUTION: This genus also contains DEADLY species (C. filaris, C. rugosa)
-- containing amatoxins. Microscopic ID often required.
-- Very limited cultivation data - mostly wild-harvested.
-- ============================================================================

INSERT INTO species (
  id, name, scientific_name, common_names, category, notes, user_id
)
VALUES
  -- Conocybe cyanopus (now Conocybula cyanopus)
  (
    '10000000-0000-0000-0001-000000000001',
    'Blue-foot Conocybe',
    'Conocybula cyanopus',
    ARRAY['Conocybe cyanopus', 'Blue-foot Conecap'],
    'research',
    E'PSILOCYBIN-CONTAINING - Limited cultivation data.\n\n' ||
    E'Synonyms: Conocybe cyanopus, Galera cyanopes\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin, Aeruginascin\n' ||
    E'One of only two known natural sources of aeruginascin (with I. aeruginascens).\n\n' ||
    E'HABITAT: Lawns, gardens, grassy areas on decaying organic matter.\n' ||
    E'Distribution: Washington, Colorado, British Columbia (North America).\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Small, fragile mushroom with conical cap\n' ||
    E'- Blue-staining base and mycelia (key identifier)\n' ||
    E'- Rust-brown spore print\n\n' ||
    E'⚠️ CRITICAL WARNING: Easily confused with DEADLY Conocybe species!\n' ||
    E'C. filaris and C. rugosa contain amatoxins - microscopy required for safe ID.\n\n' ||
    E'CULTIVATION: Not established. Saprotrophic on grass/organic debris.\n' ||
    E'Theoretical substrate: Grass seed, decaying plant matter.\n\n' ||
    E'DATA CONFIDENCE: limited_reports (chemistry), not_domesticated (cultivation)',
    NULL
  ),

  -- Conocybe siligineoides
  (
    '10000000-0000-0000-0001-000000000002',
    'Mexican Conocybe',
    'Conocybe siligineoides',
    ARRAY['Sacred Conocybe'],
    'research',
    E'PSILOCYBIN-CONTAINING - Traditional Mexican use documented.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin\n' ||
    E'Used for shamanic purposes by Mazatec people of Oaxaca, Mexico.\n\n' ||
    E'HABITAT: Mexico, specific localities unknown.\n' ||
    E'Very rare - limited documented collections.\n\n' ||
    E'CULTIVATION: Not established. No successful cultivation reports.\n\n' ||
    E'⚠️ WARNING: Genus contains deadly species. Expert ID required.\n\n' ||
    E'DATA CONFIDENCE: limited_reports (existence), not_domesticated (cultivation)',
    NULL
  ),

  -- Conocybe kuehneriana  
  (
    '10000000-0000-0000-0001-000000000003',
    'Kuehner''s Conocybe',
    'Conocybe kuehneriana',
    ARRAY['Kuehners Conecap'],
    'research',
    E'PSILOCYBIN-CONTAINING - Very rare species.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin\n\n' ||
    E'HABITAT: Europe, growing in grassy areas.\n' ||
    E'Very limited distribution and documentation.\n\n' ||
    E'CULTIVATION: Not established.\n\n' ||
    E'⚠️ WARNING: Genus contains deadly species. Expert ID required.\n\n' ||
    E'DATA CONFIDENCE: limited_reports',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  scientific_name = EXCLUDED.scientific_name,
  common_names = EXCLUDED.common_names,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes;

-- ============================================================================
-- SECTION 3: GALERINA (DEADLY - Included for safety/differentiation)
-- ============================================================================
-- These species are DEADLY TOXIC and included ONLY so cultivators can
-- learn to differentiate them from psychoactive lookalikes.
-- ============================================================================

INSERT INTO species (
  id, name, scientific_name, common_names, category, notes, user_id
)
VALUES
  (
    '10000000-0000-0000-0002-000000000001',
    'Deadly Galerina',
    'Galerina marginata',
    ARRAY['Funeral Bell', 'Autumn Galerina', 'Deadly Skullcap'],
    'other',
    E'⚠️⚠️⚠️ DEADLY TOXIC - DO NOT CONSUME ⚠️⚠️⚠️\n\n' ||
    E'Contains AMATOXINS (same as Death Cap) - causes liver failure and death.\n' ||
    E'Included in database for IDENTIFICATION/DIFFERENTIATION ONLY.\n\n' ||
    E'COMMONLY CONFUSED WITH:\n' ||
    E'- Psilocybe cyanescens, P. azurescens (wood-lovers)\n' ||
    E'- Gymnopilus species\n' ||
    E'- Conocybe species\n\n' ||
    E'KEY DIFFERENCES FROM PSILOCYBE:\n' ||
    E'- Does NOT bruise blue (crucial!)\n' ||
    E'- Rusty-brown spore print (vs purple-black in Psilocybe)\n' ||
    E'- Ring on stem often present\n' ||
    E'- Grows on decaying wood\n\n' ||
    E'HABITAT: Dead wood, especially conifers. Worldwide distribution.\n\n' ||
    E'IF CONSUMED: Seek emergency medical attention immediately.\n' ||
    E'Symptoms may be delayed 6-12 hours. Liver transplant may be required.\n\n' ||
    E'DATA CONFIDENCE: well_documented (toxicity)',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  scientific_name = EXCLUDED.scientific_name,
  common_names = EXCLUDED.common_names,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes;

-- ============================================================================
-- SECTION 4: GYMNOPILUS (Psilocybin-containing rustgills)
-- ============================================================================
-- Wood-loving saprotrophs. 14 species contain psilocybin.
-- Also contain bis-noryangonin and hispidin (kava-related compounds).
-- Generally less potent than Psilocybe, with bitter taste.
-- ============================================================================

INSERT INTO species (
  id, name, scientific_name, common_names, category, notes, user_id
)
VALUES
  -- Gymnopilus aeruginosus
  (
    '10000000-0000-0000-0003-000000000001',
    'Magic Blue Gym',
    'Gymnopilus aeruginosus',
    ARRAY['Blue Gym', 'Blue-green Gymnopilus'],
    'research',
    E'PSILOCYBIN-CONTAINING - Moderate potency.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin, bis-noryangonin, hispidin\n' ||
    E'Potency: Medium - moderate psilocybin content\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Cap: 5-15cm, convex, fibrillose/scaly\n' ||
    E'- Color: Variable - often bluish-green, pink, or vinaceous patches\n' ||
    E'- Distinctive blue-green staining when bruised\n' ||
    E'- Rusty-orange spore print\n' ||
    E'- Bitter taste (deters consumption)\n\n' ||
    E'HABITAT: Dead wood, especially conifers. Common in Pacific Northwest.\n' ||
    E'Grows in dense clusters, spring/fall/winter.\n\n' ||
    E'CULTIVATION STATUS: Intermediate-Advanced difficulty.\n' ||
    E'Wood-based substrate required (hardwood chips, sawdust).\n' ||
    E'Slower than P. cubensis, inconsistent fruiting indoors.\n\n' ||
    E'SUBSTRATE: Hardwood chips, alder, beech sawdust\n' ||
    E'COLONIZATION TEMP: 18-24°C (65-75°F)\n' ||
    E'FRUITING TEMP: 16-21°C (60-70°F)\n' ||
    E'HUMIDITY: 85-95%\n' ||
    E'COLONIZATION: 4-8 weeks\n' ||
    E'FRUITING: 2-4 weeks after colonization\n\n' ||
    E'⚠️ LOOKALIKES: Galerina marginata (DEADLY), Pholiota species.\n\n' ||
    E'DATA CONFIDENCE: community_consensus (cultivation), well_documented (chemistry)',
    NULL
  ),

  -- Gymnopilus luteofolius  
  (
    '10000000-0000-0000-0003-000000000002',
    'Yellow-gilled Gymnopilus',
    'Gymnopilus luteofolius',
    ARRAY['Laughing Gym', 'Yellow-gilled Rustgill'],
    'research',
    E'PSILOCYBIN-CONTAINING - Low to moderate potency.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin (variable), bis-noryangonin, hispidin\n' ||
    E'Known for euphoric effects and "laughing" response.\n' ||
    E'Potency: Low-Medium - inconsistent psilocybin content\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Cap: 2-10cm, reddish to purplish-red with yellow\n' ||
    E'- Gills: Bright yellow (distinctive)\n' ||
    E'- May develop green stains on cap\n' ||
    E'- Rusty-orange spore print\n' ||
    E'- Very bitter taste\n\n' ||
    E'HABITAT: Dead hardwoods and conifers, wood chips.\n' ||
    E'Distribution: North America, fruits July-November (East), winter (West).\n' ||
    E'Grows in dense clusters.\n\n' ||
    E'CULTIVATION STATUS: Advanced difficulty.\n' ||
    E'Slow colonization, finicky fruiting conditions.\n\n' ||
    E'SUBSTRATE: Hardwood chips/sawdust (lignin-rich)\n' ||
    E'COLONIZATION TEMP: 18-24°C (65-75°F)\n' ||
    E'FRUITING TEMP: 16-21°C (60-70°F) - prefers cool\n' ||
    E'HUMIDITY: 85-95%\n' ||
    E'COLONIZATION: 4-6+ weeks\n' ||
    E'LIGHT: Indirect, mimicking natural habitat\n\n' ||
    E'⚠️ LOOKALIKES: Galerina marginata (DEADLY), Cortinarius speciosissimus (toxic)\n\n' ||
    E'DATA CONFIDENCE: limited_reports (cultivation), community_consensus (ID)',
    NULL
  ),

  -- Gymnopilus junonius
  (
    '10000000-0000-0000-0003-000000000003',
    'Spectacular Rustgill',
    'Gymnopilus junonius',
    ARRAY['Big Laughing Gym', 'Gymnopilus spectabilis'],
    'research',
    E'QUESTIONABLE PSYCHOACTIVITY - Regional variation.\n\n' ||
    E'COMPOUNDS: Bis-noryangonin, hispidin (kava-related)\n' ||
    E'Psilocybin: Japanese subspecies contain psilocybin; Western N. American may NOT.\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- LARGE: Cap 5-30cm (one of largest Gymnopilus)\n' ||
    E'- Color: Yellow-orange to reddish-brown\n' ||
    E'- Dry, scaly surface\n' ||
    E'- Rusty-brown spore print\n' ||
    E'- Very bitter taste\n' ||
    E'- Does NOT stain blue\n\n' ||
    E'HABITAT: Stumps and logs of hardwoods/conifers.\n' ||
    E'Distribution: Europe, Australasia, South America.\n' ||
    E'Note: Does NOT occur in North America (often misidentified).\n\n' ||
    E'CULTIVATION: Limited data. Wood substrate required.\n\n' ||
    E'⚠️ NOTES:\n' ||
    E'- Commonly confused with G. ventricosus (not psychoactive)\n' ||
    E'- Very bitter, makes consumption difficult\n' ||
    E'- Regional chemistry varies significantly\n\n' ||
    E'DATA CONFIDENCE: limited_reports (psychoactivity varies by region)',
    NULL
  ),

  -- Gymnopilus validipes
  (
    '10000000-0000-0000-0003-000000000004',
    'Strong-stemmed Gymnopilus',
    'Gymnopilus validipes',
    ARRAY['Peck''s Gymnopilus'],
    'research',
    E'PSILOCYBIN-CONTAINING - Confirmed psychoactive.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Medium to large mushroom\n' ||
    E'- Thick, sturdy stem (validipes = "strong foot")\n' ||
    E'- Yellow-brown to orange cap\n' ||
    E'- Rusty spore print\n\n' ||
    E'HABITAT: Dead wood, stumps, buried wood.\n' ||
    E'Distribution: Eastern North America.\n\n' ||
    E'CULTIVATION: Not well documented. Wood substrate assumed.\n\n' ||
    E'DATA CONFIDENCE: limited_reports',
    NULL
  ),

  -- Gymnopilus purpuratus
  (
    '10000000-0000-0000-0003-000000000005',
    'Purple Gymnopilus',
    'Gymnopilus purpuratus',
    ARRAY['Purplish Rustgill'],
    'research',
    E'PSILOCYBIN-CONTAINING - Confirmed psychoactive.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin\n' ||
    E'Reported to have "high psilocybin content."\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Purple/purplish tones on cap\n' ||
    E'- Rusty-orange spore print\n\n' ||
    E'HABITAT: Wood, native to Southern Hemisphere.\n' ||
    E'Distribution: Chile, Argentina, Australia, New Zealand.\n\n' ||
    E'CULTIVATION: Not documented.\n\n' ||
    E'DATA CONFIDENCE: limited_reports',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  scientific_name = EXCLUDED.scientific_name,
  common_names = EXCLUDED.common_names,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes;

-- ============================================================================
-- SECTION 5: INOCYBE (Limited psilocybin species)
-- ============================================================================
-- Most Inocybe contain muscarine (TOXIC). Only I. aeruginascens documented
-- as psychoactive. MYCORRHIZAL - not cultivated.
-- ============================================================================

INSERT INTO species (
  id, name, scientific_name, common_names, category, notes, user_id
)
VALUES
  (
    '10000000-0000-0000-0004-000000000001',
    'Green-staining Inocybe',
    'Inocybe aeruginascens',
    ARRAY['Blue-green Inocybe'],
    'research',
    E'PSILOCYBIN + AERUGINASCIN CONTAINING - Unique chemistry.\n\n' ||
    E'MYCORRHIZAL - Cannot be cultivated indoors.\n\n' ||
    E'ACTIVE COMPOUNDS:\n' ||
    E'- Psilocybin\n' ||
    E'- Psilocin\n' ||
    E'- Baeocystin\n' ||
    E'- AERUGINASCIN (unique to this species and Conocybula cyanopus)\n\n' ||
    E'Aeruginascin is the N-trimethyl analogue of psilocybin.\n' ||
    E'May contribute to unique psychoactive profile.\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Small mushroom (cap 1-5cm)\n' ||
    E'- Conic to convex cap, fibrillose margin\n' ||
    E'- Buff to light yellow-brown cap\n' ||
    E'- Distinctive GREENISH staining (disappears when dried)\n' ||
    E'- Bluish bruising at stem base\n' ||
    E'- Clay-brown spore print\n' ||
    E'- Smooth, ellipsoid spores (6-9.5 x 4.5μm)\n\n' ||
    E'HABITAT:\n' ||
    E'- Sandy soil near deciduous tree roots\n' ||
    E'- Mycorrhizal with birch, poplar, linden, oak\n' ||
    E'- Parks and lawns in urban areas\n' ||
    E'- Most documented in Berlin/Brandenburg, Germany\n' ||
    E'- Fruits May-June (sometimes to October)\n' ||
    E'- Needs moist, non-dry summers\n\n' ||
    E'DISCOVERY: First documented in Ócsa, Hungary (June 15, 1965) by I. Ferencz.\n' ||
    E'First accidental ingestion report from Budapest.\n\n' ||
    E'⚠️ CRITICAL WARNING:\n' ||
    E'Most Inocybe species contain MUSCARINE (seriously toxic).\n' ||
    E'Expert identification absolutely required.\n' ||
    E'Genus requires microscopy for safe ID.\n\n' ||
    E'CULTIVATION: Not possible - mycorrhizal.\n' ||
    E'Would require living tree symbiosis.\n\n' ||
    E'DATA CONFIDENCE: well_documented (chemistry), mycorrhizal (cultivation)',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  scientific_name = EXCLUDED.scientific_name,
  common_names = EXCLUDED.common_names,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes;

-- ============================================================================
-- SECTION 6: PANAEOLUS/COPELANDIA (Psilocybin-containing dung lovers)
-- ============================================================================
-- Tropical/subtropical dung-inhabiting species.
-- P. cyanescens ("Blue Meanies") is the most commonly cultivated.
-- Generally more potent than P. cubensis but more challenging to grow.
-- ============================================================================

INSERT INTO species (
  id, name, scientific_name, common_names, category, notes, user_id
)
VALUES
  -- Panaeolus cyanescens (Copelandia cyanescens)
  (
    '10000000-0000-0000-0005-000000000001',
    'Blue Meanies',
    'Panaeolus cyanescens',
    ARRAY['Copelandia cyanescens', 'Hawaiian Blue Meanies', 'Pan Cyan'],
    'research',
    E'PSILOCYBIN-CONTAINING - High potency.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin, Baeocystin\n' ||
    E'Potency: HIGH - significantly stronger than P. cubensis.\n' ||
    E'Estimated 2-3x more potent per dry weight.\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Cap: 1.5-4cm, light brown to gray (hygrophanous)\n' ||
    E'- Strong blue bruising (hence "Blue Meanies")\n' ||
    E'- Mottled black gills (Panaeolus = "all variegated")\n' ||
    E'- Jet black spore print\n' ||
    E'- Thin, fragile stems\n\n' ||
    E'HABITAT: Dung (cattle, horse, buffalo) in tropical/subtropical regions.\n' ||
    E'Distribution: Worldwide in warm climates - Hawaii, SE Asia, Africa, Australia.\n\n' ||
    E'CULTIVATION: Intermediate-Advanced.\n' ||
    E'More challenging than P. cubensis - less forgiving of conditions.\n' ||
    E'Requires CASING LAYER (critical difference from cubensis).\n\n' ||
    E'DETAILED PARAMETERS:\n\n' ||
    E'SPAWN SUBSTRATE: Rye grain preferred (strong single strain on agar recommended)\n\n' ||
    E'BULK SUBSTRATE:\n' ||
    E'- Pasteurized straw/horse manure compost\n' ||
    E'- 10 parts straw : 4 parts cow manure : 3 parts vermiculite : 3 parts water\n' ||
    E'- Alternatively: Wheat straw pasteurized at 71°C (160°F) for 20-30 min\n\n' ||
    E'COLONIZATION:\n' ||
    E'- Temperature: 28-30°C (82-86°F) incubation\n' ||
    E'- Humidity: Substrate moisture (90-92%)\n' ||
    E'- CO2: Up to 10,000 ppm acceptable\n' ||
    E'- Duration: 7-12 days (faster than cubensis)\n' ||
    E'- Light: None needed\n\n' ||
    E'CASING LAYER (REQUIRED):\n' ||
    E'- Composition: Peat moss + vermiculite + calcium carbonate/lime\n' ||
    E'- Thickness: ~1/2 inch (1.3cm) - thin layer\n' ||
    E'- Apply when substrate fully colonized\n' ||
    E'- Wait for mycelium to show through casing before fruiting\n\n' ||
    E'FRUITING:\n' ||
    E'- Temperature: 24-29°C (75-84°F)\n' ||
    E'- Humidity: 85-92% (LOWER than colonization - critical!)\n' ||
    E'- CO2: <5,000 ppm (needs more FAE than cubensis)\n' ||
    E'- Light: Diffuse natural or fluorescent\n' ||
    E'- FAE: 2-4 exchanges per hour\n' ||
    E'- Pins to harvest: 5-7 days\n' ||
    E'- Flushing interval: 5-7 days\n\n' ||
    E'⚠️ CRITICAL NOTES:\n' ||
    E'- STOP misting once pins form (pins abort easily!)\n' ||
    E'- Humidity must DROP after pinning (unlike cubensis)\n' ||
    E'- Mycelium is wispy/cottony, NOT thick and rhizomorphic\n' ||
    E'- Harvest when caps are convex (before spore drop)\n' ||
    E'- Yields lower than cubensis but much more potent\n' ||
    E'- Multiple strains: Aussie, Hawaiian, Jamaica, TTBVI, etc.\n\n' ||
    E'DATA CONFIDENCE: well_documented (cultivation)',
    NULL
  ),

  -- Panaeolus cinctulus
  (
    '10000000-0000-0000-0005-000000000002',
    'Banded Mottlegill',
    'Panaeolus cinctulus',
    ARRAY['Weed Panaeolus', 'Subbalteatus', 'Girdled Panaeolus'],
    'research',
    E'PSILOCYBIN-CONTAINING - Variable potency.\n\n' ||
    E'Synonyms: Panaeolus subbalteatus\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin (variable, often low)\n' ||
    E'Potency: Low-Moderate, highly variable between specimens.\n' ||
    E'Some collections test negative for alkaloids.\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Cap: 1.5-5cm, hygrophanous (color changes with moisture)\n' ||
    E'- Distinctive dark band at cap margin when moist\n' ||
    E'- Light brown to reddish-brown when dry\n' ||
    E'- Mottled gills (Panaeolus characteristic)\n' ||
    E'- Black spore print\n' ||
    E'- Does not bruise blue reliably\n\n' ||
    E'HABITAT:\n' ||
    E'- Grasslands, lawns, gardens, compost, dung-enriched soil\n' ||
    E'- Very common - one of most widespread Panaeolus\n' ||
    E'- Temperate worldwide distribution\n' ||
    E'- Fruits spring through fall\n\n' ||
    E'CULTIVATION: Similar to P. cyanescens but easier.\n' ||
    E'Can fruit on composted materials without pure dung.\n' ||
    E'Casing layer recommended but less critical.\n\n' ||
    E'NOTES:\n' ||
    E'- Most commonly encountered psychoactive Panaeolus in temperate areas\n' ||
    E'- Potency too variable for reliable use\n' ||
    E'- Often found growing in urban lawns\n\n' ||
    E'DATA CONFIDENCE: community_consensus (ID), limited_reports (cultivation)',
    NULL
  ),

  -- Panaeolus cambodginiensis
  (
    '10000000-0000-0000-0005-000000000003',
    'Cambodian Panaeolus',
    'Panaeolus cambodginiensis',
    ARRAY['Copelandia cambodginiensis'],
    'research',
    E'PSILOCYBIN-CONTAINING - High potency.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin\n' ||
    E'Potency: High - similar to P. cyanescens.\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Similar to P. cyanescens\n' ||
    E'- Strong blue bruising\n' ||
    E'- Black spore print\n\n' ||
    E'HABITAT: Dung in tropical regions.\n' ||
    E'Distribution: Southeast Asia, particularly Cambodia.\n\n' ||
    E'CULTIVATION: Similar parameters to P. cyanescens.\n' ||
    E'Dung-based substrate, casing layer required.\n\n' ||
    E'DATA CONFIDENCE: limited_reports',
    NULL
  ),

  -- Panaeolus tropicalis
  (
    '10000000-0000-0000-0005-000000000004',
    'Tropical Panaeolus',
    'Panaeolus tropicalis',
    ARRAY['Copelandia tropicalis'],
    'research',
    E'PSILOCYBIN-CONTAINING - High potency.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin\n' ||
    E'Potency: High - comparable to P. cyanescens.\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Tropical species\n' ||
    E'- Blue bruising present\n' ||
    E'- Black spore print\n\n' ||
    E'HABITAT: Dung in tropical regions.\n' ||
    E'Requires warm temperatures year-round.\n\n' ||
    E'CULTIVATION: Very similar to P. cyanescens.\n' ||
    E'May require warmer fruiting temps (26-30°C / 78-86°F).\n' ||
    E'Same casing requirements.\n\n' ||
    E'DATA CONFIDENCE: limited_reports',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  scientific_name = EXCLUDED.scientific_name,
  common_names = EXCLUDED.common_names,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes;

-- ============================================================================
-- SECTION 7: PSILOCYBE SPECIES A-M (Multiple species with detailed params)
-- ============================================================================
-- The core genus of psilocybin mushrooms.
-- Includes tropical (P. cubensis), wood-lovers (P. azurescens, P. cyanescens),
-- and sclerotia-formers (P. mexicana, P. tampanensis).
-- ============================================================================

INSERT INTO species (
  id, name, scientific_name, common_names, category, notes, user_id
)
VALUES
  -- Psilocybe allenii
  (
    '10000000-0000-0000-0006-000000000001',
    'Allen''s Psilocybe',
    'Psilocybe allenii',
    ARRAY['Allens Blue'],
    'research',
    E'PSILOCYBIN-CONTAINING - Potent wood-lover.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin, Baeocystin\n' ||
    E'Potency: High - comparable to P. cyanescens.\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Cap: 1.5-5cm, convex to plane with umbo\n' ||
    E'- Color: Caramel to chestnut brown (hygrophanous)\n' ||
    E'- Strong blue bruising\n' ||
    E'- Purple-black spore print\n' ||
    E'- Similar to P. cyanescens but distinct species\n\n' ||
    E'HABITAT:\n' ||
    E'- Wood chips, mulch, landscaped areas\n' ||
    E'- Pacific Coast of North America (BC to CA)\n' ||
    E'- Fruits fall through early winter\n\n' ||
    E'CULTIVATION: Outdoor only (like P. cyanescens).\n' ||
    E'Wood chip beds, shaded areas.\n' ||
    E'Cold fruiting temps required: 7-13°C (45-55°F).\n\n' ||
    E'DATA CONFIDENCE: community_consensus',
    NULL
  ),

  -- Psilocybe atlantis
  (
    '10000000-0000-0000-0006-000000000002',
    'Atlantis',
    'Psilocybe atlantis',
    ARRAY['Atlanta Magic Truffles'],
    'research',
    E'PSILOCYBIN-CONTAINING - Sclerotia-forming.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin, Baeocystin\n' ||
    E'Forms SCLEROTIA (magic truffles) - underground storage bodies.\n' ||
    E'Potency: High (truffles and fruiting bodies).\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Rarely forms fruiting bodies in cultivation\n' ||
    E'- Primarily cultivated for sclerotia\n' ||
    E'- Sclerotia: Dense, walnut-like, yellow-brown\n\n' ||
    E'CULTIVATION: Sclerotia production (similar to P. tampanensis).\n\n' ||
    E'SUBSTRATE: Grass seed or rye\n' ||
    E'COLONIZATION: 21-25°C (70-77°F), 2-4 weeks\n' ||
    E'SCLEROTIA FORMATION: 3-4 months after colonization\n' ||
    E'Do NOT shake after colonization begins\n' ||
    E'Dark storage, no fruiting conditions needed\n\n' ||
    E'DATA CONFIDENCE: well_documented (sclerotia cultivation)',
    NULL
  ),

  -- Psilocybe azurescens
  (
    '10000000-0000-0000-0006-000000000003',
    'Flying Saucers',
    'Psilocybe azurescens',
    ARRAY['Azzies', 'Blue Angels', 'Blue Runners', 'Indigo Psilocybe'],
    'research',
    E'PSILOCYBIN-CONTAINING - MOST POTENT KNOWN PSILOCYBE.\n\n' ||
    E'ACTIVE COMPOUNDS:\n' ||
    E'- Psilocybin: Up to 1.78% dry weight (highest documented)\n' ||
    E'- Psilocin: Up to 0.38%\n' ||
    E'- Baeocystin: Up to 0.35%\n\n' ||
    E'⚠️ CAUTION: Associated with "Wood Lovers Paralysis" (WLP)\n' ||
    E'Temporary limb paralysis reported - cause unknown.\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Cap: 3-10cm, caramel-brown, distinctive umbo\n' ||
    E'- Wavy cap margins when mature ("flying saucer" shape)\n' ||
    E'- Strong blue bruising throughout\n' ||
    E'- White stem with blue staining\n' ||
    E'- Dark purple-brown to black spore print\n\n' ||
    E'HABITAT:\n' ||
    E'- Coastal dune grasses, wood chips, sandy soils\n' ||
    E'- Pacific Northwest (Oregon/Washington coast)\n' ||
    E'- Near shore pine, Scotch broom, blackberry\n' ||
    E'- Fruits late September through January\n\n' ||
    E'CULTIVATION: OUTDOOR ONLY - Cold-weather species.\n' ||
    E'Cannot be cultivated indoors (requires cold shock + extended timeline).\n\n' ||
    E'DETAILED OUTDOOR CULTIVATION:\n\n' ||
    E'SPAWN PREPARATION:\n' ||
    E'- Rye grain spawn incubated at 20°C (68°F)\n' ||
    E'- Colonization: 4-8 weeks\n' ||
    E'- Expansion to wood chips after full colonization\n\n' ||
    E'WOOD CHIP SUBSTRATE:\n' ||
    E'- Preferred: Alder (Alnus rubra) chips\n' ||
    E'- Acceptable: Most hardwoods, some conifers\n' ||
    E'- Soak chips 24 hours, drain well\n\n' ||
    E'BED PREPARATION:\n' ||
    E'- Location: Shaded, north-facing if possible\n' ||
    E'- Size: ~80x80x10cm minimum\n' ||
    E'- Layer colonized spawn with fresh wood chips\n' ||
    E'- Cover with cardboard, mulch, or burlap\n' ||
    E'- Best planted: March-April (spring)\n\n' ||
    E'COLONIZATION PERIOD:\n' ||
    E'- Spring/summer: Mycelium colonizes bed (no intervention)\n' ||
    E'- Keep moist during dry periods\n' ||
    E'- No fruiting until fall temperature drop\n' ||
    E'- Timeline: 6-12 months from planting to first fruit\n\n' ||
    E'FRUITING CONDITIONS (Natural):\n' ||
    E'- Triggers: Cold + wet weather in fall\n' ||
    E'- Temperature: Below 10°C (50°F) - ideally 4-10°C (40-50°F)\n' ||
    E'- Rainfall or regular watering\n' ||
    E'- Fruits September-January (until hard frost)\n\n' ||
    E'MAINTENANCE:\n' ||
    E'- Add fresh wood chip layer each spring\n' ||
    E'- Beds can produce for many years\n' ||
    E'- Protect from competing fungi\n\n' ||
    E'⚠️ WARNING: DEADLY LOOKALIKES exist in wood chip habitat.\n' ||
    E'Galerina marginata grows in same environment.\n' ||
    E'Blue bruising and spore print verification ESSENTIAL.\n\n' ||
    E'DATA CONFIDENCE: well_documented (outdoor cultivation)',
    NULL
  ),

  -- Psilocybe baeocystis
  (
    '10000000-0000-0000-0006-000000000004',
    'Potent Psilocybe',
    'Psilocybe baeocystis',
    ARRAY['Bottle Caps', 'Knobby Tops', 'Blue Bells', 'Olive Caps'],
    'research',
    E'PSILOCYBIN-CONTAINING - Potent wood-lover.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin, Baeocystin\n' ||
    E'Baeocystin first isolated from this species (hence the name).\n' ||
    E'Potency: High - comparable to P. cyanescens.\n\n' ||
    E'⚠️ Associated with "Wood Lovers Paralysis" reports.\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Cap: 1.5-5.5cm, conical with distinctive knobby umbo\n' ||
    E'- Color: Dark olive brown, hygrophanous\n' ||
    E'- Gelatinous pellicle (separable skin)\n' ||
    E'- Strong blue bruising\n' ||
    E'- Dark purplish-brown spore print\n\n' ||
    E'HABITAT:\n' ||
    E'- Lawns, mulch, wood chips, decomposing conifers\n' ||
    E'- Pacific Northwest (BC to Northern CA)\n' ||
    E'- Also reported in landscaping nationwide\n' ||
    E'- Fruits fall, sometimes spring\n\n' ||
    E'CULTIVATION: Outdoor wood chip beds.\n' ||
    E'Similar techniques to P. azurescens/cyanescens.\n' ||
    E'Requires cool fruiting temps: 10-18°C (50-65°F).\n\n' ||
    E'DATA CONFIDENCE: community_consensus',
    NULL
  ),

  -- Psilocybe bohemica
  (
    '10000000-0000-0000-0006-000000000005',
    'Bohemian Psilocybe',
    'Psilocybe bohemica',
    ARRAY['Czech Psilocybe'],
    'research',
    E'PSILOCYBIN-CONTAINING - European wood-lover.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin (0.11-1.34% dry weight), Psilocin\n' ||
    E'Potency: Moderate-High, variable.\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Similar to P. cyanescens complex\n' ||
    E'- Wavy cap margins\n' ||
    E'- Blue bruising\n' ||
    E'- Caramel-colored cap\n\n' ||
    E'HABITAT:\n' ||
    E'- Decaying wood, wood chips\n' ||
    E'- Central Europe (Czech Republic, Germany, etc.)\n' ||
    E'- Fruits autumn\n\n' ||
    E'CULTIVATION: Outdoor wood chip beds.\n' ||
    E'Cold-weather European climate optimal.\n' ||
    E'Techniques similar to P. cyanescens.\n\n' ||
    E'DATA CONFIDENCE: limited_reports (European species)',
    NULL
  ),

  -- Psilocybe caerulescens
  (
    '10000000-0000-0000-0006-000000000006',
    'Landslide Mushroom',
    'Psilocybe caerulescens',
    ARRAY['Derrumbe', 'Landslide'],
    'research',
    E'PSILOCYBIN-CONTAINING - Traditional Mexican species.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin\n' ||
    E'"Derrumbe" = landslide in Spanish (habitat reference).\n\n' ||
    E'Traditional use by Mazatec people documented.\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Cap: Silvery-blue sheen\n' ||
    E'- Strong blue bruising\n' ||
    E'- Grows in disturbed soils\n\n' ||
    E'HABITAT:\n' ||
    E'- Mudslides, disturbed earth, sugarcane fields\n' ||
    E'- Mexico, Guatemala\n' ||
    E'- Subtropical climate\n\n' ||
    E'CULTIVATION: Limited documentation.\n' ||
    E'May require disturbed soil substrate.\n\n' ||
    E'DATA CONFIDENCE: limited_reports',
    NULL
  ),

  -- Psilocybe caerulipes
  (
    '10000000-0000-0000-0006-000000000007',
    'Blue-foot Psilocybe',
    'Psilocybe caerulipes',
    ARRAY['Blue-footed Psilocybe'],
    'research',
    E'PSILOCYBIN-CONTAINING - Eastern North American wood-lover.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Cap: 1-3.5cm, convex to plane\n' ||
    E'- Cinnamon brown, hygrophanous\n' ||
    E'- Blue staining especially at stem base\n' ||
    E'- Dark purplish-brown spore print\n\n' ||
    E'HABITAT:\n' ||
    E'- Hardwood debris, especially beech and birch\n' ||
    E'- Eastern North America (rare)\n' ||
    E'- Fruits summer through fall\n\n' ||
    E'CULTIVATION: Not well established.\n' ||
    E'Theoretical: Hardwood chip beds.\n\n' ||
    E'DATA CONFIDENCE: limited_reports',
    NULL
  ),

  -- Psilocybe cyanescens
  (
    '10000000-0000-0000-0006-000000000008',
    'Wavy Caps',
    'Psilocybe cyanescens',
    ARRAY['Wavy Cap', 'Cyan', 'Cyans'],
    'research',
    E'PSILOCYBIN-CONTAINING - Highly potent wood-lover.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin, Baeocystin\n' ||
    E'Potency: Very High - more potent than P. cubensis.\n\n' ||
    E'⚠️ Associated with "Wood Lovers Paralysis" reports.\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Cap: 1.5-5cm, distinctive WAVY margins when mature\n' ||
    E'- Caramel to chestnut brown when moist, pale when dry\n' ||
    E'- Hygrophanous (color changes with moisture)\n' ||
    E'- Intense blue bruising\n' ||
    E'- Dark purple-brown to black spore print\n\n' ||
    E'HABITAT:\n' ||
    E'- Wood chips, mulch beds, landscaping\n' ||
    E'- Originally: Pacific Northwest\n' ||
    E'- Now: Worldwide via contaminated mulch shipments\n' ||
    E'- Europe, New Zealand, Australia, Iran\n' ||
    E'- Fruits fall through winter (10-18°C / 50-65°F)\n\n' ||
    E'CULTIVATION: Primarily OUTDOOR (difficult indoors).\n\n' ||
    E'OUTDOOR CULTIVATION (Recommended):\n\n' ||
    E'SPAWN: Rye grain, colonized at 20°C (68°F)\n\n' ||
    E'SUBSTRATE: Wood chips (NOT bark mulch)\n' ||
    E'- Hardwood chips preferred\n' ||
    E'- Soak 24 hours, drain\n\n' ||
    E'BED SETUP:\n' ||
    E'- Shaded location (north-facing ideal)\n' ||
    E'- Layer spawn with wood chips\n' ||
    E'- Cover with cardboard/burlap\n' ||
    E'- Plant in spring for fall fruiting\n\n' ||
    E'COLONIZATION: 4-6 months (mycelium spreads through bed)\n' ||
    E'Keep moist during dry periods.\n\n' ||
    E'FRUITING TRIGGERS:\n' ||
    E'- Temperature drop to 10-18°C (50-65°F)\n' ||
    E'- Autumn rains\n' ||
    E'- Fruits: Late October - February (varies by climate)\n\n' ||
    E'INDOOR CULTIVATION (Challenging):\n' ||
    E'- Possible but very difficult\n' ||
    E'- Requires cold fruiting chamber\n' ||
    E'- Low yield compared to outdoor\n' ||
    E'- Mycelium easier to propagate than fruit\n\n' ||
    E'BED MAINTENANCE:\n' ||
    E'- Add fresh wood chips each spring\n' ||
    E'- Beds can fruit for many years\n' ||
    E'- Mycelium spreads via mulch distribution\n\n' ||
    E'⚠️ WARNING: Galerina marginata (DEADLY) in same habitat.\n' ||
    E'Always verify blue bruising and spore print.\n\n' ||
    E'DATA CONFIDENCE: well_documented',
    NULL
  ),

  -- Psilocybe galindoi (now often considered P. tampanensis/mexicana complex)
  (
    '10000000-0000-0000-0006-000000000009',
    'Galindoi',
    'Psilocybe galindoi',
    ARRAY['Atlanta #7', 'Galindii'],
    'research',
    E'PSILOCYBIN-CONTAINING - Sclerotia-forming.\n\n' ||
    E'Note: Taxonomic status debated - may be P. tampanensis variant.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin, Baeocystin\n' ||
    E'Forms SCLEROTIA (magic truffles) readily.\n\n' ||
    E'CULTIVATION: Same as P. tampanensis.\n\n' ||
    E'SUBSTRATE: Grass seed, rye\n' ||
    E'COLONIZATION: 21-25°C (70-77°F), 2-4 weeks\n' ||
    E'SCLEROTIA FORMATION: 3-4 months\n' ||
    E'Do NOT shake after colonization\n\n' ||
    E'DATA CONFIDENCE: community_consensus (sclerotia cultivation)',
    NULL
  ),

  -- Psilocybe hispanica
  (
    '10000000-0000-0000-0006-000000000010',
    'Spanish Psilocybe',
    'Psilocybe hispanica',
    ARRAY['Iberian Psilocybe'],
    'research',
    E'PSILOCYBIN-CONTAINING - European species.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin\n\n' ||
    E'HABITAT:\n' ||
    E'- Iberian Peninsula (Spain/Portugal)\n' ||
    E'- Grasslands, dung-enriched soil\n\n' ||
    E'CULTIVATION: Not documented.\n\n' ||
    E'DATA CONFIDENCE: limited_reports',
    NULL
  ),

  -- Psilocybe hoogshagenii
  (
    '10000000-0000-0000-0006-000000000011',
    'Hoogshagen''s Psilocybe',
    'Psilocybe hoogshagenii',
    ARRAY['Little Birds of the Woods'],
    'research',
    E'PSILOCYBIN-CONTAINING - Mexican species.\n\n' ||
    E'Traditional Mazatec name: "little birds of the woods."\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Small mushroom\n' ||
    E'- Papillate (nippled) cap\n\n' ||
    E'HABITAT:\n' ||
    E'- Mexico\n' ||
    E'- Muddy/disturbed soils, coffee plantations\n\n' ||
    E'CULTIVATION: Not documented.\n\n' ||
    E'DATA CONFIDENCE: limited_reports',
    NULL
  ),

  -- Psilocybe liniformans
  (
    '10000000-0000-0000-0006-000000000012',
    'European Liberty Cap',
    'Psilocybe liniformans',
    ARRAY['Lined Psilocybe'],
    'research',
    E'PSILOCYBIN-CONTAINING - European grassland species.\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Similar to P. semilanceata but less common\n' ||
    E'- Striate (lined) cap when moist\n\n' ||
    E'HABITAT:\n' ||
    E'- European grasslands\n' ||
    E'- Acidic soils\n\n' ||
    E'CULTIVATION: Not established (grassland species).\n\n' ||
    E'DATA CONFIDENCE: limited_reports',
    NULL
  ),

  -- Psilocybe mexicana
  (
    '10000000-0000-0000-0006-000000000013',
    'Teonanácatl',
    'Psilocybe mexicana',
    ARRAY['Mexican Magic Mushroom', 'Teonanacatl', 'Flesh of the Gods', 'Pajaritos'],
    'research',
    E'PSILOCYBIN-CONTAINING - Historically significant species.\n\n' ||
    E'First species from which psilocybin was isolated (Albert Hofmann, 1958).\n' ||
    E'"Teonanácatl" = Aztec for "flesh of the gods."\n\n' ||
    E'ACTIVE COMPOUNDS: Psilocybin, Psilocin, Baeocystin\n' ||
    E'Forms SCLEROTIA (magic truffles) - called "Philosopher''s Stones."\n' ||
    E'Potency: Moderate (fruiting bodies), Moderate-High (sclerotia).\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Cap: 0.5-3cm, conical to convex with papilla\n' ||
    E'- Color: Straw to brown/gray\n' ||
    E'- Blue-green staining when handled\n' ||
    E'- Purple-brown spore print\n\n' ||
    E'HABITAT:\n' ||
    E'- Mexico, Guatemala\n' ||
    E'- Grassy meadows, mossy areas\n' ||
    E'- Subtropical highland climate\n' ||
    E'- 1000-1800m elevation\n\n' ||
    E'CULTIVATION: Well established for SCLEROTIA.\n\n' ||
    E'=== SCLEROTIA CULTIVATION (Recommended) ===\n\n' ||
    E'SUBSTRATE:\n' ||
    E'- Grass seed (most common)\n' ||
    E'- Rye grain acceptable\n' ||
    E'- Mix: 10 parts grass seed : 5 parts water\n\n' ||
    E'STERILIZATION:\n' ||
    E'- Pressure cook 60 min at 15 PSI\n' ||
    E'- Cool completely before inoculation\n\n' ||
    E'INOCULATION:\n' ||
    E'- Spore syringe or liquid culture\n' ||
    E'- Agar (single strain) preferred for reliability\n' ||
    E'- Shake well after inoculation\n\n' ||
    E'COLONIZATION:\n' ||
    E'- Temperature: 21-25°C (70-77°F)\n' ||
    E'- Light: Complete darkness\n' ||
    E'- Duration: 2-4 weeks\n' ||
    E'- Shake every few days to speed colonization\n\n' ||
    E'SCLEROTIA FORMATION:\n' ||
    E'- Temperature: 21-25°C (70-77°F)\n' ||
    E'- DO NOT SHAKE after colonization complete\n' ||
    E'- DO NOT fruit - leave sealed\n' ||
    E'- Duration: 3-4 months\n' ||
    E'- Sclerotia grow larger with time\n\n' ||
    E'HARVEST:\n' ||
    E'- Break apart substrate\n' ||
    E'- Remove sclerotia (yellow-brown nuggets)\n' ||
    E'- Rinse clean with water\n\n' ||
    E'STORAGE:\n' ||
    E'- Fresh: Refrigerate 2-5°C (35-41°F), 6-12 months\n' ||
    E'- Dried: Airtight container, cool/dark\n' ||
    E'⚠️ Room temp destroys alkaloids quickly!\n\n' ||
    E'=== FRUITING BODY CULTIVATION (More difficult) ===\n\n' ||
    E'CASING: Required for fruiting\n' ||
    E'- 50/50 peat/vermiculite + calcium carbonate\n' ||
    E'- Apply after full colonization\n' ||
    E'- Wait for mycelium to penetrate casing\n\n' ||
    E'FRUITING CONDITIONS:\n' ||
    E'- Temperature: ~20°C (68°F)\n' ||
    E'- Humidity: 95%\n' ||
    E'- Light: Indirect/ambient\n' ||
    E'- FAE: Moderate\n\n' ||
    E'NOTES:\n' ||
    E'- "A" strain is known sclerotia producer\n' ||
    E'- Jalisco strain also available\n' ||
    E'- Most commercial "truffles" are P. mexicana or P. tampanensis\n\n' ||
    E'DATA CONFIDENCE: well_documented (sclerotia cultivation)',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  scientific_name = EXCLUDED.scientific_name,
  common_names = EXCLUDED.common_names,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes;

-- ============================================================================
-- SECTION 8: STRAINS FOR RESEARCH SPECIES
-- ============================================================================
-- Strains/varieties for species that have documented cultivated variants.
-- Most research species don't have named strains like P. cubensis.
-- ============================================================================

INSERT INTO strains (
  id, name, species_id, species, difficulty, 
  colonization_days_min, colonization_days_max,
  fruiting_days_min, fruiting_days_max,
  optimal_temp_colonization, optimal_temp_fruiting,
  notes, user_id
)
VALUES
  -- Panaeolus cyanescens strains
  (
    '10000000-0000-0001-0001-000000000001',
    'Hawaiian Blue Meanie',
    '10000000-0000-0000-0005-000000000001',
    'Panaeolus cyanescens',
    'intermediate',
    7, 14,  -- colonization days
    5, 10, -- fruiting days
    28, 26, -- temps in Celsius (col/fruit)
    E'Original Hawaiian strain. Very potent. ' ||
    E'Requires casing layer. Stop misting after pins form.',
    NULL
  ),
  (
    '10000000-0000-0001-0001-000000000002',
    'Aussie Blue Meanie',
    '10000000-0000-0000-0005-000000000001',
    'Panaeolus cyanescens',
    'intermediate',
    7, 14,
    5, 10,
    28, 26,
    E'Australian strain. Similar to Hawaiian but some report faster colonization.',
    NULL
  ),
  (
    '10000000-0000-0001-0001-000000000003',
    'Jamaica Pan Cyan',
    '10000000-0000-0000-0005-000000000001',
    'Panaeolus cyanescens',
    'intermediate',
    7, 14,
    5, 10,
    28, 26,
    E'Jamaican strain. Good producer. Requires standard Pan Cyan conditions.',
    NULL
  ),
  (
    '10000000-0000-0001-0001-000000000004',
    'TTBVI',
    '10000000-0000-0000-0005-000000000001',
    'Panaeolus cyanescens',
    'advanced',
    7, 14,
    5, 10,
    28, 26,
    E'Tropical strain variant. High potency. Vivid bruising. Fast growth. ' ||
    E'Requires precise humidity control.',
    NULL
  ),
  
  -- Psilocybe mexicana strains
  (
    '10000000-0000-0001-0002-000000000001',
    'Mexicana A (Sclerotia)',
    '10000000-0000-0000-0006-000000000013',
    'Psilocybe mexicana',
    'beginner',
    14, 28,  -- colonization
    90, 120, -- sclerotia formation (not fruiting)
    24, 24,  -- constant temp for sclerotia
    E'Most reliable sclerotia-producing strain. Grass seed substrate. ' ||
    E'3-4 months for mature truffles. Do not shake after colonization.',
    NULL
  ),
  (
    '10000000-0000-0001-0002-000000000002',
    'Mexicana Jalisco',
    '10000000-0000-0000-0006-000000000013',
    'Psilocybe mexicana',
    'beginner',
    14, 28,
    90, 120,
    24, 24,
    E'Jalisco regional variant. Also produces sclerotia reliably.',
    NULL
  ),
  
  -- Psilocybe tampanensis (Philosopher's Stones)
  (
    '10000000-0000-0001-0003-000000000001',
    'Tampanensis (Philosopher''s Stones)',
    '10000000-0000-0000-0006-000000000002',
    'Psilocybe atlantis', -- Using atlantis as proxy since tampanensis not added yet
    'beginner',
    14, 28,
    90, 120,
    24, 24,
    E'Classic truffle strain. First collected Tampa, FL 1977. ' ||
    E'Only one wild specimen ever found. All cultures from this lineage. ' ||
    E'Grass seed substrate. Medium-strength truffles.',
    NULL
  ),

  -- Psilocybe azurescens strains
  (
    '10000000-0000-0001-0004-000000000001',
    'Azurescens (Standard)',
    '10000000-0000-0000-0006-000000000003',
    'Psilocybe azurescens',
    'advanced',
    180, 365, -- 6-12 months outdoor colonization
    30, 60,   -- fruiting window (fall months)
    18, 7,    -- col at 18°C, fruit at 7°C
    E'OUTDOOR ONLY. Most potent Psilocybe. ' ||
    E'Alder wood chips. Shaded bed. Plant spring, fruit fall. ' ||
    E'Requires cold temps to fruit (<10°C). Associated with WLP.',
    NULL
  ),
  
  -- Psilocybe cyanescens strains
  (
    '10000000-0000-0001-0005-000000000001',
    'Wavy Cap (Standard)',
    '10000000-0000-0000-0006-000000000008',
    'Psilocybe cyanescens',
    'advanced',
    120, 180, -- 4-6 months outdoor colonization
    30, 60,
    20, 13,   -- col at 20°C, fruit at 13°C
    E'OUTDOOR wood chip beds. Very potent. ' ||
    E'Spreads aggressively in mulch. Fruits fall-winter. ' ||
    E'Cold temps required (10-18°C). Associated with WLP.',
    NULL
  ),
  
  -- Gymnopilus aeruginosus
  (
    '10000000-0000-0001-0006-000000000001',
    'Blue Gym (Standard)',
    '10000000-0000-0000-0003-000000000001',
    'Gymnopilus aeruginosus',
    'advanced',
    28, 56,
    14, 28,
    21, 18,
    E'Wood-based substrate. Hardwood chips/sawdust. ' ||
    E'Slow colonization. Moderate potency. Bitter taste. ' ||
    E'Blue-green staining characteristic.',
    NULL
  ),

  -- Gymnopilus luteofolius
  (
    '10000000-0000-0001-0006-000000000002',
    'Yellow-gilled Gym',
    '10000000-0000-0000-0003-000000000002',
    'Gymnopilus luteofolius',
    'advanced',
    28, 42,
    14, 28,
    21, 18,
    E'Laughing Gym strain. Hardwood substrate. ' ||
    E'Cool fruiting temps. Known for euphoric effects. ' ||
    E'Low-moderate potency. Very bitter.',
    NULL
  )
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
-- Research Species Seed Data A-M Applied Successfully!
--
-- SUMMARY:
-- 
-- SPECIES ADDED (by genus):
-- - Amanita: 2 species (mycorrhizal - not cultivatable)
-- - Conocybe: 3 species (limited cultivation data)
-- - Galerina: 1 species (DEADLY - for differentiation only)
-- - Gymnopilus: 5 species (wood-loving, moderate cultivation)
-- - Inocybe: 1 species (mycorrhizal - not cultivatable)
-- - Panaeolus: 4 species (dung-loving, established cultivation)
-- - Psilocybe A-M: 13 species (various substrates and methods)
--
-- TOTAL: 29 Species
--
-- STRAINS ADDED: 12
-- - Pan cyan variants (Hawaiian, Aussie, Jamaica, TTBVI)
-- - P. mexicana sclerotia strains
-- - P. tampanensis (Philosopher's Stones)
-- - P. azurescens outdoor
-- - P. cyanescens outdoor
-- - Gymnopilus strains
--
-- NOTE: Part 2 (N-Z) will include:
-- - Psilocybe N-Z (natalensis, ovoideocystidiata, semilanceata, tampanensis, etc.)
-- - Pluteus (P. salicinus)
-- - Additional P. cubensis strains
-- ============================================================================