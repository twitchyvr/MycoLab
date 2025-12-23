// ============================================================================
// CANONICAL ROOM CHECK FORM - Single source of truth for room walkthrough data
// Used in: DailyCheck, CommandCenter
// Features: Attention flags, harvest estimates, notes, completion tracking
// ============================================================================

import React from 'react';
import { NumericInput } from '../common/NumericInput';
import { WeightInput } from '../common/WeightInput';

// ============================================================================
// TYPES
// ============================================================================

export interface RoomCheckFormData {
  checked: boolean;
  checkTime?: Date;
  needsAttention: boolean;
  attentionReason: string;
  harvestEstimate: number;
  notes: string;
}

interface RoomCheckFormProps {
  /** Current form data */
  data: RoomCheckFormData;
  /** Called when form data changes */
  onChange: (data: Partial<RoomCheckFormData>) => void;
  /** Called when user marks room as complete */
  onComplete?: () => void;
  /** Show complete button */
  showCompleteButton?: boolean;
  /** Complete button label */
  completeButtonLabel?: string;
  /** Compact mode */
  compact?: boolean;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Flag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RoomCheckForm: React.FC<RoomCheckFormProps> = ({
  data,
  onChange,
  onComplete,
  showCompleteButton = true,
  completeButtonLabel,
  compact = false,
}) => {
  const handleMarkComplete = () => {
    onChange({ checked: true, checkTime: new Date() });
    onComplete?.();
  };

  const spacing = compact ? 'space-y-3' : 'space-y-4';

  return (
    <div className={spacing}>
      {/* Attention Flag */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
            <Icons.AlertTriangle />
            Needs Attention?
          </h3>
          <button
            onClick={() => onChange({ needsAttention: !data.needsAttention })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              data.needsAttention
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <Icons.Flag />
              {data.needsAttention ? 'Flagged' : 'Flag Room'}
            </span>
          </button>
        </div>
        {data.needsAttention && (
          <textarea
            value={data.attentionReason}
            onChange={e => onChange({ attentionReason: e.target.value })}
            placeholder="Describe what needs attention..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
            rows={2}
          />
        )}
      </div>

      {/* Harvest Estimate */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <WeightInput
          label="7-Day Harvest Estimate"
          value={data.harvestEstimate}
          onChange={(value) => onChange({ harvestEstimate: value ?? 0 })}
          placeholder="0"
          showConversionHint
        />
      </div>

      {/* Notes */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Notes</h3>
        <textarea
          value={data.notes}
          onChange={e => onChange({ notes: e.target.value })}
          placeholder="Any observations or notes..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
          rows={compact ? 2 : 3}
        />
      </div>

      {/* Complete Button */}
      {showCompleteButton && (
        <button
          onClick={handleMarkComplete}
          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
            data.checked
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          <Icons.Check />
          {completeButtonLabel || (data.checked ? 'Update & Continue' : 'Mark Complete')}
        </button>
      )}
    </div>
  );
};

// ============================================================================
// DEFAULT FORM DATA
// ============================================================================

export const getDefaultRoomCheckFormData = (): RoomCheckFormData => ({
  checked: false,
  checkTime: undefined,
  needsAttention: false,
  attentionReason: '',
  harvestEstimate: 0,
  notes: '',
});

export default RoomCheckForm;
