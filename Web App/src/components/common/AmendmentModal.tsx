// ============================================================================
// AMENDMENT MODAL COMPONENT
// Modal for creating amendments to immutable records
// ============================================================================

import React, { useState, useCallback } from 'react';
import { Portal } from './Portal';
import { AmendmentType } from '../../store/types';

// Amendment type options with descriptions
const AMENDMENT_OPTIONS: Array<{
  type: AmendmentType;
  label: string;
  description: string;
  icon: string;
  color: string;
}> = [
  {
    type: 'correction',
    label: 'Correction',
    description: 'Fix an error in the original data (e.g., typo, wrong weight)',
    icon: '✏️',
    color: 'border-yellow-600 bg-yellow-950/30 hover:bg-yellow-950/50',
  },
  {
    type: 'update',
    label: 'Update',
    description: 'Normal business update (e.g., status change, new notes)',
    icon: '🔄',
    color: 'border-blue-600 bg-blue-950/30 hover:bg-blue-950/50',
  },
  {
    type: 'void',
    label: 'Void',
    description: 'Nullify this record (e.g., duplicate entry, created in error)',
    icon: '🚫',
    color: 'border-red-600 bg-red-950/30 hover:bg-red-950/50',
  },
];

interface AmendmentModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amendment: {
    changes: Partial<T>;
    amendmentType: AmendmentType;
    reason: string;
  }) => Promise<void>;

  // Current record data
  record: T;
  recordLabel?: string;
  entityType: string;

  // Form fields to edit
  editableFields: Array<{
    key: keyof T;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea';
    options?: Array<{ value: string; label: string }>;
    required?: boolean;
  }>;

  // Optional: pre-select amendment type
  defaultAmendmentType?: AmendmentType;
}

export function AmendmentModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  onSubmit,
  record,
  recordLabel,
  entityType,
  editableFields,
  defaultAmendmentType,
}: AmendmentModalProps<T>) {
  const [amendmentType, setAmendmentType] = useState<AmendmentType>(
    defaultAmendmentType || 'correction'
  );
  const [reason, setReason] = useState('');
  const [changes, setChanges] = useState<Partial<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = useCallback((key: keyof T, value: any) => {
    setChanges((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate reason
    if (!reason.trim()) {
      setError('Please provide a reason for this amendment');
      return;
    }

    // Validate that at least one field changed (unless voiding)
    if (amendmentType !== 'void' && Object.keys(changes).length === 0) {
      setError('Please make at least one change');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        changes,
        amendmentType,
        reason: reason.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create amendment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getFieldValue = (key: keyof T): any => {
    if (key in changes) {
      return changes[key];
    }
    return record[key];
  };

  const hasChanged = (key: keyof T): boolean => {
    if (!(key in changes)) return false;
    const original = record[key] as unknown;
    const changed = changes[key] as unknown;
    if (original instanceof Date && changed instanceof Date) {
      return original.getTime() !== changed.getTime();
    }
    return original !== changed;
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                Amend {entityType}
              </h2>
              {recordLabel && (
                <p className="text-sm text-zinc-400 mt-0.5">
                  Editing: <span className="text-zinc-300">{recordLabel}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-6">
            {/* Amendment Type Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Amendment Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {AMENDMENT_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setAmendmentType(option.type)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      amendmentType === option.type
                        ? option.color + ' border-2'
                        : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{option.icon}</span>
                      <span className="font-medium text-zinc-200">{option.label}</span>
                    </div>
                    <p className="text-xs text-zinc-400">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Reason for Amendment <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this record is being amended..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                rows={2}
                required
              />
              <p className="mt-1 text-xs text-zinc-500">
                This reason will be recorded in the audit log
              </p>
            </div>

            {/* Editable Fields */}
            {amendmentType !== 'void' && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Fields to Update
                </label>
                <div className="space-y-4">
                  {editableFields.map((field) => (
                    <div key={String(field.key)}>
                      <label className="block text-sm text-zinc-400 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                        {hasChanged(field.key) && (
                          <span className="ml-2 text-xs text-yellow-400">(changed)</span>
                        )}
                      </label>

                      {field.type === 'textarea' ? (
                        <textarea
                          value={getFieldValue(field.key) ?? ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className={`w-full px-3 py-2 bg-zinc-800 border rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none ${
                            hasChanged(field.key) ? 'border-yellow-600' : 'border-zinc-700'
                          }`}
                          rows={3}
                          required={field.required}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={getFieldValue(field.key) ?? ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className={`w-full px-3 py-2 bg-zinc-800 border rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                            hasChanged(field.key) ? 'border-yellow-600' : 'border-zinc-700'
                          }`}
                          required={field.required}
                        >
                          <option value="">Select...</option>
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={getFieldValue(field.key) ?? ''}
                          onChange={(e) =>
                            handleFieldChange(
                              field.key,
                              field.type === 'number' ? parseFloat(e.target.value) : e.target.value
                            )
                          }
                          className={`w-full px-3 py-2 bg-zinc-800 border rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                            hasChanged(field.key) ? 'border-yellow-600' : 'border-zinc-700'
                          }`}
                          required={field.required}
                        />
                      )}

                      {/* Show original value if changed */}
                      {hasChanged(field.key) && (
                        <p className="mt-1 text-xs text-zinc-500">
                          Original: <span className="text-zinc-400">{String(record[field.key] ?? 'empty')}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Void Warning */}
            {amendmentType === 'void' && (
              <div className="p-4 bg-red-950/30 border border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="font-medium text-red-300">Voiding this record</h4>
                    <p className="text-sm text-red-400 mt-1">
                      This will mark the record as voided. It will be preserved in the audit trail
                      but will no longer appear in active lists or calculations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-700 px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Changes will be recorded with full audit trail
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  amendmentType === 'void'
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : amendmentType === 'void' ? (
                  'Void Record'
                ) : (
                  'Submit Amendment'
                )}
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </Portal>
  );
}

export default AmendmentModal;
