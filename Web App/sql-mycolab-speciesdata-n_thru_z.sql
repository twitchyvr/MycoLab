-- ============================================================================
-- MYCOLAB RESEARCH SPECIES SEED DATA - N through Z (Alphabetical)
-- ============================================================================
-- Idempotent - Safe to run multiple times
-- Run this AFTER supabase-schema.sql AND mycolab-research-species-A-M.sql
-- ============================================================================
--
-- SCOPE: Research/Psychoactive mushroom species, names beginning N-Z
-- Continuation of A-M species seed file.
--
-- GENERA COVERED:
-- - Psilocybe N-Z (P. natalensis, P. ovoideocystidiata, P. semilanceata,
--                 P. subaeruginosa, P. tampanensis, P. weraroa, etc.)
-- - Pluteus (P. salicinus - Willow Shield)
--
-- TEMPERATURE UNITS: Celsius (matching scientific literature)
-- HUMIDITY: Percentage (%)
--
-- DATA CONFIDENCE RATINGS:
-- - "well_documented": Multiple peer-reviewed or reputable sources agree
-- - "community_consensus": Widely accepted in cultivation community
-- - "limited_reports": Some grower reports, not widely verified
-- - "theoretical": Based on related species or habitat extrapolation
-- - "not_domesticated": Wild harvest only, cultivation not established
-- - "grassland_specialist": Requires specific grass/soil symbiosis
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
BEGIN
  RAISE NOTICE '[Species N-Z] Starting pre-flight checks...';

  -- Remove any species from OTHER seed files that would conflict with our IDs
  -- This file uses IDs starting with '10000000-0000-0000-0003-...' to avoid conflicts
  WITH conflicts AS (
    SELECT s.id, s.name, s.scientific_name
    FROM species s
    WHERE s.user_id IS NULL
      AND s.id NOT LIKE '10000000-0000-0000-0003-%'  -- Not our IDs
      AND (
        s.scientific_name IN (
          'Psilocybe natalensis', 'Psilocybe niveotropicalis', 'Psilocybe ovoideocystidiata',
          'Psilocybe semilanceata', 'Psilocybe strictipes', 'Psilocybe stuntzii',
          'Psilocybe subaeruginosa', 'Psilocybe tampanensis', 'Psilocybe weraroa',
          'Psilocybe zapotecorum', 'Pluteus salicinus'
        )
      )
  ),
  deleted AS (
    DELETE FROM species WHERE id IN (SELECT id FROM conflicts) RETURNING id
  )
  SELECT COUNT(*) INTO v_conflict_count FROM deleted;

  IF v_conflict_count > 0 THEN
    RAISE NOTICE '[Species N-Z] Removed % conflicting entries from other seed files', v_conflict_count;
  END IF;

  RAISE NOTICE '[Species N-Z] Pre-flight checks complete';
END $$;

-- ============================================================================
-- SECTION 1: PSILOCYBE N-Z SPECIES
-- ============================================================================

