// ============================================================================
// ENTITY DISPOSAL MODAL
// Generic modal for recording why any entity is being disposed/archived
// Supports: cultures, containers, inventory items, equipment, etc.
// Ensures append-only historical tracking - we never truly delete, we record why
// ============================================================================

import React, { useState, useMemo } from 'react';
import { Portal } from './Portal';
import {
  OutcomeOption,
  OutcomeCategory,
  OutcomeCode,
  getOutcomeOptionsForEntity,
  CONTAMINATION_TYPE_OPTIONS,
  SUSPECTED_CAUSE_OPTIONS,
  ContaminationType,
  SuspectedCause,
} from '../../store/types';

// Entity type labels for display
const ENTITY_TYPE_LABELS: Record<string, string> = {
  culture: 'Culture',
  container: 'Container',
  inventory_item: 'Inventory Item',
  inventory_lot: 'Inventory Lot',
  equipment: 'Equipment',
  grow: 'Grow',
};

// Get display name for entity type
const getEntityTypeLabel = (entityType: string): string => {
  return ENTITY_TYPE_LABELS[entityType] || entityType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Category colors for visual grouping
const CATEGORY_STYLES: Record<OutcomeCategory, { bg: string; border: string; text: string; label: string }> = {
  success: { bg: 'bg-emerald-950/30', border: 'border-emerald-700', text: 'text-emerald-400', label: 'Success' },
  failure: { bg: 'bg-red-950/30', border: 'border-red-700', text: 'text-red-400', label: 'Failure' },
  neutral: { bg: 'bg-zinc-800/50', border: 'border-zinc-600', text: 'text-zinc-400', label: 'Neutral' },
  partial: { bg: 'bg-amber-950/30', border: 'border-amber-700', text: 'text-amber-400', label: 'Partial' },
};

export interface DisposalOutcome {
  outcomeCode: OutcomeCode;
  outcomeLabel: string;
  outcomeCategory: OutcomeCategory;
  notes?: string;
  // Contamination details (optional, for contamination outcomes)
  contaminationType?: ContaminationType;
  suspectedCause?: SuspectedCause;
}

interface EntityDisposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (outcome: DisposalOutcome) => void;
  entityType: string;
  entityName: string;
  entityId?: string;
  // Optional: pre-select an outcome (e.g., when coming from a specific action)
  preselectedOutcome?: OutcomeCode;
  // Optional: custom title
  title?: string;
  // Optional: show contamination details form
  showContaminationDetails?: boolean;
}

