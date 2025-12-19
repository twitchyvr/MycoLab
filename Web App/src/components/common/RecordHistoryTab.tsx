// ============================================================================
// RECORD HISTORY TAB COMPONENT
// Tab panel for viewing immutable record history and creating amendments
// ============================================================================

import React, { useState, useMemo } from 'react';
import { RecordHistory } from './RecordHistory';
import { AmendmentModal } from './AmendmentModal';
import {
  AmendmentType,
  RecordVersionSummary,
  DataAmendmentLogEntry,
  Culture,
  Grow,
} from '../../store/types';
import { useData } from '../../store';

// Define editable fields for each entity type
type EntityType = 'culture' | 'grow';

interface EditableField<T> {
  key: keyof T;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
}

// Culture editable fields
const cultureEditableFields: EditableField<Culture>[] = [
  { key: 'label', label: 'Label', type: 'text', required: true },
  { key: 'notes', label: 'Notes', type: 'textarea' },
  { key: 'healthRating', label: 'Health Rating', type: 'select', options: [
    { value: '1', label: '1 - Poor' },
    { value: '2', label: '2 - Fair' },
    { value: '3', label: '3 - Average' },
    { value: '4', label: '4 - Good' },
    { value: '5', label: '5 - Excellent' },
  ]},
  { key: 'volumeMl', label: 'Volume (ml)', type: 'number' },
  { key: 'fillVolumeMl', label: 'Fill Volume (ml)', type: 'number' },
];

// Grow editable fields
const growEditableFields: EditableField<Grow>[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'notes', label: 'Notes', type: 'textarea' },
  { key: 'spawnWeight', label: 'Spawn Weight (g)', type: 'number' },
  { key: 'substrateWeight', label: 'Substrate Weight (g)', type: 'number' },
];

interface RecordHistoryTabProps {
  // Entity information
  entityType: EntityType;
  record: Culture | Grow;
  recordLabel?: string;

  // Amendment handlers
  onAmend?: (
    changes: Partial<Culture | Grow>,
    amendmentType: AmendmentType,
    reason: string
  ) => Promise<void>;
  onArchive?: (reason: string) => Promise<void>;

  // Optional: provide versions/amendments directly (otherwise computed from recordGroupId)
  versions?: RecordVersionSummary[];
  amendments?: DataAmendmentLogEntry[];

  // Styling
  className?: string;
}

/**
 * RecordHistoryTab provides a complete history view with amendment capabilities
 * for cultures and grows with immutable tracking enabled
 */
