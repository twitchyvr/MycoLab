// ============================================================================
// SPAWN TO BULK MODAL
// Modal for spawning fully colonized grain to bulk substrate
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useData } from '../../store';
import { format } from 'date-fns';
import type { GrainSpawn } from '../../store/types';

interface SpawnToBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGrainSpawn?: GrainSpawn;
  onSuccess?: (growId: string) => void;
}

// Icons
const Icons = {
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Minus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  AlertCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="20 6 9 17 4 12"/></svg>,
  Grow: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>,
};

export const SpawnToBulkModal: React.FC<SpawnToBulkModalProps> = ({
  isOpen,
  onClose,
  initialGrainSpawn,
  onSuccess,
}) => {
  const {
    state,
    getStrain,
    getContainer,
    getLocation,
    readyGrainSpawn,
    spawnGrainToBulk,
  } = useData();

  // Form state
  const [selectedSpawnIds, setSelectedSpawnIds] = useState<string[]>(
    initialGrainSpawn ? [initialGrainSpawn.id] : []
  );
  const [name, setName] = useState('');
  const [substrateTypeId, setSubstrateTypeId] = useState('');
  const [substrateWeight, setSubstrateWeight] = useState<string>('2000');
  const [containerId, setContainerId] = useState('');
  const [containerCount, setContainerCount] = useState(1);
  const [locationId, setLocationId] = useState('');
  const [spawnRate, setSpawnRate] = useState<string>('10');
  const [targetTempColonization, setTargetTempColonization] = useState<string>('75');
  const [targetTempFruiting, setTargetTempFruiting] = useState<string>('65');
  const [targetHumidity, setTargetHumidity] = useState<string>('90');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the strain from the first selected spawn
  const primarySpawn = useMemo(() => {
    return selectedSpawnIds.length > 0
      ? state.grainSpawn.find(gs => gs.id === selectedSpawnIds[0])
      : null;
  }, [selectedSpawnIds, state.grainSpawn]);

  const strain = primarySpawn ? getStrain(primarySpawn.strainId) : null;

  // Filter ready spawn for the same strain if one is selected
  const compatibleSpawn = useMemo(() => {
    if (selectedSpawnIds.length === 0) return readyGrainSpawn;
    const strainId = primarySpawn?.strainId;
    return readyGrainSpawn.filter(gs => gs.strainId === strainId);
  }, [readyGrainSpawn, selectedSpawnIds, primarySpawn]);

  // Calculate total spawn weight
  const totalSpawnWeight = useMemo(() => {
    return selectedSpawnIds.reduce((sum, id) => {
      const gs = state.grainSpawn.find(g => g.id === id);
      return sum + (gs?.weightGrams || 0) * (gs?.containerCount || 1);
    }, 0);
  }, [selectedSpawnIds, state.grainSpawn]);

  // Calculate actual spawn rate
  const actualSpawnRate = useMemo(() => {
    const subWeight = parseFloat(substrateWeight) || 0;
    if (subWeight === 0 || totalSpawnWeight === 0) return 0;
    return (totalSpawnWeight / (totalSpawnWeight + subWeight)) * 100;
  }, [totalSpawnWeight, substrateWeight]);

  // Toggle spawn selection
  const toggleSpawn = (id: string) => {
    setSelectedSpawnIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      // If adding and this is first, use it. If different strain, reset.
      if (prev.length === 0) {
        return [id];
      }
      const existingSpawn = state.grainSpawn.find(gs => gs.id === prev[0]);
      const newSpawn = state.grainSpawn.find(gs => gs.id === id);
      if (existingSpawn?.strainId !== newSpawn?.strainId) {
        return [id]; // Reset to new strain
      }
      return [...prev, id];
    });
  };

  // Auto-generate name when strain is selected
  const generateName = () => {
    if (strain && !name) {
      const dateStr = format(new Date(), 'yyMMdd');
      setName(`${strain.name} - ${dateStr}`);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedSpawnIds.length === 0) {
      setError('Please select at least one grain spawn batch');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a name for this grow');
      return;
    }
    if (!substrateTypeId) {
      setError('Please select a substrate type');
      return;
    }
    if (!containerId) {
      setError('Please select a container type');
      return;
    }
    if (!locationId) {
      setError('Please select a location');
      return;
    }

    setIsSubmitting(true);

    try {
      const newGrow = await spawnGrainToBulk(selectedSpawnIds, {
        name: name.trim(),
        strainId: primarySpawn!.strainId,
        status: 'active',
        currentStage: 'spawning',
        sourceCultureId: primarySpawn?.sourceCultureId,
        spawnType: 'grain',
        spawnWeight: totalSpawnWeight,
        substrateTypeId,
        substrateWeight: parseFloat(substrateWeight) || 0,
        spawnRate: actualSpawnRate,
        containerId,
        containerCount,
        spawnedAt: new Date(),
        locationId,
        targetTempColonization: parseFloat(targetTempColonization) || 75,
        targetTempFruiting: parseFloat(targetTempFruiting) || 65,
        targetHumidity: parseFloat(targetHumidity) || 90,
        estimatedCost: 0,
        notes: notes || '',
      });

      onSuccess?.(newGrow.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create grow');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Icons.Grow />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Spawn to Bulk</h2>
              <p className="text-sm text-zinc-400">Create a new grow from colonized grain spawn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Icons.X />
          </button>
        </div>

        {/* Workflow Info */}
        <div className="p-4 bg-green-950/30 border-b border-zinc-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧹</span>
            <div>
              <p className="text-sm text-green-300 font-medium">Clean Work Environment</p>
              <p className="text-xs text-zinc-400 mt-1">
                Spawn-to-bulk can be done in a clean environment (not strictly sterile).
                Work quickly and minimize exposure. Wipe containers with alcohol before handling.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-400">
              <Icons.AlertCircle />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Step 1: Select Grain Spawn */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              1. Select Grain Spawn <span className="text-red-400">*</span>
              {selectedSpawnIds.length > 0 && (
                <span className="text-zinc-500 ml-2">({selectedSpawnIds.length} selected)</span>
              )}
            </label>
            {readyGrainSpawn.length === 0 ? (
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg text-center">
                <p className="text-zinc-400 text-sm">No fully colonized grain spawn available</p>
                <p className="text-zinc-500 text-xs mt-1">Wait for grain spawn to reach 100% colonization</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {(selectedSpawnIds.length === 0 ? readyGrainSpawn : compatibleSpawn).map((gs) => {
                  const gsStrain = getStrain(gs.strainId);
                  const container = getContainer(gs.containerId || '');
                  const isSelected = selectedSpawnIds.includes(gs.id);

                  return (
                    <button
                      key={gs.id}
                      type="button"
                      onClick={() => toggleSpawn(gs.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                        isSelected
                          ? 'bg-emerald-950/50 border-emerald-700'
                          : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-zinc-600'
                      }`}>
                        {isSelected && <Icons.Check />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-zinc-100 truncate">
                          {gs.label || `Spawn ${gs.id.slice(-6)}`}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span>{gsStrain?.name}</span>
                          {gs.weightGrams && <span>• {gs.weightGrams}g</span>}
                          {gs.containerCount > 1 && <span>• ×{gs.containerCount}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {totalSpawnWeight > 0 && (
              <p className="text-xs text-emerald-400 mt-2">
                Total spawn weight: {totalSpawnWeight}g
              </p>
            )}
          </div>

          {/* Step 2: Grow Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Grow Name <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={generateName}
                  placeholder="e.g., Blue Oyster - Batch 1"
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Substrate Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Substrate Type <span className="text-red-400">*</span>
              </label>
              <select
                value={substrateTypeId}
                onChange={(e) => setSubstrateTypeId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
              >
                <option value="">Select substrate...</option>
                {state.substrateTypes.filter(st => st.isActive).map((st) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>

            {/* Substrate Weight */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Substrate Weight (g)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={substrateWeight}
                onChange={(e) => setSubstrateWeight(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Container Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Container <span className="text-red-400">*</span>
              </label>
              <select
                value={containerId}
                onChange={(e) => setContainerId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
              >
                <option value="">Select container...</option>
                {state.containers.filter(c => c.isActive).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Container Count */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Number of Containers
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setContainerCount(Math.max(1, containerCount - 1))}
                  className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-zinc-600"
                >
                  <Icons.Minus />
                </button>
                <input
                  type="number"
                  min="1"
                  value={containerCount}
                  onChange={(e) => setContainerCount(parseInt(e.target.value) || 1)}
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-center focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setContainerCount(containerCount + 1)}
                  className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-zinc-600"
                >
                  <Icons.Plus />
                </button>
              </div>
            </div>

            {/* Location */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Location <span className="text-red-400">*</span>
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
              >
                <option value="">Select location...</option>
                {state.locations.filter(l => l.isActive).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Spawn Rate Indicator */}
          {actualSpawnRate > 0 && (
            <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Calculated Spawn Rate</span>
                <span className={`text-lg font-bold ${
                  actualSpawnRate >= 8 && actualSpawnRate <= 15 ? 'text-emerald-400' :
                  actualSpawnRate >= 5 && actualSpawnRate <= 20 ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {actualSpawnRate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    actualSpawnRate >= 8 && actualSpawnRate <= 15 ? 'bg-emerald-500' :
                    actualSpawnRate >= 5 && actualSpawnRate <= 20 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(actualSpawnRate * 3, 100)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Ideal range: 8-15% for most species
              </p>
            </div>
          )}

          {/* Environmental Targets (Collapsible) */}
          <details className="group">
            <summary className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-600">
              <span className="text-sm font-medium text-zinc-300">Environmental Targets</span>
              <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Colonization Temp (°F)</label>
                <input
                  type="number"
                  value={targetTempColonization}
                  onChange={(e) => setTargetTempColonization(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Fruiting Temp (°F)</label>
                <input
                  type="number"
                  value={targetTempFruiting}
                  onChange={(e) => setTargetTempFruiting(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Humidity (%)</label>
                <input
                  type="number"
                  value={targetHumidity}
                  onChange={(e) => setTargetHumidity(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </details>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this grow..."
              rows={2}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600 resize-none"
            />
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
              disabled={isSubmitting || selectedSpawnIds.length === 0}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⌛</span>
                  Creating...
                </>
              ) : (
                <>
                  <Icons.Grow />
                  Start Grow
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
