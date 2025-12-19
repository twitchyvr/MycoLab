// ============================================================================
// FEATURE TRACKER - MIGRATION UTILITIES
// Convert legacy devlog data to new Feature Tracker format
// ============================================================================

import type { DevLogFeature } from '../../../types';
import type {
  Feature,
  FeatureStatus,
  FeaturePriority,
  FeatureCategory,
  ChangelogEntry,
  UUID,
} from '../types';
import { generateFeatureId, generateChangelogId } from '../index';

// ----------------------------------------------------------------------------
// STATUS MAPPING
// ----------------------------------------------------------------------------

// Map old statuses to new statuses
const STATUS_MAP: Record<string, FeatureStatus> = {
  'backlog': 'backlog',
  'planned': 'planned',
  'in_progress': 'in_progress',
  'testing': 'testing',
  'completed': 'completed',
  'blocked': 'blocked',
  'cancelled': 'cancelled',
};

// Map old priorities to new priorities
const PRIORITY_MAP: Record<string, FeaturePriority> = {
  'critical': 'critical',
  'high': 'high',
  'medium': 'medium',
  'low': 'low',
  'nice_to_have': 'wishlist',
};

// Map old categories to new categories
const CATEGORY_MAP: Record<string, FeatureCategory> = {
  'core': 'core',
  'ui': 'ui',
  'ux': 'ux',
  'data': 'data',
  'integration': 'integration',
  'optimization': 'optimization',
  'bug_fix': 'bug_fix',
  'enhancement': 'enhancement',
  'security': 'security',
};

// ----------------------------------------------------------------------------
// PHASE TO MILESTONE MAPPING
// ----------------------------------------------------------------------------

// Map devlog phases to milestones based on their ID ranges
function getTargetMilestone(id: string): string | undefined {
  // Extract the numeric part from IDs like "dev-001", "dev-1226"
  const match = id.match(/dev-(\d+)/);
  if (!match) return undefined;

  const num = parseInt(match[1], 10);

  // Rough mapping based on when features were likely added
  // Features dev-001 to dev-500 are foundational (v0.1.0)
  // Features dev-500 to dev-1000 are expansion (v0.2.0)
  // Features dev-1000+ are recent (v0.3.0)
  if (num < 500) {
    return 'v0.1.0';
  } else if (num < 1000) {
    return 'v0.2.0';
  } else if (num < 1500) {
    return 'v0.3.0';
  } else {
    return 'v0.4.0';
  }
}

// ----------------------------------------------------------------------------
// TAG EXTRACTION
// ----------------------------------------------------------------------------

/**
 * Extract tags from feature title, description, and notes
 */
function extractTags(feature: DevLogFeature): string[] {
  const tags: Set<string> = new Set();
  const text = [
    feature.title,
    feature.description,
    feature.notes,
  ].filter(Boolean).join(' ').toLowerCase();

  // Component tags
  if (text.includes('culture')) tags.add('cultures');
  if (text.includes('grow')) tags.add('grows');
  if (text.includes('recipe')) tags.add('recipes');
  if (text.includes('inventory')) tags.add('inventory');
  if (text.includes('spawn')) tags.add('spawn');
  if (text.includes('strain')) tags.add('strains');

  // Feature type tags
  if (text.includes('mobile') || text.includes('responsive')) tags.add('mobile');
  if (text.includes('photo') || text.includes('image')) tags.add('photos');
  if (text.includes('search')) tags.add('search');
  if (text.includes('filter')) tags.add('filtering');
  if (text.includes('analytics') || text.includes('dashboard')) tags.add('analytics');
  if (text.includes('export') || text.includes('import')) tags.add('data-transfer');
  if (text.includes('notification') || text.includes('alert')) tags.add('notifications');
  if (text.includes('calculator')) tags.add('calculators');
  if (text.includes('lineage') || text.includes('genealogy')) tags.add('lineage');
  if (text.includes('cost') || text.includes('valuation')) tags.add('cost-tracking');
  if (text.includes('harvest') || text.includes('yield')) tags.add('harvests');
  if (text.includes('contamination')) tags.add('contamination');
  if (text.includes('observation')) tags.add('observations');
  if (text.includes('immutable') || text.includes('audit') || text.includes('history')) tags.add('audit-trail');

  return Array.from(tags);
}

