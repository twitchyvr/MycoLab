// ============================================================================
// MYCOLAB - Comprehensive Mycology Laboratory Management System
// Type Definitions
// ============================================================================

// ----------------------------------------------------------------------------
// BASE TYPES & UTILITIES
// ----------------------------------------------------------------------------

export type UUID = string;
export type ISODateString = string;
export type Currency = number; // Stored in cents for precision

export interface Timestamped {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface SoftDeletable {
  deletedAt?: ISODateString;
  isActive: boolean;
}

export interface Auditable extends Timestamped {
  createdBy?: UUID;
  updatedBy?: UUID;
}

// Base interface for all lookup tables - allows adding/removing without breaking history
export interface LookupItem extends Timestamped, SoftDeletable {
  id: UUID;
  name: string;
  description?: string;
  sortOrder: number;
  color?: string; // For visual identification
  icon?: string;  // Icon identifier
}

// ----------------------------------------------------------------------------
// LOOKUP TABLES (User-Configurable)
// ----------------------------------------------------------------------------

export interface Strain extends LookupItem {
  species: string;              // e.g., "Psilocybe cubensis", "Pleurotus ostreatus"
  commonName?: string;          // e.g., "Golden Teacher", "Blue Oyster"
  characteristics?: string;     // Growth characteristics, potency notes, etc.
  avgColonizationDays?: number;
  avgFruitingDays?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: 'gourmet' | 'medicinal' | 'research' | 'ornamental';
  imageUrl?: string;
}

export interface Vendor extends LookupItem {
  website?: string;
  email?: string;
  phone?: string;
  notes?: string;
  rating?: number; // 1-5
  tags: string[];
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

export interface Location extends LookupItem {
  // Legacy type fields (for backwards compatibility)
  locationType?: 'room' | 'shelf' | 'refrigerator' | 'freezer' | 'incubator' | 'fruiting_chamber' | 'storage' | 'rack' | 'slot' | 'pasteurization' | 'inoculation' | 'colonization' | 'grow' | 'cold_room' | 'other';
  processStep?: 'pasteurization' | 'inoculation' | 'colonization' | 'fruiting' | 'storage' | 'shipping';
  parentLocationId?: UUID; // Legacy field

  // Environmental ranges
  temperatureRange?: { min: number; max: number }; // Celsius (legacy name)
  tempRange?: { min: number; max: number }; // Celsius (new name)
  humidityRange?: { min: number; max: number };    // Percentage
  co2Range?: { min: number; max: number };         // PPM

  // Capacity tracking
  capacity?: number;
  currentOccupancy?: number;

  // Additional attributes
  isBio?: boolean;  // For organic/BIO certification tracking

  // Hierarchical location support for farm/lab mapping
  parentId?: UUID;             // Parent location ID for hierarchy
  level?: LocationLevel;       // Hierarchy level (facility > room > zone > rack > shelf > slot)
  roomPurpose?: RoomPurpose;   // @deprecated Use roomPurposes instead - kept for backwards compatibility
  roomPurposes?: RoomPurpose[]; // Multiple purposes for multi-use rooms (e.g., colonization + fruiting)
  // sortOrder inherited from LookupItem - Display order among siblings
  path?: string;               // Full path like "Facility/Room A/Rack 1/Shelf 2"
  code?: string;               // Short code for labeling (e.g., "R1-S2-A")
  dimensions?: {               // Physical dimensions
    length?: number;
    width?: number;
    height?: number;
    unit?: 'cm' | 'in' | 'm' | 'ft';
  };
}

// Environmental reading for room metrics history
export interface EnvironmentalReading extends Timestamped {
  id: UUID;
  locationId: UUID;
  temperatureCelsius?: number;
  humidityPercent?: number;
  co2Ppm?: number;
  notes?: string;
  recordedBy?: string;
}

// Daily check types
export interface DailyCheck extends Timestamped {
  id: UUID;
  locationId: UUID;
  location?: Location;
  checkDate: ISODateString;
  checkType: 'growing_room' | 'cool_room' | 'general';
  
