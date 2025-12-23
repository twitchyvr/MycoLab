-- ============================================================================
-- MycoLab Species Database Expansion: N-Z Species
-- Part 2 of 2 (See mycolab-research-species-A-M.sql for Part 1)
-- Generated: 2024
-- Sources: Academic literature, cultivation guides, vendor catalogs
-- ============================================================================

-- ============================================================================
-- PSILOCYBE NATALENSIS
-- South African subtropical species, excellent for cultivation
-- ============================================================================

INSERT INTO species (
    name,
    common_name,
    genus,
    description,
    native_habitat,
    cultivation_difficulty,
    typical_yield,
    notes
) VALUES (
    'Psilocybe natalensis',
    'Natal Super Strength',
    'Psilocybe',
    'South African subtropical species discovered in Natal province. Closely related to P. cubensis but considered more potent. Produces large, fleshy fruiting bodies with aggressive colonization. Popular in cultivation due to reliability and potency.',
    'South Africa (KwaZulu-Natal), subtropical grasslands, dung-enriched soils',
    'beginner',
    'high',
    'Often confused with P. cubensis. Responds well to standard cubensis cultivation techniques. May produce larger individual fruits than cubensis. Aggressive colonizer with good contamination resistance.'
) ON CONFLICT (name) DO UPDATE SET
    common_name = EXCLUDED.common_name,
    description = EXCLUDED.description,
    native_habitat = EXCLUDED.native_habitat,
    cultivation_difficulty = EXCLUDED.cultivation_difficulty,
    typical_yield = EXCLUDED.typical_yield,
    notes = EXCLUDED.notes;

INSERT INTO cultivation_parameters (
    species_id,
    parameter_type,
    min_value,
    max_value,
    optimal_value,
    unit,
    notes
) 
SELECT 
    s.id,
    params.parameter_type,
    params.min_value,
    params.max_value,
    params.optimal_value,
    params.unit,
    params.notes
FROM species s
CROSS JOIN (VALUES
    ('colonization_temperature', 24.0, 30.0, 27.0, '°C', 'Slightly warmer than cubensis preference'),
    ('fruiting_temperature', 21.0, 26.0, 23.0, '°C', 'Standard subtropical fruiting range'),
    ('humidity', 85.0, 95.0, 90.0, '%', 'High humidity required for fruiting'),
    ('colonization_time', 10.0, 21.0, 14.0, 'days', 'Fast colonizer, often quicker than cubensis'),
    ('fruiting_time', 5.0, 10.0, 7.0, 'days', 'Pins to harvest'),
    ('co2_tolerance', 1000.0, 3000.0, 2000.0, 'ppm', 'Moderate CO2 tolerance during colonization')
) AS params(parameter_type, min_value, max_value, optimal_value, unit, notes)
WHERE s.name = 'Psilocybe natalensis'
ON CONFLICT DO NOTHING;

INSERT INTO substrate_compatibility (
    species_id,
    substrate_type,
    compatibility_rating,
    notes
)
SELECT 
    s.id,
    substrates.substrate_type,
    substrates.compatibility_rating,
    substrates.notes
FROM species s
CROSS JOIN (VALUES
    ('rye_grain', 'excellent', 'Preferred spawn substrate, fast colonization'),
    ('brown_rice_flour', 'excellent', 'Works well for PF Tek approach'),
    ('wild_bird_seed', 'excellent', 'Economical spawn option'),
    ('coco_coir', 'excellent', 'Primary bulk substrate component'),
    ('vermiculite', 'excellent', 'Moisture retention in bulk substrate'),
    ('manure_based', 'excellent', 'Horse or cow manure highly compatible'),
    ('straw', 'good', 'Can be used as bulk substrate additive'),
    ('gypsum', 'good', 'Supplement at 2-5% for calcium and pH buffering')
) AS substrates(substrate_type, compatibility_rating, notes)
WHERE s.name = 'Psilocybe natalensis'
ON CONFLICT DO NOTHING;


-- ============================================================================
-- PSILOCYBE OVOIDEOCYSTIDIATA
-- Eastern US wood-lover, excellent for outdoor cultivation
-- ============================================================================

INSERT INTO species (
    name,
    common_name,
    genus,
    description,
    native_habitat,
    cultivation_difficulty,
    typical_yield,
    notes
) VALUES (
    'Psilocybe ovoideocystidiata',
    'Ovoid, Ovoids',
    'Psilocybe',
    'Wood-loving species formally described in 2003 from Pennsylvania. Native to Eastern US floodplains but spreading via landscaping wood chips. Named for distinctive ovoid-shaped cystidia. One of the easier wood-lovers to cultivate due to tolerance of warmer temperatures.',
    'Eastern United States (Pennsylvania, Ohio, Maryland, West Virginia, New York), Pacific Northwest, Europe. Floodplains, river banks, wood chip beds, urban landscapes.',
    'intermediate',
    'moderate',
    'Previously mistaken for P. caerulipes. Human-assisted spread through wood chip landscaping. More temperature tolerant than other wood-lovers. Can fruit year-round outdoors in mild climates. Cold shock triggers pinning. Outdoor wood chip beds preferred method.'
) ON CONFLICT (name) DO UPDATE SET
    common_name = EXCLUDED.common_name,
    description = EXCLUDED.description,
    native_habitat = EXCLUDED.native_habitat,
    cultivation_difficulty = EXCLUDED.cultivation_difficulty,
    typical_yield = EXCLUDED.typical_yield,
    notes = EXCLUDED.notes;

