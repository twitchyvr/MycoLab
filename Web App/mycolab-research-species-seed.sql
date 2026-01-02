-- ============================================================================
-- SPORELY RESEARCH SPECIES SEED DATA (Idempotent - Safe to run multiple times)
-- Run this AFTER supabase-schema.sql to populate research species data
-- ============================================================================
--
-- FOCUS: Psilocybe cubensis and variants with comprehensive indoor cultivation
-- parameters. This file contains detailed stage-by-stage growing data with
-- confidence ratings based on community consensus and documentation quality.
--
-- TEMPERATURE UNITS: Fahrenheit (matching existing schema data)
-- Users can toggle display units in app settings.
--
-- DATA CONFIDENCE RATINGS (embedded in JSONB):
-- - "well_documented": Multiple reliable sources agree
-- - "community_consensus": Widely accepted in growing community
-- - "limited_reports": Some grower reports but not widely verified
-- - "theoretical": Based on related species or extrapolation
-- - "insufficient_data": Cannot find reliable information
--
-- SPECIES STRUCTURE:
-- 1. P. cubensis (baseline) - Standard parameters, most strains follow this
-- 2. P. cubensis var. Penis Envy - Notably slower, unique harvest indicators
-- 3. P. cubensis var. Albino Penis Envy - Even slower, higher contam risk
-- 4. P. cubensis var. Enigma - Blob mutation, completely different approach
-- 5. P. ovoideocystidiata - Wood-loving, cooler temps, cold shock required
--
-- STRAINS: Variants that follow baseline parameters are added as strains
-- ============================================================================

-- Enable UUID extension (should already exist from schema)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- RESEARCH SPECIES - Psilocybe cubensis and variants
-- ============================================================================

-- ============================================================================
-- PRE-FLIGHT: Handle existing data conflicts before index creation
-- This ensures the file can run regardless of what data already exists
-- ============================================================================
DO $$
DECLARE
  v_dup_count INTEGER;
BEGIN
  RAISE NOTICE '[Research Species] Starting pre-flight checks...';

  -- Check for duplicate scientific_name values that would prevent index creation
  SELECT COUNT(*) INTO v_dup_count
  FROM (
    SELECT scientific_name, COUNT(*) as cnt
    FROM species
    WHERE user_id IS NULL
      AND category = 'research'
      AND scientific_name IS NOT NULL
    GROUP BY scientific_name
    HAVING COUNT(*) > 1
  ) dups;

  IF v_dup_count > 0 THEN
    RAISE NOTICE '[Research Species] Found % duplicate scientific_name groups, deduplicating...', v_dup_count;

    -- First, delete any strains that reference species we're about to delete
    -- This handles foreign key constraints properly
    DELETE FROM strains
    WHERE species_id IN (
      SELECT s1.id FROM species s1
      WHERE s1.user_id IS NULL
        AND s1.category = 'research'
        AND s1.scientific_name IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM species s2
          WHERE s2.scientific_name = s1.scientific_name
            AND s2.user_id IS NULL
            AND s2.category = 'research'
            AND (s2.updated_at > s1.updated_at OR (s2.updated_at = s1.updated_at AND s2.id > s1.id))
        )
    );
    RAISE NOTICE '[Research Species] Deleted dependent strains for duplicate species';

    -- Now delete the duplicate species (keeping the most recent)
    DELETE FROM species s1
    WHERE user_id IS NULL
      AND category = 'research'
      AND scientific_name IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM species s2
        WHERE s2.scientific_name = s1.scientific_name
          AND s2.user_id IS NULL
          AND s2.category = 'research'
          AND (s2.updated_at > s1.updated_at OR (s2.updated_at = s1.updated_at AND s2.id > s1.id))
      );

    RAISE NOTICE '[Research Species] Deduplication complete';
  END IF;

  RAISE NOTICE '[Research Species] Pre-flight checks complete';
END $$;

-- Create partial unique index for global research species (user_id IS NULL)
-- This allows ON CONFLICT to work for seed data
-- Wrapped in exception handling for idempotent execution
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS species_scientific_name_global_unique
  ON species (scientific_name) WHERE user_id IS NULL AND category = 'research';
  RAISE NOTICE '[Research Species] Created/verified unique index on scientific_name';
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE '[Research Species] Index already exists';
  WHEN OTHERS THEN
    RAISE WARNING '[Research Species] Could not create scientific_name index: %', SQLERRM;
END $$;

-- ============================================================================
-- HELPER FUNCTION: Robust species upsert that handles multiple unique constraints
-- This ensures idempotent behavior regardless of which constraint would be violated
-- ============================================================================
CREATE OR REPLACE FUNCTION upsert_research_species(
  p_name TEXT,
  p_scientific_name TEXT,
  p_common_names TEXT[],
  p_difficulty TEXT,
  p_spawn_colonization JSONB,
  p_bulk_colonization JSONB,
  p_pinning JSONB,
  p_maturation JSONB,
  p_preferred_substrates TEXT[],
  p_substrate_notes TEXT,
  p_characteristics TEXT,
  p_community_tips TEXT,
  p_important_facts TEXT,
  p_typical_yield TEXT,
  p_flush_count TEXT,
  p_shelf_life_days_min INTEGER,
  p_shelf_life_days_max INTEGER,
  p_automation_config JSONB,
  p_spawn_colonization_notes TEXT,
  p_bulk_colonization_notes TEXT,
  p_pinning_notes TEXT,
  p_maturation_notes TEXT,
  p_notes TEXT
) RETURNS UUID AS $$
DECLARE
  v_existing_id UUID;
  v_result_id UUID;
BEGIN
  -- First, check if a record exists by scientific_name (primary identifier for research species)
  SELECT id INTO v_existing_id
  FROM species
  WHERE scientific_name = p_scientific_name
    AND user_id IS NULL
    AND category = 'research'
  LIMIT 1;

  -- If not found by scientific_name, check by name
  IF v_existing_id IS NULL THEN
    SELECT id INTO v_existing_id
    FROM species
    WHERE name = p_name
      AND user_id IS NULL
    LIMIT 1;
  END IF;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing record
    UPDATE species SET
      name = p_name,
      scientific_name = p_scientific_name,
      common_names = p_common_names,
      category = 'research',
      difficulty = p_difficulty,
      spawn_colonization = p_spawn_colonization,
      bulk_colonization = p_bulk_colonization,
      pinning = p_pinning,
      maturation = p_maturation,
      preferred_substrates = p_preferred_substrates,
      substrate_notes = p_substrate_notes,
      characteristics = p_characteristics,
      community_tips = p_community_tips,
      important_facts = p_important_facts,
      typical_yield = p_typical_yield,
      flush_count = p_flush_count,
      shelf_life_days_min = p_shelf_life_days_min,
      shelf_life_days_max = p_shelf_life_days_max,
      automation_config = p_automation_config,
      spawn_colonization_notes = p_spawn_colonization_notes,
      bulk_colonization_notes = p_bulk_colonization_notes,
      pinning_notes = p_pinning_notes,
      maturation_notes = p_maturation_notes,
      notes = p_notes,
      updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING id INTO v_result_id;

    RAISE NOTICE '[Research Species] Updated: %', p_name;
  ELSE
    -- Insert new record
    INSERT INTO species (
      name, scientific_name, common_names, category, difficulty,
      spawn_colonization, bulk_colonization, pinning, maturation,
      preferred_substrates, substrate_notes, characteristics,
      community_tips, important_facts, typical_yield, flush_count,
      shelf_life_days_min, shelf_life_days_max,
      automation_config, spawn_colonization_notes, bulk_colonization_notes,
      pinning_notes, maturation_notes, notes, user_id
    ) VALUES (
      p_name, p_scientific_name, p_common_names, 'research', p_difficulty,
      p_spawn_colonization, p_bulk_colonization, p_pinning, p_maturation,
      p_preferred_substrates, p_substrate_notes, p_characteristics,
      p_community_tips, p_important_facts, p_typical_yield, p_flush_count,
      p_shelf_life_days_min, p_shelf_life_days_max,
      p_automation_config, p_spawn_colonization_notes, p_bulk_colonization_notes,
      p_pinning_notes, p_maturation_notes, p_notes, NULL
    )
    RETURNING id INTO v_result_id;

    RAISE NOTICE '[Research Species] Inserted: %', p_name;
  END IF;

  RETURN v_result_id;
