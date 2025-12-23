// ============================================================================
// HISTORY TAB
// Displays version history and amendments for an entity
// Wraps existing RecordHistory component with additional context
// ============================================================================

import React, { useState, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { RecordHistory } from '../../common/RecordHistory';
import type {
  Culture,
  Grow,
  RecordVersionSummary,
  DataAmendmentLogEntry,
} from '../../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface HistoryTabProps {
  entityType: 'culture' | 'grow';
  entity: Culture | Grow;
  versions?: RecordVersionSummary[];
  amendments?: DataAmendmentLogEntry[];
  onAmend?: () => void;
  onViewVersion?: (versionId: string) => void;
  onRestoreVersion?: (versionId: string) => void;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Archive: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="21 8 21 21 3 21 3 8"/>
      <rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

// ============================================================================
// CURRENT VERSION CARD
// ============================================================================

const CurrentVersionCard: React.FC<{
  entity: Culture | Grow;
  entityType: 'culture' | 'grow';
  onAmend?: () => void;
}> = ({ entity, entityType, onAmend }) => {
  const version = (entity as any).version ?? 1;
  const createdAt = new Date(entity.createdAt);
  // Culture has updatedAt, Grow uses completedAt or falls back to createdAt
  const updatedAt = entityType === 'culture'
    ? new Date((entity as Culture).updatedAt)
    : new Date((entity as Grow).completedAt || entity.createdAt);

  return (
    <div className="bg-emerald-950/30 border border-emerald-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
            Current Version
          </span>
          <span className="text-sm text-zinc-400">v{version}</span>
        </div>
        {onAmend && (
          <button
            onClick={onAmend}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-950/50 hover:bg-yellow-950 text-yellow-400 text-sm rounded-lg transition-colors"
          >
            <Icons.Edit />
            <span>Amend</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs text-zinc-500 mb-0.5">Created</div>
          <div className="text-zinc-300">{format(createdAt, 'MMM d, yyyy')}</div>
          <div className="text-xs text-zinc-500">{formatDistanceToNow(createdAt, { addSuffix: true })}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-0.5">Last Modified</div>
          <div className="text-zinc-300">{format(updatedAt, 'MMM d, yyyy')}</div>
          <div className="text-xs text-zinc-500">{formatDistanceToNow(updatedAt, { addSuffix: true })}</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ARCHIVED WARNING
// ============================================================================

const ArchivedWarning: React.FC = () => (
  <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 flex items-start gap-3">
    <span className="text-zinc-500 mt-0.5">
      <Icons.Archive />
    </span>
    <div>
      <div className="text-sm font-medium text-zinc-300">This record is archived</div>
      <div className="text-xs text-zinc-500 mt-0.5">
        Archived records are read-only and excluded from active lists.
      </div>
    </div>
  </div>
);

// ============================================================================
// NO HISTORY PLACEHOLDER
// ============================================================================

const NoHistoryPlaceholder: React.FC = () => (
  <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6 text-center">
    <span className="text-zinc-600">
      <Icons.Info />
    </span>
    <div className="text-sm text-zinc-400 mt-2">
      No version history available
    </div>
    <div className="text-xs text-zinc-500 mt-1">
      Version history is recorded when amendments are made to this record.
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const HistoryTab: React.FC<HistoryTabProps> = ({
  entityType,
  entity,
  versions = [],
  amendments = [],
  onAmend,
  onViewVersion,
  onRestoreVersion,
}) => {
  // Check if archived
  const isArchived = (entity as any).isArchived === true;

  // If no versions provided, create a single "current version" summary
  const displayVersions = useMemo<RecordVersionSummary[]>(() => {
    if (versions.length > 0) return versions;

    // Create a synthetic version for display
    return [{
      id: entity.id,
      version: (entity as any).version ?? 1,
      isCurrent: true,
      validFrom: new Date(entity.createdAt),
      validTo: undefined,
      amendmentType: 'original' as const,
      amendmentReason: undefined,
    }];
  }, [versions, entity]);

  const hasHistory = versions.length > 1 || amendments.length > 0;

  return (
    <div className="space-y-6">
      {/* Archived warning */}
      {isArchived && <ArchivedWarning />}

      {/* Current version card */}
      <CurrentVersionCard
        entity={entity}
        entityType={entityType}
        onAmend={isArchived ? undefined : onAmend}
      />

      {/* Immutability info */}
      <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-3 flex items-start gap-2">
        <span className="text-blue-400 mt-0.5">
          <Icons.Info />
        </span>
        <div className="text-xs text-blue-300">
          <strong>Immutable Records:</strong> This system uses immutable record-keeping.
          Changes create new versions instead of overwriting data. All previous versions
          are preserved for audit purposes.
        </div>
      </div>

      {/* Version history */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Icons.Clock />
          <h3 className="text-sm font-medium text-zinc-300">Version History</h3>
          {displayVersions.length > 1 && (
            <span className="px-1.5 py-0.5 bg-zinc-700 text-zinc-400 text-xs rounded">
              {displayVersions.length} versions
            </span>
          )}
        </div>

        {hasHistory ? (
          <RecordHistory
            versions={displayVersions}
            amendments={amendments}
            recordGroupId={(entity as any).recordGroupId}
            entityType={entityType}
            onViewVersion={onViewVersion}
            onRestoreVersion={onRestoreVersion}
          />
        ) : (
          <NoHistoryPlaceholder />
        )}
      </div>

      {/* Export/actions */}
      {hasHistory && (
        <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
          <button
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
          >
            Export History
          </button>
          <div className="text-xs text-zinc-500">
            Download complete audit trail for this record
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