INSERT INTO cultivation_parameters (
    species_id,
    parameter_type,
    min_value,
    max_value,
    optimal_value,
    unit,
    notes
) 
SELECT 
    s.id,
    params.parameter_type,
    params.min_value,
    params.max_value,
    params.optimal_value,
    params.unit,
    params.notes
FROM species s
CROSS JOIN (VALUES
    ('colonization_temperature', 15.0, 24.0, 20.0, '°C', 'Room temperature acceptable, tolerates wider range than other wood-lovers'),
    ('fruiting_temperature', 10.0, 19.0, 15.0, '°C', 'Cool temperatures trigger pinning'),
    ('cold_shock_temperature', 4.0, 10.0, 10.0, '°C', 'Cold shock for 1 week triggers pinning, then raise to 19°C'),
    ('humidity', 85.0, 95.0, 90.0, '%', 'High humidity for fruiting'),
    ('colonization_time', 21.0, 60.0, 30.0, 'days', 'Slower than cubensis, approximately 1 month'),
    ('fruiting_season_start', 4.0, 4.0, 4.0, 'month', 'April start for outdoor fruiting'),
    ('fruiting_season_end', 6.0, 11.0, 6.0, 'month', 'Primary flush through mid-June, occasional to November')
) AS params(parameter_type, min_value, max_value, optimal_value, unit, notes)
WHERE s.name = 'Psilocybe ovoideocystidiata'
ON CONFLICT DO NOTHING;

INSERT INTO substrate_compatibility (
    species_id,
    substrate_type,
    compatibility_rating,
    notes
)
SELECT 
    s.id,
    substrates.substrate_type,
    substrates.compatibility_rating,
    substrates.notes
FROM species s
CROSS JOIN (VALUES
    ('hardwood_chips', 'excellent', 'Primary substrate - alder, oak, beech, birch preferred'),
    ('hardwood_sawdust', 'excellent', 'Indoor cultivation substrate'),
    ('wood_pellets', 'good', 'Hydrated hardwood fuel pellets work well'),
    ('coco_coir', 'good', 'Can be mixed with wood chips for moisture retention'),
    ('river_sand', 'good', 'Mimics natural floodplain habitat, add to substrate'),
    ('potting_soil', 'moderate', 'Can be added to outdoor beds'),
    ('straw', 'moderate', 'Supplementary substrate material'),
    ('cardboard', 'moderate', 'Can supplement wood chip beds')
) AS substrates(substrate_type, compatibility_rating, notes)
WHERE s.name = 'Psilocybe ovoideocystidiata'
ON CONFLICT DO NOTHING;

-- Potency data
INSERT INTO potency_data (
    species_id,
    compound,
    min_percentage,
    max_percentage,
    typical_percentage,
    measurement_method,
    notes
)
SELECT 
    s.id,
    potency.compound,
    potency.min_percentage,
    potency.max_percentage,
    potency.typical_percentage,
    potency.measurement_method,
    potency.notes
FROM species s
CROSS JOIN (VALUES
    ('psilocybin', 0.40, 0.60, 0.50, 'HPLC', 'Moderate-high potency for size'),
    ('psilocin', 0.01, 0.15, 0.05, 'HPLC', 'Usually present, variable'),
    ('baeocystin', 0.00, 0.05, 0.02, 'HPLC', 'Low concentrations typically detected')
) AS potency(compound, min_percentage, max_percentage, typical_percentage, measurement_method, notes)
WHERE s.name = 'Psilocybe ovoideocystidiata'
ON CONFLICT DO NOTHING;


-- ============================================================================
-- PSILOCYBE SEMILANCEATA
-- Liberty Cap - Most widely distributed, essentially uncultivable
-- ============================================================================

INSERT INTO species (
    name,
    common_name,
    genus,
    description,
    native_habitat,
    cultivation_difficulty,
    typical_yield,
    notes
) VALUES (
    'Psilocybe semilanceata',
    'Liberty Cap',
    'Psilocybe',
    'The most widely distributed psilocybin mushroom in the world and type species for genus Psilocybe. Described 1838 by Elias Magnus Fries. Iconic conical cap with distinctive nipple (papilla). Saprobic grassland species feeding on decaying grass roots. One of the most potent naturally occurring psilocybin mushrooms.',
    'Throughout Europe, Pacific Northwest US/Canada, Central Asia, New Zealand, Chile. Upland pastures, meadows, acidic grasslands fertilized with sheep/cow dung. Associated with grasses Agrostis tenuis, Poa annua, Lolium perenne.',
    'expert',
    'none',
    'ESSENTIALLY IMPOSSIBLE TO CULTIVATE. Requires complex symbiotic relationship with specific grasses and acidic soil conditions (pH 4.0-6.0). Indoor attempts rarely succeed. May form sclerotia as wildfire protection. Experienced cultivators describe as "impossible to do" - most turn to other species. Outdoor inoculation of natural pastures only viable approach.'
) ON CONFLICT (name) DO UPDATE SET
    common_name = EXCLUDED.common_name,
    description = EXCLUDED.description,
    native_habitat = EXCLUDED.native_habitat,
    cultivation_difficulty = EXCLUDED.cultivation_difficulty,
    typical_yield = EXCLUDED.typical_yield,
    notes = EXCLUDED.notes;

INSERT INTO cultivation_parameters (
    species_id,
    parameter_type,
    min_value,
    max_value,
    optimal_value,
    unit,
    notes
) 
SELECT 
    s.id,
    params.parameter_type,
    params.min_value,
    params.max_value,
    params.optimal_value,
    params.unit,
    params.notes
