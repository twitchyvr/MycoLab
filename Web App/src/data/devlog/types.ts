// ============================================================================
// DEV LOG TYPES
// ============================================================================

import type { DevLogFeature } from '../../types';

export type { DevLogFeature };

// Phase numbers mapped to their ID ranges for reference
export const PHASE_ID_RANGES = {
  PHASE_01_FOUNDATION: ['dev-001', 'dev-009'],
  PHASE_02_CORE_TRACKING: ['dev-010', 'dev-019'],
  PHASE_03_STRAIN_LIBRARY: ['dev-020', 'dev-029'],
  PHASE_04_FARM_MAPPING: ['dev-030', 'dev-039'],
  PHASE_05_DAILY_OPS: ['dev-040', 'dev-049'],
  PHASE_06_RECIPES: ['dev-050', 'dev-059'],
  PHASE_07_PHOTO_JOURNAL: ['dev-060', 'dev-069'],
  PHASE_08_SUPPLIES: ['dev-070', 'dev-079'],
  PHASE_09_YIELDS: ['dev-080', 'dev-089'],
  PHASE_10_QR_LABELS: ['dev-090', 'dev-099'],
  PHASE_11_NOTIFICATIONS: ['dev-100', 'dev-109'],
  PHASE_12_CONFIG: ['dev-110', 'dev-119'],
  PHASE_13_INFRASTRUCTURE: ['dev-120', 'dev-129'],
  PHASE_14_MOBILE: ['dev-130', 'dev-139'],
  PHASE_15_SEARCH: ['dev-140', 'dev-149'],
  PHASE_16_UI_POLISH: ['dev-150', 'dev-159'],
  PHASE_17_CALCULATORS: ['dev-160', 'dev-179'],
  PHASE_18_VIRTUAL_LAB: ['dev-180', 'dev-199'],
  PHASE_19_FUTURE: ['dev-200', 'dev-209'],
  PHASE_20_COMPLETED_V8: ['dev-300', 'dev-309'],
  PHASE_21_QUICK_ACTIONS: ['dev-400', 'dev-409'],
  PHASE_22_ORGANIZATION: ['dev-410', 'dev-419'],
  PHASE_23_DASHBOARD: ['dev-420', 'dev-429'],
  PHASE_24_VALIDATION: ['dev-430', 'dev-439'],
  PHASE_25_ONBOARDING: ['dev-440', 'dev-449'],
  PHASE_26_REPORTING: ['dev-450', 'dev-459'],
  PHASE_27_ENVIRONMENTAL: ['dev-460', 'dev-469'],
  PHASE_28_CONTAINER_WORKFLOW: ['dev-500', 'dev-519'],
  PHASE_29_INLINE_CREATION: ['dev-600', 'dev-609'],
  PHASE_30_RECENT_DEV: ['dev-700', 'dev-799'],
  PHASE_31_V1_PRIORITIES: ['dev-800', 'dev-899'],
  PHASE_32_DEC_2024: ['dev-710', 'dev-719'],
} as const;