EXCEPTION
  WHEN unique_violation THEN
    -- If we still get a unique violation, it's likely a race condition or data inconsistency
    -- Try to clean up and retry once
    RAISE NOTICE '[Research Species] Unique violation for %, attempting cleanup...', p_name;

    -- Delete conflicting records (keep the one we're about to insert)
    DELETE FROM species
    WHERE (name = p_name OR scientific_name = p_scientific_name)
      AND user_id IS NULL
      AND category = 'research';

    -- Insert fresh
    INSERT INTO species (
      name, scientific_name, common_names, category, difficulty,
      spawn_colonization, bulk_colonization, pinning, maturation,
      preferred_substrates, substrate_notes, characteristics,
      community_tips, important_facts, typical_yield, flush_count,
      shelf_life_days_min, shelf_life_days_max,
      automation_config, spawn_colonization_notes, bulk_colonization_notes,
      pinning_notes, maturation_notes, notes, user_id
    ) VALUES (
      p_name, p_scientific_name, p_common_names, 'research', p_difficulty,
      p_spawn_colonization, p_bulk_colonization, p_pinning, p_maturation,
      p_preferred_substrates, p_substrate_notes, p_characteristics,
      p_community_tips, p_important_facts, p_typical_yield, p_flush_count,
      p_shelf_life_days_min, p_shelf_life_days_max,
      p_automation_config, p_spawn_colonization_notes, p_bulk_colonization_notes,
      p_pinning_notes, p_maturation_notes, p_notes, NULL
    )
    RETURNING id INTO v_result_id;

    RAISE NOTICE '[Research Species] Inserted after cleanup: %', p_name;
    RETURN v_result_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION upsert_research_species(TEXT, TEXT, TEXT[], TEXT, JSONB, JSONB, JSONB, JSONB, TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
  RAISE NOTICE '[Research Species] Helper function created and permissions granted';
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE '[Research Species] Role "authenticated" does not exist (OK for local dev)';
END $$;

-- ============================================================================
-- PRE-INSERT CLEANUP: Remove conflicting scientific_names from other sources
-- This handles the case where supabase-species-data.sql or other files
-- inserted the same species with a different name
-- ============================================================================
DO $$
DECLARE
  v_deleted_count INTEGER;
  v_strain_count INTEGER;
BEGIN
  -- First, delete any strains that reference species we're about to delete
  -- This handles foreign key constraints properly
  DELETE FROM strains
  WHERE species_id IN (
    SELECT id FROM species
    WHERE scientific_name IN (
      'Psilocybe cubensis',
      'Psilocybe cubensis var. Penis Envy',
      'Psilocybe cubensis var. Albino Penis Envy',
      'Psilocybe cubensis var. Enigma',
      'Psilocybe cubensis var. Leucistic Teacher',
      'Psilocybe ovoideocystidiata'
    )
    AND user_id IS NULL
  );
  GET DIAGNOSTICS v_strain_count = ROW_COUNT;
  IF v_strain_count > 0 THEN
    RAISE NOTICE '[Research Species] Deleted % dependent strains before species cleanup', v_strain_count;
  END IF;

  -- Now delete any existing research species that would conflict with our inserts
  -- We delete by scientific_name to handle cases where name differs
  WITH deleted AS (
    DELETE FROM species
    WHERE scientific_name IN (
      'Psilocybe cubensis',
      'Psilocybe cubensis var. Penis Envy',
      'Psilocybe cubensis var. Albino Penis Envy',
      'Psilocybe cubensis var. Enigma',
      'Psilocybe cubensis var. Leucistic Teacher',
      'Psilocybe ovoideocystidiata'
    )
    AND user_id IS NULL
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  IF v_deleted_count > 0 THEN
    RAISE NOTICE '[Research Species] Cleaned up % conflicting records before insert', v_deleted_count;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- P. cubensis (Baseline) - Standard cultivation parameters
-- Most strains (Golden Teacher, B+, Mazatapec, etc.) follow these parameters
-- ----------------------------------------------------------------------------
INSERT INTO species (
  name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics,
  community_tips, important_facts, typical_yield, flush_count,
  shelf_life_days_min, shelf_life_days_max,
  automation_config, spawn_colonization_notes, bulk_colonization_notes,
  pinning_notes, maturation_notes, notes, user_id
)
VALUES (
  'Psilocybe cubensis',
  'Psilocybe cubensis',
  ARRAY['Cubes', 'Golden Caps', 'Magic Mushrooms', 'Golden Teacher', 'B+'],
  'research',
  'beginner',
  -- SPAWN COLONIZATION JSONB
  '{
    "tempRange": {
      "min": 70,
      "max": 86,
      "optimal": 77,
      "warningLow": 68,
      "warningHigh": 82,
      "criticalLow": 65,
      "criticalHigh": 90,
      "rampRate": 2
    },
    "humidityRange": {
      "min": null,
      "max": null,
      "optimal": null,
      "notes": "Substrate moisture only - no ambient humidity control needed"
    },
    "co2Range": {
      "min": 0,
      "max": 10000,
      "optimal": 5000,
      "warningHigh": 15000,
      "criticalHigh": 20000,
      "unit": "ppm",
      "tolerance": "high"
    },
    "daysMin": 10,
    "daysMax": 21,
    "daysTypical": 14,
    "lightRequirement": "none",
    "lightSchedule": {
      "photoperiod": 0,
      "intensity": "none",
      "notes": "Darkness acceptable and often preferred"
    },
    "faeFrequency": "minimal",
    "faeNotes": "Gas exchange through micropore tape or filter patch only",
    "transitionCriteria": {
      "minDays": 10,
      "maxDays": 21,
      "typicalDays": 14,
      "colonizationPercent": 100,
      "consolidationDays": 3,
      "visualIndicators": [
        "No visible uncolonized grain",
        "Mycelium appears thick and ropy",
        "Optional: shake at 30% for faster colonization"
      ],
      "autoTransition": false,
      "transitionAlertDays": 2
    },
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Standard grain jars with modified lids (micropore tape or injection port + filter). Quart jars most common.",
    "metabolicHeat": "1-2°F above ambient",
    "dataConfidence": "well_documented"
  }'::jsonb,
  -- BULK COLONIZATION JSONB
  '{
    "tempRange": {
      "min": 70,
      "max": 80,
      "optimal": 75,
      "warningLow": 68,
      "warningHigh": 82,
      "criticalLow": 65,
      "criticalHigh": 85,
      "rampRate": 2
    },
    "humidityRange": {
      "min": null,
      "max": null,
      "optimal": null,
      "notes": "Field capacity substrate - surface conditions matter more than ambient"
    },
    "co2Range": {
      "min": 0,
      "max": 10000,
      "optimal": 5000,
      "warningHigh": 12000,
      "criticalHigh": 18000,
      "unit": "ppm"
    },
    "daysMin": 5,
    "daysMax": 14,
    "daysTypical": 10,
    "lightRequirement": "indirect",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "low",
      "spectrum": "cool",
      "notes": "Ambient room light acceptable"
    },
    "faeFrequency": "minimal",
    "faeNotes": "Keep lid closed or cracked; FAE increases after colonization",
    "spawnRatios": {
      "1:1": {"days": "5-7", "contamRisk": "lowest", "yieldEfficiency": "lower", "notes": "Very fast, recommended for beginners"},
      "1:2": {"days": "7-10", "contamRisk": "low", "yieldEfficiency": "good", "notes": "Common recommendation"},
      "1:3": {"days": "10-14", "contamRisk": "moderate", "yieldEfficiency": "optimal", "notes": "Best efficiency sweet spot"},
      "1:4": {"days": "12-18", "contamRisk": "higher", "yieldEfficiency": "maximum", "notes": "Economy ratio, more risk"}
    },
    "recommendedRatio": "1:2 to 1:3",
    "surfaceConditions": {
      "appearance": "Fine water droplets (morning dew)",
      "problemSigns": ["pooling water", "dry/cracked surface", "overlay"]
    },
    "transitionCriteria": {
      "minDays": 5,
      "maxDays": 14,
      "typicalDays": 10,
      "colonizationPercent": 100,
      "visualIndicators": [
        "Surface fully colonized (70-100%)",
        "Hyphal knots forming",
        "Primordia visible at edges"
      ],
      "autoTransition": true,
      "transitionAlertDays": 2
    },
    "criticalParameters": ["temperature", "surface_conditions"],
    "equipmentNotes": "Monotub (56-66qt) or shoebox (6qt) with unmodified or modified lid",
    "dataConfidence": "well_documented"
  }'::jsonb,
  -- PINNING JSONB
  '{
    "tempRange": {
      "min": 68,
      "max": 78,
      "optimal": 72,
      "warningLow": 65,
      "warningHigh": 80,
      "criticalLow": 60,
      "criticalHigh": 85,
      "rampRate": 2
    },
    "humidityRange": {
      "min": 90,
      "max": 100,
      "optimal": 95,
      "warningLow": 85,
      "warningHigh": 100,
      "criticalLow": 80,
      "criticalHigh": 100,
      "rampRate": 3
    },
    "co2Range": {
      "min": 400,
      "max": 1200,
      "optimal": 800,
      "warningHigh": 2000,
      "criticalHigh": 5000,
      "unit": "ppm"
    },
    "daysMin": 5,
    "daysMax": 14,
    "daysTypical": 7,
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "500-1000 lux",
      "spectrum": "5500-6500K cool white",
      "dawnDuskRamp": 30,
      "notes": "Blue light 440-480nm most effective for pinning"
    },
    "faeFrequency": "4-6x daily or continuous",
    "faeNotes": "1-3 air exchanges per hour; fan 2-3x daily minimum",
    "pinningTriggers": {
      "primary": "Fresh air exchange (FAE)",
      "secondary": ["Surface evaporation", "Light exposure"],
      "minimal_effect": "Temperature drop (not required for tropical species)"
    },
    "temperatureDrop": {
      "required": false,
      "beneficial": true,
      "amount": "2-6°F reduction from colonization",
      "notes": "Helpful but not essential for cubensis"
    },
    "transitionCriteria": {
      "minDays": 5,
      "maxDays": 14,
      "typicalDays": 7,
      "visualIndicators": [
        "Hyphal knots (fuzzy white clusters, day 3-7)",
        "Primordia (defined white bumps, day 5-10)",
        "Fine water droplets on surface",
        "Rhizomorphic rope-like growth"
      ],
      "autoTransition": true,
      "transitionAlertDays": 2
    },
    "criticalParameters": ["humidity", "fae", "co2"],
    "equipmentNotes": "Increase FAE holes or crack lid; maintain surface moisture with misting",
    "healthyPinIndicators": [
      "Multiple primordia across surface",
      "Even distribution (not just edges)",
      "White healthy color",
      "No fuzzy feet (indicates low FAE)"
    ],
    "problemIndicators": [
      "Fuzzy feet (aerial mycelium) = increase FAE",
      "Aborts (dark caps that stop growing) = environmental stress",
      "Side pins = light from sides or microclimate",
      "Overlay = too much moisture, fork tek may help"
    ],
    "dataConfidence": "well_documented"
  }'::jsonb,
  -- MATURATION JSONB
  '{
    "tempRange": {
      "min": 60,
      "max": 80,
      "optimal": 72,
      "warningLow": 58,
      "warningHigh": 82,
      "criticalLow": 55,
      "criticalHigh": 85,
      "rampRate": 2
    },
    "humidityRange": {
      "min": 85,
      "max": 95,
      "optimal": 90,
      "warningLow": 80,
      "warningHigh": 98,
      "criticalLow": 75,
      "criticalHigh": 100,
      "rampRate": 3
    },
    "co2Range": {
      "min": 400,
      "max": 5000,
      "optimal": 1000,
      "warningHigh": 8000,
      "criticalHigh": 12000,
      "unit": "ppm"
    },
    "daysMin": 5,
    "daysMax": 10,
    "daysTypical": 7,
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "medium",
      "spectrum": "cool"
    },
    "faeFrequency": "4-6x daily",
    "harvestIndicators": {
      "ideal": "Veil stretching/about to break",
      "acceptable": "Veil just broken",
      "late": "Cap flattening, gills exposed",
      "too_late": "Cap upturned, sporulation",
      "timing": "12-24 hours between stretching and break"
    },
    "transitionCriteria": {
      "minDays": 5,
      "maxDays": 10,
      "typicalDays": 7,
      "visualIndicators": [
        "Veil stretching",
        "Veil tearing - HARVEST",
        "Caps expanding"
      ],
      "autoTransition": false,
      "transitionAlertDays": 1
    },
    "criticalParameters": ["humidity", "fae"],
    "flushInfo": {
      "typicalFlushes": "3-5",
      "maxFlushes": "6-7",
      "daysBetweenFlushes": "5-8",
      "firstFlushYield": "40-60% of total",
      "secondFlushNotes": "Often produces largest individual fruits",
      "rehydration": {
        "method": "12-24 hour cold water soak",
        "timing": "After each flush"
      }
    },
    "dryingNotes": "Dehydrator at 160°F until cracker dry; or desiccant method",
    "dataConfidence": "well_documented"
  }'::jsonb,
  -- PREFERRED SUBSTRATES
  ARRAY['CVG (Coco Coir/Vermiculite/Gypsum)', 'Coco Coir', 'Manure-based', 'BRF (PF Tek)'],
  -- SUBSTRATE NOTES
  'CVG (60% coir, 30% vermiculite, 10% gypsum) is the standard monotub substrate. Pasteurization adequate for CVG. Manure-based substrates increase yield but also contamination risk. BRF cakes (PF Tek) good for beginners but lower yields. Grain spawn: rye berries (gold standard), whole oats (forgiving), popcorn (easy), wild bird seed (economical).',
  -- CHARACTERISTICS
  'Subtropical/tropical dung-loving species. Most widely cultivated research mushroom. Extremely variable genetics with hundreds of named varieties. Forgiving of environmental fluctuations. Golden-brown caps with purple-black spore print. Pronounced blue bruising reaction.',
  -- COMMUNITY TIPS
  'Modern consensus favors 75-81°F over historically cited 84-86°F for colonization - higher temps dramatically increase contamination risk. Mycelium generates 1-2°F metabolic heat above ambient. FAE is the PRIMARY pinning trigger for cubensis, not temperature drop. Break and shake grain at 30% colonization for faster results. Harvest just before veil breaks for maximum potency.',
  -- IMPORTANT FACTS
  'First flush typically 40-60% of total yield. Second flush often produces largest individual fruits. 3-5 flushes typical with diminishing returns. Spore prints viable for years when stored properly. Genetics degrade over time - isolate and clone best performers. Legal status varies by jurisdiction - federally scheduled in US.',
  -- TYPICAL YIELD
  '1-3 oz (28-85g) dry per quart of spawn across all flushes. First flush average 1 oz (28g) dry.',
  -- FLUSH COUNT
  '3-5 typical, 6-7 maximum',
  -- SHELF LIFE
  7, 14,
  -- AUTOMATION CONFIG
  '{
    "automationTested": true,
    "automationNotes": "Well-suited for automation due to forgiving nature. Temperature and humidity most critical. Standard monotub conditions work well for most strains.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "light", "camera"],
    "controllerTypes": ["inkbird", "ac_infinity", "custom_arduino", "raspberry_pi"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 8,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 180
  }'::jsonb,
  -- SPAWN COLONIZATION NOTES
  'SPAWN COLONIZATION (70-86°F, 10-21 days): Inoculate grain jars with spore syringe, LC, or agar wedge. Optimal temp 75-81°F (77°F ideal). Store in dark, warm location. Minimal FAE needed - gas exchange through micropore tape. Shake at 30% colonization to distribute mycelium and speed up process. Wait for 100% colonization plus 3-7 day consolidation. Watch for contamination - green (trichoderma), black (mold), or bacterial slime indicates failure. Mycelium should appear bright white and ropy.',
  -- BULK COLONIZATION NOTES
  'BULK COLONIZATION (70-80°F, 5-14 days): Mix colonized spawn with field-capacity substrate at 1:2 to 1:3 ratio. Level surface gently - do not compress. Maintain surface conditions with fine water droplets visible (morning dew appearance). Keep lid closed or slightly cracked. Introduce indirect light (12hr cycle). Wait for 70-100% surface colonization before introducing full fruiting conditions. Watch for hyphal knots and primordia at edges signaling readiness for fruiting.',
  -- PINNING NOTES
  'PINNING (68-78°F, 5-14 days): Increase FAE significantly - this is the PRIMARY pinning trigger. Crack or remove lid, fan 4-6x daily or provide continuous passive FAE. Maintain 90-95% humidity with fine misting (avoid pooling). Slight temperature drop (2-6°F) helpful but not required for tropical cubensis. 12hr light cycle at 5500-6500K. CO2 should drop below 1200ppm. Healthy pins are white with defined structure. Fuzzy feet indicate need for more FAE. Aborts (dark pins that stop growing) signal environmental stress.',
  -- MATURATION NOTES
  'MATURATION (60-80°F, 5-10 days): Maintain fruiting conditions. Harvest timing critical - pick just before or as veil breaks for maximum potency. Twist and pull to remove cleanly. Spore drop after veil break is normal but messy and can inhibit future flushes. Dry immediately using dehydrator at 160°F or desiccant until cracker dry. For subsequent flushes, soak substrate 12-24 hours in cold water (dunk method), drain, and return to fruiting conditions. Expect 5-8 days between flushes.',
  -- NOTES
  'Most widely studied and cultivated psilocybin species. Hundreds of named varieties exist with varying characteristics. Most strains follow these baseline parameters. See separate entries for variants with notably different cultivation requirements (Penis Envy, APE, Enigma). Legal status varies by jurisdiction - for microscopy and taxonomy research only where applicable.',
  -- USER_ID (NULL for global/system data)
  NULL
)
ON CONFLICT (name)
DO UPDATE SET
  name = EXCLUDED.name,
  common_names = EXCLUDED.common_names,
  difficulty = EXCLUDED.difficulty,
  spawn_colonization = EXCLUDED.spawn_colonization,
  bulk_colonization = EXCLUDED.bulk_colonization,
  pinning = EXCLUDED.pinning,
  maturation = EXCLUDED.maturation,
  preferred_substrates = EXCLUDED.preferred_substrates,
  substrate_notes = EXCLUDED.substrate_notes,
  characteristics = EXCLUDED.characteristics,
  community_tips = EXCLUDED.community_tips,
  important_facts = EXCLUDED.important_facts,
  typical_yield = EXCLUDED.typical_yield,
  flush_count = EXCLUDED.flush_count,
  shelf_life_days_min = EXCLUDED.shelf_life_days_min,
  shelf_life_days_max = EXCLUDED.shelf_life_days_max,
  automation_config = EXCLUDED.automation_config,
  spawn_colonization_notes = EXCLUDED.spawn_colonization_notes,
  bulk_colonization_notes = EXCLUDED.bulk_colonization_notes,
  pinning_notes = EXCLUDED.pinning_notes,
  maturation_notes = EXCLUDED.maturation_notes,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- ----------------------------------------------------------------------------
