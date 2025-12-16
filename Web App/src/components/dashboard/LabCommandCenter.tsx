// ============================================================================
// LAB COMMAND CENTER - The Operational Nerve Center
// A real-time, comprehensive dashboard for mycology lab management
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useData } from '../../store';
import type { Culture, Grow, GrowStage } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

type Page = 'dashboard' | 'today' | 'dailycheck' | 'harvest' | 'forecast' | 'coldstorage' | 'observations' | 'eventlog' | 'library' | 'inventory' | 'stock' | 'cultures' | 'lineage' | 'grows' | 'recipes' | 'labmapping' | 'occupancy' | 'labels' | 'scanner' | 'calculator' | 'spawnrate' | 'pressure' | 'contamination' | 'efficiency' | 'analytics' | 'strainanalytics' | 'settings' | 'profile' | 'devlog';

interface LabCommandCenterProps {
  onNavigate: (page: Page) => void;
}

interface StatusCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'red' | 'cyan';
  onClick?: () => void;
}

interface TimelineItem {
  id: string;
  name: string;
  strain: string;
  type: 'culture' | 'grow';
  stage: string;
  progress: number;
  daysInStage: number;
  daysTotal: number;
  status: string;
  alerts: string[];
}

interface Alert {
  id: string;
  type: 'contamination' | 'transition' | 'maintenance' | 'supply' | 'environmental' | 'insight';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actionLabel?: string;
  actionPage?: Page;
  itemId?: string;
  timestamp: Date;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Flask: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 3h6v7l5 9H4l5-9V3z"/><path d="M9 3h6"/>
    </svg>
  ),
  Grow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 2L12 22"/><path d="M17 7C17 7 13 9 12 14"/><path d="M7 7C7 7 11 9 12 14"/>
    </svg>
  ),
  Container: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  Health: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  Alert: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Harvest: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 2L12 22"/><path d="M17 7C17 7 13 9 12 14"/><path d="M7 7C7 7 11 9 12 14"/><circle cx="12" cy="19" r="3"/>
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getStageProgress = (stage: GrowStage): number => {
  const stageMap: Record<GrowStage, number> = {
    spawning: 10,
    colonization: 40,
    fruiting: 70,
    harvesting: 90,
    completed: 100,
    contaminated: 0,
    aborted: 0,
  };
  return stageMap[stage] || 0;
};

const getStageColor = (stage: string): string => {
  const colorMap: Record<string, string> = {
    spawning: 'bg-purple-500',
    colonization: 'bg-cyan-500',
    fruiting: 'bg-pink-500',
    harvesting: 'bg-emerald-500',
    completed: 'bg-green-500',
    contaminated: 'bg-red-500',
    active: 'bg-emerald-500',
    colonizing: 'bg-cyan-500',
    ready: 'bg-green-500',
  };
  return colorMap[stage] || 'bg-zinc-500';
};

const calculateLabHealthScore = (
  cultures: Culture[],
  grows: Grow[]
): { score: number; factors: { label: string; impact: number }[] } => {
  const factors: { label: string; impact: number }[] = [];
  let score = 100;

  // Contamination rate impact
  const contaminatedCultures = cultures.filter(c => c.status === 'contaminated').length;
  const contaminatedGrows = grows.filter(g => g.currentStage === 'contaminated').length;
  const totalContaminations = contaminatedCultures + contaminatedGrows;
  const totalItems = cultures.length + grows.length;

  if (totalItems > 0) {
    const contaminationRate = (totalContaminations / totalItems) * 100;
    if (contaminationRate > 20) {
      const impact = -30;
      score += impact;
      factors.push({ label: 'High contamination rate', impact });
    } else if (contaminationRate > 10) {
      const impact = -15;
      score += impact;
      factors.push({ label: 'Elevated contamination', impact });
    } else if (contaminationRate > 0) {
      const impact = -5;
      score += impact;
      factors.push({ label: 'Some contamination', impact });
    }
  }

  // Active grows boost
  const activeGrows = grows.filter(g => g.status === 'active').length;
  if (activeGrows > 0) {
    const boost = Math.min(10, activeGrows * 2);
    score += boost;
    factors.push({ label: 'Active cultivation', impact: boost });
  }

  // Healthy cultures boost
  const healthyCultures = cultures.filter(c => c.status === 'active' || c.status === 'ready').length;
  if (healthyCultures > 0) {
    const boost = Math.min(10, healthyCultures);
    score += boost;
    factors.push({ label: 'Healthy cultures', impact: boost });
  }

  return { score: Math.max(0, Math.min(100, score)), factors };
};

