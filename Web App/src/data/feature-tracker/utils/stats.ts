// ============================================================================
// FEATURE TRACKER - STATISTICS & METRICS
// Calculate progress, velocity, and analytics
// ============================================================================

import type {
  Feature,
  FeatureStats,
  FeatureStatus,
  FeaturePriority,
  FeatureCategory,
  Milestone,
  MilestoneProgress,
} from '../types';

// ----------------------------------------------------------------------------
// FEATURE STATISTICS
// ----------------------------------------------------------------------------

/**
 * Calculate comprehensive feature statistics
 */
export function calculateFeatureStats(features: Feature[]): FeatureStats {
  const stats: FeatureStats = {
    total: features.length,
    byStatus: {
      idea: 0,
      backlog: 0,
      planned: 0,
      in_progress: 0,
      testing: 0,
      completed: 0,
      blocked: 0,
      cancelled: 0,
      deferred: 0,
    },
    byPriority: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      wishlist: 0,
    },
    byCategory: {
      core: 0,
      ui: 0,
      ux: 0,
      data: 0,
      integration: 0,
      optimization: 0,
      bug_fix: 0,
      enhancement: 0,
      security: 0,
      documentation: 0,
      infrastructure: 0,
      mobile: 0,
    },
    byMilestone: {},
    completedCount: 0,
    inProgressCount: 0,
    blockedCount: 0,
    totalEstimatedHours: 0,
    totalActualHours: 0,
    completedHours: 0,
    remainingHours: 0,
  };

  for (const feature of features) {
    // By status
    stats.byStatus[feature.status]++;

    // By priority
    stats.byPriority[feature.priority]++;

    // By category
    stats.byCategory[feature.category]++;

    // By milestone
    if (feature.targetMilestone) {
      stats.byMilestone[feature.targetMilestone] =
        (stats.byMilestone[feature.targetMilestone] || 0) + 1;
    }

    // Counts
    if (feature.status === 'completed') {
      stats.completedCount++;
    }
    if (feature.status === 'in_progress') {
      stats.inProgressCount++;
    }
    if (feature.status === 'blocked' || feature.blockedBy) {
      stats.blockedCount++;
    }

    // Hours
    if (feature.estimatedHours) {
      stats.totalEstimatedHours += feature.estimatedHours;
      if (feature.status === 'completed') {
        stats.completedHours += feature.estimatedHours;
      } else {
        stats.remainingHours += feature.estimatedHours;
      }
    }
    if (feature.actualHours) {
      stats.totalActualHours += feature.actualHours;
    }
  }

  // Calculate velocity (features completed in last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  stats.lastWeekCompleted = features.filter(f =>
    f.status === 'completed' &&
    f.completedAt &&
    new Date(f.completedAt) >= oneWeekAgo
  ).length;

  // Calculate average completion time (for completed features with actual hours)
  const completedWithHours = features.filter(f =>
    f.status === 'completed' && f.actualHours
  );
  if (completedWithHours.length > 0) {
    const totalHours = completedWithHours.reduce((sum, f) => sum + (f.actualHours || 0), 0);
    stats.averageCompletionTime = totalHours / completedWithHours.length;
  }

  return stats;
}

// ----------------------------------------------------------------------------
// MILESTONE PROGRESS
// ----------------------------------------------------------------------------

/**
 * Calculate progress for a specific milestone
 */
export function calculateMilestoneProgress(
  milestone: Milestone,
  features: Feature[]
): MilestoneProgress {
  const milestoneFeatures = features.filter(f => f.targetMilestone === milestone.id);

  const mandatoryFeatures = milestoneFeatures.filter(f =>
    milestone.mandatoryFeatures.includes(f.id)
  );
  const optionalFeatures = milestoneFeatures.filter(f =>
    milestone.optionalFeatures.includes(f.id)
  );

  const mandatoryCompleted = mandatoryFeatures.filter(f => f.status === 'completed').length;
  const optionalCompleted = optionalFeatures.filter(f => f.status === 'completed').length;
  const blockedFeatures = milestoneFeatures.filter(f =>
    f.status === 'blocked' || f.blockedBy
  ).length;

  const totalFeatures = milestoneFeatures.length;
  const totalCompleted = mandatoryCompleted + optionalCompleted;

  const percentComplete = totalFeatures > 0
    ? Math.round((totalCompleted / totalFeatures) * 100)
    : 0;

  const mandatoryPercentComplete = mandatoryFeatures.length > 0
    ? Math.round((mandatoryCompleted / mandatoryFeatures.length) * 100)
    : 100;

  // Estimate days remaining based on velocity
  let estimatedDaysRemaining: number | undefined;
  const remainingMandatory = mandatoryFeatures.length - mandatoryCompleted;

  if (remainingMandatory > 0) {
    // Simple estimate: assume 1 feature per day
    // In production, this would use actual velocity calculations
    estimatedDaysRemaining = remainingMandatory;
  }

  return {
    milestoneId: milestone.id,
    totalFeatures,
    mandatoryFeatures: mandatoryFeatures.length,
    mandatoryCompleted,
    optionalFeatures: optionalFeatures.length,
    optionalCompleted,
    percentComplete,
    mandatoryPercentComplete,
    blockedFeatures,
    estimatedDaysRemaining,
  };
}

