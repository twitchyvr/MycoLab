// ============================================================================
// FEATURE TRACKER - SEARCH & FILTER UTILITIES
// Fuzzy search and multi-filter support
// ============================================================================

import type {
  Feature,
  FeatureSummary,
  FeatureFilters,
  FeatureStatus,
  FeaturePriority,
  FeatureCategory,
} from '../types';

// ----------------------------------------------------------------------------
// FUZZY SEARCH
// ----------------------------------------------------------------------------

/**
 * Simple fuzzy match - checks if all characters in query appear in target in order
 */
export function fuzzyMatch(query: string, target: string): { matches: boolean; score: number } {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (q.length === 0) return { matches: true, score: 1 };
  if (t.includes(q)) return { matches: true, score: 0.9 + (q.length / t.length) * 0.1 };

  let qIndex = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;
  let score = 0;

  for (let tIndex = 0; tIndex < t.length && qIndex < q.length; tIndex++) {
    if (t[tIndex] === q[qIndex]) {
      qIndex++;
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
      // Bonus for matches at word boundaries
      if (tIndex === 0 || t[tIndex - 1] === ' ' || t[tIndex - 1] === '_' || t[tIndex - 1] === '-') {
        score += 0.1;
      }
    } else {
      consecutiveMatches = 0;
    }
  }

  const matches = qIndex === q.length;
  if (matches) {
    score += (maxConsecutive / q.length) * 0.5;
    score += (q.length / t.length) * 0.3;
  }

  return { matches, score };
}

/**
 * Search features with fuzzy matching
 */
