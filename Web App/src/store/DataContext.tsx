// ============================================================================
// DATA CONTEXT - SUPABASE INTEGRATED
// Central state management with cloud sync
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DataStoreState, LookupHelpers,
  Species, Strain, Location, LocationType, LocationClassification, Vessel, ContainerType, SubstrateType, Supplier,
  InventoryCategory, InventoryItem, InventoryLot, InventoryUsage, PurchaseOrder, PurchaseOrderItem,
  Culture, Grow, Recipe, AppSettings,
  CultureObservation, CultureTransfer, GrowObservation, Flush, GrowStage,
  RecipeCategoryItem, GrainType, LotStatus, OrderStatus, PaymentStatus, UsageType
} from './types';
import { 
  supabase, 
  ensureSession, 
  getCurrentUserId,
  getLocalSettings, 
  saveLocalSettings,
  LocalSettings 
} from '../lib/supabase';

// ============================================================================
// EMPTY INITIAL STATE (no sample data)
// ============================================================================

// Default recipe categories (built-in, shown for all users)
const defaultRecipeCategories: RecipeCategoryItem[] = [
  { id: 'default-agar', name: 'Agar Media', code: 'agar', icon: '🧫', color: 'text-purple-400 bg-purple-950/50', isActive: true },
  { id: 'default-lc', name: 'Liquid Culture', code: 'liquid_culture', icon: '💧', color: 'text-blue-400 bg-blue-950/50', isActive: true },
  { id: 'default-grain', name: 'Grain Spawn', code: 'grain_spawn', icon: '🌾', color: 'text-amber-400 bg-amber-950/50', isActive: true },
  { id: 'default-bulk', name: 'Bulk Substrate', code: 'bulk_substrate', icon: '🪵', color: 'text-emerald-400 bg-emerald-950/50', isActive: true },
  { id: 'default-casing', name: 'Casing Layer', code: 'casing', icon: '🧱', color: 'text-orange-400 bg-orange-950/50', isActive: true },
  { id: 'default-other', name: 'Other', code: 'other', icon: '📦', color: 'text-zinc-400 bg-zinc-800', isActive: true },
];

// Default grain types (built-in spawn grain options)
const defaultGrainTypes: GrainType[] = [
  { id: 'default-oat', name: 'Oat Groats', code: 'oat_groats', isActive: true },
  { id: 'default-rye', name: 'Rye Berries', code: 'rye_berries', isActive: true },
  { id: 'default-wheat', name: 'Wheat Berries', code: 'wheat', isActive: true },
  { id: 'default-millet', name: 'Millet', code: 'millet', isActive: true },
  { id: 'default-popcorn', name: 'Popcorn', code: 'popcorn', isActive: true },
  { id: 'default-brf', name: 'Brown Rice Flour (BRF)', code: 'brf', isActive: true },
  { id: 'default-wbs', name: 'Wild Bird Seed', code: 'wbs', isActive: true },
  { id: 'default-sorghum', name: 'Sorghum', code: 'sorghum', isActive: true },
];

// Default location types (built-in, customizable by user)
const defaultLocationTypes: LocationType[] = [
  { id: 'default-incubation', name: 'Incubation', code: 'incubation', description: 'Warm, dark area for colonization', isActive: true },
  { id: 'default-fruiting', name: 'Fruiting', code: 'fruiting', description: 'Humid environment with FAE for pinning and growth', isActive: true },
  { id: 'default-storage', name: 'Storage', code: 'storage', description: 'General storage area', isActive: true },
  { id: 'default-lab', name: 'Lab', code: 'lab', description: 'Clean lab area for sterile work', isActive: true },
  { id: 'default-cold-storage', name: 'Cold Storage', code: 'cold_storage', description: 'Refrigerated storage for cultures and supplies', isActive: true },
  { id: 'default-drying', name: 'Drying', code: 'drying', description: 'Area for drying harvested mushrooms', isActive: true },
  { id: 'default-other', name: 'Other', code: 'other', description: 'Other location type', isActive: true },
];

