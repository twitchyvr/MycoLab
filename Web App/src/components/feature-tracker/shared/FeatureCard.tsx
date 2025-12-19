// ============================================================================
// FEATURE CARD COMPONENT
// Displays a feature with status, priority, and metadata
// Supports compact (list) and expanded (detail) modes
// ============================================================================

import React, { useState } from 'react';
import type { Feature } from '../../../data/feature-tracker/types';
import { StatusBadge, PriorityBadge, CategoryBadge, TagBadge, MilestoneBadge } from './StatusBadge';
import { MarkdownContent } from './MarkdownContent';
import { getMilestoneById } from '../../../data/feature-tracker';

// Icons
const Icons = {
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Link: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  GitBranch: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

interface FeatureCardProps {
  feature: Feature;
  variant?: 'compact' | 'default' | 'expanded';
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClick?: () => void;
  showMilestone?: boolean;
  showDependencies?: boolean;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  feature,
  variant = 'default',
  isExpanded = false,
  onToggleExpand,
  onClick,
  showMilestone = true,
  showDependencies = true,
  className = '',
}) => {
  const milestone = feature.targetMilestone ? getMilestoneById(feature.targetMilestone) : undefined;
  const hasBlockers = feature.blockedBy || feature.status === 'blocked';
  const hasDependencies = feature.dependencies && feature.dependencies.length > 0;

  // Compact variant for list views
  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800/50
          border-b border-zinc-800/50 cursor-pointer transition-colors ${className}`}
        onClick={onClick}
      >
        <PriorityBadge priority={feature.priority} showLabel={false} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">{feature.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={feature.status} size="sm" showIcon={false} />
            {feature.targetMilestone && (
              <span className="text-xs text-zinc-500">{feature.targetMilestone}</span>
            )}
          </div>
        </div>
        {hasBlockers && (
          <span className="text-red-400" title="Blocked">
            <Icons.AlertTriangle />
          </span>
        )}
        {hasDependencies && (
          <span className="text-zinc-500" title={`${feature.dependencies?.length} dependencies`}>
            <Icons.GitBranch />
          </span>
        )}
      </div>
    );
  }

  // Default/Expanded card
  return (
    <div
      className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden
        hover:border-zinc-700 transition-colors ${className}`}
    >
      {/* Header - always visible */}
      <div
        className={`p-4 ${onToggleExpand ? 'cursor-pointer' : ''}`}
        onClick={onToggleExpand || onClick}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <PriorityBadge priority={feature.priority} size="sm" />
              <StatusBadge status={feature.status} size="sm" />
              {hasBlockers && (
                <span className="text-red-400" title={feature.blockedBy || 'Blocked'}>
                  <Icons.AlertTriangle />
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-zinc-100 leading-tight">
              {feature.title}
            </h3>
            {feature.description && !isExpanded && (
              <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                {feature.description}
              </p>
            )}
          </div>
          {onToggleExpand && (
            <button className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
              {isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
            </button>
          )}
        </div>

        {/* Quick info row */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <CategoryBadge category={feature.category} size="sm" />
          {showMilestone && feature.targetMilestone && (
            <MilestoneBadge
              milestone={feature.targetMilestone}
              isMandatory={feature.isMandatory}
            />
          )}
          {feature.estimatedHours && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
              <Icons.Clock />
              {feature.estimatedHours}h
              {feature.actualHours && (
                <span className="text-zinc-600">/ {feature.actualHours}h actual</span>
              )}
            </span>
          )}
        </div>

        {/* Tags */}
        {feature.tags && feature.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {feature.tags.slice(0, isExpanded ? undefined : 3).map(tag => (
              <TagBadge key={tag} tag={tag} />
            ))}
            {!isExpanded && feature.tags.length > 3 && (
              <span className="text-xs text-zinc-500">+{feature.tags.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-zinc-800">
          {/* Full description */}
          {feature.description && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                Description
              </h4>
              <p className="text-sm text-zinc-300">{feature.description}</p>
            </div>
          )}

          {/* Notes */}
          {feature.notes && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Notes
              </h4>
              <div className="bg-zinc-800/30 rounded-lg p-3">
                <MarkdownContent content={feature.notes} />
              </div>
            </div>
          )}

          {/* Technical notes */}
          {feature.technicalNotes && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Technical Notes
              </h4>
              <div className="bg-zinc-800/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                <MarkdownContent content={feature.technicalNotes} compact />
              </div>
            </div>
          )}

          {/* Acceptance criteria */}
          {feature.acceptanceCriteria && feature.acceptanceCriteria.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                Acceptance Criteria
              </h4>
              <ul className="text-sm text-zinc-400 space-y-1">
                {feature.acceptanceCriteria.map((criteria, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-zinc-600">•</span>
                    <span>{criteria}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dependencies */}
          {showDependencies && hasDependencies && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                Dependencies ({feature.dependencies?.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {feature.dependencies?.map(depId => (
                  <span
                    key={depId}
                    className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded"
                  >
                    {depId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Blocker info */}
          {feature.blockedBy && (
            <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
              <h4 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-1">
                Blocked By
              </h4>
              <p className="text-sm text-red-300">{feature.blockedBy}</p>
            </div>
          )}

          {/* Links */}
          {(feature.prLinks?.length || feature.issueLinks?.length || feature.documentationLink) && (
            <div className="flex flex-wrap gap-2">
              {feature.prLinks?.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                >
                  <Icons.GitBranch />
                  PR #{i + 1}
                </a>
              ))}
              {feature.issueLinks?.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Icons.Link />
                  Issue #{i + 1}
                </a>
              ))}
              {feature.documentationLink && (
                <a
                  href={feature.documentationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                >
                  <Icons.Link />
                  Docs
                </a>
              )}
            </div>
          )}

          {/* Metadata footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
            <span>ID: {feature.id}</span>
            <span>
              Updated: {new Date(feature.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureCard;