/**
 * Calculate progress for all milestones
 */
export function calculateAllMilestoneProgress(
  milestones: Milestone[],
  features: Feature[]
): MilestoneProgress[] {
  return milestones.map(m => calculateMilestoneProgress(m, features));
}

// ----------------------------------------------------------------------------
// PROGRESS INDICATORS
// ----------------------------------------------------------------------------

/**
 * Get overall completion percentage
 */
export function getCompletionPercentage(features: Feature[]): number {
  if (features.length === 0) return 0;

  const completed = features.filter(f => f.status === 'completed').length;
  return Math.round((completed / features.length) * 100);
}

/**
 * Get progress by status for a progress bar
 */
export function getStatusDistribution(features: Feature[]): {
  status: FeatureStatus;
  count: number;
  percentage: number;
}[] {
  if (features.length === 0) return [];

  const statusCounts = new Map<FeatureStatus, number>();

  for (const feature of features) {
    statusCounts.set(feature.status, (statusCounts.get(feature.status) || 0) + 1);
  }

  const distribution: {
    status: FeatureStatus;
    count: number;
    percentage: number;
  }[] = [];

  // Order by typical workflow
  const statusOrder: FeatureStatus[] = [
    'completed',
    'testing',
    'in_progress',
    'planned',
    'backlog',
    'idea',
    'blocked',
    'deferred',
    'cancelled',
  ];

  for (const status of statusOrder) {
    const count = statusCounts.get(status) || 0;
    if (count > 0) {
      distribution.push({
        status,
        count,
        percentage: Math.round((count / features.length) * 100),
      });
    }
  }

  return distribution;
}

// ----------------------------------------------------------------------------
// VELOCITY & BURNDOWN
// ----------------------------------------------------------------------------

/**
 * Calculate weekly velocity (features completed per week)
 */
export function calculateWeeklyVelocity(
  features: Feature[],
  weeks: number = 4
): { weekStart: Date; completed: number }[] {
  const completedFeatures = features.filter(f =>
    f.status === 'completed' && f.completedAt
  );

  const velocity: { weekStart: Date; completed: number }[] = [];
  const now = new Date();

  for (let i = 0; i < weeks; i++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const completed = completedFeatures.filter(f => {
      const completedDate = new Date(f.completedAt!);
      return completedDate >= weekStart && completedDate < weekEnd;
    }).length;

    velocity.unshift({ weekStart, completed });
  }

  return velocity;
}

/**
 * Generate burndown data for a milestone
 */
export function generateBurndownData(
  milestone: Milestone,
  features: Feature[]
): {
  date: Date;
  remaining: number;
  ideal: number;
}[] {
  // TODO: Implement proper burndown calculation
  // This would require tracking historical status changes
  return [];
}

// ----------------------------------------------------------------------------
// RECOMMENDATIONS
// ----------------------------------------------------------------------------

/**
 * Get recommended features to work on next
 */
export function getRecommendedFeatures(
  features: Feature[],
  limit: number = 5
): Feature[] {
  // Filter to ready-to-start features
  const candidates = features.filter(f =>
    f.status === 'planned' &&
    !f.blockedBy
  );

  // Sort by priority, then by dependency count (features that unblock others first)
  const dependencyUnblockCount = new Map<string, number>();

  for (const feature of features) {
    if (feature.dependencies) {
      for (const depId of feature.dependencies) {
        dependencyUnblockCount.set(depId, (dependencyUnblockCount.get(depId) || 0) + 1);
      }
    }
  }

  const priorityOrder: Record<FeaturePriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    wishlist: 4,
  };

  candidates.sort((a, b) => {
    // First by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by how many features it unblocks
    const aUnblocks = dependencyUnblockCount.get(a.id) || 0;
    const bUnblocks = dependencyUnblockCount.get(b.id) || 0;
    if (aUnblocks !== bUnblocks) return bUnblocks - aUnblocks;

    // Then by mandatory status
    if (a.isMandatory !== b.isMandatory) {
      return a.isMandatory ? -1 : 1;
    }

    // Then by estimated hours (smaller first for quick wins)
    const aHours = a.estimatedHours || 999;
    const bHours = b.estimatedHours || 999;
    return aHours - bHours;
  });

  return candidates.slice(0, limit);
}

// ----------------------------------------------------------------------------
// HEALTH INDICATORS
// ----------------------------------------------------------------------------

export type HealthStatus = 'healthy' | 'at_risk' | 'critical';

/**
 * Assess milestone health
 */
export function assessMilestoneHealth(progress: MilestoneProgress): {
  status: HealthStatus;
  issues: string[];
} {
  const issues: string[] = [];

  // Check blocked features
  if (progress.blockedFeatures > 0) {
    issues.push(`${progress.blockedFeatures} feature(s) are blocked`);
  }

  // Check mandatory progress
  if (progress.mandatoryPercentComplete < 50 && progress.mandatoryFeatures > 0) {
    issues.push('Less than 50% of mandatory features completed');
  }

  // Determine overall status
  let status: HealthStatus = 'healthy';

  if (progress.blockedFeatures > 2 || progress.mandatoryPercentComplete < 25) {
    status = 'critical';
  } else if (progress.blockedFeatures > 0 || progress.mandatoryPercentComplete < 75) {
    status = 'at_risk';
  }

  return { status, issues };
}