FROM species s
CROSS JOIN (VALUES
    ('fruiting_temperature', 5.0, 15.0, 10.0, '°C', 'Cool autumn temperatures, natural outdoor only'),
    ('soil_ph', 4.0, 6.0, 5.0, 'pH', 'Strongly acidic soil required'),
    ('soil_organic_carbon', 5.0, 15.0, 10.0, '%', 'Moderate organic carbon content'),
    ('fruiting_season_start', 9.0, 9.0, 9.0, 'month', 'September-November primary season'),
    ('fruiting_season_end', 11.0, 11.0, 11.0, 'month', 'Occasionally July or spring')
) AS params(parameter_type, min_value, max_value, optimal_value, unit, notes)
WHERE s.name = 'Psilocybe semilanceata'
ON CONFLICT DO NOTHING;

INSERT INTO substrate_compatibility (
    species_id,
    substrate_type,
    compatibility_rating,
    notes
)
SELECT 
    s.id,
    substrates.substrate_type,
    substrates.compatibility_rating,
    substrates.notes
FROM species s
CROSS JOIN (VALUES
    ('grass_roots', 'required', 'Saprobic on decaying grass roots - Agrostis, Poa, Lolium species'),
    ('aged_hay_compost', 'experimental', 'Topdress natural pastures only - no indoor success'),
    ('pasture_soil', 'required', 'Acidic pasture soil with proper grass species essential'),
    ('standard_substrates', 'incompatible', 'Does not grow on typical cultivation substrates')
) AS substrates(substrate_type, compatibility_rating, notes)
WHERE s.name = 'Psilocybe semilanceata'
ON CONFLICT DO NOTHING;

-- Potency data - one of the most potent
INSERT INTO potency_data (
    species_id,
    compound,
    min_percentage,
    max_percentage,
    typical_percentage,
    measurement_method,
    notes
)
SELECT 
    s.id,
    potency.compound,
    potency.min_percentage,
    potency.max_percentage,
    potency.typical_percentage,
    potency.measurement_method,
    potency.notes
FROM species s
CROSS JOIN (VALUES
    ('psilocybin', 0.80, 1.80, 1.10, 'HPLC', 'One of the most potent naturally occurring - typically 1.0-1.2%'),
    ('psilocin', 0.00, 0.10, 0.02, 'HPLC', 'Usually absent or very low'),
    ('baeocystin', 0.01, 0.10, 0.05, 'HPLC', 'Present in low concentrations')
) AS potency(compound, min_percentage, max_percentage, typical_percentage, measurement_method, notes)
WHERE s.name = 'Psilocybe semilanceata'
ON CONFLICT DO NOTHING;


-- ============================================================================
-- PSILOCYBE TAMPANENSIS
-- Philosopher's Stones - sclerotia producer
-- ============================================================================

INSERT INTO species (
    name,
    common_name,
    genus,
    description,
    native_habitat,
    cultivation_difficulty,
    typical_yield,
    notes
) VALUES (
    'Psilocybe tampanensis',
    'Philosophers Stones, Magic Truffles',
    'Psilocybe',
    'Extremely rare species discovered 1977 by Steven Pollock near Tampa, Florida - single specimen. Not found in wild again until 2021 (44 years). All cultivation derives from original 1977 clone. Famous for producing sclerotia (truffles) - hardened mycelial masses. Legal in Netherlands as sclerotia while mushrooms banned. Paul Stamets developed sclerotia cultivation method in 1980s.',
    'Sandy meadows, deciduous forests - Florida, Mississippi. Extremely rare in wild.',
    'intermediate',
    'moderate',
    'Primary value is sclerotia production, not mushroom fruiting. Sclerotia form as protection mechanism. Pollock granted US patent 1981 for sclerotia production. 3-4 months minimum for sclerotia development, up to 12 months for larger stones. Taste described as bitter, walnut-like, tart and nutty.'
) ON CONFLICT (name) DO UPDATE SET
    common_name = EXCLUDED.common_name,
    description = EXCLUDED.description,
    native_habitat = EXCLUDED.native_habitat,
    cultivation_difficulty = EXCLUDED.cultivation_difficulty,
    typical_yield = EXCLUDED.typical_yield,
    notes = EXCLUDED.notes;

INSERT INTO cultivation_parameters (
    species_id,
    parameter_type,
    min_value,
    max_value,
    optimal_value,
    unit,
    notes
) 
SELECT 
    s.id,
    params.parameter_type,
    params.min_value,
    params.max_value,
    params.optimal_value,
    params.unit,
    params.notes
FROM species s
CROSS JOIN (VALUES
    ('colonization_temperature', 21.0, 25.0, 23.0, '°C', '70-77°F for colonization'),
    ('sclerotia_formation_temperature', 18.0, 24.0, 21.0, '°C', 'Room temperature, dark, undisturbed'),
    ('fruiting_temperature', 20.0, 24.0, 22.0, '°C', 'If fruiting mushrooms instead of sclerotia'),
    ('humidity', 90.0, 95.0, 95.0, '%', 'High humidity for mushroom fruiting'),
    ('colonization_time', 14.0, 28.0, 21.0, 'days', '2-4 weeks to full colonization'),
    ('sclerotia_formation_time', 90.0, 365.0, 180.0, 'days', '3-4 months minimum, 4-8 months optimal, up to 12 months for large stones'),
    ('substrate_water_ratio', 2.0, 2.0, 2.0, 'ratio', '10 parts grass seed : 5 parts water (2:1)')
) AS params(parameter_type, min_value, max_value, optimal_value, unit, notes)
WHERE s.name = 'Psilocybe tampanensis'
ON CONFLICT DO NOTHING;