// Default location classifications (built-in, customizable by user)
const defaultLocationClassifications: LocationClassification[] = [
  { id: 'default-clean-room', name: 'Clean Room', code: 'clean_room', description: 'Sterile/clean environment', isActive: true },
  { id: 'default-greenhouse', name: 'Greenhouse', code: 'greenhouse', description: 'Greenhouse or grow tent', isActive: true },
  { id: 'default-indoor', name: 'Indoor', code: 'indoor', description: 'Indoor room or closet', isActive: true },
  { id: 'default-outdoor', name: 'Outdoor', code: 'outdoor', description: 'Outdoor growing area', isActive: true },
  { id: 'default-basement', name: 'Basement', code: 'basement', description: 'Basement or cellar', isActive: true },
  { id: 'default-garage', name: 'Garage', code: 'garage', description: 'Garage or workshop', isActive: true },
  { id: 'default-shed', name: 'Shed', code: 'shed', description: 'Outdoor shed or outbuilding', isActive: true },
  { id: 'default-tent', name: 'Grow Tent', code: 'grow_tent', description: 'Enclosed grow tent', isActive: true },
  { id: 'default-chamber', name: 'Fruiting Chamber', code: 'fruiting_chamber', description: 'Dedicated fruiting chamber (SGFC, monotub, etc.)', isActive: true },
];

const emptyState: DataStoreState = {
  species: [],
  strains: [],
  locations: [],
  locationTypes: [...defaultLocationTypes],
  locationClassifications: [...defaultLocationClassifications],
  vessels: [],
  containerTypes: [],
  substrateTypes: [],
  suppliers: [],
  inventoryCategories: [],
  recipeCategories: [...defaultRecipeCategories],
  grainTypes: [...defaultGrainTypes],
  inventoryItems: [],
  inventoryLots: [],
  inventoryUsages: [],
  purchaseOrders: [],
  cultures: [],
  grows: [],
  recipes: [],
  settings: {
    defaultUnits: 'metric',
    defaultCurrency: 'USD',
    altitude: 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago',
    notifications: {
      enabled: true,
      harvestReminders: true,
      lowStockAlerts: true,
      contaminationAlerts: true,
    },
  },
};

// ============================================================================
// SUPABASE CLIENT HELPER
// ============================================================================

// Use the centralized supabase client from lib/supabase.ts
// Security: No longer reading credentials from localStorage
const getSupabaseClient = (): SupabaseClient | null => {
  return supabase;
};

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================

