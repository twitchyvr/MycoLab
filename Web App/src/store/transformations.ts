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
  InventoryItem,
  InventoryLot,
  LabItemInstance,
  PurchaseOrder,
  Culture,
  Grow,
  Recipe,
  Flush,
  RecipeCategoryItem,
  GrainType,
  PreparedSpawn,
  GrainSpawn,
  GrainSpawnObservation,
  EntityOutcome,
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
  userId: row.user_id ?? null, // null = system/global data
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
  // Image support
  images: row.images || [],
  referenceImage: row.reference_image,
});

export const transformStrainToDb = (strain: Partial<Strain>, userId?: string | null) => {
  const result: Record<string, any> = {};

  if (strain.name !== undefined) result.name = strain.name;
  if (strain.speciesId !== undefined) result.species_id = strain.speciesId;
  if (strain.species !== undefined) result.species = strain.species;

  // Variety/Phenotype tracking
  if (strain.variety !== undefined) result.variety = strain.variety;
  if (strain.phenotype !== undefined) result.phenotype = strain.phenotype;
  if (strain.geneticsSource !== undefined) result.genetics_source = strain.geneticsSource;
  if (strain.isolationType !== undefined) result.isolation_type = strain.isolationType;
  if (strain.generation !== undefined) result.generation = strain.generation;

  // Growing characteristics
  if (strain.difficulty !== undefined) result.difficulty = strain.difficulty;
  if (strain.colonizationDays?.min !== undefined) result.colonization_days_min = strain.colonizationDays.min;
  if (strain.colonizationDays?.max !== undefined) result.colonization_days_max = strain.colonizationDays.max;
  if (strain.fruitingDays?.min !== undefined) result.fruiting_days_min = strain.fruitingDays.min;
  if (strain.fruitingDays?.max !== undefined) result.fruiting_days_max = strain.fruitingDays.max;
  if (strain.optimalTempColonization?.min !== undefined) result.optimal_temp_colonization = strain.optimalTempColonization.min;
  if (strain.optimalTempFruiting?.min !== undefined) result.optimal_temp_fruiting = strain.optimalTempFruiting.min;

  // Additional metadata
  if (strain.origin !== undefined) result.origin = strain.origin;
  if (strain.description !== undefined) result.description = strain.description;
  if (strain.notes !== undefined) result.notes = strain.notes;
  if (strain.isActive !== undefined) result.is_active = strain.isActive;

  // Image support
  if (strain.images !== undefined) result.images = strain.images;
  if (strain.referenceImage !== undefined) result.reference_image = strain.referenceImage;

  // User ID
  if (userId) result.user_id = userId;

  return result;
};

// ============================================================================
// LOCATION TYPE TRANSFORMATIONS
// ============================================================================