  // Growing room specific
  estimatedHarvest7Day?: number; // grams
  harvestForecast?: HarvestForecastDay[];
  needsAttention: boolean;
  attentionReason?: string;
  flagForRecheck: boolean;
  needsHarvestAssistance: boolean;
  
  // Cool room specific
  inventoryCount?: number;
  stockLevels?: Record<string, number>;
  
  // General
  notes?: string;
  photos?: string[];
  checkedBy?: string;
}

export interface HarvestForecastDay {
  date: ISODateString;
  estimatedWeightGrams: number;
  pickersNeeded?: number;
  confidence: 'low' | 'medium' | 'high';
}

// Room status for growing cycle planning
export interface RoomStatus extends Timestamped {
  id: UUID;
  locationId: UUID;
  location?: Location;
  status: 'empty' | 'filling' | 'colonizing' | 'pinning' | 'fruiting' | 'harvesting' | 'resting' | 'cleaning';
  strainIds: UUID[];
  blockCount: number;
  estimatedReadyDate?: ISODateString;
  lastHarvestDate?: ISODateString;
  totalYieldGrams?: number;
  notes?: string;
}

// Unified Container type (replaces separate VesselType and ContainerType)
export type ContainerCategory =
  | 'jar' | 'bag' | 'plate' | 'tube' | 'bottle' | 'syringe'   // Culture containers
  | 'tub' | 'bucket' | 'bed' | 'other';                        // Grow containers

export type ContainerUsageContext = 'culture' | 'grow';

export interface Container extends LookupItem {
  category: ContainerCategory;
  volumeMl?: number;                         // Volume in milliliters (unified unit)
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit?: 'cm' | 'in';
  };
  material?: string;
  reusable: boolean;
  sterile?: boolean;
  usageContext: ContainerUsageContext[];     // Whether for culture, grow, or both
  unitCost?: Currency;
}

/** @deprecated Use Container instead */
export type VesselType = Container;

export interface Ingredient extends LookupItem {
  ingredientCategory: 'grain' | 'substrate' | 'supplement' | 'agar' | 'liquid_culture' | 'chemical' | 'other';
  unit: 'g' | 'kg' | 'ml' | 'l' | 'oz' | 'lb' | 'each' | 'tbsp' | 'tsp' | 'cup';
  costPerUnit: Currency;
  vendorId?: UUID;
  vendor?: Vendor;
  shelfLifeDays?: number;
  storageRequirements?: string;
  inStock: boolean;
  currentQuantity?: number;
  reorderThreshold?: number;
  notes?: string;
}

export interface Tool extends LookupItem {
  toolCategory: 'sterilization' | 'inoculation' | 'measurement' | 'preparation' | 'storage' | 'safety' | 'monitoring' | 'other';
  purchaseDate?: ISODateString;
  purchasePrice?: Currency;
  vendorId?: UUID;
  vendor?: Vendor;
  maintenanceSchedule?: string;
  lastMaintenanceDate?: ISODateString;
  notes?: string;
}

export interface Procedure extends LookupItem {
  procedureCategory: 'sterilization' | 'inoculation' | 'transfer' | 'harvest' | 'preparation' | 'monitoring' | 'maintenance' | 'other';
  steps: ProcedureStep[];
  estimatedDurationMinutes?: number;
  requiredTools: UUID[]; // Tool IDs
  requiredIngredients: UUID[]; // Ingredient IDs
  safetyNotes?: string;
  tips?: string;
  videoUrl?: string;
  documentUrl?: string;
}

export interface ProcedureStep {
  order: number;
  instruction: string;
  durationMinutes?: number;
  notes?: string;
  imageUrl?: string;
}

// ----------------------------------------------------------------------------
// CULTURE TYPES & INOCULANTS
// ----------------------------------------------------------------------------

export type CultureType = 'spore_syringe' | 'spore_print' | 'liquid_culture' | 'agar_plate' | 'agar_slant' | 'grain_spawn' | 'sawdust_spawn' | 'plug_spawn' | 'clone' | 'other';

export interface Culture extends Auditable, SoftDeletable {
  id: UUID;
  
