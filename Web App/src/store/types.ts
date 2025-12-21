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
  userId?: string | null; // null = system/global data, string = user-created
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

  // Cold storage requirements
  // Some tropical species (Almond, Pink Oyster, Paddy Straw) require warmer storage (10°C/50°F)
  // Standard species store well at 2-4°C/35-39°F
  coldSensitive?: boolean;          // If true, do not store below 10°C/50°F
  minStorageTempC?: number;         // Minimum safe storage temperature in Celsius (default 2)

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
  userId?: string | null; // null = system/global data, string = user-created
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

  // Image support
  images?: string[];           // Reference images for identification
  referenceImage?: string;     // Primary reference image
}

// Location type lookup (customizable dropdown)
export interface LocationType {
  id: string;
  userId?: string | null; // null = system/global data, string = user-created
  name: string;
  code: string;
  description?: string;
  notes?: string;
  isActive: boolean;
}

// Location classification lookup (customizable dropdown)
export interface LocationClassification {
  id: string;
  userId?: string | null; // null = system/global data, string = user-created
  name: string;
  code: string;
  description?: string;
  notes?: string;
  isActive: boolean;
}

// Location hierarchy level for farm/lab mapping
export type LocationLevel = 'facility' | 'room' | 'zone' | 'rack' | 'shelf' | 'slot';

// Room type classifications for process steps
export type RoomPurpose =
  | 'pasteurization'
  | 'inoculation'
  | 'colonization'
  | 'fruiting'
  | 'storage'
  | 'prep'
  | 'drying'
  | 'packaging'
  | 'general';

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

  // Hierarchical location support for farm/lab mapping
  parentId?: string;          // Parent location ID for hierarchy
  level?: LocationLevel;       // Hierarchy level (facility > room > zone > rack > shelf > slot)
  roomPurpose?: RoomPurpose;  // @deprecated Use roomPurposes instead - kept for backwards compatibility
  roomPurposes?: RoomPurpose[]; // Multiple purposes for multi-use rooms (e.g., colonization + fruiting)
  capacity?: number;          // Maximum items this location can hold
  currentOccupancy?: number;  // Current number of items
  sortOrder?: number;         // Display order among siblings
  path?: string;              // Full path like "Facility/Room A/Rack 1/Shelf 2"
  code?: string;              // Short code for labeling (e.g., "R1-S2-A")
  dimensions?: {              // Physical dimensions
    length?: number;
    width?: number;
    height?: number;
    unit?: 'cm' | 'in' | 'm' | 'ft';
  };

  // Image support
  photos?: string[];           // Photos of the location
  currentPhoto?: string;       // Current state photo
}

// Container categories - unified from former 'vessels' and 'container_types'
export type ContainerCategory =
  | 'jar'      // Mason jars, LC jars (culture)
  | 'bag'      // Spawn bags, grow bags (culture & grow)
  | 'plate'    // Petri dishes (culture)
  | 'tube'     // Test tubes, slants (culture)
  | 'bottle'   // Media bottles (culture)
  | 'syringe'  // Spore/LC syringes (culture)
  | 'tub'      // Monotubs, shoeboxes (grow)
  | 'bucket'   // 5-gallon buckets (grow)
  | 'bed'      // Outdoor beds (grow)
  | 'other';

// Usage context for containers
export type ContainerUsageContext = 'culture' | 'grow';

// Unified Container interface (replaces Vessel and ContainerType)
export interface Container {
  id: string;
  userId?: string | null; // null = system/global data, string = user-created
  name: string;
  category: ContainerCategory;
  volumeMl?: number;  // Volume in ml (liters stored as ml * 1000)
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit?: 'cm' | 'in';
  };
  isReusable: boolean;
  isSterilizable: boolean; // Can be sterilized (glass jars=true, plastic syringes=false)
  usageContext: ContainerUsageContext[];  // What this container can be used for
  notes?: string;
  isActive: boolean;
}

// Legacy type aliases for backward compatibility during migration
/** @deprecated Use Container instead */
export type Vessel = Container;
/** @deprecated Use Container instead */
export type ContainerType = Container;

export interface SubstrateType {
  id: string;
  userId?: string | null; // null = system/global data, string = user-created
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
  userId?: string | null; // null = system/global data, string = user-created
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
  userId?: string | null; // null = system/global data, string = user-created
  name: string;
  code: string;
  notes?: string;
  isActive: boolean;
}

export interface InventoryCategory {
  id: string;
  userId?: string | null; // null = system/global data, string = user-created
  name: string;
  color: string;
  icon?: string;
  isActive: boolean;
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

// Asset type classification for cost tracking and lab valuation
export type AssetType =
  | 'consumable'      // Used up in grows/cultures - cost flows to grows (e.g., substrate, grain)
  | 'equipment'       // Lab equipment - tracked for valuation, NOT in grow costs (e.g., rug, table)
  | 'durable'         // Reusable items - partial depreciation to grows (e.g., monotubs, jars)
  | 'culture_source'; // Purchased cultures - cost tracked per-use (e.g., LC syringe, spore print)

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

  // Asset classification for cost tracking
  assetType?: AssetType;          // Default: 'consumable' for backwards compatibility
  purchaseDate?: Date;            // When the item was purchased
  purchasePrice?: number;         // Total purchase price
  depreciationYears?: number;     // For equipment - years to depreciate over
  currentValue?: number;          // Current book value (for equipment)
  includeInGrowCost?: boolean;    // Override to force include/exclude from grow cost calculations
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

  // Cost tracking - captured at time of usage for historical accuracy
  unitCostAtUsage?: number;   // Unit cost at time of usage (for price change tracking)
  consumedCost?: number;      // Total cost consumed (quantity * unitCostAtUsage)

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
  containerId: string;  // Unified: was vesselId
  recipeId?: string;
  volumeMl?: number;
  fillVolumeMl?: number;
  prepDate?: string;
  sterilizationDate?: string;
  healthRating: number;
  notes: string;

  // Cost tracking
  cost: number;                 // Legacy field - total cost (sum of purchase + production)
  purchaseCost?: number;        // Cost if purchased (e.g., LC syringe from vendor)
  productionCost?: number;      // Cost to produce (recipe ingredients, labor)
  parentCultureCost?: number;   // Proportional cost from parent culture used

  // Volume tracking for proportional cost calculation
  volumeUsed?: number;          // Total volume used from this culture (in ml)
  costPerMl?: number;           // Calculated: cost / fillVolumeMl

  supplierId?: string;
  lotNumber?: string;
  expiresAt?: Date;
  observations: CultureObservation[];
  transfers: CultureTransfer[];

