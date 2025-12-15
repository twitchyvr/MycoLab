// ============================================================================
// SHARED TYPE DEFINITIONS
// Central type definitions used across all components
// ============================================================================

// ============================================================================
// AUTOMATION-READY ENVIRONMENTAL TYPES
// Designed for future IoT/sensor integration and automated environment control
// ============================================================================

// Environmental range with multi-level thresholds for automation alerts
export interface EnvironmentalRange {
  // Core range values
  min: number;
  max: number;
  optimal?: number;

  // Alert thresholds for automation (optional - for future use)
  warningLow?: number;    // Below this triggers warning (yellow alert)
  warningHigh?: number;   // Above this triggers warning (yellow alert)
  criticalLow?: number;   // Below this triggers critical alert (red alert)
  criticalHigh?: number;  // Above this triggers critical alert (red alert)
}

// Temperature range in Fahrenheit (extends EnvironmentalRange for backwards compatibility)
export interface TemperatureRange extends EnvironmentalRange {
  // Automation control hints
  rampRate?: number;      // Degrees per hour for gradual changes between stages
}

// Humidity range as percentage
export interface HumidityRange extends EnvironmentalRange {
  // Automation control hints
  rampRate?: number;      // Percentage points per hour for gradual changes
}

// CO2 range in PPM for automated ventilation control
export interface CO2Range extends EnvironmentalRange {
  unit?: 'ppm';           // Parts per million (standard)
}

// Light schedule for automated lighting control
export interface LightSchedule {
  photoperiod?: number;           // Hours of light per day (e.g., 12)
  intensity?: 'low' | 'medium' | 'high' | number;  // Relative or lux value
  spectrum?: 'warm' | 'cool' | 'full' | 'blue' | 'red';  // Light spectrum type
  dawnDuskRamp?: number;          // Minutes to ramp up/down (simulate sunrise/sunset)
}

// Stage transition criteria for automation
export interface StageTransitionCriteria {
  // Time-based triggers
  minDays?: number;               // Minimum days before transition allowed
  maxDays?: number;               // Maximum days (auto-alert if exceeded)
  typicalDays?: number;           // Expected duration for scheduling

  // Condition-based triggers (for future sensor integration)
  colonizationPercent?: number;   // e.g., 100 = fully colonized
  visualIndicators?: string[];    // Human-readable cues to look for

  // Automation behavior
  autoTransition?: boolean;       // Whether to auto-advance or require confirmation
  transitionAlertDays?: number;   // Days before expected transition to send reminder

  // Environmental transition
  tempTransitionHours?: number;   // Hours to ramp temperature to next stage
  humidityTransitionHours?: number; // Hours to ramp humidity to next stage
}

// Parameters for each growth phase - automation ready
export interface GrowPhaseParameters {
  // Environmental targets
  tempRange?: TemperatureRange;
  humidityRange?: HumidityRange;
  co2Range?: CO2Range;
  lightSchedule?: LightSchedule;

  // Duration
  daysMin?: number;
  daysMax?: number;
  daysTypical?: number;           // Expected/average duration

  // FAE (Fresh Air Exchange) requirements
  co2Tolerance?: 'low' | 'moderate' | 'high';
  faeFrequency?: string;          // e.g., "4x daily", "continuous", "passive"

  // Light requirements (simple version, lightSchedule for detailed)
  lightRequirement?: 'none' | 'indirect' | 'direct' | '12hr_cycle';

  // Stage transition criteria
  transitionCriteria?: StageTransitionCriteria;

  // Automation priority (which parameters are most critical to maintain)
  criticalParameters?: ('temperature' | 'humidity' | 'co2' | 'light' | 'fae')[];

  // Equipment hints for automation systems
  equipmentNotes?: string;        // e.g., "Requires ultrasonic humidifier", "Martha tent recommended"

  notes?: string;
}

// Automation configuration for a species
export interface SpeciesAutomationConfig {
  // Overall automation readiness
  automationTested?: boolean;     // Has this been validated with automation?
  automationNotes?: string;       // General automation considerations

  // Sensor requirements
  requiredSensors?: ('temperature' | 'humidity' | 'co2' | 'light' | 'weight')[];
  optionalSensors?: ('temperature' | 'humidity' | 'co2' | 'light' | 'weight' | 'camera')[];

  // Controller compatibility
  controllerTypes?: string[];     // e.g., ["inkbird", "ac_infinity", "custom_arduino"]

  // Alert configuration defaults
  alertOnTempDeviation?: number;  // Degrees deviation to trigger alert
  alertOnHumidityDeviation?: number; // Percentage points deviation
  alertOnStageDuration?: boolean; // Alert if stage takes too long

  // Data collection preferences
  sensorPollingInterval?: number; // Seconds between sensor readings
  dataRetentionDays?: number;     // How long to keep detailed sensor data
}

// ============================================================================
// LOOKUP TABLE TYPES
// ============================================================================

