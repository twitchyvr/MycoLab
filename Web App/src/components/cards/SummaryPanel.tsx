// ============================================================================
// SUMMARY PANEL
// Right-side quick view panel for selected entity
// Shows key stats, quick actions, and recent activity
// Provides link to open full detail modal
// ============================================================================

import React from 'react';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface SummaryPanelStat {
  label: string;
  value: string | number | React.ReactNode;
  color?: string;
}

export interface SummaryPanelAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface SummaryPanelActivity {
  label: string;
  timestamp: Date;
  icon?: string;
}

export interface SummaryPanelProps {
  // Header
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  statusBadge?: React.ReactNode;

  // Content
  stats?: SummaryPanelStat[];
  actions?: SummaryPanelAction[];
  recentActivity?: SummaryPanelActivity[];

  // View full details
  onViewDetails: () => void;
  viewDetailsLabel?: string;

  // Close/deselect
  onClose?: () => void;

  // Additional styling
  className?: string;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  ExternalLink: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
};

// ============================================================================
// ACTION BUTTON STYLES
// ============================================================================

const actionVariantClasses: Record<NonNullable<SummaryPanelAction['variant']>, string> = {
  primary: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400',
  secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300',
  danger: 'bg-red-950/50 hover:bg-red-950 text-red-400',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  title,
  subtitle,
  icon,
  statusBadge,
  stats,
  actions,
  recentActivity,
  onViewDetails,
  viewDetailsLabel = 'View Full Details',
  onClose,
  className = '',
}) => {
  return (
    <div className={`bg-zinc-900/95 border border-zinc-800 rounded-xl flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {icon && <span className="text-2xl flex-shrink-0">{icon}</span>}
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-white truncate">{title}</h3>
              {subtitle && (
                <p className="text-sm text-zinc-400 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
              aria-label="Close"
            >
              <Icons.X />
            </button>
          )}
        </div>

        {statusBadge && (
          <div className="mt-3">
            {statusBadge}
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="p-4 border-b border-zinc-800">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
            Quick Stats
          </h4>
          <div className="space-y-2">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{stat.label}</span>
                <span className={`text-sm font-medium ${stat.color || 'text-white'}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {actions && actions.length > 0 && (
        <div className="p-4 border-b border-zinc-800">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
            Quick Actions
          </h4>
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors min-h-[40px]
                  ${actionVariantClasses[action.variant || 'secondary']}
                `}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="p-4 border-b border-zinc-800">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
            Recent Activity
          </h4>
          <div className="space-y-2">
            {recentActivity.slice(0, 3).map((activity, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                {activity.icon && <span className="flex-shrink-0">{activity.icon}</span>}
                <div className="flex-1 min-w-0">
                  <span className="text-zinc-300">{activity.label}</span>
                  <span className="text-zinc-500 text-xs block">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Details Button */}
      <div className="p-4 mt-auto">
        <button
          onClick={onViewDetails}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors min-h-[48px]"
        >
          <span>{viewDetailsLabel}</span>
          <Icons.ExternalLink />
        </button>
      </div>
    </div>
  );
};

export default SummaryPanel;