  // Image support
  images?: string[];           // Array of image URLs
  primaryImage?: string;       // Main/featured image URL

  // Immutability fields (optional for backwards compatibility)
  version?: number;
  recordGroupId?: string;
  isCurrent?: boolean;
  validFrom?: Date;
  validTo?: Date;
  supersededById?: string;
  isArchived?: boolean;
  archivedAt?: Date;
  archivedBy?: string;
  archiveReason?: string;
  amendmentType?: AmendmentType;
  amendmentReason?: string;
  amendsRecordId?: string;
}

// ============================================================================
// PREPARED SPAWN TYPES
// Tracks sterilized containers (grain jars, LC jars, agar plates) waiting to be inoculated
// ============================================================================

export type PreparedSpawnType = 'grain_jar' | 'lc_jar' | 'agar_plate' | 'slant_tube' | 'spawn_bag' | 'other';
export type PreparedSpawnStatus = 'available' | 'reserved' | 'inoculated' | 'contaminated' | 'expired';

export interface PreparedSpawn {
  id: string;
  userId?: string | null; // null = system data (unlikely), string = user-created

  // Container info
  type: PreparedSpawnType;
  label?: string;                // User-defined label (e.g., "Rye Quart #1")
  containerId: string;           // Reference to container type (e.g., "Quart Mason Jar")
  containerCount: number;        // Number of containers in this batch (default: 1)

  // Contents
  grainTypeId?: string;          // For grain_jar/spawn_bag - references grain_types
  recipeId?: string;             // Recipe used for LC/agar media
  volumeMl?: number;             // Volume of media (for LC jars)
  weightGrams?: number;          // Weight of grain (for grain jars)

  // Preparation
  prepDate: Date;                // When it was prepared
  sterilizationDate?: Date;      // When it was sterilized (may be same as prepDate)
  sterilizationMethod?: string;  // e.g., "PC 15psi 90min", "Pre-sterilized"
  expiresAt?: Date;              // Expiration/viability date

  // Location & tracking
  locationId: string;            // Where it's stored
  status: PreparedSpawnStatus;

  // Cost tracking
  productionCost?: number;       // Cost to produce (ingredients, labor)

  // Linkage (when inoculated)
  inoculatedAt?: Date;           // When it was inoculated
  resultCultureId?: string;      // The culture record created from inoculation
  resultGrowId?: string;         // The grow record if directly spawned to bulk

  // Metadata
  notes?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;

  // Immutability fields (optional for backwards compatibility)
  version?: number;
  recordGroupId?: string;
  isCurrent?: boolean;
  validFrom?: Date;
  validTo?: Date;
  supersededById?: string;
  isArchived?: boolean;
  archivedAt?: Date;
  archivedBy?: string;
  archiveReason?: string;
  amendmentType?: AmendmentType;
  amendmentReason?: string;
  amendsRecordId?: string;
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
  type: 'general' | 'environmental' | 'contamination' | 'milestone' | 'photo' | 'misting' | 'fae';
  title: string;
  notes: string;
  temperature?: number;
  humidity?: number;
  colonizationPercent?: number;
  images?: string[];           // Attached photos for this observation
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
  harvestImages?: string[];      // Photos of harvested mushrooms
  primaryHarvestPhoto?: string;  // Main harvest photo for display
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
  containerId: string;  // Unified: was containerTypeId
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

  // Cost tracking - detailed breakdown
  sourceCultureCost?: number;   // Cost from source culture (proportional to amount used)
  inventoryCost?: number;       // Total cost from inventory items consumed
  laborCost?: number;           // Manual labor cost entry
  overheadCost?: number;        // Overhead allocation
  totalCost?: number;           // Computed total of all costs

  // Revenue tracking
  revenue?: number;             // Total revenue from sales
  profit?: number;              // Revenue - totalCost
  costPerGramWet?: number;      // totalCost / totalYield (wet)
  costPerGramDry?: number;      // totalCost / totalYieldDry

  // Observations
  observations: GrowObservation[];

  // Notes
  notes: string;

  // Image support
  images?: string[];           // Array of image URLs through grow lifecycle
  setupPhoto?: string;         // Initial setup photo

  // Immutability fields (optional for backwards compatibility)
  version?: number;
  recordGroupId?: string;
  isCurrent?: boolean;
  validFrom?: Date;
  validTo?: Date;
  supersededById?: string;
  isArchived?: boolean;
  archivedAt?: Date;
  archivedBy?: string;
  archiveReason?: string;
  amendmentType?: AmendmentType;
  amendmentReason?: string;
  amendsRecordId?: string;
  sourceCultureSnapshot?: Record<string, unknown>;  // Denormalized for historical accuracy
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
  userId?: string | null; // null = system/global data, string = user-created
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
  // Email/SMS preferences
  emailEnabled?: boolean;
  smsEnabled?: boolean;
}

// ============================================================================
// EMAIL/SMS NOTIFICATION CHANNEL TYPES
// ============================================================================

// Channel types for delivering notifications
export type NotificationChannelType = 'email' | 'sms' | 'push';

// Delivery status tracking
export type NotificationDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'unsubscribed';

