// ============================================================================
// DATA LOADER
// Optimized data loading for DataContext integration
// Provides parallel loading, caching, and transformation
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import { getDatabaseService } from './DatabaseService';
import { TABLE_CONFIGS, getDefaultLoadConfig } from './EntityLoader';
import { LookupMap, IndexedLookupMap } from './LookupMaps';
import type { LoadResult, RealtimePayload } from './types';

// Import types from store
import type {
  Species, Strain, Location, LocationType, LocationClassification,
  Container, SubstrateType, Supplier, InventoryCategory, InventoryItem,
  InventoryLot, PurchaseOrder, Culture, Grow, Recipe, Flush,
  RecipeCategoryItem, GrainType, PreparedSpawn, AppSettings,
} from '../../store/types';

// Import transformations
import {
  transformStrainFromDb,
  transformLocationTypeFromDb,
  transformLocationClassificationFromDb,
  transformLocationFromDb,
  transformContainerFromDb,
  transformSubstrateTypeFromDb,
  transformInventoryCategoryFromDb,
  transformInventoryItemFromDb,
  transformRecipeCategoryFromDb,
  transformCultureFromDb,
  transformGrowFromDb,
  transformRecipeFromDb,
  transformSupplierFromDb,
  transformFlushFromDb,
  transformGrainTypeFromDb,
  transformInventoryLotFromDb,
  transformPurchaseOrderFromDb,
  transformPreparedSpawnFromDb,
} from '../../store/transformations';

// ============================================================================
// DATA LOADER STATE
// ============================================================================

export interface DataLoaderState {
  species: Species[];
  strains: Strain[];
  locations: Location[];
  locationTypes: LocationType[];
  locationClassifications: LocationClassification[];
  suppliers: Supplier[];
  containers: Container[];
  substrateTypes: SubstrateType[];
  inventoryCategories: InventoryCategory[];
  inventoryItems: InventoryItem[];
  inventoryLots: InventoryLot[];
  purchaseOrders: PurchaseOrder[];
  recipeCategories: RecipeCategoryItem[];
  grainTypes: GrainType[];
  cultures: Culture[];
  preparedSpawn: PreparedSpawn[];
  grows: Grow[];
  flushes: Flush[];
  recipes: Recipe[];
  settings: AppSettings;
}

export interface DataLoaderResult {
  success: boolean;
  state: Partial<DataLoaderState>;
  timing: {
    totalMs: number;
    tables: Record<string, number>;
  };
  errors: string[];
}

// ============================================================================
// TRANSFORMATION MAP
// Maps table names to their transformation functions
// ============================================================================

const TRANSFORMATIONS: Record<string, (row: any) => any> = {
  strains: transformStrainFromDb,
  locations: transformLocationFromDb,
  location_types: transformLocationTypeFromDb,
  location_classifications: transformLocationClassificationFromDb,
  containers: transformContainerFromDb,
  substrate_types: transformSubstrateTypeFromDb,
  inventory_categories: transformInventoryCategoryFromDb,
  inventory_items: transformInventoryItemFromDb,
  inventory_lots: transformInventoryLotFromDb,
  purchase_orders: transformPurchaseOrderFromDb,
  recipe_categories: transformRecipeCategoryFromDb,
  grain_types: transformGrainTypeFromDb,
  cultures: transformCultureFromDb,
  prepared_spawn: transformPreparedSpawnFromDb,
  grows: transformGrowFromDb,
  flushes: transformFlushFromDb,
  recipes: transformRecipeFromDb,
  suppliers: transformSupplierFromDb,
};

// Map from DB table names to state property names
const TABLE_TO_STATE: Record<string, keyof DataLoaderState> = {
  species: 'species',
  strains: 'strains',
  locations: 'locations',
  location_types: 'locationTypes',
  location_classifications: 'locationClassifications',
  suppliers: 'suppliers',
  containers: 'containers',
  substrate_types: 'substrateTypes',
  inventory_categories: 'inventoryCategories',
  inventory_items: 'inventoryItems',
  inventory_lots: 'inventoryLots',
  purchase_orders: 'purchaseOrders',
  recipe_categories: 'recipeCategories',
  grain_types: 'grainTypes',
  cultures: 'cultures',
  prepared_spawn: 'preparedSpawn',
  grows: 'grows',
  flushes: 'flushes',
  recipes: 'recipes',
};

// ============================================================================
// SPECIES TRANSFORMATION (special case - not in transformations.ts)
// ============================================================================

