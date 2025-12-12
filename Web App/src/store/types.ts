// ============================================================================
// SHARED TYPE DEFINITIONS
// Central type definitions used across all components
// ============================================================================

// ============================================================================
// LOOKUP TABLE TYPES
// ============================================================================

export interface Species {
  id: string;
  name: string;
  scientificName?: string;
  commonNames?: string[];
  category: 'gourmet' | 'medicinal' | 'research' | 'other';
  notes?: string;
  isActive: boolean;
}

export interface Strain {
  id: string;
  name: string;
  speciesId?: string; // Reference to species table
  species: string; // Legacy field - now stores species name directly
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  colonizationDays: { min: number; max: number };
  fruitingDays: { min: number; max: number };
  optimalTempColonization: { min: number; max: number };
  optimalTempFruiting: { min: number; max: number };
  notes?: string;
  isActive: boolean;
}

export interface Location {
  id: string;
  name: string;
  type: 'incubation' | 'fruiting' | 'storage' | 'lab' | 'other';
  tempRange?: { min: number; max: number };
  humidityRange?: { min: number; max: number };
  notes?: string;
  isActive: boolean;
}

export interface Vessel {
  id: string;
  name: string;
  type: 'jar' | 'bag' | 'plate' | 'tube' | 'bottle' | 'syringe' | 'other';
  volumeMl?: number;
  isReusable: boolean;
  notes?: string;
  isActive: boolean;
}

export interface ContainerType {
  id: string;
  name: string;
  category: 'tub' | 'bag' | 'jar' | 'bucket' | 'bed' | 'other';
  volumeL?: number;
  dimensions?: { length: number; width: number; height: number };
  notes?: string;
  isActive: boolean;
}

export interface SubstrateType {
  id: string;
  name: string;
  code: string; // cvg, manure, straw, etc.
  category: 'bulk' | 'grain' | 'agar' | 'liquid';
  spawnRateRange: { min: number; optimal: number; max: number };
  fieldCapacity?: number; // percentage
  notes?: string;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  notes?: string;
  isActive: boolean;
}

export interface InventoryCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isActive: boolean;
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

export interface InventoryItem {
  id: string;
  name: string;
  categoryId: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  reorderPoint: number;
  reorderQty: number;
  supplierId?: string;
  locationId?: string;
  expiresAt?: Date;
  lotNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// ============================================================================
// CULTURE TYPES
// ============================================================================

export type CultureType = 'liquid_culture' | 'agar' | 'slant' | 'spore_syringe';
export type CultureStatus = 'active' | 'colonizing' | 'ready' | 'contaminated' | 'archived' | 'depleted';

export interface CultureObservation {
  id: string;
  date: Date;
  type: 'general' | 'growth' | 'contamination' | 'transfer' | 'harvest';
  notes: string;
  healthRating?: number;
  images?: string[];
}

export interface CultureTransfer {
  id: string;
  date: Date;
  fromId: string;
  toId?: string;
  toType: CultureType | 'grain_spawn' | 'bulk';
  quantity: number;
  unit: string;
  notes?: string;
}

export interface Culture {
  id: string;
  type: CultureType;
  label: string;
  strainId: string;
  status: CultureStatus;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  generation: number;
  locationId: string;
  vesselId: string;
  recipeId?: string;
  volumeMl?: number;
  fillVolumeMl?: number;
  prepDate?: string;
  sterilizationDate?: string;
  healthRating: number;
  notes: string;
  cost: number;
  supplierId?: string;
  lotNumber?: string;
  expiresAt?: Date;
  observations: CultureObservation[];
  transfers: CultureTransfer[];
}

// ============================================================================
// GROW TYPES
// ============================================================================

export type GrowStage = 'spawning' | 'colonization' | 'fruiting' | 'harvesting' | 'completed' | 'contaminated' | 'aborted';
export type GrowStatus = 'active' | 'paused' | 'completed' | 'failed';

export interface GrowObservation {
  id: string;
  date: Date;
  stage: GrowStage;
  type: 'general' | 'environmental' | 'contamination' | 'milestone' | 'photo';
  title: string;
  notes: string;
  temperature?: number;
  humidity?: number;
  colonizationPercent?: number;
}

export interface Flush {
  id: string;
  flushNumber: number;
  harvestDate: Date;
  wetWeight: number;
  dryWeight: number;
  mushroomCount?: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

export interface Grow {
  id: string;
  name: string;
  strainId: string;
  status: GrowStatus;
  currentStage: GrowStage;
  
