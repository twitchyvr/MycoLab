// ============================================================================
// DEV LOG INDEX
// Combines all phase modules into a single exportable array
// ============================================================================

import type { DevLogFeature } from '../../types';
import { earlyPhases } from './early-phases';
import { midPhases } from './mid-phases';
import { laterPhases } from './later-phases';
import { recentPhases } from './recent-phases';

// Re-export types
export type { DevLogFeature };

// Export individual phase modules for targeted access
export { earlyPhases } from './early-phases';
export { midPhases } from './mid-phases';
export { laterPhases } from './later-phases';
export { recentPhases } from './recent-phases';

/**
 * Combined dev log features from all phases
 *
 * Phase Structure:
 * - Early Phases (1-9): Foundation, Core Tracking, Strain Library, Farm Mapping,
 *   Daily Ops, Recipes, Photo Journal, Supplies, Yields
 * - Mid Phases (10-18): QR Labels, Notifications, Config, Infrastructure, Mobile,
 *   Search, UI Polish, Calculators, Virtual Lab
 * - Later Phases (19-27): Future/Nice to Have, Completed v8, Quick Actions,
 *   Organization, Dashboard, Validation, Onboarding, Reporting, Environmental
 * - Recent Phases (28-30): Container Workflow, Inline Creation, Recent Dev,
 *   v1.0 Priorities, December 2025 Updates, UX Improvements
 */
export const allDevLogFeatures: DevLogFeature[] = [
  ...earlyPhases,
  ...midPhases,
  ...laterPhases,
  ...recentPhases,
];

// Default export is the combined array
export default allDevLogFeatures;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get features by status
 */
export const getFeaturesByStatus = (status: DevLogFeature['status']): DevLogFeature[] => {
  return allDevLogFeatures.filter(f => f.status === status);
};

/**
 * Get features by category
 */
export const getFeaturesByCategory = (category: DevLogFeature['category']): DevLogFeature[] => {
  return allDevLogFeatures.filter(f => f.category === category);
};

/**
 * Get features by priority
 */
export const getFeaturesByPriority = (priority: DevLogFeature['priority']): DevLogFeature[] => {
  return allDevLogFeatures.filter(f => f.priority === priority);
};

/**
 * Get completed features
 */
export const getCompletedFeatures = (): DevLogFeature[] => {
  return allDevLogFeatures.filter(f => f.status === 'completed');
};

/**
 * Get in-progress features
 */
export const getInProgressFeatures = (): DevLogFeature[] => {
  return allDevLogFeatures.filter(f => f.status === 'in_progress');
};

/**
 * Get planned features
 */
export const getPlannedFeatures = (): DevLogFeature[] => {
  return allDevLogFeatures.filter(f => f.status === 'planned');
};

/**
 * Calculate progress statistics
 */
export const getDevLogStats = () => {
  const total = allDevLogFeatures.length;
  const completed = allDevLogFeatures.filter(f => f.status === 'completed').length;
  const inProgress = allDevLogFeatures.filter(f => f.status === 'in_progress').length;
  const planned = allDevLogFeatures.filter(f => f.status === 'planned').length;
  const backlog = allDevLogFeatures.filter(f => f.status === 'backlog').length;

  const estimatedHours = allDevLogFeatures.reduce((sum, f) => sum + (f.estimatedHours || 0), 0);
  const actualHours = allDevLogFeatures.reduce((sum, f) => sum + (f.actualHours || 0), 0);

  return {
    total,
    completed,
    inProgress,
    planned,
    backlog,
    completionPercent: Math.round((completed / total) * 100),
    estimatedHours,
    actualHours,
  };
};