// ============================================================================
// COMPONENTS
// ============================================================================

const StatusCard: React.FC<StatusCardProps> = ({ label, value, subtext, icon, color, onClick }) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  };

  const iconBgClasses = {
    emerald: 'bg-emerald-500/20',
    blue: 'bg-blue-500/20',
    purple: 'bg-purple-500/20',
    amber: 'bg-amber-500/20',
    red: 'bg-red-500/20',
    cyan: 'bg-cyan-500/20',
  };

  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-xl border transition-all duration-200
        ${colorClasses[color]}
        hover:scale-[1.02] hover:shadow-lg
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        text-left w-full
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtext && <p className="text-xs mt-1 opacity-80">{subtext}</p>}
        </div>
        <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
          {icon}
        </div>
      </div>
    </button>
  );
};

const HealthScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const getColor = (s: number) => {
    if (s >= 95) return '#10B981'; // emerald
    if (s >= 80) return '#F59E0B'; // amber
    if (s >= 60) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-zinc-800"
        />
        <circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          stroke={getColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-white">{score}%</span>
      </div>
    </div>
  );
};

const TimelineCard: React.FC<{ item: TimelineItem; onClick: () => void }> = ({ item, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-all text-left"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-white">{item.name}</p>
          <p className="text-xs text-zinc-500">{item.strain}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(item.stage)} bg-opacity-20 text-white`}>
          {item.stage.replace('_', ' ')}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-zinc-700 rounded-full overflow-hidden mb-2">
        <div
          className={`absolute inset-y-0 left-0 ${getStageColor(item.stage)} rounded-full transition-all duration-500`}
          style={{ width: `${item.progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Day {item.daysTotal}</span>
        <span>{item.progress}% complete</span>
      </div>

      {item.alerts.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-amber-400 text-xs">
          <Icons.Alert />
          <span>{item.alerts[0]}</span>
        </div>
      )}
    </button>
  );
};

