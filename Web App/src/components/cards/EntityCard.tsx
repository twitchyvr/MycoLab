// ============================================================================
// ENTITY CARD
// Standardized card component for displaying entities in list views
// Provides consistent look and feel across cultures, grows, inventory, etc.
// ============================================================================

import React from 'react';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export type EntityCardStatus = {
  label: string;
  color: 'emerald' | 'blue' | 'green' | 'yellow' | 'amber' | 'red' | 'purple' | 'zinc';
};

export interface EntityCardMetric {
  label: string;
  value: string | number;
  color?: string;
}

export interface EntityCardProps {
  // Required
  title: string;
  status: EntityCardStatus;
  onClick: () => void;

  // Optional content
  subtitle?: string;
  icon?: React.ReactNode;
  metrics?: EntityCardMetric[];
  lastActivity?: Date;
  badge?: string | number;

  // View details button
  onViewDetails?: () => void;
  viewDetailsLabel?: string;

  // Selection state
  isSelected?: boolean;

  // Additional styling
  className?: string;
}

// ============================================================================
// STATUS COLOR MAP
// ============================================================================

const statusColorClasses: Record<EntityCardStatus['color'], { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  zinc: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', border: 'border-zinc-500/30' },
};

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  ExternalLink: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EntityCard: React.FC<EntityCardProps> = ({
  title,
  subtitle,
  icon,
  status,
  metrics,
  lastActivity,
  badge,
  onClick,
  onViewDetails,
  viewDetailsLabel = 'View Details',
  isSelected = false,
  className = '',
}) => {
  const statusColors = statusColorClasses[status.color];

  return (
    <div
      className={`
        relative bg-zinc-900/50 border rounded-xl overflow-hidden
        transition-all duration-150
        ${isSelected
          ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
          : 'border-zinc-800 hover:border-zinc-700'
        }
        ${className}
      `}
    >
      {/* Main clickable area */}
      <button
        onClick={onClick}
        className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500/50"
      >
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          {icon && (
            <span className="text-2xl flex-shrink-0">{icon}</span>
          )}

          {/* Title and subtitle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-white truncate">
                {title}
              </h3>
              {badge !== undefined && (
                <span className="px-1.5 py-0.5 text-xs bg-zinc-700 text-zinc-400 rounded">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-zinc-400 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          {/* Status badge */}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusColors.bg} ${statusColors.text}`}>
            {status.label}
          </span>
        </div>

        {/* Metrics row */}
        {metrics && metrics.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {metrics.map((metric, index) => (
              <div key={index} className="text-sm">
                <span className="text-zinc-500">{metric.label}: </span>
                <span className={metric.color || 'text-zinc-200'}>{metric.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Last activity */}
        {lastActivity && (
          <div className="text-xs text-zinc-500 mt-2">
            Updated {formatDistanceToNow(lastActivity, { addSuffix: true })}
          </div>
        )}
      </button>

      {/* View details button (optional) */}
      {onViewDetails && (
        <div className="px-4 pb-3 pt-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>{viewDetailsLabel}</span>
            <Icons.ExternalLink />
          </button>
        </div>
      )}
    </div>
  );
};

export default EntityCard;