// ----------------------------------------------------------------------------
// MIGRATION FUNCTION
// ----------------------------------------------------------------------------

/**
 * Convert a legacy DevLogFeature to the new Feature format
 */
export function migrateFeature(legacy: DevLogFeature): Feature {
  const status = STATUS_MAP[legacy.status] || 'backlog';
  const priority = PRIORITY_MAP[legacy.priority] || 'medium';
  const category = CATEGORY_MAP[legacy.category] || 'enhancement';

  // Generate new ID or use existing
  const id = legacy.id || generateFeatureId();

  // Extract tags from content
  const tags = extractTags(legacy);

  // Determine target milestone
  const targetMilestone = status === 'completed'
    ? getTargetMilestone(legacy.id)  // Completed features keep their original milestone
    : 'v0.3.0';  // Active features go to current milestone

  // Split notes into user notes and technical notes
  let notes = legacy.description || '';
  let technicalNotes: string | undefined;

  if (legacy.notes) {
    // If notes contain implementation details, split them
    if (legacy.notes.includes('**') || legacy.notes.includes('- [')) {
      technicalNotes = legacy.notes;
    } else {
      // Short notes go to user-facing notes
      notes = notes ? `${notes}\n\n${legacy.notes}` : legacy.notes;
    }
  }

  const feature: Feature = {
    id,
    title: legacy.title,
    description: legacy.description,
    category,
    status,
    priority,
    targetMilestone,
    tags: tags.length > 0 ? tags : undefined,
    estimatedHours: legacy.estimatedHours,
    actualHours: legacy.actualHours,
    dependencies: legacy.dependencies,
    blockedBy: legacy.blockedBy,
    notes: notes || undefined,
    technicalNotes,
    createdAt: legacy.createdAt || new Date().toISOString(),
    updatedAt: legacy.updatedAt || new Date().toISOString(),
    completedAt: status === 'completed' ? (legacy.completedAt || legacy.updatedAt) : undefined,
  };

  // Clean up undefined fields
  return Object.fromEntries(
    Object.entries(feature).filter(([_, v]) => v !== undefined)
  ) as Feature;
}

/**
 * Migrate all legacy features
 */
export function migrateAllFeatures(legacyFeatures: DevLogFeature[]): {
  active: Feature[];
  archived: Feature[];
  changelog: ChangelogEntry[];
} {
  const active: Feature[] = [];
  const archived: Feature[] = [];
  const changelog: ChangelogEntry[] = [];

  for (const legacy of legacyFeatures) {
    const feature = migrateFeature(legacy);

    if (feature.status === 'completed' || feature.status === 'cancelled') {
      // Archived features
      feature.archivedAt = feature.completedAt || feature.updatedAt;
      feature.archiveReason = feature.status === 'cancelled' ? 'cancelled' : 'completed';
      archived.push(feature);

      // Create changelog entry for completed features
      if (feature.status === 'completed') {
        changelog.push({
          id: generateChangelogId(),
          type: 'feature_added',
          title: feature.title,
          description: feature.description,
          featureId: feature.id,
          milestoneId: feature.targetMilestone,
          timestamp: feature.completedAt || feature.updatedAt,
        });
      }
    } else {
      // Active features
      active.push(feature);
    }
  }

  // Sort archived by completion date (newest first)
  archived.sort((a, b) => {
    const dateA = new Date(a.completedAt || a.updatedAt).getTime();
    const dateB = new Date(b.completedAt || b.updatedAt).getTime();
    return dateB - dateA;
  });

  // Sort active by priority then status
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, wishlist: 4 };
  const statusOrder = { blocked: 0, in_progress: 1, testing: 2, planned: 3, backlog: 4, idea: 5, deferred: 6 };

  active.sort((a, b) => {
    const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] || 9) -
                       (statusOrder[b.status as keyof typeof statusOrder] || 9);
    if (statusDiff !== 0) return statusDiff;

    return (priorityOrder[a.priority as keyof typeof priorityOrder] || 9) -
           (priorityOrder[b.priority as keyof typeof priorityOrder] || 9);
  });

  // Sort changelog by date (newest first)
  changelog.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return { active, archived, changelog };
}