export const RecordHistoryTab: React.FC<RecordHistoryTabProps> = ({
  entityType,
  record,
  recordLabel,
  onAmend,
  onArchive,
  versions: providedVersions,
  amendments: providedAmendments,
  className = '',
}) => {
  const { getRecordHistory, getAmendmentLog } = useData();
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);

  // Get record group ID (for immutable records) or fall back to record ID
  const recordGroupId = (record as any).recordGroupId || record.id;

  // Get version history
  const versions = useMemo(() => {
    if (providedVersions) return providedVersions;
    return getRecordHistory(entityType, recordGroupId);
  }, [providedVersions, getRecordHistory, entityType, recordGroupId]);

  // Get amendment log
  const amendments = useMemo(() => {
    if (providedAmendments) return providedAmendments;
    return getAmendmentLog(recordGroupId);
  }, [providedAmendments, getAmendmentLog, recordGroupId]);

  // Determine if this record supports immutable tracking
  const hasImmutableTracking = !!(record as any).recordGroupId || versions.length > 0;

  // Get editable fields based on entity type
  const editableFields = entityType === 'culture' ? cultureEditableFields : growEditableFields;

  // Handle amendment submission
  const handleAmendSubmit = async (amendment: {
    changes: Partial<Culture | Grow>;
    amendmentType: AmendmentType;
    reason: string;
  }) => {
    if (!onAmend) return;
    await onAmend(amendment.changes, amendment.amendmentType, amendment.reason);
    setShowAmendModal(false);
  };

  // Handle archive submission
  const handleArchive = async () => {
    if (!onArchive || !archiveReason.trim()) return;
    setIsArchiving(true);
    try {
      await onArchive(archiveReason.trim());
      setShowArchiveModal(false);
      setArchiveReason('');
    } finally {
      setIsArchiving(false);
    }
  };

  // If no immutable tracking and no versions, show empty state
  if (!hasImmutableTracking && versions.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-zinc-500">
          <p className="mb-2">No version history available</p>
          <p className="text-xs text-zinc-600">
            This record was created before immutable tracking was enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-400">Record History</h3>
        <div className="flex items-center gap-2">
          {onAmend && (
            <button
              onClick={() => setShowAmendModal(true)}
              className="px-3 py-1.5 text-xs font-medium bg-yellow-950/50 hover:bg-yellow-950 text-yellow-400 rounded-lg transition-colors"
            >
              ✏️ Amend
            </button>
          )}
          {onArchive && !(record as any).isArchived && (
            <button
              onClick={() => setShowArchiveModal(true)}
              className="px-3 py-1.5 text-xs font-medium bg-red-950/50 hover:bg-red-950 text-red-400 rounded-lg transition-colors"
            >
              🗑️ Archive
            </button>
          )}
        </div>
      </div>

      {/* Archived warning banner */}
      {(record as any).isArchived && (
        <div className="mb-4 p-3 bg-red-950/30 border border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-lg">🗄️</span>
            <div>
              <p className="text-sm font-medium text-red-300">This record has been archived</p>
              {(record as any).archiveReason && (
                <p className="text-xs text-red-400 mt-1">
                  Reason: {(record as any).archiveReason}
                </p>
              )}
              {(record as any).archivedAt && (
                <p className="text-xs text-red-500 mt-1">
                  Archived on {new Date((record as any).archivedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current version info */}
      {hasImmutableTracking && (
        <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Current Version</span>
            <span className="text-emerald-400 font-medium">
              v{(record as any).version || 1}
            </span>
          </div>
          {(record as any).validFrom && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-zinc-500">Valid From</span>
              <span className="text-zinc-400 text-xs">
                {new Date((record as any).validFrom).toLocaleString()}
              </span>
            </div>
          )}
          {(record as any).amendmentType && (record as any).amendmentType !== 'original' && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-zinc-500">Amendment Type</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                (record as any).amendmentType === 'correction' ? 'bg-yellow-950/50 text-yellow-400' :
                (record as any).amendmentType === 'update' ? 'bg-blue-950/50 text-blue-400' :
                (record as any).amendmentType === 'void' ? 'bg-red-950/50 text-red-400' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {(record as any).amendmentType}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Version History Timeline */}
      <RecordHistory
        versions={versions}
        amendments={amendments}
        recordGroupId={recordGroupId}
        entityType={entityType}
        compact={false}
      />

      {/* Amendment Modal */}
      {showAmendModal && (
        <AmendmentModal
          isOpen={showAmendModal}
          onClose={() => setShowAmendModal(false)}
          onSubmit={handleAmendSubmit}
          record={record}
          recordLabel={recordLabel || (record as any).label || (record as any).name || record.id}
          entityType={entityType === 'culture' ? 'Culture' : 'Grow'}
          editableFields={editableFields as any}
        />
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowArchiveModal(false)}
          />
          <div className="relative w-full max-w-md bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              Archive {entityType === 'culture' ? 'Culture' : 'Grow'}
            </h3>

            <div className="mb-4 p-3 bg-red-950/30 border border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-sm text-red-300">
                    This will archive the record. It will be preserved for historical
                    reference but will no longer appear in active lists.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Reason for archiving <span className="text-red-400">*</span>
              </label>
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="Explain why this record is being archived..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                disabled={isArchiving}
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={isArchiving || !archiveReason.trim()}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isArchiving ? 'Archiving...' : 'Archive Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordHistoryTab;