export const EntityDisposalModal: React.FC<EntityDisposalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  entityType,
  entityName,
  entityId,
  preselectedOutcome,
  title,
  showContaminationDetails = true,
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeOption | null>(null);
  const [notes, setNotes] = useState('');
  const [contaminationType, setContaminationType] = useState<ContaminationType | ''>('');
  const [suspectedCause, setSuspectedCause] = useState<SuspectedCause | ''>('');

  // Get outcome options for this entity type
  const outcomeOptions = useMemo(() => getOutcomeOptionsForEntity(entityType), [entityType]);

  // Group options by category
  const groupedOptions = useMemo(() => {
    const groups: Record<OutcomeCategory, OutcomeOption[]> = {
      success: [],
      failure: [],
      neutral: [],
      partial: [],
    };
    outcomeOptions.forEach(option => {
      groups[option.category].push(option);
    });
    return groups;
  }, [outcomeOptions]);

  // Pre-select outcome if provided
  React.useEffect(() => {
    if (preselectedOutcome) {
      const option = outcomeOptions.find(o => o.code === preselectedOutcome);
      if (option) setSelectedOutcome(option);
    }
  }, [preselectedOutcome, outcomeOptions]);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedOutcome(null);
      setNotes('');
      setContaminationType('');
      setSuspectedCause('');
    }
  }, [isOpen]);

  // Check if selected outcome is contamination-related
  const isContaminationOutcome = selectedOutcome?.code.includes('contamination');

  const handleConfirm = () => {
    if (!selectedOutcome) return;

    const outcome: DisposalOutcome = {
      outcomeCode: selectedOutcome.code,
      outcomeLabel: selectedOutcome.label,
      outcomeCategory: selectedOutcome.category,
      notes: notes.trim() || undefined,
    };

    // Add contamination details if relevant
    if (isContaminationOutcome && showContaminationDetails) {
      if (contaminationType) outcome.contaminationType = contaminationType;
      if (suspectedCause) outcome.suspectedCause = suspectedCause;
    }

    onConfirm(outcome);
  };

  if (!isOpen) return null;

  const entityLabel = getEntityTypeLabel(entityType);
  const modalTitle = title || `Dispose ${entityLabel}`;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 sm:p-4 overflow-y-auto">
        <div className="bg-zinc-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl border-t sm:border border-zinc-700 max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col safe-area-bottom">
        {/* Header */}
        <div className="p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-100">{modalTitle}</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Recording outcome for: <span className="text-zinc-200 font-medium">{entityName}</span>
            {entityId && <span className="text-zinc-500 ml-2">({entityId.slice(0, 8)}...)</span>}
          </p>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Outcome Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Why is this {entityLabel.toLowerCase()} being disposed? <span className="text-red-400">*</span>
            </label>

            {/* Render each category */}
            {(['success', 'failure', 'neutral'] as OutcomeCategory[]).map(category => {
              const options = groupedOptions[category];
              if (options.length === 0) return null;

              const style = CATEGORY_STYLES[category];

              return (
                <div key={category} className="mb-3">
                  <div className={`text-xs font-medium ${style.text} mb-1 uppercase tracking-wider`}>
                    {style.label}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {options.map(option => {
                      const isSelected = selectedOutcome?.code === option.code;
                      return (
                        <button
                          key={option.code}
                          type="button"
                          onClick={() => setSelectedOutcome(option)}
                          className={`
                            text-left p-3 rounded-lg border transition-all min-h-[48px]
                            ${isSelected
                              ? `${style.bg} ${style.border} ${style.text}`
                              : 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600'
                            }
                          `}
                        >
                          <div className="font-medium text-sm">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-zinc-500 mt-0.5">{option.description}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contamination Details (conditional) */}
          {isContaminationOutcome && showContaminationDetails && (
            <div className="space-y-3 p-3 bg-red-950/20 border border-red-900/50 rounded-lg">
              <div className="text-sm font-medium text-red-400">Contamination Details (Optional)</div>

              {/* Contamination Type */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Contamination Type</label>
                <select
                  value={contaminationType}
                  onChange={e => setContaminationType(e.target.value as ContaminationType | '')}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-base sm:text-sm text-zinc-100 min-h-[48px]"
                >
                  <option value="">Not specified</option>
                  {CONTAMINATION_TYPE_OPTIONS.map(opt => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Suspected Cause */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Suspected Cause</label>
                <select
                  value={suspectedCause}
                  onChange={e => setSuspectedCause(e.target.value as SuspectedCause | '')}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-base sm:text-sm text-zinc-100 min-h-[48px]"
                >
                  <option value="">Not specified</option>
                  {SUSPECTED_CAUSE_OPTIONS.map(opt => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional details about why this is being disposed..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-500 resize-none"
              rows={3}
            />
          </div>

          {/* Historical Record Notice */}
          <div className="flex items-start gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-zinc-400">
              <span className="text-zinc-300 font-medium">Historical Record:</span>{' '}
              This {entityLabel.toLowerCase()} will be marked as disposed and the outcome recorded.
              The historical data will be preserved for analytics and traceability.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 min-h-[48px] text-sm text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedOutcome}
            className={`
              px-5 py-2.5 min-h-[48px] text-sm font-medium rounded-lg transition-all
              ${selectedOutcome
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }
            `}
          >
            Confirm Disposal
          </button>
        </div>
        </div>
      </div>
    </Portal>
  );
};

export default EntityDisposalModal;