  // Identification
  label: string;            // User-assigned ID like "LC-001" or "AG-2024-001"
  nickname?: string;        // Optional friendly name
  
  // Strain & Source
  strainId: UUID;
  strain?: Strain;
  vendorId?: UUID;
  vendor?: Vendor;
  sourceType: 'purchased' | 'isolated' | 'cloned' | 'crossed' | 'gifted' | 'wild';
  
  // Lineage
  parentCultureIds: UUID[]; // For tracking genetics - can have multiple parents for crosses
  parentCultures?: Culture[];
  generation: number;       // G0 = original, G1 = first transfer, etc.
  
  // Physical Properties
  cultureType: CultureType;
  containerId: UUID;
  container?: Container;
  volumeMl?: number;        // Container's total capacity
  fillVolumeMl?: number;    // Actual amount of media in container
  
  // Recipe/Media
  recipeId?: UUID;          // Link to recipe used for this culture's media
  recipe?: Recipe;          // The recipe object (LC recipe, agar recipe, etc.)
  
  // Location & Storage
  locationId?: UUID;
  location?: Location;
  containerLabel?: string;  // Physical label on container
  
  // Dates & Timeline
  acquisitionDate: ISODateString;
  inoculationDate?: ISODateString;
  prepDate?: ISODateString;         // When the media was prepared
  sterilizationDate?: ISODateString; // When container was sterilized
  expirationDate?: ISODateString;
  
  // Environmental
  storageTemperature?: number;
  
  // Status & Health
  status: 'active' | 'colonizing' | 'ready' | 'contaminated' | 'expired' | 'depleted' | 'archived';
  healthRating?: number; // 1-5
  contaminationType?: string;
  
  // Cost & Tracking
  purchaseCost?: Currency;
  productionCost?: Currency;
  
  // Media
  images: CultureImage[];
  notes?: string;
  
  // Linked Items
  logs: CultureLog[];
  childCultures?: Culture[];
}

export interface CultureImage {
  id: UUID;
  url: string;
  caption?: string;
  takenAt: ISODateString;
  uploadedAt: ISODateString;
}

export interface CultureLog extends Timestamped {
  id: UUID;
  cultureId: UUID;
  logType: 'observation' | 'transfer' | 'contamination' | 'location_change' | 'status_change' | 'note' | 'procedure';
  title: string;
  description?: string;
  procedureId?: UUID;
  procedure?: Procedure;
  previousStatus?: Culture['status'];
  newStatus?: Culture['status'];
  previousLocationId?: UUID;
  newLocationId?: UUID;
  imageUrls?: string[];
  metadata?: Record<string, unknown>;
}

// ----------------------------------------------------------------------------
// GROW TRACKING
// ----------------------------------------------------------------------------

export type GrowPurpose = 'fruiting' | 'stock_preparation' | 'experiment' | 'educational' | 'production';

export type GrowStage = 
  | 'planning'
  | 'spawn_colonization'
  | 'bulk_colonization'  
  | 'pinning'
  | 'maturation'
  | 'harvesting'
  | 'subsequent_flush'
  | 'completed'
  | 'failed'
  | 'abandoned';

export interface Grow extends Auditable, SoftDeletable {
  id: UUID;
  
  // Identification
  label: string;            // e.g., "GROW-2024-001"
  name: string;             // Descriptive name
  
  // Purpose & Type
  purpose: GrowPurpose;
  
  // Genetics
  strainId: UUID;
  strain?: Strain;
  sourceCultureId: UUID;
  sourceCulture?: Culture;
  
  // Current Status
  currentStage: GrowStage;
  stageStartDate: ISODateString;
  expectedStageEndDate?: ISODateString;
  
  // Spawn Colonization Stage
  spawnColonization?: SpawnColonizationData;
  
  // Bulk Colonization Stage
  bulkColonization?: BulkColonizationData;
  
