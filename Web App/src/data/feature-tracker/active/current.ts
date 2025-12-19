// ============================================================================
// ACTIVE FEATURES - CURRENT VERSION (v0.3.0)
// Features currently being worked on or planned for next release
// ============================================================================

import type { Feature } from '../types';
import { allDevLogFeatures } from '../../devlog';
import { migrateFeature } from '../utils/migration';

// Statuses that indicate "active" (not completed/cancelled)
const ACTIVE_STATUSES = ['idea', 'backlog', 'planned', 'in_progress', 'testing', 'blocked'];

/**
 * Get active features by migrating from legacy devlog
 * This provides a bridge until we fully migrate the data
 */
function getActiveFeatures(): Feature[] {
  return allDevLogFeatures
    .filter(f => ACTIVE_STATUSES.includes(f.status))
    .map(migrateFeature);
}

// Export active features
export const activeFeatures = getActiveFeatures();

// Get in-progress features
export const inProgressFeatures = activeFeatures.filter(f => f.status === 'in_progress');

// Get planned features
export const plannedFeatures = activeFeatures.filter(f => f.status === 'planned');

// Get blocked features
export const blockedFeatures = activeFeatures.filter(f => f.status === 'blocked');

// Get backlog features
export const backlogFeatures = activeFeatures.filter(f => f.status === 'backlog');

export default activeFeatures;
