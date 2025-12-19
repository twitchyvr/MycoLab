// ============================================================================
// FEATURE TRACKER PAGE
// Main container for the Feature Tracker with multiple view modes
// ============================================================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type {
  Feature,
  FeatureFilters,
  ViewMode,
  FeatureStatus,
  FeaturePriority,
  FeatureCategory,
} from '../../data/feature-tracker/types';
import {
  activeFeatures,
  archivedFeatures,
  MILESTONES,
  APP_VERSION_INFO,
  DEFAULT_FILTER_PRESETS,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORY_CONFIG,
  calculateFeatureStats,
  filterFeatures,
  sortFeatures,
  searchFeatures,
  extractAllTags,
  getRecommendedFeatures,
} from '../../data/feature-tracker';
import { FeatureCard } from './shared/FeatureCard';
import { StatusBadge, PriorityBadge, MilestoneBadge } from './shared/StatusBadge';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Kanban: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="12" rx="1" />
      <rect x="17" y="3" width="5" height="15" rx="1" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Target: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  GitBranch: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Archive: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
};

// ============================================================================
// VIEW MODE CONFIG
// ============================================================================

const VIEW_MODES: { id: ViewMode; label: string; icon: React.FC; mobileHidden?: boolean }[] = [
  { id: 'list', label: 'List', icon: Icons.List },
  { id: 'kanban', label: 'Kanban', icon: Icons.Kanban },
  { id: 'milestone', label: 'Milestones', icon: Icons.Target },
  { id: 'timeline', label: 'Timeline', icon: Icons.Calendar, mobileHidden: true },
  { id: 'dependency', label: 'Dependencies', icon: Icons.GitBranch, mobileHidden: true },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const FeatureTrackerPage: React.FC = () => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FeatureFilters>({});

  // All features (active + optionally archived)
  const allFeatures = useMemo(() => {
    return showArchived
      ? [...activeFeatures, ...archivedFeatures]
      : activeFeatures;
  }, [showArchived]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchFeatures(allFeatures, searchQuery);
  }, [allFeatures, searchQuery]);

  // Filtered features
  const filteredFeatures = useMemo(() => {
    const source = searchResults ? searchResults.map(r => r.feature) : allFeatures;
    return filterFeatures(source, filters);
  }, [allFeatures, searchResults, filters]);

  // Stats
  const stats = useMemo(() => calculateFeatureStats(activeFeatures), []);

  // Recommended features
  const recommended = useMemo(() => getRecommendedFeatures(activeFeatures, 3), []);

  // All tags
  const allTags = useMemo(() => extractAllTags(allFeatures), [allFeatures]);

  // Active milestone
  const activeMilestone = useMemo(() =>
    MILESTONES.find(m => m.id === APP_VERSION_INFO.currentMilestoneId),
    []
  );

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toggle feature expansion
  const toggleFeatureExpand = useCallback((id: string) => {
    setExpandedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Filter handlers
  const toggleStatusFilter = (status: FeatureStatus) => {
    setFilters(prev => {
      const current = prev.status || [];
      const next = current.includes(status)
        ? current.filter(s => s !== status)
        : [...current, status];
      return { ...prev, status: next.length ? next : undefined };
    });
  };

  const togglePriorityFilter = (priority: FeaturePriority) => {
    setFilters(prev => {
      const current = prev.priority || [];
      const next = current.includes(priority)
        ? current.filter(p => p !== priority)
        : [...current, priority];
      return { ...prev, priority: next.length ? next : undefined };
    });
  };

  const toggleCategoryFilter = (category: FeatureCategory) => {
    setFilters(prev => {
      const current = prev.category || [];
      const next = current.includes(category)
        ? current.filter(c => c !== category)
        : [...current, category];
      return { ...prev, category: next.length ? next : undefined };
    });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery;

  // Group features by status for Kanban
  const featuresByStatus = useMemo(() => {
    const groups: Record<FeatureStatus, Feature[]> = {
      idea: [],
      backlog: [],
      planned: [],
      in_progress: [],
      testing: [],
      completed: [],
      blocked: [],
      cancelled: [],
      deferred: [],
    };
    for (const feature of filteredFeatures) {
      groups[feature.status].push(feature);
    }
    return groups;
  }, [filteredFeatures]);

  // Group features by milestone
  const featuresByMilestone = useMemo(() => {
    const groups = new Map<string, Feature[]>();
    groups.set('unassigned', []);

    for (const milestone of MILESTONES) {
      groups.set(milestone.id, []);
    }

    for (const feature of filteredFeatures) {
      const key = feature.targetMilestone || 'unassigned';
      const existing = groups.get(key) || [];
      existing.push(feature);
      groups.set(key, existing);
    }

    return groups;
  }, [filteredFeatures]);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="px-4 py-4">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍄</span>
              <div>
                <h1 className="text-xl font-bold text-zinc-100">Feature Tracker</h1>
                <p className="text-xs text-zinc-500">
                  {activeMilestone?.codename} • v{APP_VERSION_INFO.current}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Search (⌘K)"
              >
                <Icons.Search />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'text-emerald-400 bg-emerald-950/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
                title="Filters"
              >
                <Icons.Filter />
              </button>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`p-2 rounded-lg transition-colors ${
                  showArchived
                    ? 'text-amber-400 bg-amber-950/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
                title={showArchived ? 'Hide Archived' : 'Show Archived'}
              >
                <Icons.Archive />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-zinc-500">Progress:</span>
              <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.round((stats.completedCount / stats.total) * 100)}%` }}
                />
              </div>
              <span className="text-zinc-400">
                {Math.round((stats.completedCount / stats.total) * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-amber-400">
              <span className="text-lg">🔨</span>
              <span>{stats.inProgressCount}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-red-400">
              <span className="text-lg">🚧</span>
              <span>{stats.blockedCount}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-blue-400">
              <span className="text-lg">📅</span>
              <span>{stats.byStatus.planned}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-zinc-400">
              <span className="text-lg">📋</span>
              <span>{stats.byStatus.backlog}</span>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 mt-3">
            {VIEW_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mode.mobileHidden ? 'hidden md:flex' : 'flex'
                } ${
                  viewMode === mode.id
                    ? 'bg-emerald-950/50 text-emerald-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <mode.icon />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-zinc-400">Filters</span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Status filters */}
            <div className="mb-3">
              <p className="text-xs text-zinc-500 mb-2">Status</p>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(STATUS_CONFIG) as FeatureStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                      filters.status?.includes(status)
                        ? `${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color} ring-1 ring-current`
                        : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {STATUS_CONFIG[status].icon} {STATUS_CONFIG[status].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority filters */}
            <div className="mb-3">
              <p className="text-xs text-zinc-500 mb-2">Priority</p>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(PRIORITY_CONFIG) as FeaturePriority[]).map(priority => (
                  <button
                    key={priority}
                    onClick={() => togglePriorityFilter(priority)}
                    className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                      filters.priority?.includes(priority)
                        ? `${PRIORITY_CONFIG[priority].bg} ${PRIORITY_CONFIG[priority].color} ring-1 ring-current`
                        : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {PRIORITY_CONFIG[priority].icon} {PRIORITY_CONFIG[priority].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filters */}
            <div>
              <p className="text-xs text-zinc-500 mb-2">Category</p>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(CATEGORY_CONFIG) as FeatureCategory[]).map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategoryFilter(category)}
                    className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                      filters.category?.includes(category)
                        ? 'bg-emerald-950/50 text-emerald-400 ring-1 ring-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {CATEGORY_CONFIG[category].icon} {CATEGORY_CONFIG[category].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommended features - show when no filters active */}
      {!hasActiveFilters && recommended.length > 0 && viewMode !== 'kanban' && (
        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <Icons.Zap />
            <h2 className="text-sm font-medium text-zinc-300">Recommended Next</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {recommended.map(feature => (
              <div
                key={feature.id}
                className="shrink-0 w-72 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <PriorityBadge priority={feature.priority} size="sm" />
                  <StatusBadge status={feature.status} size="sm" showIcon={false} />
                </div>
                <p className="text-sm font-medium text-zinc-100 line-clamp-2">
                  {feature.title}
                </p>
                {feature.targetMilestone && (
                  <div className="mt-2">
                    <MilestoneBadge
                      milestone={feature.targetMilestone}
                      isMandatory={feature.isMandatory}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="px-4 py-4">
        {/* Results count */}
        {hasActiveFilters && (
          <p className="text-sm text-zinc-500 mb-4">
            Showing {filteredFeatures.length} of {allFeatures.length} features
          </p>
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {sortFeatures(filteredFeatures, 'priority', 'asc').map(feature => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                variant="default"
                isExpanded={expandedFeatures.has(feature.id)}
                onToggleExpand={() => toggleFeatureExpand(feature.id)}
              />
            ))}
            {filteredFeatures.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                No features match your filters
              </div>
            )}
          </div>
        )}

        {/* KANBAN VIEW */}
        {viewMode === 'kanban' && (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
            {/* Only show active status columns */}
            {(['in_progress', 'testing', 'planned', 'blocked', 'backlog'] as FeatureStatus[]).map(status => {
              const features = featuresByStatus[status];
              const config = STATUS_CONFIG[status];

              return (
                <div
                  key={status}
                  className="shrink-0 w-80 bg-zinc-900/30 rounded-xl border border-zinc-800"
                >
                  {/* Column header */}
                  <div className={`px-4 py-3 border-b border-zinc-800 ${config.bg}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span className={`font-medium ${config.color}`}>{config.label}</span>
                      </div>
                      <span className="text-sm text-zinc-500">{features.length}</span>
                    </div>
                  </div>

                  {/* Column content */}
                  <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                    {features.map(feature => (
                      <FeatureCard
                        key={feature.id}
                        feature={feature}
                        variant="default"
                        isExpanded={expandedFeatures.has(feature.id)}
                        onToggleExpand={() => toggleFeatureExpand(feature.id)}
                        showMilestone={true}
                      />
                    ))}
                    {features.length === 0 && (
                      <div className="text-center py-8 text-zinc-600 text-sm">
                        No features
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Completed column (collapsed by default) */}
            {showArchived && (
              <div className="shrink-0 w-80 bg-zinc-900/30 rounded-xl border border-zinc-800">
                <div className={`px-4 py-3 border-b border-zinc-800 ${STATUS_CONFIG.completed.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{STATUS_CONFIG.completed.icon}</span>
                      <span className={`font-medium ${STATUS_CONFIG.completed.color}`}>
                        Completed
                      </span>
                    </div>
                    <span className="text-sm text-zinc-500">
                      {featuresByStatus.completed.length}
                    </span>
                  </div>
                </div>
                <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                  {featuresByStatus.completed.slice(0, 10).map(feature => (
                    <FeatureCard
                      key={feature.id}
                      feature={feature}
                      variant="compact"
                    />
                  ))}
                  {featuresByStatus.completed.length > 10 && (
                    <p className="text-center text-xs text-zinc-500 py-2">
                      +{featuresByStatus.completed.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MILESTONE VIEW */}
        {viewMode === 'milestone' && (
          <div className="space-y-6">
            {MILESTONES.filter(m => m.status !== 'released' || showArchived).map(milestone => {
              const features = featuresByMilestone.get(milestone.id) || [];
              const mandatory = features.filter(f => f.isMandatory);
              const optional = features.filter(f => !f.isMandatory);
              const completed = features.filter(f => f.status === 'completed');
              const progress = features.length > 0
                ? Math.round((completed.length / features.length) * 100)
                : 0;

              return (
                <div
                  key={milestone.id}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden"
                >
                  {/* Milestone header */}
                  <div className="px-4 py-4 border-b border-zinc-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">📦</span>
                          <h3 className="text-lg font-bold text-zinc-100">
                            {milestone.version}
                          </h3>
                          {milestone.codename && (
                            <span className="text-sm text-zinc-500">
                              "{milestone.codename}"
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            milestone.status === 'released'
                              ? 'bg-emerald-950/50 text-emerald-400'
                              : milestone.status === 'active'
                              ? 'bg-amber-950/50 text-amber-400'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            {milestone.status}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400">{milestone.name}</p>
                        {milestone.description && (
                          <p className="text-xs text-zinc-500 mt-1">{milestone.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-zinc-100">{progress}%</div>
                        <div className="text-xs text-zinc-500">
                          {completed.length}/{features.length} features
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Features list */}
                  {features.length > 0 && (
                    <div className="p-4">
                      {mandatory.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2">
                            Mandatory ({mandatory.length})
                          </h4>
                          <div className="space-y-2">
                            {mandatory.map(feature => (
                              <FeatureCard
                                key={feature.id}
                                feature={feature}
                                variant="compact"
                                onClick={() => toggleFeatureExpand(feature.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {optional.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                            Optional ({optional.length})
                          </h4>
                          <div className="space-y-2">
                            {optional.slice(0, 5).map(feature => (
                              <FeatureCard
                                key={feature.id}
                                feature={feature}
                                variant="compact"
                                onClick={() => toggleFeatureExpand(feature.id)}
                              />
                            ))}
                            {optional.length > 5 && (
                              <p className="text-xs text-zinc-500 text-center py-2">
                                +{optional.length - 5} more features
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {features.length === 0 && (
                    <div className="p-8 text-center text-zinc-600 text-sm">
                      No features assigned to this milestone
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned features */}
            {(featuresByMilestone.get('unassigned')?.length || 0) > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <h3 className="text-base font-medium text-zinc-400">
                    Unassigned ({featuresByMilestone.get('unassigned')?.length})
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  {featuresByMilestone.get('unassigned')?.slice(0, 10).map(feature => (
                    <FeatureCard
                      key={feature.id}
                      feature={feature}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TIMELINE VIEW */}
        {viewMode === 'timeline' && (
          <div className="text-center py-12 text-zinc-500">
            <Icons.Calendar />
            <p className="mt-2">Timeline view coming soon</p>
            <p className="text-xs text-zinc-600 mt-1">
              Will show chronological history of completed features
            </p>
          </div>
        )}

        {/* DEPENDENCY VIEW */}
        {viewMode === 'dependency' && (
          <div className="text-center py-12 text-zinc-500">
            <Icons.GitBranch />
            <p className="mt-2">Dependency graph coming soon</p>
            <p className="text-xs text-zinc-600 mt-1">
              Will visualize feature dependencies and critical paths
            </p>
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
          />
          <div className="relative w-full max-w-2xl bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
              <Icons.Search />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search features..."
                className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 outline-none"
                autoFocus
              />
              <kbd className="hidden sm:inline px-2 py-0.5 text-xs text-zinc-500 bg-zinc-800 rounded">
                ESC
              </kbd>
            </div>

            {/* Search results */}
            <div className="max-h-96 overflow-y-auto">
              {searchQuery && searchResults && searchResults.length > 0 ? (
                <div className="p-2">
                  {searchResults.slice(0, 10).map(({ feature, score }) => (
                    <button
                      key={feature.id}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-lg transition-colors text-left"
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                        toggleFeatureExpand(feature.id);
                      }}
                    >
                      <PriorityBadge priority={feature.priority} showLabel={false} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-100 truncate">
                          {feature.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={feature.status} size="sm" showIcon={false} />
                          {feature.targetMilestone && (
                            <span className="text-xs text-zinc-500">{feature.targetMilestone}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="p-8 text-center text-zinc-500">
                  No features found for "{searchQuery}"
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-xs text-zinc-500 mb-3">Quick filters</p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_FILTER_PRESETS.slice(0, 6).map(preset => (
                      <button
                        key={preset.id}
                        className="px-3 py-1.5 text-sm bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
                        onClick={() => {
                          setFilters(preset.filters);
                          setShowSearch(false);
                        }}
                      >
                        {preset.icon} {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureTrackerPage;
