import React, { useState, useMemo } from 'react';
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

const statusColors: Record<FeatureStatus, { bg: string; text: string; border: string }> = {
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  in_progress: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  testing: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  planned: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  backlog: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' },
  blocked: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  cancelled: { bg: 'bg-zinc-700/10', text: 'text-zinc-500', border: 'border-zinc-700/30' },
};

const priorityColors: Record<FeaturePriority, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-zinc-400',
  nice_to_have: 'text-zinc-500',
};

const categoryIcons: Record<string, string> = {
  core: '⚙️',
  ui: '🎨',
  data: '💾',
  integration: '🔌',
  optimization: '⚡',
  bug_fix: '🐛',
  enhancement: '✨',
};

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Rocket: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>,
  Clock: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Lock: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Play: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Flag: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  ChevronDown: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Target: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  Zap: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  TrendingUp: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractPhase(id: string): string {
  // Extract the first digit(s) to determine phase
  const match = id.match(/dev-(\d+)/);
  if (!match) return 'misc';
  const idNum = parseInt(match[1]);

  // Map ID ranges to phases
  if (idNum >= 800) return 'v1.0 Target';
  if (idNum >= 700) return 'v0.9.0 Recent';
  if (idNum >= 600) return 'Inline Creation';
  if (idNum >= 500) return 'Workflows';
  if (idNum >= 460) return 'Environmental';
  if (idNum >= 450) return 'Reports';
  if (idNum >= 440) return 'Onboarding';
  if (idNum >= 430) return 'Data Integrity';
  if (idNum >= 420) return 'Dashboard';
  if (idNum >= 410) return 'Organization';
  if (idNum >= 400) return 'Quick Actions';
  if (idNum >= 300) return 'Core Features';
  if (idNum >= 200) return 'Future';
  if (idNum >= 180) return 'Virtual Lab';
  if (idNum >= 160) return 'Calculators';
  if (idNum >= 150) return 'UI Polish';
  if (idNum >= 140) return 'Search';
  if (idNum >= 130) return 'Mobile';
  if (idNum >= 120) return 'Infrastructure';
  if (idNum >= 110) return 'Configuration';
  if (idNum >= 100) return 'Notifications';
  if (idNum >= 90) return 'QR/Labels';
  if (idNum >= 80) return 'Analytics';
  if (idNum >= 70) return 'Inventory';
  if (idNum >= 60) return 'Photos';
  if (idNum >= 50) return 'Recipes';
  if (idNum >= 40) return 'Operations';
  if (idNum >= 30) return 'Mapping';
  if (idNum >= 20) return 'Library';
  if (idNum >= 10) return 'Tracking';
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
// COMPONENTS
// ============================================================================

const FeatureCard: React.FC<{
  feature: AnalyzedFeature;
  onUpdateStatus: (id: string, status: FeatureStatus) => void;
  isRecommended?: boolean;
  showPhase?: boolean;
}> = ({ feature, onUpdateStatus, isRecommended, showPhase }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className={`bg-zinc-900/50 border rounded-xl p-4 transition-all hover:border-zinc-600 ${
        isRecommended ? 'ring-2 ring-emerald-500/50 border-emerald-500/50' : statusColors[feature.status].border
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
          feature.status === 'completed' ? 'bg-emerald-400' :
          feature.status === 'in_progress' ? 'bg-blue-400' :
          feature.isReady ? 'bg-amber-400' : 'bg-zinc-600'
        }`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-500 font-mono">{feature.id}</span>
            {showPhase && (
              <span className="text-xs px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">{feature.phase}</span>
            )}
            <span className={`text-xs font-medium ${priorityColors[feature.priority]}`}>
              {feature.priority}
            </span>
            {isRecommended && (
              <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-medium">
                ⭐ Recommended
              </span>
            )}
          </div>

          <h4 className="font-medium text-white mt-1">{feature.title}</h4>

          {feature.description && (
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{feature.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded flex items-center gap-1">
              {categoryIcons[feature.category] || '📦'} {feature.category}
            </span>
            {feature.estimatedHours && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Icons.Clock /> {feature.estimatedHours}h
              </span>
            )}
            {feature.blockedByList.length > 0 && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <Icons.Lock /> Blocked by {feature.blockedByList.length}
              </span>
            )}
          </div>

          {/* Expanded details */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
              {feature.notes && (
                <p className="text-sm text-zinc-300">{feature.notes}</p>
              )}
              {feature.blockedByList.length > 0 && (
                <div className="text-sm">
                  <span className="text-red-400">Blocked by:</span>
                  <ul className="list-disc list-inside text-zinc-400 ml-2">
                    {feature.blockedByList.map((dep, i) => (
                      <li key={i}>{dep}</li>
                    ))}
                  </ul>
                </div>
              )}
              {feature.actualHours && (
                <p className="text-xs text-zinc-500">
                  Actual: {feature.actualHours}h (estimated {feature.estimatedHours}h)
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
          >
            {expanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
          </button>

          {feature.status !== 'completed' && feature.status !== 'cancelled' && (
            <select
              value={feature.status}
              onChange={(e) => onUpdateStatus(feature.id, e.target.value as FeatureStatus)}
              className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-emerald-500"
            >
              <option value="backlog">Backlog</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="testing">Testing</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          )}

          {feature.status === 'completed' && (
            <span className="text-emerald-400"><Icons.Check /></span>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}> = ({ icon, label, value, subValue, color = 'text-white' }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
    <div className="flex items-center gap-3">
      <div className={`${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        {subValue && <p className="text-xs text-zinc-500">{subValue}</p>}
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DevLogPage: React.FC<DevLogPageProps> = ({ features, onUpdateStatus, onAddFeature }) => {
  const [view, setView] = useState<'roadmap' | 'all' | 'ready' | 'blocked'>('roadmap');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['Foundation', 'Tracking']));

  // Analyze all features
  const analyzed = useMemo(() => analyzeFeatures(features), [features]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = analyzed.filter(f => f.status === 'completed');
    const inProgress = analyzed.filter(f => f.status === 'in_progress');
    const ready = analyzed.filter(f => f.isReady && f.status !== 'in_progress');
    const blocked = analyzed.filter(f => f.blockedByList.length > 0 && f.status !== 'completed');
    const planned = analyzed.filter(f => f.status === 'planned');

    return {
      total: analyzed.length,
      completed: completed.length,
      inProgress: inProgress.length,
      ready: ready.length,
      blocked: blocked.length,
      planned: planned.length,
      percentComplete: Math.round((completed.length / analyzed.length) * 100),
    };
  }, [analyzed]);

  // Get recommended next items (ready, sorted by priority)
  const recommended = useMemo(() => {
    return analyzed
      .filter(f => f.isReady && f.status !== 'in_progress')
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 5);
  }, [analyzed]);

  // Get currently in progress
  const inProgress = useMemo(() => {
    return analyzed.filter(f => f.status === 'in_progress');
  }, [analyzed]);

  // Group by phase for roadmap view
  const byPhase = useMemo(() => {
    const groups: Record<string, AnalyzedFeature[]> = {};
    for (const f of analyzed) {
      if (!groups[f.phase]) groups[f.phase] = [];
      groups[f.phase].push(f);
    }
    // Sort phases - prioritize v1.0 Target and recent items first
    const phaseOrder = [
      'v1.0 Target', 'v0.9.0 Recent', 'Inline Creation',
      'Foundation', 'Tracking', 'Library', 'Mapping', 'Operations', 'Recipes',
      'Photos', 'Inventory', 'Analytics', 'QR/Labels', 'Notifications',
      'Configuration', 'Infrastructure', 'Mobile', 'Search', 'UI Polish',
      'Calculators', 'Virtual Lab', 'Quick Actions', 'Organization',
      'Dashboard', 'Data Integrity', 'Onboarding', 'Reports', 'Environmental',
      'Workflows', 'Core Features', 'Future'
    ];
    return Object.entries(groups).sort((a, b) => {
      const aIdx = phaseOrder.indexOf(a[0]);
      const bIdx = phaseOrder.indexOf(b[0]);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });
  }, [analyzed]);

  // Filter for list view
  const filteredFeatures = useMemo(() => {
    let filtered = analyzed;

    if (view === 'ready') {
      filtered = filtered.filter(f => f.isReady && f.status !== 'in_progress');
    } else if (view === 'blocked') {
      filtered = filtered.filter(f => f.blockedByList.length > 0 && f.status !== 'completed');
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(f => f.category === categoryFilter);
    }

    return filtered.sort((a, b) => b.priorityScore - a.priorityScore);
  }, [analyzed, view, categoryFilter]);

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [newFeature, setNewFeature] = useState({
    title: '',
    description: '',
    category: 'enhancement' as DevLogFeature['category'],
    priority: 'medium' as FeaturePriority,
  });

  const categories = [...new Set(analyzed.map(f => f.category))];

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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dev Roadmap</h1>
          <p className="text-zinc-400">Self-governing feature tracker with intelligent prioritization</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Icons.Plus />
          Add Feature
        </button>
      </div>

      {/* Stats Overview - No time tracking */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          icon={<Icons.Target />} 
          label="Progress" 
          value={`${stats.percentComplete}%`}
          subValue={`${stats.completed}/${stats.total} features`}
          color="text-emerald-400"
        />
        <StatCard 
          icon={<Icons.Play />} 
          label="In Progress" 
          value={stats.inProgress}
          color="text-blue-400"
        />
        <StatCard 
          icon={<Icons.Zap />} 
          label="Ready to Start" 
          value={stats.ready}
          subValue="Dependencies met"
          color="text-amber-400"
        />
        <StatCard 
          icon={<Icons.Flag />} 
          label="Planned" 
          value={stats.planned}
          color="text-purple-400"
        />
        <StatCard 
          icon={<Icons.Lock />} 
          label="Blocked" 
          value={stats.blocked}
          color="text-red-400"
        />
      </div>

      {/* Work on Next - Main Recommendation */}
      {inProgress.length > 0 && (
        <div className="bg-gradient-to-r from-blue-950/50 to-indigo-950/50 border border-blue-800/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icons.Play />
            <h2 className="font-semibold text-blue-400">Currently In Progress</h2>
          </div>
          <div className="space-y-3">
            {inProgress.map(f => (
              <FeatureCard key={f.id} feature={f} onUpdateStatus={onUpdateStatus} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-emerald-950/50 to-teal-950/50 border border-emerald-800/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Icons.Rocket />
          <h2 className="font-semibold text-emerald-400">Work on Next</h2>
        </div>
        <p className="text-sm text-zinc-400 mb-4">
          Top priority items with all dependencies satisfied, ready to start immediately.
        </p>
        
        {recommended.length > 0 ? (
          <div className="space-y-3">
            {recommended.map((f, i) => (
              <FeatureCard 
                key={f.id} 
                feature={f} 
                onUpdateStatus={onUpdateStatus}
                isRecommended={i === 0}
              />
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 italic">
            All ready items are in progress. Complete current work to unlock more features.
          </p>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        {[
          { id: 'roadmap', label: 'Roadmap', count: null },
          { id: 'all', label: 'All Features', count: stats.total },
          { id: 'ready', label: 'Ready', count: stats.ready },
          { id: 'blocked', label: 'Blocked', count: stats.blocked },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as typeof view)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              view === tab.id 
                ? 'text-emerald-400 border-b-2 border-emerald-400 -mb-[2px]' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label} {tab.count !== null && <span className="text-zinc-500">({tab.count})</span>}
          </button>
        ))}

        {view !== 'roadmap' && (
          <div className="ml-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-3 py-1.5"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {view === 'roadmap' ? (
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
                      {phaseCompleted}/{items.length} complete
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
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
                    {items
                      .sort((a, b) => b.priorityScore - a.priorityScore)
                      .map(f => (
                        <FeatureCard key={f.id} feature={f} onUpdateStatus={onUpdateStatus} />
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFeatures.map(f => (
            <FeatureCard key={f.id} feature={f} onUpdateStatus={onUpdateStatus} showPhase />
          ))}
          {filteredFeatures.length === 0 && (
            <p className="text-center text-zinc-500 py-8">No features match the current filters.</p>
          )}
        </div>
      )}

      {/* Quick Reference */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-3">Priority Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-2"><span className="text-red-400">●</span> Critical - Must have for MVP</span>
          <span className="flex items-center gap-2"><span className="text-orange-400">●</span> High - Important for v1.0</span>
          <span className="flex items-center gap-2"><span className="text-yellow-400">●</span> Medium - Should have</span>
          <span className="flex items-center gap-2"><span className="text-zinc-400">●</span> Low - Nice to have</span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm mt-3 pt-3 border-t border-zinc-800">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Completed</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400"></span> In Progress</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Ready to Start</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-zinc-600"></span> Blocked/Waiting</span>
        </div>
      </div>

      {/* Add Feature Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Feature</h3>
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