INSERT INTO substrate_compatibility (
    species_id,
    substrate_type,
    compatibility_rating,
    notes
)
SELECT 
    s.id,
    substrates.substrate_type,
    substrates.compatibility_rating,
    substrates.notes
FROM species s
CROSS JOIN (VALUES
    ('grass_seed', 'excellent', 'Preferred substrate for sclerotia production'),
    ('rye_grain', 'excellent', 'Good for sclerotia and spawn'),
    ('wild_bird_seed', 'good', 'Alternative grain substrate'),
    ('straw', 'good', 'Can be used for sclerotia production'),
    ('peat_moss', 'good', 'Casing layer for mushroom fruiting - mix with vermiculite'),
    ('vermiculite', 'good', 'Casing layer component with calcium carbonate'),
    ('brown_rice_flour', 'moderate', 'Works but grass seed preferred for sclerotia')
) AS substrates(substrate_type, compatibility_rating, notes)
WHERE s.name = 'Psilocybe tampanensis'
ON CONFLICT DO NOTHING;

-- Potency data
INSERT INTO potency_data (
    species_id,
    compound,
    min_percentage,
    max_percentage,
    typical_percentage,
    measurement_method,
    notes
)
SELECT 
    s.id,
    potency.compound,
    potency.min_percentage,
    potency.max_percentage,
    potency.typical_percentage,
    potency.measurement_method,
    potency.notes
FROM species s
CROSS JOIN (VALUES
    ('psilocybin_sclerotia', 0.31, 0.68, 0.45, 'HPLC', 'Sclerotia potency - substrate dependent'),
    ('psilocybin_mushroom', 0.50, 1.00, 0.70, 'HPLC', 'Mushroom fruiting bodies higher potency'),
    ('psilocin', 0.01, 0.20, 0.10, 'HPLC', 'Present in both forms')
) AS potency(compound, min_percentage, max_percentage, typical_percentage, measurement_method, notes)
WHERE s.name = 'Psilocybe tampanensis'
ON CONFLICT DO NOTHING;


-- ============================================================================
-- PSILOCYBE SUBAERUGINOSA
-- Australian wood-lover, extremely potent
-- ============================================================================

INSERT INTO species (
    name,
    common_name,
    genus,
    description,
    native_habitat,
    cultivation_difficulty,
    typical_yield,
    notes
) VALUES (
    'Psilocybe subaeruginosa',
    'Subs, Golden Tops',
    'Psilocybe',
    'Described 1927 by John Burton Cleland from Australia. Name means "somewhat copper-rust colored" referring to blue-green bruising. One of the most potent naturally occurring psilocybin mushrooms - highest recorded at 1.93% psilocybin. Native to Australia and New Zealand. Wood-loving saprobe found in eucalyptus forests, pine plantations, urban wood chip gardens.',
    'Australia (Victoria, Tasmania, South Australia, NSW), New Zealand. Eucalyptus forests, pine plantations, urban gardens and parks with wood mulch.',
    'intermediate',
    'moderate',
    'Extremely potent - possibly most potent naturally occurring species. Woodlover Paralysis (WLP) possible. Outdoor cultivation preferred - wood chip beds can fruit for years. Similar techniques to P. azurescens and P. cyanescens. Requires cold shock to initiate pinning. Earliest collection June 1915 NSW.'
) ON CONFLICT (name) DO UPDATE SET
    common_name = EXCLUDED.common_name,
    description = EXCLUDED.description,
    native_habitat = EXCLUDED.native_habitat,
    cultivation_difficulty = EXCLUDED.cultivation_difficulty,
    typical_yield = EXCLUDED.typical_yield,
    notes = EXCLUDED.notes;

INSERT INTO cultivation_parameters (
    species_id,
    parameter_type,
    min_value,
    max_value,
    optimal_value,
    unit,
    notes
) 
SELECT 
    s.id,
    params.parameter_type,
    params.min_value,
    params.max_value,
    params.optimal_value,
    params.unit,
    params.notes
FROM species s
CROSS JOIN (VALUES
    ('colonization_temperature', 20.0, 30.0, 24.0, '°C', '68-75°F, can tolerate up to 30°C'),
    ('cold_shock_temperature', 4.0, 10.0, 10.0, '°C', 'Cold shock ~50°F for 1 week triggers pinning'),
    ('fruiting_temperature', 10.0, 20.0, 15.0, '°C', 'Raise to 65°F after cold shock, optimal 50-68°F'),
    ('humidity', 85.0, 95.0, 90.0, '%', 'Consistent high humidity required'),
    ('fruiting_season_start', 4.0, 4.0, 4.0, 'month', 'April start (Southern Hemisphere autumn)'),
    ('fruiting_season_end', 8.0, 8.0, 7.0, 'month', 'Through August, peak May-July')
) AS params(parameter_type, min_value, max_value, optimal_value, unit, notes)
WHERE s.name = 'Psilocybe subaeruginosa'
ON CONFLICT DO NOTHING;

INSERT INTO substrate_compatibility (
    species_id,
    substrate_type,
    compatibility_rating,
    notes
)
SELECT 
    s.id,
    substrates.substrate_type,
    substrates.compatibility_rating,
    substrates.notes