-- P. cubensis var. Penis Envy - Notably different cultivation requirements
-- Slower colonization, unique harvest indicators, blob-prone
-- ----------------------------------------------------------------------------
INSERT INTO species (
  name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics,
  community_tips, important_facts, typical_yield, flush_count,
  shelf_life_days_min, shelf_life_days_max,
  automation_config, spawn_colonization_notes, bulk_colonization_notes,
  pinning_notes, maturation_notes, notes, user_id
)
VALUES (
  'Penis Envy',
  'Psilocybe cubensis var. Penis Envy',
  ARRAY['PE', 'Penis Envy', 'Melmac', 'Penis Envy Uncut', 'PEU'],
  'research',
  'intermediate',
  -- SPAWN COLONIZATION JSONB
  '{
    "tempRange": {
      "min": 70,
      "max": 85,
      "optimal": 77,
      "warningLow": 68,
      "warningHigh": 82,
      "criticalLow": 65,
      "criticalHigh": 88,
      "rampRate": 1
    },
    "humidityRange": {
      "min": null,
      "max": null,
      "optimal": null,
      "notes": "Substrate moisture only"
    },
    "co2Range": {
      "min": 0,
      "max": 10000,
      "optimal": 5000,
      "warningHigh": 15000,
      "criticalHigh": 20000,
      "unit": "ppm"
    },
    "daysMin": 14,
    "daysMax": 28,
    "daysTypical": 21,
    "lightRequirement": "none",
    "lightSchedule": {
      "photoperiod": 0,
      "intensity": "none",
      "notes": "Complete darkness recommended until fully colonized"
    },
    "faeFrequency": "minimal",
    "sporeGermination": {
      "daysMin": 5,
      "daysMax": 14,
      "daysTypical": 10,
      "notes": "Slower germination than standard cubensis"
    },
    "transitionCriteria": {
      "minDays": 14,
      "maxDays": 28,
      "typicalDays": 21,
      "colonizationPercent": 100,
      "consolidationDays": 5,
      "visualIndicators": [
        "Complete colonization - no visible grain",
        "Dense ropy mycelium",
        "Extended consolidation recommended"
      ],
      "autoTransition": false,
      "transitionAlertDays": 3
    },
    "criticalParameters": ["temperature", "patience"],
    "equipmentNotes": "Same as baseline cubensis. Allow extra time.",
    "comparisonToBaseline": "+40-100% longer colonization time",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- BULK COLONIZATION JSONB
  '{
    "tempRange": {
      "min": 70,
      "max": 80,
      "optimal": 77,
      "warningLow": 68,
      "warningHigh": 82,
      "criticalLow": 65,
      "criticalHigh": 85,
      "rampRate": 1
    },
    "humidityRange": {
      "min": null,
      "max": null,
      "optimal": null,
      "notes": "Field capacity substrate"
    },
    "co2Range": {
      "min": 0,
      "max": 8000,
      "optimal": 4000,
      "warningHigh": 10000,
      "criticalHigh": 15000,
      "unit": "ppm"
    },
    "daysMin": 10,
    "daysMax": 21,
    "daysTypical": 14,
    "lightRequirement": "indirect",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "low",
      "spectrum": "cool"
    },
    "faeFrequency": "minimal",
    "spawnRatios": {
      "1:1": {"days": "8-12", "contamRisk": "lowest", "blobRisk": "HIGH", "notes": "NOT recommended - high blob risk"},
      "1:2": {"days": "10-16", "contamRisk": "low", "blobRisk": "moderate", "notes": "Acceptable but blob risk exists"},
      "1:3": {"days": "14-21", "contamRisk": "moderate", "blobRisk": "low", "notes": "RECOMMENDED for PE"},
      "1:4": {"days": "18-28", "contamRisk": "higher", "blobRisk": "lowest", "notes": "Best for blob prevention"}
    },
    "recommendedRatio": "1:3 to 1:4 (reduces blobs)",
    "casingLayer": {
      "required": false,
      "highlyRecommended": true,
      "timing": "At 100% colonization",
      "composition": "50/50 peat/verm or pure CVG",
      "waitForColonization": "20-30% casing colonization before fruiting",
      "purpose": "Prevents blobs, maintains surface conditions"
    },
    "blobPrevention": {
      "useCase": true,
      "causes": [
        "Too nutritious substrate",
        "High spawn ratios (1:1, 1:2)",
        "Exposed grains on surface",
        "Early fruiting conditions",
        "Lack of casing layer"
      ],
      "prevention": [
        "Use 1:3 to 1:4 spawn ratio",
        "Apply casing layer at full colonization",
        "Compress top layer slightly (pseudo-casing)",
        "Horse manure in substrate",
        "Wait for 20-30% casing colonization"
      ],
      "notes": "First flush often produces blobs; second flush typically normal"
    },
    "transitionCriteria": {
      "minDays": 10,
      "maxDays": 21,
      "typicalDays": 14,
      "colonizationPercent": 100,
      "visualIndicators": [
        "Surface fully colonized",
        "Casing layer 20-30% colonized (if used)",
        "Hyphal knots visible"
      ],
      "autoTransition": false,
      "transitionAlertDays": 3
    },
    "criticalParameters": ["spawn_ratio", "casing_layer"],
    "equipmentNotes": "Casing layer highly recommended to prevent blobs",
    "comparisonToBaseline": "+40-100% longer, blob management critical",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- PINNING JSONB
  '{
    "tempRange": {
      "min": 68,
      "max": 78,
      "optimal": 72,
      "warningLow": 65,
      "warningHigh": 80,
      "criticalLow": 60,
      "criticalHigh": 82,
      "rampRate": 2
    },
    "humidityRange": {
      "min": 80,
      "max": 95,
      "optimal": 88,
      "warningLow": 75,
      "warningHigh": 98,
      "criticalLow": 70,
      "criticalHigh": 100,
      "rampRate": 3,
      "notes": "Slightly lower than baseline - 80-90% preferred"
    },
    "co2Range": {
      "min": 400,
      "max": 1500,
      "optimal": 1000,
      "warningHigh": 2500,
      "criticalHigh": 5000,
      "unit": "ppm"
    },
    "daysMin": 10,
    "daysMax": 21,
    "daysTypical": 14,
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "medium",
      "spectrum": "cool"
    },
    "faeFrequency": "4-6x daily",
    "coldShock": {
      "helpful": true,
      "recommended": true,
      "tempDrop": "5-10°F for 12-24 hours",
      "notes": "More beneficial for PE than standard cubensis"
    },
    "transitionCriteria": {
      "minDays": 10,
      "maxDays": 21,
      "typicalDays": 14,
      "visualIndicators": [
        "Primordia visible",
        "Pin clusters forming",
        "No blob masses (if blob-free)"
      ],
      "autoTransition": true,
      "transitionAlertDays": 3
    },
    "criticalParameters": ["humidity", "fae", "patience"],
    "equipmentNotes": "Standard fruiting chamber. Cold shock can help initiate pins.",
    "comparisonToBaseline": "+100% longer time to pins",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- MATURATION JSONB
  '{
    "tempRange": {
      "min": 60,
      "max": 78,
      "optimal": 72,
      "warningLow": 58,
      "warningHigh": 80,
      "criticalLow": 55,
      "criticalHigh": 82,
      "rampRate": 2
    },
    "humidityRange": {
      "min": 80,
      "max": 95,
      "optimal": 88,
      "warningLow": 75,
      "warningHigh": 98,
      "criticalLow": 70,
      "criticalHigh": 100,
      "rampRate": 3
    },
    "co2Range": {
      "min": 400,
      "max": 5000,
      "optimal": 1500,
      "warningHigh": 8000,
      "criticalHigh": 12000,
      "unit": "ppm"
    },
    "daysMin": 7,
    "daysMax": 21,
    "daysTypical": 14,
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "medium",
      "spectrum": "cool"
    },
    "faeFrequency": "4-6x daily",
    "harvestIndicators": {
      "primary": "Softening like marshmallows - MAIN INDICATOR",
      "secondary": [
        "Cap edges curl outward",
        "Growth cessation for 2-3 days",
        "Blueing (gills turn blue, blue ring on cap edge)",
        "Stem wrinkles or bubbles under cap"
      ],
      "NOT_applicable": "Traditional veil break - PE has minimal veil",
      "notes": "PE has unique anatomy without traditional veil"
    },
    "transitionCriteria": {
      "minDays": 7,
      "maxDays": 21,
      "typicalDays": 14,
      "visualIndicators": [
        "Softening/squishiness when gently squeezed",
        "Cap edges curling",
        "Blue coloration developing",
        "No further growth for 2-3 days"
      ],
      "autoTransition": false,
      "transitionAlertDays": 2
    },
    "criticalParameters": ["harvest_timing"],
    "flushInfo": {
      "typicalFlushes": "2-4",
      "firstFlushNotes": "Often produces blobs on first flush",
      "secondFlushNotes": "Second flush typically produces normal fruits",
      "daysBetweenFlushes": "7-10",
      "rehydration": "12-24 hour cold water soak"
    },
    "comparisonToBaseline": "+40-100% longer pins to harvest",
    "dataConfidence": "well_documented"
  }'::jsonb,
  -- PREFERRED SUBSTRATES
  ARRAY['Manure-based substrate', 'CVG with casing', 'Horse manure + CVG blend'],
  -- SUBSTRATE NOTES
  'Horse manure-based substrates reported to eliminate blobs. CVG works but higher blob risk without casing layer. BRF cakes NOT recommended - PE does best on bulk substrate. Lower spawn ratios (1:3 to 1:4) critical for blob prevention. Casing layer highly recommended at 100% colonization.',
  -- CHARACTERISTICS
  'Distinctive phallic shape with thick, dense stems and small caps. Minimal to no veil. Extremely dense fruits - dries at ~13% weight vs normal 7-10%. Lower spore production makes collection difficult. Very low genetic stability - degrades over transfers.',
  -- COMMUNITY TIPS
  'PATIENCE is key - PE takes significantly longer at every stage. Do not use standard veil-break harvest timing - watch for softening/squishiness instead. First flush often produces blobs - this is normal, second flush typically produces normal fruits. Use lower spawn ratios (1:3-1:4) to prevent blobs. Casing layer dramatically reduces blob formation. Clone best performers - spore production is very low.',
  -- IMPORTANT FACTS
  'Created by Terrence McKenna and Steven Pollock in the 1970s. Very low spore production - requires spore swabs to agar or cloning. Notorious genetic instability - cloning essential for maintaining quality. Higher research compound content than standard cubensis but lower yields. Extended timeline increases contamination risk window.',
  -- TYPICAL YIELD
  '0.5-1.5 oz (14-42g) dry per quart spawn. 60-80% of standard cubensis yield, but denser fruits.',
  -- FLUSH COUNT
  '2-4 typical',
  -- SHELF LIFE
  7, 14,
  -- AUTOMATION CONFIG
  '{
    "automationTested": false,
    "automationNotes": "Extended timelines require more patience from automation. Harvest detection cannot use veil break - must detect softening or growth cessation. Camera monitoring recommended for blob detection.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "light", "camera"],
    "controllerTypes": ["inkbird", "ac_infinity", "custom_arduino"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 8,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 180,
    "specialConsiderations": ["blob_detection", "softness_based_harvest"]
  }'::jsonb,
  -- SPAWN COLONIZATION NOTES
  'SPAWN COLONIZATION (70-85°F, 14-28 days): PE colonizes 40-100% slower than standard cubensis. Inoculate and store in COMPLETE DARKNESS until fully colonized to prevent premature pinning. Optimal temp 75-80°F. Spore germination takes 5-14 days (vs 3-7 for standard). Allow extended consolidation period (5-7 days after 100% colonization). Extended timeline creates larger contamination window - maintain strict sterility.',
  -- BULK COLONIZATION NOTES
  'BULK COLONIZATION (70-80°F, 10-21 days): CRITICAL - Use 1:3 to 1:4 spawn ratio to prevent blobs (standard ratios cause blob mutations). Casing layer HIGHLY RECOMMENDED - apply 50/50 peat/verm or pure CVG at 100% colonization, wait for 20-30% casing colonization before fruiting. Horse manure in substrate eliminates blobs for many growers. Do not introduce fruiting conditions too early.',
  -- PINNING NOTES
  'PINNING (68-78°F, 10-21 days): Takes about twice as long to pin as standard cubensis. Cold shock (5-10°F drop for 12-24 hours) more beneficial than for standard strains. Slightly lower humidity (80-90%) than baseline. First flush commonly produces blobs - this is normal and does not indicate failure. Remove blobs (still harvestable) and second flush typically produces normal pins.',
  -- MATURATION NOTES
  'MATURATION (60-78°F, 7-21 days): UNIQUE HARVEST INDICATORS - PE does not have traditional veil break. Harvest when fruits feel soft/squishy like marshmallows when gently squeezed. Other indicators: cap edges curl outward, growth stops for 2-3 days, blue coloration develops on gills and cap edges, stem develops wrinkles or bubbles. Fruits are much denser than standard - expect 13% dry weight vs typical 7-10%.',
  -- NOTES
  'Iconic variant with distinctive appearance and notably different cultivation requirements. Requires patience and modified protocols. Famous for blob mutations on first flush - prevention through spawn ratio and casing management. Cloning essential due to very low spore production and genetic instability. For experienced cultivators.',
  -- USER_ID
  NULL
)
ON CONFLICT (name)
DO UPDATE SET
  name = EXCLUDED.name,
  common_names = EXCLUDED.common_names,
  difficulty = EXCLUDED.difficulty,
  spawn_colonization = EXCLUDED.spawn_colonization,
  bulk_colonization = EXCLUDED.bulk_colonization,
  pinning = EXCLUDED.pinning,
  maturation = EXCLUDED.maturation,
  preferred_substrates = EXCLUDED.preferred_substrates,
  substrate_notes = EXCLUDED.substrate_notes,
  characteristics = EXCLUDED.characteristics,
  community_tips = EXCLUDED.community_tips,
  important_facts = EXCLUDED.important_facts,
  typical_yield = EXCLUDED.typical_yield,
  flush_count = EXCLUDED.flush_count,
  shelf_life_days_min = EXCLUDED.shelf_life_days_min,
  shelf_life_days_max = EXCLUDED.shelf_life_days_max,
  automation_config = EXCLUDED.automation_config,
  spawn_colonization_notes = EXCLUDED.spawn_colonization_notes,
  bulk_colonization_notes = EXCLUDED.bulk_colonization_notes,
  pinning_notes = EXCLUDED.pinning_notes,
  maturation_notes = EXCLUDED.maturation_notes,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- ----------------------------------------------------------------------------