export interface Species {
  id: string;
  name: string;                    // Common name (e.g., "Pearl Oyster")
  scientificName?: string;         // e.g., "Pleurotus ostreatus"
  commonNames?: string[];          // Alternative names
  category: 'gourmet' | 'medicinal' | 'research' | 'other';

  // Growing parameters by stage (automation-ready)
  spawnColonization?: GrowPhaseParameters;  // Stage 1: Grain/spawn colonization
  bulkColonization?: GrowPhaseParameters;   // Stage 2: Substrate colonization
  pinning?: GrowPhaseParameters;            // Stage 3a: Pin formation
  maturation?: GrowPhaseParameters;         // Stage 3b: Fruit body development

  // Substrate preferences
  preferredSubstrates?: string[];  // e.g., ["hardwood sawdust", "straw", "masters mix"]
  substrateNotes?: string;

  // Growing characteristics
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  characteristics?: string;        // Notable physical/growing traits

  // Culinary/Usage info
  flavorProfile?: string;
  culinaryNotes?: string;
  medicinalProperties?: string;

  // Community knowledge
  communityTips?: string;
  importantFacts?: string;

  // Yield expectations
  typicalYield?: string;           // e.g., "1-2 lbs per 5lb block"
  flushCount?: string;             // e.g., "2-3 flushes"

  // Shelf life (days)
  shelfLifeDays?: { min: number; max: number };

  // Automation configuration (for future IoT integration)
  automationConfig?: SpeciesAutomationConfig;

  // Stage-specific notes (easily accessible for UI display)
  spawnColonizationNotes?: string;  // Human-readable guidance for spawn colonization
  bulkColonizationNotes?: string;   // Human-readable guidance for bulk colonization
  pinningNotes?: string;            // Human-readable guidance for pinning stage
  maturationNotes?: string;         // Human-readable guidance for maturation/harvest

  notes?: string;
  isActive: boolean;
}

export interface Strain {
  id: string;
  name: string;
  speciesId?: string; // Reference to species table
  species: string; // Legacy field - now stores species name directly
  // Variety/Phenotype tracking
  variety?: string; // Specific variety or cultivar (e.g., "var. alba")
  phenotype?: string; // Observable traits (e.g., "Albino", "Leucistic", "APE")
  geneticsSource?: string; // Where genetics came from (vendor, trade, isolation)
  isolationType?: 'multispore' | 'clone' | 'agar_isolation' | 'spore_isolation' | 'lc_isolation' | 'unknown';
  generation?: number; // Generation from original (G0, G1, G2, etc.)
  // Growing characteristics
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  colonizationDays: { min: number; max: number };
  fruitingDays: { min: number; max: number };
  optimalTempColonization: { min: number; max: number };
  optimalTempFruiting: { min: number; max: number };
  // Additional metadata
  origin?: string; // Geographic origin or breeder
  description?: string; // Detailed description of characteristics
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
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory =
  | 'culture_expiring'      // Culture viability alerts
  | 'stage_transition'      // Grow stage change reminders
  | 'low_inventory'         // Inventory below reorder point
  | 'harvest_ready'         // Ready to harvest
  | 'contamination'         // Contamination detected
  | 'lc_age'                // LC getting too old
  | 'slow_growth'           // Item not progressing as expected
  | 'system'                // System notifications
  | 'user';                 // User-generated notes/reminders

export interface UserNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  // Optional references
  entityType?: 'culture' | 'grow' | 'inventory' | 'recipe';
  entityId?: string;
  entityName?: string;
  // Timestamps
  createdAt: Date;
  readAt?: Date;
  dismissedAt?: Date;
  // Auto-dismiss behavior
  autoDismiss?: boolean;
  autoDismissMs?: number;
  // Actions
  actionLabel?: string;
  actionPage?: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  category: NotificationCategory;
  enabled: boolean;
  // Threshold settings
  thresholdDays?: number;      // Days before expiration to alert
  thresholdQuantity?: number;  // Inventory quantity threshold
  thresholdPercent?: number;   // Colonization percent threshold
  // Notification settings
  notifyType: NotificationType;
  repeatIntervalHours?: number; // How often to re-notify (0 = once)
  // Filters
  strainIds?: string[];        // Only for specific strains
  speciesIds?: string[];       // Only for specific species
  locationIds?: string[];      // Only for specific locations
  isActive: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  // Category toggles
  cultureExpiring: boolean;
  stageTransitions: boolean;
  lowInventory: boolean;
  harvestReady: boolean;
  contamination: boolean;
  lcAge: boolean;
  slowGrowth: boolean;
  // Display preferences
  showToasts: boolean;
  toastDurationMs: number;
  soundEnabled: boolean;
  // Browser push notifications
  pushEnabled: boolean;
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
  notificationPreferences?: NotificationPreferences;
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

  // Notifications
  notifications: UserNotification[];
  notificationRules: NotificationRule[];

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