// Priority levels for notifications
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// Notification channel configuration
export interface NotificationChannel {
  id: string;
  userId: string;
  channelType: NotificationChannelType;
  isEnabled: boolean;
  isVerified: boolean;
  // Contact info (email address or phone number in E.164 format)
  contactValue: string;
  // Verification
  verificationCode?: string;
  verificationSentAt?: Date;
  verifiedAt?: Date;
  // Channel-specific settings
  quietHoursStart?: string;  // HH:MM format, e.g., '22:00'
  quietHoursEnd?: string;    // HH:MM format, e.g., '08:00'
  timezone: string;
  // Rate limiting
  maxPerHour: number;
  maxPerDay: number;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Per-event notification preferences
export interface NotificationEventPreference {
  id: string;
  userId: string;
  eventCategory: NotificationCategory;
  // Which channels to use for this event type
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  // Priority/urgency settings
  priority: NotificationPriority;
  // Only send SMS for urgent if true (saves SMS quota)
  smsUrgentOnly: boolean;
  // Batching - combine multiple notifications of same type
  batchIntervalMinutes: number;  // 0 = immediate, >0 = batch
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Delivery log for tracking sent notifications
export interface NotificationDeliveryLog {
  id: string;
  userId: string;
  // What was sent
  channelType: NotificationChannelType;
  eventCategory: NotificationCategory;
  // Content
  title: string;
  message: string;
  // Related entity (optional)
  entityType?: 'culture' | 'grow' | 'inventory' | 'recipe';
  entityId?: string;
  entityName?: string;
  // Delivery status
  status: NotificationDeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  // Error tracking
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  nextRetryAt?: Date;
  // External provider tracking
  provider?: string;  // 'sendgrid', 'twilio', 'resend', etc.
  providerMessageId?: string;
  // Cost tracking (for SMS)
  costCents?: number;
  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Notification template for customizable messages
export interface NotificationTemplate {
  id: string;
  name: string;
  eventCategory: NotificationCategory;
  channelType: NotificationChannelType;
  // Content templates (support {{variable}} placeholders)
  subjectTemplate?: string;  // For email only
  bodyTemplate: string;
  // HTML template for email (optional)
  htmlTemplate?: string;
  // Active status
  isActive: boolean;
  isSystem: boolean;  // System templates can't be deleted
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// APP SETTINGS
// ============================================================================

// Experience level for UI complexity control
// Controls which features, options, and guidance are shown
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Growing purpose - why the user is growing
// Affects which features/metrics are emphasized
export type GrowingPurpose = 'hobby' | 'commercial' | 'research' | 'mixed';

// Lab equipment that the user has available
export interface LabEquipment {
  hasPressureCooker?: boolean;
  pressureCookerSize?: string;  // e.g., "23qt", "41qt"
  hasFlowHood?: boolean;
  flowHoodSize?: string;
  hasStillAirBox?: boolean;
  hasDehydrator?: boolean;
  hasIncubationChamber?: boolean;
  hasFruitingChamber?: boolean;
  hasScales?: boolean;
  scalesPrecision?: string;  // e.g., "0.01g", "0.1g", "1g"
  otherEquipment?: string[];
}

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
  // Email/SMS notification settings
  emailNotificationsEnabled?: boolean;
  smsNotificationsEnabled?: boolean;
  notificationEmail?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  notificationEmailVerified?: boolean;
  quietHoursStart?: string;  // HH:MM format
  quietHoursEnd?: string;    // HH:MM format

  // Experience level and setup wizard (v19)
  experienceLevel?: ExperienceLevel;        // Controls UI complexity
  advancedMode?: boolean;                   // Override to show all options
  hasCompletedSetupWizard?: boolean;        // First-time wizard completed
  showTooltips?: boolean;                   // Show explanatory tooltips
  showGuidedWorkflows?: boolean;            // Show step-by-step wizards

  // Growing purpose and equipment (v20 - onboarding wizard)
  growingPurpose?: GrowingPurpose;          // Why the user is growing
  labEquipment?: LabEquipment;              // What equipment they have
  preferredSpeciesIds?: string[];           // Species they're interested in
  preferredStrainIds?: string[];            // Strains they want to grow

  // Timer sound settings
  timerSound?: TimerSoundType;              // Which sound to play when timer completes
  timerVolume?: number;                     // Volume 0-1 (default 0.7)
}

// Timer sound options
export type TimerSoundType = 'bell' | 'chime' | 'ding' | 'gong' | 'alert' | 'none';

// ============================================================================
// LIBRARY SUGGESTIONS SYSTEM
// For users to propose new library entries that admins can approve/reject
// ============================================================================

// Types of library entries that can be suggested
export type SuggestionType =
  | 'species'
  | 'strain'
  | 'container'
  | 'substrate_type'
  | 'grain_type'
  | 'supplier'
  | 'inventory_category'
  | 'location_type'
  | 'location_classification'
  | 'correction'    // Corrections to existing entries
  | 'addition'      // Additions to existing entries
  | 'other';

// Workflow status for suggestions
export type SuggestionStatus =
  | 'pending'           // Awaiting admin review
  | 'under_review'      // Admin is actively reviewing
  | 'changes_requested' // Admin requested changes
  | 'approved'          // Accepted, added to library
  | 'rejected'          // Not accepted
  | 'merged'            // Already existed, merged
  | 'needs_info';       // Backward compatibility

// Library suggestion submitted by user
export interface LibrarySuggestion {
  id: string;
  suggestionType: SuggestionType;
  targetSpeciesId?: string;           // For corrections/additions to species
  targetStrainId?: string;            // For corrections/additions to strains
  title: string;
  description?: string;
  proposedChanges?: Record<string, any>;  // JSONB data for the suggestion
  sourceUrl?: string;                 // Reference URL
  sourceNotes?: string;               // Notes about the source
  status: SuggestionStatus;
  adminNotes?: string;                // Internal admin notes
  rejectionReason?: string;           // Shown to user if rejected
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Message in suggestion conversation thread
export interface SuggestionMessage {
  id: string;
  suggestionId: string;
  userId: string;
  message: string;
  isAdminMessage: boolean;
  isRead: boolean;
  createdAt: Date;
}

// ============================================================================
// PUBLIC SHARING SYSTEM TYPES
// Token-based sharing for public/anonymous access to grows, cultures, batches
// Following API security best practices and EU Digital Product Passport standards
// ============================================================================

// Entity types that can be shared publicly
export type ShareableEntityType = 'grow' | 'culture' | 'batch' | 'recipe' | 'lineage';

// Access levels for shared content
export type ShareAccessLevel = 'customer' | 'auditor';

// Share token for public/anonymous access
export interface ShareToken {
  id: string;
  token: string;  // Opaque random string (NOT JWT per security best practices)

  // What is being shared
  entityType: ShareableEntityType;
  entityId: string;

  // Access control
  accessLevel: ShareAccessLevel;
  permissions: Record<string, boolean>;  // Additional field-level permissions

  // Expiration & analytics
  expiresAt: Date;
  viewCount: number;
  lastViewedAt?: Date;

  // Revocation
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;

  // Ownership
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Field visibility configuration for redaction
export interface FieldVisibility {
  // Basic info
  strain?: boolean;
  species?: boolean;
  substrateType?: boolean;

  // Weights/quantities
  spawnWeight?: boolean;
  substrateWeight?: boolean;

  // Container/location
  container?: boolean;
  location?: boolean;         // General location (e.g., "Pacific Northwest")
  locationAddress?: boolean;  // Specific address - ALWAYS default false

  // Timeline/dates
  inoculationDate?: boolean;
  colonizationDate?: boolean;
  fruitingDate?: boolean;
  harvestDates?: boolean;

  // Yields
  totalYield?: boolean;
  flushWeights?: boolean;
  biologicalEfficiency?: boolean;

  // Observations
  observations?: boolean;
  photos?: boolean;

  // Lineage (for cultures)
  lineage?: boolean;
  generation?: boolean;
  parentCulture?: boolean;

  // Sensitive data - DEFAULT FALSE
  cost?: boolean;
  failures?: boolean;
  contaminationHistory?: boolean;
  supplierInfo?: boolean;
  recipeDetails?: boolean;
  notes?: boolean;
  lotNumber?: boolean;
}

// Batch passport (Digital Product Passport)
export interface BatchPassport {
  id: string;