-- P. cubensis var. Albino Penis Envy - Even more challenging than PE
-- Slowest colonization, highest contamination risk
-- ----------------------------------------------------------------------------
INSERT INTO species (
  name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics,
  community_tips, important_facts, typical_yield, flush_count,
  shelf_life_days_min, shelf_life_days_max,
  automation_config, spawn_colonization_notes, bulk_colonization_notes,
  pinning_notes, maturation_notes, notes, user_id
)
VALUES (
  'Albino Penis Envy',
  'Psilocybe cubensis var. Albino Penis Envy',
  ARRAY['APE', 'Albino Penis Envy', 'Albino PE'],
  'research',
  'advanced',
  -- SPAWN COLONIZATION JSONB
  '{
    "tempRange": {
      "min": 72,
      "max": 82,
      "optimal": 78,
      "warningLow": 70,
      "warningHigh": 80,
      "criticalLow": 68,
      "criticalHigh": 85,
      "rampRate": 1,
      "phaseNotes": {
        "week1": "78-80°F optimal for initial germination",
        "afterWeek1": "Can reduce to 75-77°F"
      }
    },
    "humidityRange": {
      "min": null,
      "max": null,
      "optimal": null,
      "notes": "Substrate moisture only"
    },
    "co2Range": {
      "min": 0,
      "max": 10000,
      "optimal": 5000,
      "warningHigh": 15000,
      "criticalHigh": 20000,
      "unit": "ppm"
    },
    "daysMin": 21,
    "daysMax": 42,
    "daysTypical": 30,
    "lightRequirement": "none",
    "lightSchedule": {
      "photoperiod": 0,
      "intensity": "none",
      "notes": "COMPLETE DARKNESS until fully colonized - prevents early pinning"
    },
    "faeFrequency": "minimal",
    "sporeGermination": {
      "daysMin": 7,
      "daysMax": 21,
      "daysTypical": 14,
      "notes": "Very slow germination - patience essential"
    },
    "myceliumAppearance": {
      "normal": "Fluffy, cotton-like, wispy",
      "notes": "APE mycelium appears different from standard - this is NORMAL",
      "concernSigns": ["Green coloration", "Black spots", "Bacterial slime"]
    },
    "transitionCriteria": {
      "minDays": 21,
      "maxDays": 42,
      "typicalDays": 30,
      "colonizationPercent": 100,
      "consolidationDays": 7,
      "visualIndicators": [
        "Complete colonization",
        "Dense cotton-like mycelium",
        "No uncolonized grain",
        "Extended consolidation complete"
      ],
      "autoTransition": false,
      "transitionAlertDays": 5
    },
    "criticalParameters": ["temperature", "darkness", "extreme_patience"],
    "equipmentNotes": "Same as baseline but requires much more patience. Extended timeline increases contamination risk.",
    "comparisonToBaseline": "+100-200% longer colonization time. Takes FOREVER on all aspects.",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- BULK COLONIZATION JSONB
  '{
    "tempRange": {
      "min": 70,
      "max": 80,
      "optimal": 76,
      "warningLow": 68,
      "warningHigh": 82,
      "criticalLow": 65,
      "criticalHigh": 85,
      "rampRate": 1
    },
    "humidityRange": {
      "min": null,
      "max": null,
      "optimal": null,
      "notes": "Field capacity substrate"
    },
    "co2Range": {
      "min": 0,
      "max": 8000,
      "optimal": 4000,
      "warningHigh": 10000,
      "criticalHigh": 15000,
      "unit": "ppm"
    },
    "daysMin": 14,
    "daysMax": 35,
    "daysTypical": 21,
    "lightRequirement": "indirect",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "low",
      "spectrum": "cool"
    },
    "faeFrequency": "minimal",
    "spawnRatios": {
      "1:1": {"days": "10-16", "contamRisk": "moderate", "blobRisk": "VERY HIGH", "notes": "NOT RECOMMENDED"},
      "1:2": {"days": "14-21", "contamRisk": "moderate", "blobRisk": "high", "notes": "NOT RECOMMENDED"},
      "1:3": {"days": "18-28", "contamRisk": "moderate", "blobRisk": "moderate", "notes": "Acceptable minimum"},
      "1:4": {"days": "21-35", "contamRisk": "higher", "blobRisk": "low", "notes": "RECOMMENDED for APE"}
    },
    "recommendedRatio": "1:4 strongly recommended",
    "casingLayer": {
      "required": true,
      "timing": "At 100% colonization",
      "composition": "50/50 peat/verm or pure CVG",
      "waitForColonization": "30% casing colonization before fruiting",
      "purpose": "Essential for APE to prevent blobs and maintain conditions"
    },
    "transitionCriteria": {
      "minDays": 14,
      "maxDays": 35,
      "typicalDays": 21,
      "colonizationPercent": 100,
      "visualIndicators": [
        "Surface fully colonized",
        "Casing layer 30% colonized",
        "Hyphal knots forming"
      ],
      "autoTransition": false,
      "transitionAlertDays": 5
    },
    "criticalParameters": ["spawn_ratio", "casing_layer", "patience"],
    "equipmentNotes": "Casing layer REQUIRED. Extended timeline demands excellent contamination control.",
    "comparisonToBaseline": "+100-200% longer. Blob prevention critical.",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- PINNING JSONB
  '{
    "tempRange": {
      "min": 68,
      "max": 78,
      "optimal": 74,
      "warningLow": 65,
      "warningHigh": 80,
      "criticalLow": 62,
      "criticalHigh": 82,
      "rampRate": 2
    },
    "humidityRange": {
      "min": 82,
      "max": 92,
      "optimal": 87,
      "warningLow": 78,
      "warningHigh": 95,
      "criticalLow": 75,
      "criticalHigh": 98,
      "rampRate": 3,
      "notes": "Slightly lower humidity than baseline - 85-90% preferred"
    },
    "co2Range": {
      "min": 800,
      "max": 1500,
      "optimal": 1100,
      "warningHigh": 2000,
      "criticalHigh": 3000,
      "unit": "ppm",
      "notes": "More CO2 sensitive than standard - but allow slight buildup initially"
    },
    "daysMin": 14,
    "daysMax": 28,
    "daysTypical": 20,
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "medium",
      "spectrum": "cool"
    },
    "faeFrequency": "gradual_increase",
    "faeNotes": "Allow CO2 to build slightly (1000-1200 ppm) for first few days, then increase FAE. APE is more CO2 sensitive but early airflow can cause issues.",
    "coldShock": {
      "helpful": true,
      "highlyRecommended": true,
      "tempDrop": "8-12°F for 24-48 hours",
      "notes": "Cold shock more important for APE than standard PE"
    },
    "transitionCriteria": {
      "minDays": 14,
      "maxDays": 28,
      "typicalDays": 20,
      "visualIndicators": [
        "Primordia forming",
        "Pin clusters visible",
        "Healthy white pins (not blobs)"
      ],
      "autoTransition": true,
      "transitionAlertDays": 4
    },
    "criticalParameters": ["humidity", "co2_management", "cold_shock"],
    "equipmentNotes": "Gradual FAE introduction important. Cold shock highly recommended.",
    "comparisonToBaseline": "+100-200% longer time to pins",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- MATURATION JSONB
  '{
    "tempRange": {
      "min": 60,
      "max": 78,
      "optimal": 72,
      "warningLow": 58,
      "warningHigh": 80,
      "criticalLow": 55,
      "criticalHigh": 82,
      "rampRate": 2
    },
    "humidityRange": {
      "min": 80,
      "max": 92,
      "optimal": 86,
      "warningLow": 75,
      "warningHigh": 95,
      "criticalLow": 70,
      "criticalHigh": 98,
      "rampRate": 3
    },
    "co2Range": {
      "min": 400,
      "max": 5000,
      "optimal": 1200,
      "warningHigh": 6000,
      "criticalHigh": 10000,
      "unit": "ppm"
    },
    "daysMin": 14,
    "daysMax": 28,
    "daysTypical": 21,
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "medium",
      "spectrum": "cool"
    },
    "faeFrequency": "4-6x daily",
    "harvestIndicators": {
      "primary": "Softening/squishiness - SAME AS PE",
      "secondary": [
        "Gills turn pale blue",
        "Growth cessation for 2-3 days",
        "Cap edges curling",
        "Blue bruising developing"
      ],
      "NOT_applicable": "Veil break - APE has no veil",
      "whiteVariantNotes": "Color change less obvious on white fruits - rely more on texture"
    },
    "transitionCriteria": {
      "minDays": 14,
      "maxDays": 28,
      "typicalDays": 21,
      "visualIndicators": [
        "Soft/squishy texture when gently squeezed",
        "Blue coloration on gills",
        "No further growth for 2-3 days",
        "Cap edges curling outward"
      ],
      "autoTransition": false,
      "transitionAlertDays": 3
    },
    "criticalParameters": ["harvest_timing"],
    "flushInfo": {
      "typicalFlushes": "2-3",
      "firstFlushNotes": "Frequently produces blobs",
      "secondFlushNotes": "Usually produces normal fruits after blob removal",
      "daysBetweenFlushes": "10-14",
      "rehydration": "24 hour cold water soak"
    },
    "dryingNotes": "Dries at ~13% weight (very dense). Extra dry time may be needed.",
    "comparisonToBaseline": "+100-200% longer. Very dense fruits.",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- PREFERRED SUBSTRATES
  ARRAY['Manure-based substrate', 'CVG with required casing', 'Horse manure + CVG blend'],
  -- SUBSTRATE NOTES
  'Casing layer REQUIRED for APE - not optional. Use 1:4 spawn ratio minimum. Horse manure substrate reported to significantly reduce blob issues. CVG works but must have casing. Extended timeline means contamination risk is much higher - use excellent sterile technique throughout.',
  -- CHARACTERISTICS
  'Pure white albino version of Penis Envy. Same distinctive phallic shape. Extremely dense fruits - dries at ~13% weight. "Fluffy/cotton-like" mycelium appearance is NORMAL for APE - do not confuse with contamination. Essentially zero spore production.',
  -- COMMUNITY TIPS
  'APE "takes FOREVER on all aspects" - expect 2-3x longer than standard cubensis at every stage. Extended timeline is the biggest challenge - contamination window is very large. Casing layer is REQUIRED not optional. Do NOT let too much air get to them during early fruiting - gradual FAE introduction. First flush almost always produces blobs - remove them and second flush typically produces normal fruits. Clone from fruits, not spores - spore production essentially zero.',
  -- IMPORTANT FACTS
  'Most challenging common cubensis variant. Expect 8-14+ weeks total cycle time (vs 4-6 for standard). Far more susceptible to mold growth than other varieties due to extended timeline. Essentially cannot be propagated from spores - must use cloning or LC. Higher research compound density but significantly lower yields. Only recommended for experienced cultivators with excellent sterile technique.',
  -- TYPICAL YIELD
  '0.3-1 oz (8-28g) dry per quart spawn. 40-60% of standard cubensis yield, but much denser.',
  -- FLUSH COUNT
  '2-3 typical',
  -- SHELF LIFE
  7, 14,
  -- AUTOMATION CONFIG
  '{
    "automationTested": false,
    "automationNotes": "Very extended timelines challenge automation. Contamination monitoring critical due to long grow times. Harvest detection must rely on texture/softness, not veil break. Cold shock capability recommended.",
    "requiredSensors": ["temperature", "humidity", "co2"],
    "optionalSensors": ["camera"],
    "controllerTypes": ["inkbird", "ac_infinity"],
    "alertOnTempDeviation": 4,
    "alertOnHumidityDeviation": 6,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 240,
    "specialConsiderations": ["extended_timeline", "blob_detection", "contamination_monitoring", "cold_shock_capability"]
  }'::jsonb,
  -- SPAWN COLONIZATION NOTES
  'SPAWN COLONIZATION (72-82°F, 21-42 days): APE is the slowest common cubensis variant. Expect 3-6 weeks for spawn colonization (vs 2-3 for standard). Store in COMPLETE DARKNESS until 100% colonized. Week 1 optimal at 78-80°F for germination, then can reduce to 75-77°F. Spore germination takes 7-21 days. Mycelium appears "fluffy/cotton-like" - this is NORMAL for APE, do not mistake for contamination. Extended consolidation (7+ days) recommended. Extended timeline creates very large contamination window - excellent sterile technique essential.',
  -- BULK COLONIZATION NOTES
  'BULK COLONIZATION (70-80°F, 14-35 days): Use 1:4 spawn ratio - lower ratios cause severe blob issues. Casing layer is REQUIRED, not optional - apply at 100% colonization. Wait for 30% casing colonization before introducing fruiting conditions. Horse manure substrate significantly reduces blobs. Timeline is 2-3x longer than standard cubensis. Do not rush to fruiting conditions.',
  -- PINNING NOTES
  'PINNING (68-78°F, 14-28 days): Cold shock HIGHLY RECOMMENDED - drop temp 8-12°F for 24-48 hours to initiate. APE is more CO2 sensitive than standard strains but needs gradual FAE introduction - allow slight CO2 buildup (1000-1200 ppm) for first few days, then increase FAE. "DON''T let too much air get to them" during initial pinning. First flush commonly produces blobs - this is normal. Remove blobs (still harvestable) and second flush typically produces normal pins.',
  -- MATURATION NOTES
  'MATURATION (60-78°F, 14-28 days): UNIQUE HARVEST - no veil to watch. Harvest when fruits feel soft/squishy like marshmallows. For white fruits, color changes less obvious - rely primarily on texture. Gills turn pale blue when mature. Growth cessation for 2-3 days indicates readiness. Fruits are VERY dense - expect 13% dry weight vs typical 7-10%. Allow extra drying time. Subsequent flushes take 10-14 days with 24-hour cold water soak.',
  -- NOTES
  'The most challenging widely cultivated cubensis variant. Requires patience, excellent sterile technique, and willingness to deal with blobs. Not recommended for beginners. Extended timeline (8-14+ weeks) creates large contamination risk window. Very high research compound density makes it popular despite difficulty. Must be propagated via cloning - no spore production.',
  -- USER_ID
  NULL
)
ON CONFLICT (name)
DO UPDATE SET
  name = EXCLUDED.name,
  common_names = EXCLUDED.common_names,
  difficulty = EXCLUDED.difficulty,
  spawn_colonization = EXCLUDED.spawn_colonization,
  bulk_colonization = EXCLUDED.bulk_colonization,
  pinning = EXCLUDED.pinning,
  maturation = EXCLUDED.maturation,
  preferred_substrates = EXCLUDED.preferred_substrates,
  substrate_notes = EXCLUDED.substrate_notes,
  characteristics = EXCLUDED.characteristics,
  community_tips = EXCLUDED.community_tips,
  important_facts = EXCLUDED.important_facts,
  typical_yield = EXCLUDED.typical_yield,
  flush_count = EXCLUDED.flush_count,
  shelf_life_days_min = EXCLUDED.shelf_life_days_min,
  shelf_life_days_max = EXCLUDED.shelf_life_days_max,
  automation_config = EXCLUDED.automation_config,
  spawn_colonization_notes = EXCLUDED.spawn_colonization_notes,
  bulk_colonization_notes = EXCLUDED.bulk_colonization_notes,
  pinning_notes = EXCLUDED.pinning_notes,
  maturation_notes = EXCLUDED.maturation_notes,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- ----------------------------------------------------------------------------
