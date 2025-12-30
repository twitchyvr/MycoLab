// ============================================================================
// SUGGESTION CARD
// Display a community suggestion with voting, status, and discussion
// ============================================================================

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { VotingWidget } from './VotingWidget';
import { CommentThread } from './CommentThread';
import type { LibrarySuggestion, SuggestionVoteCounts } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface SuggestionCardProps {
  suggestion: LibrarySuggestion;
  showDiscussion?: boolean;
  onExpand?: () => void;
  isExpanded?: boolean;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  ChevronDown: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ChevronUp: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Chat: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Link: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
};

// ============================================================================
// STATUS BADGE
// ============================================================================

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: 'amber', label: 'Pending Review' },
    under_review: { color: 'blue', label: 'Under Review' },
    changes_requested: { color: 'orange', label: 'Changes Requested' },
    approved: { color: 'emerald', label: 'Approved' },
    rejected: { color: 'red', label: 'Rejected' },
    merged: { color: 'purple', label: 'Merged' },
    needs_info: { color: 'amber', label: 'Needs Info' },
  };

  const config = statusConfig[status] || { color: 'zinc', label: status };

  return (
    <span className={`
      px-2 py-0.5 text-xs font-medium rounded-full
      bg-${config.color}-500/20 text-${config.color}-400 border border-${config.color}-500/30
    `}>
      {config.label}
    </span>
  );
};

// ============================================================================
// SUGGESTION TYPE BADGE
// ============================================================================

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
    species: { icon: '🍄', label: 'New Species', color: 'emerald' },
    strain: { icon: '🧬', label: 'New Strain', color: 'blue' },
    correction: { icon: '✏️', label: 'Correction', color: 'amber' },
    addition: { icon: '➕', label: 'Addition', color: 'purple' },
    other: { icon: '💡', label: 'Other', color: 'zinc' },
  };

  const config = typeConfig[type] || typeConfig.other;

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full
      bg-${config.color}-500/10 text-${config.color}-400
    `}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  showDiscussion = false,
  onExpand,
  isExpanded = false,
}) => {
  const [voteCounts, setVoteCounts] = useState<SuggestionVoteCounts | null>(null);
  const [localExpanded, setLocalExpanded] = useState(isExpanded);

  const timeAgo = formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true });
  const expanded = onExpand ? isExpanded : localExpanded;
  const toggleExpand = onExpand || (() => setLocalExpanded(!localExpanded));

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      <div className="flex">
        {/* Voting Column */}
        <div className="p-4 bg-zinc-800/30 flex flex-col items-center justify-start border-r border-zinc-800">
          <VotingWidget
            entityType="suggestion"
            entityId={suggestion.id}
            layout="vertical"
            onVoteChange={setVoteCounts}
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <TypeBadge type={suggestion.suggestionType} />
                <StatusBadge status={suggestion.status} />
              </div>
              <h4 className="font-medium text-white">
                {suggestion.title}
              </h4>
            </div>
          </div>

          {/* Description */}
          {suggestion.description && (
            <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
              {suggestion.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Icons.Clock />
              {timeAgo}
            </span>
            {suggestion.sourceUrl && (
              <a
                href={suggestion.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
              >
                <Icons.Link />
                Source
              </a>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand();
              }}
              className="flex items-center gap-1 text-zinc-400 hover:text-white ml-auto"
            >
              <Icons.Chat />
              Discussion
              {expanded ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
            </button>
          </div>

          {/* Proposed Changes Preview */}
          {suggestion.proposedChanges && Object.keys(suggestion.proposedChanges).length > 0 && (
            <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <h5 className="text-xs font-medium text-zinc-400 mb-2">Proposed Changes</h5>
              <div className="text-xs text-zinc-300 space-y-1">
                {Object.entries(suggestion.proposedChanges).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-zinc-500">{key}:</span>
                    <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </div>
                ))}
                {Object.keys(suggestion.proposedChanges).length > 3 && (
                  <p className="text-zinc-500">+ {Object.keys(suggestion.proposedChanges).length - 3} more changes</p>
                )}
              </div>
            </div>
          )}

          {/* Admin Notes (for user's own suggestions) */}
          {suggestion.adminNotes && (
            <div className="mt-3 p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg">
              <h5 className="text-xs font-medium text-amber-400 mb-1">Admin Feedback</h5>
              <p className="text-sm text-amber-200">{suggestion.adminNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Discussion Thread (expanded) */}
      {expanded && showDiscussion && (
        <div className="border-t border-zinc-800">
          <CommentThread
            suggestionId={suggestion.id}
            maxHeight="300px"
            showHeader={false}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUGGESTION LIST
// ============================================================================

interface SuggestionListProps {
  suggestions: LibrarySuggestion[];
  emptyMessage?: string;
  showDiscussion?: boolean;
}

export const SuggestionList: React.FC<SuggestionListProps> = ({
  suggestions,
  emptyMessage = 'No suggestions yet',
  showDiscussion = true,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          showDiscussion={showDiscussion}
          isExpanded={expandedId === suggestion.id}
          onExpand={() => setExpandedId(expandedId === suggestion.id ? null : suggestion.id)}
        />
      ))}
    </div>
  );
};

export default SuggestionCard;
