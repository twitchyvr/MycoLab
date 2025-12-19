// ============================================================================
// CHANGELOG - VERSION HISTORY & RELEASE NOTES
// Track what has changed in each release
// ============================================================================

import type { ChangelogEntry, ChangelogEntryType, SemanticVersion } from './types';
import { generateChangelogId } from './index';
import { archivedFeatures } from './archive';

// ----------------------------------------------------------------------------
// CHANGELOG ENTRIES
// ----------------------------------------------------------------------------

/**
 * Manual changelog entries for significant changes
 * These supplement auto-generated entries from completed features
 */
export const manualChangelog: ChangelogEntry[] = [
  // v0.2.0 Release
  {
    id: 'log-release-020',
    type: 'release',
    title: 'Version 0.2.0 - Mycelium Release',
    description: 'Data integrity improvements, outcomes analytics, and immutable database foundation',
    milestoneId: 'v0.2.0',
    timestamp: '2024-12-15T00:00:00Z',
  },
  {
    id: 'log-020-outcomes',
    type: 'feature_added',
    title: 'Outcomes Analytics Dashboard',
    description: 'Comprehensive analytics for entity outcomes, disposal patterns, and contamination analysis',
    milestoneId: 'v0.2.0',
    timestamp: '2024-12-15T00:00:00Z',
  },
  {
    id: 'log-020-disposal',
    type: 'feature_added',
    title: 'Entity Disposal Tracking',
    description: 'Track why cultures and grows are disposed with contamination details and outcomes',
    milestoneId: 'v0.2.0',
    timestamp: '2024-12-14T00:00:00Z',
  },
  {
    id: 'log-020-immutable',
    type: 'feature_added',
    title: 'Immutable Database Architecture',
    description: 'Append-only database foundation for complete audit trails',
    milestoneId: 'v0.2.0',
    timestamp: '2024-12-19T00:00:00Z',
  },
  {
    id: 'log-020-spawn',
    type: 'feature_added',
    title: 'Prepared Spawn Container Tracking',
    description: 'Track grain spawn containers from inoculation through use',
    milestoneId: 'v0.2.0',
    timestamp: '2024-12-10T00:00:00Z',
  },
  {
    id: 'log-020-costs',
    type: 'feature_added',
    title: 'Cost Tracking & Lab Valuation',
    description: 'Track costs for cultures, grows, and inventory with lab-wide valuation',
    milestoneId: 'v0.2.0',
    timestamp: '2024-12-08T00:00:00Z',
  },

  // v0.1.0 Release
  {
    id: 'log-release-010',
    type: 'release',
    title: 'Version 0.1.0 - Spore Release',
    description: 'Initial MycoLab release with core culture and grow tracking',
    milestoneId: 'v0.1.0',
    timestamp: '2024-12-01T00:00:00Z',
  },
  {
    id: 'log-010-cultures',
    type: 'feature_added',
    title: 'Culture Library',
    description: 'Track liquid cultures, agar plates, slants, and spore syringes with full lineage',
    milestoneId: 'v0.1.0',
    timestamp: '2024-12-01T00:00:00Z',
  },
  {
    id: 'log-010-grows',
    type: 'feature_added',
    title: 'Grow Tracker',
    description: 'Monitor grows through spawning, colonization, fruiting, and harvest stages',
    milestoneId: 'v0.1.0',
    timestamp: '2024-12-01T00:00:00Z',
  },
  {
    id: 'log-010-recipes',
    type: 'feature_added',
    title: 'Recipe Builder',
    description: 'Create and scale recipes for agar, LC, grain spawn, and substrates',
    milestoneId: 'v0.1.0',
    timestamp: '2024-12-01T00:00:00Z',
  },
  {
    id: 'log-010-inventory',
    type: 'feature_added',
    title: 'Inventory Management',
    description: 'Track supplies with reorder alerts and lot tracking',
    milestoneId: 'v0.1.0',
    timestamp: '2024-12-01T00:00:00Z',
  },
  {
    id: 'log-010-calculators',
    type: 'feature_added',
    title: 'Calculators',
    description: 'Substrate hydration, spawn rate, and pressure cooking calculators',
    milestoneId: 'v0.1.0',
    timestamp: '2024-12-01T00:00:00Z',
  },
];

