// ============================================================================
// DATA TRANSFORMATION UTILITIES
// Transform between database format (snake_case) and app format (camelCase)
// Extracted from DataContext.tsx for better maintainability
// ============================================================================

import {
  Species,
  Strain,
  Location,
  LocationType,
  LocationClassification,
  Container,
  SubstrateType,
  Supplier,
  InventoryCategory,
  InventoryLot,
  PurchaseOrder,
  Culture,
  Grow,
  Recipe,
  Flush,
  RecipeCategoryItem,
  GrainType,
} from './types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Filter out default IDs (not valid UUIDs for DB)
 */
export const toDbId = (id: string | undefined): string | null => {
  if (!id || id.startsWith('default-')) return null;
  return id;
};

// ============================================================================
// STRAIN TRANSFORMATIONS
// ============================================================================

export const transformStrainFromDb = (row: any): Strain => ({
  id: row.id,
  name: row.name,
  speciesId: row.species_id,
  species: row.species || '',
  // Variety/Phenotype tracking
  variety: row.variety,
  phenotype: row.phenotype,
  geneticsSource: row.genetics_source,
  isolationType: row.isolation_type,
  generation: row.generation,
  // Growing characteristics
  difficulty: row.difficulty || 'intermediate',
  colonizationDays: {
    min: row.colonization_days_min || 14,
    max: row.colonization_days_max || 21
  },
  fruitingDays: {
    min: row.fruiting_days_min || 7,
    max: row.fruiting_days_max || 14
  },
  optimalTempColonization: {
    min: row.optimal_temp_colonization || 24,
    max: row.optimal_temp_colonization || 27
  },
  optimalTempFruiting: {
    min: row.optimal_temp_fruiting || 20,
    max: row.optimal_temp_fruiting || 24
  },
  // Additional metadata
  origin: row.origin,
  description: row.description,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

export const transformStrainToDb = (strain: Partial<Strain>, userId?: string | null) => ({
  name: strain.name,
  species_id: strain.speciesId,
  species: strain.species,
  // Variety/Phenotype tracking
  variety: strain.variety,
  phenotype: strain.phenotype,
  genetics_source: strain.geneticsSource,
  isolation_type: strain.isolationType,
  generation: strain.generation,
  // Growing characteristics
  difficulty: strain.difficulty,
  colonization_days_min: strain.colonizationDays?.min,
  colonization_days_max: strain.colonizationDays?.max,
  fruiting_days_min: strain.fruitingDays?.min,
  fruiting_days_max: strain.fruitingDays?.max,
  optimal_temp_colonization: strain.optimalTempColonization?.min,
  optimal_temp_fruiting: strain.optimalTempFruiting?.min,
  // Additional metadata
  origin: strain.origin,
  description: strain.description,
  notes: strain.notes,
  is_active: strain.isActive,
  ...(userId && { user_id: userId }),
});

// ============================================================================
// LOCATION TYPE TRANSFORMATIONS
// ============================================================================

export const transformLocationTypeFromDb = (row: any): LocationType => ({
  id: row.id,
  name: row.name,
  code: row.code || row.name?.toLowerCase().replace(/\s+/g, '_'),
  description: row.description,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

export const transformLocationTypeToDb = (lt: Partial<LocationType>, userId?: string | null) => ({
  name: lt.name,
  code: lt.code,
  description: lt.description,
  notes: lt.notes,
  is_active: lt.isActive,
  ...(userId && { user_id: userId }),
});

// ============================================================================
// LOCATION CLASSIFICATION TRANSFORMATIONS
// ============================================================================

export const transformLocationClassificationFromDb = (row: any): LocationClassification => ({
  id: row.id,
  name: row.name,
  code: row.code || row.name?.toLowerCase().replace(/\s+/g, '_'),
  description: row.description,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

export const transformLocationClassificationToDb = (lc: Partial<LocationClassification>, userId?: string | null) => ({
  name: lc.name,
  code: lc.code,
  description: lc.description,
  notes: lc.notes,
  is_active: lc.isActive,
  ...(userId && { user_id: userId }),
});

// ============================================================================
// LOCATION TRANSFORMATIONS
// ============================================================================

export const transformLocationFromDb = (row: any): Location => ({
  id: row.id,
  name: row.name,
  type: row.type || undefined,
  typeId: row.type_id,
  classificationId: row.classification_id,
  tempRange: row.temp_min || row.temp_max ? { min: row.temp_min, max: row.temp_max } : undefined,
  humidityRange: row.humidity_min || row.humidity_max ? { min: row.humidity_min, max: row.humidity_max } : undefined,
  hasPower: row.has_power,
  powerUsage: row.power_usage,
  hasAirCirculation: row.has_air_circulation,
  size: row.size,
  supplierId: row.supplier_id,
  cost: row.cost ? parseFloat(row.cost) : undefined,
  procurementDate: row.procurement_date ? new Date(row.procurement_date) : undefined,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

export const transformLocationToDb = (location: Partial<Location>, userId?: string | null) => ({
  name: location.name,
  type: location.type,
  type_id: toDbId(location.typeId),
  classification_id: toDbId(location.classificationId),
  temp_min: location.tempRange?.min,
  temp_max: location.tempRange?.max,
  humidity_min: location.humidityRange?.min,
  humidity_max: location.humidityRange?.max,
  has_power: location.hasPower,
  power_usage: location.powerUsage,
  has_air_circulation: location.hasAirCirculation,
  size: location.size,
  supplier_id: toDbId(location.supplierId),
  cost: location.cost,
  procurement_date: location.procurementDate?.toISOString(),
  notes: location.notes,
  is_active: location.isActive,
  ...(userId && { user_id: userId }),
});

// ============================================================================
// CONTAINER TRANSFORMATIONS (Unified - replaces Vessel and ContainerType)
// ============================================================================

export const transformContainerFromDb = (row: any): Container => ({
  id: row.id,
  name: row.name,
  category: row.category || 'jar',
  volumeMl: row.volume_ml,
  dimensions: row.dimension_length || row.dimension_width || row.dimension_height
    ? {
        length: row.dimension_length ? parseFloat(row.dimension_length) : 0,
        width: row.dimension_width ? parseFloat(row.dimension_width) : 0,
        height: row.dimension_height ? parseFloat(row.dimension_height) : 0,
        unit: row.dimension_unit || 'cm',
      }
    : undefined,
  isReusable: row.is_reusable ?? true,
  usageContext: row.usage_context || ['culture', 'grow'],
  notes: row.notes,
  isActive: row.is_active ?? true,
});

export const transformContainerToDb = (container: Partial<Container>, userId?: string | null) => ({
  name: container.name,
  category: container.category,
  volume_ml: container.volumeMl,
  dimension_length: container.dimensions?.length,
  dimension_width: container.dimensions?.width,
  dimension_height: container.dimensions?.height,
  dimension_unit: container.dimensions?.unit || 'cm',
  is_reusable: container.isReusable,
  usage_context: container.usageContext,
  notes: container.notes,
  is_active: container.isActive,
  ...(userId && { user_id: userId }),
});

// Legacy transformation aliases for backward compatibility
/** @deprecated Use transformContainerFromDb instead */
export const transformVesselFromDb = transformContainerFromDb;
/** @deprecated Use transformContainerToDb instead */
export const transformVesselToDb = transformContainerToDb;
/** @deprecated Use transformContainerFromDb instead */
export const transformContainerTypeFromDb = transformContainerFromDb;
/** @deprecated Use transformContainerToDb instead */
export const transformContainerTypeToDb = transformContainerToDb;

// ============================================================================
// SUBSTRATE TYPE TRANSFORMATIONS
// ============================================================================

export const transformSubstrateTypeFromDb = (row: any): SubstrateType => ({
  id: row.id,
  name: row.name,
  code: row.code || row.name?.toLowerCase().replace(/\s+/g, '_'),
  category: row.category || 'bulk',
  spawnRateRange: {
    min: row.spawn_rate_min || 10,
    optimal: row.spawn_rate_optimal || 20,
    max: row.spawn_rate_max || 30,
  },
  fieldCapacity: row.field_capacity,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

export const transformSubstrateTypeToDb = (st: Partial<SubstrateType>, userId?: string | null) => ({
  name: st.name,
  code: st.code,
  category: st.category,
  spawn_rate_min: st.spawnRateRange?.min,
  spawn_rate_optimal: st.spawnRateRange?.optimal,
  spawn_rate_max: st.spawnRateRange?.max,
  field_capacity: st.fieldCapacity,
  notes: st.notes,
  is_active: st.isActive,
  ...(userId && { user_id: userId }),
});

// ============================================================================
// INVENTORY CATEGORY TRANSFORMATIONS
// ============================================================================

export const transformInventoryCategoryFromDb = (row: any): InventoryCategory => ({
  id: row.id,
  name: row.name,
  color: row.color || '#6b7280',
  icon: row.icon,
  isActive: row.is_active ?? true,
});

export const transformInventoryCategoryToDb = (cat: Partial<InventoryCategory>, userId?: string | null) => ({
  name: cat.name,
  color: cat.color,
  icon: cat.icon,
  is_active: cat.isActive,
  ...(userId && { user_id: userId }),
});

// ============================================================================
// RECIPE CATEGORY TRANSFORMATIONS
// ============================================================================

export const transformRecipeCategoryFromDb = (row: any): RecipeCategoryItem => ({
  id: row.id,
  name: row.name,
  code: row.code,
  icon: row.icon || '📦',
  color: row.color || 'text-zinc-400 bg-zinc-800',
  isActive: row.is_active ?? true,
});

export const transformRecipeCategoryToDb = (cat: Partial<RecipeCategoryItem>, userId?: string | null) => ({
  name: cat.name,
  code: cat.code,
  icon: cat.icon,
  color: cat.color,
  is_active: cat.isActive,
  ...(userId && { user_id: userId }),
});

// ============================================================================
// CULTURE TRANSFORMATIONS
// ============================================================================

export const transformCultureFromDb = (row: any): Culture => ({
  id: row.id,
  type: row.type,
  label: row.label,
  strainId: row.strain_id,
  status: row.status || 'active',
  parentId: row.parent_id,
  generation: row.generation || 0,
  locationId: row.location_id,
  containerId: row.container_id,  // Unified: was vessel_id
  recipeId: row.recipe_id,
  volumeMl: row.volume_ml,
  fillVolumeMl: row.fill_volume_ml,
  prepDate: row.prep_date,
  sterilizationDate: row.sterilization_date,
  healthRating: row.health_rating || 5,
  notes: row.notes,
  cost: row.cost || 0,
  supplierId: row.supplier_id,
  lotNumber: row.lot_number,
  expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  observations: [],
  transfers: [],
});

export const transformCultureToDb = (culture: Partial<Culture>) => {
  const result: Record<string, any> = {};
  if (culture.type !== undefined) result.type = culture.type;
  if (culture.label !== undefined) result.label = culture.label;
  if (culture.strainId !== undefined) result.strain_id = culture.strainId;
  if (culture.status !== undefined) result.status = culture.status;
  if (culture.parentId !== undefined) result.parent_id = culture.parentId;
  if (culture.generation !== undefined) result.generation = culture.generation;
  if (culture.locationId !== undefined) result.location_id = culture.locationId;
  if (culture.containerId !== undefined) result.container_id = culture.containerId;  // Unified: was vessel_id
  if (culture.recipeId !== undefined) result.recipe_id = culture.recipeId;
  if (culture.volumeMl !== undefined) result.volume_ml = culture.volumeMl;
  if (culture.fillVolumeMl !== undefined) result.fill_volume_ml = culture.fillVolumeMl;
  if (culture.prepDate !== undefined) result.prep_date = culture.prepDate;
  if (culture.sterilizationDate !== undefined) result.sterilization_date = culture.sterilizationDate;
  if (culture.healthRating !== undefined) result.health_rating = culture.healthRating;
  if (culture.notes !== undefined) result.notes = culture.notes;
  if (culture.cost !== undefined) result.cost = culture.cost;
  if (culture.supplierId !== undefined) result.supplier_id = culture.supplierId;
  if (culture.lotNumber !== undefined) result.lot_number = culture.lotNumber;
  if (culture.expiresAt !== undefined) result.expires_at = culture.expiresAt instanceof Date ? culture.expiresAt.toISOString() : culture.expiresAt;
  return result;
};

// ============================================================================
// GROW TRANSFORMATIONS
// ============================================================================

export const transformGrowFromDb = (row: any): Grow => ({
  id: row.id,
  name: row.name,
  strainId: row.strain_id,
  status: row.status || 'active',
  currentStage: row.current_stage || 'spawning',
  sourceCultureId: row.source_culture_id,
  spawnType: row.spawn_type || 'grain',
  spawnWeight: row.spawn_weight || 0,
  substrateTypeId: row.substrate_type_id,
  substrateWeight: row.substrate_weight || 0,
  spawnRate: row.spawn_rate || 20,
  containerId: row.container_id,  // Unified: was container_type_id
  containerCount: row.container_count || 1,
  spawnedAt: new Date(row.spawned_at),
  colonizationStartedAt: row.colonization_started_at ? new Date(row.colonization_started_at) : undefined,
  fruitingStartedAt: row.fruiting_started_at ? new Date(row.fruiting_started_at) : undefined,
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  locationId: row.location_id,
  targetTempColonization: row.target_temp_colonization || 24,
  targetTempFruiting: row.target_temp_fruiting || 22,
  targetHumidity: row.target_humidity || 90,
  totalYield: row.total_yield || 0,
  estimatedCost: row.estimated_cost || 0,
  notes: row.notes,
  createdAt: new Date(row.created_at),
  observations: [],
  flushes: [],
});

export const transformGrowToDb = (grow: Partial<Grow>) => {
  const result: Record<string, any> = {};
  if (grow.name !== undefined) result.name = grow.name;
  if (grow.strainId !== undefined) result.strain_id = grow.strainId;
  if (grow.status !== undefined) result.status = grow.status;
  if (grow.currentStage !== undefined) result.current_stage = grow.currentStage;
  if (grow.sourceCultureId !== undefined) result.source_culture_id = grow.sourceCultureId;
  if (grow.spawnType !== undefined) result.spawn_type = grow.spawnType;
  if (grow.spawnWeight !== undefined) result.spawn_weight = grow.spawnWeight;
  if (grow.substrateTypeId !== undefined) result.substrate_type_id = grow.substrateTypeId;
  if (grow.substrateWeight !== undefined) result.substrate_weight = grow.substrateWeight;
  if (grow.spawnRate !== undefined) result.spawn_rate = grow.spawnRate;
  if (grow.containerId !== undefined) result.container_id = grow.containerId;  // Unified: was container_type_id
  if (grow.containerCount !== undefined) result.container_count = grow.containerCount;
  if (grow.spawnedAt !== undefined) result.spawned_at = grow.spawnedAt instanceof Date ? grow.spawnedAt.toISOString() : grow.spawnedAt;
  if (grow.colonizationStartedAt !== undefined) result.colonization_started_at = grow.colonizationStartedAt instanceof Date ? grow.colonizationStartedAt.toISOString() : grow.colonizationStartedAt;
  if (grow.fruitingStartedAt !== undefined) result.fruiting_started_at = grow.fruitingStartedAt instanceof Date ? grow.fruitingStartedAt.toISOString() : grow.fruitingStartedAt;
  if (grow.completedAt !== undefined) result.completed_at = grow.completedAt instanceof Date ? grow.completedAt.toISOString() : grow.completedAt;
  if (grow.locationId !== undefined) result.location_id = grow.locationId;
  if (grow.targetTempColonization !== undefined) result.target_temp_colonization = grow.targetTempColonization;
  if (grow.targetTempFruiting !== undefined) result.target_temp_fruiting = grow.targetTempFruiting;
  if (grow.targetHumidity !== undefined) result.target_humidity = grow.targetHumidity;
  if (grow.totalYield !== undefined) result.total_yield = grow.totalYield;
  if (grow.estimatedCost !== undefined) result.estimated_cost = grow.estimatedCost;
  if (grow.notes !== undefined) result.notes = grow.notes;
  return result;
};

// ============================================================================
// RECIPE TRANSFORMATIONS
// ============================================================================

export const transformRecipeFromDb = (row: any): Recipe => ({
  id: row.id,
  name: row.name,
  category: row.category,
  description: row.description || '',
  yield: {
    amount: row.yield_amount || 500,
    unit: row.yield_unit || 'ml'
  },
  prepTime: row.prep_time_minutes,
  sterilizationTime: row.sterilization_time,
  sterilizationPsi: row.sterilization_psi || 15,
  ingredients: [],
  instructions: row.instructions || [],
  tips: row.tips || [],
  sourceUrl: row.source_url,
  costPerBatch: row.cost_per_batch,
  notes: row.notes,
  isActive: row.is_active ?? true,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const transformRecipeToDb = (recipe: Partial<Recipe>) => {
  const result: Record<string, any> = {};
  if (recipe.name !== undefined) result.name = recipe.name;
  if (recipe.category !== undefined) result.category = recipe.category;
  if (recipe.description !== undefined) result.description = recipe.description;
  if (recipe.yield !== undefined) {
    result.yield_amount = recipe.yield.amount;
    result.yield_unit = recipe.yield.unit;
  }
  if (recipe.prepTime !== undefined) result.prep_time_minutes = recipe.prepTime;
  if (recipe.sterilizationTime !== undefined) result.sterilization_time = recipe.sterilizationTime;
  if (recipe.sterilizationPsi !== undefined) result.sterilization_psi = recipe.sterilizationPsi;
  if (recipe.instructions !== undefined) result.instructions = recipe.instructions;
  if (recipe.tips !== undefined) result.tips = recipe.tips;
  if (recipe.sourceUrl !== undefined) result.source_url = recipe.sourceUrl;
  if (recipe.costPerBatch !== undefined) result.cost_per_batch = recipe.costPerBatch;
  if (recipe.notes !== undefined) result.notes = recipe.notes;
  if (recipe.isActive !== undefined) result.is_active = recipe.isActive;
  return result;
};

// ============================================================================
// SUPPLIER TRANSFORMATIONS
// ============================================================================

export const transformSupplierFromDb = (row: any): Supplier => ({
  id: row.id,
  name: row.name,
  website: row.website,
  email: row.email,
  phone: row.phone,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

export const transformSupplierToDb = (supplier: Partial<Supplier>, userId?: string | null) => ({
  name: supplier.name,
  website: supplier.website,
  email: supplier.email,
  phone: supplier.phone,
  notes: supplier.notes,
  is_active: supplier.isActive,
  ...(userId && { user_id: userId }),
});

// ============================================================================
// FLUSH TRANSFORMATIONS
// ============================================================================

export const transformFlushFromDb = (row: any): Flush => ({
  id: row.id,
  flushNumber: row.flush_number,
  harvestDate: new Date(row.harvest_date),
  wetWeight: row.wet_weight_g,
  dryWeight: row.dry_weight_g,
  mushroomCount: row.mushroom_count,
  quality: row.quality || 'good',
  notes: row.notes,
});

export const transformFlushToDb = (flush: Omit<Flush, 'id'>, growId: string) => ({
  grow_id: growId,
  flush_number: flush.flushNumber,
  harvest_date: flush.harvestDate instanceof Date ? flush.harvestDate.toISOString() : flush.harvestDate,
  wet_weight_g: flush.wetWeight,
  dry_weight_g: flush.dryWeight,
  mushroom_count: flush.mushroomCount,
  quality: flush.quality,
  notes: flush.notes,
});

// ============================================================================
// GRAIN TYPE TRANSFORMATIONS
// ============================================================================

export const transformGrainTypeFromDb = (row: any): GrainType => ({
  id: row.id,
  name: row.name,
  code: row.code || row.name?.toLowerCase().replace(/\s+/g, '_'),
  notes: row.notes,
  isActive: row.is_active ?? true,
});

export const transformGrainTypeToDb = (grain: Partial<GrainType>, userId?: string | null) => ({
  name: grain.name,
  code: grain.code,
  notes: grain.notes,
  is_active: grain.isActive,
  ...(userId && { user_id: userId }),
});

// ============================================================================
// INVENTORY LOT TRANSFORMATIONS
// ============================================================================

export const transformInventoryLotFromDb = (row: any): InventoryLot => ({
  id: row.id,
  inventoryItemId: row.inventory_item_id,
  quantity: parseFloat(row.quantity) || 0,
  originalQuantity: parseFloat(row.original_quantity) || 0,
  unit: row.unit || 'g',
  status: row.status || 'available',
  purchaseOrderId: row.purchase_order_id,
  supplierId: row.supplier_id,
  purchaseDate: row.purchase_date ? new Date(row.purchase_date) : undefined,
  purchaseCost: row.purchase_cost ? parseFloat(row.purchase_cost) : undefined,
  locationId: row.location_id,
  expirationDate: row.expiration_date ? new Date(row.expiration_date) : undefined,
  lotNumber: row.lot_number,
  images: row.images || [],
  notes: row.notes,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  isActive: row.is_active ?? true,
});

export const transformInventoryLotToDb = (lot: Partial<InventoryLot>) => {
  const result: Record<string, any> = {};
  if (lot.inventoryItemId !== undefined) result.inventory_item_id = lot.inventoryItemId;
  if (lot.quantity !== undefined) result.quantity = lot.quantity;
  if (lot.originalQuantity !== undefined) result.original_quantity = lot.originalQuantity;
  if (lot.unit !== undefined) result.unit = lot.unit;
  if (lot.status !== undefined) result.status = lot.status;
  if (lot.purchaseOrderId !== undefined) result.purchase_order_id = lot.purchaseOrderId;
  if (lot.supplierId !== undefined) result.supplier_id = lot.supplierId;
  if (lot.purchaseDate !== undefined) result.purchase_date = lot.purchaseDate instanceof Date ? lot.purchaseDate.toISOString() : lot.purchaseDate;
  if (lot.purchaseCost !== undefined) result.purchase_cost = lot.purchaseCost;
  if (lot.locationId !== undefined) result.location_id = lot.locationId;
  if (lot.expirationDate !== undefined) result.expiration_date = lot.expirationDate instanceof Date ? lot.expirationDate.toISOString() : lot.expirationDate;
  if (lot.lotNumber !== undefined) result.lot_number = lot.lotNumber;
  if (lot.images !== undefined) result.images = lot.images;
  if (lot.notes !== undefined) result.notes = lot.notes;
  if (lot.isActive !== undefined) result.is_active = lot.isActive;
  return result;
};

// ============================================================================
// PURCHASE ORDER TRANSFORMATIONS
// ============================================================================

export const transformPurchaseOrderFromDb = (row: any): PurchaseOrder => ({
  id: row.id,
  orderNumber: row.order_number,
  supplierId: row.supplier_id,
  status: row.status || 'draft',
  paymentStatus: row.payment_status || 'unpaid',
  items: row.items || [],
  subtotal: parseFloat(row.subtotal) || 0,
  shipping: parseFloat(row.shipping) || 0,
  tax: parseFloat(row.tax) || 0,
  total: parseFloat(row.total) || 0,
  orderDate: new Date(row.order_date),
  expectedDate: row.expected_date ? new Date(row.expected_date) : undefined,
  receivedDate: row.received_date ? new Date(row.received_date) : undefined,
  trackingNumber: row.tracking_number,
  trackingUrl: row.tracking_url,
  orderUrl: row.order_url,
  receiptImage: row.receipt_image,
  invoiceImage: row.invoice_image,
  images: row.images || [],
  notes: row.notes,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  isActive: row.is_active ?? true,
});

export const transformPurchaseOrderToDb = (order: Partial<PurchaseOrder>) => {
  const result: Record<string, any> = {};
  if (order.orderNumber !== undefined) result.order_number = order.orderNumber;
  if (order.supplierId !== undefined) result.supplier_id = order.supplierId;
  if (order.status !== undefined) result.status = order.status;
  if (order.paymentStatus !== undefined) result.payment_status = order.paymentStatus;
  if (order.items !== undefined) result.items = order.items;
  if (order.subtotal !== undefined) result.subtotal = order.subtotal;
  if (order.shipping !== undefined) result.shipping = order.shipping;
  if (order.tax !== undefined) result.tax = order.tax;
  if (order.total !== undefined) result.total = order.total;
  if (order.orderDate !== undefined) result.order_date = order.orderDate instanceof Date ? order.orderDate.toISOString() : order.orderDate;
  if (order.expectedDate !== undefined) result.expected_date = order.expectedDate instanceof Date ? order.expectedDate.toISOString() : order.expectedDate;
  if (order.receivedDate !== undefined) result.received_date = order.receivedDate instanceof Date ? order.receivedDate.toISOString() : order.receivedDate;
  if (order.trackingNumber !== undefined) result.tracking_number = order.trackingNumber;
  if (order.trackingUrl !== undefined) result.tracking_url = order.trackingUrl;
  if (order.orderUrl !== undefined) result.order_url = order.orderUrl;
  if (order.receiptImage !== undefined) result.receipt_image = order.receiptImage;
  if (order.invoiceImage !== undefined) result.invoice_image = order.invoiceImage;
  if (order.images !== undefined) result.images = order.images;
  if (order.notes !== undefined) result.notes = order.notes;
  if (order.isActive !== undefined) result.is_active = order.isActive;
  return result;
};

// ============================================================================
// SPECIES TRANSFORMATION (inline in DataContext but exported for consistency)
// ============================================================================

export const transformSpeciesFromDb = (row: any): Species => ({
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
});

export const transformSpeciesToDb = (species: Partial<Species>, userId?: string | null) => ({
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
  is_active: species.isActive,
  ...(userId && { user_id: userId }),
});