FROM species s
CROSS JOIN (VALUES
    ('eucalyptus_chips', 'excellent', 'Native substrate - eucalyptus wood chips preferred'),
    ('hardwood_chips', 'excellent', 'Alder, oak, other hardwoods work well'),
    ('pine_chips', 'good', 'Found in pine plantations naturally'),
    ('cardboard', 'good', 'Can supplement wood chip beds'),
    ('burlap', 'good', 'Layer in outdoor beds for moisture retention'),
    ('straw', 'moderate', 'Supplementary substrate'),
    ('wood_pellets', 'good', 'Hydrated hardwood fuel pellets')
) AS substrates(substrate_type, compatibility_rating, notes)
WHERE s.name = 'Psilocybe subaeruginosa'
ON CONFLICT DO NOTHING;

-- Potency data - extremely potent
INSERT INTO potency_data (
    species_id,
    compound,
    min_percentage,
    max_percentage,
    typical_percentage,
    measurement_method,
    notes
)
SELECT 
    s.id,
    potency.compound,
    potency.min_percentage,
    potency.max_percentage,
    potency.typical_percentage,
    potency.measurement_method,
    potency.notes
FROM species s
CROSS JOIN (VALUES
    ('psilocybin', 0.06, 1.93, 0.80, 'HPLC', 'Extremely variable - highest recorded 1.93%, possibly most potent natural species'),
    ('psilocin', 0.00, 0.17, 0.08, 'HPLC', 'Low to moderate psilocin content'),
    ('baeocystin', 0.01, 0.10, 0.05, 'HPLC', 'Multiple indole alkaloids present')
) AS potency(compound, min_percentage, max_percentage, typical_percentage, measurement_method, notes)
WHERE s.name = 'Psilocybe subaeruginosa'
ON CONFLICT DO NOTHING;


-- ============================================================================
-- PSILOCYBE WERAROA
-- New Zealand secotioid pouch fungus
-- ============================================================================

INSERT INTO species (
    name,
    common_name,
    genus,
    description,
    native_habitat,
    cultivation_difficulty,
    typical_yield,
    notes
) VALUES (
    'Psilocybe weraroa',
    'Blue Secotioid, Pouch Fungus',
    'Psilocybe',
    'Unique secotioid (pouch-like) fungus endemic to New Zealand. Formerly Weraroa novae-zelandiae. Unlike typical mushrooms, cap remains closed encasing gills. Closely related to P. cyanescens and P. subaeruginosa despite unusual morphology. First described 1924 by Gordon Cunningham. Reclassified to Psilocybe 2011 based on molecular phylogeny. Being cultivated commercially by Rua Bioscience for medical research integrating traditional Rongoā Māori medicine.',
    'New Zealand native forests. Decaying wood buried in leaf litter, rotting branches of mahoe (Melicytus ramiflorus), kahikatea, kohekohe, kawakawa, pine, tree fern fronds. Often near streams.',
    'expert',
    'low',
    'EXTREMELY CHALLENGING to cultivate. Highly specific environmental requirements. Spore prints impossible due to secotioid form - tissue cloning via agar required. Outdoor cultivation with native wood chips best approach but success rates very low. Indicator species for healthy forest regeneration. Evolved pouch shape possibly to be eaten by now-extinct moa for spore dispersal.'
) ON CONFLICT (name) DO UPDATE SET
    common_name = EXCLUDED.common_name,
    description = EXCLUDED.description,
    native_habitat = EXCLUDED.native_habitat,
    cultivation_difficulty = EXCLUDED.cultivation_difficulty,
    typical_yield = EXCLUDED.typical_yield,
    notes = EXCLUDED.notes;

INSERT INTO cultivation_parameters (
    species_id,
    parameter_type,
    min_value,
    max_value,
    optimal_value,
    unit,
    notes
) 
SELECT 
    s.id,
    params.parameter_type,
    params.min_value,
    params.max_value,
    params.optimal_value,
    params.unit,
    params.notes
FROM species s
CROSS JOIN (VALUES
    ('colonization_temperature', 15.0, 22.0, 18.0, '°C', 'Cool temperate conditions'),
    ('fruiting_temperature', 10.0, 18.0, 14.0, '°C', 'Cool temperatures, mild autumn best'),
    ('humidity', 85.0, 95.0, 90.0, '%', 'High humidity - near streams naturally'),
    ('light', 0.0, 1.0, 0.0, 'relative', 'Fruits buried in leaf litter - low light')
) AS params(parameter_type, min_value, max_value, optimal_value, unit, notes)
WHERE s.name = 'Psilocybe weraroa'
ON CONFLICT DO NOTHING;

INSERT INTO substrate_compatibility (
    species_id,
    substrate_type,
    compatibility_rating,
    notes
)
SELECT 
    s.id,
    substrates.substrate_type,
    substrates.compatibility_rating,
    substrates.notes
FROM species s
CROSS JOIN (VALUES
    ('native_nz_hardwood', 'excellent', 'Well-decayed tawa, mahoe, kahikatea preferred'),
    ('hardwood_chips_decayed', 'good', 'Must be well-rotted, not fresh'),
    ('tree_fern_fronds', 'good', 'Natural substrate - ponga fronds'),
    ('lignin_rich_mulch', 'good', 'High lignin content required'),
    ('fresh_sawdust', 'poor', 'Does not colonize fresh wood substrates'),
    ('standard_substrates', 'incompatible', 'Typical cultivation substrates fail')
) AS substrates(substrate_type, compatibility_rating, notes)
WHERE s.name = 'Psilocybe weraroa'
ON CONFLICT DO NOTHING;