  // Unique passport identifier (shareable, human-readable)
  // Format: ML-YYYY-MM-NNNN (e.g., "ML-2025-12-0001")
  passportCode: string;

  // What this passport represents
  entityType: 'grow' | 'culture' | 'batch';
  entityId: string;

  // Field visibility configuration
  fieldVisibility: FieldVisibility;

  // Custom public content (seller-written)
  publicTitle?: string;
  publicDescription?: string;
  publicNotes?: string;
  sellerName?: string;
  sellerContact?: string;
  sellerWebsite?: string;

  // Lineage snapshot (frozen at passport creation)
  lineageSnapshot?: {
    ancestors: Array<{
      id: string;
      type: string;
      label: string;
      strainName?: string;
      createdAt: string;
    }>;
    descendants: Array<{
      id: string;
      type: string;
      label: string;
      strainName?: string;
      createdAt: string;
    }>;
    capturedAt: string;
  };

  // QR Code data
  qrDataUrl?: string;
  qrShortUrl?: string;

  // Status
  isPublished: boolean;
  publishedAt?: Date;

  // Ownership
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Passport view analytics (anonymized)
export interface PassportView {
  id: string;
  passportId: string;

  // Viewer info (anonymous - no PII stored)
  viewerToken?: string;  // Hashed session token
  ipHash?: string;       // Hashed IP for fraud detection
  userAgent?: string;
  referrer?: string;

  // Geolocation (optional, city-level only)
  geoCountry?: string;
  geoRegion?: string;

  viewedAt: Date;
}

// Redaction preset (template for field visibility)
export interface RedactionPreset {
  id: string;
  name: string;
  description?: string;

  // Field visibility template
  fieldVisibility: FieldVisibility;

  // Which entity types this preset applies to
  appliesTo: Array<'grow' | 'culture' | 'batch'>;

  // Ownership (null = system preset available to all)
  isSystem: boolean;
  userId?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Default redaction preset IDs (system presets)
export const REDACTION_PRESET_IDS = {
  CUSTOMER_VIEW: '00000000-0000-0000-0100-000000000001',
  AUDITOR_VIEW: '00000000-0000-0000-0100-000000000002',
  MINIMAL_VIEW: '00000000-0000-0000-0100-000000000003',
  GENETICS_FOCUS: '00000000-0000-0000-0100-000000000004',
} as const;

// Passport analytics summary
export interface PassportAnalytics {
  passportId: string;
  totalViews: number;
  uniqueViewers: number;
  viewsByCountry: Record<string, number>;
  viewsByDay: Array<{ date: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  lastViewedAt?: Date;
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
  containers: Container[];  // Unified: replaces vessels and containerTypes
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
  preparedSpawn: PreparedSpawn[];  // Sterilized containers ready for inoculation
  grows: Grow[];
  recipes: Recipe[];

  // Historical tracking (append-only)
  entityOutcomes: EntityOutcome[];

  // Immutable history tables (append-only audit trail)
  observationHistory: ObservationHistoryEntry[];
  harvestHistory: HarvestHistoryEntry[];
  transferHistory: TransferHistoryEntry[];
  stageTransitions: StageTransitionEntry[];
  dataAmendmentLog: DataAmendmentLogEntry[];
  bulkOperations: BulkOperation[];

  // Public sharing system
  shareTokens: ShareToken[];
  batchPassports: BatchPassport[];
  redactionPresets: RedactionPreset[];

  // Notifications
  notifications: UserNotification[];
  notificationRules: NotificationRule[];

  // Settings
  settings: AppSettings;
}

// ============================================================================
// HELPER TYPES FOR OPERATIONS
// ============================================================================

export type EntityType = 'species' | 'strain' | 'location' | 'container' | 'substrateType' | 'supplier' | 'inventoryCategory' | 'inventoryItem' | 'culture' | 'grow' | 'recipe';

// ============================================================================
// IMMUTABLE DATABASE TYPES
// Append-only architecture for complete audit trail and data integrity
// ============================================================================

/**
 * Amendment types for record versioning
 * - original: First version of the record
 * - correction: Fixing an error (e.g., typo in weight)
 * - update: Normal business update (e.g., status change)
 * - void: Nullifying a record (e.g., duplicate entry)
 * - merge: Combining multiple records
 */
export type AmendmentType = 'original' | 'correction' | 'update' | 'void' | 'merge';

/**
 * Base fields for all immutable records
 * These fields are added to any entity that supports versioning
 */
export interface ImmutableRecordFields {
  // Version tracking
  version: number;                  // 1, 2, 3, etc.
  recordGroupId: string;            // Links all versions of the same logical record
  isCurrent: boolean;               // Only one version is current

  // Temporal validity (when was this version the "truth"?)
  validFrom: Date;                  // When this version became valid
  validTo?: Date;                   // When this version was superseded (null = current)
  supersededById?: string;          // ID of the version that replaced this one

  // Archival (soft delete with reason)
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: string;              // User ID who archived
  archiveReason?: string;

  // Amendment metadata (what changed?)
  amendmentType: AmendmentType;
  amendmentReason?: string;         // Why was this record amended?
  amendsRecordId?: string;          // ID of the record this amends
}

/**
 * Request object for creating an amendment
 * Used when updating a record in the immutable pattern
 */
export interface AmendmentRequest<T> {
  originalId: string;               // ID of the record being amended
  changes: Partial<T>;              // Fields being changed
  amendmentType: AmendmentType;     // Type of amendment
  reason: string;                   // Human-readable reason for the change
}

/**
 * Archive request for soft-deleting a record
 */
export interface ArchiveRequest {
  recordId: string;
  reason: string;
}

/**
 * Historical observation entry (immutable)
 * Used for tracking observations, environmental readings, etc.
 */
export interface ObservationHistoryEntry {
  id: string;
  entityType: 'culture' | 'grow' | 'prepared_spawn' | 'location';
  entityId: string;
  entityRecordGroupId: string;

  // Observation data
  observedAt: Date;
  observationType: string;
  title?: string;
  notes?: string;

  // Measurements
  temperature?: number;
  humidity?: number;
  co2Ppm?: number;
  colonizationPercent?: number;
  healthRating?: number;

  // Context
  stage?: string;
  images?: string[];

  // Recording metadata
  recordedAt: Date;
  recordedBy?: string;

  // Amendment support
  isCurrent: boolean;
  supersededById?: string;
  amendmentReason?: string;