  // Fruiting Stage
  fruiting?: FruitingData;
  
  // Location
  locationId?: UUID;
  location?: Location;
  
  // Environment
  targetTemperature?: number;
  actualTemperatureReadings?: TemperatureReading[];
  
  // Yields & Results
  harvests: Harvest[];
  totalYieldGrams?: number;
  biologicalEfficiency?: number; // Percentage
  
  // Cost Tracking
  totalCost?: Currency;
  costBreakdown?: CostItem[];
  
  // Media & Documentation
  images: GrowImage[];
  logs: GrowLog[];
  notes?: string;
  
  // Dates
  startDate: ISODateString;
  endDate?: ISODateString;
  
  // Rating & Analysis
  successRating?: number; // 1-5
  lessonsLearned?: string;
  wouldRepeat?: boolean;
}

export interface SpawnColonizationData {
  startDate: ISODateString;
  endDate?: ISODateString;
  inoculantType: CultureType;
  inoculantCultureId: UUID;
  spawnMediumType: string; // grain type, etc.
  spawnIngredients: RecipeIngredient[];
  spawnContainerId: UUID;  // Unified: was spawnVesselTypeId
  spawnQuantity: number;
  spawnWeightGrams: number;
  colonizationPercentage: number;
  targetTemperature: number;
  actualTemperatureReadings?: TemperatureReading[];
  shakeDate?: ISODateString;
  notes?: string;
}

export interface BulkColonizationData {
  startDate: ISODateString;
  endDate?: ISODateString;
  spawnToSubstrateRatio: string; // e.g., "1:2", "1:4"
  substrateType: string;
  substrateIngredients: RecipeIngredient[];
  substrateWeightGrams: number;
  containerId: UUID;
  surfaceConditions: string;
  colonizationPercentage: number;
  targetTemperature: number;
  actualTemperatureReadings?: TemperatureReading[];
  notes?: string;
}

export interface FruitingData {
  startDate: ISODateString;
  firstPinsDate?: ISODateString;
  surfaceConditions: string;
  targetTemperature: number;
  targetHumidity: number;
  lightSchedule?: string;
  faeSchedule?: string; // Fresh Air Exchange
  actualTemperatureReadings?: TemperatureReading[];
  actualHumidityReadings?: HumidityReading[];
  notes?: string;
}

export interface TemperatureReading {
  timestamp: ISODateString;
  valueCelsius: number;
}

export interface HumidityReading {
  timestamp: ISODateString;
  valuePercent: number;
}

export interface Harvest {
  id: UUID;
  growId: UUID;
  flushNumber: number;
  harvestDate: ISODateString;
  wetWeightGrams: number;
  dryWeightGrams?: number;
  qualityRating?: number; // 1-5
  notes?: string;
  imageUrls?: string[];
}

export interface GrowImage {
  id: UUID;
  url: string;
  caption?: string;
  stage: GrowStage;
  takenAt: ISODateString;
  uploadedAt: ISODateString;
}

export interface GrowLog extends Timestamped {
  id: UUID;
  growId: UUID;
  stage: GrowStage;
  logType: 'observation' | 'action' | 'measurement' | 'issue' | 'harvest' | 'stage_change' | 'note';
  title: string;
  description?: string;
  procedureId?: UUID;
  imageUrls?: string[];
  metadata?: Record<string, unknown>;
}

// ----------------------------------------------------------------------------
// RECIPES & COST TRACKING
// ----------------------------------------------------------------------------

export interface Recipe extends Auditable, SoftDeletable {
  id: UUID;
  name: string;
  description?: string;
  recipeCategory: 'agar' | 'liquid_culture' | 'grain_spawn' | 'substrate' | 'supplement' | 'other';
  ingredients: RecipeIngredient[];
  instructions?: string;
  instructionsRichText?: string; // Rich text with formatting, tables
  yieldDescription?: string;
  yieldQuantity?: number;
  yieldUnit?: string;
  estimatedCost?: Currency;
  notes?: string;
  tags: string[];
  
