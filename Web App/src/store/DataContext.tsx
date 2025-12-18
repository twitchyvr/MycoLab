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
  EntityOutcome, ContaminationDetails, OutcomeCategory, OutcomeCode, ContaminationType, ContaminationStage, SuspectedCause
} from './types';
import {
  supabase,
  ensureSession,
  getCurrentUserId,
  getLocalSettings,
  saveLocalSettings,
  LocalSettings
} from '../lib/supabase';

// Import modularized defaults and transformations
import { emptyState } from './defaults';

// ============================================================================
// OUTCOME DATA TYPES (for function parameters)
// ============================================================================

export interface EntityOutcomeData {
  entityType: 'grow' | 'culture' | 'inventory_item' | 'inventory_lot' | 'equipment';
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
  error: string | null;
  
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
  deleteCulture: (id: string) => Promise<void>;
  addCultureObservation: (cultureId: string, observation: Omit<CultureObservation, 'id'>) => void;
  addCultureTransfer: (cultureId: string, transfer: Omit<CultureTransfer, 'id'>) => Culture | null;
  getCultureLineage: (cultureId: string) => { ancestors: Culture[]; descendants: Culture[] };
  generateCultureLabel: (type: Culture['type']) => string;
  
  // Grow CRUD
  addGrow: (grow: Omit<Grow, 'id' | 'createdAt' | 'observations' | 'flushes' | 'totalYield'>) => Promise<Grow>;
  updateGrow: (id: string, updates: Partial<Grow>) => Promise<void>;
  deleteGrow: (id: string, outcome?: EntityOutcomeData) => Promise<void>;
  advanceGrowStage: (growId: string) => Promise<void>;
  markGrowContaminated: (growId: string, notes?: string) => Promise<void>;
  addGrowObservation: (growId: string, observation: Omit<GrowObservation, 'id'>) => void;
  addFlush: (growId: string, flush: Omit<Flush, 'id' | 'flushNumber'>) => Promise<void>;

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
  const [error, setError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  // ============================================================================
  // INITIALIZATION & DATA LOADING
  // ============================================================================

  const loadDataFromSupabase = useCallback(async (client: SupabaseClient) => {
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
        cultures: (culturesData || []).map(transformCultureFromDb),
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
        // Reload data when user signs in (with a real account, not anonymous)
        if (event === 'SIGNED_IN' && session?.user && !session.user.is_anonymous) {
          console.log('[DataContext] Auth state changed to SIGNED_IN, reloading data...');
          const client = getSupabaseClient();
          if (client) {
            await loadDataFromSupabase(client);
          }
        }

        // Also reload on TOKEN_REFRESHED to ensure we have fresh data after token refresh
        if (event === 'TOKEN_REFRESHED' && session?.user && !session.user.is_anonymous) {
          console.log('[DataContext] Token refreshed, ensuring data is current...');
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

  const deleteCulture = useCallback(async (id: string) => {
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

  const addCultureObservation = useCallback((cultureId: string, observation: Omit<CultureObservation, 'id'>) => {
    const newObs: CultureObservation = { ...observation, id: generateId('obs') };
    setState(prev => ({
      ...prev,
      cultures: prev.cultures.map(c => 
        c.id === cultureId 
          ? { ...c, observations: [...c.observations, newObs], updatedAt: new Date() }
          : c
      )
    }));
  }, [generateId]);

  const addCultureTransfer = useCallback((cultureId: string, transfer: Omit<CultureTransfer, 'id'>): Culture | null => {
    // 1. Get source culture
    const sourceCulture = state.cultures.find(c => c.id === cultureId);
    if (!sourceCulture) return null;

    const transferId = generateId('trans');
    const newTransfer: CultureTransfer = { ...transfer, id: transferId };

    // 2. Prepare new culture object if needed
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
        fillVolumeMl: undefined,
        prepDate: new Date().toISOString().split('T')[0],
        sterilizationDate: undefined,
        healthRating: 5,
        notes: `Transferred from ${sourceCulture.label}\n${transfer.notes || ''}`,
        cost: 0,
        createdAt: now,
        updatedAt: now,
        observations: [],
        transfers: [],
      };
    }

    // 3. Update local state
    setState(prev => {
      // Update source culture transfers
      const updatedCultures = prev.cultures.map(c =>
        c.id === cultureId
          ? { ...c, transfers: [...c.transfers, newTransfer], updatedAt: new Date() }
          : c
      );

      // Add new culture if created
      if (newCulture) {
        updatedCultures.unshift(newCulture);
      }

      return { ...prev, cultures: updatedCultures };
    });

    // 4. Persist to Supabase (fire and forget)
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
      grows: prev.grows.map(g => 
        g.id === growId 
          ? { ...g, observations: [...g.observations, newObs] }
          : g
      )
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
      const usage: InventoryUsage = {
        id: generateId('usage'),
        lotId,
        inventoryItemId: lot.inventoryItemId,
        quantity: Math.abs(delta),
        unit: lot.unit,
        usageType,
        referenceId,
        referenceName,
        usedAt: new Date(),
      };
      setState(prev => ({ ...prev, inventoryUsages: [...prev.inventoryUsages, usage] }));
    }
  }, [state.inventoryLots, updateInventoryLot, generateId]);

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
  const localUpdates: Partial<LocalSettings> = {};
  if (updates.defaultUnits !== undefined) localUpdates.defaultUnits = updates.defaultUnits;
  if (updates.defaultCurrency !== undefined) localUpdates.defaultCurrency = updates.defaultCurrency;
  if (updates.altitude !== undefined) localUpdates.altitude = updates.altitude;
  if (updates.timezone !== undefined) localUpdates.timezone = updates.timezone;
  if (updates.notifications) localUpdates.notifications = updates.notifications;
  saveLocalSettings(localUpdates);
  
  console.log('Settings saved to localStorage');

  // Try to persist to database if Supabase is configured
  if (supabase) {
    try {
      // Ensure we have a session (creates anonymous user if needed)
      const session = await ensureSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        // This is expected for anonymous sessions, don't log as warning
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
      dbUpdates.updated_at = new Date().toISOString();

      // Check if a settings row already exists for this user
      const { data: existing, error: selectError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (selectError) {
        // Only log schema errors once to avoid spam
        if (selectError.code === 'PGRST116' || selectError.message?.includes('does not exist')) {
          console.warn('user_settings table not found. Run supabase-schema.sql to create it.');
        }
        return;
      }
      
      if (existing) {
        // Update existing row
        const { error: updateError } = await supabase
          .from('user_settings')
          .update(dbUpdates)
          .eq('id', existing.id);
          
        if (updateError) {
          // Silently fail - localStorage already has the data
          console.debug('Settings DB update failed (localStorage backup active):', updateError.message);
        } else {
          console.log('Settings synced to database');
        }
      } else {
        // Insert new row with user_id
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            ...dbUpdates
          });
          
        if (insertError) {
          // Silently fail - localStorage already has the data
          console.debug('Settings DB insert failed (localStorage backup active):', insertError.message);
        } else {
          console.log('Settings created in database');
        }
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
  
  const defaultAppSettings: AppSettings = {
    defaultUnits: localSettings.defaultUnits,
    defaultCurrency: localSettings.defaultCurrency,
    altitude: localSettings.altitude,
    timezone: localSettings.timezone,
    notifications: localSettings.notifications,
  };

  // Try to load from database if Supabase is configured
  if (supabase) {
    try {
      const session = await ensureSession();
      const userId = session?.user?.id;
      
      if (userId) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('Error loading settings from database:', error);
          return defaultAppSettings;
        }
        
        if (data) {
          console.log('Settings loaded from database');
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
          };
        } else {
          // No settings in database yet, use localStorage and sync to DB
          console.log('No database settings found, using localStorage');
          // Optionally sync localStorage to database here
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
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
    error,

    // Lookup helpers
    getSpecies, getStrain, getLocation, getLocationType, getLocationClassification, getContainer, getSubstrateType,
    getSupplier, getInventoryCategory, getRecipeCategory, getGrainType, getInventoryItem,
    getInventoryLot, getPurchaseOrder, getCulture, getGrow, getRecipe,
    activeSpecies, activeStrains, activeLocations, activeLocationTypes, activeLocationClassifications, activeContainers,
    activeSubstrateTypes, activeSuppliers, activeInventoryCategories, activeRecipeCategories,
    activeGrainTypes, activeInventoryItems, activeInventoryLots, activePurchaseOrders, activeRecipes,

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
    getCultureLineage, generateCultureLabel,
    addGrow, updateGrow, deleteGrow, advanceGrowStage, markGrowContaminated,
    addGrowObservation, addFlush,
    saveEntityOutcome, saveContaminationDetails,
    addRecipe, updateRecipe, deleteRecipe, calculateRecipeCost, scaleRecipe,
    updateSettings,
    generateId,
    refreshData,
  }), [
    state, isLoading, isConnected, error,
    getSpecies, getStrain, getLocation, getLocationType, getLocationClassification, getContainer, getSubstrateType,
    getSupplier, getInventoryCategory, getRecipeCategory, getGrainType, getInventoryItem,
    getInventoryLot, getPurchaseOrder, getCulture, getGrow, getRecipe,
    activeSpecies, activeStrains, activeLocations, activeLocationTypes, activeLocationClassifications, activeContainers,
    activeSubstrateTypes, activeSuppliers, activeInventoryCategories, activeRecipeCategories,
    activeGrainTypes, activeInventoryItems, activeInventoryLots, activePurchaseOrders, activeRecipes,
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
    getCultureLineage, generateCultureLabel,
    addGrow, updateGrow, deleteGrow, advanceGrowStage, markGrowContaminated,
    addGrowObservation, addFlush,
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
