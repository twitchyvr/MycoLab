// ============================================================================
// VIABILITY DASHBOARD COMPONENT
// Shows culture viability status and alerts
// ============================================================================

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useViabilityReminders, type ViabilityStatus } from '../../hooks/useViabilityReminders';

// ============================================================================
// TYPES
// ============================================================================

interface ViabilityDashboardProps {
  onCultureClick?: (cultureId: string) => void;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  XCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Flask: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M8 3v4l-2 9a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4l-2-9V3"/>
      <line x1="9" y1="3" x2="15" y2="3"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  RefreshCw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
};

// ============================================================================
// STATUS COLORS
// ============================================================================

const statusConfig = {
  healthy: {
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-800',
    text: 'text-emerald-400',
    icon: Icons.CheckCircle,
    label: 'Healthy',
  },
  warning: {
    bg: 'bg-amber-950/30',
    border: 'border-amber-800',
    text: 'text-amber-400',
    icon: Icons.Clock,
    label: 'Aging',
  },
  critical: {
    bg: 'bg-orange-950/30',
    border: 'border-orange-800',
    text: 'text-orange-400',
    icon: Icons.AlertTriangle,
    label: 'Critical',
  },
  expired: {
    bg: 'bg-red-950/30',
    border: 'border-red-800',
    text: 'text-red-400',
    icon: Icons.XCircle,
    label: 'Expired',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ViabilityDashboard: React.FC<ViabilityDashboardProps> = ({
  onCultureClick,
  className = '',
  compact = false,
}) => {
  const { viabilityStatuses, summary, generateNotifications } = useViabilityReminders();
  const [filterStatus, setFilterStatus] = useState<ViabilityStatus['status'] | 'all'>('all');
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Filter cultures based on status
  const filteredStatuses = filterStatus === 'all'
    ? viabilityStatuses
    : viabilityStatuses.filter(v => v.status === filterStatus);

  // Sort by urgency (expired first, then critical, warning, healthy)
  const sortedStatuses = [...filteredStatuses].sort((a, b) => {
    const order: Record<ViabilityStatus['status'], number> = {
      expired: 0,
      critical: 1,
      warning: 2,
      healthy: 3,
    };
    return order[a.status] - order[b.status];
  });

  if (compact && !isExpanded) {
    // Compact view - just summary
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`w-full p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950/50 border border-blue-800 flex items-center justify-center text-blue-400">
              <Icons.Flask />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white">Culture Viability</h3>
              <p className="text-xs text-zinc-500">
                {summary.warning + summary.critical + summary.expired > 0
                  ? `${summary.warning + summary.critical + summary.expired} need attention`
                  : 'All cultures healthy'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {summary.critical > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-orange-950/50 text-orange-400 rounded-full">
                {summary.critical} critical
              </span>
            )}
            {summary.expired > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-950/50 text-red-400 rounded-full">
                {summary.expired} expired
              </span>
            )}
            <Icons.ChevronRight />
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950/50 border border-blue-800 flex items-center justify-center text-blue-400">
              <Icons.Flask />
            </div>
            <div>
              <h3 className="font-semibold text-white">Culture Viability</h3>
              <p className="text-xs text-zinc-500">
                Track culture age and schedule transfers
              </p>
            </div>
          </div>
          <button
            onClick={() => generateNotifications()}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Check viability now"
          >
            <Icons.RefreshCw />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['healthy', 'warning', 'critical', 'expired'] as const).map(status => {
            const config = statusConfig[status];
            const count = summary[status];
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                className={`
                  p-2 rounded-lg border transition-all
                  ${filterStatus === status
                    ? `${config.bg} ${config.border} ring-1 ring-${config.text.replace('text-', '')}/30`
                    : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                  }
                `}
              >
                <div className={`text-lg font-bold ${filterStatus === status ? config.text : 'text-white'}`}>
                  {count}
                </div>
                <div className="text-xs text-zinc-400 capitalize">{config.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cultures List */}
      <div className="max-h-96 overflow-y-auto">
        {sortedStatuses.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600">
              <Icons.Flask />
            </div>
            <p className="text-zinc-400 text-sm">
              {filterStatus === 'all'
                ? 'No active cultures to track'
                : `No cultures with status: ${statusConfig[filterStatus].label}`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {sortedStatuses.map(vs => {
              const config = statusConfig[vs.status];
              const StatusIcon = config.icon;

              return (
                <button
                  key={vs.culture.id}
                  onClick={() => onCultureClick?.(vs.culture.id)}
                  className="w-full p-4 text-left hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div className={`flex-shrink-0 mt-0.5 ${config.text}`}>
                      <StatusIcon />
                    </div>

                    {/* Culture info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">
                          {vs.culture.label}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${config.bg} ${config.border} border ${config.text}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 mt-0.5">
                        {vs.strainName}
                        {vs.speciesName && ` (${vs.speciesName})`}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                        <span>
                          Age: {vs.daysSinceCreation} days
                        </span>
                        {vs.daysSinceLastTransfer !== null && (
                          <span>
                            Last transfer: {vs.daysSinceLastTransfer} days ago
                          </span>
                        )}
                        {vs.daysUntilExpiry !== null && vs.daysUntilExpiry > 0 && (
                          <span className={vs.daysUntilExpiry <= 7 ? 'text-amber-400' : ''}>
                            {vs.daysUntilExpiry} days until expiry
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 mt-1 line-clamp-1">
                        {vs.recommendedAction}
                      </p>
                    </div>

                    {/* Created date */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-zinc-500">
                        Created
                      </p>
                      <p className="text-xs text-zinc-400">
                        {format(new Date(vs.culture.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {compact && isExpanded && (
        <div className="p-3 border-t border-zinc-800">
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Collapse
          </button>
        </div>
      )}
    </div>
  );
};

export default ViabilityDashboard;
