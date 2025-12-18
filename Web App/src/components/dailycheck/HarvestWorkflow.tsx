// ============================================================================
// HARVEST WORKFLOW - Streamlined Harvest Recording (dev-184)
// Quick workflow: select grow → enter weight → auto-calc BE%
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../store';
import { NumericInput } from '../common/NumericInput';
import { WeightInput } from '../common/WeightInput';
import type { Grow, Flush, GrowStage } from '../../store/types';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Scale: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="20 6 9 17 4 12"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Mushroom: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 2L12 22"/><path d="M17 7C17 7 13 9 12 14"/><path d="M7 7C7 7 11 9 12 14"/></svg>,
  TrendingUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  History: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

// Stage configurations
const stageConfig: Record<GrowStage, { label: string; icon: string; color: string }> = {
  spawning: { label: 'Spawning', icon: '🌱', color: 'text-purple-400 bg-purple-950/50' },
  colonization: { label: 'Colonizing', icon: '🔵', color: 'text-blue-400 bg-blue-950/50' },
  fruiting: { label: 'Fruiting', icon: '🍄', color: 'text-emerald-400 bg-emerald-950/50' },
  harvesting: { label: 'Harvesting', icon: '✂️', color: 'text-amber-400 bg-amber-950/50' },
  completed: { label: 'Completed', icon: '✅', color: 'text-green-400 bg-green-950/50' },
  contaminated: { label: 'Contaminated', icon: '☠️', color: 'text-red-400 bg-red-950/50' },
  aborted: { label: 'Aborted', icon: '⛔', color: 'text-zinc-400 bg-zinc-800' },
};