// ----------------------------------------------------------------------------
// AUTO-GENERATED CHANGELOG FROM COMPLETED FEATURES
// ----------------------------------------------------------------------------

/**
 * Generate changelog entries from completed features
 * This creates a changelog entry for each completed feature
 */
export function generateChangelogFromFeatures(): ChangelogEntry[] {
  return archivedFeatures
    .filter(f => f.archiveReason === 'completed')
    .map(f => ({
      id: generateChangelogId(),
      type: mapCategoryToChangelogType(f.category),
      title: f.title,
      description: f.description,
      featureId: f.id,
      milestoneId: f.targetMilestone,
      timestamp: f.completedAt || f.updatedAt,
    }));
}

/**
 * Map feature category to changelog entry type
 */
function mapCategoryToChangelogType(category: string): ChangelogEntryType {
  switch (category) {
    case 'bug_fix':
      return 'bug_fixed';
    case 'security':
      return 'security';
    case 'optimization':
      return 'performance';
    case 'documentation':
      return 'documentation';
    default:
      return 'feature_added';
  }
}

// ----------------------------------------------------------------------------
// COMBINED CHANGELOG
// ----------------------------------------------------------------------------

/**
 * Get complete changelog (manual + auto-generated)
 * Sorted by timestamp, newest first
 */
export function getFullChangelog(): ChangelogEntry[] {
  const autoGenerated = generateChangelogFromFeatures();
  const all = [...manualChangelog, ...autoGenerated];

  // Deduplicate by checking if auto-generated entry matches a manual one
  const manualTitles = new Set(manualChangelog.map(e => e.title.toLowerCase()));
  const deduplicated = all.filter(entry => {
    // Keep all manual entries
    if (manualChangelog.includes(entry)) return true;
    // Filter auto-generated that duplicate manual
    return !manualTitles.has(entry.title.toLowerCase());
  });

  // Sort by timestamp, newest first
  return deduplicated.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Get changelog for a specific version
 */
export function getChangelogForVersion(milestoneId: string): ChangelogEntry[] {
  return getFullChangelog().filter(e => e.milestoneId === milestoneId);
}

/**
 * Get changelog grouped by version
 */
export function getChangelogByVersion(): Map<string, ChangelogEntry[]> {
  const changelog = getFullChangelog();
  const grouped = new Map<string, ChangelogEntry[]>();

  for (const entry of changelog) {
    const milestone = entry.milestoneId || 'unversioned';
    const existing = grouped.get(milestone) || [];
    existing.push(entry);
    grouped.set(milestone, existing);
  }

  return grouped;
}

/**
 * Get release notes for a version
 */
export function getReleaseNotes(milestoneId: string): {
  version: string;
  date: string;
  highlights: string[];
  features: ChangelogEntry[];
  bugFixes: ChangelogEntry[];
  other: ChangelogEntry[];
} {
  const entries = getChangelogForVersion(milestoneId);

  // Find release entry
  const releaseEntry = entries.find(e => e.type === 'release');

  // Group by type
  const features = entries.filter(e =>
    ['feature_added', 'feature_updated'].includes(e.type)
  );
  const bugFixes = entries.filter(e => e.type === 'bug_fixed');
  const other = entries.filter(e =>
    !['release', 'feature_added', 'feature_updated', 'bug_fixed'].includes(e.type)
  );

  return {
    version: milestoneId.replace('v', ''),
    date: releaseEntry?.timestamp || '',
    highlights: features.slice(0, 5).map(f => f.title),
    features,
    bugFixes,
    other,
  };
}

// ----------------------------------------------------------------------------
// CHANGELOG STATS
// ----------------------------------------------------------------------------

export function getChangelogStats() {
  const changelog = getFullChangelog();

  const byType = changelog.reduce((acc, entry) => {
    acc[entry.type] = (acc[entry.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byVersion = changelog.reduce((acc, entry) => {
    const milestone = entry.milestoneId || 'unversioned';
    acc[milestone] = (acc[milestone] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: changelog.length,
    byType,
    byVersion,
    releases: changelog.filter(e => e.type === 'release').length,
    featuresAdded: changelog.filter(e => e.type === 'feature_added').length,
    bugsFixes: changelog.filter(e => e.type === 'bug_fixed').length,
  };
}

// Default export
export default manualChangelog;
