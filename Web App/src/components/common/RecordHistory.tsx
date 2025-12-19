// ============================================================================
// RECORD HISTORY COMPONENT
// Displays version history for immutable records (cultures, grows, etc.)
// ============================================================================

import React, { useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AmendmentType,
  RecordVersionSummary,
  DataAmendmentLogEntry,
} from '../../store/types';

// Icons for amendment types
const AmendmentIcons: Record<AmendmentType, string> = {
  original: '📝',
  correction: '✏️',
  update: '🔄',
  void: '🚫',
  merge: '🔗',
};

// Colors for amendment types
const AmendmentColors: Record<AmendmentType, string> = {
  original: 'text-emerald-400 bg-emerald-950/50',
  correction: 'text-yellow-400 bg-yellow-950/50',
  update: 'text-blue-400 bg-blue-950/50',
  void: 'text-red-400 bg-red-950/50',
  merge: 'text-purple-400 bg-purple-950/50',
};

// Labels for amendment types
const AmendmentLabels: Record<AmendmentType, string> = {
  original: 'Original',
  correction: 'Correction',
  update: 'Update',
  void: 'Voided',
  merge: 'Merged',
};

interface RecordHistoryProps {
  // Either provide versions directly or recordGroupId to fetch them
  versions?: RecordVersionSummary[];
  amendments?: DataAmendmentLogEntry[];
  recordGroupId?: string;
  entityType?: string;

  // Callbacks
  onViewVersion?: (versionId: string) => void;
  onRestoreVersion?: (versionId: string) => void;

  // Styling
  compact?: boolean;
  className?: string;
}

/**
 * RecordHistory component displays the version history of an immutable record
 * Shows all versions with their amendment types, reasons, and timestamps
 */
export const RecordHistory: React.FC<RecordHistoryProps> = ({
  versions = [],
  amendments = [],
  recordGroupId,
  entityType,
  onViewVersion,
  onRestoreVersion,
  compact = false,
  className = '',
}) => {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  // Sort versions by version number descending (newest first)
  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => b.version - a.version);
  }, [versions]);

  // Match amendments to versions
  const versionAmendments = useMemo(() => {
    const map = new Map<string, DataAmendmentLogEntry[]>();
    amendments.forEach((amendment) => {
      const existing = map.get(amendment.newRecordId) || [];
      existing.push(amendment);
      map.set(amendment.newRecordId, existing);
    });
    return map;
  }, [amendments]);

  const toggleExpanded = (versionId: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(versionId)) {
        next.delete(versionId);
      } else {
        next.add(versionId);
      }
      return next;
    });
  };

  if (versions.length === 0) {
    return (
      <div className={`p-4 text-center text-zinc-500 ${className}`}>
        No version history available
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`space-y-1 ${className}`}>
        {sortedVersions.map((version) => (
          <div
            key={version.id}
            className={`flex items-center justify-between text-sm px-2 py-1 rounded ${
              version.isCurrent ? 'bg-emerald-950/30 border border-emerald-800' : 'bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">v{version.version}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs ${AmendmentColors[version.amendmentType]}`}>
                {AmendmentIcons[version.amendmentType]} {AmendmentLabels[version.amendmentType]}
              </span>
              {version.isCurrent && (
                <span className="text-xs text-emerald-400 font-medium">(Current)</span>
              )}
            </div>
            <span className="text-zinc-500 text-xs">
              {format(version.validFrom, 'MMM d, yyyy')}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-medium text-zinc-400 mb-3">Version History</h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-zinc-700" />

        {sortedVersions.map((version, index) => {
          const isExpanded = expandedVersions.has(version.id);
          const versionLogs = versionAmendments.get(version.id) || [];

          return (
            <div key={version.id} className="relative pl-8 pb-4">
              {/* Timeline dot */}
              <div
                className={`absolute left-2 w-3 h-3 rounded-full border-2 ${
                  version.isCurrent
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'bg-zinc-900 border-zinc-600'
                }`}
              />

              {/* Version card */}
              <div
                className={`rounded-lg border p-3 ${
                  version.isCurrent
                    ? 'border-emerald-700 bg-emerald-950/20'
                    : 'border-zinc-700 bg-zinc-800/50'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-200">Version {version.version}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        AmendmentColors[version.amendmentType]
                      }`}
                    >
                      {AmendmentIcons[version.amendmentType]} {AmendmentLabels[version.amendmentType]}
                    </span>
                    {version.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-600 text-emerald-100">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onViewVersion && (
                      <button
                        onClick={() => onViewVersion(version.id)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        View
                      </button>
                    )}
                    {onRestoreVersion && !version.isCurrent && (
                      <button
                        onClick={() => onRestoreVersion(version.id)}
                        className="text-xs text-yellow-400 hover:text-yellow-300"
                      >
                        Restore
                      </button>
                    )}
                    <button
                      onClick={() => toggleExpanded(version.id)}
                      className="text-xs text-zinc-500 hover:text-zinc-400"
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
                  <span>
                    Valid from:{' '}
                    <span className="text-zinc-400">
                      {format(version.validFrom, 'MMM d, yyyy h:mm a')}
                    </span>
                  </span>
                  {version.validTo && (
                    <span>
                      Valid to:{' '}
                      <span className="text-zinc-400">
                        {format(version.validTo, 'MMM d, yyyy h:mm a')}
                      </span>
                    </span>
                  )}
                  <span className="text-zinc-600">
                    ({formatDistanceToNow(version.validFrom, { addSuffix: true })})
                  </span>
                </div>

                {/* Amendment reason */}
                {version.amendmentReason && (
                  <div className="mt-2 text-sm text-zinc-400 bg-zinc-900/50 rounded p-2">
                    <span className="text-zinc-500 text-xs block mb-0.5">Reason:</span>
                    {version.amendmentReason}
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-zinc-700">
                    {versionLogs.length > 0 ? (
                      <div className="space-y-2">
                        <span className="text-xs text-zinc-500 font-medium">Change Details:</span>
                        {versionLogs.map((log) => (
                          <div
                            key={log.id}
                            className="text-xs bg-zinc-900 rounded p-2"
                          >
                            {log.changesSummary && (
                              <div className="space-y-1">
                                {Object.entries(log.changesSummary).map(([field, change]) => (
                                  <div key={field} className="flex items-center gap-2">
                                    <span className="text-zinc-500">{field}:</span>
                                    <span className="text-red-400/70 line-through">
                                      {String((change as any).old ?? 'null')}
                                    </span>
                                    <span className="text-zinc-500">→</span>
                                    <span className="text-emerald-400">
                                      {String((change as any).new ?? 'null')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-1 text-zinc-600">
                              Amended by {log.amendedBy || 'unknown'} at{' '}
                              {format(log.amendedAt, 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-600">
                        No detailed change log available
                      </div>
                    )}

                    <div className="mt-2 text-xs text-zinc-600">
                      Record ID: {version.id}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-800">
        {versions.length} version{versions.length !== 1 ? 's' : ''} •{' '}
        {versions.filter((v) => v.amendmentType === 'correction').length} correction
        {versions.filter((v) => v.amendmentType === 'correction').length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default RecordHistory;
