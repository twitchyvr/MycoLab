// ============================================================================
// ARCHIVED FEATURES INDEX
// Completed and cancelled features organized by quarter
// ============================================================================

import type { Feature } from '../types';
import { allDevLogFeatures } from '../../devlog';
import { migrateFeature, groupByQuarter } from '../utils/migration';

// Statuses that indicate "archived"
const ARCHIVED_STATUSES = ['completed', 'cancelled'];

/**
 * Get archived features by migrating from legacy devlog
 * This provides a bridge until we fully migrate the data
 */
function getArchivedFeatures(): Feature[] {
  return allDevLogFeatures
    .filter(f => ARCHIVED_STATUSES.includes(f.status))
    .map(f => {
      const feature = migrateFeature(f);
      // Add archive metadata
      feature.archivedAt = feature.completedAt || feature.updatedAt;
      feature.archiveReason = f.status === 'cancelled' ? 'cancelled' : 'completed';
      return feature;
    })
    .sort((a, b) => {
      // Sort by completion date, newest first
      const dateA = new Date(a.completedAt || a.updatedAt).getTime();
      const dateB = new Date(b.completedAt || b.updatedAt).getTime();
      return dateB - dateA;
    });
}

// Export archived features
export const archivedFeatures = getArchivedFeatures();

// Group by quarter for lazy loading
export const archivedByQuarter = groupByQuarter(archivedFeatures);

// Get count by quarter
export const archiveQuarters = Array.from(archivedByQuarter.keys()).sort().reverse();

// Export helpers
export function getArchiveByQuarter(quarter: string): Feature[] {
  return archivedByQuarter.get(quarter) || [];
}

export function getArchiveStats() {
  return {
    total: archivedFeatures.length,
    byQuarter: Object.fromEntries(
      archiveQuarters.map(q => [q, archivedByQuarter.get(q)?.length || 0])
    ),
    completed: archivedFeatures.filter(f => f.archiveReason === 'completed').length,
    cancelled: archivedFeatures.filter(f => f.archiveReason === 'cancelled').length,
  };
}

export default archivedFeatures;