function transformSpeciesFromDb(row: any): Species {
  return {
    id: row.id,
    name: row.name,
    scientificName: row.scientific_name,
    commonNames: row.common_names,
    category: row.category || 'gourmet',
    spawnColonization: row.spawn_colonization,
    bulkColonization: row.bulk_colonization,
    pinning: row.pinning,
    maturation: row.maturation,
    preferredSubstrates: row.preferred_substrates,
    substrateNotes: row.substrate_notes,
    difficulty: row.difficulty,
    characteristics: row.characteristics,
    flavorProfile: row.flavor_profile,
    culinaryNotes: row.culinary_notes,
    medicinalProperties: row.medicinal_properties,
    communityTips: row.community_tips,
    importantFacts: row.important_facts,
    typicalYield: row.typical_yield,
    flushCount: row.flush_count,
    shelfLifeDays: row.shelf_life_days_min && row.shelf_life_days_max
      ? { min: row.shelf_life_days_min, max: row.shelf_life_days_max }
      : undefined,
    automationConfig: row.automation_config,
    spawnColonizationNotes: row.spawn_colonization_notes,
    bulkColonizationNotes: row.bulk_colonization_notes,
    pinningNotes: row.pinning_notes,
    maturationNotes: row.maturation_notes,
    notes: row.notes,
    isActive: row.is_active ?? true,
  };
}

// Add species transformation to the map
TRANSFORMATIONS.species = transformSpeciesFromDb;

// ============================================================================
// OPTIMIZED DATA LOADER
// ============================================================================

/**
 * Load all data using parallel execution with caching and retry
 * This is the optimized replacement for the sequential loading in DataContext
 */
export async function loadAllDataOptimized(
  client: SupabaseClient
): Promise<DataLoaderResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const state: Partial<DataLoaderState> = {};
  const timing: Record<string, number> = {};

  try {
    const db = getDatabaseService();

    // Build table configs with transformations
    // Note: flushes are handled separately after loading to map them to grows
    const tableConfigs = Object.entries(TABLE_CONFIGS).map(([name, config]) => ({
      ...config,
      transform: name === 'flushes' ? undefined : TRANSFORMATIONS[name],
    }));

    // Load all tables in parallel
    const result = await db.loader.loadAll({
      tables: tableConfigs,
      parallel: true,
      maxConcurrent: 10,
    });

    // Process results
    for (const [tableName, tableResult] of Object.entries(result.tables)) {
      const stateKey = TABLE_TO_STATE[tableName];
      if (stateKey && tableResult.data) {
        (state as any)[stateKey] = tableResult.data;
      }
      timing[tableName] = tableResult.timing;

      if (tableResult.error) {
        errors.push(`${tableName}: ${tableResult.error.message}`);
      }
    }

    // Special handling for grows - map flushes to grows
    // Note: We need to get the raw flush data with grow_id for mapping
    if (state.grows && result.tables['flushes']?.data) {
      const rawFlushes = result.tables['flushes'].data as any[];
      state.grows = state.grows.map((grow) => {
        // Match flushes using the raw data's grow_id before transformation
        const growFlushes = rawFlushes
          .filter((f: any) => f.grow_id === grow.id)
          .map(transformFlushFromDb);
        return {
          ...grow,
          flushes: growFlushes,
          totalYield: growFlushes.reduce((sum, f) => sum + (f.wetWeight || 0), 0),
        };
      });
    }

    return {
      success: errors.length === 0,
      state,
      timing: {
        totalMs: Date.now() - startTime,
        tables: timing,
      },
      errors,
    };
  } catch (err) {
    return {
      success: false,
      state,
      timing: {
        totalMs: Date.now() - startTime,
        tables: timing,
      },
      errors: [err instanceof Error ? err.message : 'Unknown error'],
    };
  }
}

/**
 * Load a specific subset of tables
 */