  // Source
  sourceCultureId?: string;
  spawnType: string;
  spawnWeight: number;
  
  // Substrate
  substrateTypeId: string;
  substrateWeight: number;
  spawnRate: number;
  recipeId?: string;
  
  // Container
  containerTypeId: string;
  containerCount: number;
  
  // Dates
  createdAt: Date;
  spawnedAt: Date;
  colonizationStartedAt?: Date;
  fruitingStartedAt?: Date;
  firstPinsAt?: Date;
  firstHarvestAt?: Date;
  completedAt?: Date;
  
  // Location
  locationId: string;
  
  // Environmental targets
  targetTempColonization: number;
  targetTempFruiting: number;
  targetHumidity: number;
  
  // Results
  flushes: Flush[];
  totalYield: number;
  estimatedCost: number;
  
  // Observations
  observations: GrowObservation[];
  
  // Notes
  notes: string;
}

// ============================================================================
// RECIPE TYPES
// ============================================================================

// Default category codes (can be extended with custom categories)
export type DefaultRecipeCategory = 'agar' | 'liquid_culture' | 'grain_spawn' | 'bulk_substrate' | 'casing' | 'other';

// RecipeCategory now allows custom category codes as strings
export type RecipeCategory = DefaultRecipeCategory | string;

// Recipe category lookup item for custom categories
export interface RecipeCategoryItem {
  id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export interface RecipeIngredient {
  id: string;
  inventoryItemId?: string; // Links to inventory
  name: string; // Fallback if not linked
  quantity: number;
  unit: string;
  notes?: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  description: string;
  yield: { amount: number; unit: string };
  prepTime?: number; // minutes
  sterilizationTime?: number; // minutes
  sterilizationPsi?: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tips?: string[];
  sourceUrl?: string;
  notes?: string;
  costPerBatch?: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// ============================================================================
// APP SETTINGS
// ============================================================================

export interface AppSettings {
  defaultUnits: 'metric' | 'imperial';
  defaultCurrency: string;
  altitude: number; // feet
  timezone: string;
  notifications: {
    enabled: boolean;
    harvestReminders: boolean;
    lowStockAlerts: boolean;
    contaminationAlerts: boolean;
  };
}

// ============================================================================
// DATA STORE STATE
// ============================================================================

export interface DataStoreState {
  // Lookup tables
  species: Species[];
  strains: Strain[];
  locations: Location[];
  vessels: Vessel[];
  containerTypes: ContainerType[];
  substrateTypes: SubstrateType[];
  suppliers: Supplier[];
  inventoryCategories: InventoryCategory[];
  recipeCategories: RecipeCategoryItem[];

  // Core entities
  inventoryItems: InventoryItem[];
  cultures: Culture[];
  grows: Grow[];
  recipes: Recipe[];

  // Settings
  settings: AppSettings;
}

// ============================================================================
// HELPER TYPES FOR OPERATIONS
// ============================================================================

export type EntityType = 'species' | 'strain' | 'location' | 'vessel' | 'containerType' | 'substrateType' | 'supplier' | 'inventoryCategory' | 'inventoryItem' | 'culture' | 'grow' | 'recipe';

export interface LookupHelpers {
  getSpecies: (id: string) => Species | undefined;
  getStrain: (id: string) => Strain | undefined;
  getLocation: (id: string) => Location | undefined;
  getVessel: (id: string) => Vessel | undefined;
  getContainerType: (id: string) => ContainerType | undefined;
  getSubstrateType: (id: string) => SubstrateType | undefined;
  getSupplier: (id: string) => Supplier | undefined;
  getInventoryCategory: (id: string) => InventoryCategory | undefined;
  getRecipeCategory: (code: string) => RecipeCategoryItem | undefined;
  getInventoryItem: (id: string) => InventoryItem | undefined;
  getCulture: (id: string) => Culture | undefined;
  getGrow: (id: string) => Grow | undefined;
  getRecipe: (id: string) => Recipe | undefined;

  // Filtered lists (active only)
  activeSpecies: Species[];
  activeStrains: Strain[];
  activeLocations: Location[];
  activeVessels: Vessel[];
  activeContainerTypes: ContainerType[];
  activeSubstrateTypes: SubstrateType[];
  activeSuppliers: Supplier[];
  activeInventoryCategories: InventoryCategory[];
  activeRecipeCategories: RecipeCategoryItem[];
  activeInventoryItems: InventoryItem[];
  activeRecipes: Recipe[];
}