  // Substrate-specific fields
  targetMoisturePercent?: number;
  fieldCapacity?: boolean;
  pasteurizationMethod?: 'cold' | 'hot' | 'pressure' | 'lime';
  pasteurizationTemp?: number;
  pasteurizationDuration?: number; // minutes
}

export interface RecipeIngredient {
  ingredientId: UUID;
  ingredient?: Ingredient;
  quantity: number;
  unit: Ingredient['unit'];
  notes?: string;
}

// Substrate Calculator Types
export type SubstrateCalcMode = 
  | 'dry_to_total'      // Enter dry weight + water % → get total
  | 'total_to_dry'      // Enter total + water % → get dry/water weights
  | 'weights_to_percent'// Enter water + dry → get %
  | 'total_dry_to_percent'; // Enter total + dry → get water %

export interface SubstrateCalculation {
  mode: SubstrateCalcMode;
  dryWeightGrams?: number;
  waterWeightGrams?: number;
  totalWeightGrams?: number;
  moisturePercent?: number;
  // Results
  calculatedDryWeight?: number;
  calculatedWaterWeight?: number;
  calculatedTotalWeight?: number;
  calculatedMoisturePercent?: number;
}

// QR Label Types
export interface QRLabel extends Timestamped {
  id: UUID;
  labelType: 'culture' | 'grow' | 'location' | 'vessel' | 'inventory';
  linkedItemId: UUID;
  linkedItemType: string;
  qrCodeData: string; // Encoded URL or ID
  labelText?: string;
  labelSize: 'small' | 'medium' | 'large';
  printedAt?: ISODateString;
  printCount: number;
}

export interface LabelTemplate {
  id: UUID;
  name: string;
  labelType: QRLabel['labelType'];
  width: number; // mm
  height: number; // mm
  showQR: boolean;
  showText: boolean;
  showDate: boolean;
  showStrain: boolean;
  fontSize: number;
  customFields: string[];
}

// Photo/Media Types
export interface MediaItem extends Timestamped {
  id: UUID;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  caption?: string;
  tags?: string[];
  
  // Linkage
  linkedItemType: 'culture' | 'grow' | 'location' | 'procedure' | 'recipe' | 'observation';
  linkedItemId: UUID;
  stage?: GrowStage;
  