export function searchFeatures(
  features: Feature[],
  query: string,
  options: {
    searchFields?: ('title' | 'description' | 'notes' | 'tags' | 'technicalNotes')[];
    limit?: number;
  } = {}
): { feature: Feature; score: number }[] {
  const {
    searchFields = ['title', 'description', 'notes', 'tags'],
    limit = 50,
  } = options;

  if (!query.trim()) {
    return features.slice(0, limit).map(f => ({ feature: f, score: 1 }));
  }

  const results: { feature: Feature; score: number }[] = [];

  for (const feature of features) {
    let bestScore = 0;

    for (const field of searchFields) {
      let value = '';

      if (field === 'tags' && feature.tags) {
        value = feature.tags.join(' ');
      } else {
        value = (feature[field] as string) || '';
      }

      if (value) {
        const { matches, score } = fuzzyMatch(query, value);
        if (matches) {
          // Weight title matches higher
          const weightedScore = field === 'title' ? score * 1.5 : score;
          bestScore = Math.max(bestScore, weightedScore);
        }
      }
    }

    if (bestScore > 0) {
      results.push({ feature, score: bestScore });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

// ----------------------------------------------------------------------------
// FILTERING
// ----------------------------------------------------------------------------

/**
 * Apply filters to a list of features
 */
export function filterFeatures(
  features: Feature[],
  filters: FeatureFilters
): Feature[] {
  return features.filter(feature => {
    // Status filter
    if (filters.status?.length && !filters.status.includes(feature.status)) {
      return false;
    }

    // Priority filter
    if (filters.priority?.length && !filters.priority.includes(feature.priority)) {
      return false;
    }

    // Category filter
    if (filters.category?.length && !filters.category.includes(feature.category)) {
      return false;
    }

    // Milestone filter
    if (filters.milestone?.length) {
      if (!feature.targetMilestone || !filters.milestone.includes(feature.targetMilestone)) {
        return false;
      }
    }

    // Tags filter (OR logic - feature must have at least one matching tag)
    if (filters.tags?.length) {
      const featureTags = feature.tags || [];
      if (!filters.tags.some(tag => featureTags.includes(tag))) {
        return false;
      }
    }

    // Mandatory filter
    if (filters.isMandatory !== undefined && feature.isMandatory !== filters.isMandatory) {
      return false;
    }

    // Has blockers filter
    if (filters.hasBlockers === true && !feature.blockedBy && feature.status !== 'blocked') {
      return false;
    }
    if (filters.hasBlockers === false && (feature.blockedBy || feature.status === 'blocked')) {
      return false;
    }

    // Is ready filter (all dependencies met)
    if (filters.isReady !== undefined) {
      const hasUnmetDeps = feature.dependencies?.length && feature.status !== 'completed';
      // Note: Full dependency check requires access to all features
      // This is a simplified check
      if (filters.isReady && hasUnmetDeps) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const featureDate = new Date(feature.updatedAt);
      if (filters.dateRange.from && featureDate < new Date(filters.dateRange.from)) {
        return false;
      }
      if (filters.dateRange.to && featureDate > new Date(filters.dateRange.to)) {
        return false;
      }
    }

    // Search query (simple contains check - use searchFeatures for fuzzy)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        feature.title,
        feature.description,
        feature.notes,
        ...(feature.tags || []),
      ].filter(Boolean).join(' ').toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Check if a feature has all its dependencies completed
 */
export function isFeatureReady(
  feature: Feature,
  allFeatures: Feature[]
): boolean {
  if (!feature.dependencies?.length) {
    return true;
  }

  const featureMap = new Map(allFeatures.map(f => [f.id, f]));

  return feature.dependencies.every(depId => {
    const dep = featureMap.get(depId);
    return dep && dep.status === 'completed';
  });
}

/**
 * Get features that are ready to start (all deps met, status is planned)
 */
export function getReadyFeatures(features: Feature[]): Feature[] {
  return features.filter(f =>
    f.status === 'planned' && isFeatureReady(f, features)
  );
}

/**
 * Get features that are blocked
 */
export function getBlockedFeatures(features: Feature[]): Feature[] {
  return features.filter(f =>
    f.status === 'blocked' || f.blockedBy || !isFeatureReady(f, features)
  );
}

// ----------------------------------------------------------------------------
// SORTING
// ----------------------------------------------------------------------------

type SortField = 'priority' | 'status' | 'created' | 'updated' | 'title' | 'milestone';

const priorityOrder: Record<FeaturePriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  wishlist: 4,
};

const statusOrder: Record<FeatureStatus, number> = {
  blocked: 0,
  in_progress: 1,
  testing: 2,
  planned: 3,
  backlog: 4,
  idea: 5,
  deferred: 6,
  completed: 7,
  cancelled: 8,
};

/**
 * Sort features by specified field
 */
export function sortFeatures(
  features: Feature[],
  sortBy: SortField,
  direction: 'asc' | 'desc' = 'asc'
): Feature[] {
  const sorted = [...features].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'priority':
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'status':
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updated':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'milestone':
        const aMs = a.targetMilestone || 'zzz';
        const bMs = b.targetMilestone || 'zzz';
        comparison = aMs.localeCompare(bMs);
        break;
    }

    return direction === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

// ----------------------------------------------------------------------------
// GROUPING
// ----------------------------------------------------------------------------

type GroupField = 'status' | 'priority' | 'category' | 'milestone';

/**
 * Group features by specified field
 */
export function groupFeatures(
  features: Feature[],
  groupBy: GroupField
): Map<string, Feature[]> {
  const groups = new Map<string, Feature[]>();

  for (const feature of features) {
    let key: string;

    switch (groupBy) {
      case 'status':
        key = feature.status;
        break;
      case 'priority':
        key = feature.priority;
        break;
      case 'category':
        key = feature.category;
        break;
      case 'milestone':
        key = feature.targetMilestone || 'unassigned';
        break;
    }

    const existing = groups.get(key) || [];
    existing.push(feature);
    groups.set(key, existing);
  }

  return groups;
}

// ----------------------------------------------------------------------------
// TAG EXTRACTION
// ----------------------------------------------------------------------------

/**
 * Extract all unique tags from features
 */
export function extractAllTags(features: Feature[]): string[] {
  const tagSet = new Set<string>();

  for (const feature of features) {
    if (feature.tags) {
      for (const tag of feature.tags) {
        tagSet.add(tag);
      }
    }
  }

  return Array.from(tagSet).sort();
}

/**
 * Get tag counts
 */
export function getTagCounts(features: Feature[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const feature of features) {
    if (feature.tags) {
      for (const tag of feature.tags) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
  }

  return counts;
}