// ----------------------------------------------------------------------------
// ARCHIVE ORGANIZATION
// ----------------------------------------------------------------------------

/**
 * Group archived features by quarter
 */
export function groupByQuarter(features: Feature[]): Map<string, Feature[]> {
  const groups = new Map<string, Feature[]>();

  for (const feature of features) {
    const date = new Date(feature.completedAt || feature.updatedAt);
    const year = date.getFullYear();
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    const key = `${year}-Q${quarter}`;

    const existing = groups.get(key) || [];
    existing.push(feature);
    groups.set(key, existing);
  }

  return groups;
}

/**
 * Get archive filename for a quarter
 */
export function getArchiveFilename(quarter: string): string {
  return `${quarter.toLowerCase()}.ts`;
}

// ----------------------------------------------------------------------------
// VALIDATION
// ----------------------------------------------------------------------------

/**
 * Validate migrated features
 */
export function validateMigratedFeatures(features: Feature[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();

  for (const feature of features) {
    // Check for duplicate IDs
    if (ids.has(feature.id)) {
      errors.push(`Duplicate feature ID: ${feature.id}`);
    }
    ids.add(feature.id);

    // Check required fields
    if (!feature.title) {
      errors.push(`Feature ${feature.id} is missing title`);
    }
    if (!feature.status) {
      errors.push(`Feature ${feature.id} is missing status`);
    }
    if (!feature.priority) {
      errors.push(`Feature ${feature.id} is missing priority`);
    }

    // Warnings for incomplete data
    if (!feature.description) {
      warnings.push(`Feature "${feature.title}" is missing description`);
    }
    if (feature.status === 'completed' && !feature.completedAt) {
      warnings.push(`Completed feature "${feature.title}" is missing completedAt date`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ----------------------------------------------------------------------------
// GENERATE FILE CONTENT
// ----------------------------------------------------------------------------

/**
 * Generate TypeScript file content for features
 */
export function generateFeatureFileContent(
  features: Feature[],
  exportName: string,
  description: string
): string {
  const timestamp = new Date().toISOString();

  return `// ============================================================================
// ${description}
// Generated: ${timestamp}
// Features: ${features.length}
// ============================================================================

import type { Feature } from '../types';

export const ${exportName}: Feature[] = ${JSON.stringify(features, null, 2)};

export default ${exportName};
`;
}

/**
 * Generate index file for archives
 */
export function generateArchiveIndexContent(quarters: string[]): string {
  const imports = quarters.map(q => {
    const varName = q.replace('-', '_').toLowerCase();
    const fileName = getArchiveFilename(q).replace('.ts', '');
    return `import { default as ${varName} } from './${fileName}';`;
  }).join('\n');

  const exports = quarters.map(q => {
    const varName = q.replace('-', '_').toLowerCase();
    return `  ${varName},`;
  }).join('\n');

  const combined = quarters.map(q => {
    const varName = q.replace('-', '_').toLowerCase();
    return `  ...${varName},`;
  }).join('\n');

  return `// ============================================================================
// ARCHIVE INDEX
// Combines all archived features for historical browsing
// ============================================================================

import type { Feature } from '../types';

${imports}

// Export individual quarters
export {
${exports}
};

// Combined archive (lazy load this for performance)
export const allArchived: Feature[] = [
${combined}
];

export default allArchived;
`;
}