  // Metadata
  takenAt?: ISODateString;
  gpsLatitude?: number;
  gpsLongitude?: number;
  deviceInfo?: string;
}

export interface CostItem {
  id: UUID;
  category: 'ingredient' | 'vessel' | 'tool' | 'energy' | 'labor' | 'other';
  description: string;
  quantity: number;
  unitCost: Currency;
  totalCost: Currency;
  linkedItemId?: UUID;
  linkedItemType?: 'ingredient' | 'vessel' | 'tool';
  notes?: string;
}

// ----------------------------------------------------------------------------
// INVENTORY & STOCK
// ----------------------------------------------------------------------------

export interface InventoryItem extends Auditable {
  id: UUID;
  itemType: 'ingredient' | 'vessel' | 'tool' | 'culture' | 'other';
  linkedItemId: UUID; // Reference to the specific item type
  quantity: number;
  unit: string;
  locationId?: UUID;
  location?: Location;
  purchaseDate?: ISODateString;
  expirationDate?: ISODateString;
  batchNumber?: string;
  vendorId?: UUID;
  vendor?: Vendor;
  purchaseCost?: Currency;
  notes?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired' | 'reserved';
}

export interface Wishlist extends Auditable {
  id: UUID;
  itemType: 'ingredient' | 'vessel' | 'tool' | 'strain' | 'other';
  name: string;
  description?: string;
  estimatedCost?: Currency;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  vendorId?: UUID;
  vendor?: Vendor;
  productUrl?: string;
  notes?: string;
  status: 'wanted' | 'ordered' | 'acquired' | 'cancelled';
}

export interface IdeaBucket extends Auditable {
  id: UUID;
  title: string;
  description?: string;
  category: 'experiment' | 'technique' | 'equipment' | 'strain' | 'recipe' | 'other';
  relatedItemIds?: UUID[];
  priority: 'low' | 'medium' | 'high';
  status: 'idea' | 'researching' | 'planned' | 'in_progress' | 'completed' | 'abandoned';
  notes?: string;
  links?: string[];
}

// ----------------------------------------------------------------------------
// NOTIFICATIONS & REMINDERS
// ----------------------------------------------------------------------------

export type NotificationType = 
  | 'culture_expiring'
  | 'culture_needs_transfer'
  | 'grow_stage_check'
  | 'grow_stage_transition'
  | 'harvest_ready'
  | 'inventory_low'
  | 'inventory_expired'
  | 'maintenance_due'
  | 'custom';

export interface Notification extends Timestamped {
  id: UUID;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  linkedItemType?: 'culture' | 'grow' | 'inventory' | 'tool';
  linkedItemId?: UUID;
  dueDate?: ISODateString;
  dismissedAt?: ISODateString;
  completedAt?: ISODateString;
  status: 'pending' | 'dismissed' | 'completed' | 'snoozed';
  snoozeUntil?: ISODateString;
}

export interface NotificationRule extends Auditable, SoftDeletable {
  id: UUID;
  name: string;
  description?: string;
  triggerType: NotificationType;
  conditions: NotificationCondition[];
  daysBeforeDue?: number; // For advance warnings
  isEnabled: boolean;
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'days_until' | 'days_since';
  value: string | number;
}

// ----------------------------------------------------------------------------
// DEV LOG / FEATURE TRACKING
// ----------------------------------------------------------------------------

export type FeatureStatus = 'backlog' | 'planned' | 'in_progress' | 'testing' | 'completed' | 'blocked' | 'cancelled';
export type FeaturePriority = 'critical' | 'high' | 'medium' | 'low' | 'nice_to_have';

export interface DevLogFeature extends Timestamped {
  id: UUID;
  title: string;
  description?: string;
  category: 'core' | 'ui' | 'ux' | 'data' | 'integration' | 'optimization' | 'bug_fix' | 'enhancement' | 'security' | 'feature';
  status: FeatureStatus;
  priority: FeaturePriority;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: UUID[];
  blockedBy?: string;
  notes?: string;
  completedAt?: ISODateString;
}

// ----------------------------------------------------------------------------
// APPLICATION STATE
// ----------------------------------------------------------------------------

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  defaultCultureLabelPrefix: string;
  defaultGrowLabelPrefix: string;
  temperatureUnit: 'celsius' | 'fahrenheit';
  currencyCode: string;
  dateFormat: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
}

export interface AppState {
  // Core entities
  cultures: Culture[];
  grows: Grow[];
  
  // Lookup tables
  strains: Strain[];
  vendors: Vendor[];
  locations: Location[];
  containers: Container[];
  ingredients: Ingredient[];
  tools: Tool[];
  procedures: Procedure[];
  
  // Recipes & formulas
  recipes: Recipe[];
  labelTemplates: LabelTemplate[];
  
  // Inventory & tracking
  inventory: InventoryItem[];
  wishlist: Wishlist[];
  ideas: IdeaBucket[];
  
  // Environmental & daily ops
  environmentalReadings: EnvironmentalReading[];
  dailyChecks: DailyCheck[];
  roomStatuses: RoomStatus[];
  
  // Media
  media: MediaItem[];
  qrLabels: QRLabel[];
  
  // Notifications
  notifications: Notification[];
  notificationRules: NotificationRule[];
  
  // Dev & preferences
  devLog: DevLogFeature[];
  preferences: UserPreferences;
}

// ----------------------------------------------------------------------------
// API TYPES
// ----------------------------------------------------------------------------

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterOptions {
  search?: string;
  status?: string[];
  strainId?: UUID;
  locationId?: UUID;
  dateFrom?: ISODateString;
  dateTo?: ISODateString;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
