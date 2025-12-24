// ============================================================================
// SHAKE MODAL
// Modal for recording break & shake of grain spawn
// ============================================================================

import React, { useState } from 'react';
import { useData } from '../../store';
import { format, differenceInDays } from 'date-fns';
import type { GrainSpawn } from '../../store/types';

interface ShakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  grainSpawn: GrainSpawn;
  onSuccess?: () => void;
}

// Icons
const Icons = {
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Shake: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  AlertCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

export const ShakeModal: React.FC<ShakeModalProps> = ({
  isOpen,
  onClose,
  grainSpawn,
  onSuccess,
}) => {
  const { getStrain, shakeGrainSpawn, updateColonizationProgress } = useData();

  // Form state
  const [colonizationProgress, setColonizationProgress] = useState<number>(grainSpawn.colonizationProgress || 25);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strain = getStrain(grainSpawn.strainId);
  const daysColonizing = differenceInDays(new Date(), grainSpawn.inoculatedAt);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // First update colonization progress if changed
      if (colonizationProgress !== grainSpawn.colonizationProgress) {
        await updateColonizationProgress(grainSpawn.id, colonizationProgress);
      }

      // Then record the shake
      await shakeGrainSpawn(grainSpawn.id, notes || undefined);

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record shake');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Icons.Shake />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Break & Shake</h2>
              <p className="text-sm text-zinc-400">
                {grainSpawn.label || `Spawn ${grainSpawn.id.slice(-6)}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Icons.X />
          </button>
        </div>

        {/* Info Card */}
        <div className="p-4 bg-zinc-800/50 border-b border-zinc-800">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-zinc-100">{strain?.name || 'Unknown'}</div>
              <div className="text-xs text-zinc-500">Strain</div>
            </div>
            <div>
              <div className="text-lg font-bold text-zinc-100">{daysColonizing}d</div>
              <div className="text-xs text-zinc-500">Age</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-400">#{grainSpawn.shakeCount + 1}</div>
              <div className="text-xs text-zinc-500">This Shake</div>
            </div>
          </div>
        </div>

        {/* Workflow Info */}
        <div className="p-4 bg-green-950/30 border-b border-zinc-800">
          <div className="flex items-start gap-3">
            <span className="text-xl">🧹</span>
            <div>
              <p className="text-sm text-green-300 font-medium">Clean Work Environment</p>
              <p className="text-xs text-zinc-400 mt-1">
                Shaking can be done outside sterile conditions. Wipe jar exterior with alcohol before handling.
                Work quickly to minimize exposure.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-400">
              <Icons.AlertCircle />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Colonization Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-300">
                Current Colonization
              </label>
              <span className="text-lg font-bold text-emerald-400">{colonizationProgress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={colonizationProgress}
              onChange={(e) => setColonizationProgress(parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>0%</span>
              <span>25% (typical shake)</span>
              <span>100%</span>
            </div>
          </div>

          {/* Progress Bar Preview */}
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${colonizationProgress}%` }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations before/after shaking..."
              rows={3}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600 resize-none"
            />
          </div>

          {/* Shake Tips */}
          <div className="text-xs text-zinc-500 space-y-1">
            <p>• Shake vigorously to break up mycelium and redistribute colonized grains</p>
            <p>• First shake typically at 20-30% colonization</p>
            <p>• Second shake (if needed) at 50-70%</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⌛</span>
                  Recording...
                </>
              ) : (
                <>
                  <Icons.Shake />
                  Record Shake
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