-- Potency data
INSERT INTO potency_data (
    species_id,
    compound,
    min_percentage,
    max_percentage,
    typical_percentage,
    measurement_method,
    notes
)
SELECT 
    s.id,
    potency.compound,
    potency.min_percentage,
    potency.max_percentage,
    potency.typical_percentage,
    potency.measurement_method,
    potency.notes
FROM species s
CROSS JOIN (VALUES
    ('psilocybin', 0.16, 0.85, 0.50, 'HPLC', 'Estimated similar to P. cyanescens complex - empirical data limited'),
    ('psilocin', 0.03, 0.60, 0.30, 'HPLC', 'Estimated range based on related species')
) AS potency(compound, min_percentage, max_percentage, typical_percentage, measurement_method, notes)
WHERE s.name = 'Psilocybe weraroa'
ON CONFLICT DO NOTHING;


-- ============================================================================
-- PLUTEUS SALICINUS
-- Willow Shield - wood-loving, variable potency
-- ============================================================================

INSERT INTO species (
    name,
    common_name,
    genus,
    description,
    native_habitat,
    cultivation_difficulty,
    typical_yield,
    notes
) VALUES (
    'Pluteus salicinus',
    'Willow Shield',
    'Pluteus',
    'Wood-rotting psychoactive species outside Psilocybe genus. Described 1798 by Persoon. Contains psilocybin acquired via horizontal gene transfer - unrelated to Psilocybe lineage. Distinctive gray to bluish cap with pink spore print. Potency highly variable by region - some populations may lack psychoactive compounds. Free gills distinguish from Psilocybe species.',
    'Europe, North America, Russia. Decaying hardwood stumps and logs, especially willow (Salix), poplar, alder, beech. Moist deciduous forests, lowland to montane (up to 1200m).',
    'expert',
    'low',
    'EXTREMELY DIFFICULT to cultivate. Requires very well-decayed wood - does not colonize fresh substrates. Limited cultivation attempts documented. One reference to fruiting related P. cervinus on exhausted shiitake blocks. Variable psilocybin content - some populations weakly active, others moderate. Singer recognized non-bluing variety (var. achloes) possibly lacking psilocybin.'
) ON CONFLICT (name) DO UPDATE SET
    common_name = EXCLUDED.common_name,
    description = EXCLUDED.description,
    native_habitat = EXCLUDED.native_habitat,
    cultivation_difficulty = EXCLUDED.cultivation_difficulty,
    typical_yield = EXCLUDED.typical_yield,
    notes = EXCLUDED.notes;

INSERT INTO cultivation_parameters (
    species_id,
    parameter_type,
    min_value,
    max_value,
    optimal_value,
    unit,
    notes
) 
SELECT 
    s.id,
    params.parameter_type,
    params.min_value,
    params.max_value,
    params.optimal_value,
    params.unit,
    params.notes
FROM species s
CROSS JOIN (VALUES
    ('colonization_temperature', 15.0, 22.0, 18.0, '°C', 'Cool temperate conditions'),
    ('fruiting_temperature', 12.0, 20.0, 16.0, '°C', 'Summer through late autumn naturally'),
    ('humidity', 80.0, 95.0, 85.0, '%', 'Moist forest conditions'),
    ('fruiting_season_start', 6.0, 6.0, 6.0, 'month', 'Early summer start'),
    ('fruiting_season_end', 11.0, 11.0, 10.0, 'month', 'Through late autumn')
) AS params(parameter_type, min_value, max_value, optimal_value, unit, notes)
WHERE s.name = 'Pluteus salicinus'
ON CONFLICT DO NOTHING;

INSERT INTO substrate_compatibility (
    species_id,
    substrate_type,
    compatibility_rating,
    notes
)
SELECT 
    s.id,
    substrates.substrate_type,
    substrates.compatibility_rating,
    substrates.notes
FROM species s
CROSS JOIN (VALUES
    ('willow_wood_decayed', 'excellent', 'Preferred natural substrate - must be well-rotted'),
    ('poplar_wood_decayed', 'excellent', 'Common natural substrate'),
    ('alder_wood_decayed', 'good', 'Well-decayed alder works'),
    ('beech_wood_decayed', 'good', 'Decayed beech suitable'),
    ('exhausted_shiitake_blocks', 'experimental', 'One reported success with related P. cervinus'),
    ('fresh_sawdust', 'incompatible', 'Does not colonize fresh substrates'),
    ('standard_grain', 'poor', 'Limited colonization on typical spawn substrates')
) AS substrates(substrate_type, compatibility_rating, notes)
WHERE s.name = 'Pluteus salicinus'
ON CONFLICT DO NOTHING;

-- Potency data - highly variable
INSERT INTO potency_data (
    species_id,
    compound,
    min_percentage,
    max_percentage,
    typical_percentage,
    measurement_method,
    notes
)
SELECT 
    s.id,
    potency.compound,
    potency.min_percentage,
    potency.max_percentage,
    potency.typical_percentage,
    potency.measurement_method,
    potency.notes
FROM species s
CROSS JOIN (VALUES
    ('psilocybin', 0.05, 0.35, 0.15, 'HPLC', 'Highly variable - Stijve & Kuyper 1985: 0.05-0.25%, Christiansen 1984: 0.35%'),
    ('psilocin', 0.00, 0.02, 0.01, 'HPLC', 'Usually absent or trace amounts'),
    ('baeocystin', 0.00, 0.01, 0.004, 'HPLC', 'Zero to 0.008% reported')
) AS potency(compound, min_percentage, max_percentage, typical_percentage, measurement_method, notes)
WHERE s.name = 'Pluteus salicinus'
ON CONFLICT DO NOTHING;