-- P. cubensis var. Enigma - Blob mutation requiring completely different approach
-- ----------------------------------------------------------------------------
INSERT INTO species (
  name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics,
  community_tips, important_facts, typical_yield, flush_count,
  shelf_life_days_min, shelf_life_days_max,
  automation_config, spawn_colonization_notes, bulk_colonization_notes,
  pinning_notes, maturation_notes, notes, user_id
)
VALUES (
  'Enigma',
  'Psilocybe cubensis var. Enigma',
  ARRAY['Enigma', 'Blob Mutation', 'Brainiac', 'Tidal Wave Enigma'],
  'research',
  'advanced',
  -- SPAWN COLONIZATION JSONB
  '{
    "tempRange": {
      "min": 70,
      "max": 82,
      "optimal": 77,
      "warningLow": 68,
      "warningHigh": 80,
      "criticalLow": 65,
      "criticalHigh": 85,
      "rampRate": 2
    },
    "humidityRange": {
      "min": null,
      "max": null,
      "optimal": null,
      "notes": "Substrate moisture only"
    },
    "co2Range": {
      "min": 0,
      "max": 10000,
      "optimal": 5000,
      "warningHigh": 15000,
      "criticalHigh": 20000,
      "unit": "ppm"
    },
    "daysMin": 7,
    "daysMax": 14,
    "daysTypical": 10,
    "lightRequirement": "none",
    "lightSchedule": {
      "photoperiod": 0,
      "intensity": "none"
    },
    "faeFrequency": "minimal",
    "transitionCriteria": {
      "minDays": 7,
      "maxDays": 14,
      "typicalDays": 10,
      "colonizationPercent": 100,
      "visualIndicators": [
        "Fast aggressive colonization",
        "Complete colonization",
        "No visible grain"
      ],
      "autoTransition": true,
      "transitionAlertDays": 2
    },
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Enigma colonizes quickly and aggressively - similar to Tidal Wave parent",
    "propagationNotes": "NO SPORES - must use liquid culture or cloning only",
    "comparisonToBaseline": "Faster colonization than baseline",
    "dataConfidence": "well_documented"
  }'::jsonb,
  -- BULK COLONIZATION JSONB
  '{
    "tempRange": {
      "min": 70,
      "max": 78,
      "optimal": 74,
      "warningLow": 68,
      "warningHigh": 80,
      "criticalLow": 65,
      "criticalHigh": 82,
      "rampRate": 1
    },
    "humidityRange": {
      "min": 85,
      "max": 95,
      "optimal": 90,
      "warningLow": 80,
      "warningHigh": 98,
      "criticalLow": 75,
      "criticalHigh": 100,
      "rampRate": 3,
      "notes": "Maintain high humidity throughout"
    },
    "co2Range": {
      "min": 0,
      "max": 8000,
      "optimal": 4000,
      "warningHigh": 12000,
      "criticalHigh": 18000,
      "unit": "ppm"
    },
    "daysMin": 5,
    "daysMax": 10,
    "daysTypical": 7,
    "lightRequirement": "indirect",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "low",
      "spectrum": "cool"
    },
    "faeFrequency": "minimal_to_reduced",
    "faeNotes": "Less FAE than standard cubensis during bulk colonization",
    "spawnRatios": {
      "1:1": {"notes": "Common for Enigma"},
      "1:2": {"notes": "Also works well"}
    },
    "recommendedRatio": "1:1 to 1:2",
    "transitionCriteria": {
      "minDays": 5,
      "maxDays": 10,
      "typicalDays": 7,
      "colonizationPercent": 100,
      "visualIndicators": [
        "Surface fully colonized",
        "Hyphal knots forming",
        "Ready to fruit"
      ],
      "autoTransition": true,
      "transitionAlertDays": 2
    },
    "criticalParameters": ["humidity", "reduced_fae"],
    "equipmentNotes": "Sealed grow bags preferred over monotubs for better contamination control over long fruiting",
    "comparisonToBaseline": "Similar timing but higher humidity needed",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- PINNING/BLOB FORMATION JSONB (Enigma does not pin traditionally)
  '{
    "tempRange": {
      "min": 68,
      "max": 76,
      "optimal": 72,
      "warningLow": 65,
      "warningHigh": 78,
      "criticalLow": 62,
      "criticalHigh": 80,
      "rampRate": 1
    },
    "humidityRange": {
      "min": 85,
      "max": 95,
      "optimal": 90,
      "warningLow": 82,
      "warningHigh": 98,
      "criticalLow": 80,
      "criticalHigh": 100,
      "rampRate": 2,
      "notes": "HIGH humidity must be maintained throughout entire fruiting - more critical than baseline"
    },
    "co2Range": {
      "min": 800,
      "max": 2000,
      "optimal": 1200,
      "warningHigh": 3000,
      "criticalHigh": 5000,
      "unit": "ppm",
      "notes": "Lower FAE than standard - Enigma prefers higher CO2 during blob formation"
    },
    "daysMin": 7,
    "daysMax": 14,
    "daysTypical": 10,
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "medium",
      "spectrum": "cool"
    },
    "faeFrequency": "reduced",
    "faeNotes": "REDUCED FAE compared to standard cubensis - Enigma grows better with less air exchange",
    "blobFormation": {
      "description": "Enigma produces brain-like blob masses instead of traditional pins",
      "appearance": "Dense, cauliflower-like or brain-like formations",
      "normalVariation": "Some variation in blob shape is normal"
    },
    "transitionCriteria": {
      "minDays": 7,
      "maxDays": 14,
      "typicalDays": 10,
      "visualIndicators": [
        "Capless pin clusters forming",
        "Pins clumping into blob formations",
        "Continued growth of blob masses"
      ],
      "autoTransition": true,
      "transitionAlertDays": 3
    },
    "criticalParameters": ["humidity", "reduced_fae"],
    "equipmentNotes": "Reduce FAE holes compared to standard monotub. Sealed bags work well.",
    "comparisonToBaseline": "Completely different morphology - blobs not pins",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- MATURATION JSONB (Very extended)
  '{
    "tempRange": {
      "min": 68,
      "max": 76,
      "optimal": 72,
      "warningLow": 65,
      "warningHigh": 78,
      "criticalLow": 62,
      "criticalHigh": 80,
      "rampRate": 1
    },
    "humidityRange": {
      "min": 85,
      "max": 95,
      "optimal": 90,
      "warningLow": 82,
      "warningHigh": 98,
      "criticalLow": 80,
      "criticalHigh": 100,
      "rampRate": 2
    },
    "co2Range": {
      "min": 800,
      "max": 2500,
      "optimal": 1500,
      "warningHigh": 4000,
      "criticalHigh": 8000,
      "unit": "ppm"
    },
    "daysMin": 28,
    "daysMax": 60,
    "daysTypical": 42,
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "medium",
      "spectrum": "cool"
    },
    "faeFrequency": "reduced",
    "faeNotes": "Maintain reduced FAE throughout very long maturation period",
    "harvestIndicators": {
      "primary": "Bluish color development on blob surface",
      "secondary": [
        "Texture becomes slightly softer",
        "Growth slows significantly",
        "Blobs reach substantial size"
      ],
      "NOT_applicable": "Veil break - Enigma has no veils or caps",
      "timing": "4-8 WEEKS from blob formation to harvest",
      "notes": "Extended growth correlates with increased research compound content"
    },
    "transitionCriteria": {
      "minDays": 28,
      "maxDays": 60,
      "typicalDays": 42,
      "visualIndicators": [
        "Bluish coloration on blob surface",
        "Soft texture when gently touched",
        "Growth cessation"
      ],
      "autoTransition": false,
      "transitionAlertDays": 5
    },
    "criticalParameters": ["humidity", "contamination_prevention"],
    "flushInfo": {
      "typicalFlushes": "1-2",
      "notes": "Often only one productive flush due to extended timeline",
      "secondFlushChance": "Variable - substrate often exhausted"
    },
    "contamRisk": {
      "level": "VERY HIGH",
      "reason": "4-8 week fruiting period creates enormous contamination window",
      "mitigation": "Sealed bags, excellent sterile technique, careful monitoring"
    },
    "potencyNotes": "Extended growth correlates with increased research compound content. Psilocybin Cup entries ranged 1.8-3.8%",
    "comparisonToBaseline": "+300-600% longer fruiting time",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- PREFERRED SUBSTRATES
  ARRAY['CVG', 'Manure-based', 'Standard monotub substrates'],
  -- SUBSTRATE NOTES
  'Standard cubensis substrates work for Enigma. Sealed grow bags preferred over monotubs due to 5+ week fruiting timeline - better contamination control. Higher humidity needs than standard throughout entire grow. Reduced FAE compared to normal cubensis.',
  -- CHARACTERISTICS
  'Non-sporulating blob mutation of Tidal Wave (PE × B+). Forms dense brain-like or cauliflower-like masses instead of traditional caps and stems. Never produces spores - can only be propagated via liquid culture or cloning. Very high research compound potential. According to community lore, must be "gifted" for good results.',
  -- COMMUNITY TIPS
  'Enigma requires fundamentally different approach than normal cubensis. Reduced FAE - do not over-ventilate. High humidity must be maintained throughout entire 5-8 week fruiting period. Sealed grow bags often better than monotubs for contamination control over long timeline. Extended maturation correlates with higher potency - do not harvest early. Watch for blue coloration as primary harvest indicator.',
  -- IMPORTANT FACTS
  'Cannot be grown from spores - NO spore production. Must obtain via liquid culture or clone from existing culture. Tidal Wave mutation discovered around 2021. Psilocybin Cup 2021 entry tested at 3.82% total tryptamines. Long fruiting time (4-8 weeks) creates very high contamination risk. Community tradition holds it should be gifted, not sold.',
  -- TYPICAL YIELD
  'Variable - depends on blob size. Dense tissue similar to PE.',
  -- FLUSH COUNT
  '1-2 (often only one productive flush)',
  -- SHELF LIFE
  7, 14,
  -- AUTOMATION CONFIG
  '{
    "automationTested": false,
    "automationNotes": "Very long fruiting timeline (4-8 weeks) challenges automation systems. Contamination monitoring critical. Harvest detection based on color change and texture, not veil break. Reduced FAE requirements differ from normal programming.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "camera"],
    "controllerTypes": ["inkbird", "ac_infinity"],
    "alertOnTempDeviation": 4,
    "alertOnHumidityDeviation": 6,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 120,
    "specialConsiderations": ["very_extended_fruiting", "reduced_fae", "contamination_monitoring", "color_based_harvest"]
  }'::jsonb,
  -- SPAWN COLONIZATION NOTES
  'SPAWN COLONIZATION (70-82°F, 7-14 days): Enigma colonizes quickly and aggressively (inherited from Tidal Wave parent). Standard grain spawn works well. CRITICAL: Cannot use spores - must inoculate from liquid culture or agar clone. Colonization speed similar to or faster than baseline cubensis.',
  -- BULK COLONIZATION NOTES
  'BULK COLONIZATION (70-78°F, 5-10 days): Standard spawn-to-bulk at 1:1 or 1:2 ratio. CVG or manure-based substrate. Key difference: maintain higher humidity from the start and use REDUCED FAE. Sealed grow bags often preferred over monotubs for better contamination control over the long fruiting timeline ahead.',
  -- PINNING NOTES
  'BLOB FORMATION (68-76°F, 7-14 days): Enigma does NOT produce traditional pins. Instead forms capless pin clusters that clump together into blob masses. This is NORMAL and expected. Maintain HIGH humidity (85-95%) throughout. REDUCE FAE compared to normal cubensis - Enigma grows better with less air exchange. Blobs will continue growing and merging.',
  -- MATURATION NOTES
  'MATURATION (68-76°F, 4-8 WEEKS): This is where Enigma differs most dramatically. Blob masses continue growing for 4-8 WEEKS after formation. Maintain high humidity and reduced FAE throughout this extended period. Harvest when blobs develop BLUISH COLORATION and texture becomes slightly softer. No veil break to reference. Extended growth correlates with higher potency. CONTAMINATION RISK IS VERY HIGH due to long timeline - monitor carefully.',
  -- NOTES
  'Unique blob mutation requiring completely different cultivation approach. Cannot be propagated from spores - LC or cloning only. Very extended fruiting timeline (4-8 weeks) with high contamination risk. High potency potential. Community tradition holds it should be gifted. Only for experienced cultivators comfortable with extended timelines and excellent contamination management.',
  -- USER_ID
  NULL
)
ON CONFLICT (name)
DO UPDATE SET
  name = EXCLUDED.name,
  common_names = EXCLUDED.common_names,
  difficulty = EXCLUDED.difficulty,
  spawn_colonization = EXCLUDED.spawn_colonization,
  bulk_colonization = EXCLUDED.bulk_colonization,
  pinning = EXCLUDED.pinning,
  maturation = EXCLUDED.maturation,
  preferred_substrates = EXCLUDED.preferred_substrates,
  substrate_notes = EXCLUDED.substrate_notes,
  characteristics = EXCLUDED.characteristics,
  community_tips = EXCLUDED.community_tips,
  important_facts = EXCLUDED.important_facts,
  typical_yield = EXCLUDED.typical_yield,
  flush_count = EXCLUDED.flush_count,
  shelf_life_days_min = EXCLUDED.shelf_life_days_min,
  shelf_life_days_max = EXCLUDED.shelf_life_days_max,
  automation_config = EXCLUDED.automation_config,
  spawn_colonization_notes = EXCLUDED.spawn_colonization_notes,
  bulk_colonization_notes = EXCLUDED.bulk_colonization_notes,
  pinning_notes = EXCLUDED.pinning_notes,
  maturation_notes = EXCLUDED.maturation_notes,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- ----------------------------------------------------------------------------
