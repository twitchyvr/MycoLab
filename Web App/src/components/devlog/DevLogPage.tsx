import React, { useState, useMemo, useCallback } from 'react';
import type { DevLogFeature, FeatureStatus, FeaturePriority } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

interface DevLogPageProps {
  features: DevLogFeature[];
  onUpdateStatus: (id: string, status: FeatureStatus) => void;
  onAddFeature: (feature: Omit<DevLogFeature, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

interface AnalyzedFeature extends DevLogFeature {
  isReady: boolean;
  blockedByList: string[];
  priorityScore: number;
  phase: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const priorityWeights: Record<FeaturePriority, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
  nice_to_have: 10,
};

const statusConfig: Record<FeatureStatus, { label: string; bg: string; text: string; dot: string }> = {
  completed: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  testing: { label: 'Testing', bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  planned: { label: 'Planned', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  backlog: { label: 'Backlog', bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-500' },
  blocked: { label: 'Blocked', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-zinc-700/10', text: 'text-zinc-500', dot: 'bg-zinc-600' },
};

const priorityConfig: Record<FeaturePriority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'text-red-400' },
  high: { label: 'High', color: 'text-orange-400' },
  medium: { label: 'Medium', color: 'text-yellow-400' },
  low: { label: 'Low', color: 'text-zinc-400' },
  nice_to_have: { label: 'Nice to Have', color: 'text-zinc-500' },
};

const categoryIcons: Record<string, string> = {
  core: '⚙️', ui: '🎨', data: '💾', integration: '🔌',
  optimization: '⚡', bug_fix: '🐛', enhancement: '✨',
};

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Search: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  X: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronLeft: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  ChevronDown: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Plus: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Filter: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  Clock: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Lock: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Link: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  Check: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Rocket: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  ),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractPhase(id: string): string {
  const match = id.match(/dev-(\d+)/);
  if (!match) return 'misc';
  const idNum = parseInt(match[1]);

  if (idNum >= 1200) return 'Recent Updates';
  if (idNum >= 800) return 'v1.0 Target';
  if (idNum >= 700) return 'v0.9.0';
  if (idNum >= 600) return 'Inline Creation';
  if (idNum >= 500) return 'Workflows';
  if (idNum >= 400) return 'Quick Actions';
  if (idNum >= 300) return 'Core Features';
  if (idNum >= 200) return 'Future';
  if (idNum >= 100) return 'Infrastructure';
  if (idNum >= 50) return 'Data Management';
  return 'Foundation';
}

function analyzeFeatures(features: DevLogFeature[]): AnalyzedFeature[] {
  const completedIds = new Set(
    features.filter(f => f.status === 'completed').map(f => f.id)
  );

  return features.map(feature => {
    const blockedByList: string[] = [];

    if (feature.dependencies) {
      for (const depId of feature.dependencies) {
        if (!completedIds.has(depId)) {
          const dep = features.find(f => f.id === depId);
          blockedByList.push(dep?.title || depId);
        }
      }
    }

    const isReady = blockedByList.length === 0 &&
                    feature.status !== 'completed' &&
                    feature.status !== 'cancelled';

    const priorityScore = priorityWeights[feature.priority] +
                          (feature.status === 'in_progress' ? 50 : 0) +
                          (feature.status === 'planned' ? 10 : 0);

    return {
      ...feature,
      isReady,
      blockedByList,
      priorityScore,
      phase: extractPhase(feature.id),
    };
  });
}

// ============================================================================
// FEATURE DETAIL VIEW (Full Screen)
// ============================================================================

const FeatureDetailView: React.FC<{
  feature: AnalyzedFeature;
  allFeatures: AnalyzedFeature[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: FeatureStatus) => void;
  onNavigate: (id: string) => void;
}> = ({ feature, allFeatures, onClose, onUpdateStatus, onNavigate }) => {
  const statusInfo = statusConfig[feature.status];
  const priorityInfo = priorityConfig[feature.priority];

  // Find dependent features (features that depend on this one)
  const dependentFeatures = useMemo(() => {
    return allFeatures.filter(f => f.dependencies?.includes(feature.id));
  }, [allFeatures, feature.id]);

  // Find blocking features (features this depends on that aren't complete)
  const blockingFeatures = useMemo(() => {
    if (!feature.dependencies) return [];
    return allFeatures.filter(f =>
      feature.dependencies?.includes(f.id) && f.status !== 'completed'
    );
  }, [allFeatures, feature.dependencies]);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Icons.ChevronLeft />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-zinc-500 font-mono">{feature.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                  {statusInfo.label}
                </span>
                <span className={`text-xs ${priorityInfo.color}`}>{priorityInfo.label} Priority</span>
              </div>
              <h1 className="text-xl font-bold text-white mt-1 truncate">{feature.title}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
        <div className="space-y-8">
          {/* Main Info */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              {feature.description && (
                <div>
                  <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Description</h2>
                  <p className="text-zinc-200 leading-relaxed">{feature.description}</p>
                </div>
              )}

              {/* Notes */}
              {feature.notes && (
                <div>
                  <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Notes</h2>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-zinc-300 bg-zinc-800/50 rounded-lg p-4 text-sm leading-relaxed">
                      {feature.notes}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Category</p>
                  <p className="text-white mt-1 flex items-center gap-2">
                    {categoryIcons[feature.category] || '📦'} {feature.category}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Phase</p>
                  <p className="text-white mt-1">{feature.phase}</p>
                </div>
                {feature.estimatedHours && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Estimated</p>
                    <p className="text-white mt-1 flex items-center gap-2">
                      <Icons.Clock /> {feature.estimatedHours}h
                    </p>
                  </div>
                )}
                {feature.actualHours && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Actual</p>
                    <p className="text-white mt-1">{feature.actualHours}h</p>
                  </div>
                )}
              </div>

              {/* Status Change */}
              {feature.status !== 'completed' && feature.status !== 'cancelled' && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Change Status</p>
                  <select
                    value={feature.status}
                    onChange={(e) => onUpdateStatus(feature.id, e.target.value as FeatureStatus)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="testing">Testing</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Dependencies */}
          {(blockingFeatures.length > 0 || feature.dependencies?.length) && (
            <div>
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Icons.Lock /> Dependencies ({feature.dependencies?.length || 0})
              </h2>
              {blockingFeatures.length > 0 && (
                <div className="mb-4 p-3 bg-red-950/30 border border-red-800/50 rounded-lg">
                  <p className="text-sm text-red-400 font-medium mb-2">Blocked by incomplete dependencies:</p>
                  <div className="space-y-2">
                    {blockingFeatures.map(dep => (
                      <button
                        key={dep.id}
                        onClick={() => onNavigate(dep.id)}
                        className="flex items-center gap-2 text-sm text-red-300 hover:text-white transition-colors"
                      >
                        <Icons.ChevronRight />
                        <span className="font-mono text-xs text-red-400">{dep.id}</span>
                        <span>{dep.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {feature.dependencies && (
                <div className="space-y-2">
                  {feature.dependencies.map(depId => {
                    const dep = allFeatures.find(f => f.id === depId);
                    const isComplete = dep?.status === 'completed';
                    return (
                      <button
                        key={depId}
                        onClick={() => dep && onNavigate(dep.id)}
                        className={`flex items-center gap-2 text-sm transition-colors ${
                          isComplete ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {isComplete ? <Icons.Check className="w-4 h-4" /> : <Icons.ChevronRight />}
                        <span className="font-mono text-xs">{depId}</span>
                        <span>{dep?.title || depId}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Dependents */}
          {dependentFeatures.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Icons.Link /> Unlocks ({dependentFeatures.length})
              </h2>
              <div className="space-y-2">
                {dependentFeatures.map(dep => (
                  <button
                    key={dep.id}
                    onClick={() => onNavigate(dep.id)}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    <Icons.ChevronRight />
                    <span className="font-mono text-xs">{dep.id}</span>
                    <span>{dep.title}</span>
                    <span className={`text-xs ${priorityConfig[dep.priority].color}`}>({dep.priority})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FEATURE LIST ITEM
// ============================================================================

const FeatureListItem: React.FC<{
  feature: AnalyzedFeature;
  onClick: () => void;
}> = ({ feature, onClick }) => {
  const statusInfo = statusConfig[feature.status];
  const priorityInfo = priorityConfig[feature.priority];

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-zinc-900/30 hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs text-zinc-500 font-mono">{feature.id}</span>
            <span className={`text-xs ${priorityInfo.color}`}>{feature.priority}</span>
            {feature.blockedByList.length > 0 && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <Icons.Lock className="w-3 h-3" /> Blocked
              </span>
            )}
          </div>
          <h3 className="font-medium text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
            {feature.title}
          </h3>
          {feature.description && (
            <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{feature.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-zinc-600">{categoryIcons[feature.category]} {feature.category}</span>
            <span className="text-xs text-zinc-600">{feature.phase}</span>
          </div>
        </div>
        <Icons.ChevronRight className="text-zinc-600 group-hover:text-zinc-400 transition-colors mt-2" />
      </div>
    </button>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DevLogPage: React.FC<DevLogPageProps> = ({ features, onUpdateStatus, onAddFeature }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeatureStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['Recent Updates', 'v1.0 Target']));
  const [viewMode, setViewMode] = useState<'phases' | 'list'>('phases');

  // Analyze features
  const analyzed = useMemo(() => analyzeFeatures(features), [features]);

  // Get unique categories
  const categories = useMemo(() => [...new Set(analyzed.map(f => f.category))].sort(), [analyzed]);

  // Filter features
  const filteredFeatures = useMemo(() => {
    let filtered = analyzed;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.title.toLowerCase().includes(query) ||
        f.description?.toLowerCase().includes(query) ||
        f.id.toLowerCase().includes(query) ||
        f.notes?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(f => f.category === categoryFilter);
    }

    return filtered.sort((a, b) => b.priorityScore - a.priorityScore);
  }, [analyzed, searchQuery, statusFilter, categoryFilter]);

  // Group by phase
  const byPhase = useMemo(() => {
    const groups: Record<string, AnalyzedFeature[]> = {};
    for (const f of filteredFeatures) {
      if (!groups[f.phase]) groups[f.phase] = [];
      groups[f.phase].push(f);
    }
    // Sort phases
    const phaseOrder = [
      'Recent Updates', 'v1.0 Target', 'v0.9.0', 'Workflows', 'Inline Creation',
      'Quick Actions', 'Core Features', 'Future', 'Infrastructure', 'Data Management', 'Foundation'
    ];
    return Object.entries(groups).sort((a, b) => {
      const aIdx = phaseOrder.indexOf(a[0]);
      const bIdx = phaseOrder.indexOf(b[0]);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });
  }, [filteredFeatures]);

  // Stats
  const stats = useMemo(() => ({
    total: analyzed.length,
    completed: analyzed.filter(f => f.status === 'completed').length,
    inProgress: analyzed.filter(f => f.status === 'in_progress').length,
    planned: analyzed.filter(f => f.status === 'planned').length,
  }), [analyzed]);

  // Selected feature
  const selectedFeature = useMemo(() => {
    if (!selectedFeatureId) return null;
    return analyzed.find(f => f.id === selectedFeatureId) || null;
  }, [analyzed, selectedFeatureId]);

  const togglePhase = useCallback((phase: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  }, []);

  const handleNavigate = useCallback((id: string) => {
    setSelectedFeatureId(id);
  }, []);

  // Add feature state
  const [newFeature, setNewFeature] = useState({
    title: '',
    description: '',
    category: 'enhancement' as DevLogFeature['category'],
    priority: 'medium' as FeaturePriority,
  });

  const handleAddFeature = () => {
    if (!newFeature.title.trim()) return;
    onAddFeature({
      ...newFeature,
      status: 'planned',
      estimatedHours: 0,
    });
    setNewFeature({ title: '', description: '', category: 'enhancement', priority: 'medium' });
    setShowAddModal(false);
  };

  // Show detail view if feature is selected
  if (selectedFeature) {
    return (
      <FeatureDetailView
        feature={selectedFeature}
        allFeatures={analyzed}
        onClose={() => setSelectedFeatureId(null)}
        onUpdateStatus={onUpdateStatus}
        onNavigate={handleNavigate}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Icons.Rocket /> Feature Tracker
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                {stats.completed}/{stats.total} completed • {stats.inProgress} in progress • {stats.planned} planned
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Icons.Plus />
              Add Feature
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search features..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <Icons.Filter className="w-4 h-4" />
              Filters
            </button>
            <div className="flex items-center bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('phases')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'phases' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Phases
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                List
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FeatureStatus | 'all')}
                className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5"
              >
                <option value="all">All Status</option>
                <option value="in_progress">In Progress</option>
                <option value="planned">Planned</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
                <option value="backlog">Backlog</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{categoryIcons[cat]} {cat}</option>
                ))}
              </select>
              {(statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Clear filters
                </button>
              )}
              <span className="text-sm text-zinc-500 ml-auto">
                {filteredFeatures.length} features
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {viewMode === 'phases' ? (
          <div className="space-y-4">
            {byPhase.map(([phase, items]) => {
              const phaseCompleted = items.filter(f => f.status === 'completed').length;
              const phasePercent = Math.round((phaseCompleted / items.length) * 100);
              const isExpanded = expandedPhases.has(phase);

              return (
                <div key={phase} className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => togglePhase(phase)}
                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
                      <h3 className="font-semibold text-white">{phase}</h3>
                      <span className="text-sm text-zinc-500">
                        {phaseCompleted}/{items.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${phasePercent}%` }}
                        />
                      </div>
                      <span className="text-sm text-zinc-400 w-10">{phasePercent}%</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-2">
                      {items.map(f => (
                        <FeatureListItem
                          key={f.id}
                          feature={f}
                          onClick={() => setSelectedFeatureId(f.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFeatures.map(f => (
              <FeatureListItem
                key={f.id}
                feature={f}
                onClick={() => setSelectedFeatureId(f.id)}
              />
            ))}
            {filteredFeatures.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                No features match your search.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Feature Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Add New Feature</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Title *</label>
                <input
                  type="text"
                  value={newFeature.title}
                  onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Feature title..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description</label>
                <textarea
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 h-24 resize-none"
                  placeholder="Feature description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Category</label>
                  <select
                    value={newFeature.category}
                    onChange={(e) => setNewFeature({ ...newFeature, category: e.target.value as DevLogFeature['category'] })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="core">Core</option>
                    <option value="ui">UI</option>
                    <option value="data">Data</option>
                    <option value="integration">Integration</option>
                    <option value="optimization">Optimization</option>
                    <option value="bug_fix">Bug Fix</option>
                    <option value="enhancement">Enhancement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Priority</label>
                  <select
                    value={newFeature.priority}
                    onChange={(e) => setNewFeature({ ...newFeature, priority: e.target.value as FeaturePriority })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="nice_to_have">Nice to Have</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFeature}
                disabled={!newFeature.title.trim()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
              >
                Add Feature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevLogPage;
