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
import {
  buildDependencyGraph,
  getGraphVisualizationData,
  getFeatureImpact,
  getWouldUnblock,
} from '../../data/feature-tracker/utils/dependencies';
import {
  getFullChangelog,
  getChangelogByVersion,
  getReleaseNotes,
} from '../../data/feature-tracker/changelog';
import type { ChangelogEntry } from '../../data/feature-tracker/types';
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
  History: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
};

// ============================================================================
// VIEW MODE CONFIG
// ============================================================================

type ExtendedViewMode = ViewMode | 'changelog';

const VIEW_MODES: { id: ExtendedViewMode; label: string; icon: React.FC; mobileHidden?: boolean }[] = [
  { id: 'list', label: 'List', icon: Icons.List },
  { id: 'kanban', label: 'Kanban', icon: Icons.Kanban },
  { id: 'milestone', label: 'Milestones', icon: Icons.Target },
  { id: 'timeline', label: 'Timeline', icon: Icons.Calendar, mobileHidden: true },
  { id: 'dependency', label: 'Dependencies', icon: Icons.GitBranch, mobileHidden: true },
  { id: 'changelog', label: 'Changelog', icon: Icons.History },
];

// ============================================================================
// TIMELINE VIEW COMPONENT
// ============================================================================

interface TimelineViewProps {
  features: Feature[];
  expandedFeatures: Set<string>;
  onToggleExpand: (id: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ features, expandedFeatures, onToggleExpand }) => {
  // Group features by completion month/year
  const timelineData = useMemo(() => {
    const completed = features
      .filter(f => f.status === 'completed' && f.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

    const inProgress = features
      .filter(f => f.status === 'in_progress' || f.status === 'testing')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const planned = features
      .filter(f => f.status === 'planned')
      .sort((a, b) => {
        const priorityOrder: Record<FeaturePriority, number> = { critical: 0, high: 1, medium: 2, low: 3, wishlist: 4 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    // Group completed by month
    const completedByMonth = new Map<string, Feature[]>();
    for (const feature of completed) {
      const date = new Date(feature.completedAt!);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = completedByMonth.get(key) || [];
      existing.push(feature);
      completedByMonth.set(key, existing);
    }

    return { completed, inProgress, planned, completedByMonth };
  }, [features]);

  const formatMonthKey = (key: string): string => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (features.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Icons.Calendar />
        <p className="mt-2">No features to display</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Currently Active Section */}
      {timelineData.inProgress.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-lg font-bold text-amber-400">Currently Active</h3>
            <span className="text-sm text-zinc-500">({timelineData.inProgress.length})</span>
          </div>
          <div className="ml-6 pl-6 border-l-2 border-amber-500/30 space-y-3">
            {timelineData.inProgress.map(feature => (
              <div
                key={feature.id}
                className="relative group cursor-pointer"
                onClick={() => onToggleExpand(feature.id)}
              >
                <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-amber-500/20 border-2 border-amber-500 group-hover:scale-125 transition-transform" />
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <PriorityBadge priority={feature.priority} size="sm" />
                        <StatusBadge status={feature.status} size="sm" />
                      </div>
                      <h4 className="font-medium text-zinc-100">{feature.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1">
                        Updated {formatDate(feature.updatedAt)}
                      </p>
                    </div>
                    {feature.estimatedHours && (
                      <div className="text-right text-xs text-zinc-500">
                        <span className="text-amber-400">{feature.estimatedHours}h</span> est
                      </div>
                    )}
                  </div>
                  {expandedFeatures.has(feature.id) && feature.description && (
                    <p className="text-sm text-zinc-400 mt-3 pt-3 border-t border-zinc-800">
                      {feature.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Up Next Section */}
      {timelineData.planned.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <h3 className="text-lg font-bold text-blue-400">Up Next</h3>
            <span className="text-sm text-zinc-500">({timelineData.planned.length})</span>
          </div>
          <div className="ml-6 pl-6 border-l-2 border-blue-500/30 space-y-3">
            {timelineData.planned.slice(0, 5).map(feature => (
              <div
                key={feature.id}
                className="relative group cursor-pointer"
                onClick={() => onToggleExpand(feature.id)}
              >
                <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-blue-500/20 border-2 border-blue-500 group-hover:scale-125 transition-transform" />
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-blue-500/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityBadge priority={feature.priority} size="sm" />
                  </div>
                  <h4 className="font-medium text-zinc-100">{feature.title}</h4>
                  {expandedFeatures.has(feature.id) && feature.description && (
                    <p className="text-sm text-zinc-400 mt-3 pt-3 border-t border-zinc-800">
                      {feature.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {timelineData.planned.length > 5 && (
              <p className="text-sm text-zinc-500 pl-4">
                +{timelineData.planned.length - 5} more planned
              </p>
            )}
          </div>
        </div>
      )}

      {/* Completed Timeline */}
      {timelineData.completedByMonth.size > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <h3 className="text-lg font-bold text-emerald-400">Completed</h3>
            <span className="text-sm text-zinc-500">({timelineData.completed.length})</span>
          </div>
          <div className="ml-6 pl-6 border-l-2 border-emerald-500/30 space-y-6">
            {Array.from(timelineData.completedByMonth.entries()).map(([monthKey, monthFeatures]) => (
              <div key={monthKey}>
                <div className="relative">
                  <div className="absolute -left-[33px] px-2 py-0.5 text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded">
                    {formatMonthKey(monthKey)}
                  </div>
                </div>
                <div className="pt-6 space-y-2">
                  {monthFeatures.map(feature => (
                    <div
                      key={feature.id}
                      className="relative group cursor-pointer"
                      onClick={() => onToggleExpand(feature.id)}
                    >
                      <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 group-hover:border-emerald-500 group-hover:scale-125 transition-all" />
                      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-3 hover:border-emerald-500/30 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500">✓</span>
                            <span className="text-zinc-300">{feature.title}</span>
                          </div>
                          <span className="text-xs text-zinc-500">
                            {formatDate(feature.completedAt!)}
                          </span>
                        </div>
                        {expandedFeatures.has(feature.id) && (
                          <div className="mt-2 pt-2 border-t border-zinc-800/50 text-sm text-zinc-500">
                            {feature.actualHours && (
                              <span className="text-emerald-400">{feature.actualHours}h</span>
                            )}
                            {feature.description && (
                              <p className="mt-1">{feature.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for completed */}
      {timelineData.completed.length === 0 && timelineData.inProgress.length === 0 && timelineData.planned.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Icons.Calendar />
          <p className="mt-2">No timeline data available</p>
          <p className="text-xs text-zinc-600 mt-1">
            Features with dates will appear here
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DEPENDENCY VIEW COMPONENT
// ============================================================================

interface DependencyViewProps {
  features: Feature[];
  expandedFeatures: Set<string>;
  onToggleExpand: (id: string) => void;
}

const DependencyView: React.FC<DependencyViewProps> = ({ features, expandedFeatures, onToggleExpand }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const graphData = useMemo(() => {
    const graph = buildDependencyGraph(features);
    const vizData = getGraphVisualizationData(graph);
    return { graph, ...vizData };
  }, [features]);

  const selectedNodeData = useMemo(() => {
    if (!selectedNode) return null;
    const node = graphData.graph.nodes.get(selectedNode);
    if (!node) return null;

    const impact = getFeatureImpact(selectedNode, graphData.graph);
    const wouldUnblock = getWouldUnblock(selectedNode, graphData.graph);

    return {
      node,
      impact,
      wouldUnblock,
    };
  }, [selectedNode, graphData.graph]);

  // Get the depth levels for visualization
  const nodesByDepth = useMemo(() => {
    const levels = new Map<number, typeof graphData.nodes>();
    for (const node of graphData.nodes) {
      const existing = levels.get(node.depth) || [];
      existing.push(node);
      levels.set(node.depth, existing);
    }
    return levels;
  }, [graphData.nodes]);

  const maxDepth = useMemo(() => {
    return Math.max(...Array.from(nodesByDepth.keys()), 0);
  }, [nodesByDepth]);

  if (features.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Icons.GitBranch />
        <p className="mt-2">No features to display</p>
      </div>
    );
  }

  // Check if there are any dependencies
  const hasDependencies = graphData.edges.length > 0;

  if (!hasDependencies) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Icons.GitBranch />
        <p className="mt-2">No dependencies defined</p>
        <p className="text-xs text-zinc-600 mt-1">
          Features with dependencies will show their relationships here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Graph Visualization */}
      <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-zinc-100">Dependency Graph</h3>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Critical Path</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-red-500" />
              <span>Blocked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Ready</span>
            </div>
          </div>
        </div>

        {/* Critical Path */}
        {graphData.graph.criticalPath.length > 0 && (
          <div className="mb-6 p-4 bg-amber-950/30 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-400 font-medium">🔥 Critical Path</span>
              <span className="text-xs text-amber-400/70">
                ({graphData.graph.criticalPath.length} features)
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {graphData.graph.criticalPath.map((id, index) => {
                const node = graphData.graph.nodes.get(id);
                if (!node) return null;
                return (
                  <React.Fragment key={id}>
                    <button
                      onClick={() => setSelectedNode(id)}
                      className={`px-2 py-1 text-sm rounded-lg transition-colors ${
                        selectedNode === id
                          ? 'bg-amber-500 text-zinc-900'
                          : 'bg-amber-950/50 text-amber-300 hover:bg-amber-900/50'
                      }`}
                    >
                      {node.feature.title}
                    </button>
                    {index < graphData.graph.criticalPath.length - 1 && (
                      <span className="text-amber-500">→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Graph by Depth Level */}
        <div className="space-y-4">
          {Array.from(nodesByDepth.entries()).sort((a, b) => a[0] - b[0]).map(([depth, nodes]) => (
            <div key={depth}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-zinc-500 font-medium">Level {depth}</span>
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs text-zinc-600">{nodes.length} features</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {nodes.map(node => {
                  const isSelected = selectedNode === node.id;
                  const isOnCriticalPath = node.isCriticalPath;
                  const isBlocked = !node.isReady;
                  const status = node.status;

                  let bgColor = 'bg-zinc-800 hover:bg-zinc-700';
                  let borderColor = 'border-zinc-700';
                  let textColor = 'text-zinc-300';

                  if (status === 'completed') {
                    bgColor = 'bg-emerald-950/50 hover:bg-emerald-900/50';
                    borderColor = 'border-emerald-500/30';
                    textColor = 'text-emerald-400';
                  } else if (isBlocked) {
                    borderColor = 'border-red-500/50';
                  } else if (isOnCriticalPath) {
                    bgColor = 'bg-amber-950/50 hover:bg-amber-900/50';
                    borderColor = 'border-amber-500/30';
                    textColor = 'text-amber-300';
                  } else if (node.isReady) {
                    borderColor = 'border-emerald-500/30';
                  }

                  if (isSelected) {
                    borderColor = 'border-emerald-500';
                    bgColor = 'bg-emerald-950/50';
                  }

                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(isSelected ? null : node.id)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${bgColor} ${borderColor} ${textColor}`}
                    >
                      <div className="flex items-center gap-2">
                        {status === 'completed' && <span>✓</span>}
                        {isBlocked && <span className="text-red-400">⚠</span>}
                        {isOnCriticalPath && status !== 'completed' && <span className="text-amber-400">🔥</span>}
                        <span className="max-w-32 truncate">{node.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side Panel - Node Details */}
      <div className="space-y-4">
        {/* Stats Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Graph Stats</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-zinc-100">{graphData.nodes.length}</div>
              <div className="text-xs text-zinc-500">Features</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-100">{graphData.edges.length}</div>
              <div className="text-xs text-zinc-500">Dependencies</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">{graphData.graph.roots.length}</div>
              <div className="text-xs text-zinc-500">Root Features</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">{maxDepth + 1}</div>
              <div className="text-xs text-zinc-500">Depth Levels</div>
            </div>
          </div>
        </div>

        {/* Selected Node Details */}
        {selectedNodeData ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-zinc-400">Feature Details</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <Icons.X />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-zinc-100">{selectedNodeData.node.feature.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedNodeData.node.feature.status} size="sm" />
                  <PriorityBadge priority={selectedNodeData.node.feature.priority} size="sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-zinc-800/50 rounded-lg">
                  <div className="text-lg font-bold text-blue-400">{selectedNodeData.node.dependsOn.length}</div>
                  <div className="text-xs text-zinc-500">Depends On</div>
                </div>
                <div className="p-2 bg-zinc-800/50 rounded-lg">
                  <div className="text-lg font-bold text-emerald-400">{selectedNodeData.node.blocks.length}</div>
                  <div className="text-xs text-zinc-500">Blocks</div>
                </div>
              </div>

              {selectedNodeData.node.blockedBy.length > 0 && (
                <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg">
                  <p className="text-xs text-red-400 font-medium mb-2">
                    ⚠ Blocked by ({selectedNodeData.node.blockedBy.length})
                  </p>
                  <div className="space-y-1">
                    {selectedNodeData.node.blockedBy.map(id => {
                      const blocker = graphData.graph.nodes.get(id);
                      return blocker ? (
                        <button
                          key={id}
                          onClick={() => setSelectedNode(id)}
                          className="block w-full text-left text-sm text-red-300 hover:text-red-200 truncate"
                        >
                          → {blocker.feature.title}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {selectedNodeData.wouldUnblock.length > 0 && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg">
                  <p className="text-xs text-emerald-400 font-medium mb-2">
                    ✓ Completing would unblock ({selectedNodeData.wouldUnblock.length})
                  </p>
                  <div className="space-y-1">
                    {selectedNodeData.wouldUnblock.map(feature => (
                      <button
                        key={feature.id}
                        onClick={() => setSelectedNode(feature.id)}
                        className="block w-full text-left text-sm text-emerald-300 hover:text-emerald-200 truncate"
                      >
                        → {feature.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedNodeData.impact > 0 && (
                <div className="text-center p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg">
                  <div className="text-2xl font-bold text-amber-400">{selectedNodeData.impact}</div>
                  <div className="text-xs text-amber-400/70">Total Impact (features affected)</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center text-zinc-500">
            <Icons.GitBranch />
            <p className="mt-2 text-sm">Select a feature to see details</p>
          </div>
        )}

        {/* Cycles Warning */}
        {graphData.graph.cycles.length > 0 && (
          <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4">
            <h3 className="text-sm font-medium text-red-400 mb-2">⚠ Circular Dependencies</h3>
            <p className="text-xs text-red-400/70">
              {graphData.graph.cycles.length} cycle(s) detected. This may cause issues.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// CHANGELOG VIEW COMPONENT
// ============================================================================

const CHANGELOG_TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  release: { icon: '🚀', color: 'text-purple-400', bg: 'bg-purple-950/50', label: 'Release' },
  feature_added: { icon: '✨', color: 'text-emerald-400', bg: 'bg-emerald-950/50', label: 'Feature' },
  feature_updated: { icon: '🔄', color: 'text-blue-400', bg: 'bg-blue-950/50', label: 'Update' },
  feature_removed: { icon: '🗑️', color: 'text-red-400', bg: 'bg-red-950/50', label: 'Removed' },
  bug_fixed: { icon: '🐛', color: 'text-orange-400', bg: 'bg-orange-950/50', label: 'Bug Fix' },
  performance: { icon: '⚡', color: 'text-yellow-400', bg: 'bg-yellow-950/50', label: 'Performance' },
  security: { icon: '🔒', color: 'text-red-400', bg: 'bg-red-950/50', label: 'Security' },
  breaking_change: { icon: '💥', color: 'text-red-400', bg: 'bg-red-950/50', label: 'Breaking' },
  deprecation: { icon: '⚠️', color: 'text-amber-400', bg: 'bg-amber-950/50', label: 'Deprecated' },
  documentation: { icon: '📚', color: 'text-cyan-400', bg: 'bg-cyan-950/50', label: 'Docs' },
  refactor: { icon: '🔧', color: 'text-zinc-400', bg: 'bg-zinc-800/50', label: 'Refactor' },
  dependency: { icon: '📦', color: 'text-indigo-400', bg: 'bg-indigo-950/50', label: 'Dependency' },
};

const ChangelogView: React.FC = () => {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const changelogByVersion = useMemo(() => getChangelogByVersion(), []);
  const fullChangelog = useMemo(() => getFullChangelog(), []);

  // Get versions sorted by semantic version (newest first)
  const versions = useMemo(() => {
    const versionKeys = Array.from(changelogByVersion.keys()).filter(v => v !== 'unversioned');
    return versionKeys.sort((a, b) => {
      const aParts = a.replace('v', '').split('.').map(Number);
      const bParts = b.replace('v', '').split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if ((bParts[i] || 0) !== (aParts[i] || 0)) {
          return (bParts[i] || 0) - (aParts[i] || 0);
        }
      }
      return 0;
    });
  }, [changelogByVersion]);

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (fullChangelog.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Icons.History />
        <p className="mt-2">No changelog entries yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Version Selector */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Versions</h3>
        <button
          onClick={() => setSelectedVersion(null)}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            selectedVersion === null
              ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          All Changes ({fullChangelog.length})
        </button>
        {versions.map(version => {
          const entries = changelogByVersion.get(version) || [];
          const releaseEntry = entries.find(e => e.type === 'release');
          const milestone = MILESTONES.find(m => m.id === version);

          return (
            <button
              key={version}
              onClick={() => setSelectedVersion(version)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selectedVersion === version
                  ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{version}</span>
                <span className="text-xs text-zinc-500">{entries.length}</span>
              </div>
              {milestone?.codename && (
                <p className="text-xs text-zinc-500 mt-0.5">"{milestone.codename}"</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Changelog Entries */}
      <div className="lg:col-span-3 space-y-4">
        {selectedVersion ? (
          <>
            {/* Version Header */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              {(() => {
                const notes = getReleaseNotes(selectedVersion);
                const milestone = MILESTONES.find(m => m.id === selectedVersion);
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🚀</span>
                      <h2 className="text-2xl font-bold text-zinc-100">{selectedVersion}</h2>
                      {milestone?.codename && (
                        <span className="text-zinc-500">"{milestone.codename}"</span>
                      )}
                    </div>
                    {milestone?.name && (
                      <p className="text-zinc-400 mb-2">{milestone.name}</p>
                    )}
                    {notes.date && (
                      <p className="text-sm text-zinc-500">Released {formatDate(notes.date)}</p>
                    )}
                    {notes.highlights.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-zinc-800">
                        <h4 className="text-sm font-medium text-zinc-400 mb-2">Highlights</h4>
                        <ul className="space-y-1">
                          {notes.highlights.map((h, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                              <span className="text-emerald-400">✓</span>
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Entries for this version */}
            <div className="space-y-2">
              {(changelogByVersion.get(selectedVersion) || [])
                .filter(e => e.type !== 'release')
                .map(entry => (
                  <ChangelogEntryCard key={entry.id} entry={entry} />
                ))}
            </div>
          </>
        ) : (
          /* All entries timeline */
          <div className="space-y-2">
            {fullChangelog.map(entry => (
              <ChangelogEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ChangelogEntryCard: React.FC<{ entry: ChangelogEntry }> = ({ entry }) => {
  const config = CHANGELOG_TYPE_CONFIG[entry.type] || CHANGELOG_TYPE_CONFIG.feature_added;

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`p-4 rounded-lg border ${config.bg} border-zinc-800 hover:border-zinc-700 transition-colors`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 text-xs rounded-full ${config.bg} ${config.color} border border-current/20`}>
              {config.label}
            </span>
            <h4 className="font-medium text-zinc-100">{entry.title}</h4>
          </div>
          {entry.description && (
            <p className="text-sm text-zinc-400 mt-1">{entry.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
            <span>{formatDate(entry.timestamp)}</span>
            {entry.milestoneId && (
              <span className="px-1.5 py-0.5 bg-zinc-800 rounded">{entry.milestoneId}</span>
            )}
            {entry.prLink && (
              <a href={entry.prLink} className="text-blue-400 hover:underline">PR Link</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FEATURE MODAL COMPONENT
// ============================================================================

interface FeatureModalProps {
  feature: Feature | null;
  onClose: () => void;
}

const FeatureModal: React.FC<FeatureModalProps> = ({ feature, onClose }) => {
  if (!feature) return null;

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={feature.status} size="sm" />
              <PriorityBadge priority={feature.priority} size="sm" />
              {feature.targetMilestone && (
                <MilestoneBadge milestone={feature.targetMilestone} isMandatory={feature.isMandatory} />
              )}
            </div>
            <h2 className="text-xl font-bold text-zinc-100">{feature.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Icons.X />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          {feature.description && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Description</h3>
              <p className="text-zinc-300">{feature.description}</p>
            </div>
          )}

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-500 mb-1">Category</p>
              <p className="text-zinc-300">{CATEGORY_CONFIG[feature.category]?.label || feature.category}</p>
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-500 mb-1">Complexity</p>
              <p className="text-zinc-300">{feature.complexity || 'Not set'}</p>
            </div>
            {feature.estimatedHours && (
              <div className="p-3 bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Estimated</p>
                <p className="text-zinc-300">{feature.estimatedHours} hours</p>
              </div>
            )}
            {feature.actualHours && (
              <div className="p-3 bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Actual</p>
                <p className="text-emerald-400">{feature.actualHours} hours</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {feature.tags && feature.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {feature.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {feature.notes && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Notes</h3>
              <div className="p-4 bg-zinc-800/50 rounded-lg text-sm text-zinc-300 whitespace-pre-wrap">
                {feature.notes}
              </div>
            </div>
          )}

          {/* Technical Notes */}
          {feature.technicalNotes && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Technical Notes</h3>
              <div className="p-4 bg-zinc-800/50 rounded-lg text-sm text-zinc-300 whitespace-pre-wrap font-mono text-xs">
                {feature.technicalNotes}
              </div>
            </div>
          )}

          {/* Acceptance Criteria */}
          {feature.acceptanceCriteria && feature.acceptanceCriteria.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Acceptance Criteria</h3>
              <ul className="space-y-1">
                {feature.acceptanceCriteria.map((criteria, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-emerald-400 mt-0.5">☐</span>
                    {criteria}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dependencies */}
          {feature.dependencies && feature.dependencies.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Dependencies ({feature.dependencies.length})</h3>
              <div className="space-y-1">
                {feature.dependencies.map(depId => {
                  const dep = [...activeFeatures, ...archivedFeatures].find(f => f.id === depId);
                  return (
                    <div key={depId} className="flex items-center gap-2 text-sm">
                      {dep ? (
                        <>
                          <StatusBadge status={dep.status} size="sm" showIcon={false} />
                          <span className="text-zinc-300">{dep.title}</span>
                        </>
                      ) : (
                        <span className="text-zinc-500">{depId}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-500 space-y-1">
            <p>Created: {formatDate(feature.createdAt)}</p>
            <p>Updated: {formatDate(feature.updatedAt)}</p>
            {feature.completedAt && <p>Completed: {formatDate(feature.completedAt)}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const FeatureTrackerPage: React.FC = () => {
  // State
  const [viewMode, setViewMode] = useState<ExtendedViewMode>('kanban');
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FeatureFilters>({});
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

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
          <TimelineView
            features={filteredFeatures}
            expandedFeatures={expandedFeatures}
            onToggleExpand={toggleFeatureExpand}
          />
        )}

        {/* DEPENDENCY VIEW */}
        {viewMode === 'dependency' && (
          <DependencyView
            features={filteredFeatures}
            expandedFeatures={expandedFeatures}
            onToggleExpand={toggleFeatureExpand}
          />
        )}

        {/* CHANGELOG VIEW */}
        {viewMode === 'changelog' && <ChangelogView />}
      </div>

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <FeatureModal
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
        />
      )}

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
