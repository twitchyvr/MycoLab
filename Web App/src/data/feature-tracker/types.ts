// ============================================================================
// FEATURE TRACKER TYPE DEFINITIONS
// Comprehensive types for the MycoLab Feature Tracker system
// ============================================================================

// ----------------------------------------------------------------------------
// BASE TYPES
// ----------------------------------------------------------------------------

export type UUID = string;
export type ISODateString = string;

// Semantic versioning (major.minor.patch)
export type SemanticVersion = `${number}.${number}.${number}`;

// ----------------------------------------------------------------------------
// STATUS & PRIORITY
// ----------------------------------------------------------------------------

export type FeatureStatus =
  | 'idea'           // Just an idea, not yet evaluated
  | 'backlog'        // Evaluated, in the backlog
  | 'planned'        // Scheduled for a specific version
  | 'in_progress'    // Currently being worked on
  | 'testing'        // In testing/QA
  | 'completed'      // Done and merged
  | 'blocked'        // Blocked by dependency or issue
  | 'cancelled'      // Won't be implemented
  | 'deferred';      // Pushed to later version

export type FeaturePriority =
  | 'critical'       // Must have for release
  | 'high'           // Should have, important
  | 'medium'         // Nice to have for this version
  | 'low'            // Can wait
  | 'wishlist';      // Future consideration

export type FeatureCategory =
  | 'core'           // Core functionality
  | 'ui'             // User interface
  | 'ux'             // User experience improvements
  | 'data'           // Data model, database, storage
  | 'integration'    // External integrations
  | 'optimization'   // Performance improvements
  | 'bug_fix'        // Bug fixes
  | 'enhancement'    // Enhancements to existing features
  | 'security'       // Security improvements
  | 'documentation'  // Documentation
  | 'infrastructure' // Build, deploy, CI/CD
  | 'mobile';        // Mobile-specific features

// ----------------------------------------------------------------------------
// VERSION / MILESTONE
// ----------------------------------------------------------------------------

export type MilestoneStatus = 'planning' | 'active' | 'frozen' | 'released';

export interface Milestone {
  id: string;                          // e.g., "v0.3.0"
  version: SemanticVersion;            // e.g., "0.3.0"
  codename?: string;                   // e.g., "Golden Teacher"
  name: string;                        // e.g., "Photo System Release"
  description?: string;
  status: MilestoneStatus;

  // Dates
  plannedDate?: ISODateString;         // Target release date
  startedAt?: ISODateString;           // When work began
  frozenAt?: ISODateString;            // When feature freeze happened
  releasedAt?: ISODateString;          // Actual release date

  // Feature tracking
  mandatoryFeatures: UUID[];           // Must be completed for release
  optionalFeatures: UUID[];            // Nice to have for this release

  // Release notes
  highlights?: string[];               // Key features for release notes
  breakingChanges?: string[];          // Breaking changes to document

  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Current application version info
export interface AppVersionInfo {
  current: SemanticVersion;            // e.g., "0.2.0"
  currentMilestoneId: string;          // Active milestone being worked on
  nextMilestoneId?: string;            // Next planned milestone
  releaseHistory: {
    version: SemanticVersion;
    releasedAt: ISODateString;
    milestoneId: string;
  }[];
}

// ----------------------------------------------------------------------------
// FEATURE
// ----------------------------------------------------------------------------

export interface Feature {
  id: UUID;

  // Core info
  title: string;
  description?: string;
  category: FeatureCategory;
  status: FeatureStatus;
  priority: FeaturePriority;

  // Version targeting
  targetMilestone?: string;            // Which version this is planned for
  isMandatory?: boolean;               // Is this mandatory for the milestone?

  // Tagging for flexible grouping
  tags?: string[];                     // e.g., ["mobile", "offline", "cultures"]

  // Effort tracking
  estimatedHours?: number;
  actualHours?: number;
  complexity?: 'trivial' | 'simple' | 'moderate' | 'complex' | 'epic';

  // Dependencies & Relations
  dependencies?: UUID[];               // Features that must be done first
  blockedBy?: string;                  // External blocker description
  relatedFeatures?: UUID[];            // Related but not blocking
  parentFeatureId?: UUID;              // For sub-features/tasks
  childFeatureIds?: UUID[];            // Sub-features

  // Content
  notes?: string;                      // User-facing summary notes
  technicalNotes?: string;             // Implementation details (for devs/AI)
  acceptanceCriteria?: string[];       // Definition of done

  // External links
  prLinks?: string[];                  // GitHub PR links
  issueLinks?: string[];               // GitHub issue links
  documentationLink?: string;          // Link to docs

  // Audit trail
  createdAt: ISODateString;
  updatedAt: ISODateString;
  completedAt?: ISODateString;

  // For archived features
  archivedAt?: ISODateString;
  archiveReason?: 'completed' | 'superseded' | 'deprecated' | 'cancelled';
  supersededById?: UUID;               // If replaced by another feature
}

// Compact feature for list views
export type FeatureSummary = Pick<Feature,
  | 'id'
  | 'title'
  | 'status'
  | 'priority'
  | 'category'
  | 'targetMilestone'
  | 'isMandatory'
  | 'tags'
  | 'estimatedHours'
  | 'actualHours'
>;

// ----------------------------------------------------------------------------
// CHANGELOG
// ----------------------------------------------------------------------------

export type ChangelogEntryType =
  | 'feature_added'       // New feature implemented
  | 'feature_updated'     // Feature modified
  | 'feature_removed'     // Feature removed
  | 'bug_fixed'           // Bug fix
  | 'performance'         // Performance improvement
  | 'security'            // Security fix
  | 'breaking_change'     // Breaking change
  | 'deprecation'         // Deprecation notice
  | 'documentation'       // Docs update
  | 'refactor'            // Code refactoring
  | 'dependency'          // Dependency update
  | 'release';            // Version release

export interface ChangelogEntry {
  id: UUID;
  type: ChangelogEntryType;

