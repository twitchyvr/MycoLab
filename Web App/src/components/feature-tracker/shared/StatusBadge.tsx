// ============================================================================
// STATUS BADGE COMPONENT
// Displays feature status with appropriate styling
// ============================================================================

import React from 'react';
import type { FeatureStatus, FeaturePriority, FeatureCategory } from '../../../data/feature-tracker/types';
import { STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG } from '../../../data/feature-tracker';

interface StatusBadgeProps {
  status: FeatureStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = true,
}) => {
  const config = STATUS_CONFIG[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${config.color} ${config.bg} ${sizeClasses}`}>
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};

interface PriorityBadgeProps {
  priority: FeaturePriority;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  showLabel?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'sm',
  showIcon = true,
  showLabel = true,
}) => {
  const config = PRIORITY_CONFIG[priority];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${config.color} ${config.bg} ${sizeClasses}`}>
      {showIcon && <span>{config.icon}</span>}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

interface CategoryBadgeProps {
  category: FeatureCategory;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'sm',
  showIcon = true,
}) => {
  const config = CATEGORY_CONFIG[category];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium text-zinc-400 bg-zinc-800 ${sizeClasses}`}>
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};

interface TagBadgeProps {
  tag: string;
  onRemove?: () => void;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ tag, onRemove }) => {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-400">
      <span>#</span>
      <span>{tag}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:text-zinc-200 transition-colors"
        >
          ×
        </button>
      )}
    </span>
  );
};

interface MilestoneBadgeProps {
  milestone: string;
  isMandatory?: boolean;
}

export const MilestoneBadge: React.FC<MilestoneBadgeProps> = ({
  milestone,
  isMandatory,
}) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
      isMandatory
        ? 'bg-amber-950/50 text-amber-400 ring-1 ring-amber-500/30'
        : 'bg-zinc-800 text-zinc-400'
    }`}>
      <span>📦</span>
      <span>{milestone}</span>
      {isMandatory && <span className="text-amber-500">★</span>}
    </span>
  );
};
