// ============================================================================
// DEFAULT VALUES AND EMPTY STATE
// Extracted from DataContext.tsx for better maintainability
// ============================================================================

import {
  DataStoreState,
  RecipeCategoryItem,
  GrainType,
  LocationType,
  LocationClassification,
} from './types';

// ============================================================================
// DEFAULT RECIPE CATEGORIES (built-in, shown for all users)
// ============================================================================

export const defaultRecipeCategories: RecipeCategoryItem[] = [
  { id: 'default-agar', name: 'Agar Media', code: 'agar', icon: '🧫', color: 'text-purple-400 bg-purple-950/50', isActive: true },
  { id: 'default-lc', name: 'Liquid Culture', code: 'liquid_culture', icon: '💧', color: 'text-blue-400 bg-blue-950/50', isActive: true },
  { id: 'default-grain', name: 'Grain Spawn', code: 'grain_spawn', icon: '🌾', color: 'text-amber-400 bg-amber-950/50', isActive: true },
  { id: 'default-bulk', name: 'Bulk Substrate', code: 'bulk_substrate', icon: '🪵', color: 'text-emerald-400 bg-emerald-950/50', isActive: true },
  { id: 'default-casing', name: 'Casing Layer', code: 'casing', icon: '🧱', color: 'text-orange-400 bg-orange-950/50', isActive: true },
  { id: 'default-other', name: 'Other', code: 'other', icon: '📦', color: 'text-zinc-400 bg-zinc-800', isActive: true },
];

// ============================================================================
// DEFAULT GRAIN TYPES (built-in spawn grain options)
// ============================================================================

export const defaultGrainTypes: GrainType[] = [
  { id: 'default-oat', name: 'Oat Groats', code: 'oat_groats', isActive: true },
  { id: 'default-rye', name: 'Rye Berries', code: 'rye_berries', isActive: true },
  { id: 'default-wheat', name: 'Wheat Berries', code: 'wheat', isActive: true },
  { id: 'default-millet', name: 'Millet', code: 'millet', isActive: true },
  { id: 'default-popcorn', name: 'Popcorn', code: 'popcorn', isActive: true },
  { id: 'default-brf', name: 'Brown Rice Flour (BRF)', code: 'brf', isActive: true },
  { id: 'default-wbs', name: 'Wild Bird Seed', code: 'wbs', isActive: true },
  { id: 'default-sorghum', name: 'Sorghum', code: 'sorghum', isActive: true },
];

// ============================================================================
// DEFAULT LOCATION TYPES (built-in, customizable by user)
// ============================================================================

export const defaultLocationTypes: LocationType[] = [
  { id: 'default-incubation', name: 'Incubation', code: 'incubation', description: 'Warm, dark area for colonization', isActive: true },
  { id: 'default-fruiting', name: 'Fruiting', code: 'fruiting', description: 'Humid environment with FAE for pinning and growth', isActive: true },
  { id: 'default-storage', name: 'Storage', code: 'storage', description: 'General storage area', isActive: true },
  { id: 'default-lab', name: 'Lab', code: 'lab', description: 'Clean lab area for sterile work', isActive: true },
  { id: 'default-cold-storage', name: 'Cold Storage', code: 'cold_storage', description: 'Refrigerated storage for cultures and supplies', isActive: true },
  { id: 'default-drying', name: 'Drying', code: 'drying', description: 'Area for drying harvested mushrooms', isActive: true },
  { id: 'default-other', name: 'Other', code: 'other', description: 'Other location type', isActive: true },
];

// ============================================================================
// DEFAULT LOCATION CLASSIFICATIONS (built-in, customizable by user)
// ============================================================================

export const defaultLocationClassifications: LocationClassification[] = [
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

// ============================================================================
// EMPTY INITIAL STATE (no sample data)
// ============================================================================

export const emptyState: DataStoreState = {
  species: [],
  strains: [],
  locations: [],
  locationTypes: [...defaultLocationTypes],
  locationClassifications: [...defaultLocationClassifications],
  containers: [],  // Unified: replaces vessels and containerTypes
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
  notifications: [],
  notificationRules: [],
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