-- P. cubensis var. Jack Frost - Leucistic variety with moderate differences
-- ----------------------------------------------------------------------------
INSERT INTO species (
  name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics,
  community_tips, important_facts, typical_yield, flush_count,
  shelf_life_days_min, shelf_life_days_max,
  automation_config, spawn_colonization_notes, bulk_colonization_notes,
  pinning_notes, maturation_notes, notes, user_id
)
VALUES (
  'Jack Frost',
  'Psilocybe cubensis var. Jack Frost',
  ARRAY['Jack Frost', 'JF', 'TAT x APE cross'],
  'research',
  'intermediate',
  -- SPAWN COLONIZATION JSONB
  '{
    "tempRange": {
      "min": 70,
      "max": 82,
      "optimal": 77,
      "warningLow": 68,
      "warningHigh": 80,
      "criticalLow": 65,
      "criticalHigh": 85,
      "rampRate": 2
    },
    "humidityRange": {
      "min": null,
      "max": null,
      "optimal": null,
      "notes": "Substrate moisture only"
    },
    "co2Range": {
      "min": 0,
      "max": 10000,
      "optimal": 5000,
      "warningHigh": 15000,
      "criticalHigh": 20000,
      "unit": "ppm"
    },
    "daysMin": 12,
    "daysMax": 28,
    "daysTypical": 18,
    "lightRequirement": "none",
    "lightSchedule": {
      "photoperiod": 0,
      "intensity": "none"
    },
    "faeFrequency": "minimal",
    "transitionCriteria": {
      "minDays": 12,
      "maxDays": 28,
      "typicalDays": 18,
      "colonizationPercent": 100,
      "visualIndicators": [
        "Complete colonization",
        "Dense white mycelium"
      ],
      "autoTransition": false,
      "transitionAlertDays": 3
    },
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Standard grain spawn setup",
    "comparisonToBaseline": "+25-40% longer colonization time",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- BULK COLONIZATION JSONB
  '{
    "tempRange": {
      "min": 70,
      "max": 78,
      "optimal": 74,
      "warningLow": 68,
      "warningHigh": 80,
      "criticalLow": 65,
      "criticalHigh": 82,
      "rampRate": 2
    },
    "humidityRange": {
      "min": null,
      "max": null,
      "optimal": null,
      "notes": "Field capacity substrate"
    },
    "co2Range": {
      "min": 0,
      "max": 8000,
      "optimal": 4000,
      "warningHigh": 12000,
      "criticalHigh": 15000,
      "unit": "ppm"
    },
    "daysMin": 8,
    "daysMax": 18,
    "daysTypical": 12,
    "lightRequirement": "indirect",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "low",
      "spectrum": "cool"
    },
    "faeFrequency": "minimal",
    "spawnRatios": {
      "1:1": {"notes": "RECOMMENDED for Jack Frost"},
      "1:2": {"notes": "Also works well"}
    },
    "recommendedRatio": "1:1 recommended",
    "substrateCompression": {
      "recommendation": "Do NOT compress",
      "notes": "Growers report fuller flushes with uncompressed substrate"
    },
    "transitionCriteria": {
      "minDays": 8,
      "maxDays": 18,
      "typicalDays": 12,
      "colonizationPercent": 100,
      "visualIndicators": [
        "Surface fully colonized",
        "Hyphal knots forming"
      ],
      "autoTransition": true,
      "transitionAlertDays": 2
    },
    "criticalParameters": ["no_compression"],
    "equipmentNotes": "Do NOT compress substrate",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- PINNING JSONB
  '{
    "tempRange": {
      "min": 68,
      "max": 78,
      "optimal": 73,
      "warningLow": 65,
      "warningHigh": 80,
      "criticalLow": 62,
      "criticalHigh": 85,
      "rampRate": 2,
      "warningNotes": "HIGH temps (84-88°F) cause stress and bacterial issues"
    },
    "humidityRange": {
      "min": 85,
      "max": 95,
      "optimal": 90,
      "warningLow": 80,
      "warningHigh": 98,
      "criticalLow": 75,
      "criticalHigh": 100,
      "rampRate": 3
    },
    "co2Range": {
      "min": 400,
      "max": 1200,
      "optimal": 800,
      "warningHigh": 2000,
      "criticalHigh": 3500,
      "unit": "ppm"
    },
    "daysMin": 14,
    "daysMax": 35,
    "daysTypical": 21,
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "medium",
      "spectrum": "cool"
    },
    "faeFrequency": "4-6x daily",
    "blobRisk": {
      "level": "moderate",
      "conditions": "High temps, suboptimal conditions",
      "notes": "Jack Frost notorious for blobs on first flush under suboptimal conditions",
      "remedy": "Second flush typically produces proper pins after blob removal"
    },
    "transitionCriteria": {
      "minDays": 14,
      "maxDays": 35,
      "typicalDays": 21,
      "visualIndicators": [
        "Primordia forming",
        "Pin clusters visible",
        "White healthy growth"
      ],
      "autoTransition": true,
      "transitionAlertDays": 3
    },
    "criticalParameters": ["temperature", "humidity"],
    "equipmentNotes": "Avoid high temps (84-88°F) which cause stress",
    "comparisonToBaseline": "SLOW pinning - 14-35 days (vs 7-14 baseline)",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- MATURATION JSONB
  '{
    "tempRange": {
      "min": 65,
      "max": 78,
      "optimal": 72,
      "warningLow": 62,
      "warningHigh": 80,
      "criticalLow": 60,
      "criticalHigh": 82,
      "rampRate": 2
    },
    "humidityRange": {
      "min": 85,
      "max": 95,
      "optimal": 90,
      "warningLow": 80,
      "warningHigh": 98,
      "criticalLow": 75,
      "criticalHigh": 100,
      "rampRate": 3
    },
    "co2Range": {
      "min": 400,
      "max": 3000,
      "optimal": 1000,
      "warningHigh": 5000,
      "criticalHigh": 8000,
      "unit": "ppm"
    },
    "daysMin": 7,
    "daysMax": 14,
    "daysTypical": 10,
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "medium",
      "spectrum": "cool"
    },
    "faeFrequency": "4-6x daily",
    "harvestIndicators": {
      "primary": "Caps curl upward - BEST indicator for Jack Frost",
      "secondary": [
        "Gills turn pale blue",
        "Stem firmness (solid when ready, soggy = overripe)"
      ],
      "lessReliable": "Veil status - less reliable for JF than standard cubensis",
      "overripeIndicators": [
        "Gills darken to deep navy blue",
        "Fruits become soggy"
      ]
    },
    "transitionCriteria": {
      "minDays": 7,
      "maxDays": 14,
      "typicalDays": 10,
      "visualIndicators": [
        "Caps curling upward",
        "Gills pale blue",
        "Firm stems"
      ],
      "autoTransition": false,
      "transitionAlertDays": 2
    },
    "criticalParameters": ["harvest_timing"],
    "flushInfo": {
      "typicalFlushes": "3-6",
      "firstFlushNotes": "May produce blobs under suboptimal conditions",
      "subsequentFlushes": "Usually better after first flush",
      "daysBetweenFlushes": "7-10"
    },
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- PREFERRED SUBSTRATES
  ARRAY['CVG', 'Pure coco coir', 'Standard monotub substrates'],
  -- SUBSTRATE NOTES
  'Pure coconut coir works well. Do NOT compress substrate - growers report fuller flushes with uncompressed substrate. Standard CVG also works. 1:1 spawn ratio recommended.',
  -- CHARACTERISTICS
  'Leucistic (white/pale) variety created from TAT × APE cross around 2018 by Dave Wombat. White to pale coloring with bluish tints when mature. "Notoriously unpredictable" genetics - small parameter changes produce different grows. Moderate blob risk on first flush.',
  -- COMMUNITY TIPS
  'Do NOT compress substrate - fuller flushes without compression. Use 1:1 spawn ratio. Avoid high temps (84-88°F) which cause stress and bacterial issues. Watch for cap curling as primary harvest indicator - more reliable than veil for white varieties. If gills turn deep navy blue, fruits are overripe and may be soggy. First flush may produce blobs - remove and second flush typically produces normal fruits.',
  -- IMPORTANT FACTS
  'Created 2018 by Dave Wombat (TAT × APE cross). Genetic instability means results vary - "notoriously unpredictable." Leucism (white coloring) does NOT inherently affect difficulty, but most albino/leucistic strains colonize slower. Slower than baseline at all stages except maturation. High yield potential with good flushes.',
  -- TYPICAL YIELD
  '1-3 oz (28-85g) dry per quart spawn (variable but can be high)',
  -- FLUSH COUNT
  '3-6 typical',
  -- SHELF LIFE
  7, 14,
  -- AUTOMATION CONFIG
  '{
    "automationTested": false,
    "automationNotes": "Slow pinning requires patience. Harvest detection should focus on cap curling rather than veil break. Temperature control important - avoid high temps.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "camera"],
    "controllerTypes": ["inkbird", "ac_infinity"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 8,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 300,
    "dataRetentionDays": 180
  }'::jsonb,
  -- SPAWN COLONIZATION NOTES
  'SPAWN COLONIZATION (70-82°F, 12-28 days): Jack Frost colonizes 25-40% slower than standard cubensis due to APE lineage. Optimal temp 75-80°F. Standard grain spawn methods work well. Expect longer timeline but similar process to baseline.',
  -- BULK COLONIZATION NOTES
  'BULK COLONIZATION (70-78°F, 8-18 days): Use 1:1 spawn ratio (recommended). CRITICAL: Do NOT compress substrate - growers report fuller flushes with uncompressed substrate. Pure coco coir works well. Standard CVG also acceptable. Variable timeline - can be quick or slow.',
  -- PINNING NOTES
  'PINNING (68-78°F, 14-35 days): SLOW - expect 14-35 days to pins (vs 7-14 for baseline). AVOID high temps (84-88°F) which cause stress and bacterial issues. Jack Frost notorious for blobs on first flush under suboptimal conditions - second flush typically produces proper pins. Standard FAE and humidity (85-95%).',
  -- MATURATION NOTES
  'MATURATION (65-78°F, 7-14 days): HARVEST INDICATORS FOR WHITE VARIETIES: Primary indicator is caps curling upward - more reliable than veil for Jack Frost. Gills turning pale blue indicates maturity. Stem should feel firm and solid. If gills darken to deep navy blue = overripe, fruits becoming soggy. Do not rely on veil break as primary indicator.',
  -- NOTES
  'Popular leucistic variety with moderate cultivation difficulty. Genetic instability means variable results. Slower than baseline but capable of high yields. First flush blob risk under suboptimal conditions. For intermediate cultivators comfortable with variable timelines.',
  -- USER_ID
  NULL
)
ON CONFLICT (name)
DO UPDATE SET
  name = EXCLUDED.name,
  common_names = EXCLUDED.common_names,
  difficulty = EXCLUDED.difficulty,
  spawn_colonization = EXCLUDED.spawn_colonization,
  bulk_colonization = EXCLUDED.bulk_colonization,
  pinning = EXCLUDED.pinning,
  maturation = EXCLUDED.maturation,
  preferred_substrates = EXCLUDED.preferred_substrates,
  substrate_notes = EXCLUDED.substrate_notes,
  characteristics = EXCLUDED.characteristics,
  community_tips = EXCLUDED.community_tips,
  important_facts = EXCLUDED.important_facts,
  typical_yield = EXCLUDED.typical_yield,
  flush_count = EXCLUDED.flush_count,
  shelf_life_days_min = EXCLUDED.shelf_life_days_min,
  shelf_life_days_max = EXCLUDED.shelf_life_days_max,
  automation_config = EXCLUDED.automation_config,
  spawn_colonization_notes = EXCLUDED.spawn_colonization_notes,
  bulk_colonization_notes = EXCLUDED.bulk_colonization_notes,
  pinning_notes = EXCLUDED.pinning_notes,
  maturation_notes = EXCLUDED.maturation_notes,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- ----------------------------------------------------------------------------