INSERT INTO species (
  id, name, scientific_name, common_names, category, notes, user_id
)
VALUES
  -- Psilocybe natalensis
  (
    '10000000-0000-0000-0003-000000000001',
    'Natal Super Strength',
    'Psilocybe natalensis',
    ARRAY['Nats', 'South African Psilocybe', 'P. natalensis'],
    'research',
    E'SUBTROPICAL DUNG-LOVING SPECIES - BEGINNER FRIENDLY\n\n' ||
    E'South African species discovered in KwaZulu-Natal province.\n' ||
    E'Closely related to P. cubensis but considered more potent.\n' ||
    E'Produces large, fleshy fruiting bodies with aggressive colonization.\n\n' ||
    E'HABITAT: Subtropical grasslands, dung-enriched soils (South Africa).\n\n' ||
    E'CULTIVATION PARAMETERS:\n' ||
    E'- Difficulty: Beginner (similar to cubensis)\n' ||
    E'- Colonization Temp: 24-30°C (optimal 27°C) - slightly warmer than cubensis\n' ||
    E'- Fruiting Temp: 21-26°C (optimal 23°C)\n' ||
    E'- Humidity: 85-95% (optimal 90%)\n' ||
    E'- Colonization Time: 10-21 days (fast colonizer)\n' ||
    E'- Fruiting Time: 5-10 days pins to harvest\n' ||
    E'- Yield: High\n\n' ||
    E'SUBSTRATES:\n' ||
    E'- Excellent: Rye grain, BRF, WBS, coco coir, vermiculite, manure-based\n' ||
    E'- Good: Straw, gypsum (2-5% supplement)\n\n' ||
    E'NOTES:\n' ||
    E'- Often confused with P. cubensis\n' ||
    E'- May produce larger individual fruits\n' ||
    E'- Aggressive colonizer with good contamination resistance\n' ||
    E'- Standard cubensis tek works well\n\n' ||
    E'DATA CONFIDENCE: community_consensus',
    NULL
  ),

  -- Psilocybe niveotropicalis
  (
    '10000000-0000-0000-0003-000000000002',
    'Snow White Tropical',
    'Psilocybe niveotropicalis',
    ARRAY['Niveotropicalis', 'Florida Wood-lover'],
    'research',
    E'TROPICAL WOOD-LOVING SPECIES - LIMITED DATA\n\n' ||
    E'Described in April 2019, found by Scott Ostuni in Jupiter, Florida.\n' ||
    E'Grows in irrigated decaying wood mulch beds.\n\n' ||
    E'HABITAT: Wood mulch, decaying wood debris (Florida, USA).\n\n' ||
    E'CULTIVATION PARAMETERS:\n' ||
    E'- Difficulty: Intermediate\n' ||
    E'- Limited published cultivation data\n' ||
    E'- Likely similar to other wood-loving Psilocybe\n\n' ||
    E'SUBSTRATES:\n' ||
    E'- Theoretical: Hardwood chips, wood mulch, supplemented sawdust\n\n' ||
    E'DATA CONFIDENCE: limited_reports',
    NULL
  ),

  -- Psilocybe ovoideocystidiata
  (
    '10000000-0000-0000-0003-000000000003',
    'Ovoids',
    'Psilocybe ovoideocystidiata',
    ARRAY['Ovoid', 'River Teacher', 'P. ovoid', 'Ovoideocystidiata'],
    'research',
    E'EASTERN US WOOD-LOVER - INTERMEDIATE DIFFICULTY\n\n' ||
    E'Formally described 2003 by Richard Gaines in Montgomery County, Pennsylvania.\n' ||
    E'Previously mistaken for P. caerulipes. Named for distinctive ovoid-shaped cystidia.\n' ||
    E'Human-assisted spread via landscaping wood chips.\n\n' ||
    E'HABITAT:\n' ||
    E'- Native: Eastern US (Pennsylvania, Ohio, Maryland, West Virginia, New York)\n' ||
    E'- Expanded: Pacific Northwest, Western US, Europe (Switzerland, Germany)\n' ||
    E'- Substrate: Woody debris near rivers/streams, wood chips, urban mulch\n' ||
    E'- Does NOT grow directly on dung\n\n' ||
    E'CULTIVATION PARAMETERS:\n' ||
    E'- Difficulty: Intermediate\n' ||
    E'- Colonization Temp: 15-24°C (room temp acceptable)\n' ||
    E'- Cold Shock Trigger: ~10°C (50°F) for 1 week to initiate pinning\n' ||
    E'- Fruiting Temp: 10-19°C (raise to 19°C/65°F after cold shock)\n' ||
    E'- Humidity: 85-95% (optimal 90%)\n' ||
    E'- Colonization Time: ~30 days (1 month typical)\n' ||
    E'- Outdoor Season: April to mid-June (occasionally to November)\n' ||
    E'- Yield: Moderate\n\n' ||
    E'SUBSTRATES:\n' ||
    E'- Excellent: Hardwood chips (alder, oak, beech, birch), hardwood sawdust\n' ||
    E'- Good: Wood pellets, coco coir, river sand (mimics floodplain)\n' ||
    E'- Moderate: Potting soil, straw, cardboard\n\n' ||
    E'SPECIAL TECHNIQUES:\n' ||
    E'- Frozen Mycelium Method: Freeze colonized substrate, thaw, case with sandy mud\n' ||
    E'- Outdoor beds preferred: Wood chip beds can fruit for years\n' ||
    E'- More contamination resistant than cubensis\n\n' ||
    E'POTENCY:\n' ||
    E'- Psilocybin: 0.4-0.6% dry weight (moderate-high for size)\n' ||
    E'- Psilocin: Usually present, variable\n' ||
    E'- Baeocystin: Low concentrations\n' ||
    E'- Effects: Clear, visual, less body load than cubensis\n\n' ||
    E'DATA CONFIDENCE: well_documented',
    NULL
  ),

  -- Psilocybe semilanceata
  (
    '10000000-0000-0000-0003-000000000004',
    'Liberty Cap',
    'Psilocybe semilanceata',
    ARRAY['Libs', 'Magic Mushroom', 'Pixie Cap', 'Witchs Hat'],
    'research',
    E'⚠️ GRASSLAND SPECIALIST - ESSENTIALLY IMPOSSIBLE TO CULTIVATE ⚠️\n\n' ||
    E'The most widely distributed psilocybin mushroom in the world.\n' ||
    E'Described 1838 by Elias Magnus Fries. Type species for genus Psilocybe.\n' ||
    E'Iconic conical cap with distinctive nipple (papilla).\n\n' ||
    E'HABITAT:\n' ||
    E'- Distribution: Throughout Europe, Pacific Northwest US/Canada, Central Asia,\n' ||
    E'  New Zealand, Chile - most widespread psilocybin species globally\n' ||
    E'- Environment: Upland pastures, meadows, acidic grasslands (pH 4.0-6.0)\n' ||
    E'- Substrate: Saprobic on decaying grass roots (Agrostis tenuis, Poa annua, Lolium)\n' ||
    E'- Soil: Acidic, organic carbon 5-15%\n' ||
    E'- Does NOT grow directly on dung (but favors grazed pastures)\n\n' ||
    E'CULTIVATION STATUS: ESSENTIALLY IMPOSSIBLE\n' ||
    E'- Requires complex symbiotic relationship with specific grasses\n' ||
    E'- Specific ecological niche extremely difficult to replicate\n' ||
    E'- Indoor attempts rarely succeed, yields notoriously low\n' ||
    E'- Experienced cultivators describe as "impossible to do"\n' ||
    E'- Most turn to other Psilocybe species\n' ||
    E'- Only viable approach: Outdoor inoculation of natural pastures\n\n' ||
    E'FRUITING PARAMETERS (Wild):\n' ||
    E'- Season: September-November (autumn), occasionally July or spring\n' ||
    E'- Temperature: 5-15°C (cool conditions)\n' ||
    E'- May form sclerotia as wildfire/stress protection\n\n' ||
    E'POTENCY - ONE OF THE MOST POTENT:\n' ||
    E'- Psilocybin: 0.8-1.8% dry weight (typically 1.0-1.2%)\n' ||
    E'- Psilocin: Usually absent or very low\n' ||
    E'- Baeocystin: Present\n' ||
    E'- Effects: Clear-headed, cerebral, highly visual, less body load\n\n' ||
    E'⚠️ DANGEROUS LOOKALIKES:\n' ||
    E'- Galerina marginata: DEADLY (amatoxins) - brown spores, ring, grows on wood\n' ||
    E'- Cortinarius rubellus: DEADLY (orellanine) - causes kidney failure\n' ||
    E'- Panaeolina foenisecii: Non-toxic but not psychoactive\n' ||
    E'- Psathyrella species: Generally non-toxic\n\n' ||
    E'DATA CONFIDENCE: well_documented (wild), not_domesticated (cultivation)',
    NULL
  ),

  -- Psilocybe subaeruginosa
  (
    '10000000-0000-0000-0003-000000000005',
    'Subs',
    'Psilocybe subaeruginosa',
    ARRAY['Golden Tops', 'Australian Psilocybe', 'Subaeruginosa'],
    'research',
    E'AUSTRALIAN WOOD-LOVER - EXTREMELY POTENT\n\n' ||
    E'Described 1927 by John Burton Cleland from Australia.\n' ||
    E'Name: Latin aeruginosa = copper rust/verdigris (blue-green bruising).\n' ||
    E'Possibly the most potent naturally occurring psilocybin mushroom.\n\n' ||
    E'HABITAT:\n' ||
    E'- Native: Australia (Victoria, Tasmania, South Australia, NSW), New Zealand\n' ||
    E'- Environment: Eucalyptus forests, pine plantations, urban parks/gardens\n' ||
    E'- Substrate: Wood chips, mulch, woody debris, occasionally dung\n' ||
    E'- Earliest collection: June 1915, NSW\n\n' ||
    E'CULTIVATION PARAMETERS:\n' ||
    E'- Difficulty: Intermediate\n' ||
    E'- Colonization Temp: 20-30°C (68-75°F, can tolerate up to 30°C)\n' ||
    E'- Cold Shock Trigger: ~10°C (50°F) for 1 week initiates pinning\n' ||
    E'- Fruiting Temp: 10-20°C (50-68°F) - raise to 19°C after cold shock\n' ||
    E'- Humidity: 85-95% (consistent high humidity)\n' ||
    E'- Outdoor Season: April-August (Southern Hemisphere autumn-winter, peak May-July)\n' ||
    E'- Yield: Moderate\n\n' ||
    E'SUBSTRATES:\n' ||
    E'- Excellent: Eucalyptus chips (native), hardwood chips (alder, oak)\n' ||
    E'- Good: Pine chips, cardboard, burlap, wood pellets\n' ||
    E'- Moderate: Straw\n\n' ||
    E'CULTIVATION NOTES:\n' ||
    E'- Outdoor cultivation preferred - wood chip beds can fruit for years\n' ||
    E'- Similar techniques to P. azurescens, P. cyanescens, Stropharia rugosoannulata\n' ||
    E'- Slower than cubensis, outdoor establishment can take months\n\n' ||
    E'POTENCY - EXTREMELY HIGH:\n' ||
    E'- Psilocybin: 0.06-1.93% dry weight (highest recorded 1.93%!)\n' ||
    E'- Psilocin: 0.0-0.17%\n' ||
    E'- Multiple indole alkaloids present\n' ||
    E'- Potency highly variable by substrate (wood chip specimens particularly strong)\n' ||
    E'- Effects: Intense, highly visual\n' ||
    E'- ⚠️ Woodlover Paralysis (WLP) possible\n\n' ||
    E'⚠️ DANGEROUS LOOKALIKES:\n' ||
    E'- Galerina marginata: DEADLY (amatoxins) - grows on same substrates!\n' ||
    E'- Hebeloma crustuliniforme: Toxic (Poison Pie) - radish odor, clay-brown spores\n\n' ||
    E'DATA CONFIDENCE: well_documented',
    NULL
  ),

  -- Psilocybe tampanensis
  (
    '10000000-0000-0000-0003-000000000006',
    'Philosophers Stones',
    'Psilocybe tampanensis',
    ARRAY['Magic Truffles', 'Tampanensis', 'Psilocybe Truffles'],
    'research',
    E'SCLEROTIA-PRODUCING SPECIES - INTERMEDIATE DIFFICULTY\n\n' ||
    E'Discovered 1977 by Steven Pollock near Tampa, Florida (single specimen).\n' ||
    E'Not found in wild again until 2021 (44 years later!).\n' ||
    E'ALL cultivation derives from original 1977 clone.\n' ||
    E'Paul Stamets developed sclerotia cultivation method in 1980s.\n' ||
    E'Pollock granted US patent 1981 for sclerotia production.\n' ||
    E'Legal in Netherlands as sclerotia (mushrooms banned 2008).\n\n' ||
    E'HABITAT:\n' ||
    E'- Extremely rare in wild\n' ||
    E'- Sandy meadows, deciduous forests (Florida, Mississippi)\n' ||
    E'- Saprobic\n' ||
    E'- Forms sclerotia (truffles) as protection from wildfires/disasters\n\n' ||
    E'CULTIVATION - SCLEROTIA PRODUCTION (Primary Method):\n' ||
    E'- Difficulty: Intermediate\n' ||
    E'- Substrate Recipe: 10 parts grass seed : 5 parts water (2:1 ratio)\n' ||
    E'- Sterilization: Pressure cook 1 hour at 15 psi\n' ||
    E'- Inoculation: Spore syringe or agar culture\n' ||
    E'- Colonization Temp: 21-25°C (70-77°F), dark\n' ||
    E'- Colonization Time: 2-4 weeks\n' ||
    E'- IMPORTANT: Shake jars periodically during colonization\n' ||
    E'- After full colonization: STOP shaking, leave completely undisturbed\n' ||
    E'- Sclerotia Formation: 3-4 months MINIMUM (patience critical!)\n' ||
    E'- Optimal Harvest: 4-8 months (up to 12 months for larger stones)\n' ||
    E'- Storage: Refrigerate 2-5°C in airtight containers (6-12 months)\n\n' ||
    E'SUBSTRATES FOR SCLEROTIA:\n' ||
    E'- Excellent: Grass seed (preferred), rye grain\n' ||
    E'- Good: Wild bird seed, straw\n\n' ||
    E'CULTIVATION - MUSHROOM FRUITING (Alternative):\n' ||
    E'- After colonization: Add casing layer (peat, vermiculite, calcium carbonate) 1-1.5cm\n' ||
    E'- Fruiting Temp: 20°C+\n' ||
    E'- Humidity: 95%\n' ||
    E'- Fresh air and indirect light\n\n' ||
    E'POTENCY:\n' ||
    E'- Sclerotia Psilocybin: 0.31-0.68% dry weight (substrate-dependent)\n' ||
    E'- Mushroom Psilocybin: Up to 1.0% dry weight\n' ||
    E'- Moderately to highly active\n' ||
    E'- Taste: Somewhat bitter, walnut-like, tart and nutty\n\n' ||
    E'DATA CONFIDENCE: well_documented',
    NULL
  ),

  -- Psilocybe weraroa
  (
    '10000000-0000-0000-0003-000000000007',
    'Blue Secotioid',
    'Psilocybe weraroa',
    ARRAY['Weraroa', 'Pouch Fungus', 'NZ Pouch'],
    'research',
    E'⚠️ NEW ZEALAND ENDEMIC - EXPERT ONLY / VERY DIFFICULT ⚠️\n\n' ||
    E'Unique secotioid (pouch-like) fungus endemic to New Zealand.\n' ||
    E'Formerly Weraroa novae-zelandiae. Reclassified to Psilocybe 2011.\n' ||
    E'Unlike typical mushrooms, cap remains closed encasing gills.\n' ||
    E'Closely related to P. cyanescens and P. subaeruginosa despite unusual form.\n' ||
    E'First described 1924 by Gordon Cunningham.\n' ||
    E'Being commercially cultivated by Rua Bioscience for medical research.\n\n' ||
    E'HABITAT:\n' ||
    E'- Endemic: New Zealand native forests only\n' ||
    E'- Substrate: Decaying wood buried in leaf litter, rotting branches\n' ||
    E'- Host trees: Mahoe (Melicytus ramiflorus), kahikatea, kohekohe, kawakawa,\n' ||
    E'  pine, tree fern fronds (ponga)\n' ||
    E'- Often near streams\n' ||
    E'- Most common in Wellington region\n' ||
    E'- Fruits year-round\n\n' ||
    E'CULTIVATION STATUS: EXTREMELY CHALLENGING\n' ||
    E'- Difficulty: Expert - one of the most difficult\n' ||
    E'- Highly specific environmental requirements\n' ||
    E'- Spore prints IMPOSSIBLE due to secotioid structure\n' ||
    E'- Propagation: Tissue cloning via agar plates only\n' ||
    E'- Success rates very low even for experienced cultivators\n\n' ||
    E'CULTIVATION PARAMETERS (Theoretical):\n' ||
    E'- Colonization Temp: 15-22°C (cool temperate)\n' ||
    E'- Fruiting Temp: 10-18°C (optimal ~14°C)\n' ||
    E'- Humidity: 85-95%\n' ||
    E'- Light: Low (fruits buried in leaf litter naturally)\n' ||
    E'- Best approach: Outdoor cultivation with native wood chips and shade\n\n' ||
    E'SUBSTRATES:\n' ||
    E'- Excellent: Well-decayed NZ native hardwood (tawa, mahoe preferred)\n' ||
    E'- Good: Decayed hardwood chips, tree fern fronds, lignin-rich mulch\n' ||
    E'- Incompatible: Fresh sawdust, standard cultivation substrates\n' ||
    E'- Requires WELL-ROTTED wood, not fresh\n\n' ||
    E'POTENCY (Estimated):\n' ||
    E'- Similar to P. cyanescens complex\n' ||
    E'- Psilocybin: 0.16-0.85% estimated\n' ||
    E'- Psilocin: 0.03-0.60% estimated\n' ||
    E'- Limited empirical data available\n\n' ||
    E'ECOLOGY NOTES:\n' ||
    E'- Indicator species for healthy forest regeneration\n' ||
    E'- Depends on slugs/birds for spore dispersal (doesnt drop spores)\n' ||
    E'- Evolved pouch shape possibly to be eaten by extinct moa\n\n' ||
    E'⚠️ LOOKALIKES:\n' ||
    E'- Cortinarius species (secotioid): May contain deadly orellanine, no blue bruising\n' ||
    E'- Clavogaster virescens: Naturally blue-green (NOT from bruising), non-psychoactive\n' ||
    E'- Scleroderma: Hard peridium, toxic, no blue bruising\n\n' ||
    E'DATA CONFIDENCE: limited_reports (cultivation), community_consensus (wild)',
    NULL
  )