  userId?: string;
  createdAt: Date;
}

/**
 * Historical harvest entry (immutable)
 * Replaces embedded flushes for full audit trail
 */
export interface HarvestHistoryEntry {
  id: string;
  growId: string;
  growRecordGroupId: string;

  // Harvest data
  flushNumber: number;
  harvestDate: Date;
  wetWeightG?: number;
  dryWeightG?: number;
  mushroomCount?: number;
  quality?: 'excellent' | 'good' | 'fair' | 'poor';

  // Context
  notes?: string;
  images?: string[];

  // Recording metadata
  recordedAt: Date;
  recordedBy?: string;

  // Amendment support
  isCurrent: boolean;
  supersededById?: string;
  amendmentReason?: string;

  userId?: string;
  createdAt: Date;
}

/**
 * Historical transfer entry (immutable)
 * Tracks all culture transfers with full audit trail
 */
export interface TransferHistoryEntry {
  id: string;
  fromCultureId: string;
  fromCultureRecordGroupId: string;

  // Destination
  toEntityType: 'culture' | 'grow' | 'grain_spawn' | 'bulk';
  toEntityId?: string;
  toEntityRecordGroupId?: string;

  // Transfer details
  transferDate: Date;
  quantity: number;
  unit: string;

  // Context
  notes?: string;

  // Recording metadata
  recordedAt: Date;
  recordedBy?: string;

  // Amendment support
  isCurrent: boolean;
  supersededById?: string;
  amendmentReason?: string;

  userId?: string;
  createdAt: Date;
}

/**
 * Stage transition entry (immutable)
 * Tracks all stage changes for grows, cultures, etc.
 */
export interface StageTransitionEntry {
  id: string;
  entityType: 'grow' | 'culture' | 'prepared_spawn';
  entityId: string;
  entityRecordGroupId: string;

  // Transition details
  fromStage?: string;
  toStage: string;
  transitionedAt: Date;

  // Context
  notes?: string;
  trigger: 'manual' | 'automatic' | 'scheduled' | 'condition';

  // Recording metadata
  recordedAt: Date;
  recordedBy?: string;

  userId?: string;
  createdAt: Date;
}

/**
 * Data amendment log entry
 * Tracks all corrections and updates for audit purposes
 */
export interface DataAmendmentLogEntry {
  id: string;
  entityType: string;
  originalRecordId: string;
  newRecordId: string;
  recordGroupId: string;

  // Amendment details
  amendmentType: AmendmentType | 'archive' | 'bulk_import';
  reason: string;
  changesSummary?: Record<string, { old: unknown; new: unknown }>;

  // Bulk operation reference
  bulkOperationId?: string;

  // Who and when
  amendedAt: Date;
  amendedBy?: string;

  // Audit info (optional)
  ipAddress?: string;
  userAgent?: string;

  userId?: string;
  createdAt: Date;
}

/**
 * Bulk operation tracking
 * For imports, migrations, and batch corrections
 */
export interface BulkOperation {
  id: string;
  operationType: 'import' | 'migration' | 'correction' | 'archive';
  entityType: string;
  recordCount: number;
  sourceDescription?: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'rolled_back';
  errorMessage?: string;
  userId?: string;
  createdAt: Date;
}

/**
 * Record version summary for history display
 */
export interface RecordVersionSummary {
  id: string;
  version: number;
  isCurrent: boolean;
  validFrom: Date;
  validTo?: Date;
  amendmentType: AmendmentType;
  amendmentReason?: string;
}

/**
 * Helper function to check if a record is the current version
 */
export const isCurrentVersion = (record: Partial<ImmutableRecordFields>): boolean => {
  return record.isCurrent === true && record.isArchived !== true;
};

/**
 * Helper function to check if a record is archived
 */
export const isArchivedRecord = (record: Partial<ImmutableRecordFields>): boolean => {
  return record.isArchived === true;
};

/**
 * Helper function to check if a record has been superseded
 */
export const isSupersededRecord = (record: Partial<ImmutableRecordFields>): boolean => {
  return record.validTo !== undefined && record.validTo !== null;
};

// ============================================================================
// OUTCOME LOGGING TYPES
// Tracks why entities are removed/completed for analytics and insights
// ============================================================================

// Outcome categories for classification
export type OutcomeCategory = 'success' | 'failure' | 'neutral' | 'partial';

// Grow-specific outcome codes
export type GrowOutcomeCode =
  // Success outcomes
  | 'completed_success'        // Full cycle, good yield
  | 'completed_low_yield'      // Completed but below expectations
  | 'completed_excellent'      // Exceeded yield expectations
  // Failure outcomes
  | 'contamination_early'      // Days 1-7 (sterilization/technique)
  | 'contamination_mid'        // Days 8-21 (environmental)
  | 'contamination_late'       // Days 22+ (environmental/storage)
  | 'stalled_colonization'     // Never colonized properly
  | 'stalled_fruiting'         // Colonized but no pins
  | 'aborted_user'             // User chose to stop
  | 'aborted_environmental'    // Environmental failure (power, HVAC)
  | 'genetics_failure'         // Poor genetics/senescence
  // Neutral outcomes
  | 'experiment_ended'         // Research project concluded
  | 'transferred_out'          // Moved to another grow/user
  // Data correction outcomes (excluded from analytics)
  | 'aborted_bad_data'         // Data entry error, record invalid
  | 'aborted_restart';         // Starting over, discarding old data

// Culture-specific outcome codes
export type CultureOutcomeCode =
  // Success outcomes
  | 'exhausted_success'        // Used up all volume successfully
  | 'archived_healthy'         // Stored for future use
  // Failure outcomes
  | 'contamination_bacterial'  // Bacterial contamination
  | 'contamination_mold'       // Mold contamination
  | 'contamination_unknown'    // Unknown contamination
  | 'senescence'               // Genetics degraded
  | 'media_failure'            // Media issue (pH, drying, etc.)
  | 'storage_failure'          // Temperature/humidity failure
  // Neutral outcomes
  | 'expired_unused'           // Never used, past viability
  | 'discarded_cleanup'        // Lab cleanup
  | 'transferred_out'          // Given away/sold
  // Data correction outcomes (excluded from analytics)
  | 'aborted_bad_data'         // Data entry error, record invalid
  | 'aborted_restart';         // Starting over, discarding old data

// Inventory-specific outcome codes
export type InventoryOutcomeCode =
  | 'consumed_normal'          // Used as expected
  | 'expired_unused'           // Expired before use
  | 'damaged'                  // Physical damage
  | 'contaminated'             // Contamination issue
  | 'returned'                 // Returned to supplier
  | 'discarded_quality'        // Quality concerns
  // Data correction outcomes (excluded from analytics)
  | 'aborted_bad_data'         // Data entry error, record invalid
  | 'aborted_restart';         // Starting over, discarding old data

// Physical/general outcome codes (apply to containers, equipment, etc.)
export type PhysicalOutcomeCode =
  | 'exhausted_success'        // Used completely
  | 'archived_healthy'         // Stored/retired properly
  | 'contamination_unknown'    // Contaminated
  | 'storage_failure'          // Storage/malfunction issue
  | 'dropped_broken'           // Dropped or broken
  | 'seal_failure'             // Seal/lid failure (containers)
  | 'electrical_failure'       // Electrical failure (equipment)
  | 'discarded_cleanup'        // General disposal
  | 'transferred_out'          // Given away/sold
  | 'lost'                     // Cannot locate
  | 'returned'                 // Returned to supplier
  // Data correction outcomes (excluded from analytics)
  | 'aborted_bad_data';        // Data entry error, record invalid

// Generic outcome code union
export type OutcomeCode = GrowOutcomeCode | CultureOutcomeCode | InventoryOutcomeCode | PhysicalOutcomeCode;

// Contamination types for detailed tracking
export type ContaminationType =
  | 'trichoderma'
  | 'cobweb'
  | 'black_mold'
  | 'penicillium'
  | 'aspergillus'
  | 'bacterial'
  | 'lipstick'
  | 'wet_spot'
  | 'yeast'
  | 'unknown';

// Contamination stage (when detected)
export type ContaminationStage =
  | 'agar'
  | 'liquid_culture'
  | 'grain_spawn'
  | 'bulk_colonization'
  | 'fruiting'
  | 'storage';

// Suspected cause of contamination
export type SuspectedCause =
  | 'sterilization_failure'
  | 'inoculation_technique'
  | 'contaminated_source'
  | 'environmental'
  | 'substrate_issue'
  | 'equipment'
  | 'user_error'
  | 'unknown';

// Entity outcome record (universal for all entity types)
export interface EntityOutcome {
  id: string;
  entityType: 'grow' | 'culture' | 'container' | 'inventory_item' | 'inventory_lot' | 'equipment';
  entityId: string;
  entityName?: string;

