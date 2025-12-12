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

// Location type lookup (customizable dropdown)
export interface LocationType {
  id: string;
  name: string;
  code: string;
  description?: string;
  notes?: string;
  isActive: boolean;
}

// Location classification lookup (customizable dropdown)
export interface LocationClassification {
  id: string;
  name: string;
  code: string;
  description?: string;
  notes?: string;
  isActive: boolean;
}

export interface Location {
  id: string;
  name: string;
  // Legacy type field (for backwards compatibility) - will be migrated to typeId
  type?: 'incubation' | 'fruiting' | 'storage' | 'lab' | 'other';
  // New customizable type reference
  typeId?: string;
  // New classification
  classificationId?: string;
  tempRange?: { min: number; max: number };
  humidityRange?: { min: number; max: number };
  // New fields for enhanced location tracking
  hasPower?: boolean;
  powerUsage?: string; // e.g., "120V", "240V", "None"
  hasAirCirculation?: boolean;
  size?: string; // e.g., "Small", "Medium", "Large" or dimensions
  // Procurement tracking
  supplierId?: string;
  cost?: number;
  procurementDate?: Date;
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

// Grain type for spawn (customizable dropdown)
export interface GrainType {
  id: string;
  name: string;
  code: string;
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
// INVENTORY LOT TYPES - Track individual units/containers
// ============================================================================

export type LotStatus = 'available' | 'low' | 'empty' | 'expired' | 'reserved';

export interface InventoryLot {
  id: string;
  inventoryItemId: string;  // Parent item (e.g., "Light Malt Extract")
  quantity: number;         // Current quantity (e.g., 3.42)
  originalQuantity: number; // Starting quantity (e.g., 5.0)
  unit: string;             // Unit of measure (e.g., "lb", "g", "ml")
  status: LotStatus;

  // Purchase info
  purchaseOrderId?: string;
  supplierId?: string;
  purchaseDate?: Date;
  purchaseCost?: number;

  // Tracking
  locationId?: string;
  expirationDate?: Date;
  lotNumber?: string;       // Manufacturer lot number

  // Photos
  images?: string[];

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// ============================================================================
// PURCHASE ORDER TYPES
// ============================================================================

export type OrderStatus = 'draft' | 'pending' | 'ordered' | 'shipped' | 'partial' | 'received' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'partial' | 'refunded';

export interface PurchaseOrderItem {
  id: string;
  inventoryItemId?: string;   // Link to existing inventory item
  name: string;               // Item name (for new items or display)
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  quantityReceived: number;   // How much actually received
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;        // User-friendly order number
  supplierId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  // Items
  items: PurchaseOrderItem[];

  // Costs
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;

  // Dates
  orderDate: Date;
  expectedDate?: Date;
  receivedDate?: Date;

  // Tracking
  trackingNumber?: string;
  trackingUrl?: string;
  orderUrl?: string;          // Link to online order

  // Documents
  receiptImage?: string;      // Receipt photo/screenshot
  invoiceImage?: string;
  images?: string[];          // Additional photos

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// ============================================================================
// INVENTORY USAGE TYPES - Track what's used from which lot
// ============================================================================

export type UsageType = 'recipe' | 'grow' | 'culture' | 'waste' | 'adjustment' | 'other';

export interface InventoryUsage {
  id: string;
  lotId: string;              // Which lot the usage came from
  inventoryItemId: string;    // The parent inventory item
  quantity: number;           // Amount used
  unit: string;
  usageType: UsageType;

  // What it was used for
  referenceType?: 'recipe' | 'grow' | 'culture';
  referenceId?: string;       // ID of the recipe/grow/culture
  referenceName?: string;     // Name for display

  usedAt: Date;
  usedBy?: string;            // User who logged the usage
  notes?: string;
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
  locationTypes: LocationType[];
  locationClassifications: LocationClassification[];
  vessels: Vessel[];
  containerTypes: ContainerType[];
  substrateTypes: SubstrateType[];
  suppliers: Supplier[];
  inventoryCategories: InventoryCategory[];
  recipeCategories: RecipeCategoryItem[];
  grainTypes: GrainType[];

  // Core entities
  inventoryItems: InventoryItem[];
  inventoryLots: InventoryLot[];
  inventoryUsages: InventoryUsage[];
  purchaseOrders: PurchaseOrder[];
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
  getLocationType: (id: string) => LocationType | undefined;
  getLocationClassification: (id: string) => LocationClassification | undefined;
  getVessel: (id: string) => Vessel | undefined;
  getContainerType: (id: string) => ContainerType | undefined;
  getSubstrateType: (id: string) => SubstrateType | undefined;
  getSupplier: (id: string) => Supplier | undefined;
  getInventoryCategory: (id: string) => InventoryCategory | undefined;
  getRecipeCategory: (code: string) => RecipeCategoryItem | undefined;
  getGrainType: (id: string) => GrainType | undefined;
  getInventoryItem: (id: string) => InventoryItem | undefined;
  getInventoryLot: (id: string) => InventoryLot | undefined;
  getPurchaseOrder: (id: string) => PurchaseOrder | undefined;
  getCulture: (id: string) => Culture | undefined;
  getGrow: (id: string) => Grow | undefined;
  getRecipe: (id: string) => Recipe | undefined;

  // Filtered lists (active only)
  activeSpecies: Species[];
  activeStrains: Strain[];
  activeLocations: Location[];
  activeLocationTypes: LocationType[];
  activeLocationClassifications: LocationClassification[];
  activeVessels: Vessel[];
  activeContainerTypes: ContainerType[];
  activeSubstrateTypes: SubstrateType[];
  activeSuppliers: Supplier[];
  activeInventoryCategories: InventoryCategory[];
  activeRecipeCategories: RecipeCategoryItem[];
  activeGrainTypes: GrainType[];
  activeInventoryItems: InventoryItem[];
  activeInventoryLots: InventoryLot[];
  activePurchaseOrders: PurchaseOrder[];
  activeRecipes: Recipe[];
}
