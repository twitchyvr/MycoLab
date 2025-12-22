// ============================================================================
// DATA CONTEXT - SUPABASE INTEGRATED
// Central state management with cloud sync
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  DataStoreState, LookupHelpers,
  Species, Strain, Location, LocationType, LocationClassification, Container, SubstrateType, Supplier,
  InventoryCategory, InventoryItem, InventoryLot, InventoryUsage, PurchaseOrder,
  Culture, Grow, Recipe, AppSettings,
  CultureObservation, CultureTransfer, GrowObservation, Flush, GrowStage,
  RecipeCategoryItem, GrainType, LotStatus, UsageType,
  EntityOutcome, ContaminationDetails, OutcomeCategory, OutcomeCode, ContaminationType, ContaminationStage, SuspectedCause,
  PreparedSpawn, PreparedSpawnStatus,
  // Immutable database types
  AmendmentType, RecordVersionSummary, DataAmendmentLogEntry,
} from './types';
import {
  supabase,
  ensureSession,
  getCurrentUserId,
  getLocalSettings,
  saveLocalSettings,
  isAnonymousUser,
  LocalSettings
} from '../lib/supabase';

// Import optimized database services
import {
  initializeDatabaseService,
  getDatabaseService,
  loadAllDataOptimized,
  setupRealtimeSync,
} from '../lib/db';

// Import modularized defaults and transformations
import { emptyState } from './defaults';

// ============================================================================
// OUTCOME DATA TYPES (for function parameters)
// ============================================================================

export interface EntityOutcomeData {
  entityType: 'grow' | 'culture' | 'container' | 'inventory_item' | 'inventory_lot' | 'equipment';
  entityId: string;
  entityName?: string;
  outcomeCategory: OutcomeCategory;
  outcomeCode: OutcomeCode;
  outcomeLabel?: string;
  startedAt?: Date;
  endedAt?: Date;
  totalCost?: number;
  totalYieldWet?: number;
  totalYieldDry?: number;
  biologicalEfficiency?: number;
  flushCount?: number;
  strainId?: string;
  strainName?: string;
  speciesId?: string;
  speciesName?: string;
  locationId?: string;
  locationName?: string;
  surveyResponses?: Record<string, unknown>;
  notes?: string;
}

export interface ContaminationDetailsData {
  contaminationType?: ContaminationType;
  contaminationStage?: ContaminationStage;
  daysToDetection?: number;
  suspectedCause?: SuspectedCause;
  temperatureAtDetection?: number;
  humidityAtDetection?: number;
  images?: string[];
  notes?: string;
}
import {
  transformStrainFromDb,
  transformStrainToDb,
  transformLocationTypeFromDb,
  transformLocationTypeToDb,
  transformLocationClassificationFromDb,
  transformLocationClassificationToDb,
  transformLocationFromDb,
  transformLocationToDb,
  transformContainerFromDb,
  transformContainerToDb,
  transformSubstrateTypeFromDb,
  transformSubstrateTypeToDb,
  transformInventoryCategoryFromDb,
  transformInventoryCategoryToDb,
  transformInventoryItemFromDb,
  transformRecipeCategoryFromDb,
  transformRecipeCategoryToDb,
  transformCultureFromDb,
  transformCultureToDb,
  transformGrowFromDb,
  transformGrowToDb,
  transformRecipeFromDb,
  transformRecipeToDb,
  transformSupplierFromDb,
  transformSupplierToDb,
  transformFlushFromDb,
  transformFlushToDb,
  transformGrainTypeFromDb,
  transformGrainTypeToDb,
  transformInventoryLotFromDb,
  transformInventoryLotToDb,
  transformPurchaseOrderFromDb,
  transformPurchaseOrderToDb,
  transformPreparedSpawnFromDb,
  transformPreparedSpawnToDb,
} from './transformations';

// ============================================================================
// SUPABASE CLIENT HELPER
// ============================================================================

