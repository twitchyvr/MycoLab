// ============================================================================
// INOCULATE TO GRAIN MODAL
// Modal for inoculating prepared spawn containers from cultures
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useData } from '../../store';
import { format } from 'date-fns';
import type { Culture, PreparedSpawn } from '../../store/types';

interface InoculateToGrainModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedCultureId?: string;
  preSelectedPreparedSpawnId?: string;
  onSuccess?: (grainSpawnId: string) => void;
}

// Icons
const Icons = {
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Flask: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>,
  Grain: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6"/><path d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6"/></svg>,
  Syringe: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>,
  AlertCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="20 6 9 17 4 12"/></svg>,
};

// Culture type display configs
const cultureTypeConfig = {
  liquid_culture: { label: 'Liquid Culture', icon: Icons.Flask, color: 'text-cyan-400' },
  agar: { label: 'Agar', icon: Icons.Flask, color: 'text-purple-400' },
  spore_syringe: { label: 'Spore Syringe', icon: Icons.Syringe, color: 'text-blue-400' },
  slant: { label: 'Slant', icon: Icons.Flask, color: 'text-orange-400' },
};

export const InoculateToGrainModal: React.FC<InoculateToGrainModalProps> = ({
  isOpen,
  onClose,
  preSelectedCultureId,
  preSelectedPreparedSpawnId,
  onSuccess,
}) => {
  const {
    state,
    getStrain,
    getContainer,
    getGrainType,
    getLocation,
    availablePreparedSpawn,
    inoculateToGrainSpawn,
  } = useData();

  // Form state
  const [selectedCultureId, setSelectedCultureId] = useState<string>(preSelectedCultureId || '');
  const [selectedPreparedSpawnId, setSelectedPreparedSpawnId] = useState<string>(preSelectedPreparedSpawnId || '');
  const [containerCount, setContainerCount] = useState<number>(1);
  const [inoculationVolume, setInoculationVolume] = useState<string>('');
  const [inoculationUnit, setInoculationUnit] = useState<'ml' | 'cc' | 'wedges' | 'drops'>('ml');
  const [locationId, setLocationId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get available cultures (ready cultures that can inoculate)
  const availableCultures = useMemo(() => {
    return state.cultures.filter(c =>
      ['active', 'ready', 'colonizing'].includes(c.status) &&
      ['liquid_culture', 'agar', 'spore_syringe'].includes(c.type)
    ).sort((a, b) => {
      // Sort by type priority (LC first), then by name
      const typePriority = { liquid_culture: 0, spore_syringe: 1, agar: 2, slant: 3 };
      const priorityDiff = (typePriority[a.type] ?? 99) - (typePriority[b.type] ?? 99);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.label || '').localeCompare(b.label || '');
    });
  }, [state.cultures]);

  // Get grain-type prepared spawn only
  const grainPreparedSpawn = useMemo(() => {
    return availablePreparedSpawn.filter(ps =>
      ps.type === 'grain_jar' || ps.type === 'spawn_bag'
    );
  }, [availablePreparedSpawn]);

  // Selected culture details
  const selectedCulture = useMemo(() => {
    return selectedCultureId ? state.cultures.find(c => c.id === selectedCultureId) : null;
  }, [selectedCultureId, state.cultures]);

  // Selected prepared spawn details
  const selectedPreparedSpawn = useMemo(() => {
    return selectedPreparedSpawnId ? state.preparedSpawn.find(ps => ps.id === selectedPreparedSpawnId) : null;
  }, [selectedPreparedSpawnId, state.preparedSpawn]);

  // Update container count when prepared spawn is selected
  const handlePreparedSpawnSelect = (id: string) => {
    setSelectedPreparedSpawnId(id);
    const ps = state.preparedSpawn.find(p => p.id === id);
    if (ps) {
      setContainerCount(ps.containerCount || 1);
      if (ps.locationId) {
        setLocationId(ps.locationId);
      }
    }
  };

  // Update inoculation unit based on culture type
  const handleCultureSelect = (id: string) => {
    setSelectedCultureId(id);
    const culture = state.cultures.find(c => c.id === id);
    if (culture?.type === 'agar') {
      setInoculationUnit('wedges');
    } else {
      setInoculationUnit('ml');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCultureId) {
      setError('Please select a source culture');
      return;
    }
    if (!selectedPreparedSpawnId) {
      setError('Please select a prepared spawn container');
      return;
    }

    setIsSubmitting(true);

    try {
      const inoculationData: {
        containerCount?: number;
        inoculationVolumeMl?: number;
        inoculationUnits?: number;
        inoculationUnit?: string;
        locationId?: string;
        notes?: string;
      } = {
        containerCount,
        inoculationUnit,
        notes: notes || undefined,
      };

      // Handle volume/units based on inoculation unit type
      if (inoculationVolume) {
        const numValue = parseFloat(inoculationVolume);
        if (inoculationUnit === 'ml' || inoculationUnit === 'cc') {
          inoculationData.inoculationVolumeMl = numValue;
        } else {
          inoculationData.inoculationUnits = numValue;
        }
      }

      if (locationId) {
        inoculationData.locationId = locationId;
      }

      const newGrainSpawn = await inoculateToGrainSpawn(
        selectedCultureId,
        selectedPreparedSpawnId,
        inoculationData
      );

      onSuccess?.(newGrainSpawn.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to inoculate spawn');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Icons.Grain />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Inoculate Grain Spawn</h2>
              <p className="text-sm text-zinc-400">Transfer culture to prepared grain containers</p>
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
        <div className="p-4 bg-blue-950/30 border-b border-zinc-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧪</span>
            <div>
              <p className="text-sm text-blue-300 font-medium">Sterile Work Required</p>
              <p className="text-xs text-zinc-400 mt-1">
                This operation should be performed in a still-air box (SAB) or in front of a laminar flow hood.
                Ensure all surfaces and tools are sterilized with 70% isopropyl alcohol.
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

          {/* Step 1: Select Source Culture */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              1. Select Source Culture <span className="text-red-400">*</span>
            </label>
            {availableCultures.length === 0 ? (
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg text-center">
                <p className="text-zinc-400 text-sm">No available cultures</p>
                <p className="text-zinc-500 text-xs mt-1">Create a liquid culture, agar plate, or spore syringe first</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {availableCultures.map((culture) => {
                  const strain = getStrain(culture.strainId);
                  const typeConfig = cultureTypeConfig[culture.type];
                  const isSelected = selectedCultureId === culture.id;

                  return (
                    <button
                      key={culture.id}
                      type="button"
                      onClick={() => handleCultureSelect(culture.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                        isSelected
                          ? 'bg-emerald-950/50 border-emerald-700'
                          : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className={`p-2 rounded-lg bg-zinc-700/50 ${typeConfig.color}`}>
                        <typeConfig.icon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-100 truncate">
                            {culture.label || `Culture ${culture.id.slice(-6)}`}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${typeConfig.color} bg-zinc-800`}>
                            {typeConfig.label}
                          </span>
                        </div>
                        <div className="text-sm text-zinc-400 truncate">
                          {strain?.name || 'Unknown Strain'}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="text-emerald-400">
                          <Icons.Check />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Select Prepared Spawn */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              2. Select Prepared Spawn Container <span className="text-red-400">*</span>
            </label>
            {grainPreparedSpawn.length === 0 ? (
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg text-center">
                <p className="text-zinc-400 text-sm">No ready spawn available</p>
                <p className="text-zinc-500 text-xs mt-1">
                  Only spawn that has been sterilized and cooled (status: ready) can be inoculated.
                  Prepare grain jars, sterilize them, then mark them as cooled when ready.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {grainPreparedSpawn.map((ps) => {
                  const container = getContainer(ps.containerId);
                  const grainType = ps.grainTypeId ? getGrainType(ps.grainTypeId) : null;
                  const isSelected = selectedPreparedSpawnId === ps.id;

                  return (
                    <button
                      key={ps.id}
                      type="button"
                      onClick={() => handlePreparedSpawnSelect(ps.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                        isSelected
                          ? 'bg-emerald-950/50 border-emerald-700'
                          : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-zinc-700/50 text-amber-400">
                        <Icons.Grain />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-100 truncate">
                            {ps.label || `${container?.name || 'Container'}`}
                          </span>
                          {ps.containerCount > 1 && (
                            <span className="text-xs px-2 py-0.5 rounded-full text-zinc-400 bg-zinc-800">
                              ×{ps.containerCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          {grainType && <span>{grainType.name}</span>}
                          {ps.weightGrams && <span>• {ps.weightGrams}g</span>}
                          <span>• Prepped {format(ps.prepDate, 'MMM d')}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="text-emerald-400">
                          <Icons.Check />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Inoculation Details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Container Count */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Containers to Inoculate
              </label>
              <input
                type="number"
                min="1"
                max={selectedPreparedSpawn?.containerCount || 100}
                value={containerCount}
                onChange={(e) => setContainerCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
              />
              {selectedPreparedSpawn && selectedPreparedSpawn.containerCount > 1 && (
                <p className="text-xs text-zinc-500 mt-1">
                  Max: {selectedPreparedSpawn.containerCount} available
                </p>
              )}
            </div>

            {/* Inoculation Amount */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Amount per Container
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={inoculationVolume}
                  onChange={(e) => setInoculationVolume(e.target.value)}
                  placeholder={inoculationUnit === 'wedges' ? '2' : '1.0'}
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
                />
                <select
                  value={inoculationUnit}
                  onChange={(e) => setInoculationUnit(e.target.value as typeof inoculationUnit)}
                  className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
                >
                  <option value="ml">mL</option>
                  <option value="cc">cc</option>
                  <option value="drops">drops</option>
                  {selectedCulture?.type === 'agar' && <option value="wedges">wedges</option>}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Incubation Location
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
            >
              <option value="">Same as prepared spawn</option>
              {state.locations.filter(l => l.isActive).map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this inoculation..."
              rows={2}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600 resize-none"
            />
          </div>

          {/* Summary */}
          {selectedCulture && selectedPreparedSpawn && (
            <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <h4 className="text-sm font-medium text-zinc-300 mb-2">Summary</h4>
              <div className="text-sm text-zinc-400 space-y-1">
                <p>
                  Inoculating <span className="text-zinc-200">{containerCount}</span> container(s) of{' '}
                  <span className="text-zinc-200">{selectedPreparedSpawn.label || 'grain spawn'}</span>
                </p>
                <p>
                  From: <span className="text-zinc-200">{selectedCulture.label || 'culture'}</span>{' '}
                  ({cultureTypeConfig[selectedCulture.type].label})
                </p>
                {inoculationVolume && (
                  <p>
                    Using: <span className="text-zinc-200">{inoculationVolume} {inoculationUnit}</span> per container
                  </p>
                )}
              </div>
            </div>
          )}

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
              disabled={isSubmitting || !selectedCultureId || !selectedPreparedSpawnId}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⌛</span>
                  Inoculating...
                </>
              ) : (
                <>
                  <Icons.Grain />
                  Inoculate Spawn
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
