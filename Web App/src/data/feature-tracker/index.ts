// ============================================================================
// FEATURE TRACKER - MAIN INDEX
// Central exports, version management, and data aggregation
// ============================================================================

// Type exports
export * from './types';

// Utility exports
export * from './utils/search';
export * from './utils/stats';
export * from './utils/dependencies';

// Data exports
export { activeFeatures, inProgressFeatures, plannedFeatures, blockedFeatures, backlogFeatures } from './active/current';
export { archivedFeatures, archivedByQuarter, archiveQuarters, getArchiveByQuarter, getArchiveStats } from './archive';
export {
  manualChangelog,
  getFullChangelog,
  getChangelogForVersion,
  getChangelogByVersion,
  getReleaseNotes,
  getChangelogStats,
} from './changelog';

// Data imports (will be populated as we migrate)
import type {
  Feature,
  Milestone,
  AppVersionInfo,
  ChangelogEntry,
  FilterPreset,
  FeatureTrackerState,
  ViewPreferences,
  SemanticVersion,
} from './types';

// ----------------------------------------------------------------------------
// VERSION CONFIGURATION
// ----------------------------------------------------------------------------

/**
 * Current application version info
 * This is the source of truth for version tracking
 */
export const APP_VERSION_INFO: AppVersionInfo = {
  current: '0.2.0' as SemanticVersion,
  currentMilestoneId: 'v0.2.0',
  nextMilestoneId: 'v0.3.0',
  releaseHistory: [
    {
      version: '0.1.0' as SemanticVersion,
      releasedAt: '2024-12-01T00:00:00Z',
      milestoneId: 'v0.1.0',
    },
    {
      version: '0.2.0' as SemanticVersion,
      releasedAt: '2024-12-15T00:00:00Z',
      milestoneId: 'v0.2.0',
    },
  ],
};

// ----------------------------------------------------------------------------
// MILESTONE DEFINITIONS
// ----------------------------------------------------------------------------

const timestamp = () => new Date().toISOString();

/**
 * Milestone definitions for MycoLab
 * Codenames follow mushroom varieties
 */
export const MILESTONES: Milestone[] = [
  {
    id: 'v0.1.0',
    version: '0.1.0',
    codename: 'Spore',
    name: 'Foundation Release',
    description: 'Initial MycoLab release with core culture and grow tracking',
    status: 'released',
    releasedAt: '2024-12-01T00:00:00Z',
    mandatoryFeatures: [],
    optionalFeatures: [],
    highlights: [
      'Culture library with LC, agar, slant, and spore syringe tracking',
      'Grow tracker with stage progression',
      'Recipe builder for substrates and media',
      'Basic inventory management',
    ],
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'v0.2.0',
    version: '0.2.0',
    codename: 'Mycelium',
    name: 'Data Integrity Release',
    description: 'Improved data tracking, outcomes analytics, and immutable database architecture',
    status: 'released',
    releasedAt: '2024-12-15T00:00:00Z',
    mandatoryFeatures: [],
    optionalFeatures: [],
    highlights: [
      'Outcomes analytics dashboard',
      'Entity disposal tracking with contamination analysis',
      'Immutable database architecture foundation',
      'Prepared spawn container tracking',
      'Cost tracking and lab valuation',
    ],
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2024-12-15T00:00:00Z',
  },
  {
    id: 'v0.3.0',
    version: '0.3.0',
    codename: 'Primordia',
    name: 'Photo & Mobile Release',
    description: 'Photo documentation system, mobile-first UI improvements, and Feature Tracker',
    status: 'active',
    plannedDate: '2025-01-15T00:00:00Z',
    startedAt: timestamp(),
    mandatoryFeatures: [],
    optionalFeatures: [],
    highlights: [
      'Photo capture and gallery system',
      'Mobile-optimized interfaces',
      'Feature Tracker (this system!)',
      'Enhanced search capabilities',
    ],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'v0.4.0',
    version: '0.4.0',
    codename: 'Pinning',
    name: 'Automation & Integration Release',
    description: 'Environmental monitoring, automation rules, and external integrations',
    status: 'planning',
    mandatoryFeatures: [],
    optionalFeatures: [],
    highlights: [
      'Environmental sensor integration',
      'Automation rules engine',
      'Calendar/reminder integration',
      'Data export/import',
    ],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'v0.5.0',
    version: '0.5.0',
    codename: 'Fruiting',
    name: 'Analytics & Insights Release',
    description: 'Advanced analytics, predictions, and optimization recommendations',
    status: 'planning',
    mandatoryFeatures: [],
    optionalFeatures: [],
    highlights: [
      'Yield prediction models',
      'Optimization recommendations',
      'Comparative analytics',
      'Strain performance tracking',
    ],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'v1.0.0',
    version: '1.0.0',
    codename: 'Golden Teacher',
    name: 'Production Release',
    description: 'Stable, tested, production-ready release with full feature set',
    status: 'planning',
    mandatoryFeatures: [],
    optionalFeatures: [],
    highlights: [
      'Full test coverage',
      'Security audit complete',
      'Performance optimized',
      'Documentation complete',
      'Multi-user support',
    ],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
];

// ----------------------------------------------------------------------------
// DEFAULT FILTER PRESETS
// ----------------------------------------------------------------------------

export const DEFAULT_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'current-work',
    name: 'Current Work',
    icon: '🔥',
    filters: {
      status: ['in_progress', 'testing'],
    },
    isDefault: true,
  },
  {
    id: 'ready-to-start',
    name: 'Ready to Start',
    icon: '🚀',
    filters: {
      status: ['planned'],
      isReady: true,
    },
  },
  {
    id: 'blocked',
    name: 'Blocked',
    icon: '🚧',
    filters: {
      hasBlockers: true,
    },
  },
  {
    id: 'critical-path',
    name: 'Critical Path',
    icon: '⚡',
    filters: {
      priority: ['critical', 'high'],
      status: ['planned', 'in_progress', 'testing'],
    },
  },
  {
    id: 'bugs',
    name: 'Bug Fixes',
    icon: '🐛',
    filters: {
      category: ['bug_fix'],
    },
  },
  {
    id: 'next-release',
    name: 'Next Release',
    icon: '📦',
    filters: {
      milestone: ['v0.3.0'],
    },
  },
  {
    id: 'mobile',
    name: 'Mobile Features',
    icon: '📱',
    filters: {
      tags: ['mobile'],
    },
  },
];