// Use the centralized supabase client from lib/supabase.ts
// Security: No longer reading credentials from localStorage
const getSupabaseClient = (): SupabaseClient | null => {
  return supabase;
};

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface DataContextValue extends LookupHelpers {
  state: DataStoreState;
  isLoading: boolean;
  isConnected: boolean;
  isAuthenticated: boolean; // true = logged in with real account, false = anonymous or not connected
  error: string | null;

  // Auth helpers
  requireAuth: () => void; // Call before CRUD operations - throws if not authenticated
  
  // Species CRUD
  addSpecies: (species: Omit<Species, 'id'>) => Promise<Species>;
  updateSpecies: (id: string, updates: Partial<Species>) => Promise<void>;
  deleteSpecies: (id: string) => Promise<void>;
  
  // Strain CRUD
  addStrain: (strain: Omit<Strain, 'id'>) => Promise<Strain>;
  updateStrain: (id: string, updates: Partial<Strain>) => Promise<void>;
  deleteStrain: (id: string) => Promise<void>;
  
  // Location CRUD
  addLocation: (location: Omit<Location, 'id'>) => Promise<Location>;
  updateLocation: (id: string, updates: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;

  // Location Type CRUD
  addLocationType: (locationType: Omit<LocationType, 'id'>) => Promise<LocationType>;
  updateLocationType: (id: string, updates: Partial<LocationType>) => Promise<void>;
  deleteLocationType: (id: string) => Promise<void>;

  // Location Classification CRUD
  addLocationClassification: (classification: Omit<LocationClassification, 'id'>) => Promise<LocationClassification>;
  updateLocationClassification: (id: string, updates: Partial<LocationClassification>) => Promise<void>;
  deleteLocationClassification: (id: string) => Promise<void>;

  // Container CRUD (unified - replaces Vessel and ContainerType)
  addContainer: (container: Omit<Container, 'id'>) => Promise<Container>;
  updateContainer: (id: string, updates: Partial<Container>) => Promise<void>;
  deleteContainer: (id: string) => Promise<void>;
  
  // Substrate Type CRUD
  addSubstrateType: (substrateType: Omit<SubstrateType, 'id'>) => Promise<SubstrateType>;
  updateSubstrateType: (id: string, updates: Partial<SubstrateType>) => Promise<void>;
  deleteSubstrateType: (id: string) => Promise<void>;
  
  // Supplier CRUD
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  // Inventory Category CRUD
  addInventoryCategory: (category: Omit<InventoryCategory, 'id'>) => Promise<InventoryCategory>;
  updateInventoryCategory: (id: string, updates: Partial<InventoryCategory>) => Promise<void>;
  deleteInventoryCategory: (id: string) => Promise<void>;

  // Recipe Category CRUD
  addRecipeCategory: (category: Omit<RecipeCategoryItem, 'id'>) => Promise<RecipeCategoryItem>;
  updateRecipeCategory: (id: string, updates: Partial<RecipeCategoryItem>) => Promise<void>;
  deleteRecipeCategory: (id: string) => Promise<void>;

  // Grain Type CRUD
  addGrainType: (grain: Omit<GrainType, 'id'>) => Promise<GrainType>;
  updateGrainType: (id: string, updates: Partial<GrainType>) => Promise<void>;
  deleteGrainType: (id: string) => Promise<void>;

  // Inventory Item CRUD
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<InventoryItem>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  adjustInventoryQuantity: (id: string, delta: number) => void;

  // Inventory Lot CRUD
  addInventoryLot: (lot: Omit<InventoryLot, 'id' | 'createdAt' | 'updatedAt'>) => Promise<InventoryLot>;
  updateInventoryLot: (id: string, updates: Partial<InventoryLot>) => Promise<void>;
  deleteInventoryLot: (id: string) => Promise<void>;
  adjustLotQuantity: (lotId: string, delta: number, usageType?: UsageType, referenceId?: string, referenceName?: string) => Promise<void>;
  getLotsForItem: (inventoryItemId: string) => InventoryLot[];

  // Purchase Order CRUD
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PurchaseOrder>;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;
  receiveOrder: (orderId: string, receivedItems?: { itemId: string; quantity: number }[]) => Promise<void>;
  generateOrderNumber: () => string;

  // Culture CRUD
  addCulture: (culture: Omit<Culture, 'id' | 'createdAt' | 'updatedAt' | 'observations' | 'transfers'>) => Promise<Culture>;
  updateCulture: (id: string, updates: Partial<Culture>) => Promise<void>;
  deleteCulture: (id: string, outcome?: EntityOutcomeData) => Promise<void>;
  addCultureObservation: (cultureId: string, observation: Omit<CultureObservation, 'id'>) => Promise<void>;
  addCultureTransfer: (cultureId: string, transfer: Omit<CultureTransfer, 'id'>) => Culture | null;
  getCultureLineage: (cultureId: string) => { ancestors: Culture[]; descendants: Culture[] };
  generateCultureLabel: (type: Culture['type']) => string;

  // Prepared Spawn CRUD
  addPreparedSpawn: (spawn: Omit<PreparedSpawn, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PreparedSpawn>;
  updatePreparedSpawn: (id: string, updates: Partial<PreparedSpawn>) => Promise<void>;
  deletePreparedSpawn: (id: string) => Promise<void>;
  inoculatePreparedSpawn: (preparedSpawnId: string, resultCultureId: string) => Promise<void>;
  getAvailablePreparedSpawn: (type?: PreparedSpawn['type']) => PreparedSpawn[];

  // Grow CRUD
  addGrow: (grow: Omit<Grow, 'id' | 'createdAt' | 'observations' | 'flushes' | 'totalYield'>) => Promise<Grow>;
  updateGrow: (id: string, updates: Partial<Grow>) => Promise<void>;
  deleteGrow: (id: string, outcome?: EntityOutcomeData) => Promise<void>;
  advanceGrowStage: (growId: string) => Promise<void>;
  markGrowContaminated: (growId: string, notes?: string) => Promise<void>;
  addGrowObservation: (growId: string, observation: Omit<GrowObservation, 'id'>) => void;
  addFlush: (growId: string, flush: Omit<Flush, 'id' | 'flushNumber'>) => Promise<void>;

  // Cost Calculation Helpers
  calculateCultureCostPerMl: (culture: Culture) => number;
  calculateSourceCultureCost: (cultureId: string, volumeUsedMl: number) => number;
  calculateGrowInventoryCost: (growId: string) => number;
  recalculateGrowCosts: (growId: string) => Promise<void>;
  getLabValuation: () => { equipment: number; consumables: number; durables: number; total: number };

  // Outcome Logging
  saveEntityOutcome: (outcome: EntityOutcomeData) => Promise<EntityOutcome>;
  saveContaminationDetails: (outcomeId: string, details: ContaminationDetailsData) => Promise<void>;
  
  // Recipe CRUD
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Recipe>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  calculateRecipeCost: (recipe: Recipe) => number;
  scaleRecipe: (recipe: Recipe, scaleFactor: number) => Recipe;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Utility
  generateId: (prefix: string) => string;
  refreshData: () => Promise<void>;

  // ============================================================================
  // IMMUTABLE RECORD OPERATIONS
  // Append-only pattern: amend creates new version, archive soft-deletes
  // ============================================================================

  // Amend a culture (creates new version, marks old as superseded)
  amendCulture: (
    originalId: string,
    changes: Partial<Culture>,
    amendmentType: AmendmentType,
    reason: string
  ) => Promise<Culture>;

  // Archive a culture (soft-delete with reason)
  archiveCulture: (id: string, reason: string) => Promise<void>;

  // Amend a grow (creates new version, marks old as superseded)
  amendGrow: (
    originalId: string,
    changes: Partial<Grow>,
    amendmentType: AmendmentType,
    reason: string
  ) => Promise<Grow>;

  // Archive a grow (soft-delete with reason)
  archiveGrow: (id: string, reason: string) => Promise<void>;

  // Get version history for a record
  getRecordHistory: (
    entityType: 'culture' | 'grow' | 'prepared_spawn',
    recordGroupId: string
  ) => RecordVersionSummary[];

  // Get amendment log for a record
  getAmendmentLog: (recordGroupId: string) => DataAmendmentLogEntry[];

  // Archive ALL user data (bulk soft-delete for data reset)
  archiveAllUserData: (reason: string) => Promise<{ culturesArchived: number; growsArchived: number; preparedSpawnArchived: number }>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const DataContext = createContext<DataContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [state, setState] = useState<DataStoreState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  // ============================================================================
  // INITIALIZATION & DATA LOADING (OPTIMIZED)
  // Uses parallel query execution for 5-10x faster loading
  // ============================================================================

  // Cached user ID to prevent repeated fetches
  const cachedUserIdRef = React.useRef<string | null>(null);

  const getCachedUserId = useCallback(async (): Promise<string | null> => {
    if (cachedUserIdRef.current) {
      return cachedUserIdRef.current;
    }
    const userId = await getCurrentUserId();
    cachedUserIdRef.current = userId;
    return userId;
  }, []);

  const loadDataFromSupabase = useCallback(async (client: SupabaseClient) => {
    setIsLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      // Initialize the optimized database service
      await initializeDatabaseService();

      // Use optimized parallel loading
      const result = await loadAllDataOptimized(client);

      const loadTime = Date.now() - startTime;
      // Only log in development to reduce production noise
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DataContext] Loaded data in ${loadTime}ms (optimized parallel loading)`);
      }

      if (result.errors.length > 0) {
        console.warn('[DataContext] Some tables had errors:', result.errors);
      }

      // Load user settings separately (requires user ID)
      // Get current settings from localStorage as fallback (not from state to avoid dependency cycles)
      const localSettings = getLocalSettings();
      let loadedSettings: AppSettings = {
        defaultUnits: localSettings.defaultUnits,
        defaultCurrency: localSettings.defaultCurrency,
        altitude: localSettings.altitude,
        timezone: localSettings.timezone,
        notifications: localSettings.notifications,
      };

      // Only load settings from database for non-anonymous users
      // Anonymous users use localStorage only (RLS policies block them)
      const isAnon = await isAnonymousUser();
      setIsAuthenticated(!isAnon);

      if (!isAnon) {
        const currentUserId = await getCachedUserId();
        if (currentUserId) {
          const { data: settingsData, error: settingsError } = await client
            .from('user_settings')
            .select('*')
            .eq('user_id', currentUserId)
            .maybeSingle();

          if (!settingsError && settingsData) {
            loadedSettings = {
              defaultUnits: settingsData.default_units || 'metric',
              defaultCurrency: settingsData.default_currency || 'USD',
              altitude: settingsData.altitude || 0,
              timezone: settingsData.timezone || 'America/Chicago',
              notifications: {
                enabled: settingsData.notifications_enabled ?? true,
                harvestReminders: settingsData.harvest_reminders ?? true,
                lowStockAlerts: settingsData.low_stock_alerts ?? true,
                contaminationAlerts: settingsData.contamination_alerts ?? true,
              },
            };
          }
        }
      }

      // Update state with all loaded data
      setState(prev => ({
        ...prev,
        species: result.state.species || prev.species,
        strains: result.state.strains || prev.strains,
        locations: result.state.locations || prev.locations,
        locationTypes: result.state.locationTypes || prev.locationTypes,
        locationClassifications: result.state.locationClassifications || prev.locationClassifications,
        suppliers: result.state.suppliers || prev.suppliers,
        containers: result.state.containers || prev.containers,
        substrateTypes: result.state.substrateTypes || prev.substrateTypes,
        inventoryCategories: result.state.inventoryCategories || prev.inventoryCategories,
        inventoryItems: result.state.inventoryItems || prev.inventoryItems,
        inventoryLots: result.state.inventoryLots || prev.inventoryLots,
        purchaseOrders: result.state.purchaseOrders || prev.purchaseOrders,
        recipeCategories: result.state.recipeCategories || prev.recipeCategories,
        grainTypes: result.state.grainTypes || prev.grainTypes,
        cultures: result.state.cultures || prev.cultures,
        preparedSpawn: result.state.preparedSpawn || prev.preparedSpawn,
        grows: result.state.grows || prev.grows,
        recipes: result.state.recipes || prev.recipes,
        entityOutcomes: result.state.entityOutcomes || prev.entityOutcomes,
        settings: loadedSettings,
      }));

      setIsConnected(true);
      localStorage.setItem('mycolab-last-sync', new Date().toISOString());

      // Log performance metrics (only in development)
      if (result.timing && process.env.NODE_ENV === 'development') {
        const tableCount = Object.keys(result.timing.tables).length;
        const sequentialTime = Object.values(result.timing.tables).reduce((a, b) => a + b, 0);
        // Avoid NaN when sequentialTime is 0 (all cached)
        const savings = sequentialTime > 0 ? Math.round(((sequentialTime - loadTime) / sequentialTime) * 100) : 0;
        console.log(`[DataContext] Parallel loading: ${tableCount} tables, saved ~${savings}% time`);
      }

    } catch (err: any) {
      console.error('Failed to load data from Supabase:', err);
      setError(err.message || 'Failed to load data');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [getCachedUserId]); // Note: state.settings removed to prevent infinite reload loop

  // Set up real-time subscriptions for cross-tab sync
  const realtimeCleanupRef = React.useRef<(() => void) | null>(null);

  // Legacy loadDataFromSupabase compatibility - this function is no longer needed
  // but kept for reference during transition
  const loadDataFromSupabaseLegacy = useCallback(async (client: SupabaseClient) => {
    setIsLoading(true);
    setError(null);

    try {
      // Load species
      const { data: speciesData, error: speciesError } = await client
        .from('species')
        .select('*')
        .order('name');
      // Species table might not exist yet, so don't throw error

      // Load strains
      const { data: strainsData, error: strainsError } = await client
        .from('strains')
        .select('*')
        .order('name');
      if (strainsError) throw strainsError;

      // Load locations
      const { data: locationsData, error: locationsError } = await client
        .from('locations')
        .select('*')
        .order('name');
      if (locationsError) throw locationsError;

      // Load location types
      const { data: locationTypesData, error: locationTypesError } = await client
        .from('location_types')
        .select('*')
        .order('name');
      if (locationTypesError) console.warn('Location types error:', locationTypesError);

      // Load location classifications
      const { data: locationClassificationsData, error: locationClassificationsError } = await client
        .from('location_classifications')
        .select('*')
        .order('name');
      if (locationClassificationsError) console.warn('Location classifications error:', locationClassificationsError);

      // Load suppliers
      const { data: suppliersData, error: suppliersError } = await client
        .from('suppliers')
        .select('*')
        .order('name');
      if (suppliersError) throw suppliersError;

      // Load containers (unified - replaces vessels and container_types)
      const { data: containersData, error: containersError } = await client
        .from('containers')
        .select('*')
        .order('name');
      if (containersError) console.warn('Containers table error:', containersError);

      // Load substrate types
      const { data: substrateTypesData, error: substrateTypesError } = await client
        .from('substrate_types')
        .select('*')
        .order('name');
      if (substrateTypesError) console.warn('Substrate types error:', substrateTypesError);

      // Load inventory categories
      const { data: inventoryCategoriesData, error: inventoryCategoriesError } = await client
        .from('inventory_categories')
        .select('*')
        .order('name');
      if (inventoryCategoriesError) console.warn('Inventory categories error:', inventoryCategoriesError);

      // Load inventory items
      const { data: inventoryItemsData, error: inventoryItemsError } = await client
        .from('inventory_items')
        .select('*')
        .order('name');
      if (inventoryItemsError) console.warn('Inventory items error:', inventoryItemsError);

      // Load recipe categories
      const { data: recipeCategoriesData, error: recipeCategoriesError } = await client
        .from('recipe_categories')
        .select('*')
        .order('name');
      if (recipeCategoriesError) console.warn('Recipe categories error:', recipeCategoriesError);

      // Load grain types
      const { data: grainTypesData, error: grainTypesError } = await client
        .from('grain_types')
        .select('*')
        .order('name');
      if (grainTypesError) console.warn('Grain types error:', grainTypesError);

      // Load cultures
      const { data: culturesData, error: culturesError } = await client
        .from('cultures')
        .select('*')
        .order('created_at', { ascending: false });
      if (culturesError) throw culturesError;

      // Load culture observations
      const { data: cultureObservationsData, error: cultureObservationsError } = await client
        .from('culture_observations')
        .select('*')
        .order('date', { ascending: false });
      if (cultureObservationsError) console.warn('Culture observations error:', cultureObservationsError);

      // Load prepared spawn
      const { data: preparedSpawnData, error: preparedSpawnError } = await client
        .from('prepared_spawn')
        .select('*')
        .order('prep_date', { ascending: false });
      if (preparedSpawnError) console.warn('Prepared spawn error:', preparedSpawnError);

      // Load grows
      const { data: growsData, error: growsError } = await client
        .from('grows')
        .select('*')
        .order('created_at', { ascending: false });
      if (growsError) throw growsError;
      
      // Load flushes
      const { data: flushesData, error: flushesError } = await client
        .from('flushes')
        .select('*')
        .order('harvest_date', { ascending: false });
      if (flushesError) throw flushesError;
      
      // Load recipes
      const { data: recipesData, error: recipesError } = await client
        .from('recipes')
        .select('*')
        .order('name');
      if (recipesError) throw recipesError;

      // Load user settings - get current user ID first
      const currentUserId = await getCurrentUserId();
      let settingsData = null;
      if (currentUserId) {
        const { data, error: settingsError } = await client
          .from('user_settings')
          .select('*')
          .eq('user_id', currentUserId)
          .maybeSingle();
        // Settings may not exist yet, so just log and continue
        if (settingsError) {
          console.debug('User settings fetch:', settingsError.message);
        }
        settingsData = data;
      }
      
      // Transform settings - use nested notifications structure
      const loadedSettings: AppSettings = settingsData ? {
        defaultUnits: settingsData.default_units || 'metric',
        defaultCurrency: settingsData.default_currency || 'USD',
        altitude: settingsData.altitude || 0,
        timezone: settingsData.timezone || 'America/Chicago',
        notifications: {
          enabled: settingsData.notifications_enabled ?? true,
          harvestReminders: settingsData.harvest_reminders ?? true,
          lowStockAlerts: settingsData.low_stock_alerts ?? true,
          contaminationAlerts: settingsData.contamination_alerts ?? true,
        },
      } : state.settings;

      // Transform species data
      const species = (speciesData || []).map((row: any): Species => ({
        id: row.id,
        name: row.name,
        scientificName: row.scientific_name,
        commonNames: row.common_names,
        category: row.category || 'gourmet',
        // Growing parameters by stage (JSONB from database - automation ready)
        spawnColonization: row.spawn_colonization,
        bulkColonization: row.bulk_colonization,
        pinning: row.pinning,
        maturation: row.maturation,
        // Substrate preferences
        preferredSubstrates: row.preferred_substrates,
        substrateNotes: row.substrate_notes,
        // Growing characteristics
        difficulty: row.difficulty,
        characteristics: row.characteristics,
        // Culinary/Usage info
        flavorProfile: row.flavor_profile,
        culinaryNotes: row.culinary_notes,
        medicinalProperties: row.medicinal_properties,
        // Community knowledge
        communityTips: row.community_tips,
        importantFacts: row.important_facts,
        // Yield expectations
        typicalYield: row.typical_yield,
        flushCount: row.flush_count,
        // Shelf life
        shelfLifeDays: row.shelf_life_days_min && row.shelf_life_days_max
          ? { min: row.shelf_life_days_min, max: row.shelf_life_days_max }
          : undefined,
        // Automation configuration (for IoT/sensor integration)
        automationConfig: row.automation_config,
        // Stage-specific notes (easily accessible for UI)
        spawnColonizationNotes: row.spawn_colonization_notes,
        bulkColonizationNotes: row.bulk_colonization_notes,
        pinningNotes: row.pinning_notes,
        maturationNotes: row.maturation_notes,
        notes: row.notes,
        isActive: row.is_active ?? true,
      }));

      // Map flushes to grows
      const growsWithFlushes = (growsData || []).map(row => {
        const grow = transformGrowFromDb(row);
        grow.flushes = (flushesData || [])
          .filter(f => f.grow_id === row.id)
          .map(transformFlushFromDb);
        grow.totalYield = grow.flushes.reduce((sum, f) => sum + (f.wetWeight || 0), 0);
        return grow;
      });

      setState(prev => ({
        ...prev,
        species,
        strains: (strainsData || []).map(transformStrainFromDb),
        locations: (locationsData || []).map(transformLocationFromDb),
        locationTypes: (locationTypesData || []).map(transformLocationTypeFromDb),
        locationClassifications: (locationClassificationsData || []).map(transformLocationClassificationFromDb),
        suppliers: (suppliersData || []).map(transformSupplierFromDb),
        containers: (containersData || []).map(transformContainerFromDb),
        substrateTypes: (substrateTypesData || []).map(transformSubstrateTypeFromDb),
        inventoryCategories: (inventoryCategoriesData || []).map(transformInventoryCategoryFromDb),
        inventoryItems: (inventoryItemsData || []).map(transformInventoryItemFromDb),
        recipeCategories: (recipeCategoriesData || []).map(transformRecipeCategoryFromDb),
        grainTypes: (grainTypesData || []).map(transformGrainTypeFromDb),
        cultures: (culturesData || []).map(row => {
          const culture = transformCultureFromDb(row);
          // Attach observations from culture_observations table
          const observations: CultureObservation[] = (cultureObservationsData || [])
            .filter((obs: any) => obs.culture_id === row.id)
            .map((obs: any) => ({
              id: obs.id,
              date: new Date(obs.date),
              type: obs.type || 'general',
              notes: obs.notes || '',
              healthRating: obs.health_rating,
              images: obs.images || [],
            }));
          return { ...culture, observations };
        }),
        preparedSpawn: (preparedSpawnData || []).map(transformPreparedSpawnFromDb),
        grows: growsWithFlushes,
        recipes: (recipesData || []).map(transformRecipeFromDb),
        settings: loadedSettings,
      }));
      
      setIsConnected(true);
      localStorage.setItem('mycolab-last-sync', new Date().toISOString());
      
    } catch (err: any) {
      console.error('Failed to load data from Supabase:', err);
      setError(err.message || 'Failed to load data');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize Supabase client and load data
  useEffect(() => {
    const init = async () => {
      // Load settings first (from localStorage, then try database)
      const settings = await loadSettings();
      setState(prev => ({ ...prev, settings }));
      
      // Then initialize Supabase client and load data
      const client = getSupabaseClient();
      if (client) {
        setSupabase(client);
        loadDataFromSupabase(client);
      } else {
        setIsLoading(false);
        setIsConnected(false);
      }
    };
    
    init();
  }, [loadDataFromSupabase]);

  // Listen for auth state changes and reload data when user signs in
  // This fixes the issue where email/password login doesn't trigger a data reload
  // (OAuth login causes a page reload, so data loads fresh, but email login doesn't)
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Update authentication status
        const isRealUser = !!session?.user && !session.user.is_anonymous;
        setIsAuthenticated(isRealUser);

        if (process.env.NODE_ENV === 'development') {
          console.log('[DataContext] Auth state:', event, isRealUser ? 'authenticated' : 'anonymous');
        }

        // Reload data when user signs in (with a real account, not anonymous)
        if (event === 'SIGNED_IN' && isRealUser) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[DataContext] Auth state changed to SIGNED_IN, reloading data and settings...');
          }
          // Reload settings first (includes hasCompletedSetupWizard)
          const settings = await loadSettings();
          setState(prev => ({ ...prev, settings }));
          // Then reload all data
          const client = getSupabaseClient();
          if (client) {
            await loadDataFromSupabase(client);
          }
        }

        // Also reload on TOKEN_REFRESHED to ensure we have fresh data after token refresh
        if (event === 'TOKEN_REFRESHED' && isRealUser) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[DataContext] Token refreshed, ensuring data is current...');
          }
          // Only reload if we haven't loaded recently (within last 5 seconds)
          const lastSync = localStorage.getItem('mycolab-last-sync');
          if (lastSync) {
            const lastSyncTime = new Date(lastSync).getTime();
            const now = Date.now();
            if (now - lastSyncTime > 5000) {
              const client = getSupabaseClient();
              if (client) {
                await loadDataFromSupabase(client);
              }
            }
          }
        }

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadDataFromSupabase]);

  // Refresh data function
  const refreshData = useCallback(async () => {
    const client = getSupabaseClient();
    if (client) {
      setSupabase(client);
      await loadDataFromSupabase(client);
    }
  }, [loadDataFromSupabase]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const generateId = useCallback((prefix: string): string => {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
  }, []);

  // ============================================================================
  // AUTHENTICATION HELPERS
  // ============================================================================

  /**
   * Check if user is authenticated (not anonymous).
   * Throws an error if not authenticated - use this before any CRUD operation.
   */
  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to make changes. Create a free account to save your data.');
    }
  }, [isAuthenticated]);

  // ============================================================================
  // LOOKUP HELPERS
  // ============================================================================

  const getSpecies = useCallback((id: string) => state.species.find(s => s.id === id), [state.species]);
  const getStrain = useCallback((id: string) => state.strains.find(s => s.id === id), [state.strains]);
  const getLocation = useCallback((id: string) => state.locations.find(l => l.id === id), [state.locations]);
  const getLocationType = useCallback((id: string) => state.locationTypes.find(lt => lt.id === id), [state.locationTypes]);
  const getLocationClassification = useCallback((id: string) => state.locationClassifications.find(lc => lc.id === id), [state.locationClassifications]);
  const getContainer = useCallback((id: string) => state.containers.find(c => c.id === id), [state.containers]);
  const getSubstrateType = useCallback((id: string) => state.substrateTypes.find(s => s.id === id), [state.substrateTypes]);
  const getSupplier = useCallback((id: string) => state.suppliers.find(s => s.id === id), [state.suppliers]);
  const getInventoryCategory = useCallback((id: string) => state.inventoryCategories.find(c => c.id === id), [state.inventoryCategories]);
  const getRecipeCategory = useCallback((code: string) => state.recipeCategories.find(c => c.code === code), [state.recipeCategories]);
  const getGrainType = useCallback((id: string) => state.grainTypes.find(g => g.id === id), [state.grainTypes]);
  const getInventoryItem = useCallback((id: string) => state.inventoryItems.find(i => i.id === id), [state.inventoryItems]);
  const getInventoryLot = useCallback((id: string) => state.inventoryLots.find(l => l.id === id), [state.inventoryLots]);
  const getPurchaseOrder = useCallback((id: string) => state.purchaseOrders.find(o => o.id === id), [state.purchaseOrders]);
  const getCulture = useCallback((id: string) => state.cultures.find(c => c.id === id), [state.cultures]);
  const getPreparedSpawn = useCallback((id: string) => state.preparedSpawn.find(s => s.id === id), [state.preparedSpawn]);
  const getGrow = useCallback((id: string) => state.grows.find(g => g.id === id), [state.grows]);
  const getRecipe = useCallback((id: string) => state.recipes.find(r => r.id === id), [state.recipes]);

  // Active lists
  const activeSpecies = useMemo(() => state.species.filter(s => s.isActive), [state.species]);
  const activeStrains = useMemo(() => state.strains.filter(s => s.isActive), [state.strains]);
  const activeLocations = useMemo(() => state.locations.filter(l => l.isActive), [state.locations]);
  const activeLocationTypes = useMemo(() => state.locationTypes.filter(lt => lt.isActive), [state.locationTypes]);
  const activeLocationClassifications = useMemo(() => state.locationClassifications.filter(lc => lc.isActive), [state.locationClassifications]);
  const activeContainers = useMemo(() => state.containers.filter(c => c.isActive), [state.containers]);
  const activeSubstrateTypes = useMemo(() => state.substrateTypes.filter(s => s.isActive), [state.substrateTypes]);
  const activeSuppliers = useMemo(() => state.suppliers.filter(s => s.isActive), [state.suppliers]);
  const activeInventoryCategories = useMemo(() => state.inventoryCategories.filter(c => c.isActive), [state.inventoryCategories]);
  const activeRecipeCategories = useMemo(() => state.recipeCategories.filter(c => c.isActive), [state.recipeCategories]);
  const activeGrainTypes = useMemo(() => state.grainTypes.filter(g => g.isActive), [state.grainTypes]);
  const activeInventoryItems = useMemo(() => state.inventoryItems.filter(i => i.isActive), [state.inventoryItems]);
  const activeInventoryLots = useMemo(() => state.inventoryLots.filter(l => l.isActive), [state.inventoryLots]);
  const activePurchaseOrders = useMemo(() => state.purchaseOrders.filter(o => o.isActive), [state.purchaseOrders]);
  const activeRecipes = useMemo(() => state.recipes.filter(r => r.isActive), [state.recipes]);
  const availablePreparedSpawn = useMemo(() => state.preparedSpawn.filter(s => s.isActive && s.status === 'available'), [state.preparedSpawn]);

  // ============================================================================
  // SPECIES CRUD
  // ============================================================================

  const addSpecies = useCallback(async (species: Omit<Species, 'id'>): Promise<Species> => {
    if (supabase) {
      // Get current user ID to save as personal item
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('species')
        .insert({
          name: species.name,
          scientific_name: species.scientificName,
          common_names: species.commonNames,
          category: species.category,
          // Growing parameters (JSONB)
          spawn_colonization: species.spawnColonization,
          bulk_colonization: species.bulkColonization,
          pinning: species.pinning,
          maturation: species.maturation,
          // Substrate preferences
          preferred_substrates: species.preferredSubstrates,
          substrate_notes: species.substrateNotes,
          // Growing characteristics
          difficulty: species.difficulty,
          characteristics: species.characteristics,
          // Culinary/Usage info
          flavor_profile: species.flavorProfile,
          culinary_notes: species.culinaryNotes,
          medicinal_properties: species.medicinalProperties,
          // Community knowledge
          community_tips: species.communityTips,
          important_facts: species.importantFacts,
          // Yield expectations
          typical_yield: species.typicalYield,
          flush_count: species.flushCount,
          // Shelf life
          shelf_life_days_min: species.shelfLifeDays?.min,
          shelf_life_days_max: species.shelfLifeDays?.max,
          // Automation configuration (JSONB for IoT/sensor integration)
          automation_config: species.automationConfig,
          // Stage-specific notes
          spawn_colonization_notes: species.spawnColonizationNotes,
          bulk_colonization_notes: species.bulkColonizationNotes,
          pinning_notes: species.pinningNotes,
          maturation_notes: species.maturationNotes,
          notes: species.notes,
          is_active: species.isActive ?? true,
          ...(userId && { user_id: userId }),
        })
        .select()
        .single();

      if (error) throw error;

      const newSpecies: Species = {
        id: data.id,
        name: data.name,
        scientificName: data.scientific_name,
        commonNames: data.common_names,
        category: data.category || 'gourmet',
        spawnColonization: data.spawn_colonization,
        bulkColonization: data.bulk_colonization,
        pinning: data.pinning,
        maturation: data.maturation,
        preferredSubstrates: data.preferred_substrates,
        substrateNotes: data.substrate_notes,
        difficulty: data.difficulty,
        characteristics: data.characteristics,
        flavorProfile: data.flavor_profile,
        culinaryNotes: data.culinary_notes,
        medicinalProperties: data.medicinal_properties,
        communityTips: data.community_tips,
        importantFacts: data.important_facts,
        typicalYield: data.typical_yield,
        flushCount: data.flush_count,
        shelfLifeDays: data.shelf_life_days_min && data.shelf_life_days_max
          ? { min: data.shelf_life_days_min, max: data.shelf_life_days_max }
          : undefined,
        automationConfig: data.automation_config,
        spawnColonizationNotes: data.spawn_colonization_notes,
        bulkColonizationNotes: data.bulk_colonization_notes,
        pinningNotes: data.pinning_notes,
        maturationNotes: data.maturation_notes,
        notes: data.notes,
        isActive: data.is_active ?? true,
      };
      setState(prev => ({ ...prev, species: [...prev.species, newSpecies] }));
      return newSpecies;
    }

    const newSpecies = { ...species, id: generateId('species') } as Species;
    setState(prev => ({ ...prev, species: [...prev.species, newSpecies] }));
    return newSpecies;
  }, [supabase, generateId]);

  const updateSpecies = useCallback(async (id: string, updates: Partial<Species>) => {
    if (supabase) {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.scientificName !== undefined) dbUpdates.scientific_name = updates.scientificName;
      if (updates.commonNames !== undefined) dbUpdates.common_names = updates.commonNames;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.spawnColonization !== undefined) dbUpdates.spawn_colonization = updates.spawnColonization;
      if (updates.bulkColonization !== undefined) dbUpdates.bulk_colonization = updates.bulkColonization;
      if (updates.pinning !== undefined) dbUpdates.pinning = updates.pinning;
      if (updates.maturation !== undefined) dbUpdates.maturation = updates.maturation;
      if (updates.preferredSubstrates !== undefined) dbUpdates.preferred_substrates = updates.preferredSubstrates;
      if (updates.substrateNotes !== undefined) dbUpdates.substrate_notes = updates.substrateNotes;
      if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
      if (updates.characteristics !== undefined) dbUpdates.characteristics = updates.characteristics;
      if (updates.flavorProfile !== undefined) dbUpdates.flavor_profile = updates.flavorProfile;
      if (updates.culinaryNotes !== undefined) dbUpdates.culinary_notes = updates.culinaryNotes;
      if (updates.medicinalProperties !== undefined) dbUpdates.medicinal_properties = updates.medicinalProperties;
      if (updates.communityTips !== undefined) dbUpdates.community_tips = updates.communityTips;
      if (updates.importantFacts !== undefined) dbUpdates.important_facts = updates.importantFacts;
      if (updates.typicalYield !== undefined) dbUpdates.typical_yield = updates.typicalYield;
      if (updates.flushCount !== undefined) dbUpdates.flush_count = updates.flushCount;
      if (updates.shelfLifeDays !== undefined) {
        dbUpdates.shelf_life_days_min = updates.shelfLifeDays?.min;
        dbUpdates.shelf_life_days_max = updates.shelfLifeDays?.max;
      }
      if (updates.automationConfig !== undefined) dbUpdates.automation_config = updates.automationConfig;
      if (updates.spawnColonizationNotes !== undefined) dbUpdates.spawn_colonization_notes = updates.spawnColonizationNotes;
      if (updates.bulkColonizationNotes !== undefined) dbUpdates.bulk_colonization_notes = updates.bulkColonizationNotes;
      if (updates.pinningNotes !== undefined) dbUpdates.pinning_notes = updates.pinningNotes;
      if (updates.maturationNotes !== undefined) dbUpdates.maturation_notes = updates.maturationNotes;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

      const { error } = await supabase
        .from('species')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
    }

    setState(prev => ({
      ...prev,
      species: prev.species.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  }, [supabase]);

  const deleteSpecies = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('species')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    }
    
    setState(prev => ({
      ...prev,
      species: prev.species.map(s => s.id === id ? { ...s, isActive: false } : s)
    }));
  }, [supabase]);

  // ============================================================================
  // STRAIN CRUD
  // ============================================================================

  const addStrain = useCallback(async (strain: Omit<Strain, 'id'>): Promise<Strain> => {
    if (supabase) {
      // Get current user ID to save as personal item
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('strains')
        .insert(transformStrainToDb(strain, userId))
        .select()
        .single();

      if (error) throw error;

      const newStrain = transformStrainFromDb(data);
      setState(prev => ({ ...prev, strains: [...prev.strains, newStrain] }));
      return newStrain;
    }

    // Fallback for offline mode
    const newStrain = { ...strain, id: generateId('strain') } as Strain;
    setState(prev => ({ ...prev, strains: [...prev.strains, newStrain] }));
    return newStrain;
  }, [supabase, generateId]);

  const updateStrain = useCallback(async (id: string, updates: Partial<Strain>) => {
    if (supabase) {
      const { error } = await supabase
        .from('strains')
        .update(transformStrainToDb(updates))
        .eq('id', id);
      
      if (error) throw error;
    }
    
    setState(prev => ({
      ...prev,
      strains: prev.strains.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  }, [supabase]);

  const deleteStrain = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('strains')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    }
    
    setState(prev => ({
      ...prev,
      strains: prev.strains.map(s => s.id === id ? { ...s, isActive: false } : s)
    }));
  }, [supabase]);

  // ============================================================================
  // LOCATION CRUD
  // ============================================================================

  const addLocation = useCallback(async (location: Omit<Location, 'id'>): Promise<Location> => {
    if (supabase) {
      // Get current user ID to save as personal item
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('locations')
        .insert(transformLocationToDb(location, userId))
        .select()
        .single();

      if (error) throw error;

      const newLocation = transformLocationFromDb(data);
      setState(prev => ({ ...prev, locations: [...prev.locations, newLocation] }));
      return newLocation;
    }

    const newLocation = { ...location, id: generateId('loc') } as Location;
    setState(prev => ({ ...prev, locations: [...prev.locations, newLocation] }));
    return newLocation;
  }, [supabase, generateId]);

  const updateLocation = useCallback(async (id: string, updates: Partial<Location>) => {
    if (supabase) {
      const { error } = await supabase
        .from('locations')
        .update(transformLocationToDb(updates))
        .eq('id', id);
      
      if (error) throw error;
    }
    
    setState(prev => ({
      ...prev,
      locations: prev.locations.map(l => l.id === id ? { ...l, ...updates } : l)
    }));
  }, [supabase]);

  const deleteLocation = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('locations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    }

    setState(prev => ({
      ...prev,
      locations: prev.locations.map(l => l.id === id ? { ...l, isActive: false } : l)
    }));
  }, [supabase]);

  // ============================================================================
  // LOCATION TYPE CRUD
  // ============================================================================

  const addLocationType = useCallback(async (locationType: Omit<LocationType, 'id'>): Promise<LocationType> => {
    if (supabase) {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('location_types')
        .insert(transformLocationTypeToDb(locationType, userId))
        .select()
        .single();

      if (error) throw error;

      const newType = transformLocationTypeFromDb(data);
      setState(prev => ({ ...prev, locationTypes: [...prev.locationTypes, newType] }));
      return newType;
    }

    const newType = { ...locationType, id: generateId('loctype') } as LocationType;
    setState(prev => ({ ...prev, locationTypes: [...prev.locationTypes, newType] }));
    return newType;
  }, [supabase, generateId]);

  const updateLocationType = useCallback(async (id: string, updates: Partial<LocationType>) => {
    if (supabase) {
      const { error } = await supabase
        .from('location_types')
        .update(transformLocationTypeToDb(updates))
        .eq('id', id);

      if (error) throw error;
    }

    setState(prev => ({
      ...prev,
      locationTypes: prev.locationTypes.map(lt => lt.id === id ? { ...lt, ...updates } : lt)
    }));
  }, [supabase]);

  const deleteLocationType = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('location_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    }

    setState(prev => ({
      ...prev,
      locationTypes: prev.locationTypes.map(lt => lt.id === id ? { ...lt, isActive: false } : lt)
    }));
  }, [supabase]);

  // ============================================================================
  // LOCATION CLASSIFICATION CRUD
  // ============================================================================

  const addLocationClassification = useCallback(async (classification: Omit<LocationClassification, 'id'>): Promise<LocationClassification> => {
    if (supabase) {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('location_classifications')
        .insert(transformLocationClassificationToDb(classification, userId))
        .select()
        .single();

      if (error) throw error;

      const newClass = transformLocationClassificationFromDb(data);
      setState(prev => ({ ...prev, locationClassifications: [...prev.locationClassifications, newClass] }));
      return newClass;
    }

    const newClass = { ...classification, id: generateId('locclass') } as LocationClassification;
    setState(prev => ({ ...prev, locationClassifications: [...prev.locationClassifications, newClass] }));
    return newClass;
  }, [supabase, generateId]);

  const updateLocationClassification = useCallback(async (id: string, updates: Partial<LocationClassification>) => {
    if (supabase) {
      const { error } = await supabase
        .from('location_classifications')
        .update(transformLocationClassificationToDb(updates))
        .eq('id', id);

      if (error) throw error;
    }

    setState(prev => ({
      ...prev,
      locationClassifications: prev.locationClassifications.map(lc => lc.id === id ? { ...lc, ...updates } : lc)
    }));
  }, [supabase]);

  const deleteLocationClassification = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('location_classifications')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    }

    setState(prev => ({
      ...prev,
      locationClassifications: prev.locationClassifications.map(lc => lc.id === id ? { ...lc, isActive: false } : lc)
    }));
  }, [supabase]);

  // ============================================================================
  // SUPPLIER CRUD
  // ============================================================================

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
    if (supabase) {
      // Get current user ID to save as personal item
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('suppliers')
        .insert(transformSupplierToDb(supplier, userId))
        .select()
        .single();

      if (error) throw error;

      const newSupplier = transformSupplierFromDb(data);
      setState(prev => ({ ...prev, suppliers: [...prev.suppliers, newSupplier] }));
      return newSupplier;
    }

    const newSupplier = { ...supplier, id: generateId('supp') } as Supplier;
    setState(prev => ({ ...prev, suppliers: [...prev.suppliers, newSupplier] }));
    return newSupplier;
  }, [supabase, generateId]);

  const updateSupplier = useCallback(async (id: string, updates: Partial<Supplier>) => {
    if (supabase) {
      const { error } = await supabase
        .from('suppliers')
        .update(transformSupplierToDb(updates))
        .eq('id', id);
      
      if (error) throw error;
    }
    
    setState(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  }, [supabase]);

  const deleteSupplier = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    }
    
    setState(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(s => s.id === id ? { ...s, isActive: false } : s)
    }));
  }, [supabase]);

  // ============================================================================
  // CULTURE CRUD
  // ============================================================================

  const addCulture = useCallback(async (culture: Omit<Culture, 'id' | 'createdAt' | 'updatedAt' | 'observations' | 'transfers'>): Promise<Culture> => {
    if (supabase) {
      // Get current user ID - required for RLS policy
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required. Please sign in to create cultures.');
      }
      const insertData = {
        ...transformCultureToDb(culture),
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('cultures')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newCulture = transformCultureFromDb(data);
      setState(prev => ({ ...prev, cultures: [newCulture, ...prev.cultures] }));
      return newCulture;
    }
    
    const now = new Date();
    const newCulture: Culture = {
      ...culture,
      id: generateId('cul'),
      createdAt: now,
      updatedAt: now,
      observations: [],
      transfers: [],
    };
    setState(prev => ({ ...prev, cultures: [newCulture, ...prev.cultures] }));
    return newCulture;
  }, [supabase, generateId]);

  const updateCulture = useCallback(async (id: string, updates: Partial<Culture>) => {
    if (supabase) {
      const { error } = await supabase
        .from('cultures')
        .update(transformCultureToDb(updates))
        .eq('id', id);
      
      if (error) throw error;
    }
    
    setState(prev => ({
      ...prev,
      cultures: prev.cultures.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c)
    }));
  }, [supabase]);

  const generateCultureLabel = useCallback((type: Culture['type']): string => {
    const prefixes: Record<Culture['type'], string> = {
      spore_syringe: 'SS',
      liquid_culture: 'LC',
      agar: 'AG',
      slant: 'SL',
    };
    const prefix = prefixes[type] || 'CUL';
    const count = state.cultures.filter(c => c.type === type).length + 1;
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `${prefix}-${date}-${count.toString().padStart(3, '0')}`;
  }, [state.cultures]);

  const getCultureLineage = useCallback((cultureId: string) => {
    const ancestors: Culture[] = [];
    const descendants: Culture[] = [];
    
    // Get ancestors
    let current = state.cultures.find(c => c.id === cultureId);
    while (current?.parentId) {
      const parent = state.cultures.find(c => c.id === current!.parentId);
      if (parent) {
        ancestors.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    
    // Get descendants (recursive)
    const findDescendants = (parentId: string) => {
      const children = state.cultures.filter(c => c.parentId === parentId);
      for (const child of children) {
        descendants.push(child);
        findDescendants(child.id);
      }
    };
    findDescendants(cultureId);
    
    return { ancestors, descendants };
  }, [state.cultures]);

  const addCultureObservation = useCallback(async (cultureId: string, observation: Omit<CultureObservation, 'id'>) => {
    const newObs: CultureObservation = { ...observation, id: generateId('obs') };

    // Determine cascade updates for the culture
    const cultureUpdates: Partial<Culture> = {
      updatedAt: new Date(),
    };

    // CASCADE: If observation includes health rating, update the culture's health
    if (observation.healthRating !== undefined && observation.healthRating !== null) {
      cultureUpdates.healthRating = observation.healthRating;
    }

    // CASCADE: If observation type indicates contamination, update culture status
    if (observation.type === 'contamination') {
      cultureUpdates.status = 'contaminated';
    }

    // Persist to Supabase if connected
    if (supabase) {
      try {
        const userId = await getCachedUserId();

        // Insert the observation to culture_observations table
        const { error: obsError } = await supabase
          .from('culture_observations')
          .insert({
            id: newObs.id,
            culture_id: cultureId,
            date: observation.date instanceof Date ? observation.date.toISOString() : observation.date,
            type: observation.type,
            notes: observation.notes,
            health_rating: observation.healthRating,
            images: observation.images,
            user_id: userId,
          });

        if (obsError) {
          console.error('Failed to save observation to database:', obsError);
          throw obsError;
        }

        // Update the culture's health_rating and status if needed
        if (Object.keys(cultureUpdates).length > 1) { // More than just updatedAt
          const { error: cultureError } = await supabase
            .from('cultures')
            .update(transformCultureToDb(cultureUpdates))
            .eq('id', cultureId);

          if (cultureError) {
            console.error('Failed to update culture cascade:', cultureError);
            // Don't throw - observation was saved, just log the cascade failure
          }
        }
      } catch (error) {
        console.error('Error persisting observation:', error);
        throw error;
      }
    }

    // Update local state
    setState(prev => ({
      ...prev,
      cultures: prev.cultures.map(c => {
        if (c.id !== cultureId) return c;

        return {
          ...c,
          observations: [...c.observations, newObs],
          ...cultureUpdates,
        };
      })
    }));
  }, [generateId, supabase, getCachedUserId]);

  const addCultureTransfer = useCallback((cultureId: string, transfer: Omit<CultureTransfer, 'id'>): Culture | null => {
    // 1. Get source culture
    const sourceCulture = state.cultures.find(c => c.id === cultureId);
    if (!sourceCulture) return null;

    const transferId = generateId('trans');
    const newTransfer: CultureTransfer = { ...transfer, id: transferId };

    // 2. Calculate cost of the transferred amount
    // Convert quantity to ml for cost calculation
    let transferredVolumeMl = transfer.quantity;
    if (transfer.unit === 'drop') {
      transferredVolumeMl = transfer.quantity * 0.05; // ~0.05ml per drop
    } else if (transfer.unit === 'cc') {
      transferredVolumeMl = transfer.quantity; // 1cc = 1ml
    } else if (transfer.unit === 'wedge') {
      // For agar wedges, estimate based on plate size (typically 1 wedge = 10% of plate)
      transferredVolumeMl = (sourceCulture.fillVolumeMl || sourceCulture.volumeMl || 20) * 0.1 * transfer.quantity;
    }

    // Calculate cost per ml of source culture
    const sourceTotalCost = (sourceCulture.purchaseCost ?? 0) + (sourceCulture.productionCost ?? 0)
                          + (sourceCulture.parentCultureCost ?? 0) + (sourceCulture.cost ?? 0);
    const sourceFillVolume = sourceCulture.fillVolumeMl ?? sourceCulture.volumeMl ?? 1;
    const costPerMl = sourceFillVolume > 0 ? sourceTotalCost / sourceFillVolume : 0;

    // Cost transferred to the new culture
    const transferredCost = costPerMl * transferredVolumeMl;

    // 3. Prepare new culture object if needed
    let newCulture: Culture | null = null;
    const isCultureCreation = ['liquid_culture', 'agar', 'slant', 'spore_syringe'].includes(transfer.toType);

    // Check if we should create a new culture (either ID provided or implied by type)
    if (isCultureCreation && (transfer.toId || !transfer.toId)) { // Create if it's a culture type
      const targetId = transfer.toId || generateId('cul');
      // Update transfer with the actual target ID if we generated it
      newTransfer.toId = targetId;

      const now = new Date();

      // Inherit what we can from parent, use defaults for rest
      newCulture = {
        id: targetId,
        type: transfer.toType as any,
        label: generateCultureLabel(transfer.toType as any),
        strainId: sourceCulture.strainId,
        status: 'colonizing',
        parentId: sourceCulture.id,
        generation: (sourceCulture.generation || 0) + 1,
        locationId: sourceCulture.locationId, // Default to parent location
        containerId: state.containers.find(c => c.isActive && c.usageContext.includes('culture'))?.id || 'default-container', // Needs selection
        volumeMl: undefined,
        fillVolumeMl: transferredVolumeMl, // Start with the transferred volume
        prepDate: new Date().toISOString().split('T')[0],
        sterilizationDate: undefined,
        healthRating: 5,
        notes: `Transferred from ${sourceCulture.label}\n${transfer.notes || ''}`,
        cost: 0, // Legacy field - use breakdown fields instead
        purchaseCost: 0,
        productionCost: 0,
        parentCultureCost: transferredCost, // Set the inherited cost
        volumeUsed: 0,
        costPerMl: transferredVolumeMl > 0 ? transferredCost / transferredVolumeMl : 0,
        createdAt: now,
        updatedAt: now,
        observations: [],
        transfers: [],
      };
    }

    // 4. Calculate updated source culture values
    const newVolumeUsed = (sourceCulture.volumeUsed ?? 0) + transferredVolumeMl;
    const newFillVolume = Math.max(0, (sourceCulture.fillVolumeMl ?? sourceCulture.volumeMl ?? 0) - transferredVolumeMl);

    // 5. Update local state
    setState(prev => {
      // Update source culture transfers and volume tracking
      const updatedCultures = prev.cultures.map(c =>
        c.id === cultureId
          ? {
              ...c,
              transfers: [...c.transfers, newTransfer],
              volumeUsed: newVolumeUsed,
              fillVolumeMl: newFillVolume,
              costPerMl: costPerMl, // Update the cost per ml
              updatedAt: new Date()
            }
          : c
      );

      // Add new culture if created
      if (newCulture) {
        updatedCultures.unshift(newCulture);
      }

      return { ...prev, cultures: updatedCultures };
    });

    // 6. Persist to Supabase (fire and forget)
    if (supabase) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          if (!userId) return;

          // Insert new culture if created
          if (newCulture) {
            const { error: cultureError } = await supabase
              .from('cultures')
              .insert({
                ...transformCultureToDb(newCulture),
                user_id: userId
              });

            if (cultureError) {
              console.error('Failed to persist new culture:', cultureError);
              return; // Stop if culture creation failed
            }
          }

          // Update source culture volume tracking
          const { error: updateError } = await supabase
            .from('cultures')
            .update({
              volume_used: newVolumeUsed,
              fill_volume_ml: newFillVolume,
              cost_per_ml: costPerMl,
              updated_at: new Date().toISOString()
            })
            .eq('id', cultureId);

          if (updateError) {
            console.error('Failed to update source culture volume:', updateError);
          }

          // Insert transfer record
          const { error: transferError } = await supabase
            .from('culture_transfers')
            .insert({
              source_culture_id: cultureId,
              target_culture_id: newTransfer.toId || null,
              date: transfer.date.toISOString(),
              notes: transfer.notes,
              quantity: transfer.quantity,
              unit: transfer.unit,
              to_type: transfer.toType,
              user_id: userId
            });

          if (transferError) {
            console.error('Failed to persist transfer:', transferError);
          }
        } catch (err) {
          console.error('Error in addCultureTransfer persistence:', err);
        }
      })();
    }

    return newCulture;
  }, [state.cultures, state.containers, generateId, generateCultureLabel, supabase]);

  // ============================================================================
  // PREPARED SPAWN CRUD
  // ============================================================================

  const addPreparedSpawn = useCallback(async (spawn: Omit<PreparedSpawn, 'id' | 'createdAt' | 'updatedAt'>): Promise<PreparedSpawn> => {
    if (supabase) {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required. Please sign in to create prepared spawn.');
      }
      const insertData = {
        ...transformPreparedSpawnToDb(spawn),
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('prepared_spawn')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newSpawn = transformPreparedSpawnFromDb(data);
      setState(prev => ({ ...prev, preparedSpawn: [newSpawn, ...prev.preparedSpawn] }));
      return newSpawn;
    }

    const newSpawn: PreparedSpawn = {
      ...spawn,
      id: generateId('prepared-spawn'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setState(prev => ({ ...prev, preparedSpawn: [newSpawn, ...prev.preparedSpawn] }));
    return newSpawn;
  }, [supabase, generateId]);

  const updatePreparedSpawn = useCallback(async (id: string, updates: Partial<PreparedSpawn>) => {
    if (supabase) {
      const { error } = await supabase
        .from('prepared_spawn')
        .update(transformPreparedSpawnToDb(updates))
        .eq('id', id);

      if (error) throw error;
    }

    setState(prev => ({
      ...prev,
      preparedSpawn: prev.preparedSpawn.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s)
    }));
  }, [supabase]);

  const deletePreparedSpawn = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('prepared_spawn')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }

    setState(prev => ({
      ...prev,
      preparedSpawn: prev.preparedSpawn.filter(s => s.id !== id)
    }));
  }, [supabase]);

  const inoculatePreparedSpawn = useCallback(async (preparedSpawnId: string, resultCultureId: string) => {
    const updates: Partial<PreparedSpawn> = {
      status: 'inoculated' as PreparedSpawnStatus,
      inoculatedAt: new Date(),
      resultCultureId,
    };

    await updatePreparedSpawn(preparedSpawnId, updates);
  }, [updatePreparedSpawn]);

  const getAvailablePreparedSpawn = useCallback((type?: PreparedSpawn['type']): PreparedSpawn[] => {
    return state.preparedSpawn.filter(s =>
      s.status === 'available' &&
      s.isActive &&
      (!type || s.type === type)
    );
  }, [state.preparedSpawn]);

  // ============================================================================
  // GROW CRUD
  // ============================================================================

  const addGrow = useCallback(async (grow: Omit<Grow, 'id' | 'createdAt' | 'observations' | 'flushes' | 'totalYield'>): Promise<Grow> => {
    if (supabase) {
      // Get current user ID - required for RLS policy
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required. Please sign in to create grows.');
      }
      const insertData = {
        ...transformGrowToDb(grow),
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('grows')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newGrow = transformGrowFromDb(data);
      setState(prev => ({ ...prev, grows: [newGrow, ...prev.grows] }));
      return newGrow;
    }
    
    const newGrow: Grow = {
      ...grow,
      id: generateId('grow'),
      createdAt: new Date(),
      observations: [],
      flushes: [],
      totalYield: 0,
    };
    setState(prev => ({ ...prev, grows: [newGrow, ...prev.grows] }));
    return newGrow;
  }, [supabase, generateId]);

  const updateGrow = useCallback(async (id: string, updates: Partial<Grow>) => {
    if (supabase) {
      const { error } = await supabase
        .from('grows')
        .update(transformGrowToDb(updates))
        .eq('id', id);
      
      if (error) throw error;
    }
    
    setState(prev => ({
      ...prev,
      grows: prev.grows.map(g => g.id === id ? { ...g, ...updates } : g)
    }));
  }, [supabase]);

  // ============================================================================
  // OUTCOME LOGGING
  // ============================================================================

  const saveEntityOutcome = useCallback(async (outcomeData: EntityOutcomeData): Promise<EntityOutcome> => {
    const now = new Date();

    // Calculate duration
    const startDate = outcomeData.startedAt ? new Date(outcomeData.startedAt) : null;
    const endDate = outcomeData.endedAt ? new Date(outcomeData.endedAt) : now;
    const durationDays = startDate
      ? Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    // Build outcome object (id will be assigned by DB or locally)
    const outcomeBase = {
      entityType: outcomeData.entityType,
      entityId: outcomeData.entityId,
      entityName: outcomeData.entityName,
      outcomeCategory: outcomeData.outcomeCategory,
      outcomeCode: outcomeData.outcomeCode,
      outcomeLabel: outcomeData.outcomeLabel,
      startedAt: outcomeData.startedAt,
      endedAt: endDate,
      durationDays,
      totalCost: outcomeData.totalCost,
      totalYieldWet: outcomeData.totalYieldWet,
      totalYieldDry: outcomeData.totalYieldDry,
      biologicalEfficiency: outcomeData.biologicalEfficiency,
      flushCount: outcomeData.flushCount,
      strainId: outcomeData.strainId,
      strainName: outcomeData.strainName,
      speciesId: outcomeData.speciesId,
      speciesName: outcomeData.speciesName,
      locationId: outcomeData.locationId,
      locationName: outcomeData.locationName,
      surveyResponses: outcomeData.surveyResponses,
      notes: outcomeData.notes,
      createdAt: now,
    };

    if (supabase) {
      const userId = await getCurrentUserId();
      // Let database generate UUID - don't send custom ID
      const { data, error } = await supabase
        .from('entity_outcomes')
        .insert({
          // id is omitted - database will generate UUID via uuid_generate_v4()
          entity_type: outcomeBase.entityType,
          entity_id: outcomeBase.entityId,
          entity_name: outcomeBase.entityName,
          outcome_category: outcomeBase.outcomeCategory,
          outcome_code: outcomeBase.outcomeCode,
          outcome_label: outcomeBase.outcomeLabel,
          started_at: outcomeBase.startedAt?.toISOString(),
          ended_at: outcomeBase.endedAt.toISOString(),
          duration_days: outcomeBase.durationDays,
          total_cost: outcomeBase.totalCost,
          total_yield_wet: outcomeBase.totalYieldWet,
          total_yield_dry: outcomeBase.totalYieldDry,
          biological_efficiency: outcomeBase.biologicalEfficiency,
          flush_count: outcomeBase.flushCount,
          strain_id: outcomeBase.strainId,
          strain_name: outcomeBase.strainName,
          species_id: outcomeBase.speciesId,
          species_name: outcomeBase.speciesName,
          location_id: outcomeBase.locationId,
          location_name: outcomeBase.locationName,
          survey_responses: outcomeBase.surveyResponses || {},
          notes: outcomeBase.notes,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save entity outcome:', error);
        // Emit error event for user notification (caught by error boundary or global handler)
        window.dispatchEvent(new CustomEvent('mycolab:error', {
          detail: {
            type: 'database',
            message: 'Failed to save grow survey data',
            technical: error.message,
            recoverable: true,
          }
        }));
        // Return outcome with local ID as fallback
        return { ...outcomeBase, id: generateId('outcome') };
      }

      // Return outcome with database-generated UUID
      return { ...outcomeBase, id: data.id };
    }

    // Offline mode - generate local ID
    return { ...outcomeBase, id: generateId('outcome') };
  }, [supabase, generateId]);

  const saveContaminationDetails = useCallback(async (outcomeId: string, details: ContaminationDetailsData): Promise<void> => {
    if (!supabase) return;

    const userId = await getCurrentUserId();
    // Let database generate UUID - don't send custom ID
    const { error } = await supabase
      .from('contamination_details')
      .insert({
        // id is omitted - database will generate UUID via uuid_generate_v4()
        outcome_id: outcomeId,
        contamination_type: details.contaminationType,
        contamination_stage: details.contaminationStage,
        days_to_detection: details.daysToDetection,
        suspected_cause: details.suspectedCause,
        temperature_at_detection: details.temperatureAtDetection,
        humidity_at_detection: details.humidityAtDetection,
        images: details.images,
        notes: details.notes,
        user_id: userId,
      });

    if (error) {
      console.error('Failed to save contamination details:', error);
      // Emit error event for user notification
      window.dispatchEvent(new CustomEvent('mycolab:error', {
        detail: {
          type: 'database',
          message: 'Failed to save contamination details',
          technical: error.message,
          recoverable: true,
        }
      }));
    }
  }, [supabase]);

  // Delete culture with optional outcome recording for historical tracking
  const deleteCulture = useCallback(async (id: string, outcome?: EntityOutcomeData) => {
    // If outcome data provided, save it first (append-only historical record)
    if (outcome) {
      const savedOutcome = await saveEntityOutcome(outcome);

      // If it's a contamination outcome, check for contamination details
      if (outcome.surveyResponses?.contamination && savedOutcome.id) {
        const contamDetails = outcome.surveyResponses.contamination as ContaminationDetailsData;
        if (contamDetails.contaminationType || contamDetails.suspectedCause) {
          await saveContaminationDetails(savedOutcome.id, contamDetails);
        }
      }
    }

    if (supabase) {
      const { error } = await supabase
        .from('cultures')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }

    setState(prev => ({
      ...prev,
      cultures: prev.cultures.filter(c => c.id !== id)
    }));
  }, [supabase, saveEntityOutcome, saveContaminationDetails]);

  const deleteGrow = useCallback(async (id: string, outcome?: EntityOutcomeData) => {
    // If outcome data provided, save it first
    if (outcome) {
      const savedOutcome = await saveEntityOutcome(outcome);

      // If it's a contamination outcome, check for contamination details
      if (outcome.surveyResponses?.contamination && savedOutcome.id) {
        const contamDetails = outcome.surveyResponses.contamination as ContaminationDetailsData;
        if (contamDetails.contaminationType || contamDetails.suspectedCause) {
          await saveContaminationDetails(savedOutcome.id, contamDetails);
        }
      }
    }

    if (supabase) {
      const { error } = await supabase
        .from('grows')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }

    setState(prev => ({
      ...prev,
      grows: prev.grows.filter(g => g.id !== id)
    }));
  }, [supabase, saveEntityOutcome, saveContaminationDetails]);

  // ============================================================================
  // IMMUTABLE RECORD OPERATIONS
  // Amend creates new version, Archive soft-deletes with reason
  // ============================================================================

  /**
   * Amend a culture record (creates new version, marks old as superseded)
   * This follows the immutable database pattern - original record is preserved
   */
  const amendCulture = useCallback(async (
    originalId: string,
    changes: Partial<Culture>,
    amendmentType: AmendmentType,
    reason: string
  ): Promise<Culture> => {
    const original = state.cultures.find(c => c.id === originalId);
    if (!original) throw new Error(`Culture not found: ${originalId}`);

    const now = new Date();
    const newId = generateId('cul');
    const recordGroupId = original.recordGroupId || original.id;
    const newVersion = (original.version || 1) + 1;

    // Create the new version with changes applied
    const newCulture: Culture = {
      ...original,
      ...changes,
      id: newId,
      version: newVersion,
      recordGroupId: recordGroupId,
      isCurrent: true,
      validFrom: now,
      validTo: undefined,
      supersededById: undefined,
      isArchived: false,
      amendmentType: amendmentType,
      amendmentReason: reason,
      amendsRecordId: originalId,
      updatedAt: now,
    };

    // Update original to mark as superseded
    const updatedOriginal: Partial<Culture> = {
      isCurrent: false,
      validTo: now,
      supersededById: newId,
    };

    if (supabase) {
      // Update original record
      const { error: updateError } = await supabase
        .from('cultures')
        .update({
          is_current: false,
          valid_to: now.toISOString(),
          superseded_by_id: newId,
        })
        .eq('id', originalId);

      if (updateError) throw updateError;

      // Insert new version
      const userId = await getCurrentUserId();
      const { error: insertError } = await supabase
        .from('cultures')
        .insert({
          ...transformCultureToDb(newCulture),
          id: newId,
          user_id: userId,
        });

      if (insertError) throw insertError;

      // Log to amendment log
      await supabase.from('data_amendment_log').insert({
        entity_type: 'cultures',
        original_record_id: originalId,
        new_record_id: newId,
        record_group_id: recordGroupId,
        amendment_type: amendmentType,
        reason: reason,
        amended_by: userId,
        user_id: userId,
      });
    }

    // Update local state
    setState(prev => ({
      ...prev,
      cultures: prev.cultures
        .map(c => c.id === originalId ? { ...c, ...updatedOriginal } : c)
        .concat([newCulture]),
    }));

    return newCulture;
  }, [state.cultures, supabase, generateId]);

  /**
   * Archive a culture record (soft-delete with reason)
   * IDEMPOTENT: Safe to call multiple times - only archives if not already archived
   */
  const archiveCulture = useCallback(async (id: string, reason: string): Promise<void> => {
    const culture = state.cultures.find(c => c.id === id);
    if (!culture) throw new Error(`Culture not found: ${id}`);

    // Guard: Prevent double-archiving (local state check)
    if (culture.isArchived) {
      console.warn(`[Archive] Culture ${id} is already archived in local state, skipping`);
      return;
    }

    const now = new Date();
    const userId = await getCurrentUserId();

    const updates = {
      isArchived: true,
      archivedAt: now,
      archivedBy: userId || undefined,
      archiveReason: reason,
      isCurrent: false,
      validTo: now,
    };

    if (supabase) {
      // IDEMPOTENT: Only update if not already archived in database
      // This prevents 409 conflicts from double-clicks or stale state
      const { data, error } = await supabase
        .from('cultures')
        .update({
          is_archived: true,
          archived_at: now.toISOString(),
          archived_by: userId,
          archive_reason: reason,
          is_current: false,
          valid_to: now.toISOString(),
        })
        .eq('id', id)
        .eq('is_archived', false)  // Only update non-archived records
        .select('id');

      if (error) {
        // Log but don't throw - might be a race condition where it was already archived
        console.error(`[Archive] Database error for culture ${id}:`, error);
        throw error;
      }

      // Check if we actually updated anything (0 rows = already archived in DB)
      if (!data || data.length === 0) {
        console.warn(`[Archive] Culture ${id} was already archived in database, skipping amendment log`);
        // Still update local state to sync with DB
        setState(prev => ({
          ...prev,
          cultures: prev.cultures.map(c => c.id === id ? { ...c, ...updates } : c),
        }));
        return;
      }

      // Log to amendment log only if we actually archived
      await supabase.from('data_amendment_log').insert({
        entity_type: 'cultures',
        original_record_id: id,
        new_record_id: id,
        record_group_id: culture.recordGroupId || id,
        amendment_type: 'archive',
        reason: reason,
        amended_by: userId,
        user_id: userId,
      });
    }

    setState(prev => ({
      ...prev,
      cultures: prev.cultures.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, [state.cultures, supabase]);

  /**
   * Amend a grow record (creates new version, marks old as superseded)
   */
  const amendGrow = useCallback(async (
    originalId: string,
    changes: Partial<Grow>,
    amendmentType: AmendmentType,
    reason: string
  ): Promise<Grow> => {
    const original = state.grows.find(g => g.id === originalId);
    if (!original) throw new Error(`Grow not found: ${originalId}`);

    const now = new Date();
    const newId = generateId('grow');
    const recordGroupId = original.recordGroupId || original.id;
    const newVersion = (original.version || 1) + 1;

    // Create the new version with changes applied
    const newGrow: Grow = {
      ...original,
      ...changes,
      id: newId,
      version: newVersion,
      recordGroupId: recordGroupId,
      isCurrent: true,
      validFrom: now,
      validTo: undefined,
      supersededById: undefined,
      isArchived: false,
      amendmentType: amendmentType,
      amendmentReason: reason,
      amendsRecordId: originalId,
    };

    // Update original to mark as superseded
    const updatedOriginal: Partial<Grow> = {
      isCurrent: false,
      validTo: now,
      supersededById: newId,
    };

    if (supabase) {
      // Update original record
      const { error: updateError } = await supabase
        .from('grows')
        .update({
          is_current: false,
          valid_to: now.toISOString(),
          superseded_by_id: newId,
        })
        .eq('id', originalId);

      if (updateError) throw updateError;

      // Insert new version
      const userId = await getCurrentUserId();
      const { error: insertError } = await supabase
        .from('grows')
        .insert({
          ...transformGrowToDb(newGrow),
          id: newId,
          user_id: userId,
        });

      if (insertError) throw insertError;

      // Log to amendment log
      await supabase.from('data_amendment_log').insert({
        entity_type: 'grows',
        original_record_id: originalId,
        new_record_id: newId,
        record_group_id: recordGroupId,
        amendment_type: amendmentType,
        reason: reason,
        amended_by: userId,
        user_id: userId,
      });
    }

    // Update local state
    setState(prev => ({
      ...prev,
      grows: prev.grows
        .map(g => g.id === originalId ? { ...g, ...updatedOriginal } : g)
        .concat([newGrow]),
    }));

    return newGrow;
  }, [state.grows, supabase, generateId]);

  /**
   * Archive a grow record (soft-delete with reason)
   * IDEMPOTENT: Safe to call multiple times - only archives if not already archived
   */
  const archiveGrow = useCallback(async (id: string, reason: string): Promise<void> => {
    const grow = state.grows.find(g => g.id === id);
    if (!grow) throw new Error(`Grow not found: ${id}`);

    // Guard: Prevent double-archiving (local state check)
    if (grow.isArchived) {
      console.warn(`[Archive] Grow ${id} is already archived in local state, skipping`);
      return;
    }

    const now = new Date();
    const userId = await getCurrentUserId();

    const updates = {
      isArchived: true,
      archivedAt: now,
      archivedBy: userId || undefined,
      archiveReason: reason,
      isCurrent: false,
      validTo: now,
    };

    if (supabase) {
      // IDEMPOTENT: Only update if not already archived in database
      // This prevents 409 conflicts from double-clicks or stale state
      const { data, error } = await supabase
        .from('grows')
        .update({
          is_archived: true,
          archived_at: now.toISOString(),
          archived_by: userId,
          archive_reason: reason,
          is_current: false,
          valid_to: now.toISOString(),
        })
        .eq('id', id)
        .eq('is_archived', false)  // Only update non-archived records
        .select('id');

      if (error) {
        console.error(`[Archive] Database error for grow ${id}:`, error);
        throw error;
      }

      // Check if we actually updated anything (0 rows = already archived in DB)
      if (!data || data.length === 0) {
        console.warn(`[Archive] Grow ${id} was already archived in database, skipping amendment log`);
        // Still update local state to sync with DB
        setState(prev => ({
          ...prev,
          grows: prev.grows.map(g => g.id === id ? { ...g, ...updates } : g),
        }));
        return;
      }

      // Log to amendment log only if we actually archived
      await supabase.from('data_amendment_log').insert({
        entity_type: 'grows',
        original_record_id: id,
        new_record_id: id,
        record_group_id: grow.recordGroupId || id,
        amendment_type: 'archive',
        reason: reason,
        amended_by: userId,
        user_id: userId,
      });
    }

    setState(prev => ({
      ...prev,
      grows: prev.grows.map(g => g.id === id ? { ...g, ...updates } : g),
    }));
  }, [state.grows, supabase]);

  /**
   * Archive ALL user data (bulk soft-delete for data reset)
   * Archives cultures, grows, and prepared_spawn in batch operations
   * Returns counts of records archived
   */
  const archiveAllUserData = useCallback(async (reason: string): Promise<{ culturesArchived: number; growsArchived: number; preparedSpawnArchived: number }> => {
    const now = new Date();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Must be authenticated to archive user data');
    }

    const results = {
      culturesArchived: 0,
      growsArchived: 0,
      preparedSpawnArchived: 0,
    };

    // Get non-archived records for each entity type
    const culturesToArchive = state.cultures.filter(c => !c.isArchived);
    const growsToArchive = state.grows.filter(g => !g.isArchived);
    const preparedSpawnToArchive = state.preparedSpawn.filter(p => !p.isArchived);

    console.log(`[ArchiveAll] Starting bulk archive: ${culturesToArchive.length} cultures, ${growsToArchive.length} grows, ${preparedSpawnToArchive.length} prepared spawn`);

    if (supabase) {
      // Archive cultures in batch
      if (culturesToArchive.length > 0) {
        const cultureIds = culturesToArchive.map(c => c.id);
        const { data, error } = await supabase
          .from('cultures')
          .update({
            is_archived: true,
            archived_at: now.toISOString(),
            archived_by: userId,
            archive_reason: reason,
            is_current: false,
            valid_to: now.toISOString(),
          })
          .in('id', cultureIds)
          .eq('is_archived', false)
          .select('id');

        if (error) {
          console.error('[ArchiveAll] Error archiving cultures:', error);
          throw error;
        }
        results.culturesArchived = data?.length || 0;
        console.log(`[ArchiveAll] Archived ${results.culturesArchived} cultures`);
      }

      // Archive grows in batch
      if (growsToArchive.length > 0) {
        const growIds = growsToArchive.map(g => g.id);
        const { data, error } = await supabase
          .from('grows')
          .update({
            is_archived: true,
            archived_at: now.toISOString(),
            archived_by: userId,
            archive_reason: reason,
            is_current: false,
            valid_to: now.toISOString(),
          })
          .in('id', growIds)
          .eq('is_archived', false)
          .select('id');

        if (error) {
          console.error('[ArchiveAll] Error archiving grows:', error);
          throw error;
        }
        results.growsArchived = data?.length || 0;
        console.log(`[ArchiveAll] Archived ${results.growsArchived} grows`);
      }

      // Archive prepared spawn in batch
      if (preparedSpawnToArchive.length > 0) {
        const spawnIds = preparedSpawnToArchive.map(p => p.id);
        const { data, error } = await supabase
          .from('prepared_spawn')
          .update({
            is_archived: true,
            archived_at: now.toISOString(),
            archived_by: userId,
            archive_reason: reason,
            is_current: false,
            valid_to: now.toISOString(),
          })
          .in('id', spawnIds)
          .eq('is_archived', false)
          .select('id');

        if (error) {
          console.error('[ArchiveAll] Error archiving prepared spawn:', error);
          throw error;
        }
        results.preparedSpawnArchived = data?.length || 0;
        console.log(`[ArchiveAll] Archived ${results.preparedSpawnArchived} prepared spawn`);
      }

      // Log to amendment log (single entry for the bulk operation)
      await supabase.from('data_amendment_log').insert({
        entity_type: 'bulk_archive',
        original_record_id: userId,
        new_record_id: userId,
        record_group_id: `bulk-archive-${now.toISOString()}`,
        amendment_type: 'archive',
        reason: reason,
        amended_by: userId,
        user_id: userId,
        changes: JSON.stringify(results),
      });
    }

    // Update local state - REMOVE archived records from state entirely
    // (they're preserved in the database but shouldn't show in UI)
    const cultureIdsToRemove = new Set(culturesToArchive.map(c => c.id));
    const growIdsToRemove = new Set(growsToArchive.map(g => g.id));
    const spawnIdsToRemove = new Set(preparedSpawnToArchive.map(p => p.id));

    setState(prev => ({
      ...prev,
      cultures: prev.cultures.filter(c => !cultureIdsToRemove.has(c.id)),
      grows: prev.grows.filter(g => !growIdsToRemove.has(g.id)),
      preparedSpawn: prev.preparedSpawn.filter(p => !spawnIdsToRemove.has(p.id)),
    }));

    const total = results.culturesArchived + results.growsArchived + results.preparedSpawnArchived;
    console.log(`[ArchiveAll] Bulk archive complete: ${total} total records archived`);

    return results;
  }, [state.cultures, state.grows, state.preparedSpawn, supabase]);

  /**
   * Get version history for a record (returns all versions sorted by version number)
   */
  const getRecordHistory = useCallback((
    entityType: 'culture' | 'grow' | 'prepared_spawn',
    recordGroupId: string
  ): RecordVersionSummary[] => {
    let records: Array<{ id: string; version?: number; isCurrent?: boolean; validFrom?: Date; validTo?: Date; amendmentType?: AmendmentType; amendmentReason?: string }> = [];

    if (entityType === 'culture') {
      records = state.cultures.filter(c => (c.recordGroupId || c.id) === recordGroupId);
    } else if (entityType === 'grow') {
      records = state.grows.filter(g => (g.recordGroupId || g.id) === recordGroupId);
    } else if (entityType === 'prepared_spawn') {
      records = state.preparedSpawn.filter(p => (p.recordGroupId || p.id) === recordGroupId);
    }

    return records
      .map(r => ({
        id: r.id,
        version: r.version || 1,
        isCurrent: r.isCurrent ?? true,
        validFrom: r.validFrom || new Date(),
        validTo: r.validTo,
        amendmentType: r.amendmentType || 'original',
        amendmentReason: r.amendmentReason,
      }))
      .sort((a, b) => a.version - b.version);
  }, [state.cultures, state.grows, state.preparedSpawn]);

  /**
   * Get amendment log entries for a record group
   */
  const getAmendmentLog = useCallback((recordGroupId: string): DataAmendmentLogEntry[] => {
    return state.dataAmendmentLog
      .filter(entry => entry.recordGroupId === recordGroupId)
      .sort((a, b) => new Date(b.amendedAt).getTime() - new Date(a.amendedAt).getTime());
  }, [state.dataAmendmentLog]);

  const stageOrder: GrowStage[] = ['spawning', 'colonization', 'fruiting', 'harvesting', 'completed'];

  const advanceGrowStage = useCallback(async (growId: string) => {
    const grow = state.grows.find(g => g.id === growId);
    if (!grow || grow.currentStage === 'completed' || grow.currentStage === 'contaminated' || grow.currentStage === 'aborted') return;
    
    const currentIndex = stageOrder.indexOf(grow.currentStage);
    if (currentIndex === -1 || currentIndex >= stageOrder.length - 1) return;
    
    const nextStage = stageOrder[currentIndex + 1];
    const updates: Partial<Grow> = { currentStage: nextStage };
    
    if (nextStage === 'colonization') updates.colonizationStartedAt = new Date();
    if (nextStage === 'fruiting') updates.fruitingStartedAt = new Date();
    if (nextStage === 'completed') {
      updates.completedAt = new Date();
      updates.status = 'completed';
    }
    
    await updateGrow(growId, updates);
  }, [state.grows, updateGrow]);

  const markGrowContaminated = useCallback(async (growId: string, notes?: string) => {
    const updates: Partial<Grow> = {
      currentStage: 'contaminated',
      status: 'failed',
      notes: notes,
    };
    await updateGrow(growId, updates);
  }, [updateGrow]);

  const addGrowObservation = useCallback((growId: string, observation: Omit<GrowObservation, 'id'>) => {
    const newObs: GrowObservation = { ...observation, id: generateId('gobs') };

    setState(prev => ({
      ...prev,
      grows: prev.grows.map(g => {
        if (g.id !== growId) return g;

        // Start with the observation being added
        const updates: Partial<Grow> = {
          observations: [...g.observations, newObs],
        };

        // CASCADE: If observation indicates contamination, update grow stage and status
        if (observation.type === 'contamination') {
          updates.currentStage = 'contaminated';
          updates.status = 'failed';
        }

        // CASCADE: If milestone observation mentions pins/pinning and grow is in colonization, advance to fruiting
        if (observation.type === 'milestone' && g.currentStage === 'colonization') {
          const pinKeywords = ['pin', 'pins', 'pinning', 'primordia', 'knots'];
          const hasPin = pinKeywords.some(kw =>
            observation.title?.toLowerCase().includes(kw) ||
            observation.notes?.toLowerCase().includes(kw)
          );
          if (hasPin) {
            updates.currentStage = 'fruiting';
          }
        }

        return { ...g, ...updates };
      })
    }));
  }, [generateId]);

  const addFlush = useCallback(async (growId: string, flush: Omit<Flush, 'id' | 'flushNumber'>) => {
    const grow = state.grows.find(g => g.id === growId);
    if (!grow) return;

    const flushNumber = grow.flushes.length + 1;

    if (supabase) {
      // Get current user ID - required for RLS policy
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required. Please sign in to record flushes.');
      }
      const insertData = {
        ...transformFlushToDb({ ...flush, flushNumber }, growId),
        user_id: userId,
      };

      let flushData: any = null;
      let insertError: any = null;

      // Try direct insert first
      const { data, error } = await supabase
        .from('flushes')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Check if this is a PostgREST schema cache error (PGRST204)
        // If so, try the RPC function which bypasses the schema cache
        if (error.code === 'PGRST204' || error.message?.includes('schema cache')) {
          console.warn('PostgREST schema cache error detected, trying RPC fallback...');

          // Use RPC function to insert flush (bypasses PostgREST schema cache)
          const harvestDate = flush.harvestDate instanceof Date
            ? flush.harvestDate.toISOString().split('T')[0]
            : flush.harvestDate;

          const { data: rpcData, error: rpcError } = await supabase.rpc('insert_flush', {
            p_grow_id: growId,
            p_flush_number: flushNumber,
            p_harvest_date: harvestDate,
            p_wet_weight_g: flush.wetWeight,
            p_dry_weight_g: flush.dryWeight,
            p_mushroom_count: flush.mushroomCount || null,
            p_quality: flush.quality || 'good',
            p_notes: flush.notes || null,
            p_user_id: userId,
          });

          if (rpcError) {
            console.error('RPC fallback also failed:', rpcError);
            insertError = rpcError;
          } else {
            console.log('RPC insert successful:', rpcData);
            flushData = rpcData;
          }
        } else {
          insertError = error;
        }
      } else {
        flushData = data;
      }

      if (insertError) throw insertError;

      const newFlush = transformFlushFromDb(flushData);
      setState(prev => ({
        ...prev,
        grows: prev.grows.map(g =>
          g.id === growId
            ? {
                ...g,
                flushes: [...g.flushes, newFlush],
                totalYield: g.totalYield + flush.wetWeight
              }
            : g
        )
      }));
      return;
    }

    const newFlush: Flush = {
      ...flush,
      id: generateId('flush'),
      flushNumber,
    };
    setState(prev => ({
      ...prev,
      grows: prev.grows.map(g =>
        g.id === growId
          ? {
              ...g,
              flushes: [...g.flushes, newFlush],
              totalYield: g.totalYield + flush.wetWeight
            }
          : g
      )
    }));
  }, [supabase, state.grows, generateId]);

  // ============================================================================
  // COST CALCULATION HELPERS
  // ============================================================================

  /**
   * Calculate cost per ml for a culture based on its total cost and fill volume
   */
  const calculateCultureCostPerMl = useCallback((culture: Culture): number => {
    const totalCost = (culture.purchaseCost ?? 0) + (culture.productionCost ?? 0) + (culture.parentCultureCost ?? 0) + (culture.cost ?? 0);
    const fillVolume = culture.fillVolumeMl ?? culture.volumeMl ?? 0;
    if (fillVolume <= 0 || totalCost <= 0) return 0;
    return totalCost / fillVolume;
  }, []);

  /**
   * Calculate the cost of using a portion of a source culture
   * E.g., using 1ml from a 10ml syringe that cost $20 = $2
   */
  const calculateSourceCultureCost = useCallback((cultureId: string, volumeUsedMl: number): number => {
    const culture = state.cultures.find(c => c.id === cultureId);
    if (!culture || volumeUsedMl <= 0) return 0;

    const costPerMl = calculateCultureCostPerMl(culture);
    return costPerMl * volumeUsedMl;
  }, [state.cultures, calculateCultureCostPerMl]);

  /**
   * Calculate total inventory cost consumed for a specific grow
   * Sums all inventory usages that reference this grow
   */
  const calculateGrowInventoryCost = useCallback((growId: string): number => {
    const usages = state.inventoryUsages.filter(u =>
      u.referenceType === 'grow' && u.referenceId === growId
    );

    return usages.reduce((total, usage) => {
      // Only include consumable items in grow cost
      const item = state.inventoryItems.find(i => i.id === usage.inventoryItemId);
      const assetType = item?.assetType ?? 'consumable';

      // Skip equipment costs (they don't flow to grows)
      if (assetType === 'equipment') return total;

      // Check override flag
      if (item?.includeInGrowCost === false) return total;

      return total + (usage.consumedCost ?? 0);
    }, 0);
  }, [state.inventoryUsages, state.inventoryItems]);

  /**
   * Recalculate all costs for a grow and update it
   */
  const recalculateGrowCosts = useCallback(async (growId: string): Promise<void> => {
    const grow = state.grows.find(g => g.id === growId);
    if (!grow) return;

    // Calculate source culture cost
    let sourceCultureCost = 0;
    if (grow.sourceCultureId) {
      // Estimate volume used based on spawn weight (rough estimate: 1ml per 100g spawn)
      const estimatedVolumeUsed = grow.spawnWeight / 100;
      sourceCultureCost = calculateSourceCultureCost(grow.sourceCultureId, estimatedVolumeUsed);
    }

    // Calculate inventory cost from tracked usages
    const inventoryCost = calculateGrowInventoryCost(growId);

    // Keep existing labor and overhead costs
    const laborCost = grow.laborCost ?? 0;
    const overheadCost = grow.overheadCost ?? 0;

    // Calculate total cost
    const totalCost = sourceCultureCost + inventoryCost + laborCost + overheadCost;

    // Calculate cost per gram if we have yields
    const totalYield = grow.totalYield ?? 0;
    const totalYieldDry = grow.flushes.reduce((sum, f) => sum + (f.dryWeight ?? 0), 0);

    const costPerGramWet = totalYield > 0 ? totalCost / totalYield : undefined;
    const costPerGramDry = totalYieldDry > 0 ? totalCost / totalYieldDry : undefined;

    // Calculate profit if revenue is set
    const profit = grow.revenue !== undefined ? grow.revenue - totalCost : undefined;

    await updateGrow(growId, {
      sourceCultureCost,
      inventoryCost,
      totalCost,
      costPerGramWet,
      costPerGramDry,
      profit,
    });
  }, [state.grows, calculateSourceCultureCost, calculateGrowInventoryCost, updateGrow]);

  /**
   * Get total lab valuation broken down by asset type
   */
  const getLabValuation = useCallback((): { equipment: number; consumables: number; durables: number; total: number } => {
    let equipment = 0;
    let consumables = 0;
    let durables = 0;

    state.inventoryItems.forEach(item => {
      const value = item.currentValue ?? (item.unitCost * item.quantity);
      const assetType = item.assetType ?? 'consumable';

      switch (assetType) {
        case 'equipment':
          equipment += value;
          break;
        case 'durable':
          durables += value;
          break;
        case 'consumable':
        case 'culture_source':
        default:
          consumables += value;
          break;
      }
    });

    // Also include location costs (equipment like fruiting chambers, incubators)
    state.locations.forEach(loc => {
      if (loc.cost) {
        equipment += loc.cost;
      }
    });

    return {
      equipment,
      consumables,
      durables,
      total: equipment + consumables + durables,
    };
  }, [state.inventoryItems, state.locations]);

  // ============================================================================
  // RECIPE CRUD
  // ============================================================================

  const addRecipe = useCallback(async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> => {
    if (supabase) {
      // Get current user ID for RLS policy
      const userId = await getCurrentUserId();
      const recipeData = transformRecipeToDb(recipe);
      if (userId) {
        recipeData.user_id = userId;
      }
      const { data, error } = await supabase
        .from('recipes')
        .insert(recipeData)
        .select()
        .single();

      if (error) throw error;

      const newRecipe = transformRecipeFromDb(data);
      newRecipe.ingredients = recipe.ingredients || [];
      setState(prev => ({ ...prev, recipes: [...prev.recipes, newRecipe] }));
      return newRecipe;
    }

    const now = new Date();
    const newRecipe: Recipe = {
      ...recipe,
      id: generateId('rec'),
      createdAt: now,
      updatedAt: now,
    };
    setState(prev => ({ ...prev, recipes: [...prev.recipes, newRecipe] }));
    return newRecipe;
  }, [supabase, generateId]);

  const updateRecipe = useCallback(async (id: string, updates: Partial<Recipe>) => {
    if (supabase) {
      const { error } = await supabase
        .from('recipes')
        .update(transformRecipeToDb(updates))
        .eq('id', id);
      
      if (error) throw error;
    }
    
    setState(prev => ({
      ...prev,
      recipes: prev.recipes.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r)
    }));
  }, [supabase]);

  const deleteRecipe = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('recipes')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    }
    
    setState(prev => ({
      ...prev,
      recipes: prev.recipes.map(r => r.id === id ? { ...r, isActive: false } : r)
    }));
  }, [supabase]);

  const calculateRecipeCost = useCallback((recipe: Recipe): number => {
    return recipe.ingredients.reduce((sum, ing) => {
      const item = state.inventoryItems.find(i => i.id === ing.inventoryItemId);
      if (item) {
        return sum + (item.unitCost * ing.quantity);
      }
      return sum;
    }, 0);
  }, [state.inventoryItems]);

  const scaleRecipe = useCallback((recipe: Recipe, scaleFactor: number): Recipe => {
    return {
      ...recipe,
      yield: { ...recipe.yield, amount: recipe.yield.amount * scaleFactor },
      ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        quantity: ing.quantity * scaleFactor,
      })),
    };
  }, []);

  // ============================================================================
  // CRUD: Vessels, ContainerTypes, SubstrateTypes, Inventory - NOW WITH DATABASE
  // ============================================================================

  // Container CRUD (unified - replaces addVessel/addContainerType)
  const addContainer = useCallback(async (container: Omit<Container, 'id'>): Promise<Container> => {
    if (supabase) {
      // Get current user ID to save as personal item
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('containers')
        .insert(transformContainerToDb(container, userId))
        .select()
        .single();
      if (error) throw error;
      const newContainer = transformContainerFromDb(data);
      setState(prev => ({ ...prev, containers: [...prev.containers, newContainer] }));
      return newContainer;
    }
    // Fallback for offline
    const newContainer = { ...container, id: generateId('container') } as Container;
    setState(prev => ({ ...prev, containers: [...prev.containers, newContainer] }));
    return newContainer;
  }, [supabase, generateId]);

  const updateContainer = useCallback(async (id: string, updates: Partial<Container>) => {
    if (supabase) {
      const { error } = await supabase
        .from('containers')
        .update(transformContainerToDb(updates))
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      containers: prev.containers.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  }, [supabase]);

  const deleteContainer = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('containers')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      containers: prev.containers.map(c => c.id === id ? { ...c, isActive: false } : c)
    }));
  }, [supabase]);

  const addSubstrateType = useCallback(async (substrateType: Omit<SubstrateType, 'id'>): Promise<SubstrateType> => {
    if (supabase) {
      // Get current user ID to save as personal item
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('substrate_types')
        .insert(transformSubstrateTypeToDb(substrateType, userId))
        .select()
        .single();
      if (error) throw error;
      const newST = transformSubstrateTypeFromDb(data);
      setState(prev => ({ ...prev, substrateTypes: [...prev.substrateTypes, newST] }));
      return newST;
    }
    const newST = { ...substrateType, id: generateId('st') } as SubstrateType;
    setState(prev => ({ ...prev, substrateTypes: [...prev.substrateTypes, newST] }));
    return newST;
  }, [supabase, generateId]);

  const updateSubstrateType = useCallback(async (id: string, updates: Partial<SubstrateType>) => {
    if (supabase) {
      const { error } = await supabase
        .from('substrate_types')
        .update(transformSubstrateTypeToDb(updates))
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      substrateTypes: prev.substrateTypes.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  }, [supabase]);

  const deleteSubstrateType = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('substrate_types')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      substrateTypes: prev.substrateTypes.map(s => s.id === id ? { ...s, isActive: false } : s)
    }));
  }, [supabase]);

  const addInventoryCategory = useCallback(async (category: Omit<InventoryCategory, 'id'>): Promise<InventoryCategory> => {
    if (supabase) {
      // Get current user ID to save as personal item
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('inventory_categories')
        .insert(transformInventoryCategoryToDb(category, userId))
        .select()
        .single();
      if (error) throw error;
      const newCat = transformInventoryCategoryFromDb(data);
      setState(prev => ({ ...prev, inventoryCategories: [...prev.inventoryCategories, newCat] }));
      return newCat;
    }
    const newCat = { ...category, id: generateId('cat') } as InventoryCategory;
    setState(prev => ({ ...prev, inventoryCategories: [...prev.inventoryCategories, newCat] }));
    return newCat;
  }, [supabase, generateId]);

  const updateInventoryCategory = useCallback(async (id: string, updates: Partial<InventoryCategory>) => {
    if (supabase) {
      const { error } = await supabase
        .from('inventory_categories')
        .update(transformInventoryCategoryToDb(updates))
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      inventoryCategories: prev.inventoryCategories.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  }, [supabase]);

  const deleteInventoryCategory = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('inventory_categories')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      inventoryCategories: prev.inventoryCategories.map(c => c.id === id ? { ...c, isActive: false } : c)
    }));
  }, [supabase]);

  // ============================================================================
  // RECIPE CATEGORY CRUD
  // ============================================================================

  const addRecipeCategory = useCallback(async (category: Omit<RecipeCategoryItem, 'id'>): Promise<RecipeCategoryItem> => {
    if (supabase) {
      // Get current user ID to save as personal item
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('recipe_categories')
        .insert(transformRecipeCategoryToDb(category, userId))
        .select()
        .single();
      if (error) throw error;
      const newCat = transformRecipeCategoryFromDb(data);
      setState(prev => ({ ...prev, recipeCategories: [...prev.recipeCategories, newCat] }));
      return newCat;
    }
    const newCat = { ...category, id: generateId('rcat') } as RecipeCategoryItem;
    setState(prev => ({ ...prev, recipeCategories: [...prev.recipeCategories, newCat] }));
    return newCat;
  }, [supabase, generateId]);

  const updateRecipeCategory = useCallback(async (id: string, updates: Partial<RecipeCategoryItem>) => {
    // Don't allow updating default categories
    if (id.startsWith('default-')) return;
    if (supabase) {
      const { error } = await supabase
        .from('recipe_categories')
        .update(transformRecipeCategoryToDb(updates))
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      recipeCategories: prev.recipeCategories.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  }, [supabase]);

  const deleteRecipeCategory = useCallback(async (id: string) => {
    // Don't allow deleting default categories
    if (id.startsWith('default-')) return;
    if (supabase) {
      const { error } = await supabase
        .from('recipe_categories')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      recipeCategories: prev.recipeCategories.map(c => c.id === id ? { ...c, isActive: false } : c)
    }));
  }, [supabase]);

  // ============================================================================
  // GRAIN TYPE CRUD
  // ============================================================================

  const addGrainType = useCallback(async (grain: Omit<GrainType, 'id'>): Promise<GrainType> => {
    if (supabase) {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('grain_types')
        .insert(transformGrainTypeToDb(grain, userId))
        .select()
        .single();
      if (error) throw error;
      const newGrain = transformGrainTypeFromDb(data);
      setState(prev => ({ ...prev, grainTypes: [...prev.grainTypes, newGrain] }));
      return newGrain;
    }
    const newGrain = { ...grain, id: generateId('grain') } as GrainType;
    setState(prev => ({ ...prev, grainTypes: [...prev.grainTypes, newGrain] }));
    return newGrain;
  }, [supabase, generateId]);

  const updateGrainType = useCallback(async (id: string, updates: Partial<GrainType>) => {
    // Don't allow updating default grain types
    if (id.startsWith('default-')) return;
    if (supabase) {
      const { error } = await supabase
        .from('grain_types')
        .update(transformGrainTypeToDb(updates))
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      grainTypes: prev.grainTypes.map(g => g.id === id ? { ...g, ...updates } : g)
    }));
  }, [supabase]);

  const deleteGrainType = useCallback(async (id: string) => {
    // Don't allow deleting default grain types
    if (id.startsWith('default-')) return;
    if (supabase) {
      const { error } = await supabase
        .from('grain_types')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      grainTypes: prev.grainTypes.map(g => g.id === id ? { ...g, isActive: false } : g)
    }));
  }, [supabase]);

  // ============================================================================
  // INVENTORY ITEM CRUD
  // ============================================================================

  const addInventoryItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> => {
    const now = new Date();
    if (supabase) {
      // Get current user ID - required for RLS policy
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required. Please sign in to create inventory items.');
      }
      const insertData = {
        name: item.name,
        category_id: item.categoryId && item.categoryId.length > 0 ? item.categoryId : null,
        sku: item.sku || null,
        quantity: Number(item.quantity) || 0,
        unit: item.unit || 'units',
        reorder_point: Number(item.reorderPoint) || 0,
        reorder_qty: item.reorderQty ? Number(item.reorderQty) : null,
        cost_per_unit: Number(item.unitCost) || 0,
        supplier_id: item.supplierId && item.supplierId.length > 0 ? item.supplierId : null,
        location_id: item.locationId && item.locationId.length > 0 ? item.locationId : null,
        notes: item.notes || null,
        is_active: item.isActive ?? true,
        user_id: userId,
      };
      console.log('[MycoLab] Inserting inventory item:', insertData);
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[MycoLab] Inventory insert error:', error);
        throw new Error(`Failed to create inventory item: ${error.message || error.code || 'Unknown error'}`);
      }

      const newItem: InventoryItem = {
        id: data.id,
        name: data.name,
        categoryId: data.category_id,
        sku: data.sku,
        quantity: data.quantity || 0,
        unit: data.unit || 'units',
        unitCost: data.cost_per_unit || 0,
        reorderPoint: data.reorder_point || 0,
        reorderQty: data.reorder_qty || 0,
        supplierId: data.supplier_id,
        locationId: data.location_id,
        notes: data.notes,
        isActive: data.is_active ?? true,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
      setState(prev => ({ ...prev, inventoryItems: [...prev.inventoryItems, newItem] }));
      return newItem;
    }

    const newItem: InventoryItem = {
      ...item,
      id: generateId('inv'),
      createdAt: now,
      updatedAt: now,
    };
    setState(prev => ({ ...prev, inventoryItems: [...prev.inventoryItems, newItem] }));
    return newItem;
  }, [supabase, generateId]);

  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setState(prev => ({
      ...prev,
      inventoryItems: prev.inventoryItems.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date() } : i)
    }));
  }, []);

  const deleteInventoryItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      inventoryItems: prev.inventoryItems.map(i => i.id === id ? { ...i, isActive: false } : i)
    }));
  }, []);

  const adjustInventoryQuantity = useCallback((id: string, delta: number) => {
    setState(prev => ({
      ...prev,
      inventoryItems: prev.inventoryItems.map(i =>
        i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta), updatedAt: new Date() } : i
      )
    }));
  }, []);

  // ============================================================================
  // INVENTORY LOT CRUD
  // ============================================================================

  const addInventoryLot = useCallback(async (lot: Omit<InventoryLot, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryLot> => {
    const now = new Date();
    if (supabase) {
      // Get current user ID - required for RLS policy
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required. Please sign in to create inventory lots.');
      }
      const insertData = {
        ...transformInventoryLotToDb(lot),
        user_id: userId,
      };
      const { data, error } = await supabase
        .from('inventory_lots')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      const newLot = transformInventoryLotFromDb(data);
      setState(prev => ({ ...prev, inventoryLots: [...prev.inventoryLots, newLot] }));
      return newLot;
    }
    const newLot: InventoryLot = {
      ...lot,
      id: generateId('lot'),
      createdAt: now,
      updatedAt: now,
    };
    setState(prev => ({ ...prev, inventoryLots: [...prev.inventoryLots, newLot] }));
    return newLot;
  }, [supabase, generateId]);

  const updateInventoryLot = useCallback(async (id: string, updates: Partial<InventoryLot>) => {
    if (supabase) {
      const { error } = await supabase
        .from('inventory_lots')
        .update({ ...transformInventoryLotToDb(updates), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      inventoryLots: prev.inventoryLots.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l)
    }));
  }, [supabase]);

  const deleteInventoryLot = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('inventory_lots')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      inventoryLots: prev.inventoryLots.map(l => l.id === id ? { ...l, isActive: false } : l)
    }));
  }, [supabase]);

  const adjustLotQuantity = useCallback(async (
    lotId: string,
    delta: number,
    usageType?: UsageType,
    referenceId?: string,
    referenceName?: string
  ) => {
    const lot = state.inventoryLots.find(l => l.id === lotId);
    if (!lot) return;

    const newQuantity = Math.max(0, lot.quantity + delta);
    const newStatus: LotStatus = newQuantity === 0 ? 'empty' : newQuantity < lot.originalQuantity * 0.1 ? 'low' : 'available';

    // Update the lot
    await updateInventoryLot(lotId, { quantity: newQuantity, status: newStatus });

    // Log the usage if it's a deduction
    if (delta < 0 && usageType) {
      // Calculate cost at time of usage
      const inventoryItem = state.inventoryItems.find(i => i.id === lot.inventoryItemId);
      const unitCostAtUsage = inventoryItem?.unitCost ?? (lot.purchaseCost && lot.originalQuantity ? lot.purchaseCost / lot.originalQuantity : 0);
      const quantityUsed = Math.abs(delta);
      const consumedCost = unitCostAtUsage * quantityUsed;

      const usage: InventoryUsage = {
        id: generateId('usage'),
        lotId,
        inventoryItemId: lot.inventoryItemId,
        quantity: quantityUsed,
        unit: lot.unit,
        usageType,
        referenceId,
        referenceName,
        unitCostAtUsage,
        consumedCost,
        usedAt: new Date(),
      };
      setState(prev => ({ ...prev, inventoryUsages: [...prev.inventoryUsages, usage] }));
    }
  }, [state.inventoryLots, state.inventoryItems, updateInventoryLot, generateId]);

  const getLotsForItem = useCallback((inventoryItemId: string): InventoryLot[] => {
    return state.inventoryLots.filter(l => l.inventoryItemId === inventoryItemId && l.isActive);
  }, [state.inventoryLots]);

  // ============================================================================
  // PURCHASE ORDER CRUD
  // ============================================================================

  const generateOrderNumber = useCallback((): string => {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const count = state.purchaseOrders.length + 1;
    return `PO-${date}-${count.toString().padStart(3, '0')}`;
  }, [state.purchaseOrders.length]);

  const addPurchaseOrder = useCallback(async (order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<PurchaseOrder> => {
    const now = new Date();
    if (supabase) {
      // Get current user ID - required for RLS policy
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required. Please sign in to create purchase orders.');
      }
      const insertData = {
        ...transformPurchaseOrderToDb(order),
        user_id: userId,
      };
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      const newOrder = transformPurchaseOrderFromDb(data);
      setState(prev => ({ ...prev, purchaseOrders: [...prev.purchaseOrders, newOrder] }));
      return newOrder;
    }
    const newOrder: PurchaseOrder = {
      ...order,
      id: generateId('po'),
      createdAt: now,
      updatedAt: now,
    };
    setState(prev => ({ ...prev, purchaseOrders: [...prev.purchaseOrders, newOrder] }));
    return newOrder;
  }, [supabase, generateId]);

  const updatePurchaseOrder = useCallback(async (id: string, updates: Partial<PurchaseOrder>) => {
    if (supabase) {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ ...transformPurchaseOrderToDb(updates), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      purchaseOrders: prev.purchaseOrders.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date() } : o)
    }));
  }, [supabase]);

  const deletePurchaseOrder = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      purchaseOrders: prev.purchaseOrders.map(o => o.id === id ? { ...o, isActive: false } : o)
    }));
  }, [supabase]);

  const receiveOrder = useCallback(async (orderId: string, receivedItems?: { itemId: string; quantity: number }[]) => {
    const order = state.purchaseOrders.find(o => o.id === orderId);
    if (!order) return;

    // Update order status
    await updatePurchaseOrder(orderId, {
      status: 'received',
      receivedDate: new Date(),
    });

    // Create inventory lots for received items
    for (const item of order.items) {
      const receivedQty = receivedItems?.find(r => r.itemId === item.id)?.quantity ?? item.quantity;
      if (receivedQty > 0) {
        await addInventoryLot({
          inventoryItemId: item.inventoryItemId || generateId('inv'),
          quantity: receivedQty,
          originalQuantity: receivedQty,
          unit: item.unit,
          status: 'available',
          purchaseOrderId: orderId,
          supplierId: order.supplierId,
          purchaseDate: new Date(),
          purchaseCost: item.unitCost * receivedQty,
          isActive: true,
        });
      }
    }
  }, [state.purchaseOrders, updatePurchaseOrder, addInventoryLot, generateId]);

  // ============================================================================
  // SETTINGS
  // ============================================================================

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
  // Update local state immediately for responsiveness
  setState(prev => ({
    ...prev,
    settings: { 
      ...prev.settings, 
      ...updates,
      notifications: updates.notifications 
        ? { ...prev.settings.notifications, ...updates.notifications }
        : prev.settings.notifications
    }
  }));

  // Always save to localStorage as a fallback
  // IMPORTANT: Include hasCompletedSetupWizard to prevent wizard from showing on every login
  const localUpdates: Partial<LocalSettings> = {};
  if (updates.defaultUnits !== undefined) localUpdates.defaultUnits = updates.defaultUnits;
  if (updates.defaultCurrency !== undefined) localUpdates.defaultCurrency = updates.defaultCurrency;
  if (updates.altitude !== undefined) localUpdates.altitude = updates.altitude;
  if (updates.timezone !== undefined) localUpdates.timezone = updates.timezone;
  if (updates.notifications) localUpdates.notifications = updates.notifications;
  // Onboarding wizard settings - critical to persist locally
  if (updates.hasCompletedSetupWizard !== undefined) localUpdates.hasCompletedSetupWizard = updates.hasCompletedSetupWizard;
  if (updates.experienceLevel !== undefined) localUpdates.experienceLevel = updates.experienceLevel;
  saveLocalSettings(localUpdates);

  if (process.env.NODE_ENV === 'development') {
    console.log('Settings saved to localStorage');
  }

  // Try to persist to database if Supabase is configured
  if (supabase) {
    try {
      // Ensure we have a session
      const session = await ensureSession();
      const userId = session?.user?.id;
      const isAnonymous = session?.user?.is_anonymous;

      // Skip database sync for anonymous users (they use localStorage only)
      if (!userId || isAnonymous) {
        return;
      }
      
      // Transform to database format (flatten nested notifications)
      const dbUpdates: Record<string, any> = {};
      if (updates.defaultUnits !== undefined) dbUpdates.default_units = updates.defaultUnits;
      if (updates.defaultCurrency !== undefined) dbUpdates.default_currency = updates.defaultCurrency;
      if (updates.altitude !== undefined) dbUpdates.altitude = updates.altitude;
      if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
      if (updates.notifications) {
        if (updates.notifications.enabled !== undefined) dbUpdates.notifications_enabled = updates.notifications.enabled;
        if (updates.notifications.harvestReminders !== undefined) dbUpdates.harvest_reminders = updates.notifications.harvestReminders;
        if (updates.notifications.lowStockAlerts !== undefined) dbUpdates.low_stock_alerts = updates.notifications.lowStockAlerts;
        if (updates.notifications.contaminationAlerts !== undefined) dbUpdates.contamination_alerts = updates.notifications.contaminationAlerts;
      }
      // Onboarding wizard and user experience settings
      if (updates.hasCompletedSetupWizard !== undefined) dbUpdates.has_completed_setup_wizard = updates.hasCompletedSetupWizard;
      if (updates.experienceLevel !== undefined) dbUpdates.experience_level = updates.experienceLevel;
      if (updates.growingPurpose !== undefined) dbUpdates.growing_purpose = updates.growingPurpose;
      if (updates.showTooltips !== undefined) dbUpdates.show_tooltips = updates.showTooltips;
      if (updates.showGuidedWorkflows !== undefined) dbUpdates.show_guided_workflows = updates.showGuidedWorkflows;
      if (updates.advancedMode !== undefined) dbUpdates.advanced_mode = updates.advancedMode;
      if (updates.preferredCategories !== undefined) dbUpdates.preferred_categories = updates.preferredCategories;
      if (updates.labEquipment !== undefined) dbUpdates.lab_equipment = updates.labEquipment;
      dbUpdates.updated_at = new Date().toISOString();

      // Check if a settings row already exists for this user
      const { data: existing, error: selectError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (selectError) {
        // Only log schema errors in development
        if (process.env.NODE_ENV === 'development') {
          if (selectError.code === 'PGRST116' || selectError.message?.includes('does not exist')) {
            console.warn('[Settings] user_settings table not found. Run supabase-schema.sql.');
          }
        }
        return;
      }

      if (existing) {
        // Update existing row
        const { error: updateError } = await supabase
          .from('user_settings')
          .update(dbUpdates)
          .eq('id', existing.id);

        if (updateError && process.env.NODE_ENV === 'development') {
          console.debug('[Settings] DB update failed (localStorage backup active):', updateError.message);
        }
        // No need to log success
      } else {
        // Insert new row with user_id
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            ...dbUpdates
          });

        if (insertError && process.env.NODE_ENV === 'development') {
          console.debug('[Settings] DB insert failed (localStorage backup active):', insertError.message);
        }
        // No need to log success
      }
    } catch (err) {
      // Silently fail - settings are in localStorage
      console.debug('Settings database sync failed:', err);
    }
  }
}, [supabase]);

// ============================================================================
// UPDATED loadSettings FUNCTION
// Load settings from database or localStorage on app initialization
// ============================================================================

const loadSettings = async (): Promise<AppSettings> => {
  // Start with localStorage settings as default
  const localSettings = getLocalSettings();

  // IMPORTANT: Include hasCompletedSetupWizard in defaults to prevent wizard from
  // showing on every load. This ensures the setting persists even if DB load fails.
  const defaultAppSettings: AppSettings = {
    defaultUnits: localSettings.defaultUnits,
    defaultCurrency: localSettings.defaultCurrency,
    altitude: localSettings.altitude,
    timezone: localSettings.timezone,
    notifications: localSettings.notifications,
    // Onboarding wizard settings - use localStorage as fallback
    hasCompletedSetupWizard: localSettings.hasCompletedSetupWizard ?? false,
    experienceLevel: localSettings.experienceLevel,
  };

  // Try to load from database if Supabase is configured
  if (supabase) {
    try {
      const session = await ensureSession();
      const userId = session?.user?.id;
      const isAnonymous = session?.user?.is_anonymous;

      // Only load settings for non-anonymous users (anonymous users use localStorage only)
      // This prevents RLS errors and unnecessary API calls
      if (userId && !isAnonymous) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          // Only log errors in development to avoid console spam
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Settings] Error loading from database:', error.message);
          }
          return defaultAppSettings;
        }

        if (data) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Settings] Loaded from database');
          }
          // CRITICAL: For hasCompletedSetupWizard, use localStorage as fallback if DB is null
          // This prevents the wizard from showing repeatedly when DB hasn't been updated
          const hasCompletedWizard = data.has_completed_setup_wizard ?? localSettings.hasCompletedSetupWizard ?? false;

          return {
            defaultUnits: data.default_units as 'metric' | 'imperial',
            defaultCurrency: data.default_currency,
            altitude: data.altitude,
            timezone: data.timezone,
            notifications: {
              enabled: data.notifications_enabled,
              harvestReminders: data.harvest_reminders,
              lowStockAlerts: data.low_stock_alerts,
              contaminationAlerts: data.contamination_alerts,
            },
            // Onboarding wizard and user experience settings
            // Use merged value that respects localStorage fallback
            hasCompletedSetupWizard: hasCompletedWizard,
            experienceLevel: data.experience_level ?? localSettings.experienceLevel,
            growingPurpose: data.growing_purpose,
            showTooltips: data.show_tooltips ?? true,
            showGuidedWorkflows: data.show_guided_workflows ?? false,
            advancedMode: data.advanced_mode ?? false,
            preferredCategories: data.preferred_categories,
            labEquipment: data.lab_equipment,
          };
        }
        // No settings in database yet, use localStorage (no need to log)
      }
    } catch (err) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Settings] Error loading:', err);
      }
    }
  }

  return defaultAppSettings;
};

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: DataContextValue = useMemo(() => ({
    state,
    isLoading,
    isConnected,
    isAuthenticated,
    error,

    // Auth helpers
    requireAuth,

    // Lookup helpers
    getSpecies, getStrain, getLocation, getLocationType, getLocationClassification, getContainer, getSubstrateType,
    getSupplier, getInventoryCategory, getRecipeCategory, getGrainType, getInventoryItem,
    getInventoryLot, getPurchaseOrder, getCulture, getPreparedSpawn, getGrow, getRecipe,
    activeSpecies, activeStrains, activeLocations, activeLocationTypes, activeLocationClassifications, activeContainers,
    activeSubstrateTypes, activeSuppliers, activeInventoryCategories, activeRecipeCategories,
    activeGrainTypes, activeInventoryItems, activeInventoryLots, activePurchaseOrders, activeRecipes, availablePreparedSpawn,

    // CRUD operations
    addSpecies, updateSpecies, deleteSpecies,
    addStrain, updateStrain, deleteStrain,
    addLocation, updateLocation, deleteLocation,
    addLocationType, updateLocationType, deleteLocationType,
    addLocationClassification, updateLocationClassification, deleteLocationClassification,
    addContainer, updateContainer, deleteContainer,
    addSubstrateType, updateSubstrateType, deleteSubstrateType,
    addSupplier, updateSupplier, deleteSupplier,
    addInventoryCategory, updateInventoryCategory, deleteInventoryCategory,
    addRecipeCategory, updateRecipeCategory, deleteRecipeCategory,
    addGrainType, updateGrainType, deleteGrainType,
    addInventoryItem, updateInventoryItem, deleteInventoryItem, adjustInventoryQuantity,
    addInventoryLot, updateInventoryLot, deleteInventoryLot, adjustLotQuantity, getLotsForItem,
    addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, receiveOrder, generateOrderNumber,
    addCulture, updateCulture, deleteCulture, addCultureObservation, addCultureTransfer,
    getCultureLineage, generateCultureLabel, amendCulture, archiveCulture,
    addPreparedSpawn, updatePreparedSpawn, deletePreparedSpawn, inoculatePreparedSpawn, getAvailablePreparedSpawn,
    addGrow, updateGrow, deleteGrow, advanceGrowStage, markGrowContaminated, amendGrow, archiveGrow,
    addGrowObservation, addFlush,
    getRecordHistory, getAmendmentLog, archiveAllUserData,
    calculateCultureCostPerMl, calculateSourceCultureCost, calculateGrowInventoryCost,
    recalculateGrowCosts, getLabValuation,
    saveEntityOutcome, saveContaminationDetails,
    addRecipe, updateRecipe, deleteRecipe, calculateRecipeCost, scaleRecipe,
    updateSettings,
    generateId,
    refreshData,
  }), [
    state, isLoading, isConnected, isAuthenticated, error,
    requireAuth,
    getSpecies, getStrain, getLocation, getLocationType, getLocationClassification, getContainer, getSubstrateType,
    getSupplier, getInventoryCategory, getRecipeCategory, getGrainType, getInventoryItem,
    getInventoryLot, getPurchaseOrder, getCulture, getPreparedSpawn, getGrow, getRecipe,
    activeSpecies, activeStrains, activeLocations, activeLocationTypes, activeLocationClassifications, activeContainers,
    activeSubstrateTypes, activeSuppliers, activeInventoryCategories, activeRecipeCategories,
    activeGrainTypes, activeInventoryItems, activeInventoryLots, activePurchaseOrders, activeRecipes, availablePreparedSpawn,
    addSpecies, updateSpecies, deleteSpecies,
    addStrain, updateStrain, deleteStrain,
    addLocation, updateLocation, deleteLocation,
    addLocationType, updateLocationType, deleteLocationType,
    addLocationClassification, updateLocationClassification, deleteLocationClassification,
    addContainer, updateContainer, deleteContainer,
    addSubstrateType, updateSubstrateType, deleteSubstrateType,
    addSupplier, updateSupplier, deleteSupplier,
    addInventoryCategory, updateInventoryCategory, deleteInventoryCategory,
    addRecipeCategory, updateRecipeCategory, deleteRecipeCategory,
    addGrainType, updateGrainType, deleteGrainType,
    addInventoryItem, updateInventoryItem, deleteInventoryItem, adjustInventoryQuantity,
    addInventoryLot, updateInventoryLot, deleteInventoryLot, adjustLotQuantity, getLotsForItem,
    addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, receiveOrder, generateOrderNumber,
    addCulture, updateCulture, deleteCulture, addCultureObservation, addCultureTransfer,
    getCultureLineage, generateCultureLabel, amendCulture, archiveCulture,
    addPreparedSpawn, updatePreparedSpawn, deletePreparedSpawn, inoculatePreparedSpawn, getAvailablePreparedSpawn,
    addGrow, updateGrow, deleteGrow, advanceGrowStage, markGrowContaminated, amendGrow, archiveGrow,
    addGrowObservation, addFlush,
    getRecordHistory, getAmendmentLog, archiveAllUserData,
    calculateCultureCostPerMl, calculateSourceCultureCost, calculateGrowInventoryCost,
    recalculateGrowCosts, getLabValuation,
    saveEntityOutcome, saveContaminationDetails,
    addRecipe, updateRecipe, deleteRecipe, calculateRecipeCost, scaleRecipe,
    updateSettings, generateId, refreshData,
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useData = (): DataContextValue => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default DataContext;