-- ============================================================================
-- ADDITIONAL N-Z SPECIES FROM TRUE BLUE GENETICS CATALOG
-- Brief entries for species with limited cultivation data
-- ============================================================================

-- Psilocybe niveotropicalis
INSERT INTO species (
    name,
    common_name,
    genus,
    description,
    native_habitat,
    cultivation_difficulty,
    typical_yield,
    notes
) VALUES (
    'Psilocybe niveotropicalis',
    'Snow White Tropical',
    'Psilocybe',
    'Tropical Psilocybe species. Limited cultivation documentation available. Related to other tropical dung-loving species.',
    'Tropical regions, dung-enriched substrates',
    'intermediate',
    'moderate',
    'Limited published cultivation data. Likely responds to standard tropical Psilocybe cultivation techniques similar to P. cubensis.'
) ON CONFLICT (name) DO UPDATE SET
    common_name = EXCLUDED.common_name,
    description = EXCLUDED.description,
    native_habitat = EXCLUDED.native_habitat,
    cultivation_difficulty = EXCLUDED.cultivation_difficulty,
    notes = EXCLUDED.notes;

-- Psilocybe subtropicalis
INSERT INTO species (
    name,
    common_name,
    genus,
    description,
    native_habitat,
    cultivation_difficulty,
    typical_yield,
    notes
) VALUES (
    'Psilocybe subtropicalis',
    'Subtropical Psilocybe',
    'Psilocybe',
    'Subtropical species adapted to warmer climates with seasonal variation. May tolerate wider temperature ranges than strict tropical species.',
    'Subtropical regions, varied substrates',
    'intermediate',
    'moderate',
    'Limited published cultivation data. Subtropical adaptation may allow more temperature flexibility than tropical relatives.'
) ON CONFLICT (name) DO UPDATE SET
    common_name = EXCLUDED.common_name,
    description = EXCLUDED.description,
    native_habitat = EXCLUDED.native_habitat,
    cultivation_difficulty = EXCLUDED.cultivation_difficulty,
    notes = EXCLUDED.notes;


-- ============================================================================
-- DANGEROUS LOOKALIKES WARNING TABLE
-- Critical safety information for species identification
-- ============================================================================