  // Outcome classification
  outcomeCategory: OutcomeCategory;
  outcomeCode: OutcomeCode;
  outcomeLabel?: string;

  // Timing
  startedAt?: Date;
  endedAt: Date;
  durationDays?: number;

  // Financial
  totalCost?: number;
  totalRevenue?: number;
  costPerUnit?: number;

  // Yield (for grows)
  totalYieldWet?: number;
  totalYieldDry?: number;
  biologicalEfficiency?: number;
  flushCount?: number;

  // References
  strainId?: string;
  strainName?: string;
  speciesId?: string;
  speciesName?: string;
  locationId?: string;
  locationName?: string;

  // Survey data
  surveyResponses?: Record<string, unknown>;

  // Metadata
  notes?: string;
  createdAt: Date;
}

// Contamination details (linked to outcomes)
export interface ContaminationDetails {
  id: string;
  outcomeId: string;
  contaminationType?: ContaminationType;
  contaminationStage?: ContaminationStage;
  daysToDetection?: number;
  suspectedCause?: SuspectedCause;
  temperatureAtDetection?: number;
  humidityAtDetection?: number;
  images?: string[];
  notes?: string;
  createdAt: Date;
}

// Exit survey responses (entity-specific questions)
export interface ExitSurvey {
  id: string;
  outcomeId: string;
  entityType: string;

  // Universal questions
  baseResponses?: Record<string, unknown>;

  // Type-specific responses
  specificResponses?: Record<string, unknown>;

  // User experience ratings (1-5)
  overallSatisfaction?: number;
  difficultyRating?: number;
  wouldRepeat?: boolean;

  // Lessons learned
  whatWorked?: string;
  whatFailed?: string;
  wouldChange?: string;

  // Time tracking
  estimatedHoursSpent?: number;