  // What changed
  title: string;
  description?: string;

  // Relations
  featureId?: UUID;                    // Related feature
  milestoneId?: string;                // Related milestone

  // Context
  prLink?: string;                     // PR that made the change
  commitHash?: string;                 // Git commit

  // For breaking changes
  migrationGuide?: string;             // How to migrate

  // Audit
  timestamp: ISODateString;
  author?: string;                     // Who made the change
}

// ----------------------------------------------------------------------------
// ACTIVITY / WORK LOG
// ----------------------------------------------------------------------------

export type ActivityType =
  | 'status_change'      // Feature status changed
  | 'priority_change'    // Priority changed
  | 'milestone_assigned' // Assigned to milestone
  | 'hours_logged'       // Work hours recorded
  | 'note_added'         // Note added
  | 'dependency_added'   // Dependency added
  | 'dependency_removed' // Dependency removed
  | 'blocked'            // Feature became blocked
  | 'unblocked'          // Feature unblocked
  | 'comment';           // General comment

export interface Activity {
  id: UUID;
  featureId: UUID;
  type: ActivityType;

  // What changed
  description: string;
  previousValue?: string;
  newValue?: string;

  // Audit
  timestamp: ISODateString;
  author?: string;
}

// ----------------------------------------------------------------------------
// FILTER & SEARCH
// ----------------------------------------------------------------------------

export interface FeatureFilters {
  status?: FeatureStatus[];
  priority?: FeaturePriority[];
  category?: FeatureCategory[];
  milestone?: string[];
  tags?: string[];
  isMandatory?: boolean;
  hasBlockers?: boolean;
  isReady?: boolean;                   // All dependencies met
  searchQuery?: string;
  dateRange?: {
    from?: ISODateString;
    to?: ISODateString;
  };
}

export interface FilterPreset {
  id: string;
  name: string;
  icon?: string;                       // Emoji or icon name
  filters: FeatureFilters;
  isDefault?: boolean;
}

// ----------------------------------------------------------------------------
// STATS & METRICS
// ----------------------------------------------------------------------------

export interface FeatureStats {
  total: number;
  byStatus: Record<FeatureStatus, number>;
  byPriority: Record<FeaturePriority, number>;
  byCategory: Record<FeatureCategory, number>;
  byMilestone: Record<string, number>;

  // Progress metrics
  completedCount: number;
  inProgressCount: number;
  blockedCount: number;

  // Time tracking
  totalEstimatedHours: number;
  totalActualHours: number;
  completedHours: number;
  remainingHours: number;

  // Velocity (for predictions)
  averageCompletionTime?: number;      // Average hours per feature
  lastWeekCompleted?: number;          // Features completed last 7 days
}

export interface MilestoneProgress {
  milestoneId: string;
  totalFeatures: number;
  mandatoryFeatures: number;
  mandatoryCompleted: number;
  optionalFeatures: number;
  optionalCompleted: number;
  percentComplete: number;
  mandatoryPercentComplete: number;
  blockedFeatures: number;
  estimatedDaysRemaining?: number;
}

// ----------------------------------------------------------------------------
// VIEW PREFERENCES
// ----------------------------------------------------------------------------

export type ViewMode = 'list' | 'kanban' | 'timeline' | 'milestone' | 'dependency';

export interface ViewPreferences {
  defaultView: ViewMode;
  showArchived: boolean;
  showCompleted: boolean;
  groupBy?: 'status' | 'priority' | 'category' | 'milestone' | 'none';
  sortBy?: 'priority' | 'status' | 'created' | 'updated' | 'title';
  sortDirection?: 'asc' | 'desc';
  collapsedGroups?: string[];
  expandedFeatureIds?: UUID[];
}

// ----------------------------------------------------------------------------
// FEATURE TRACKER STATE
// ----------------------------------------------------------------------------

export interface FeatureTrackerState {
  // App version info
  versionInfo: AppVersionInfo;

  // Milestones
  milestones: Milestone[];

  // Features (active only - archived loaded separately)
  features: Feature[];

  // Changelog
  changelog: ChangelogEntry[];

  // Activity log (recent, limited)
  recentActivity: Activity[];

  // User preferences
  viewPreferences: ViewPreferences;
  filterPresets: FilterPreset[];
  activeFilters: FeatureFilters;
}

// ----------------------------------------------------------------------------
// UTILITY TYPES
// ----------------------------------------------------------------------------

// For creating new features
export type NewFeature = Omit<Feature, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: UUID;
};

// For updating features
export type FeatureUpdate = Partial<Omit<Feature, 'id' | 'createdAt'>> & {
  id: UUID;
};

// For bulk operations
export interface BulkFeatureUpdate {
  featureIds: UUID[];
  updates: Partial<Pick<Feature, 'status' | 'priority' | 'targetMilestone' | 'tags'>>;
}