-- Psilocybe ovoideocystidiata - Wood-loving species (INDOOR cultivation)
-- ----------------------------------------------------------------------------
INSERT INTO species (
  name, scientific_name, common_names, category, difficulty,
  spawn_colonization, bulk_colonization, pinning, maturation,
  preferred_substrates, substrate_notes, characteristics,
  community_tips, important_facts, typical_yield, flush_count,
  shelf_life_days_min, shelf_life_days_max,
  automation_config, spawn_colonization_notes, bulk_colonization_notes,
  pinning_notes, maturation_notes, notes, user_id
)
VALUES (
  'Psilocybe ovoideocystidiata',
  'Psilocybe ovoideocystidiata',
  ARRAY['Ovoids', 'Ovos', 'Ohio Valley Shroom'],
  'research',
  'advanced',
  -- SPAWN COLONIZATION JSONB
  '{
    "tempRange": {
      "min": 55,
      "max": 75,
      "optimal": 65,
      "warningLow": 50,
      "warningHigh": 78,
      "criticalLow": 45,
      "criticalHigh": 80,
      "rampRate": 1,
      "notes": "Much cooler than cubensis - damages above 80°F"
    },
    "humidityRange": {
      "min": null,
      "max": null,
      "optimal": null,
      "notes": "Substrate moisture only"
    },
    "co2Range": {
      "min": 0,
      "max": 15000,
      "optimal": 8000,
      "warningHigh": 20000,
      "criticalHigh": 30000,
      "unit": "ppm",
      "tolerance": "high"
    },
    "daysMin": 14,
    "daysMax": 42,
    "daysTypical": 28,
    "lightRequirement": "none",
    "lightSchedule": {
      "photoperiod": 0,
      "intensity": "none"
    },
    "faeFrequency": "minimal",
    "spawnSubstrates": {
      "grain": ["Rye grain", "Oats", "Millet"],
      "wood": ["BRF + hardwood sawdust (RR Cakes)", "Hardwood pellets (expanded)"],
      "recommended": "LC to grain for faster results"
    },
    "transitionCriteria": {
      "minDays": 14,
      "maxDays": 42,
      "typicalDays": 28,
      "colonizationPercent": 100,
      "visualIndicators": [
        "Complete colonization",
        "White ropy mycelium",
        "Wood substrates may show aerial mycelium"
      ],
      "autoTransition": false,
      "transitionAlertDays": 5
    },
    "criticalParameters": ["temperature"],
    "equipmentNotes": "Keep COOL - below 75°F. Wood-based substrates work better than pure grain.",
    "comparisonToCubensis": "10-15°F COOLER than cubensis. Different species entirely.",
    "dataConfidence": "well_documented"
  }'::jsonb,
  -- BULK COLONIZATION JSONB
  '{
    "tempRange": {
      "min": 55,
      "max": 72,
      "optimal": 64,
      "warningLow": 50,
      "warningHigh": 75,
      "criticalLow": 45,
      "criticalHigh": 78,
      "rampRate": 1
    },
    "humidityRange": {
      "min": 80,
      "max": 95,
      "optimal": 88,
      "warningLow": 75,
      "warningHigh": 98,
      "criticalLow": 70,
      "criticalHigh": 100,
      "rampRate": 5
    },
    "co2Range": {
      "min": 0,
      "max": 12000,
      "optimal": 6000,
      "warningHigh": 18000,
      "criticalHigh": 25000,
      "unit": "ppm"
    },
    "daysMin": 28,
    "daysMax": 90,
    "daysTypical": 60,
    "lightRequirement": "indirect",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "low",
      "spectrum": "cool"
    },
    "faeFrequency": "2x daily",
    "substrateRecipe": {
      "woodComponent": "70-80% hardwood chips/sawdust",
      "supplements": "10-20% coir, vermiculite, straw",
      "nitrogen": "5-10% bran, soybean hulls (optional)",
      "mineral": "1-2% gypsum",
      "preferredWoods": ["Oak", "Hickory", "Maple", "Alder", "Beech", "Birch", "Box elder"],
      "avoidWoods": ["Pine", "Cedar", "Fir - contain antifungal resins"]
    },
    "casingLayer": {
      "highlyBeneficial": true,
      "composition": "Peat moss + vermiculite + worm castings, or sandy soil/river mud",
      "notes": "Mimics natural floodplain habitat"
    },
    "transitionCriteria": {
      "minDays": 28,
      "maxDays": 90,
      "typicalDays": 60,
      "colonizationPercent": 100,
      "visualIndicators": [
        "Substrate fully colonized",
        "White mycelium throughout wood chips",
        "May need cold shock to initiate fruiting"
      ],
      "autoTransition": false,
      "transitionAlertDays": 10
    },
    "criticalParameters": ["temperature", "wood_substrate"],
    "equipmentNotes": "Wood-based substrates essential. Long colonization period - 1-3 months.",
    "dataConfidence": "community_consensus"
  }'::jsonb,
  -- PINNING JSONB
  '{
    "tempRange": {
      "min": 40,
      "max": 60,
      "optimal": 52,
      "warningLow": 35,
      "warningHigh": 65,
      "criticalLow": 32,
      "criticalHigh": 70,
      "rampRate": 2,
      "notes": "COLD - more tolerant of warmth than azurescens/cyanescens but still needs cool temps"
    },
    "humidityRange": {
      "min": 85,
      "max": 98,
      "optimal": 92,
      "warningLow": 80,
      "warningHigh": 100,
      "criticalLow": 75,
      "criticalHigh": 100,
      "rampRate": 3
    },
    "co2Range": {
      "min": 400,
      "max": 2000,
      "optimal": 1000,
      "warningHigh": 3000,
      "criticalHigh": 5000,
      "unit": "ppm"
    },
    "daysMin": 7,
    "daysMax": 28,
    "daysTypical": 14,
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "medium",
      "spectrum": "cool"
    },
    "faeFrequency": "4-6x daily",
    "coldShock": {
      "required": "LIKELY REQUIRED for indoor cultivation",
      "tempRange": "35-50°F",
      "duration": "Several days to weeks",
      "notes": "Multiple reports of strong vegetative growth but failure to fruit indoors without cold shock"
    },
    "seasonalSimulation": {
      "needed": true,
      "notes": "Mini-fridge setups more successful than room temperature cultivation"
    },
    "transitionCriteria": {
      "minDays": 7,
      "maxDays": 28,
      "typicalDays": 14,
      "visualIndicators": [
        "Primordia emerging from substrate",
        "Small pins visible",
        "Response to cold shock"
      ],
      "autoTransition": true,
      "transitionAlertDays": 5
    },
    "criticalParameters": ["cold_shock", "temperature"],
    "equipmentNotes": "REFRIGERATION or cold room likely required for indoor fruiting. Mini-fridge setups work.",
    "indoorSuccessRate": "Low to moderate without proper cold shock",
    "comparisonToOtherWoodLovers": "More tolerant of warmer fruiting temps than P. cyanescens/azurescens (which require 40-65°F)",
    "dataConfidence": "limited_reports"
  }'::jsonb,
  -- MATURATION JSONB
  '{
    "tempRange": {
      "min": 45,
      "max": 65,
      "optimal": 55,
      "warningLow": 40,
      "warningHigh": 68,
      "criticalLow": 35,
      "criticalHigh": 72,
      "rampRate": 2
    },
    "humidityRange": {
      "min": 85,
      "max": 98,
      "optimal": 92,
      "warningLow": 80,
      "warningHigh": 100,
      "criticalLow": 75,
      "criticalHigh": 100,
      "rampRate": 3
    },
    "co2Range": {
      "min": 400,
      "max": 2500,
      "optimal": 1200,
      "warningHigh": 4000,
      "criticalHigh": 6000,
      "unit": "ppm"
    },
    "daysMin": 7,
    "daysMax": 28,
    "daysTypical": 14,
    "lightRequirement": "12hr_cycle",
    "lightSchedule": {
      "photoperiod": 12,
      "intensity": "medium",
      "spectrum": "cool"
    },
    "faeFrequency": "4-6x daily",
    "harvestIndicators": {
      "primary": "Veil break",
      "secondary": [
        "Cap convex → flattening",
        "Intense blue bruising",
        "Caramel/chestnut color when moist → pale buff when dry"
      ]
    },
    "transitionCriteria": {
      "minDays": 7,
      "maxDays": 28,
      "typicalDays": 14,
      "visualIndicators": [
        "Veil stretching/breaking",
        "Caps maturing",
        "Strong blue bruising"
      ],
      "autoTransition": false,
      "transitionAlertDays": 2
    },
    "criticalParameters": ["temperature", "humidity"],
    "flushInfo": {
      "typicalFlushes": "2-4",
      "notes": "Wood substrates can produce for extended periods",
      "daysBetweenFlushes": "10-14"
    },
    "dataConfidence": "limited_reports"
  }'::jsonb,
  -- PREFERRED SUBSTRATES
  ARRAY['Hardwood chips/sawdust', 'Oak sawdust', 'Alder chips', 'Maple sawdust'],
  -- SUBSTRATE NOTES
  'WOOD-BASED SUBSTRATES REQUIRED. Recipe: 70-80% hardwood chips/sawdust, 10-20% supplements (coir, vermiculite, straw), 5-10% nitrogen supplement (bran, soybean hulls) optional, 1-2% gypsum. Preferred woods: oak, hickory, maple, alder, beech, birch, box elder. AVOID SOFTWOODS (pine, cedar, fir - contain antifungal resins). Casing layer highly beneficial - peat/verm/worm castings or sandy soil/river mud mimics natural floodplain habitat. Optimal substrate pH: 5.0-6.5 (slightly acidic, typical for wood-lovers).',
  -- CHARACTERISTICS
  'Wood-loving species native to Ohio River Valley and spreading along East Coast. Caramel to chestnut colored caps when moist, pale buff when dry. Strong blue bruising reaction. Fruits in cool weather (spring/fall in wild). More temperature tolerant for fruiting than P. cyanescens/azurescens but still needs cool temps. Higher contamination resistance than cubensis on wood substrates.',
  -- COMMUNITY TIPS
  'Indoor cultivation challenging - cold shock/seasonal simulation likely required for fruiting. Multiple academic and forum reports document strong vegetative growth but FAILURE TO FRUIT INDOORS without cold shock. Mini-fridge setups more successful than room temperature cultivation. Semi-outdoor (cold garage, shed) yields more reliable results. More forgiving than other wood-lovers (cyanescens, azurescens) but still challenging indoors.',
  -- IMPORTANT FACTS
  'First described in 2003 from Pennsylvania. Spreading rapidly along East Coast and into Midwest. In wild, fruits April-June (sometimes fall) on wood chips, especially along riverbanks and mulched areas. Cool-weather species - temperatures above 80°F damage mycelium. More feasible for indoor cultivation than P. cyanescens or P. azurescens due to slightly warmer fruiting tolerance, but still requires cool temps and likely cold shock.',
  -- TYPICAL YIELD
  'Low to moderate indoors - outdoor/semi-outdoor more productive',
  -- FLUSH COUNT
  '2-4 typical on wood substrates',
  -- SHELF LIFE
  5, 10,
  -- AUTOMATION CONFIG
  '{
    "automationTested": false,
    "automationNotes": "REQUIRES REFRIGERATION capability for cold shock and cool fruiting temps. Wood-based substrates have different dynamics than CVG. More complex automation needs than cubensis.",
    "requiredSensors": ["temperature", "humidity"],
    "optionalSensors": ["co2", "light"],
    "controllerTypes": ["refrigeration unit", "humidifier", "fan", "lighting timer"],
    "alertOnTempDeviation": 5,
    "alertOnHumidityDeviation": 10,
    "alertOnStageDuration": true,
    "sensorPollingInterval": 600,
    "dataRetentionDays": 365,
    "specialConsiderations": ["refrigeration_required", "cold_shock", "wood_substrate", "extended_timeline"]
  }'::jsonb,
  -- SPAWN COLONIZATION NOTES
  'SPAWN COLONIZATION (55-75°F, 14-42 days): MUCH COOLER than cubensis - keep below 75°F, optimal around 65°F. Above 80°F damages mycelium. Grain spawn works (rye, oats, millet) but wood-based spawn often better (BRF + hardwood sawdust "RR Cakes," expanded hardwood pellets). LC to grain recommended for faster results. Colonization takes 2-6 weeks depending on substrate.',
  -- BULK COLONIZATION NOTES
  'BULK COLONIZATION (55-72°F, 4-12 weeks): Wood-based bulk substrate required. Recipe: 70-80% hardwood chips/sawdust, 10-20% supplements, 5-10% nitrogen (optional), 1-2% gypsum. Use hardwoods ONLY (oak, maple, alder, beech). AVOID softwoods (pine, cedar, fir). Casing layer highly beneficial - peat/verm/worm castings or sandy soil mimics floodplain habitat. Extended colonization - expect 1-3 months for full colonization.',
  -- PINNING NOTES
  'PINNING (40-60°F, 7-28 days): COLD SHOCK LIKELY REQUIRED for indoor fruiting. Multiple reports of strong vegetative growth but failure to fruit without cold exposure. Cold shock: 35-50°F for several days to weeks. More temperature tolerant than P. cyanescens/azurescens (which need 40-65°F) but still needs cool temps. Mini-fridge setups more successful than room temp. Semi-outdoor (cold garage, shed, basement) often more reliable.',
  -- MATURATION NOTES
  'MATURATION (45-65°F, 7-28 days): Maintain cool fruiting temps. Harvest at veil break like standard mushrooms. Caramel/chestnut color when moist, pale buff when dry. Strong blue bruising. Wood substrates can produce multiple flushes over extended period. Indoor success rate low to moderate - outdoor/semi-outdoor more reliable.',
  -- NOTES
  'Wood-loving species requiring fundamentally different approach than cubensis. Cool temps required throughout. Cold shock likely essential for indoor fruiting. Best suited for cultivators with refrigeration capability or semi-outdoor setups. More feasible than P. cyanescens or P. azurescens for indoor work but still challenging. For advanced cultivators.',
  -- USER_ID
  NULL
)
ON CONFLICT (name)
DO UPDATE SET
  name = EXCLUDED.name,
  common_names = EXCLUDED.common_names,
  difficulty = EXCLUDED.difficulty,
  spawn_colonization = EXCLUDED.spawn_colonization,
  bulk_colonization = EXCLUDED.bulk_colonization,
  pinning = EXCLUDED.pinning,
  maturation = EXCLUDED.maturation,
  preferred_substrates = EXCLUDED.preferred_substrates,
  substrate_notes = EXCLUDED.substrate_notes,
  characteristics = EXCLUDED.characteristics,
  community_tips = EXCLUDED.community_tips,
  important_facts = EXCLUDED.important_facts,
  typical_yield = EXCLUDED.typical_yield,
  flush_count = EXCLUDED.flush_count,
  shelf_life_days_min = EXCLUDED.shelf_life_days_min,
  shelf_life_days_max = EXCLUDED.shelf_life_days_max,
  automation_config = EXCLUDED.automation_config,
  spawn_colonization_notes = EXCLUDED.spawn_colonization_notes,
  bulk_colonization_notes = EXCLUDED.bulk_colonization_notes,
  pinning_notes = EXCLUDED.pinning_notes,
  maturation_notes = EXCLUDED.maturation_notes,
  notes = EXCLUDED.notes,
  updated_at = NOW();