// Transform Strain from DB format
const transformStrainFromDb = (row: any): Strain => ({
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

// Transform Strain to DB format
const transformStrainToDb = (strain: Partial<Strain>, userId?: string | null) => ({
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

// Transform LocationType from DB format
const transformLocationTypeFromDb = (row: any): LocationType => ({
  id: row.id,
  name: row.name,
  code: row.code || row.name?.toLowerCase().replace(/\s+/g, '_'),
  description: row.description,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

// Transform LocationType to DB format
const transformLocationTypeToDb = (lt: Partial<LocationType>, userId?: string | null) => ({
  name: lt.name,
  code: lt.code,
  description: lt.description,
  notes: lt.notes,
  is_active: lt.isActive,
  ...(userId && { user_id: userId }),
});

// Transform LocationClassification from DB format
const transformLocationClassificationFromDb = (row: any): LocationClassification => ({
  id: row.id,
  name: row.name,
  code: row.code || row.name?.toLowerCase().replace(/\s+/g, '_'),
  description: row.description,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

// Transform LocationClassification to DB format
const transformLocationClassificationToDb = (lc: Partial<LocationClassification>, userId?: string | null) => ({
  name: lc.name,
  code: lc.code,
  description: lc.description,
  notes: lc.notes,
  is_active: lc.isActive,
  ...(userId && { user_id: userId }),
});

// Transform Location from DB format
const transformLocationFromDb = (row: any): Location => ({
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

// Helper to filter out default IDs (not valid UUIDs for DB)
const toDbId = (id: string | undefined): string | null => {
  if (!id || id.startsWith('default-')) return null;
  return id;
};

// Transform Location to DB format
const transformLocationToDb = (location: Partial<Location>, userId?: string | null) => ({
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

// Transform Vessel from DB format
const transformVesselFromDb = (row: any): Vessel => ({
  id: row.id,
  name: row.name,
  type: row.type || 'jar',
  volumeMl: row.volume_ml,
  isReusable: row.is_reusable ?? true,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

// Transform Vessel to DB format
const transformVesselToDb = (vessel: Partial<Vessel>, userId?: string | null) => ({
  name: vessel.name,
  type: vessel.type,
  volume_ml: vessel.volumeMl,
  is_reusable: vessel.isReusable,
  notes: vessel.notes,
  is_active: vessel.isActive,
  ...(userId && { user_id: userId }),
});

// Transform ContainerType from DB format
const transformContainerTypeFromDb = (row: any): ContainerType => ({
  id: row.id,
  name: row.name,
  category: row.category || 'tub',
  volumeL: row.volume_l ? parseFloat(row.volume_l) : undefined,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

// Transform ContainerType to DB format
const transformContainerTypeToDb = (ct: Partial<ContainerType>, userId?: string | null) => ({
  name: ct.name,
  category: ct.category,
  volume_l: ct.volumeL,
  notes: ct.notes,
  is_active: ct.isActive,
  ...(userId && { user_id: userId }),
});

// Transform SubstrateType from DB format
const transformSubstrateTypeFromDb = (row: any): SubstrateType => ({
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

// Transform SubstrateType to DB format
const transformSubstrateTypeToDb = (st: Partial<SubstrateType>, userId?: string | null) => ({
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

// Transform InventoryCategory from DB format
const transformInventoryCategoryFromDb = (row: any): InventoryCategory => ({
  id: row.id,
  name: row.name,
  color: row.color || '#6b7280',
  icon: row.icon,
  isActive: row.is_active ?? true,
});

// Transform InventoryCategory to DB format
const transformInventoryCategoryToDb = (cat: Partial<InventoryCategory>, userId?: string | null) => ({
  name: cat.name,
  color: cat.color,
  icon: cat.icon,
  is_active: cat.isActive,
  ...(userId && { user_id: userId }),
});

// Transform RecipeCategoryItem from DB format
const transformRecipeCategoryFromDb = (row: any): RecipeCategoryItem => ({
  id: row.id,
  name: row.name,
  code: row.code,
  icon: row.icon || '📦',
  color: row.color || 'text-zinc-400 bg-zinc-800',
  isActive: row.is_active ?? true,
});

// Transform RecipeCategoryItem to DB format
const transformRecipeCategoryToDb = (cat: Partial<RecipeCategoryItem>, userId?: string | null) => ({
  name: cat.name,
  code: cat.code,
  icon: cat.icon,
  color: cat.color,
  is_active: cat.isActive,
  ...(userId && { user_id: userId }),
});

// Transform Culture from DB format
const transformCultureFromDb = (row: any): Culture => ({
  id: row.id,
  type: row.type,
  label: row.label,
  strainId: row.strain_id,
  status: row.status || 'active',
  parentId: row.parent_id,
  generation: row.generation || 0,
  locationId: row.location_id,
  vesselId: row.vessel_id,
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

// Transform Culture to DB format
const transformCultureToDb = (culture: Partial<Culture>) => {
  const result: Record<string, any> = {};
  if (culture.type !== undefined) result.type = culture.type;
  if (culture.label !== undefined) result.label = culture.label;
  if (culture.strainId !== undefined) result.strain_id = culture.strainId;
  if (culture.status !== undefined) result.status = culture.status;
  if (culture.parentId !== undefined) result.parent_id = culture.parentId;
  if (culture.generation !== undefined) result.generation = culture.generation;
  if (culture.locationId !== undefined) result.location_id = culture.locationId;
  if (culture.vesselId !== undefined) result.vessel_id = culture.vesselId;
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

// Transform Grow from DB format
const transformGrowFromDb = (row: any): Grow => ({
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
  containerTypeId: row.container_type_id,
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

// Transform Grow to DB format
const transformGrowToDb = (grow: Partial<Grow>) => {
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
  if (grow.containerTypeId !== undefined) result.container_type_id = grow.containerTypeId;
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

// Transform Recipe from DB format
const transformRecipeFromDb = (row: any): Recipe => ({
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
  notes: row.notes,
  isActive: row.is_active ?? true,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Transform Recipe to DB format
const transformRecipeToDb = (recipe: Partial<Recipe>) => {
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
  if (recipe.notes !== undefined) result.notes = recipe.notes;
  if (recipe.isActive !== undefined) result.is_active = recipe.isActive;
  return result;
};

// Transform Supplier from DB format
const transformSupplierFromDb = (row: any): Supplier => ({
  id: row.id,
  name: row.name,
  website: row.website,
  email: row.email,
  phone: row.phone,
  notes: row.notes,
  isActive: row.is_active ?? true,
});

// Transform Supplier to DB format
const transformSupplierToDb = (supplier: Partial<Supplier>, userId?: string | null) => ({
  name: supplier.name,
  website: supplier.website,
  email: supplier.email,
  phone: supplier.phone,
  notes: supplier.notes,
  is_active: supplier.isActive,
  ...(userId && { user_id: userId }),
});

// Transform Flush from DB format
const transformFlushFromDb = (row: any): Flush => ({
  id: row.id,
  flushNumber: row.flush_number,
  harvestDate: new Date(row.harvest_date),
  wetWeight: row.wet_weight_g,
  dryWeight: row.dry_weight_g,
  mushroomCount: row.mushroom_count,
  quality: row.quality || 'good',
  notes: row.notes,
});

// Transform Flush to DB format
const transformFlushToDb = (flush: Omit<Flush, 'id'>, growId: string) => ({
  grow_id: growId,
  flush_number: flush.flushNumber,
  harvest_date: flush.harvestDate instanceof Date ? flush.harvestDate.toISOString() : flush.harvestDate,
  wet_weight_g: flush.wetWeight,
  dry_weight_g: flush.dryWeight,
  mushroom_count: flush.mushroomCount,
  quality: flush.quality,
  notes: flush.notes,
});

// Transform GrainType from DB format
const transformGrainTypeFromDb = (row: any): GrainType => ({
  id: row.id,
  name: row.name,
  code: row.code || row.name?.toLowerCase().replace(/\s+/g, '_'),
  notes: row.notes,
  isActive: row.is_active ?? true,
});

// Transform GrainType to DB format
const transformGrainTypeToDb = (grain: Partial<GrainType>, userId?: string | null) => ({
  name: grain.name,
  code: grain.code,
  notes: grain.notes,
  is_active: grain.isActive,
  ...(userId && { user_id: userId }),
});

// Transform InventoryLot from DB format
const transformInventoryLotFromDb = (row: any): InventoryLot => ({
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

// Transform InventoryLot to DB format
const transformInventoryLotToDb = (lot: Partial<InventoryLot>) => {
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

// Transform PurchaseOrder from DB format
const transformPurchaseOrderFromDb = (row: any): PurchaseOrder => ({
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

// Transform PurchaseOrder to DB format
const transformPurchaseOrderToDb = (order: Partial<PurchaseOrder>) => {
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

  // Vessel CRUD
  addVessel: (vessel: Omit<Vessel, 'id'>) => Promise<Vessel>;
  updateVessel: (id: string, updates: Partial<Vessel>) => Promise<void>;
  deleteVessel: (id: string) => Promise<void>;
  
  // Container Type CRUD
  addContainerType: (containerType: Omit<ContainerType, 'id'>) => Promise<ContainerType>;
  updateContainerType: (id: string, updates: Partial<ContainerType>) => Promise<void>;
  deleteContainerType: (id: string) => Promise<void>;
  
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
  deleteGrow: (id: string) => Promise<void>;
  advanceGrowStage: (growId: string) => Promise<void>;
  markGrowContaminated: (growId: string, notes?: string) => Promise<void>;
  addGrowObservation: (growId: string, observation: Omit<GrowObservation, 'id'>) => void;
  addFlush: (growId: string, flush: Omit<Flush, 'id' | 'flushNumber'>) => Promise<void>;
  
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
      
      // Load suppliers
      const { data: suppliersData, error: suppliersError } = await client
        .from('suppliers')
        .select('*')
        .order('name');
      if (suppliersError) throw suppliersError;
      
      // Load vessels
      const { data: vesselsData, error: vesselsError } = await client
        .from('vessels')
        .select('*')
        .order('name');
      if (vesselsError) console.warn('Vessels table error:', vesselsError);
      
      // Load container types
      const { data: containerTypesData, error: containerTypesError } = await client
        .from('container_types')
        .select('*')
        .order('name');
      if (containerTypesError) console.warn('Container types error:', containerTypesError);
      
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

      // Load custom recipe categories (personal items from database)
      const { data: recipeCategoriesData, error: recipeCategoriesError } = await client
        .from('recipe_categories')
        .select('*')
        .order('name');
      if (recipeCategoriesError) console.warn('Recipe categories error:', recipeCategoriesError);

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

      // Merge default recipe categories with custom ones from database
      const customRecipeCategories = (recipeCategoriesData || []).map(transformRecipeCategoryFromDb);
      const allRecipeCategories = [...defaultRecipeCategories, ...customRecipeCategories];

      setState(prev => ({
        ...prev,
        species,
        strains: (strainsData || []).map(transformStrainFromDb),
        locations: (locationsData || []).map(transformLocationFromDb),
        suppliers: (suppliersData || []).map(transformSupplierFromDb),
        vessels: (vesselsData || []).map(transformVesselFromDb),
        containerTypes: (containerTypesData || []).map(transformContainerTypeFromDb),
        substrateTypes: (substrateTypesData || []).map(transformSubstrateTypeFromDb),
        inventoryCategories: (inventoryCategoriesData || []).map(transformInventoryCategoryFromDb),
        recipeCategories: allRecipeCategories,
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
  const getVessel = useCallback((id: string) => state.vessels.find(v => v.id === id), [state.vessels]);
  const getContainerType = useCallback((id: string) => state.containerTypes.find(c => c.id === id), [state.containerTypes]);
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
  const activeVessels = useMemo(() => state.vessels.filter(v => v.isActive), [state.vessels]);
  const activeContainerTypes = useMemo(() => state.containerTypes.filter(c => c.isActive), [state.containerTypes]);
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
    return null; // TODO: Implement
  }, []);

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

  const deleteGrow = useCallback(async (id: string) => {
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
  }, [supabase]);

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
      const { data, error } = await supabase
        .from('flushes')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newFlush = transformFlushFromDb(data);
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

  const addVessel = useCallback(async (vessel: Omit<Vessel, 'id'>): Promise<Vessel> => {
    if (supabase) {
      // Get current user ID to save as personal item
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('vessels')
        .insert(transformVesselToDb(vessel, userId))
        .select()
        .single();
      if (error) throw error;
      const newVessel = transformVesselFromDb(data);
      setState(prev => ({ ...prev, vessels: [...prev.vessels, newVessel] }));
      return newVessel;
    }
    // Fallback for offline
    const newVessel = { ...vessel, id: generateId('vessel') } as Vessel;
    setState(prev => ({ ...prev, vessels: [...prev.vessels, newVessel] }));
    return newVessel;
  }, [supabase, generateId]);

  const updateVessel = useCallback(async (id: string, updates: Partial<Vessel>) => {
    if (supabase) {
      const { error } = await supabase
        .from('vessels')
        .update(transformVesselToDb(updates))
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      vessels: prev.vessels.map(v => v.id === id ? { ...v, ...updates } : v)
    }));
  }, [supabase]);

  const deleteVessel = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('vessels')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      vessels: prev.vessels.map(v => v.id === id ? { ...v, isActive: false } : v)
    }));
  }, [supabase]);

  const addContainerType = useCallback(async (containerType: Omit<ContainerType, 'id'>): Promise<ContainerType> => {
    if (supabase) {
      // Get current user ID to save as personal item
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('container_types')
        .insert(transformContainerTypeToDb(containerType, userId))
        .select()
        .single();
      if (error) throw error;
      const newCT = transformContainerTypeFromDb(data);
      setState(prev => ({ ...prev, containerTypes: [...prev.containerTypes, newCT] }));
      return newCT;
    }
    const newCT = { ...containerType, id: generateId('ct') } as ContainerType;
    setState(prev => ({ ...prev, containerTypes: [...prev.containerTypes, newCT] }));
    return newCT;
  }, [supabase, generateId]);

  const updateContainerType = useCallback(async (id: string, updates: Partial<ContainerType>) => {
    if (supabase) {
      const { error } = await supabase
        .from('container_types')
        .update(transformContainerTypeToDb(updates))
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      containerTypes: prev.containerTypes.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  }, [supabase]);

  const deleteContainerType = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('container_types')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    }
    setState(prev => ({
      ...prev,
      containerTypes: prev.containerTypes.map(c => c.id === id ? { ...c, isActive: false } : c)
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
        category_id: item.categoryId || null,
        sku: item.sku || null,
        quantity: item.quantity || 0,
        unit: item.unit || 'units',
        min_quantity: item.reorderPoint || 0,
        reorder_qty: item.reorderQty || null,
        cost_per_unit: item.unitCost || 0,
        supplier_id: item.supplierId || null,
        location_id: item.locationId || null,
        notes: item.notes,
        is_active: item.isActive ?? true,
        user_id: userId,
      };
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newItem: InventoryItem = {
        id: data.id,
        name: data.name,
        categoryId: data.category_id,
        sku: data.sku,
        quantity: data.quantity || 0,
        unit: data.unit || 'units',
        unitCost: data.cost_per_unit || 0,
        reorderPoint: data.min_quantity || 0,
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
    getSpecies, getStrain, getLocation, getLocationType, getLocationClassification, getVessel, getContainerType, getSubstrateType,
    getSupplier, getInventoryCategory, getRecipeCategory, getGrainType, getInventoryItem,
    getInventoryLot, getPurchaseOrder, getCulture, getGrow, getRecipe,
    activeSpecies, activeStrains, activeLocations, activeLocationTypes, activeLocationClassifications, activeVessels, activeContainerTypes,
    activeSubstrateTypes, activeSuppliers, activeInventoryCategories, activeRecipeCategories,
    activeGrainTypes, activeInventoryItems, activeInventoryLots, activePurchaseOrders, activeRecipes,

    // CRUD operations
    addSpecies, updateSpecies, deleteSpecies,
    addStrain, updateStrain, deleteStrain,
    addLocation, updateLocation, deleteLocation,
    addLocationType, updateLocationType, deleteLocationType,
    addLocationClassification, updateLocationClassification, deleteLocationClassification,
    addVessel, updateVessel, deleteVessel,
    addContainerType, updateContainerType, deleteContainerType,
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
    addRecipe, updateRecipe, deleteRecipe, calculateRecipeCost, scaleRecipe,
    updateSettings,
    generateId,
    refreshData,
  }), [
    state, isLoading, isConnected, error,
    getSpecies, getStrain, getLocation, getLocationType, getLocationClassification, getVessel, getContainerType, getSubstrateType,
    getSupplier, getInventoryCategory, getRecipeCategory, getGrainType, getInventoryItem,
    getInventoryLot, getPurchaseOrder, getCulture, getGrow, getRecipe,
    activeSpecies, activeStrains, activeLocations, activeLocationTypes, activeLocationClassifications, activeVessels, activeContainerTypes,
    activeSubstrateTypes, activeSuppliers, activeInventoryCategories, activeRecipeCategories,
    activeGrainTypes, activeInventoryItems, activeInventoryLots, activePurchaseOrders, activeRecipes,
    addSpecies, updateSpecies, deleteSpecies,
    addStrain, updateStrain, deleteStrain,
    addLocation, updateLocation, deleteLocation,
    addLocationType, updateLocationType, deleteLocationType,
    addLocationClassification, updateLocationClassification, deleteLocationClassification,
    addVessel, updateVessel, deleteVessel,
    addContainerType, updateContainerType, deleteContainerType,
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