export const transformLocationTypeFromDb = (row: any): LocationType => ({
  id: row.id,
  userId: row.user_id ?? null, // null = system/global data
  name: row.name,
  code: row.code || row.name?.toLowerCase().replace(/\s+/g, '_'),
  description: row.description,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

export const transformLocationTypeToDb = (lt: Partial<LocationType>, userId?: string | null) => {
  const result: Record<string, any> = {};
  if (lt.name !== undefined) result.name = lt.name;
  if (lt.code !== undefined) result.code = lt.code;
  if (lt.description !== undefined) result.description = lt.description;
  if (lt.notes !== undefined) result.notes = lt.notes;
  if (lt.isActive !== undefined) result.is_active = lt.isActive;
  if (userId) result.user_id = userId;
  return result;
};

// ============================================================================
// LOCATION CLASSIFICATION TRANSFORMATIONS
// ============================================================================

export const transformLocationClassificationFromDb = (row: any): LocationClassification => ({
  id: row.id,
  userId: row.user_id ?? null, // null = system/global data
  name: row.name,
  code: row.code || row.name?.toLowerCase().replace(/\s+/g, '_'),
  description: row.description,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

export const transformLocationClassificationToDb = (lc: Partial<LocationClassification>, userId?: string | null) => {
  const result: Record<string, any> = {};
  if (lc.name !== undefined) result.name = lc.name;
  if (lc.code !== undefined) result.code = lc.code;
  if (lc.description !== undefined) result.description = lc.description;
  if (lc.notes !== undefined) result.notes = lc.notes;
  if (lc.isActive !== undefined) result.is_active = lc.isActive;
  if (userId) result.user_id = userId;
  return result;
};

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
  description: row.description,
  isActive: row.is_active ?? true,
  // Hierarchical location fields
  parentId: row.parent_id,
  level: row.level,
  roomPurpose: row.room_purpose, // Legacy single purpose field
  roomPurposes: row.room_purposes || (row.room_purpose ? [row.room_purpose] : undefined), // New array field with fallback
  capacity: row.capacity,
  currentOccupancy: row.current_occupancy ?? 0,
  sortOrder: row.sort_order ?? 0,
  path: row.path,
  code: row.code,
  dimensions: row.dimension_length || row.dimension_width || row.dimension_height
    ? {
        length: row.dimension_length ? parseFloat(row.dimension_length) : undefined,
        width: row.dimension_width ? parseFloat(row.dimension_width) : undefined,
        height: row.dimension_height ? parseFloat(row.dimension_height) : undefined,
        unit: row.dimension_unit || 'cm',
      }
    : undefined,
  // Image support
  photos: row.photos || [],
  currentPhoto: row.current_photo,
  // Notification preferences
  notificationsMuted: row.notifications_muted ?? false,
});

export const transformLocationToDb = (location: Partial<Location>, userId?: string | null) => {
  const result: Record<string, any> = {};

  // Required/common fields
  if (location.name !== undefined) result.name = location.name;
  if (location.type !== undefined) result.type = location.type;
  if (location.typeId !== undefined) result.type_id = toDbId(location.typeId);
  if (location.classificationId !== undefined) result.classification_id = toDbId(location.classificationId);

  // Temperature and humidity ranges
  if (location.tempRange?.min !== undefined) result.temp_min = location.tempRange.min;
  if (location.tempRange?.max !== undefined) result.temp_max = location.tempRange.max;
  if (location.humidityRange?.min !== undefined) result.humidity_min = location.humidityRange.min;
  if (location.humidityRange?.max !== undefined) result.humidity_max = location.humidityRange.max;

  // Facility/equipment fields
  if (location.hasPower !== undefined) result.has_power = location.hasPower;
  if (location.powerUsage !== undefined) result.power_usage = location.powerUsage;
  if (location.hasAirCirculation !== undefined) result.has_air_circulation = location.hasAirCirculation;
  if (location.size !== undefined) result.size = location.size;
  if (location.supplierId !== undefined) result.supplier_id = toDbId(location.supplierId);
  if (location.cost !== undefined) result.cost = location.cost;
  if (location.procurementDate !== undefined) result.procurement_date = location.procurementDate.toISOString();

  // Notes and description
  if (location.notes !== undefined) result.notes = location.notes;
  if (location.description !== undefined) result.description = location.description;
  if (location.isActive !== undefined) result.is_active = location.isActive;

  // Hierarchical location fields
  if (location.parentId !== undefined) result.parent_id = toDbId(location.parentId);
  if (location.level !== undefined) result.level = location.level;

  // Room purposes (support both legacy single and new array)
  if (location.roomPurposes !== undefined && location.roomPurposes.length > 0) {
    result.room_purpose = location.roomPurposes[0]; // Legacy single purpose
    result.room_purposes = location.roomPurposes;   // Full array
  } else if (location.roomPurpose !== undefined) {
    result.room_purpose = location.roomPurpose;
  }

  // Capacity and occupancy
  if (location.capacity !== undefined) result.capacity = location.capacity;
  if (location.currentOccupancy !== undefined) result.current_occupancy = location.currentOccupancy;
  if (location.sortOrder !== undefined) result.sort_order = location.sortOrder;
  if (location.path !== undefined) result.path = location.path;
  if (location.code !== undefined) result.code = location.code;

  // Dimensions
  if (location.dimensions?.length !== undefined) result.dimension_length = location.dimensions.length;
  if (location.dimensions?.width !== undefined) result.dimension_width = location.dimensions.width;
  if (location.dimensions?.height !== undefined) result.dimension_height = location.dimensions.height;
  if (location.dimensions?.unit !== undefined) result.dimension_unit = location.dimensions.unit;

  // Image support
  if (location.photos !== undefined) result.photos = location.photos;
  if (location.currentPhoto !== undefined) result.current_photo = location.currentPhoto;

  // Notification preferences
  if (location.notificationsMuted !== undefined) result.notifications_muted = location.notificationsMuted;

  // User ID
  if (userId) result.user_id = userId;

  return result;
};

// ============================================================================
// CONTAINER TRANSFORMATIONS (Unified - replaces Vessel and ContainerType)
// ============================================================================

export const transformContainerFromDb = (row: any): Container => ({
  id: row.id,
  userId: row.user_id ?? null, // null = system/global data
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
  isSterilizable: row.is_sterilizable ?? true,
  usageContext: row.usage_context || ['culture', 'grow'],
  notes: row.notes,
  isActive: row.is_active ?? true,
  // Cost tracking fields
  unitCost: row.unit_cost != null ? parseFloat(row.unit_cost) : undefined,
  purchasePrice: row.purchase_price != null ? parseFloat(row.purchase_price) : undefined,
  quantityOwned: row.quantity_owned != null ? parseInt(row.quantity_owned, 10) : undefined,
  supplierId: row.supplier_id,
  purchaseDate: row.purchase_date ? new Date(row.purchase_date) : undefined,
  orderDate: row.order_date ? new Date(row.order_date) : undefined,
  receivedDate: row.received_date ? new Date(row.received_date) : undefined,
  lotNumber: row.lot_number,
  sku: row.sku,
  reorderUrl: row.reorder_url,
});

export const transformContainerToDb = (container: Partial<Container>, userId?: string | null) => {
  const result: Record<string, any> = {};
  if (container.name !== undefined) result.name = container.name;
  if (container.category !== undefined) result.category = container.category;
  if (container.volumeMl !== undefined) result.volume_ml = container.volumeMl;
  if (container.dimensions?.length !== undefined) result.dimension_length = container.dimensions.length;
  if (container.dimensions?.width !== undefined) result.dimension_width = container.dimensions.width;
  if (container.dimensions?.height !== undefined) result.dimension_height = container.dimensions.height;
  if (container.dimensions?.unit !== undefined) result.dimension_unit = container.dimensions.unit;
  if (container.isReusable !== undefined) result.is_reusable = container.isReusable;
  if (container.isSterilizable !== undefined) result.is_sterilizable = container.isSterilizable;
  if (container.usageContext !== undefined) result.usage_context = container.usageContext;
  if (container.notes !== undefined) result.notes = container.notes;
  if (container.isActive !== undefined) result.is_active = container.isActive;
  // Cost tracking fields
  if (container.unitCost !== undefined) result.unit_cost = container.unitCost;
  if (container.purchasePrice !== undefined) result.purchase_price = container.purchasePrice;
  if (container.quantityOwned !== undefined) result.quantity_owned = container.quantityOwned;
  if (container.supplierId !== undefined) result.supplier_id = container.supplierId;
  if (container.purchaseDate !== undefined) result.purchase_date = container.purchaseDate instanceof Date ? container.purchaseDate.toISOString() : container.purchaseDate;
  if (container.orderDate !== undefined) result.order_date = container.orderDate instanceof Date ? container.orderDate.toISOString() : container.orderDate;
  if (container.receivedDate !== undefined) result.received_date = container.receivedDate instanceof Date ? container.receivedDate.toISOString() : container.receivedDate;
  if (container.lotNumber !== undefined) result.lot_number = container.lotNumber;
  if (container.sku !== undefined) result.sku = container.sku;
  if (container.reorderUrl !== undefined) result.reorder_url = container.reorderUrl;
  if (userId) result.user_id = userId;
  return result;
};

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
  userId: row.user_id ?? null, // null = system/global data
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

export const transformSubstrateTypeToDb = (st: Partial<SubstrateType>, userId?: string | null) => {
  const result: Record<string, any> = {};
  if (st.name !== undefined) result.name = st.name;
  if (st.code !== undefined) result.code = st.code;
  if (st.category !== undefined) result.category = st.category;
  if (st.spawnRateRange?.min !== undefined) result.spawn_rate_min = st.spawnRateRange.min;
  if (st.spawnRateRange?.optimal !== undefined) result.spawn_rate_optimal = st.spawnRateRange.optimal;
  if (st.spawnRateRange?.max !== undefined) result.spawn_rate_max = st.spawnRateRange.max;
  if (st.fieldCapacity !== undefined) result.field_capacity = st.fieldCapacity;
  if (st.notes !== undefined) result.notes = st.notes;
  if (st.isActive !== undefined) result.is_active = st.isActive;
  if (userId) result.user_id = userId;
  return result;
};

// ============================================================================
// INVENTORY CATEGORY TRANSFORMATIONS
// ============================================================================

export const transformInventoryCategoryFromDb = (row: any): InventoryCategory => ({
  id: row.id,
  userId: row.user_id ?? null, // null = system/global data
  name: row.name,
  color: row.color || '#6b7280',
  icon: row.icon,
  isActive: row.is_active ?? true,
});

export const transformInventoryCategoryToDb = (cat: Partial<InventoryCategory>, userId?: string | null) => {
  const result: Record<string, any> = {};
  if (cat.name !== undefined) result.name = cat.name;
  if (cat.color !== undefined) result.color = cat.color;
  if (cat.icon !== undefined) result.icon = cat.icon;
  if (cat.isActive !== undefined) result.is_active = cat.isActive;
  if (userId) result.user_id = userId;
  return result;
};

// ============================================================================
// INVENTORY ITEM TRANSFORMATIONS
// ============================================================================

export const transformInventoryItemFromDb = (row: any): InventoryItem => ({
  id: row.id,
  name: row.name,
  categoryId: row.category_id || '',
  sku: row.sku,
  quantity: parseFloat(row.quantity) || 0,
  unit: row.unit || 'units',
  unitCost: parseFloat(row.cost_per_unit) || 0,
  reorderPoint: row.reorder_point || 0,
  reorderQty: row.reorder_qty || 0,
  supplierId: row.supplier_id,
  locationId: row.location_id,
  expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
  lotNumber: row.lot_number,
  notes: row.notes,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  isActive: row.is_active ?? true,
  // Notification preferences
  notificationsMuted: row.notifications_muted ?? false,
  // Smart item classification
  itemBehavior: row.item_behavior,
  itemProperties: row.item_properties ? (typeof row.item_properties === 'string' ? JSON.parse(row.item_properties) : row.item_properties) : undefined,
});

export const transformInventoryItemToDb = (item: Partial<InventoryItem>, userId?: string | null) => {
  const result: Record<string, any> = {};
  if (item.name !== undefined) result.name = item.name;
  if (item.categoryId !== undefined) result.category_id = item.categoryId || null;
  if (item.sku !== undefined) result.sku = item.sku;
  if (item.quantity !== undefined) result.quantity = item.quantity;
  if (item.unit !== undefined) result.unit = item.unit;
  if (item.unitCost !== undefined) result.cost_per_unit = item.unitCost;
  if (item.reorderPoint !== undefined) result.reorder_point = item.reorderPoint;
  if (item.reorderQty !== undefined) result.reorder_qty = item.reorderQty;
  if (item.supplierId !== undefined) result.supplier_id = item.supplierId || null;
  if (item.locationId !== undefined) result.location_id = item.locationId || null;
  if (item.expiresAt !== undefined) result.expires_at = item.expiresAt instanceof Date ? item.expiresAt.toISOString() : item.expiresAt;
  if (item.lotNumber !== undefined) result.lot_number = item.lotNumber;
  if (item.notes !== undefined) result.notes = item.notes;
  if (item.isActive !== undefined) result.is_active = item.isActive;
  if (item.notificationsMuted !== undefined) result.notifications_muted = item.notificationsMuted;
  // Smart item classification
  if (item.itemBehavior !== undefined) result.item_behavior = item.itemBehavior;
  if (item.itemProperties !== undefined) result.item_properties = item.itemProperties;
  if (userId) result.user_id = userId;
  return result;
};

// ============================================================================
// RECIPE CATEGORY TRANSFORMATIONS
// ============================================================================

export const transformRecipeCategoryFromDb = (row: any): RecipeCategoryItem => ({
  id: row.id,
  userId: row.user_id ?? null, // null = system/global data
  name: row.name,
  code: row.code,
  icon: row.icon || '📦',
  color: row.color || 'text-zinc-400 bg-zinc-800',
  isActive: row.is_active ?? true,
});

export const transformRecipeCategoryToDb = (cat: Partial<RecipeCategoryItem>, userId?: string | null) => {
  const result: Record<string, any> = {};
  if (cat.name !== undefined) result.name = cat.name;
  if (cat.code !== undefined) result.code = cat.code;
  if (cat.icon !== undefined) result.icon = cat.icon;
  if (cat.color !== undefined) result.color = cat.color;
  if (cat.isActive !== undefined) result.is_active = cat.isActive;
  if (userId) result.user_id = userId;
  return result;
};

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
  // Acquisition tracking
  acquisitionMethod: row.acquisition_method,
  purchaseDate: row.purchase_date,
  receivedDate: row.received_date,
  supplierId: row.supplier_id,
  lotNumber: row.lot_number,
  expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  observations: [],
  transfers: [],
  // Image support
  images: row.images || [],
  primaryImage: row.primary_image,
  // Immutability fields
  version: row.version ?? 1,
  recordGroupId: row.record_group_id ?? row.id,
  isCurrent: row.is_current ?? true,
  validFrom: row.valid_from ? new Date(row.valid_from) : undefined,
  validTo: row.valid_to ? new Date(row.valid_to) : undefined,
  supersededById: row.superseded_by_id,
  isArchived: row.is_archived ?? false,
  archivedAt: row.archived_at ? new Date(row.archived_at) : undefined,
  archivedBy: row.archived_by,
  archiveReason: row.archive_reason,
  amendmentType: row.amendment_type ?? 'original',
  amendmentReason: row.amendment_reason,
  amendsRecordId: row.amends_record_id,
  // Notification preferences
  notificationsMuted: row.notifications_muted ?? false,
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
  // Acquisition tracking
  if (culture.acquisitionMethod !== undefined) result.acquisition_method = culture.acquisitionMethod;
  if (culture.purchaseDate !== undefined) result.purchase_date = culture.purchaseDate;
  if (culture.receivedDate !== undefined) result.received_date = culture.receivedDate;
  if (culture.supplierId !== undefined) result.supplier_id = culture.supplierId;
  if (culture.lotNumber !== undefined) result.lot_number = culture.lotNumber;
  if (culture.expiresAt !== undefined) result.expires_at = culture.expiresAt instanceof Date ? culture.expiresAt.toISOString() : culture.expiresAt;
  // Image support
  if (culture.images !== undefined) result.images = culture.images;
  if (culture.primaryImage !== undefined) result.primary_image = culture.primaryImage;
  // Immutability fields
  if (culture.version !== undefined) result.version = culture.version;
  if (culture.recordGroupId !== undefined) result.record_group_id = culture.recordGroupId;
  if (culture.isCurrent !== undefined) result.is_current = culture.isCurrent;
  if (culture.validFrom !== undefined) result.valid_from = culture.validFrom instanceof Date ? culture.validFrom.toISOString() : culture.validFrom;
  if (culture.validTo !== undefined) result.valid_to = culture.validTo instanceof Date ? culture.validTo.toISOString() : culture.validTo;
  if (culture.supersededById !== undefined) result.superseded_by_id = culture.supersededById;
  if (culture.isArchived !== undefined) result.is_archived = culture.isArchived;
  if (culture.archivedAt !== undefined) result.archived_at = culture.archivedAt instanceof Date ? culture.archivedAt.toISOString() : culture.archivedAt;
  if (culture.archivedBy !== undefined) result.archived_by = culture.archivedBy;
  if (culture.archiveReason !== undefined) result.archive_reason = culture.archiveReason;
  if (culture.amendmentType !== undefined) result.amendment_type = culture.amendmentType;
  if (culture.amendmentReason !== undefined) result.amendment_reason = culture.amendmentReason;
  if (culture.amendsRecordId !== undefined) result.amends_record_id = culture.amendsRecordId;
  // Notification preferences
  if (culture.notificationsMuted !== undefined) result.notifications_muted = culture.notificationsMuted;
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
  // Image support
  images: row.images || [],
  setupPhoto: row.setup_photo,
  // Immutability fields
  version: row.version ?? 1,
  recordGroupId: row.record_group_id ?? row.id,
  isCurrent: row.is_current ?? true,
  validFrom: row.valid_from ? new Date(row.valid_from) : undefined,
  validTo: row.valid_to ? new Date(row.valid_to) : undefined,
  supersededById: row.superseded_by_id,
  isArchived: row.is_archived ?? false,
  archivedAt: row.archived_at ? new Date(row.archived_at) : undefined,
  archivedBy: row.archived_by,
  archiveReason: row.archive_reason,
  amendmentType: row.amendment_type ?? 'original',
  amendmentReason: row.amendment_reason,
  amendsRecordId: row.amends_record_id,
  sourceCultureSnapshot: row.source_culture_snapshot,
  // Notification preferences
  notificationsMuted: row.notifications_muted ?? false,
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
  // Image support
  if (grow.images !== undefined) result.images = grow.images;
  if (grow.setupPhoto !== undefined) result.setup_photo = grow.setupPhoto;
  // Immutability fields
  if (grow.version !== undefined) result.version = grow.version;
  if (grow.recordGroupId !== undefined) result.record_group_id = grow.recordGroupId;
  if (grow.isCurrent !== undefined) result.is_current = grow.isCurrent;
  if (grow.validFrom !== undefined) result.valid_from = grow.validFrom instanceof Date ? grow.validFrom.toISOString() : grow.validFrom;
  if (grow.validTo !== undefined) result.valid_to = grow.validTo instanceof Date ? grow.validTo.toISOString() : grow.validTo;
  if (grow.supersededById !== undefined) result.superseded_by_id = grow.supersededById;
  if (grow.isArchived !== undefined) result.is_archived = grow.isArchived;
  if (grow.archivedAt !== undefined) result.archived_at = grow.archivedAt instanceof Date ? grow.archivedAt.toISOString() : grow.archivedAt;
  if (grow.archivedBy !== undefined) result.archived_by = grow.archivedBy;
  if (grow.archiveReason !== undefined) result.archive_reason = grow.archiveReason;
  if (grow.amendmentType !== undefined) result.amendment_type = grow.amendmentType;
  if (grow.amendmentReason !== undefined) result.amendment_reason = grow.amendmentReason;
  if (grow.amendsRecordId !== undefined) result.amends_record_id = grow.amendsRecordId;
  if (grow.sourceCultureSnapshot !== undefined) result.source_culture_snapshot = grow.sourceCultureSnapshot;
  // Notification preferences
  if (grow.notificationsMuted !== undefined) result.notifications_muted = grow.notificationsMuted;
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
  userId: row.user_id ?? null, // null = system/global data
  name: row.name,
  website: row.website,
  email: row.email,
  phone: row.phone,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

export const transformSupplierToDb = (supplier: Partial<Supplier>, userId?: string | null) => {
  const result: Record<string, any> = {};
  if (supplier.name !== undefined) result.name = supplier.name;
  if (supplier.website !== undefined) result.website = supplier.website;
  if (supplier.email !== undefined) result.email = supplier.email;
  if (supplier.phone !== undefined) result.phone = supplier.phone;
  if (supplier.notes !== undefined) result.notes = supplier.notes;
  if (supplier.isActive !== undefined) result.is_active = supplier.isActive;
  if (userId) result.user_id = userId;
  return result;
};

// ============================================================================
// FLUSH TRANSFORMATIONS
// ============================================================================

/**
 * Transform flush data from database format to app format.
 * Handles both old column names (wet_weight, dry_weight) and new names (wet_weight_g, dry_weight_g)
 * for backwards compatibility during migration.
 */
export const transformFlushFromDb = (row: any): Flush => ({
  id: row.id,
  flushNumber: row.flush_number,
  harvestDate: new Date(row.harvest_date),
  // Handle both old (wet_weight) and new (wet_weight_g) column names
  wetWeight: row.wet_weight_g ?? row.wet_weight ?? 0,
  dryWeight: row.dry_weight_g ?? row.dry_weight ?? 0,
  mushroomCount: row.mushroom_count,
  quality: row.quality || 'good',
  notes: row.notes,
  // Image support
  harvestImages: row.harvest_images || [],
  primaryHarvestPhoto: row.primary_harvest_photo,
});

/**
 * Transform flush data from app format to database format.
 * Uses the new column names with _g suffix (for grams).
 */
export const transformFlushToDb = (flush: Omit<Flush, 'id'>, growId: string) => {
  const result: Record<string, any> = { grow_id: growId };
  if (flush.flushNumber !== undefined) result.flush_number = flush.flushNumber;
  if (flush.harvestDate !== undefined) result.harvest_date = flush.harvestDate instanceof Date ? flush.harvestDate.toISOString() : flush.harvestDate;
  if (flush.wetWeight !== undefined) result.wet_weight_g = flush.wetWeight;
  if (flush.dryWeight !== undefined) result.dry_weight_g = flush.dryWeight;
  if (flush.mushroomCount !== undefined) result.mushroom_count = flush.mushroomCount;
  if (flush.quality !== undefined) result.quality = flush.quality;
  if (flush.notes !== undefined) result.notes = flush.notes;
  if (flush.harvestImages !== undefined) result.harvest_images = flush.harvestImages;
  if (flush.primaryHarvestPhoto !== undefined) result.primary_harvest_photo = flush.primaryHarvestPhoto;
  return result;
};

// ============================================================================
// GRAIN TYPE TRANSFORMATIONS
// ============================================================================

export const transformGrainTypeFromDb = (row: any): GrainType => ({
  id: row.id,
  userId: row.user_id ?? null, // null = system/global data
  name: row.name,
  code: row.code || row.name?.toLowerCase().replace(/\s+/g, '_'),
  notes: row.notes,
  isActive: row.is_active ?? true,
});

export const transformGrainTypeToDb = (grain: Partial<GrainType>, userId?: string | null) => {
  const result: Record<string, any> = {};
  if (grain.name !== undefined) result.name = grain.name;
  if (grain.code !== undefined) result.code = grain.code;
  if (grain.notes !== undefined) result.notes = grain.notes;
  if (grain.isActive !== undefined) result.is_active = grain.isActive;
  if (userId) result.user_id = userId;
  return result;
};

// ============================================================================
// INVENTORY LOT TRANSFORMATIONS
// ============================================================================

export const transformInventoryLotFromDb = (row: any): InventoryLot => ({
  id: row.id,
  inventoryItemId: row.inventory_item_id,
  quantity: parseFloat(row.quantity) || 0,
  originalQuantity: parseFloat(row.original_quantity) || 0,
  inUseQuantity: parseFloat(row.in_use_quantity) || 0,
  unit: row.unit || 'g',
  status: row.status || 'available',
  purchaseOrderId: row.purchase_order_id,
  supplierId: row.supplier_id,
  purchaseDate: row.purchase_date ? new Date(row.purchase_date) : undefined,
  purchaseCost: row.purchase_cost ? parseFloat(row.purchase_cost) : undefined,
  unitCost: row.unit_cost ? parseFloat(row.unit_cost) : undefined,
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
  if (lot.inUseQuantity !== undefined) result.in_use_quantity = lot.inUseQuantity;
  if (lot.unit !== undefined) result.unit = lot.unit;
  if (lot.status !== undefined) result.status = lot.status;
  if (lot.purchaseOrderId !== undefined) result.purchase_order_id = lot.purchaseOrderId;
  if (lot.supplierId !== undefined) result.supplier_id = lot.supplierId;
  if (lot.purchaseDate !== undefined) result.purchase_date = lot.purchaseDate instanceof Date ? lot.purchaseDate.toISOString() : lot.purchaseDate;
  if (lot.purchaseCost !== undefined) result.purchase_cost = lot.purchaseCost;
  if (lot.unitCost !== undefined) result.unit_cost = lot.unitCost;
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
  userId: row.user_id ?? null, // null = system/global data
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
  // Cold storage requirements
  coldSensitive: row.cold_sensitive ?? false,
  minStorageTempC: row.min_storage_temp_c ?? 2,
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

export const transformSpeciesToDb = (species: Partial<Species>, userId?: string | null) => {
  const result: Record<string, any> = {};
  if (species.name !== undefined) result.name = species.name;
  if (species.scientificName !== undefined) result.scientific_name = species.scientificName;
  if (species.commonNames !== undefined) result.common_names = species.commonNames;
  if (species.category !== undefined) result.category = species.category;
  // Growing parameters (JSONB)
  if (species.spawnColonization !== undefined) result.spawn_colonization = species.spawnColonization;
  if (species.bulkColonization !== undefined) result.bulk_colonization = species.bulkColonization;
  if (species.pinning !== undefined) result.pinning = species.pinning;
  if (species.maturation !== undefined) result.maturation = species.maturation;
  // Substrate preferences
  if (species.preferredSubstrates !== undefined) result.preferred_substrates = species.preferredSubstrates;
  if (species.substrateNotes !== undefined) result.substrate_notes = species.substrateNotes;
  // Growing characteristics
  if (species.difficulty !== undefined) result.difficulty = species.difficulty;
  if (species.characteristics !== undefined) result.characteristics = species.characteristics;
  // Culinary/Usage info
  if (species.flavorProfile !== undefined) result.flavor_profile = species.flavorProfile;
  if (species.culinaryNotes !== undefined) result.culinary_notes = species.culinaryNotes;
  if (species.medicinalProperties !== undefined) result.medicinal_properties = species.medicinalProperties;
  // Community knowledge
  if (species.communityTips !== undefined) result.community_tips = species.communityTips;
  if (species.importantFacts !== undefined) result.important_facts = species.importantFacts;
  // Yield expectations
  if (species.typicalYield !== undefined) result.typical_yield = species.typicalYield;
  if (species.flushCount !== undefined) result.flush_count = species.flushCount;
  // Shelf life
  if (species.shelfLifeDays?.min !== undefined) result.shelf_life_days_min = species.shelfLifeDays.min;
  if (species.shelfLifeDays?.max !== undefined) result.shelf_life_days_max = species.shelfLifeDays.max;
  // Cold storage requirements
  if (species.coldSensitive !== undefined) result.cold_sensitive = species.coldSensitive;
  if (species.minStorageTempC !== undefined) result.min_storage_temp_c = species.minStorageTempC;
  // Automation configuration (JSONB for IoT/sensor integration)
  if (species.automationConfig !== undefined) result.automation_config = species.automationConfig;
  // Stage-specific notes
  if (species.spawnColonizationNotes !== undefined) result.spawn_colonization_notes = species.spawnColonizationNotes;
  if (species.bulkColonizationNotes !== undefined) result.bulk_colonization_notes = species.bulkColonizationNotes;
  if (species.pinningNotes !== undefined) result.pinning_notes = species.pinningNotes;
  if (species.maturationNotes !== undefined) result.maturation_notes = species.maturationNotes;
  if (species.notes !== undefined) result.notes = species.notes;
  if (species.isActive !== undefined) result.is_active = species.isActive;
  if (userId) result.user_id = userId;
  return result;
};

// ============================================================================
// PREPARED SPAWN TRANSFORMATIONS
// ============================================================================

export const transformPreparedSpawnFromDb = (row: any): PreparedSpawn => ({
  id: row.id,
  userId: row.user_id ?? null,

  // Container info
  type: row.type,
  label: row.label,
  containerId: row.container_id || '',
  containerCount: row.container_count || 1,

  // Contents
  grainTypeId: row.grain_type_id,
  recipeId: row.recipe_id,
  volumeMl: row.volume_ml,
  weightGrams: row.weight_grams,

  // Preparation
  prepDate: row.prep_date ? new Date(row.prep_date) : new Date(),
  prepCompletedAt: row.prep_completed_at ? new Date(row.prep_completed_at) : undefined,
  sterilizationDate: row.sterilization_date ? new Date(row.sterilization_date) : undefined,
  sterilizationMethod: row.sterilization_method,
  sterilizationStartedAt: row.sterilization_started_at ? new Date(row.sterilization_started_at) : undefined,
  sterilizationPressurePsi: row.sterilization_pressure_psi,
  sterilizationDurationMins: row.sterilization_duration_mins,
  expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,

  // Cooling/temperature tracking
  coolingStartedAt: row.cooling_started_at ? new Date(row.cooling_started_at) : undefined,
  cooledAt: row.cooled_at ? new Date(row.cooled_at) : undefined,
  currentTempC: row.current_temp_c,
  lastTempUpdateAt: row.last_temp_update_at ? new Date(row.last_temp_update_at) : undefined,
  targetTempC: row.target_temp_c ?? 25,

  // Location & tracking
  locationId: row.location_id || '',
  status: row.status || 'ready',

  // Cost tracking
  productionCost: row.production_cost,
  laborCost: row.labor_cost,
  ingredientsUsed: row.ingredients_used || [],

  // Linkage
  inoculatedAt: row.inoculated_at ? new Date(row.inoculated_at) : undefined,
  resultCultureId: row.result_culture_id,
  resultGrowId: row.result_grow_id,

  // Metadata
  notes: row.notes,
  images: row.images || [],
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  isActive: row.is_active ?? true,

  // Immutability fields
  version: row.version ?? 1,
  recordGroupId: row.record_group_id ?? row.id,
  isCurrent: row.is_current ?? true,
  validFrom: row.valid_from ? new Date(row.valid_from) : undefined,
  validTo: row.valid_to ? new Date(row.valid_to) : undefined,
  supersededById: row.superseded_by_id,
  isArchived: row.is_archived ?? false,
  archivedAt: row.archived_at ? new Date(row.archived_at) : undefined,
  archivedBy: row.archived_by,
  archiveReason: row.archive_reason,
  amendmentType: row.amendment_type ?? 'original',
  amendmentReason: row.amendment_reason,
  amendsRecordId: row.amends_record_id,
  // Notification preferences
  notificationsMuted: row.notifications_muted ?? false,
});

export const transformPreparedSpawnToDb = (spawn: Partial<PreparedSpawn>, userId?: string | null) => {
  const result: Record<string, any> = {};

  // Core fields
  if (spawn.type !== undefined) result.type = spawn.type;
  if (spawn.label !== undefined) result.label = spawn.label;
  if (spawn.containerId !== undefined) result.container_id = toDbId(spawn.containerId);
  if (spawn.containerCount !== undefined) result.container_count = spawn.containerCount;

  // Contents
  if (spawn.grainTypeId !== undefined) result.grain_type_id = toDbId(spawn.grainTypeId);
  if (spawn.recipeId !== undefined) result.recipe_id = toDbId(spawn.recipeId);
  if (spawn.volumeMl !== undefined) result.volume_ml = spawn.volumeMl;
  if (spawn.weightGrams !== undefined) result.weight_grams = spawn.weightGrams;

  // Preparation
  if (spawn.prepDate !== undefined) result.prep_date = spawn.prepDate instanceof Date ? spawn.prepDate.toISOString().split('T')[0] : spawn.prepDate;
  if (spawn.prepCompletedAt !== undefined) result.prep_completed_at = spawn.prepCompletedAt instanceof Date ? spawn.prepCompletedAt.toISOString() : spawn.prepCompletedAt;
  if (spawn.sterilizationDate !== undefined) result.sterilization_date = spawn.sterilizationDate instanceof Date ? spawn.sterilizationDate.toISOString().split('T')[0] : spawn.sterilizationDate;
  if (spawn.sterilizationMethod !== undefined) result.sterilization_method = spawn.sterilizationMethod;
  if (spawn.sterilizationStartedAt !== undefined) result.sterilization_started_at = spawn.sterilizationStartedAt instanceof Date ? spawn.sterilizationStartedAt.toISOString() : spawn.sterilizationStartedAt;
  if (spawn.sterilizationPressurePsi !== undefined) result.sterilization_pressure_psi = spawn.sterilizationPressurePsi;
  if (spawn.sterilizationDurationMins !== undefined) result.sterilization_duration_mins = spawn.sterilizationDurationMins;
  if (spawn.expiresAt !== undefined) result.expires_at = spawn.expiresAt instanceof Date ? spawn.expiresAt.toISOString().split('T')[0] : spawn.expiresAt;

  // Cooling/temperature tracking
  if (spawn.coolingStartedAt !== undefined) result.cooling_started_at = spawn.coolingStartedAt instanceof Date ? spawn.coolingStartedAt.toISOString() : spawn.coolingStartedAt;
  if (spawn.cooledAt !== undefined) result.cooled_at = spawn.cooledAt instanceof Date ? spawn.cooledAt.toISOString() : spawn.cooledAt;
  if (spawn.currentTempC !== undefined) result.current_temp_c = spawn.currentTempC;
  if (spawn.lastTempUpdateAt !== undefined) result.last_temp_update_at = spawn.lastTempUpdateAt instanceof Date ? spawn.lastTempUpdateAt.toISOString() : spawn.lastTempUpdateAt;
  if (spawn.targetTempC !== undefined) result.target_temp_c = spawn.targetTempC;

  // Location & tracking
  if (spawn.locationId !== undefined) result.location_id = toDbId(spawn.locationId);
  if (spawn.status !== undefined) result.status = spawn.status;

  // Cost tracking
  if (spawn.productionCost !== undefined) result.production_cost = spawn.productionCost;
  if (spawn.laborCost !== undefined) result.labor_cost = spawn.laborCost;
  if (spawn.ingredientsUsed !== undefined) result.ingredients_used = spawn.ingredientsUsed;

  // Linkage
  if (spawn.inoculatedAt !== undefined) result.inoculated_at = spawn.inoculatedAt instanceof Date ? spawn.inoculatedAt.toISOString() : spawn.inoculatedAt;
  if (spawn.resultCultureId !== undefined) result.result_culture_id = spawn.resultCultureId;
  if (spawn.resultGrowId !== undefined) result.result_grow_id = spawn.resultGrowId;

  // Metadata
  if (spawn.notes !== undefined) result.notes = spawn.notes;
  if (spawn.images !== undefined) result.images = spawn.images;
  if (spawn.isActive !== undefined) result.is_active = spawn.isActive;
  if (userId) result.user_id = userId;

  // Immutability fields
  if (spawn.version !== undefined) result.version = spawn.version;
  if (spawn.recordGroupId !== undefined) result.record_group_id = spawn.recordGroupId;
  if (spawn.isCurrent !== undefined) result.is_current = spawn.isCurrent;
  if (spawn.validFrom !== undefined) result.valid_from = spawn.validFrom instanceof Date ? spawn.validFrom.toISOString() : spawn.validFrom;
  if (spawn.validTo !== undefined) result.valid_to = spawn.validTo instanceof Date ? spawn.validTo.toISOString() : spawn.validTo;
  if (spawn.supersededById !== undefined) result.superseded_by_id = spawn.supersededById;
  if (spawn.isArchived !== undefined) result.is_archived = spawn.isArchived;
  if (spawn.archivedAt !== undefined) result.archived_at = spawn.archivedAt instanceof Date ? spawn.archivedAt.toISOString() : spawn.archivedAt;
  if (spawn.archivedBy !== undefined) result.archived_by = spawn.archivedBy;
  if (spawn.archiveReason !== undefined) result.archive_reason = spawn.archiveReason;
  if (spawn.amendmentType !== undefined) result.amendment_type = spawn.amendmentType;
  if (spawn.amendmentReason !== undefined) result.amendment_reason = spawn.amendmentReason;
  if (spawn.amendsRecordId !== undefined) result.amends_record_id = spawn.amendsRecordId;

  // Notification preferences
  if (spawn.notificationsMuted !== undefined) result.notifications_muted = spawn.notificationsMuted;

  // Linkage to GrainSpawn
  if (spawn.resultGrainSpawnId !== undefined) result.result_grain_spawn_id = spawn.resultGrainSpawnId;

  return result;
};

// ============================================================================
// GRAIN SPAWN TRANSFORMATIONS
// Inoculated grain going through colonization lifecycle
// ============================================================================

export const transformGrainSpawnFromDb = (row: any): GrainSpawn => ({
  id: row.id,
  userId: row.user_id ?? null,

  // Identification
  label: row.label,
  strainId: row.strain_id || '',

  // Source information
  sourcePreparedSpawnId: row.source_prepared_spawn_id,
  sourceCultureId: row.source_culture_id,
  sourceType: row.source_type || 'liquid_culture',

  // Container info
  containerId: row.container_id || '',
  containerCount: row.container_count || 1,
  grainTypeId: row.grain_type_id,
  weightGrams: row.weight_grams,

  // Inoculation details
  inoculatedAt: row.inoculated_at ? new Date(row.inoculated_at) : new Date(),
  inoculationVolumeMl: row.inoculation_volume_ml,
  inoculationUnits: row.inoculation_units,
  inoculationUnit: row.inoculation_unit || 'ml',

  // Location
  locationId: row.location_id || '',

  // Colonization lifecycle
  status: row.status || 'inoculated',
  colonizationProgress: row.colonization_progress || 0,

  // Shake tracking
  shakeCount: row.shake_count || 0,
  lastShakeAt: row.last_shake_at ? new Date(row.last_shake_at) : undefined,

  // Milestone dates
  firstGrowthAt: row.first_growth_at ? new Date(row.first_growth_at) : undefined,
  fullyColonizedAt: row.fully_colonized_at ? new Date(row.fully_colonized_at) : undefined,
  spawnedAt: row.spawned_at ? new Date(row.spawned_at) : undefined,

  // Expiration
  expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,

  // Output tracking
  resultGrowIds: row.result_grow_ids || [],

  // Cost tracking
  productionCost: row.production_cost,
  sourceCultureCost: row.source_culture_cost,

  // Workflow metadata
  requiresSterileEnvironment: row.requires_sterile_environment ?? false,
  workflowStage: row.workflow_stage || 'sterile_work',

  // General
  notes: row.notes,
  images: row.images || [],
  isActive: row.is_active ?? true,
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),

  // Immutability fields
  version: row.version ?? 1,
  recordGroupId: row.record_group_id ?? row.id,
  isCurrent: row.is_current ?? true,
  validFrom: row.valid_from ? new Date(row.valid_from) : undefined,
  validTo: row.valid_to ? new Date(row.valid_to) : undefined,
  supersededById: row.superseded_by_id,
  isArchived: row.is_archived ?? false,
  archivedAt: row.archived_at ? new Date(row.archived_at) : undefined,
  archivedBy: row.archived_by,
  archiveReason: row.archive_reason,
  amendmentType: row.amendment_type ?? 'original',
  amendmentReason: row.amendment_reason,
  amendsRecordId: row.amends_record_id,

  // Notification preferences
  notificationsMuted: row.notifications_muted ?? false,
});

export const transformGrainSpawnToDb = (grainSpawn: Partial<GrainSpawn>, userId?: string | null) => {
  const result: Record<string, any> = {};

  // Identification
  if (grainSpawn.label !== undefined) result.label = grainSpawn.label;
  if (grainSpawn.strainId !== undefined) result.strain_id = toDbId(grainSpawn.strainId);

  // Source information
  if (grainSpawn.sourcePreparedSpawnId !== undefined) result.source_prepared_spawn_id = grainSpawn.sourcePreparedSpawnId;
  if (grainSpawn.sourceCultureId !== undefined) result.source_culture_id = grainSpawn.sourceCultureId;
  if (grainSpawn.sourceType !== undefined) result.source_type = grainSpawn.sourceType;

  // Container info
  if (grainSpawn.containerId !== undefined) result.container_id = toDbId(grainSpawn.containerId);
  if (grainSpawn.containerCount !== undefined) result.container_count = grainSpawn.containerCount;
  if (grainSpawn.grainTypeId !== undefined) result.grain_type_id = toDbId(grainSpawn.grainTypeId);
  if (grainSpawn.weightGrams !== undefined) result.weight_grams = grainSpawn.weightGrams;

  // Inoculation details
  if (grainSpawn.inoculatedAt !== undefined) result.inoculated_at = grainSpawn.inoculatedAt instanceof Date ? grainSpawn.inoculatedAt.toISOString() : grainSpawn.inoculatedAt;
  if (grainSpawn.inoculationVolumeMl !== undefined) result.inoculation_volume_ml = grainSpawn.inoculationVolumeMl;
  if (grainSpawn.inoculationUnits !== undefined) result.inoculation_units = grainSpawn.inoculationUnits;
  if (grainSpawn.inoculationUnit !== undefined) result.inoculation_unit = grainSpawn.inoculationUnit;

  // Location
  if (grainSpawn.locationId !== undefined) result.location_id = toDbId(grainSpawn.locationId);

  // Colonization lifecycle
  if (grainSpawn.status !== undefined) result.status = grainSpawn.status;
  if (grainSpawn.colonizationProgress !== undefined) result.colonization_progress = grainSpawn.colonizationProgress;

  // Shake tracking
  if (grainSpawn.shakeCount !== undefined) result.shake_count = grainSpawn.shakeCount;
  if (grainSpawn.lastShakeAt !== undefined) result.last_shake_at = grainSpawn.lastShakeAt instanceof Date ? grainSpawn.lastShakeAt.toISOString() : grainSpawn.lastShakeAt;

  // Milestone dates
  if (grainSpawn.firstGrowthAt !== undefined) result.first_growth_at = grainSpawn.firstGrowthAt instanceof Date ? grainSpawn.firstGrowthAt.toISOString() : grainSpawn.firstGrowthAt;
  if (grainSpawn.fullyColonizedAt !== undefined) result.fully_colonized_at = grainSpawn.fullyColonizedAt instanceof Date ? grainSpawn.fullyColonizedAt.toISOString() : grainSpawn.fullyColonizedAt;
  if (grainSpawn.spawnedAt !== undefined) result.spawned_at = grainSpawn.spawnedAt instanceof Date ? grainSpawn.spawnedAt.toISOString() : grainSpawn.spawnedAt;

  // Expiration
  if (grainSpawn.expiresAt !== undefined) result.expires_at = grainSpawn.expiresAt instanceof Date ? grainSpawn.expiresAt.toISOString().split('T')[0] : grainSpawn.expiresAt;

  // Output tracking
  if (grainSpawn.resultGrowIds !== undefined) result.result_grow_ids = grainSpawn.resultGrowIds;

  // Cost tracking
  if (grainSpawn.productionCost !== undefined) result.production_cost = grainSpawn.productionCost;
  if (grainSpawn.sourceCultureCost !== undefined) result.source_culture_cost = grainSpawn.sourceCultureCost;

  // Workflow metadata
  if (grainSpawn.requiresSterileEnvironment !== undefined) result.requires_sterile_environment = grainSpawn.requiresSterileEnvironment;
  if (grainSpawn.workflowStage !== undefined) result.workflow_stage = grainSpawn.workflowStage;

  // General
  if (grainSpawn.notes !== undefined) result.notes = grainSpawn.notes;
  if (grainSpawn.images !== undefined) result.images = grainSpawn.images;
  if (grainSpawn.isActive !== undefined) result.is_active = grainSpawn.isActive;
  if (userId) result.user_id = userId;

  // Immutability fields
  if (grainSpawn.version !== undefined) result.version = grainSpawn.version;
  if (grainSpawn.recordGroupId !== undefined) result.record_group_id = grainSpawn.recordGroupId;
  if (grainSpawn.isCurrent !== undefined) result.is_current = grainSpawn.isCurrent;
  if (grainSpawn.validFrom !== undefined) result.valid_from = grainSpawn.validFrom instanceof Date ? grainSpawn.validFrom.toISOString() : grainSpawn.validFrom;
  if (grainSpawn.validTo !== undefined) result.valid_to = grainSpawn.validTo instanceof Date ? grainSpawn.validTo.toISOString() : grainSpawn.validTo;
  if (grainSpawn.supersededById !== undefined) result.superseded_by_id = grainSpawn.supersededById;
  if (grainSpawn.isArchived !== undefined) result.is_archived = grainSpawn.isArchived;
  if (grainSpawn.archivedAt !== undefined) result.archived_at = grainSpawn.archivedAt instanceof Date ? grainSpawn.archivedAt.toISOString() : grainSpawn.archivedAt;
  if (grainSpawn.archivedBy !== undefined) result.archived_by = grainSpawn.archivedBy;
  if (grainSpawn.archiveReason !== undefined) result.archive_reason = grainSpawn.archiveReason;
  if (grainSpawn.amendmentType !== undefined) result.amendment_type = grainSpawn.amendmentType;
  if (grainSpawn.amendmentReason !== undefined) result.amendment_reason = grainSpawn.amendmentReason;
  if (grainSpawn.amendsRecordId !== undefined) result.amends_record_id = grainSpawn.amendsRecordId;

  // Notification preferences
  if (grainSpawn.notificationsMuted !== undefined) result.notifications_muted = grainSpawn.notificationsMuted;

  return result;
};

// ============================================================================
// GRAIN SPAWN OBSERVATION TRANSFORMATIONS
// ============================================================================

export const transformGrainSpawnObservationFromDb = (row: any): GrainSpawnObservation => ({
  id: row.id,
  grainSpawnId: row.grain_spawn_id,
  date: row.date ? new Date(row.date) : new Date(),
  type: row.type || 'general',
  title: row.title,
  notes: row.notes,
  colonizationPercent: row.colonization_percent,
  temperature: row.temperature,
  humidity: row.humidity,
  images: row.images || [],
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  userId: row.user_id,
});

export const transformGrainSpawnObservationToDb = (obs: Partial<GrainSpawnObservation>, userId?: string | null) => {
  const result: Record<string, any> = {};

  if (obs.grainSpawnId !== undefined) result.grain_spawn_id = obs.grainSpawnId;
  if (obs.date !== undefined) result.date = obs.date instanceof Date ? obs.date.toISOString() : obs.date;
  if (obs.type !== undefined) result.type = obs.type;
  if (obs.title !== undefined) result.title = obs.title;
  if (obs.notes !== undefined) result.notes = obs.notes;
  if (obs.colonizationPercent !== undefined) result.colonization_percent = obs.colonizationPercent;
  if (obs.temperature !== undefined) result.temperature = obs.temperature;
  if (obs.humidity !== undefined) result.humidity = obs.humidity;
  if (obs.images !== undefined) result.images = obs.images;
  if (userId) result.user_id = userId;

  return result;
};

// ============================================================================
// ENTITY OUTCOME TRANSFORMATIONS
// Historical tracking for disposed/completed entities
// ============================================================================

export const transformEntityOutcomeFromDb = (row: any): EntityOutcome => ({
  id: row.id,
  entityType: row.entity_type,
  entityId: row.entity_id,
  entityName: row.entity_name,
  outcomeCategory: row.outcome_category,
  outcomeCode: row.outcome_code,
  outcomeLabel: row.outcome_label,
  startedAt: row.started_at ? new Date(row.started_at) : undefined,
  endedAt: new Date(row.ended_at),
  durationDays: row.duration_days,
  totalCost: row.total_cost ? parseFloat(row.total_cost) : undefined,
  totalRevenue: row.total_revenue ? parseFloat(row.total_revenue) : undefined,
  costPerUnit: row.cost_per_unit ? parseFloat(row.cost_per_unit) : undefined,
  totalYieldWet: row.total_yield_wet ? parseFloat(row.total_yield_wet) : undefined,
  totalYieldDry: row.total_yield_dry ? parseFloat(row.total_yield_dry) : undefined,
  biologicalEfficiency: row.biological_efficiency ? parseFloat(row.biological_efficiency) : undefined,
  flushCount: row.flush_count,
  strainId: row.strain_id,
  strainName: row.strain_name,
  speciesId: row.species_id,
  speciesName: row.species_name,
  locationId: row.location_id,
  locationName: row.location_name,
  surveyResponses: row.survey_responses,
  notes: row.notes,
  createdAt: new Date(row.created_at),
});

// ============================================================================
// IMMUTABLE HISTORY TRANSFORMATIONS
// Append-only audit trail tables
// ============================================================================

import {
  ObservationHistoryEntry,
  HarvestHistoryEntry,
  TransferHistoryEntry,
  StageTransitionEntry,
  DataAmendmentLogEntry,
  BulkOperation,
} from './types';

export const transformObservationHistoryFromDb = (row: any): ObservationHistoryEntry => ({
  id: row.id,
  entityType: row.entity_type,
  entityId: row.entity_id,
  entityRecordGroupId: row.entity_record_group_id,
  observedAt: new Date(row.observed_at),
  observationType: row.observation_type,
  title: row.title,
  notes: row.notes,
  temperature: row.temperature ? parseFloat(row.temperature) : undefined,
  humidity: row.humidity ? parseFloat(row.humidity) : undefined,
  co2Ppm: row.co2_ppm,
  colonizationPercent: row.colonization_percent,
  healthRating: row.health_rating,
  stage: row.stage,
  images: row.images || [],
  recordedAt: new Date(row.recorded_at),
  recordedBy: row.recorded_by,
  isCurrent: row.is_current ?? true,
  supersededById: row.superseded_by_id,
  amendmentReason: row.amendment_reason,
  userId: row.user_id,
  createdAt: new Date(row.created_at),
});

export const transformObservationHistoryToDb = (obs: Partial<ObservationHistoryEntry>, userId?: string) => {
  const result: Record<string, any> = {};
  if (obs.entityType !== undefined) result.entity_type = obs.entityType;
  if (obs.entityId !== undefined) result.entity_id = obs.entityId;
  if (obs.entityRecordGroupId !== undefined) result.entity_record_group_id = obs.entityRecordGroupId;
  if (obs.observedAt !== undefined) result.observed_at = obs.observedAt instanceof Date ? obs.observedAt.toISOString() : obs.observedAt;
  if (obs.observationType !== undefined) result.observation_type = obs.observationType;
  if (obs.title !== undefined) result.title = obs.title;
  if (obs.notes !== undefined) result.notes = obs.notes;
  if (obs.temperature !== undefined) result.temperature = obs.temperature;
  if (obs.humidity !== undefined) result.humidity = obs.humidity;
  if (obs.co2Ppm !== undefined) result.co2_ppm = obs.co2Ppm;
  if (obs.colonizationPercent !== undefined) result.colonization_percent = obs.colonizationPercent;
  if (obs.healthRating !== undefined) result.health_rating = obs.healthRating;
  if (obs.stage !== undefined) result.stage = obs.stage;
  if (obs.images !== undefined) result.images = obs.images;
  if (obs.isCurrent !== undefined) result.is_current = obs.isCurrent;
  if (obs.supersededById !== undefined) result.superseded_by_id = obs.supersededById;
  if (obs.amendmentReason !== undefined) result.amendment_reason = obs.amendmentReason;
  if (userId) result.user_id = userId;
  return result;
};

export const transformHarvestHistoryFromDb = (row: any): HarvestHistoryEntry => ({
  id: row.id,
  growId: row.grow_id,
  growRecordGroupId: row.grow_record_group_id,
  flushNumber: row.flush_number,
  harvestDate: new Date(row.harvest_date),
  wetWeightG: row.wet_weight_g ? parseFloat(row.wet_weight_g) : undefined,
  dryWeightG: row.dry_weight_g ? parseFloat(row.dry_weight_g) : undefined,
  mushroomCount: row.mushroom_count,
  quality: row.quality,
  notes: row.notes,
  images: row.images || [],
  recordedAt: new Date(row.recorded_at),
  recordedBy: row.recorded_by,
  isCurrent: row.is_current ?? true,
  supersededById: row.superseded_by_id,
  amendmentReason: row.amendment_reason,
  userId: row.user_id,
  createdAt: new Date(row.created_at),
});

export const transformHarvestHistoryToDb = (harvest: Partial<HarvestHistoryEntry>, userId?: string) => {
  const result: Record<string, any> = {};
  if (harvest.growId !== undefined) result.grow_id = harvest.growId;
  if (harvest.growRecordGroupId !== undefined) result.grow_record_group_id = harvest.growRecordGroupId;
  if (harvest.flushNumber !== undefined) result.flush_number = harvest.flushNumber;
  if (harvest.harvestDate !== undefined) result.harvest_date = harvest.harvestDate instanceof Date ? harvest.harvestDate.toISOString().split('T')[0] : harvest.harvestDate;
  if (harvest.wetWeightG !== undefined) result.wet_weight_g = harvest.wetWeightG;
  if (harvest.dryWeightG !== undefined) result.dry_weight_g = harvest.dryWeightG;
  if (harvest.mushroomCount !== undefined) result.mushroom_count = harvest.mushroomCount;
  if (harvest.quality !== undefined) result.quality = harvest.quality;
  if (harvest.notes !== undefined) result.notes = harvest.notes;
  if (harvest.images !== undefined) result.images = harvest.images;
  if (harvest.isCurrent !== undefined) result.is_current = harvest.isCurrent;
  if (harvest.supersededById !== undefined) result.superseded_by_id = harvest.supersededById;
  if (harvest.amendmentReason !== undefined) result.amendment_reason = harvest.amendmentReason;
  if (userId) result.user_id = userId;
  return result;
};

export const transformTransferHistoryFromDb = (row: any): TransferHistoryEntry => ({
  id: row.id,
  fromCultureId: row.from_culture_id,
  fromCultureRecordGroupId: row.from_culture_record_group_id,
  toEntityType: row.to_entity_type,
  toEntityId: row.to_entity_id,
  toEntityRecordGroupId: row.to_entity_record_group_id,
  transferDate: new Date(row.transfer_date),
  quantity: parseFloat(row.quantity),
  unit: row.unit,
  notes: row.notes,
  recordedAt: new Date(row.recorded_at),
  recordedBy: row.recorded_by,
  isCurrent: row.is_current ?? true,
  supersededById: row.superseded_by_id,
  amendmentReason: row.amendment_reason,
  userId: row.user_id,
  createdAt: new Date(row.created_at),
});

export const transformTransferHistoryToDb = (transfer: Partial<TransferHistoryEntry>, userId?: string) => {
  const result: Record<string, any> = {};
  if (transfer.fromCultureId !== undefined) result.from_culture_id = transfer.fromCultureId;
  if (transfer.fromCultureRecordGroupId !== undefined) result.from_culture_record_group_id = transfer.fromCultureRecordGroupId;
  if (transfer.toEntityType !== undefined) result.to_entity_type = transfer.toEntityType;
  if (transfer.toEntityId !== undefined) result.to_entity_id = transfer.toEntityId;
  if (transfer.toEntityRecordGroupId !== undefined) result.to_entity_record_group_id = transfer.toEntityRecordGroupId;
  if (transfer.transferDate !== undefined) result.transfer_date = transfer.transferDate instanceof Date ? transfer.transferDate.toISOString() : transfer.transferDate;
  if (transfer.quantity !== undefined) result.quantity = transfer.quantity;
  if (transfer.unit !== undefined) result.unit = transfer.unit;
  if (transfer.notes !== undefined) result.notes = transfer.notes;
  if (transfer.isCurrent !== undefined) result.is_current = transfer.isCurrent;
  if (transfer.supersededById !== undefined) result.superseded_by_id = transfer.supersededById;
  if (transfer.amendmentReason !== undefined) result.amendment_reason = transfer.amendmentReason;
  if (userId) result.user_id = userId;
  return result;
};

export const transformStageTransitionFromDb = (row: any): StageTransitionEntry => ({
  id: row.id,
  entityType: row.entity_type,
  entityId: row.entity_id,
  entityRecordGroupId: row.entity_record_group_id,
  fromStage: row.from_stage,
  toStage: row.to_stage,
  transitionedAt: new Date(row.transitioned_at),
  notes: row.notes,
  trigger: row.trigger,
  recordedAt: new Date(row.recorded_at),
  recordedBy: row.recorded_by,
  userId: row.user_id,
  createdAt: new Date(row.created_at),
});

export const transformStageTransitionToDb = (transition: Partial<StageTransitionEntry>, userId?: string) => {
  const result: Record<string, any> = {};
  if (transition.entityType !== undefined) result.entity_type = transition.entityType;
  if (transition.entityId !== undefined) result.entity_id = transition.entityId;
  if (transition.entityRecordGroupId !== undefined) result.entity_record_group_id = transition.entityRecordGroupId;
  if (transition.fromStage !== undefined) result.from_stage = transition.fromStage;
  if (transition.toStage !== undefined) result.to_stage = transition.toStage;
  if (transition.transitionedAt !== undefined) result.transitioned_at = transition.transitionedAt instanceof Date ? transition.transitionedAt.toISOString() : transition.transitionedAt;
  if (transition.notes !== undefined) result.notes = transition.notes;
  if (transition.trigger !== undefined) result.trigger = transition.trigger;
  if (userId) result.user_id = userId;
  return result;
};

export const transformDataAmendmentLogFromDb = (row: any): DataAmendmentLogEntry => ({
  id: row.id,
  entityType: row.entity_type,
  originalRecordId: row.original_record_id,
  newRecordId: row.new_record_id,
  recordGroupId: row.record_group_id,
  amendmentType: row.amendment_type,
  reason: row.reason,
  changesSummary: row.changes_summary,
  bulkOperationId: row.bulk_operation_id,
  amendedAt: new Date(row.amended_at),
  amendedBy: row.amended_by,
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
  userId: row.user_id,
  createdAt: new Date(row.created_at),
});

export const transformBulkOperationFromDb = (row: any): BulkOperation => ({
  id: row.id,
  operationType: row.operation_type,
  entityType: row.entity_type,
  recordCount: row.record_count,
  sourceDescription: row.source_description,
  startedAt: new Date(row.started_at),
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  status: row.status,
  errorMessage: row.error_message,
  userId: row.user_id,
  createdAt: new Date(row.created_at),
});

// ============================================================================
// LAB ITEM INSTANCE TRANSFORMATIONS
// ============================================================================

export const transformLabItemInstanceFromDb = (row: any): LabItemInstance => ({
  id: row.id,
  inventoryItemId: row.inventory_item_id,
  inventoryLotId: row.inventory_lot_id,
  instanceNumber: row.instance_number || 1,
  label: row.label,
  status: row.status || 'available',
  usageRef: row.usage_ref ? JSON.parse(row.usage_ref) : undefined,
  unitCost: parseFloat(row.unit_cost) || 0,
  acquisitionDate: new Date(row.acquisition_date),
  usageCount: row.usage_count || 0,
  lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
  lastCleanedAt: row.last_cleaned_at ? new Date(row.last_cleaned_at) : undefined,
  lastSterilizedAt: row.last_sterilized_at ? new Date(row.last_sterilized_at) : undefined,
  locationId: row.location_id,
  conditionNotes: row.condition_notes,
  images: row.images || [],
  notes: row.notes,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  isActive: row.is_active ?? true,
});

export const transformLabItemInstanceToDb = (instance: Partial<LabItemInstance>, userId?: string) => {
  const result: Record<string, any> = {};
  if (instance.inventoryItemId !== undefined) result.inventory_item_id = instance.inventoryItemId;
  if (instance.inventoryLotId !== undefined) result.inventory_lot_id = instance.inventoryLotId;
  if (instance.instanceNumber !== undefined) result.instance_number = instance.instanceNumber;
  if (instance.label !== undefined) result.label = instance.label;
  if (instance.status !== undefined) result.status = instance.status;
  if (instance.usageRef !== undefined) result.usage_ref = JSON.stringify(instance.usageRef);
  if (instance.unitCost !== undefined) result.unit_cost = instance.unitCost;
  if (instance.acquisitionDate !== undefined) result.acquisition_date = instance.acquisitionDate instanceof Date ? instance.acquisitionDate.toISOString() : instance.acquisitionDate;
  if (instance.usageCount !== undefined) result.usage_count = instance.usageCount;
  if (instance.lastUsedAt !== undefined) result.last_used_at = instance.lastUsedAt instanceof Date ? instance.lastUsedAt.toISOString() : instance.lastUsedAt;
  if (instance.lastCleanedAt !== undefined) result.last_cleaned_at = instance.lastCleanedAt instanceof Date ? instance.lastCleanedAt.toISOString() : instance.lastCleanedAt;
  if (instance.lastSterilizedAt !== undefined) result.last_sterilized_at = instance.lastSterilizedAt instanceof Date ? instance.lastSterilizedAt.toISOString() : instance.lastSterilizedAt;
  if (instance.locationId !== undefined) result.location_id = instance.locationId;
  if (instance.conditionNotes !== undefined) result.condition_notes = instance.conditionNotes;
  if (instance.images !== undefined) result.images = instance.images;
  if (instance.notes !== undefined) result.notes = instance.notes;
  if (instance.isActive !== undefined) result.is_active = instance.isActive;
  if (userId) result.user_id = userId;
  return result;
};