  completedAt: Date;
}

// Outcome option for UI selection
export interface OutcomeOption {
  code: OutcomeCode;
  label: string;
  category: OutcomeCategory;
  description?: string;
  icon?: string;
}

// Grow outcome options for the UI
export const GROW_OUTCOME_OPTIONS: OutcomeOption[] = [
  // Success
  { code: 'completed_success', label: 'Success', category: 'success', description: 'Full cycle, good yield', icon: 'check_circle' },
  { code: 'completed_excellent', label: 'Excellent', category: 'success', description: 'Exceeded expectations', icon: 'star' },
  { code: 'completed_low_yield', label: 'Low Yield', category: 'partial', description: 'Completed but below expectations', icon: 'trending_down' },
  // Contamination
  { code: 'contamination_early', label: 'Early Contam', category: 'failure', description: 'Days 1-7 (sterilization/technique)', icon: 'warning' },
  { code: 'contamination_mid', label: 'Mid Contam', category: 'failure', description: 'Days 8-21 (environmental)', icon: 'warning' },
  { code: 'contamination_late', label: 'Late Contam', category: 'failure', description: 'Days 22+ (environmental/storage)', icon: 'warning' },
  // Other failures
  { code: 'stalled_colonization', label: 'Stalled Colonization', category: 'failure', description: 'Never colonized properly', icon: 'pause_circle' },
  { code: 'stalled_fruiting', label: 'Stalled Fruiting', category: 'failure', description: 'Colonized but no pins', icon: 'pause_circle' },
  { code: 'genetics_failure', label: 'Genetics Issue', category: 'failure', description: 'Poor genetics/senescence', icon: 'dna' },
  // Aborted
  { code: 'aborted_user', label: 'User Aborted', category: 'neutral', description: 'Chose to stop', icon: 'cancel' },
  { code: 'aborted_environmental', label: 'Environmental Failure', category: 'failure', description: 'Power, HVAC, etc.', icon: 'power_off' },
  // Neutral
  { code: 'experiment_ended', label: 'Experiment Ended', category: 'neutral', description: 'Research concluded', icon: 'science' },
  { code: 'transferred_out', label: 'Transferred', category: 'neutral', description: 'Moved elsewhere', icon: 'move_item' },
  // Data Correction (excluded from analytics)
  { code: 'aborted_bad_data', label: 'Bad Data Entry', category: 'neutral', description: 'Data entry error - record invalid', icon: 'error_outline' },
  { code: 'aborted_restart', label: 'Starting Over', category: 'neutral', description: 'Discarding to restart fresh', icon: 'restart_alt' },
];

// Culture outcome options for the UI
export const CULTURE_OUTCOME_OPTIONS: OutcomeOption[] = [
  // Success
  { code: 'exhausted_success', label: 'Fully Used', category: 'success', description: 'Used up all volume successfully', icon: 'check_circle' },
  { code: 'archived_healthy', label: 'Archived', category: 'success', description: 'Stored for future use', icon: 'archive' },
  // Contamination
  { code: 'contamination_bacterial', label: 'Bacterial Contam', category: 'failure', description: 'Bacterial contamination', icon: 'warning' },
  { code: 'contamination_mold', label: 'Mold Contam', category: 'failure', description: 'Mold contamination', icon: 'warning' },
  { code: 'contamination_unknown', label: 'Unknown Contam', category: 'failure', description: 'Unknown contamination', icon: 'warning' },
  // Other failures
  { code: 'senescence', label: 'Senescence', category: 'failure', description: 'Genetics degraded over time', icon: 'trending_down' },
  { code: 'media_failure', label: 'Media Failure', category: 'failure', description: 'pH, drying, or other media issue', icon: 'error' },
  { code: 'storage_failure', label: 'Storage Failure', category: 'failure', description: 'Temperature/humidity failure', icon: 'thermostat' },
  // Neutral
  { code: 'expired_unused', label: 'Expired Unused', category: 'neutral', description: 'Past viability date', icon: 'event_busy' },
  { code: 'discarded_cleanup', label: 'Lab Cleanup', category: 'neutral', description: 'General cleanup', icon: 'cleaning_services' },
  { code: 'transferred_out', label: 'Transferred', category: 'neutral', description: 'Given away or sold', icon: 'move_item' },
  // Data Correction (excluded from analytics)
  { code: 'aborted_bad_data', label: 'Bad Data Entry', category: 'neutral', description: 'Data entry error - record invalid', icon: 'error_outline' },
  { code: 'aborted_restart', label: 'Starting Over', category: 'neutral', description: 'Discarding to restart fresh', icon: 'restart_alt' },
];

// Contamination type options for the UI
export const CONTAMINATION_TYPE_OPTIONS: { code: ContaminationType; label: string; description?: string }[] = [
  { code: 'trichoderma', label: 'Trichoderma (Green Mold)', description: 'Green/yellow patches, very common' },
  { code: 'cobweb', label: 'Cobweb Mold', description: 'Gray, wispy, fast-spreading' },
  { code: 'black_mold', label: 'Black Mold', description: 'Dark black/green spots' },
  { code: 'penicillium', label: 'Penicillium (Blue-Green)', description: 'Blue-green with white border' },
  { code: 'aspergillus', label: 'Aspergillus', description: 'Various colors, powdery texture' },
  { code: 'bacterial', label: 'Bacterial', description: 'Wet, slimy, often smelly' },
  { code: 'lipstick', label: 'Lipstick Mold', description: 'Bright pink/red spots' },
  { code: 'wet_spot', label: 'Wet Spot (Bacillus)', description: 'Wet, sour-smelling areas in grain' },
  { code: 'yeast', label: 'Yeast', description: 'Creamy, pasty appearance' },
  { code: 'unknown', label: 'Unknown', description: 'Unable to identify' },
];

// Suspected cause options for the UI
export const SUSPECTED_CAUSE_OPTIONS: { code: SuspectedCause; label: string; description?: string }[] = [
  { code: 'sterilization_failure', label: 'Sterilization Failure', description: 'Incomplete sterilization of substrate/equipment' },
  { code: 'inoculation_technique', label: 'Inoculation Technique', description: 'Contamination during inoculation' },
  { code: 'contaminated_source', label: 'Contaminated Source', description: 'Source culture was already contaminated' },
  { code: 'environmental', label: 'Environmental', description: 'Air quality, dust, other grow contams' },
  { code: 'substrate_issue', label: 'Substrate Issue', description: 'Problem with substrate preparation' },
  { code: 'equipment', label: 'Equipment', description: 'Contaminated equipment or containers' },
  { code: 'user_error', label: 'User Error', description: 'Mistake in handling or technique' },
  { code: 'unknown', label: 'Unknown', description: 'Unable to determine cause' },
];

// Container outcome options for the UI
export const CONTAINER_OUTCOME_OPTIONS: OutcomeOption[] = [
  // Success
  { code: 'exhausted_success', label: 'Contents Used', category: 'success', description: 'Container emptied, contents used successfully', icon: 'check_circle' },
  { code: 'archived_healthy', label: 'Cleaned & Stored', category: 'success', description: 'Container cleaned and stored for reuse', icon: 'archive' },
  // Failures
  { code: 'contamination_unknown', label: 'Contaminated', category: 'failure', description: 'Container or contents were contaminated', icon: 'warning' },
  { code: 'storage_failure', label: 'Damaged', category: 'failure', description: 'Container broken, cracked, or damaged', icon: 'broken_image' },
  // Physical damage
  { code: 'dropped_broken', label: 'Dropped/Broken', category: 'failure', description: 'Accidentally dropped or broken', icon: 'broken_image' },
  { code: 'seal_failure', label: 'Seal Failed', category: 'failure', description: 'Lid or seal compromised', icon: 'error' },
  // Neutral
  { code: 'discarded_cleanup', label: 'Discarded', category: 'neutral', description: 'General cleanup or disposal', icon: 'delete' },
  { code: 'transferred_out', label: 'Given Away', category: 'neutral', description: 'Given to another cultivator', icon: 'move_item' },
  { code: 'lost', label: 'Lost', category: 'neutral', description: 'Cannot locate container', icon: 'help' },
  // Data Correction
  { code: 'aborted_bad_data', label: 'Bad Data Entry', category: 'neutral', description: 'Data entry error - record invalid', icon: 'error_outline' },
];

// Inventory item outcome options for the UI
export const INVENTORY_OUTCOME_OPTIONS: OutcomeOption[] = [
  // Success
  { code: 'exhausted_success', label: 'Fully Used', category: 'success', description: 'All inventory consumed in production', icon: 'check_circle' },
  { code: 'archived_healthy', label: 'Stored', category: 'success', description: 'Put in storage for future use', icon: 'archive' },
  // Failures
  { code: 'contamination_unknown', label: 'Contaminated', category: 'failure', description: 'Item contaminated or spoiled', icon: 'warning' },
  { code: 'storage_failure', label: 'Storage Failure', category: 'failure', description: 'Improper storage ruined item', icon: 'thermostat' },
  { code: 'dropped_broken', label: 'Dropped/Broken', category: 'failure', description: 'Accidentally dropped or broken', icon: 'broken_image' },
  // Neutral
  { code: 'expired_unused', label: 'Expired', category: 'neutral', description: 'Past expiration date', icon: 'event_busy' },
  { code: 'discarded_cleanup', label: 'Discarded', category: 'neutral', description: 'General cleanup or disposal', icon: 'delete' },
  { code: 'transferred_out', label: 'Given Away', category: 'neutral', description: 'Given or sold to someone else', icon: 'move_item' },
  { code: 'lost', label: 'Lost', category: 'neutral', description: 'Cannot locate item', icon: 'help' },
  { code: 'returned', label: 'Returned', category: 'neutral', description: 'Returned to supplier', icon: 'undo' },
  // Data Correction
  { code: 'aborted_bad_data', label: 'Bad Data Entry', category: 'neutral', description: 'Data entry error - record invalid', icon: 'error_outline' },
];

// Equipment outcome options for the UI
export const EQUIPMENT_OUTCOME_OPTIONS: OutcomeOption[] = [
  // Success
  { code: 'archived_healthy', label: 'Retired', category: 'success', description: 'Equipment retired after useful service', icon: 'archive' },
  { code: 'exhausted_success', label: 'Worn Out', category: 'success', description: 'Equipment used until end of life', icon: 'check_circle' },
  // Failures
  { code: 'storage_failure', label: 'Malfunction', category: 'failure', description: 'Equipment stopped working', icon: 'error' },
  { code: 'dropped_broken', label: 'Broken', category: 'failure', description: 'Physically broken or damaged', icon: 'broken_image' },
  { code: 'electrical_failure', label: 'Electrical Failure', category: 'failure', description: 'Electrical or power issue', icon: 'power_off' },
  // Neutral
  { code: 'discarded_cleanup', label: 'Disposed', category: 'neutral', description: 'Disposed of or recycled', icon: 'delete' },
  { code: 'transferred_out', label: 'Sold/Given Away', category: 'neutral', description: 'Sold or given to someone else', icon: 'move_item' },
  { code: 'lost', label: 'Lost', category: 'neutral', description: 'Cannot locate equipment', icon: 'help' },
  { code: 'returned', label: 'Returned', category: 'neutral', description: 'Returned to seller/manufacturer', icon: 'undo' },
  // Data Correction
  { code: 'aborted_bad_data', label: 'Bad Data Entry', category: 'neutral', description: 'Data entry error - record invalid', icon: 'error_outline' },
];

// Map entity types to their outcome options
export const ENTITY_OUTCOME_OPTIONS: Record<string, OutcomeOption[]> = {
  grow: GROW_OUTCOME_OPTIONS,
  culture: CULTURE_OUTCOME_OPTIONS,
  container: CONTAINER_OUTCOME_OPTIONS,
  inventory_item: INVENTORY_OUTCOME_OPTIONS,
  inventory_lot: INVENTORY_OUTCOME_OPTIONS,
  equipment: EQUIPMENT_OUTCOME_OPTIONS,
};

// Helper to get outcome options for an entity type
export const getOutcomeOptionsForEntity = (entityType: string): OutcomeOption[] => {
  return ENTITY_OUTCOME_OPTIONS[entityType] || CULTURE_OUTCOME_OPTIONS; // Default to culture options
};

export interface LookupHelpers {
  getSpecies: (id: string) => Species | undefined;
  getStrain: (id: string) => Strain | undefined;
  getLocation: (id: string) => Location | undefined;
  getLocationType: (id: string) => LocationType | undefined;
  getLocationClassification: (id: string) => LocationClassification | undefined;
  getContainer: (id: string) => Container | undefined;  // Unified: replaces getVessel and getContainerType
  getSubstrateType: (id: string) => SubstrateType | undefined;
  getSupplier: (id: string) => Supplier | undefined;
  getInventoryCategory: (id: string) => InventoryCategory | undefined;
  getRecipeCategory: (code: string) => RecipeCategoryItem | undefined;
  getGrainType: (id: string) => GrainType | undefined;
  getInventoryItem: (id: string) => InventoryItem | undefined;
  getInventoryLot: (id: string) => InventoryLot | undefined;
  getPurchaseOrder: (id: string) => PurchaseOrder | undefined;
  getCulture: (id: string) => Culture | undefined;
  getPreparedSpawn: (id: string) => PreparedSpawn | undefined;
  getGrow: (id: string) => Grow | undefined;
  getRecipe: (id: string) => Recipe | undefined;