// Quality rating labels
const qualityOptions: { value: Flush['quality']; label: string; color: string }[] = [
  { value: 'excellent', label: 'Excellent', color: 'bg-emerald-500 text-white' },
  { value: 'good', label: 'Good', color: 'bg-blue-500 text-white' },
  { value: 'fair', label: 'Fair', color: 'bg-amber-500 text-white' },
  { value: 'poor', label: 'Poor', color: 'bg-red-500 text-white' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const calculateBE = (wetWeight: number, substrateWeight: number): number => {
  if (substrateWeight <= 0) return 0;
  return Math.round((wetWeight / substrateWeight) * 100 * 10) / 10;
};

const daysActive = (startDate: Date): number => {
  return Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
};

// ============================================================================
// COMPONENTS
// ============================================================================

const GrowSelectionCard: React.FC<{
  grow: Grow;
  strain: { name: string } | undefined;
  onSelect: () => void;
  isSelected: boolean;
}> = ({ grow, strain, onSelect, isSelected }) => {
  const config = stageConfig[grow.currentStage];
  const days = daysActive(grow.spawnedAt);
  const existingYield = grow.flushes.reduce((sum, f) => sum + f.wetWeight, 0);
  const currentBE = calculateBE(existingYield, grow.substrateWeight);

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-zinc-900/50 border rounded-xl p-4 transition-all hover:border-zinc-600 ${
        isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-zinc-800'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-white">{grow.name}</p>
          <p className="text-sm text-zinc-500">{strain?.name || 'Unknown Strain'}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs ${config.color}`}>
          {config.icon} {config.label}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        <div className="text-center">
          <p className="text-xs text-zinc-500">Days</p>
          <p className="text-sm font-medium text-white">{days}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-zinc-500">Flushes</p>
          <p className="text-sm font-medium text-white">{grow.flushes.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-zinc-500">Yield</p>
          <p className="text-sm font-medium text-emerald-400">{existingYield}g</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-zinc-500">BE%</p>
          <p className="text-sm font-medium text-blue-400">{currentBE}%</p>
        </div>
      </div>
    </button>
  );
};

// Using global WeightInput component from common folder

const BEGauge: React.FC<{
  be: number;
  previousBE?: number;
}> = ({ be, previousBE }) => {
  // Color based on BE%
  const getColor = (val: number) => {
    if (val >= 100) return 'text-emerald-400';
    if (val >= 75) return 'text-blue-400';
    if (val >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getBgColor = (val: number) => {
    if (val >= 100) return 'bg-emerald-500';
    if (val >= 75) return 'bg-blue-500';
    if (val >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
      <p className="text-sm text-zinc-400 mb-2">Biological Efficiency</p>
      <div className="relative inline-block">
        <span className={`text-5xl font-bold ${getColor(be)}`}>{be}%</span>
        {previousBE !== undefined && previousBE > 0 && (
          <span className="absolute -top-2 -right-12 text-sm text-zinc-500">
            (was {previousBE}%)
          </span>
        )}
      </div>
      <div className="mt-4 h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBgColor(be)} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(be, 150)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-500 mt-1">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
        <span>150%+</span>
      </div>
      <p className="text-xs text-zinc-500 mt-3">
        {be >= 100 ? 'Excellent yield!' : be >= 75 ? 'Good yield' : be >= 50 ? 'Average yield' : 'Below average'}
      </p>
    </div>
  );
};

const RecentHarvests: React.FC<{
  flushes: Flush[];
  substrateWeight: number;
}> = ({ flushes, substrateWeight }) => {
  if (flushes.length === 0) return null;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Icons.History />
        Previous Flushes
      </h3>
      <div className="space-y-2">
        {flushes.slice().reverse().map(flush => {
          const flushBE = calculateBE(flush.wetWeight, substrateWeight);
          return (
            <div key={flush.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
              <div>
                <span className="font-medium text-white">Flush #{flush.flushNumber}</span>
                <span className="text-xs text-zinc-500 ml-2">
                  {new Date(flush.harvestDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-emerald-400 font-medium">{flush.wetWeight}g wet</span>
                {flush.dryWeight > 0 && (
                  <span className="text-amber-400">{flush.dryWeight}g dry</span>
                )}
                <span className="text-blue-400">{flushBE}% BE</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const HarvestWorkflow: React.FC = () => {
  const { state, getStrain, addFlush, advanceGrowStage } = useData();
  const grows = state.grows;

  // Harvestable grows (fruiting or harvesting stage)
  const harvestableGrows = useMemo(() => {
    return grows.filter(g =>
      g.status === 'active' &&
      ['fruiting', 'harvesting'].includes(g.currentStage)
    ).sort((a, b) => new Date(b.spawnedAt).getTime() - new Date(a.spawnedAt).getTime());
  }, [grows]);

  // State
  const [selectedGrowId, setSelectedGrowId] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'weigh' | 'confirm'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [wetWeight, setWetWeight] = useState(0);
  const [dryWeight, setDryWeight] = useState(0);
  const [mushroomCount, setMushroomCount] = useState<number | undefined>(undefined);
  const [quality, setQuality] = useState<Flush['quality']>('good');
  const [notes, setNotes] = useState('');
  const [harvestComplete, setHarvestComplete] = useState(false);
  const [advanceToHarvesting, setAdvanceToHarvesting] = useState(true);

  // Selected grow
  const selectedGrow = selectedGrowId ? grows.find(g => g.id === selectedGrowId) : null;

  // Filter grows by search
  const filteredGrows = useMemo(() => {
    if (!searchQuery) return harvestableGrows;
    const q = searchQuery.toLowerCase();
    return harvestableGrows.filter(g =>
      g.name.toLowerCase().includes(q) ||
      getStrain(g.strainId)?.name.toLowerCase().includes(q)
    );
  }, [harvestableGrows, searchQuery, getStrain]);

  // Calculate BE% for current harvest
  const currentBE = useMemo(() => {
    if (!selectedGrow) return 0;
    const existingYield = selectedGrow.flushes.reduce((sum, f) => sum + f.wetWeight, 0);
    return calculateBE(existingYield + wetWeight, selectedGrow.substrateWeight);
  }, [selectedGrow, wetWeight]);

  const previousBE = useMemo(() => {
    if (!selectedGrow) return 0;
    const existingYield = selectedGrow.flushes.reduce((sum, f) => sum + f.wetWeight, 0);
    return calculateBE(existingYield, selectedGrow.substrateWeight);
  }, [selectedGrow]);

  // Reset form
  const resetForm = () => {
    setSelectedGrowId(null);
    setStep('select');
    setWetWeight(0);
    setDryWeight(0);
    setMushroomCount(undefined);
    setQuality('good');
    setNotes('');
    setHarvestComplete(false);
    setSearchQuery('');
    setAdvanceToHarvesting(true);
  };

  // Handle grow selection
  const handleSelectGrow = (growId: string) => {
    setSelectedGrowId(growId);
    setStep('weigh');
  };

  // Handle recording harvest
  const handleRecordHarvest = async () => {
    if (!selectedGrow || wetWeight <= 0) return;

    // Add flush
    await addFlush(selectedGrow.id, {
      harvestDate: new Date(),
      wetWeight,
      dryWeight: dryWeight || Math.round(wetWeight * 0.1), // Default to 10% if not specified
      mushroomCount,
      quality,
      notes,
    });

    // Optionally advance to harvesting stage if still in fruiting
    if (advanceToHarvesting && selectedGrow.currentStage === 'fruiting') {
      await advanceGrowStage(selectedGrow.id);
    }

    setHarvestComplete(true);
    setStep('confirm');
  };

  // Start new harvest after completion
  const handleNewHarvest = () => {
    resetForm();
  };

  // Continue with same grow
  const handleContinueSameGrow = () => {
    setWetWeight(0);
    setDryWeight(0);
    setMushroomCount(undefined);
    setNotes('');
    setHarvestComplete(false);
    setStep('weigh');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icons.Scale />
            Harvest Workflow
          </h1>
          <p className="text-zinc-400 text-sm">Quick harvest recording with auto BE% calculation</p>
        </div>
        {step !== 'select' && (
          <button
            onClick={resetForm}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <Icons.X />
          </button>
        )}
      </div>

      {/* Step 1: Select Grow */}
      {step === 'select' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <Icons.Search />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search grows..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Harvestable grows */}
          {filteredGrows.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                <Icons.Mushroom />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Harvestable Grows</h3>
              <p className="text-zinc-400">
                {searchQuery
                  ? 'No grows match your search. Try a different term.'
                  : 'Move grows to the fruiting or harvesting stage to record harvests.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">{filteredGrows.length} grow{filteredGrows.length !== 1 ? 's' : ''} ready for harvest</p>
              {filteredGrows.map(grow => (
                <GrowSelectionCard
                  key={grow.id}
                  grow={grow}
                  strain={getStrain(grow.strainId)}
                  onSelect={() => handleSelectGrow(grow.id)}
                  isSelected={false}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Weigh & Record */}
      {step === 'weigh' && selectedGrow && (
        <div className="space-y-4">
          {/* Selected Grow Info */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{selectedGrow.name}</p>
                <p className="text-sm text-zinc-500">{getStrain(selectedGrow.strainId)?.name}</p>
              </div>
              <span className="text-sm text-zinc-400">
                Flush #{selectedGrow.flushes.length + 1}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div>
                <p className="text-xs text-zinc-500">Substrate</p>
                <p className="text-sm font-medium text-white">{selectedGrow.substrateWeight}g</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Existing Yield</p>
                <p className="text-sm font-medium text-emerald-400">
                  {selectedGrow.flushes.reduce((sum, f) => sum + f.wetWeight, 0)}g
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Current BE%</p>
                <p className="text-sm font-medium text-blue-400">{previousBE}%</p>
              </div>
            </div>
          </div>

          {/* Weight Input */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            <WeightInput
              label="Wet Weight *"
              value={wetWeight}
              onChange={val => setWetWeight(val ?? 0)}
              allowEmpty={false}
              showConversionHint={true}
            />
            <WeightInput
              label="Dry Weight (optional)"
              value={dryWeight}
              onChange={val => setDryWeight(val ?? 0)}
              placeholder={wetWeight > 0 ? `~${Math.round(wetWeight * 0.1)}` : '0'}
              showConversionHint={true}
            />
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Mushroom Count (optional)</label>
              <NumericInput
                value={mushroomCount}
                onChange={setMushroomCount}
                placeholder="Number of mushrooms"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* BE% Preview */}
          {wetWeight > 0 && (
            <BEGauge be={currentBE} previousBE={previousBE} />
          )}

          {/* Quality */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <p className="text-sm text-zinc-400 mb-3">Quality Rating</p>
            <div className="grid grid-cols-4 gap-2">
              {qualityOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setQuality(opt.value)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    quality === opt.value ? opt.color : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <label className="block text-sm text-zinc-400 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any observations about this harvest..."
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Advance Stage Option */}
          {selectedGrow.currentStage === 'fruiting' && (
            <label className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={advanceToHarvesting}
                onChange={e => setAdvanceToHarvesting(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <p className="text-white font-medium">Advance to Harvesting stage</p>
                <p className="text-sm text-zinc-500">Move grow from Fruiting to Harvesting</p>
              </div>
            </label>
          )}

          {/* Previous Flushes */}
          <RecentHarvests flushes={selectedGrow.flushes} substrateWeight={selectedGrow.substrateWeight} />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('select')}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleRecordHarvest}
              disabled={wetWeight <= 0}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Icons.Check />
              Record Harvest
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && harvestComplete && selectedGrow && (
        <div className="space-y-6">
          <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-2xl font-bold text-emerald-400 mb-2">Harvest Recorded!</h3>
            <p className="text-zinc-400 mb-4">
              Added <span className="text-emerald-400 font-semibold">{wetWeight}g</span> to {selectedGrow.name}
            </p>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mt-6">
              <div className="bg-zinc-900/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500">Flush #</p>
                <p className="text-xl font-bold text-white">{selectedGrow.flushes.length}</p>
              </div>
              <div className="bg-zinc-900/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500">New BE%</p>
                <p className="text-xl font-bold text-emerald-400">{currentBE}%</p>
              </div>
            </div>
          </div>

          {/* Next Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleContinueSameGrow}
              className="py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Icons.Plus />
              Add Another Flush
            </button>
            <button
              onClick={handleNewHarvest}
              className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Icons.Mushroom />
              New Harvest
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HarvestWorkflow;