// ----------------------------------------------------------------------------
// DEFAULT VIEW PREFERENCES
// ----------------------------------------------------------------------------

export const DEFAULT_VIEW_PREFERENCES: ViewPreferences = {
  defaultView: 'kanban',
  showArchived: false,
  showCompleted: false,
  groupBy: 'status',
  sortBy: 'priority',
  sortDirection: 'asc',
  collapsedGroups: [],
  expandedFeatureIds: [],
};

// ----------------------------------------------------------------------------
// INITIAL STATE
// ----------------------------------------------------------------------------

/**
 * Get initial Feature Tracker state
 */
export function getInitialFeatureTrackerState(): FeatureTrackerState {
  return {
    versionInfo: APP_VERSION_INFO,
    milestones: MILESTONES,
    features: [], // Will be populated from migration
    changelog: [],
    recentActivity: [],
    viewPreferences: DEFAULT_VIEW_PREFERENCES,
    filterPresets: DEFAULT_FILTER_PRESETS,
    activeFilters: {},
  };
}

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Get current milestone
 */
export function getCurrentMilestone(): Milestone | undefined {
  return MILESTONES.find(m => m.id === APP_VERSION_INFO.currentMilestoneId);
}

/**
 * Get next milestone
 */
export function getNextMilestone(): Milestone | undefined {
  return MILESTONES.find(m => m.id === APP_VERSION_INFO.nextMilestoneId);
}

/**
 * Get milestone by ID
 */
export function getMilestoneById(id: string): Milestone | undefined {
  return MILESTONES.find(m => m.id === id);
}

/**
 * Get milestones by status
 */
export function getMilestonesByStatus(status: Milestone['status']): Milestone[] {
  return MILESTONES.filter(m => m.status === status);
}

/**
 * Generate unique feature ID
 */
export function generateFeatureId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `feat-${timestamp}-${random}`;
}

/**
 * Generate changelog entry ID
 */
export function generateChangelogId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `log-${timestamp}-${random}`;
}

// ----------------------------------------------------------------------------
// STATUS DISPLAY HELPERS
// ----------------------------------------------------------------------------

export const STATUS_CONFIG = {
  idea: { label: 'Idea', color: 'text-purple-400', bg: 'bg-purple-950/50', icon: '💡' },
  backlog: { label: 'Backlog', color: 'text-zinc-400', bg: 'bg-zinc-800', icon: '📋' },
  planned: { label: 'Planned', color: 'text-blue-400', bg: 'bg-blue-950/50', icon: '📅' },
  in_progress: { label: 'In Progress', color: 'text-amber-400', bg: 'bg-amber-950/50', icon: '🔨' },
  testing: { label: 'Testing', color: 'text-cyan-400', bg: 'bg-cyan-950/50', icon: '🧪' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-950/50', icon: '✅' },
  blocked: { label: 'Blocked', color: 'text-red-400', bg: 'bg-red-950/50', icon: '🚧' },
  cancelled: { label: 'Cancelled', color: 'text-zinc-500', bg: 'bg-zinc-900', icon: '❌' },
  deferred: { label: 'Deferred', color: 'text-orange-400', bg: 'bg-orange-950/50', icon: '⏸️' },
};

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-950/50', icon: '🔴' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-950/50', icon: '🟠' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-950/50', icon: '🟡' },
  low: { label: 'Low', color: 'text-blue-400', bg: 'bg-blue-950/50', icon: '🔵' },
  wishlist: { label: 'Wishlist', color: 'text-purple-400', bg: 'bg-purple-950/50', icon: '🟣' },
};

export const CATEGORY_CONFIG = {
  core: { label: 'Core', icon: '⚙️' },
  ui: { label: 'UI', icon: '🎨' },
  ux: { label: 'UX', icon: '✨' },
  data: { label: 'Data', icon: '💾' },
  integration: { label: 'Integration', icon: '🔗' },
  optimization: { label: 'Optimization', icon: '⚡' },
  bug_fix: { label: 'Bug Fix', icon: '🐛' },
  enhancement: { label: 'Enhancement', icon: '📈' },
  security: { label: 'Security', icon: '🔒' },
  documentation: { label: 'Documentation', icon: '📚' },
  infrastructure: { label: 'Infrastructure', icon: '🏗️' },
  mobile: { label: 'Mobile', icon: '📱' },
};