  // Filtered lists (active only)
  activeSpecies: Species[];
  activeStrains: Strain[];
  activeLocations: Location[];
  activeLocationTypes: LocationType[];
  activeLocationClassifications: LocationClassification[];
  activeContainers: Container[];  // Unified: replaces activeVessels and activeContainerTypes
  activeSubstrateTypes: SubstrateType[];
  activeSuppliers: Supplier[];
  activeInventoryCategories: InventoryCategory[];
  activeRecipeCategories: RecipeCategoryItem[];
  activeGrainTypes: GrainType[];
  activeInventoryItems: InventoryItem[];
  activeInventoryLots: InventoryLot[];
  activePurchaseOrders: PurchaseOrder[];
  activeRecipes: Recipe[];
  availablePreparedSpawn: PreparedSpawn[];  // PreparedSpawn with status='available'
}

// ============================================================================
// DATA OWNERSHIP UTILITIES
// Helper types and functions for determining data ownership/editability
// ============================================================================

/**
 * Items that can have user ownership (userId field)
 * - userId === null: System/global data (provided by MycoLab, not editable)
 * - userId === string: User-created data (editable by that user)
 */
export interface OwnableItem {
  userId?: string | null;
}

/**
 * Check if an item is system/global data (not editable by regular users)
 * System data has userId === null or userId === undefined
 */
export const isSystemData = (item: OwnableItem | null | undefined): boolean => {
  if (!item) return false;
  return item.userId === null || item.userId === undefined;
};

/**
 * Check if an item is user-created data (editable by the owner)
 * User data has a non-null userId
 */
export const isUserData = (item: OwnableItem | null | undefined): boolean => {
  if (!item) return false;
  return item.userId !== null && item.userId !== undefined;
};

/**
 * Check if the current user can edit an item
 * @param item The item to check
 * @param currentUserId The current user's ID
 * @param isAdmin Whether the current user is an admin
 */
export const canEditItem = (
  item: OwnableItem | null | undefined,
  currentUserId: string | null | undefined,
  isAdmin: boolean
): boolean => {
  if (!item) return false;

  // Admins can edit anything
  if (isAdmin) return true;

  // System data cannot be edited by non-admins
  if (isSystemData(item)) return false;

  // User can edit their own data
  return item.userId === currentUserId;
};

/**
 * Check if the current user can delete an item
 * Same rules as editing
 */
export const canDeleteItem = canEditItem;
