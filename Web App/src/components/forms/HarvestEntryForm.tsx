// ============================================================================
// CANONICAL HARVEST ENTRY FORM - Single source of truth for recording harvests
// Used everywhere in the app: GrowManagement, CommandCenter, HarvestWorkflow
// Features: Weight input with unit conversion, quality selector, BE preview
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { WeightInput } from '../common/WeightInput';
import { NumericInput } from '../common/NumericInput';
import type { Flush, Grow } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

export interface HarvestEntryData {
  wetWeight: number;
  dryWeight?: number;
  mushroomCount?: number;
  quality: Flush['quality'];
  notes?: string;
}

interface HarvestEntryFormProps {
  /** The grow being harvested */
  grow: Grow;
  /** Strain name for display */
  strainName?: string;
  /** Current form data */
  data: HarvestEntryData;
  /** Called when form data changes */
  onChange: (data: Partial<HarvestEntryData>) => void;
  /** Called when form is submitted */
  onSubmit: () => void;
  /** Called when cancel button clicked */
  onCancel?: () => void;
  /** Whether form is currently saving */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Whether to show header with grow info */
  showHeader?: boolean;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Whether to show cancel button */
  showCancel?: boolean;
  /** Custom submit button label */
  submitLabel?: string;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const HarvestEntryForm: React.FC<HarvestEntryFormProps> = ({
  grow,
  strainName,
  data,
  onChange,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  showHeader = false,
  compact = false,
  showCancel = true,
  submitLabel = 'Record Harvest',
}) => {
  // Calculate flush number for this harvest
  const flushNumber = (grow.flushes?.length || 0) + 1;

  // Calculate estimated dry weight (10% of wet by default)
  const estimatedDry = useMemo(() => {
    if (!data.wetWeight) return 0;
    return Math.round(data.wetWeight * 0.1);
  }, [data.wetWeight]);

  // Calculate biological efficiency preview
  const bePreview = useMemo(() => {
    if (!data.wetWeight || !grow.substrateWeight) return null;

    // Add existing flush yields
    const existingYield = (grow.flushes || []).reduce((sum, f) => sum + (f.wetWeight || 0), 0);
    const totalYield = existingYield + data.wetWeight;
    const be = (totalYield / grow.substrateWeight) * 100;

    return {
      current: be,
      thisFlush: (data.wetWeight / grow.substrateWeight) * 100,
      existingYield,
      totalYield,
    };
  }, [data.wetWeight, grow.substrateWeight, grow.flushes]);

  // Quality options configuration
  const qualityOptions: { value: Flush['quality']; label: string; color: string }[] = [
    { value: 'poor', label: 'Poor', color: 'text-red-400 bg-red-500/10 border-red-500/50' },
    { value: 'fair', label: 'Fair', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/50' },
    { value: 'good', label: 'Good', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/50' },
    { value: 'excellent', label: 'Excellent', color: 'text-blue-400 bg-blue-500/10 border-blue-500/50' },
  ];

  // Handle form submission
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!data.wetWeight || isLoading) return;
    onSubmit();
  }, [data.wetWeight, isLoading, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className={`space-y-${compact ? '3' : '4'}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              ←
            </button>
          )}
          <div>
            <h2 className="text-lg font-semibold text-white">{grow.name}</h2>
            <p className="text-sm text-zinc-400">
              {strainName || 'Unknown strain'} • Flush #{flushNumber}
            </p>
          </div>
        </div>
      )}

      {/* Weight Inputs */}
      <div className={`space-y-${compact ? '2' : '3'}`}>
        <WeightInput
          label="Wet Weight"
          value={data.wetWeight || undefined}
          onChange={(value) => onChange({ wetWeight: value ?? 0 })}
          required
          allowEmpty={false}
          showConversionHint={!compact}
          compact={compact}
        />

        <div className={`grid grid-cols-2 gap-${compact ? '2' : '3'}`}>
          <WeightInput
            label="Dry Weight"
            value={data.dryWeight || undefined}
            onChange={(value) => onChange({ dryWeight: value })}
            placeholder={estimatedDry ? `~${estimatedDry}` : 'Optional'}
            showConversionHint={false}
            compact={true}
          />
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Count</label>
            <NumericInput
              value={data.mushroomCount}
              onChange={(value) => onChange({ mushroomCount: value })}
              placeholder="Optional"
              className={`w-full ${compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'} rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-emerald-500`}
            />
          </div>
        </div>
      </div>

      {/* Quality Selector */}
      <div className={compact ? '' : 'p-3 rounded-lg bg-zinc-900/50 border border-zinc-800'}>
        <label className={`block text-sm text-zinc-400 ${compact ? 'mb-1' : 'mb-2'}`}>Quality</label>
        <div className={`flex gap-${compact ? '1' : '2'}`}>
          {qualityOptions.map(({ value, label, color }) => {
            const isSelected = data.quality === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ quality: value })}
                className={`flex-1 ${compact ? 'py-1.5 text-xs' : 'py-2 text-sm'} rounded-lg font-medium capitalize transition-all ${
                  isSelected
                    ? color
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                {compact ? label[0] : label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      {!compact && (
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <label className="block text-sm text-zinc-400 mb-2">Notes</label>
          <textarea
            value={data.notes || ''}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Appearance, size, cap color, abnormalities..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}

      {/* BE Preview */}
      {bePreview && !compact && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-400">Biological Efficiency</span>
            <span className="text-lg font-semibold text-emerald-300">
              {bePreview.current.toFixed(1)}%
            </span>
          </div>
          {bePreview.existingYield > 0 && (
            <p className="text-xs text-zinc-500 mt-1">
              This flush adds {bePreview.thisFlush.toFixed(1)}% to total
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={`p-${compact ? '2' : '3'} rounded-lg bg-red-950/50 border border-red-800 text-red-400 text-sm`}>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className={`flex gap-${compact ? '2' : '3'}`}>
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={`flex-1 ${compact ? 'py-2 text-sm' : 'py-3'} rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-medium transition-colors`}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!data.wetWeight || isLoading}
          className={`${showCancel && onCancel ? 'flex-1' : 'w-full'} ${compact ? 'py-2 text-sm' : 'py-3'} rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium transition-colors flex items-center justify-center gap-2`}
        >
          {isLoading ? (
            <span>Saving...</span>
          ) : (
            <>
              <Icons.Check />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// ============================================================================
// DEFAULT FORM DATA
// ============================================================================

export const getDefaultHarvestEntryData = (): HarvestEntryData => ({
  wetWeight: 0,
  dryWeight: undefined,
  mushroomCount: undefined,
  quality: 'good',
  notes: '',
});

export default HarvestEntryForm;