ON CONFLICT (name) DO UPDATE SET
  scientific_name = EXCLUDED.scientific_name,
  common_names = EXCLUDED.common_names,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes;


-- ============================================================================
-- SECTION 2: PLUTEUS (Psilocybin-containing, non-Psilocybe genus)
-- ============================================================================

INSERT INTO species (
  id, name, scientific_name, common_names, category, notes, user_id
)
VALUES
  -- Pluteus salicinus
  (
    '10000000-0000-0000-0004-000000000001',
    'Willow Shield',
    'Pluteus salicinus',
    ARRAY['Pluteus salicinus', 'Gray Dragon Mushroom'],
    'research',
    E'⚠️ WOOD-LOVER - EXPERT ONLY / VERY DIFFICULT ⚠️\n\n' ||
    E'Wood-rotting psychoactive species OUTSIDE Psilocybe genus.\n' ||
    E'Described 1798 by Persoon, transferred to Pluteus by Kummer 1871.\n' ||
    E'Contains psilocybin acquired via horizontal gene transfer - unrelated to Psilocybe!\n' ||
    E'Distinctive gray to bluish cap with PINK spore print.\n' ||
    E'Free gills distinguish from Psilocybe.\n\n' ||
    E'HABITAT:\n' ||
    E'- Distribution: Europe, North America, Russia\n' ||
    E'- Substrate: Decaying hardwood stumps and logs\n' ||
    E'- Host trees: Willow (Salix) especially, poplar, alder, beech\n' ||
    E'- Environment: Moist deciduous forests, lowland to montane (up to 1200m)\n' ||
    E'- Season: Early summer through late autumn\n\n' ||
    E'CULTIVATION STATUS: EXTREMELY DIFFICULT\n' ||
    E'- Difficulty: Expert\n' ||
    E'- Requires VERY well-decayed wood - does not colonize fresh substrates!\n' ||
    E'- Limited cultivation attempts documented\n' ||
    E'- One reference: P. cervinus (related) fruited on exhausted shiitake blocks\n\n' ||
    E'CULTIVATION PARAMETERS (Theoretical):\n' ||
    E'- Colonization Temp: 15-22°C\n' ||
    E'- Fruiting Temp: 12-20°C\n' ||
    E'- Humidity: 80-95%\n\n' ||
    E'SUBSTRATES:\n' ||
    E'- Excellent: Well-decayed willow wood, poplar, alder, beech\n' ||
    E'- Experimental: Exhausted shiitake blocks\n' ||
    E'- Incompatible: Fresh sawdust, standard grain spawn\n' ||
    E'- KEY: Must be WELL-ROTTED wood\n\n' ||
    E'POTENCY - HIGHLY VARIABLE:\n' ||
    E'- Psilocybin: 0.05-0.35% dry weight\n' ||
    E'  - Stijve & Kuyper 1985: 0.05-0.25%\n' ||
    E'  - Christiansen 1984: 0.35%\n' ||
    E'- Psilocin: Usually absent or trace (0-0.02%)\n' ||
    E'- Baeocystin: 0-0.008%\n' ||
    E'- Singer recognized non-bluing variety (var. achloes) possibly lacking psilocybin\n' ||
    E'- Potency varies significantly by region!\n\n' ||
    E'IDENTIFICATION:\n' ||
    E'- Cap: 2-7cm, gray to bluish-gray, scales near center\n' ||
    E'- Gills: FREE (not attached), pink at maturity\n' ||
    E'- Stem: White with grayish-green to bluish-green tones at base\n' ||
    E'- Spore print: PINK (key identifier)\n' ||
    E'- Blue bruising: Variable (not all specimens blue)\n\n' ||
    E'DATA CONFIDENCE: limited_reports',
    NULL
  )
ON CONFLICT (name) DO UPDATE SET
  scientific_name = EXCLUDED.scientific_name,
  common_names = EXCLUDED.common_names,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes;


-- ============================================================================
-- SUMMARY
-- ============================================================================
--
-- Species added in this file (N-Z):
--
-- Psilocybe species:
-- 1. P. natalensis - Natal Super Strength (beginner, subtropical dung-lover)
-- 2. P. niveotropicalis - Snow White Tropical (limited data, FL wood-lover)
-- 3. P. ovoideocystidiata - Ovoids (intermediate, Eastern US wood-lover)
-- 4. P. semilanceata - Liberty Cap (UNCULTIVABLE, grassland specialist)
-- 5. P. subaeruginosa - Subs (intermediate, Australian, extremely potent)
-- 6. P. tampanensis - Philosopher's Stones (intermediate, sclerotia producer)
-- 7. P. weraroa - Blue Secotioid (expert, NZ endemic pouch fungus)
--
-- Other genera:
-- 8. Pluteus salicinus - Willow Shield (expert, wood-lover, variable potency)
--
-- Total: 8 species
-- Combined with A-M file: 29 + 8 = 37+ species total
--
-- ============================================================================