-- ============================================================================
-- STRAINS - P. cubensis varieties that follow BASELINE parameters
-- These strains do NOT have notably different cultivation requirements
-- ============================================================================

-- Get the P. cubensis baseline species ID for foreign key reference
-- We use a CTE to safely reference the species

WITH cubensis_baseline AS (
  SELECT id FROM species 
  WHERE scientific_name = 'Psilocybe cubensis' 
  AND category = 'research' 
  AND user_id IS NULL
  LIMIT 1
)
INSERT INTO strains (
  id, name, species_id, species, difficulty,
  colonization_days_min, colonization_days_max,
  fruiting_days_min, fruiting_days_max,
  optimal_temp_colonization, optimal_temp_fruiting,
  variety, phenotype, genetics_source, isolation_type,
  generation, origin, description, notes, user_id
)
SELECT
  uuid_generate_v4(),
  strain_data.name,
  cubensis_baseline.id,
  'Psilocybe cubensis',
  strain_data.difficulty,
  strain_data.col_min,
  strain_data.col_max,
  strain_data.fruit_min,
  strain_data.fruit_max,
  strain_data.temp_col,
  strain_data.temp_fruit,
  strain_data.variety,
  strain_data.phenotype,
  strain_data.genetics_source,
  strain_data.isolation_type,
  strain_data.generation,
  strain_data.origin,
  strain_data.description,
  strain_data.notes,
  NULL
FROM cubensis_baseline,
(VALUES
  -- Golden Teacher - The classic beginner strain
  ('Golden Teacher', 'beginner', 10, 14, 5, 10, 25, 22,
   NULL, 'Standard', 'Unknown - emerged 1980s', 'unknown', 0, 'Unknown',
   'Classic beginner-friendly strain with golden caps and moderate characteristics. Forgiving of environmental fluctuations. Reliable producer with balanced effects.',
   'The most recommended strain for beginners. Forgiving, reliable, and produces well under various conditions. Golden-colored caps with white spots when young. Named for allegedly "teaching" users about mushroom cultivation and effects.'
  ),
  
  -- B+ - Fast and forgiving
  ('B+', 'beginner', 7, 12, 5, 10, 25, 22,
   NULL, 'Standard', 'Mr. G (reportedly)', 'unknown', 0, 'Florida (reportedly)',
   'Fast colonizing, forgiving strain with large fruits. One of the most popular strains for beginners. Caramel-colored caps.',
   'Extremely forgiving of temperature fluctuations. Fast colonizer with aggressive mycelium. Produces large fruits. Some debate about origins but widely available and reliable. Good for first-time growers.'
  ),
  
  -- Mazatapec - Traditional Mexican strain
  ('Mazatapec', 'beginner', 10, 16, 7, 12, 25, 22,
   NULL, 'Standard', 'Wild collection', 'unknown', 0, 'Mazatec region, Oaxaca, Mexico',
   'Traditional Mexican strain from Mazatec indigenous peoples. Spiritual significance. Moderate colonization speed.',
   'One of the original strains used in traditional ceremonies. Named after the Mazatec people of Oaxaca. Slightly slower colonization but reliable. Often described as having "spiritual" character.'
  ),
  
  -- Ecuador - High altitude origin
  ('Ecuador', 'beginner', 10, 14, 5, 10, 25, 22,
   NULL, 'Standard', 'Wild collection', 'unknown', 0, 'Highlands of Ecuador',
   'High-altitude strain from Ecuador. Robust and forgiving. Large golden caps.',
   'Collected from high elevations in Ecuador. Adapted to cooler conditions. Produces large, meaty fruits. Very forgiving of temperature fluctuations. Good beginner strain.'
  ),
  
  -- Cambodian - Fast colonizer
  ('Cambodian', 'beginner', 7, 10, 5, 8, 26, 23,
   NULL, 'Standard', 'John Allen', 'unknown', 0, 'Angkor Wat, Cambodia',
   'Very fast colonizing strain from Cambodia. Small to medium fruits. Aggressive mycelium.',
   'Collected near Angkor Wat. One of the fastest colonizing strains available. Produces many small to medium fruits rather than fewer large ones. Very aggressive mycelium resistant to contamination.'
  ),
  
  -- Thai - Tropical fast grower
  ('Thai', 'beginner', 7, 12, 5, 10, 26, 23,
   NULL, 'Standard', 'Wild collection', 'unknown', 0, 'Thailand',
   'Tropical Thai strain with fast colonization. Prefers slightly warmer temperatures. Tall, slender fruits.',
   'Thai strains prefer slightly warmer temps than other cubensis (up to 80°F colonization). Fast colonizer. Produces tall, slender fruits. Multiple sub-varieties exist (Pink Buffalo, Koh Samui, etc.).'
  ),
  
  -- Koh Samui - Thai island variety
  ('Koh Samui', 'beginner', 7, 12, 5, 10, 26, 23,
   'Super Strain', 'Standard', 'John Allen', 'unknown', 0, 'Koh Samui Island, Thailand',
   'Thai island variety known for fast colonization and robust growth. "Super Strain" variety available.',
   'From the island of Koh Samui in Thailand. Fast colonizer. "Koh Samui Super Strain" (KSSS) is an isolated variety known for large fruits and fast growth. Prefers warmer temps.'
  ),
  
  -- PES Amazonian - South American classic
  ('PES Amazonian', 'beginner', 10, 14, 5, 10, 25, 22,
   NULL, 'Standard', 'Pacific Exotica Spora', 'unknown', 0, 'Amazon Basin',
   'Large fruiting South American strain. Robust and reliable. Known for big flushes.',
   'PES = Pacifica Exotica Spora (original vendor). Produces large fruits. Robust against contamination. Reliable producer. One of the classic strains from the Amazon region.'
  ),
  
  -- Z-Strain - Aggressive colonizer
  ('Z-Strain', 'beginner', 7, 10, 5, 8, 25, 22,
   NULL, 'Standard', 'Unknown', 'unknown', 0, 'Unknown',
   'Extremely aggressive colonizing strain. Fast and contamination-resistant. Produces many fruits.',
   'Origin unknown but popular for its extremely fast colonization and contamination resistance. Aggressive rhizomorphic growth. Produces many medium-sized fruits. Good for beginners wanting fast results.'
  ),
  
  -- Treasure Coast - Florida coastal strain
  ('Treasure Coast', 'beginner', 10, 14, 5, 10, 25, 22,
   NULL, 'Standard', 'Wild collection', 'unknown', 0, 'Florida Gulf Coast, USA',
   'Florida coastal strain. Reliable producer with medium-sized fruits. Sometimes produces albino mutations.',
   'Collected from Florida Gulf Coast cattle pastures. Reliable and forgiving. Known to occasionally produce albino or leucistic mutations within normal grows. Good beginner strain.'
  ),
  
  -- Albino A+ - Leucistic variety
  ('Albino A+', 'intermediate', 12, 18, 7, 12, 25, 22,
   'Leucistic', 'Leucistic/Albino', 'Unknown', 'unknown', 0, 'Unknown',
   'Leucistic (white) variety. Slightly slower colonization. Ghostly white appearance.',
   'Leucistic mutation with white/cream coloration. Slightly slower than pigmented varieties. Not true albino (produces dark spores). Popular for its ghostly appearance. Moderate difficulty increase.'
  ),
  
  -- Alacabenzi - Mexican-Alabama hybrid
  ('Alacabenzi', 'beginner', 10, 14, 5, 10, 25, 22,
   'Hybrid', 'Standard', 'Unknown', 'unknown', 0, 'Mexican x Alabama cross',
   'Hybrid strain known for large fruits and easy cultivation. Reportedly Mexican x Alabama genetics.',
   'Hybrid reportedly created from Mexican and Alabama strains. Known for producing very large fruits. Easy to cultivate. Sometimes shows mutations within grows. Good beginner strain despite hybrid origins.'
  ),
  
  -- Texas - Southern US strain
  ('Texas', 'beginner', 10, 14, 5, 10, 25, 22,
   NULL, 'Standard', 'Wild collection', 'unknown', 0, 'Texas, USA',
   'Southern US strain from Texas cattle pastures. Medium-sized fruits. Reliable producer.',
   'Collected from Texas cattle pastures. Adapted to hot, dry conditions but grows well in standard cultivation. Reliable producer. Medium-sized fruits. Good beginner strain.'
  ),
  
  -- Costa Rican - Central American strain
  ('Costa Rican', 'beginner', 10, 14, 5, 10, 25, 22,
   NULL, 'Standard', 'Wild collection', 'unknown', 0, 'Costa Rica',
   'Central American strain. Moderate characteristics. Reliable and forgiving.',
   'Collected from Costa Rica. Well-balanced characteristics without extreme traits. Reliable producer. Good choice for beginners wanting something other than the most common strains.'
  ),
  
  -- Tidal Wave - Fast B+ x PE hybrid
  ('Tidal Wave', 'beginner', 7, 12, 5, 10, 25, 22,
   'Hybrid', 'Standard', 'Doma Nunzio/Magic Myco', 'unknown', 0, 'B+ x Penis Envy cross',
   'Fast-colonizing hybrid of B+ and Penis Envy. Combines B+ ease with PE characteristics. Very contamination resistant.',
   'Created by Doma Nunzio (Magic Myco) in 2017. Combines B+ speed and ease with Penis Envy potency. Very fast colonizer. High contamination resistance. Wavy cap margins characteristic. Note: Enigma is a mutation OF Tidal Wave.'
  )
) AS strain_data(name, difficulty, col_min, col_max, fruit_min, fruit_max, temp_col, temp_fruit, variety, phenotype, genetics_source, isolation_type, generation, origin, description, notes)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- STRAINS - Varieties under Penis Envy species entry
-- ============================================================================

WITH pe_species AS (
  SELECT id FROM species 
  WHERE scientific_name = 'Psilocybe cubensis var. Penis Envy' 
  AND category = 'research' 
  AND user_id IS NULL
  LIMIT 1
)
INSERT INTO strains (
  id, name, species_id, species, difficulty,
  colonization_days_min, colonization_days_max,
  fruiting_days_min, fruiting_days_max,
  optimal_temp_colonization, optimal_temp_fruiting,
  variety, phenotype, genetics_source, isolation_type,
  generation, origin, description, notes, user_id
)
SELECT
  uuid_generate_v4(),
  strain_data.name,
  pe_species.id,
  'Psilocybe cubensis var. Penis Envy',
  strain_data.difficulty,
  strain_data.col_min,
  strain_data.col_max,
  strain_data.fruit_min,
  strain_data.fruit_max,
  strain_data.temp_col,
  strain_data.temp_fruit,
  strain_data.variety,
  strain_data.phenotype,
  strain_data.genetics_source,
  strain_data.isolation_type,
  strain_data.generation,
  strain_data.origin,
  strain_data.description,
  strain_data.notes,
  NULL
FROM pe_species,
(VALUES
  -- Penis Envy Uncut - More veiled PE variant
  ('Penis Envy Uncut', 'intermediate', 14, 28, 10, 21, 25, 22,
   'Uncut', 'More veiled', 'PE mutation', 'clone', 0, 'PE mutation',
   'PE variant with more prominent veil that often does not separate from cap. Slightly easier harvest timing than standard PE.',
   'Mutation of Penis Envy where veil remains more attached. Some growers find harvest timing easier due to more visible veil. Otherwise similar cultivation to standard PE.'
  ),
  
  -- Melmac - Original PE genetics
  ('Melmac', 'intermediate', 14, 28, 10, 21, 25, 22,
   'Original', 'Wavy caps, contorted', 'Homestead (original PE)', 'clone', 0, 'Original PE lineage',
   'Reportedly original Penis Envy genetics before widespread distribution. Wavy, contorted caps. Some consider it the "true" PE.',
   'Melmac is said to be from the original Homestead spore vendor PE genetics. Caps more wavy and contorted than modern PE. Some believe commercial PE drifted from original genetics and Melmac preserved them.'
  )
) AS strain_data(name, difficulty, col_min, col_max, fruit_min, fruit_max, temp_col, temp_fruit, variety, phenotype, genetics_source, isolation_type, generation, origin, description, notes)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- SCHEMA VERSION UPDATE
-- ============================================================================

-- Update schema version to track this seed data
UPDATE schema_version SET version = 18, updated_at = NOW() WHERE id = 1;


-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see this, the research species seed data was applied successfully!
--
-- SPECIES CREATED:
-- 1. Psilocybe cubensis (baseline) - Standard parameters for most strains
-- 2. Psilocybe cubensis var. Penis Envy - Slower, unique harvest indicators
-- 3. Psilocybe cubensis var. Albino Penis Envy - Slowest, highest difficulty
-- 4. Psilocybe cubensis var. Enigma - Blob mutation, fundamentally different
-- 5. Psilocybe cubensis var. Jack Frost - Leucistic, moderate differences
-- 6. Psilocybe ovoideocystidiata - Wood-lover, cold shock required
--
-- STRAINS CREATED (following baseline P. cubensis parameters):
-- - Golden Teacher, B+, Mazatapec, Ecuador, Cambodian
-- - Thai, Koh Samui, PES Amazonian, Z-Strain, Treasure Coast
-- - Albino A+, Alacabenzi, Texas, Costa Rican, Tidal Wave
--
-- PE-SPECIFIC STRAINS:
-- - Penis Envy Uncut, Melmac
--
-- All data includes comprehensive JSONB cultivation parameters with:
-- - Temperature ranges (min/max/optimal/warning/critical) in Fahrenheit
-- - Humidity ranges
-- - CO2 ranges
-- - Duration estimates
-- - Light requirements
-- - FAE requirements
-- - Transition criteria
-- - Confidence ratings (well_documented/community_consensus/limited_reports)
-- - Comparison to baseline notes
-- ============================================================================