export async function loadTablesOptimized(
  client: SupabaseClient,
  tables: string[]
): Promise<DataLoaderResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const state: Partial<DataLoaderState> = {};
  const timing: Record<string, number> = {};

  try {
    const db = getDatabaseService();

    const tableConfigs = tables
      .filter((name) => TABLE_CONFIGS[name])
      .map((name) => ({
        ...TABLE_CONFIGS[name],
        transform: TRANSFORMATIONS[name],
      }));

    const result = await db.loader.loadAll({
      tables: tableConfigs,
      parallel: true,
      maxConcurrent: tables.length,
    });

    for (const [tableName, tableResult] of Object.entries(result.tables)) {
      const stateKey = TABLE_TO_STATE[tableName];
      if (stateKey && tableResult.data) {
        (state as any)[stateKey] = tableResult.data;
      }
      timing[tableName] = tableResult.timing;

      if (tableResult.error) {
        errors.push(`${tableName}: ${tableResult.error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      state,
      timing: {
        totalMs: Date.now() - startTime,
        tables: timing,
      },
      errors,
    };
  } catch (err) {
    return {
      success: false,
      state,
      timing: {
        totalMs: Date.now() - startTime,
        tables: timing,
      },
      errors: [err instanceof Error ? err.message : 'Unknown error'],
    };
  }
}

// ============================================================================
// REALTIME SYNC
// ============================================================================

type RealtimeCallback = (tableName: string, payload: RealtimePayload) => void;

/**
 * Set up real-time subscriptions for all user data tables
 */
export function setupRealtimeSync(callback: RealtimeCallback): () => void {
  const db = getDatabaseService();
  const subscriptionIds: string[] = [];

  // Tables to sync in real-time
  const realtimeTables = [
    'cultures',
    'grows',
    'flushes',
    'recipes',
    'inventory_items',
    'inventory_lots',
    'prepared_spawn',
  ];

  for (const table of realtimeTables) {
    const id = db.realtime.subscribe(table, '*', (payload) => {
      callback(table, payload);
    });
    if (id) {
      subscriptionIds.push(id);
    }
  }

  console.log(`[DataLoader] Set up ${subscriptionIds.length} real-time subscriptions`);

  // Return cleanup function
  return () => {
    for (const id of subscriptionIds) {
      db.realtime.unsubscribe(id);
    }
    console.log('[DataLoader] Cleaned up real-time subscriptions');
  };
}

// ============================================================================
// LOOKUP MAP CREATION
// ============================================================================

export interface EntityLookupMaps {
  species: LookupMap<Species>;
  strains: IndexedLookupMap<Strain>;
  locations: LookupMap<Location>;
  locationTypes: LookupMap<LocationType>;
  locationClassifications: LookupMap<LocationClassification>;
  containers: LookupMap<Container>;
  substrateTypes: LookupMap<SubstrateType>;
  suppliers: LookupMap<Supplier>;
  inventoryCategories: LookupMap<InventoryCategory>;
  inventoryItems: IndexedLookupMap<InventoryItem>;
  inventoryLots: IndexedLookupMap<InventoryLot>;
  purchaseOrders: LookupMap<PurchaseOrder>;
  recipeCategories: LookupMap<RecipeCategoryItem>;
  grainTypes: LookupMap<GrainType>;
  cultures: IndexedLookupMap<Culture>;
  preparedSpawn: IndexedLookupMap<PreparedSpawn>;
  grows: IndexedLookupMap<Grow>;
  recipes: LookupMap<Recipe>;
}

/**
 * Create lookup maps from loaded state
 */
export function createLookupMaps(state: Partial<DataLoaderState>): Partial<EntityLookupMaps> {
  const maps: Partial<EntityLookupMaps> = {};

  if (state.species) {
    maps.species = new LookupMap(state.species);
  }

  if (state.strains) {
    maps.strains = new IndexedLookupMap(state.strains, ['speciesId', 'isActive']);
  }

  if (state.locations) {
    maps.locations = new LookupMap(state.locations);
  }

  if (state.locationTypes) {
    maps.locationTypes = new LookupMap(state.locationTypes);
  }

  if (state.locationClassifications) {
    maps.locationClassifications = new LookupMap(state.locationClassifications);
  }

  if (state.containers) {
    maps.containers = new LookupMap(state.containers);
  }

  if (state.substrateTypes) {
    maps.substrateTypes = new LookupMap(state.substrateTypes);
  }

  if (state.suppliers) {
    maps.suppliers = new LookupMap(state.suppliers);
  }

  if (state.inventoryCategories) {
    maps.inventoryCategories = new LookupMap(state.inventoryCategories);
  }

  if (state.inventoryItems) {
    maps.inventoryItems = new IndexedLookupMap(state.inventoryItems, ['categoryId', 'isActive']);
  }

  if (state.inventoryLots) {
    maps.inventoryLots = new IndexedLookupMap(state.inventoryLots, ['inventoryItemId', 'status']);
  }

  if (state.purchaseOrders) {
    maps.purchaseOrders = new LookupMap(state.purchaseOrders);
  }

  if (state.recipeCategories) {
    maps.recipeCategories = new LookupMap(state.recipeCategories);
  }

  if (state.grainTypes) {
    maps.grainTypes = new LookupMap(state.grainTypes);
  }

  if (state.cultures) {
    maps.cultures = new IndexedLookupMap(state.cultures, ['strainId', 'status', 'type']);
  }

  if (state.preparedSpawn) {
    maps.preparedSpawn = new IndexedLookupMap(state.preparedSpawn, ['type', 'status']);
  }

  if (state.grows) {
    maps.grows = new IndexedLookupMap(state.grows, ['strainId', 'status', 'stage']);
  }

  if (state.recipes) {
    maps.recipes = new LookupMap(state.recipes);
  }

  return maps;
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

export interface LoadMetrics {
  loadTimeMs: number;
  tableCount: number;
  rowCount: number;
  cachedCount: number;
  errorCount: number;
  parallelSavingsMs: number;
}

/**
 * Calculate loading performance metrics
 */
export function calculateLoadMetrics(result: LoadResult): LoadMetrics {
  const tableTimings = Object.values(result.tables);
  const sequentialTime = tableTimings.reduce((sum, t) => sum + t.timing, 0);
  const cachedCount = tableTimings.filter((t) => t.cached).length;
  const rowCount = tableTimings.reduce(
    (sum, t) => sum + (Array.isArray(t.data) ? t.data.length : 0),
    0
  );

  return {
    loadTimeMs: result.totalTime,
    tableCount: tableTimings.length,
    rowCount,
    cachedCount,
    errorCount: result.errors.length,
    parallelSavingsMs: sequentialTime - result.totalTime,
  };
}