CREATE TABLE IF NOT EXISTS dangerous_lookalikes (
    id SERIAL PRIMARY KEY,
    target_species_id INTEGER REFERENCES species(id),
    lookalike_name VARCHAR(255) NOT NULL,
    lookalike_genus VARCHAR(100),
    toxicity_level VARCHAR(50), -- 'deadly', 'toxic', 'psychoactive', 'inedible'
    distinguishing_features TEXT,
    toxins_present TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- P. semilanceata lookalikes
INSERT INTO dangerous_lookalikes (target_species_id, lookalike_name, lookalike_genus, toxicity_level, distinguishing_features, toxins_present, notes)
SELECT s.id, lookalike.name, lookalike.genus, lookalike.toxicity, lookalike.features, lookalike.toxins, lookalike.notes
FROM species s
CROSS JOIN (VALUES
    ('Galerina marginata', 'Galerina', 'deadly', 'Brown spore print (not purple-brown), ring on stem, grows on wood not grass', 'Amatoxins (α-amanitin)', 'DEADLY - causes liver failure. Never consume grassland mushrooms without spore print verification.'),
    ('Cortinarius rubellus', 'Cortinarius', 'deadly', 'Rusty brown spores, cortina (web-like veil), no blue bruising', 'Orellanine', 'DEADLY - causes irreversible kidney failure. Symptoms delayed 3-14 days.'),
    ('Panaeolina foenisecii', 'Panaeolina', 'inedible', 'Dark brown spore print, no blue bruising, cap margin lined', 'None significant', 'Common lawn mushroom, not toxic but not psychoactive. Sometimes called "mowers mushroom".'),
    ('Psathyrella species', 'Psathyrella', 'inedible', 'Dark spores, fragile flesh, no blue bruising', 'None significant', 'Various grassland species, generally not dangerous but not psychoactive.')
) AS lookalike(name, genus, toxicity, features, toxins, notes)
WHERE s.name = 'Psilocybe semilanceata'
ON CONFLICT DO NOTHING;

-- P. subaeruginosa lookalikes
INSERT INTO dangerous_lookalikes (target_species_id, lookalike_name, lookalike_genus, toxicity_level, distinguishing_features, toxins_present, notes)
SELECT s.id, lookalike.name, lookalike.genus, lookalike.toxicity, lookalike.features, lookalike.toxins, lookalike.notes
FROM species s
CROSS JOIN (VALUES
    ('Galerina marginata', 'Galerina', 'deadly', 'Brown spore print, prominent ring, typically smaller', 'Amatoxins (α-amanitin)', 'DEADLY - grows on same wood substrates. Always verify blue bruising and spore print.'),
    ('Hebeloma crustuliniforme', 'Hebeloma', 'toxic', 'Clay-brown spores, radish-like odor, slimy cap', 'Various toxins', 'Poison Pie - causes severe GI distress. No blue bruising.')
) AS lookalike(name, genus, toxicity, features, toxins, notes)
WHERE s.name = 'Psilocybe subaeruginosa'
ON CONFLICT DO NOTHING;

-- P. weraroa lookalikes
INSERT INTO dangerous_lookalikes (target_species_id, lookalike_name, lookalike_genus, toxicity_level, distinguishing_features, toxins_present, notes)
SELECT s.id, lookalike.name, lookalike.genus, lookalike.toxicity, lookalike.features, lookalike.toxins, lookalike.notes
FROM species s
CROSS JOIN (VALUES
    ('Cortinarius species (secotioid)', 'Cortinarius', 'potentially deadly', 'Lacks blue bruising, different spore color', 'Orellanine possible', 'Several secotioid Cortinarius in NZ forests may contain deadly toxins.'),
    ('Clavogaster virescens', 'Clavogaster', 'non-toxic', 'Naturally blue-green (not from bruising), stout smooth stem, no psychoactive properties', 'None', 'Similar habitat and appearance but no blue BRUISING reaction - naturally colored.'),
    ('Scleroderma species', 'Scleroderma', 'toxic', 'Hard peridium, dark spore mass, no blue bruising', 'Various', 'Earthballs - can cause GI distress. Very different texture.')
) AS lookalike(name, genus, toxicity, features, toxins, notes)
WHERE s.name = 'Psilocybe weraroa'
ON CONFLICT DO NOTHING;


-- ============================================================================
-- SPECIAL CULTIVATION TECHNIQUES TABLE
-- Advanced methods for specific species
-- ============================================================================

CREATE TABLE IF NOT EXISTS special_techniques (
    id SERIAL PRIMARY KEY,
    species_id INTEGER REFERENCES species(id),
    technique_name VARCHAR(255) NOT NULL,
    technique_type VARCHAR(100), -- 'cold_shock', 'outdoor', 'sclerotia', 'casing', etc.
    description TEXT,
    procedure TEXT,
    success_rate VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- P. ovoideocystidiata frozen mycelium technique
INSERT INTO special_techniques (species_id, technique_name, technique_type, description, procedure, success_rate, notes)
SELECT s.id, 
    'Frozen Mycelium Method',
    'cold_shock',
    'Freeze colonized substrate then thaw and case with sandy mud to mimic natural floodplain habitat',
    '1. Fully colonize grain spawn on wood chip substrate. 2. Freeze entire colonized substrate for 24-48 hours. 3. Thaw slowly at room temperature. 4. Apply casing layer of sandy mud/river substrate. 5. Maintain high humidity and wait for pinning.',
    'moderate',
    'Mimics natural freeze-thaw cycles in floodplain habitat. River sand/mud casing replicates natural growing conditions.'
FROM species s WHERE s.name = 'Psilocybe ovoideocystidiata'
ON CONFLICT DO NOTHING;

-- P. tampanensis sclerotia production
INSERT INTO special_techniques (species_id, technique_name, technique_type, description, procedure, success_rate, notes)
SELECT s.id,
    'Sclerotia (Truffle) Production',
    'sclerotia',
    'Standard method for producing philosopher stones - underground hardened mycelial masses',
    '1. Prepare substrate: 10 parts grass seed to 5 parts water. 2. Sterilize in pressure cooker at 15 psi for 1 hour. 3. Inoculate with spore syringe or agar culture. 4. Incubate at 21-25°C in dark. 5. Shake jars periodically during colonization (2-4 weeks). 6. STOP shaking after full colonization - leave completely undisturbed. 7. Wait 3-4 months minimum for sclerotia formation. 8. Optimal harvest at 4-8 months. 9. Store refrigerated 2-5°C in airtight containers.',
    'high',
    'Patience critical - rushing reduces yield. Can wait up to 12 months for larger stones. Periodic shaking during colonization speeds initial growth but must stop for sclerotia formation.'
FROM species s WHERE s.name = 'Psilocybe tampanensis'
ON CONFLICT DO NOTHING;

-- Wood-lover outdoor bed technique
INSERT INTO special_techniques (species_id, technique_name, technique_type, description, procedure, success_rate, notes)
SELECT s.id,
    'Outdoor Wood Chip Bed',
    'outdoor',
    'Preferred cultivation method for wood-loving species - establishes perennial fruiting patch',
    '1. Select shaded outdoor location with good drainage. 2. Prepare bed with 4-6 inches fresh hardwood chips. 3. Layer spawn throughout chips. 4. Cover with additional chip layer. 5. Maintain moisture - water during dry periods. 6. Wait for natural seasonal fruiting (requires cold period). 7. Beds can produce for multiple years with maintenance.',
    'moderate',
    'Patience required - may take full season to establish. Cold shock from natural autumn temperatures triggers fruiting. Add fresh chips annually to maintain.'
FROM species s WHERE s.name IN ('Psilocybe ovoideocystidiata', 'Psilocybe subaeruginosa')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================

-- Count species by difficulty
SELECT 
    cultivation_difficulty,
    COUNT(*) as species_count
FROM species
WHERE name IN (
    'Psilocybe natalensis',
    'Psilocybe ovoideocystidiata', 
    'Psilocybe semilanceata',
    'Psilocybe tampanensis',
    'Psilocybe subaeruginosa',
    'Psilocybe weraroa',
    'Pluteus salicinus',
    'Psilocybe niveotropicalis',
    'Psilocybe subtropicalis'
)
GROUP BY cultivation_difficulty
ORDER BY 
    CASE cultivation_difficulty 
        WHEN 'beginner' THEN 1 
        WHEN 'intermediate' THEN 2 
        WHEN 'expert' THEN 3 
    END;

-- ============================================================================
-- END OF N-Z SPECIES FILE
-- Total species in this file: 9
-- Combined with A-M file: 29 + 9 = 38 species total
-- ============================================================================