const AlertCard: React.FC<{ alert: Alert; onAction?: () => void; onDismiss?: () => void }> = ({
  alert,
  onAction,
  onDismiss
}) => {
  const severityStyles = {
    critical: 'border-red-500/50 bg-red-950/30',
    warning: 'border-amber-500/50 bg-amber-950/30',
    info: 'border-blue-500/50 bg-blue-950/30',
  };

  const severityIcons = {
    critical: <Icons.Alert />,
    warning: <Icons.Clock />,
    info: <Icons.TrendingUp />,
  };

  const severityColors = {
    critical: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400',
  };

  return (
    <div className={`p-3 rounded-lg border ${severityStyles[alert.severity]}`}>
      <div className="flex items-start gap-3">
        <div className={severityColors[alert.severity]}>
          {severityIcons[alert.severity]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{alert.title}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{alert.description}</p>
          {alert.actionLabel && (
            <button
              onClick={onAction}
              className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              {alert.actionLabel} →
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-zinc-500 hover:text-zinc-300"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

const QuickActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}> = ({ icon, label, onClick, color = 'zinc' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-2 p-4 rounded-xl
        bg-zinc-800/50 border border-zinc-700
        hover:bg-zinc-800 hover:border-zinc-600
        transition-all duration-200
      `}
    >
      <div className="text-emerald-400">{icon}</div>
      <span className="text-xs text-zinc-400">{label}</span>
    </button>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LabCommandCenter: React.FC<LabCommandCenterProps> = ({ onNavigate }) => {
  const { state, activeStrains } = useData();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Calculate stats
  const stats = useMemo(() => {
    const activeCultures = state.cultures.filter(c =>
      c.status === 'active' || c.status === 'colonizing' || c.status === 'ready'
    );
    const activeGrows = state.grows.filter(g => g.status === 'active');
    const fruitingGrows = activeGrows.filter(g => g.currentStage === 'fruiting');
    const readyToHarvest = activeGrows.filter(g => g.currentStage === 'harvesting');
    const { score: healthScore, factors: healthFactors } = calculateLabHealthScore(
      state.cultures,
      state.grows
    );

    return {
      activeCultures: activeCultures.length,
      activeGrows: activeGrows.length,
      fruitingGrows: fruitingGrows.length,
      readyToHarvest: readyToHarvest.length,
      healthScore,
      healthFactors,
    };
  }, [state.cultures, state.grows]);

  // Build timeline items
  const timelineItems = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // Add active grows
    state.grows
      .filter(g => g.status === 'active')
      .forEach(grow => {
        const strain = activeStrains.find(s => s.id === grow.strainId);
        const daysTotal = Math.floor(
          (Date.now() - new Date(grow.spawnedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        const alerts: string[] = [];

        // Check for potential issues
        if (grow.currentStage === 'colonization' && daysTotal > 21) {
          alerts.push('Colonization taking longer than expected');
        }

        items.push({
          id: grow.id,
          name: grow.name,
          strain: strain?.name || 'Unknown',
          type: 'grow',
          stage: grow.currentStage,
          progress: getStageProgress(grow.currentStage),
          daysInStage: daysTotal, // Simplified
          daysTotal,
          status: grow.status,
          alerts,
        });
      });

    // Sort by progress (reverse - show most progressed first)
    return items.sort((a, b) => b.progress - a.progress);
  }, [state.grows, activeStrains]);

  // Generate alerts
  const alerts = useMemo((): Alert[] => {
    const alertList: Alert[] = [];

    // Check for ready to harvest
    state.grows
      .filter(g => g.currentStage === 'harvesting' && g.status === 'active')
      .forEach(grow => {
        alertList.push({
          id: `harvest-${grow.id}`,
          type: 'transition',
          severity: 'warning',
          title: 'Ready to Harvest',
          description: `${grow.name} is ready for harvesting`,
          actionLabel: 'Record Harvest',
          actionPage: 'harvest',
          itemId: grow.id,
          timestamp: new Date(),
        });
      });

    // Check for contaminations
    const recentContaminations = state.grows.filter(
      g => g.currentStage === 'contaminated' && g.status === 'active'
    );
    recentContaminations.forEach(grow => {
      alertList.push({
        id: `contam-${grow.id}`,
        type: 'contamination',
        severity: 'critical',
        title: 'Contamination Detected',
        description: `${grow.name} shows signs of contamination`,
        actionLabel: 'View Details',
        actionPage: 'grows',
        itemId: grow.id,
        timestamp: new Date(),
      });
    });

    // Check for fruiting transitions
    state.grows
      .filter(g => g.currentStage === 'colonization' && g.status === 'active')
      .forEach(grow => {
        const days = Math.floor(
          (Date.now() - new Date(grow.spawnedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (days >= 14 && days <= 21) {
          alertList.push({
            id: `fruit-${grow.id}`,
            type: 'transition',
            severity: 'info',
            title: 'Fruiting Window Approaching',
            description: `${grow.name} may be ready to fruit soon (day ${days})`,
            actionLabel: 'Check Colonization',
            actionPage: 'grows',
            itemId: grow.id,
            timestamp: new Date(),
          });
        }
      });

    // Filter dismissed alerts
    return alertList.filter(a => !dismissedAlerts.has(a.id));
  }, [state.grows, dismissedAlerts]);

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const triggerCreateNew = (page: Page) => {
    onNavigate(page);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('mycolab:create-new', { detail: { page } }));
    }, 100);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lab Command Center</h1>
          <p className="text-zinc-400 text-sm">Real-time overview of your mycology operations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('today')}
            className="px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            View Today
          </button>
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          label="Active Cultures"
          value={stats.activeCultures}
          subtext={`${state.cultures.filter(c => c.status === 'ready').length} ready to use`}
          icon={<Icons.Flask />}
          color="cyan"
          onClick={() => onNavigate('cultures')}
        />
        <StatusCard
          label="Active Grows"
          value={stats.activeGrows}
          subtext={`${stats.fruitingGrows} fruiting`}
          icon={<Icons.Grow />}
          color="emerald"
          onClick={() => onNavigate('grows')}
        />
        <StatusCard
          label="Ready to Harvest"
          value={stats.readyToHarvest}
          subtext={stats.readyToHarvest > 0 ? 'Action needed' : 'None pending'}
          icon={<Icons.Harvest />}
          color={stats.readyToHarvest > 0 ? 'amber' : 'purple'}
          onClick={() => onNavigate('harvest')}
        />
        <div className="p-4 rounded-xl border bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Lab Health</p>
              <p className="text-sm text-zinc-500 mt-1">
                {stats.healthScore >= 95 ? 'Excellent' :
                 stats.healthScore >= 80 ? 'Good' :
                 stats.healthScore >= 60 ? 'Fair' : 'Needs Attention'}
              </p>
            </div>
            <HealthScoreRing score={stats.healthScore} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cultivation Timeline */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Active Cultivation</h2>
              <p className="text-xs text-zinc-500">Track progress through cultivation phases</p>
            </div>
            <button
              onClick={() => onNavigate('grows')}
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View all <Icons.ChevronRight />
            </button>
          </div>
          <div className="p-4">
            {timelineItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Icons.Grow />
                </div>
                <p className="text-zinc-500 mb-4">No active grows</p>
                <button
                  onClick={() => triggerCreateNew('grows')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm"
                >
                  Start Your First Grow
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {timelineItems.slice(0, 6).map(item => (
                  <TimelineCard
                    key={item.id}
                    item={item}
                    onClick={() => onNavigate('grows')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-semibold text-white">Alerts & Actions</h2>
            <p className="text-xs text-zinc-500">Items needing your attention</p>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  ✓
                </div>
                <p className="text-zinc-500 text-sm">All caught up!</p>
                <p className="text-zinc-600 text-xs mt-1">No pending alerts</p>
              </div>
            ) : (
              alerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAction={() => alert.actionPage && onNavigate(alert.actionPage)}
                  onDismiss={() => handleDismissAlert(alert.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <QuickActionButton
            icon={<Icons.Flask />}
            label="New Culture"
            onClick={() => triggerCreateNew('cultures')}
          />
          <QuickActionButton
            icon={<Icons.Grow />}
            label="New Grow"
            onClick={() => triggerCreateNew('grows')}
          />
          <QuickActionButton
            icon={<Icons.Harvest />}
            label="Log Harvest"
            onClick={() => onNavigate('harvest')}
          />
          <QuickActionButton
            icon={<Icons.Eye />}
            label="Log Observation"
            onClick={() => onNavigate('eventlog')}
          />
          <QuickActionButton
            icon={<Icons.Calendar />}
            label="Daily Check"
            onClick={() => onNavigate('dailycheck')}
          />
          <QuickActionButton
            icon={<Icons.TrendingUp />}
            label="Forecast"
            onClick={() => onNavigate('forecast')}
          />
        </div>
      </div>

      {/* Upcoming Milestones */}
      {timelineItems.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-semibold text-white mb-4">Upcoming Milestones</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {timelineItems
              .filter(item => item.progress < 100)
              .slice(0, 3)
              .map(item => {
                const nextPhase = item.stage === 'colonization' ? 'Fruiting' :
                                  item.stage === 'spawning' ? 'Colonization' :
                                  item.stage === 'fruiting' ? 'Harvest' : 'Next Phase';
                const estimatedDays = item.stage === 'colonization' ? Math.max(0, 21 - item.daysTotal) :
                                      item.stage === 'spawning' ? Math.max(0, 7 - item.daysTotal) :
                                      item.stage === 'fruiting' ? Math.max(0, 14 - item.daysInStage) : '?';

                return (
                  <div key={item.id} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <p className="font-medium text-white text-sm">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.strain}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-emerald-400">{nextPhase}</span>
                      <span className="text-xs text-zinc-400">~{estimatedDays} days</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabCommandCenter;
