// ============================================================================
// SUBSTRATE WORKBENCH
// Comprehensive substrate planning, hydration calculation, and species matching
// Deep integration with species, recipes, inventory, and grows
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { WeightInput } from '../common/WeightInput';
import { useData } from '../../store';
import { formatWeight, getDefaultUnit, WeightUnit } from '../../utils/weight';
import { Icons } from '../icons/IconLibrary';

// ============================================================================
// TYPES
// ============================================================================

type WorkbenchTab = 'calculator' | 'species' | 'batch' | 'inventory';

type CalcMode =
  | 'dry_to_hydrated'    // Dry weight → hydrated weight & water needed
  | 'hydrated_to_dry'    // Target hydrated weight → dry substrate & water
  | 'check_moisture'     // Weighed wet vs dry → actual moisture %
  | 'spawn_to_sub';      // Calculate substrate from spawn weight

interface CalcResult {
  dryWeight: number;       // grams
  waterWeight: number;     // grams
  totalWeight: number;     // grams
  moisturePercent: number;
  spawnWeight?: number;    // grams (for spawn_to_sub mode)
}

interface SubstratePreset {
  id: string;
  name: string;
  code: string;
  category: 'bulk' | 'grain' | 'agar' | 'liquid';
  moisture: number;        // target moisture %
  fieldCapacity?: number;  // max moisture before waterlogging
  spawnRateMin: number;
  spawnRateOptimal: number;
  spawnRateMax: number;
  notes: string;
  speciesMatch: string[];  // species IDs that prefer this
}

interface BatchContainer {
  id: string;
  name: string;
  count: number;
  volumeMl?: number;
  weightGrams?: number;
}

// ============================================================================
// SUBSTRATE KNOWLEDGE BASE
// ============================================================================

// Default moisture targets by substrate (if not in database)
const defaultMoistureLevels: Record<string, number> = {
  cvg: 65,
  coir: 68,
  manure: 65,
  straw: 70,
  hwsd: 60,
  masters: 60,
  hwfp: 65,
  supp_sd: 60,
  straw_coffee: 65,
  chips: 55,
};

// Species to substrate recommendations (scientific names for matching)
const speciesSubstrateMatch: Record<string, string[]> = {
  // Oyster varieties - very versatile
  'Pleurotus ostreatus': ['straw', 'masters', 'hwsd', 'hwfp', 'cvg', 'straw_coffee'],
  'Pleurotus columbinus': ['straw', 'masters', 'hwsd', 'hwfp', 'cvg'],
  'Pleurotus djamor': ['straw', 'masters', 'hwsd', 'cvg'],
  'Pleurotus citrinopileatus': ['straw', 'masters', 'hwsd', 'cvg'],
  'Pleurotus eryngii': ['masters', 'supp_sd', 'hwsd'],
  // Lions Mane
  'Hericium erinaceus': ['masters', 'supp_sd', 'hwsd'],
  'Hericium americanum': ['masters', 'supp_sd', 'hwsd'],
  // Shiitake
  'Lentinula edodes': ['hwsd', 'supp_sd', 'masters'],
  // Reishi
  'Ganoderma lucidum': ['hwsd', 'supp_sd', 'masters'],
  // Maitake
  'Grifola frondosa': ['hwsd', 'supp_sd'],
  // Wine Cap
  'Stropharia rugosoannulata': ['chips', 'straw', 'straw_coffee'],
  // Chestnut
  'Pholiota adiposa': ['supp_sd', 'masters'],
  // Pioppino
  'Cyclocybe aegerita': ['supp_sd', 'masters', 'straw'],
  // Enoki
  'Flammulina velutipes': ['supp_sd', 'hwsd'],
  // Cordyceps
  'Cordyceps militaris': [], // Uses specialized rice media, not typical bulk substrate
};

// Substrate difficulty/notes for beginners
const substrateGuidance: Record<string, { difficulty: 'easy' | 'moderate' | 'advanced'; tip: string }> = {
  cvg: { difficulty: 'easy', tip: 'Great for beginners. Pasteurize only - no need to sterilize.' },
  coir: { difficulty: 'easy', tip: 'Simple and forgiving. Just hydrate with boiling water.' },
  straw: { difficulty: 'easy', tip: 'Chop or shred before use. Cold water lime bath works great.' },
  hwfp: { difficulty: 'easy', tip: 'Hydrated pellets are very consistent. Easy prep.' },
  masters: { difficulty: 'moderate', tip: '50/50 sawdust and soy hulls. Must sterilize.' },
  hwsd: { difficulty: 'moderate', tip: 'Needs supplementation for most species. Sterilize.' },
  supp_sd: { difficulty: 'moderate', tip: 'Higher nutrition means higher contam risk. Careful sterile technique.' },
  manure: { difficulty: 'advanced', tip: 'High nutrition but high contam risk. Proper composting essential.' },
  chips: { difficulty: 'easy', tip: 'Best for outdoor beds. Wine caps love fresh chips.' },
  straw_coffee: { difficulty: 'easy', tip: 'Budget-friendly with spent coffee. Use within 24hrs of brewing.' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getMoistureStatus = (percent: number, fieldCapacity?: number): {
  status: 'dry' | 'low' | 'optimal' | 'high' | 'wet';
  label: string;
  color: string;
  bgColor: string;
} => {
  const fc = fieldCapacity || 75;

  if (percent < 45) return {
    status: 'dry',
    label: 'Too Dry',
    color: 'text-red-400',
    bgColor: 'bg-red-950/30'
  };
  if (percent < 55) return {
    status: 'low',
    label: 'Low',
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/30'
  };
  if (percent <= 68) return {
    status: 'optimal',
    label: 'Optimal',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/30'
  };
  if (percent <= fc) return {
    status: 'high',
    label: 'High (Near Field Capacity)',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/30'
  };
  return {
    status: 'wet',
    label: 'Too Wet (Over Field Capacity)',
    color: 'text-red-400',
    bgColor: 'bg-red-950/30'
  };
};

const getSpawnRateStatus = (rate: number, min: number, optimal: number, max: number): {
  status: 'low' | 'optimal' | 'high' | 'extreme';
  label: string;
  color: string;
} => {
  if (rate < min) return { status: 'low', label: 'Below Recommended', color: 'text-amber-400' };
  if (rate <= optimal + 5) return { status: 'optimal', label: 'Optimal Range', color: 'text-emerald-400' };
  if (rate <= max) return { status: 'high', label: 'High (Faster Colonization)', color: 'text-blue-400' };
  return { status: 'extreme', label: 'Very High (Expensive)', color: 'text-orange-400' };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SubstrateCalculator: React.FC = () => {
  const { state, activeSpecies, activeSubstrateTypes, activeRecipes, activeInventoryItems } = useData();
  const displayUnit: WeightUnit = getDefaultUnit(state.settings.defaultUnits || 'metric');

  // Tab state
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('calculator');

  // Calculator state
  const [calcMode, setCalcMode] = useState<CalcMode>('dry_to_hydrated');
  const [selectedSubstrateId, setSelectedSubstrateId] = useState<string>('');
  const [customMoisture, setCustomMoisture] = useState<string>('');
  const [input1Grams, setInput1Grams] = useState<number | undefined>(undefined);
  const [input2Grams, setInput2Grams] = useState<number | undefined>(undefined);
  const [spawnRatePercent, setSpawnRatePercent] = useState<string>('15');

  // Species filter state
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('');

  // Batch planner state
  const [batchContainers, setBatchContainers] = useState<BatchContainer[]>([
    { id: '1', name: 'Monotub', count: 1, weightGrams: 2500 }
  ]);

  // Build substrate presets from database + defaults
  const substratePresets = useMemo((): SubstratePreset[] => {
    const bulkSubstrates = activeSubstrateTypes.filter(s => s.category === 'bulk');

    return bulkSubstrates.map(sub => ({
      id: sub.id,
      name: sub.name,
      code: sub.code,
      category: sub.category,
      moisture: sub.fieldCapacity ? sub.fieldCapacity - 5 : (defaultMoistureLevels[sub.code] || 65),
      fieldCapacity: sub.fieldCapacity || undefined,
      spawnRateMin: sub.spawnRateRange?.min || 10,
      spawnRateOptimal: sub.spawnRateRange?.optimal || 20,
      spawnRateMax: sub.spawnRateRange?.max || 30,
      notes: sub.notes || '',
      speciesMatch: Object.entries(speciesSubstrateMatch)
        .filter(([, codes]) => codes.includes(sub.code))
        .map(([species]) => species),
    }));
  }, [activeSubstrateTypes]);

  // Selected substrate details
  const selectedSubstrate = useMemo(() => {
    return substratePresets.find(s => s.id === selectedSubstrateId);
  }, [substratePresets, selectedSubstrateId]);

  // Target moisture (from selected preset or custom)
  const targetMoisture = useMemo(() => {
    if (customMoisture && !isNaN(parseFloat(customMoisture))) {
      return parseFloat(customMoisture);
    }
    return selectedSubstrate?.moisture || 65;
  }, [customMoisture, selectedSubstrate]);

  // Calculate results based on mode
  const calcResult = useMemo((): CalcResult | null => {
    const val1 = input1Grams;
    const val2 = input2Grams;
    const spawnRate = parseFloat(spawnRatePercent) || 15;

    switch (calcMode) {
      case 'dry_to_hydrated': {
        // Given dry weight and target moisture, calculate water needed
        if (!val1 || val1 <= 0 || targetMoisture >= 100) return null;
        const waterNeeded = val1 * (targetMoisture / (100 - targetMoisture));
        return {
          dryWeight: Math.round(val1 * 10) / 10,
          waterWeight: Math.round(waterNeeded * 10) / 10,
          totalWeight: Math.round((val1 + waterNeeded) * 10) / 10,
          moisturePercent: targetMoisture,
        };
      }

      case 'hydrated_to_dry': {
        // Given target hydrated weight and moisture, calculate dry substrate needed
        if (!val1 || val1 <= 0 || targetMoisture >= 100) return null;
        const waterFromTotal = val1 * (targetMoisture / 100);
        const dryNeeded = val1 - waterFromTotal;
        return {
          dryWeight: Math.round(dryNeeded * 10) / 10,
          waterWeight: Math.round(waterFromTotal * 10) / 10,
          totalWeight: Math.round(val1 * 10) / 10,
          moisturePercent: targetMoisture,
        };
      }

      case 'check_moisture': {
        // Given wet weight and dry weight, calculate actual moisture
        if (!val1 || !val2 || val1 <= 0 || val2 <= 0 || val2 > val1) return null;
        const waterContent = val1 - val2;
        const actualMoisture = (waterContent / val1) * 100;
        return {
          dryWeight: Math.round(val2 * 10) / 10,
          waterWeight: Math.round(waterContent * 10) / 10,
          totalWeight: Math.round(val1 * 10) / 10,
          moisturePercent: Math.round(actualMoisture * 10) / 10,
        };
      }

      case 'spawn_to_sub': {
        // Given spawn weight and spawn rate, calculate substrate needed
        if (!val1 || val1 <= 0 || spawnRate <= 0) return null;
        const substrateWeight = val1 * (100 / spawnRate);
        const totalHydrated = substrateWeight + val1;
        // Calculate water for the substrate portion at target moisture
        const drySubstrate = substrateWeight / (1 + targetMoisture / (100 - targetMoisture)) * (targetMoisture / (100 - targetMoisture)) > 0
          ? substrateWeight * ((100 - targetMoisture) / 100)
          : substrateWeight;
        const waterForSubstrate = substrateWeight - drySubstrate;
        return {
          dryWeight: Math.round(drySubstrate * 10) / 10,
          waterWeight: Math.round(waterForSubstrate * 10) / 10,
          totalWeight: Math.round(totalHydrated * 10) / 10,
          moisturePercent: targetMoisture,
          spawnWeight: Math.round(val1 * 10) / 10,
        };
      }
    }
    return null;
  }, [calcMode, input1Grams, input2Grams, targetMoisture, spawnRatePercent]);

  // Species recommendations
  const speciesRecommendations = useMemo(() => {
    if (!selectedSpeciesId) return substratePresets;

    const species = activeSpecies.find(s => s.id === selectedSpeciesId);
    if (!species) return substratePresets;

    const matchingCodes = speciesSubstrateMatch[species.scientificName || ''] || [];
    if (matchingCodes.length === 0) {
      // If no specific match, show all bulk substrates
      return substratePresets;
    }

    // Sort: matching substrates first, then others
    return [...substratePresets].sort((a, b) => {
      const aMatch = matchingCodes.includes(a.code);
      const bMatch = matchingCodes.includes(b.code);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }, [selectedSpeciesId, activeSpecies, substratePresets]);

  // Batch calculation
  const batchTotals = useMemo(() => {
    if (!selectedSubstrate) return null;

    const totalWeight = batchContainers.reduce((sum, c) => {
      return sum + (c.weightGrams || 0) * c.count;
    }, 0);

    if (totalWeight <= 0) return null;

    // Calculate dry substrate and water for the batch
    const waterNeeded = totalWeight * (targetMoisture / 100);
    const dryNeeded = totalWeight - waterNeeded;
    const spawnRate = parseFloat(spawnRatePercent) || 15;
    const spawnNeeded = totalWeight * (spawnRate / 100);

    return {
      totalWeight,
      drySubstrate: Math.round(dryNeeded),
      water: Math.round(waterNeeded),
      spawn: Math.round(spawnNeeded),
      containerCount: batchContainers.reduce((sum, c) => sum + c.count, 0),
    };
  }, [batchContainers, selectedSubstrate, targetMoisture, spawnRatePercent]);

  // Related recipes for selected substrate
  const relatedRecipes = useMemo(() => {
    if (!selectedSubstrate) return [];
    return activeRecipes.filter(r =>
      r.category === 'bulk_substrate' &&
      r.name.toLowerCase().includes(selectedSubstrate.code.toLowerCase())
    );
  }, [selectedSubstrate, activeRecipes]);

  // Inventory materials that might be substrate ingredients
  const substrateInventory = useMemo(() => {
    const substrateKeywords = ['coir', 'verm', 'gypsum', 'straw', 'sawdust', 'pellet', 'hull', 'bran', 'manure', 'lime'];
    return activeInventoryItems.filter(item =>
      substrateKeywords.some(kw => item.name.toLowerCase().includes(kw))
    );
  }, [activeInventoryItems]);

  // Reset calculator inputs
  const resetCalculator = useCallback(() => {
    setInput1Grams(undefined);
    setInput2Grams(undefined);
    setCustomMoisture('');
  }, []);

  // Handle mode change
  const handleModeChange = (mode: CalcMode) => {
    setCalcMode(mode);
    resetCalculator();
  };

  // Handle substrate selection
  const handleSubstrateSelect = (id: string) => {
    setSelectedSubstrateId(id);
    setCustomMoisture('');
  };

  // Add batch container
  const addBatchContainer = () => {
    const newId = Date.now().toString();
    setBatchContainers(prev => [...prev, { id: newId, name: 'Container', count: 1, weightGrams: 2500 }]);
  };

  // Update batch container
  const updateBatchContainer = (id: string, updates: Partial<BatchContainer>) => {
    setBatchContainers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  // Remove batch container
  const removeBatchContainer = (id: string) => {
    setBatchContainers(prev => prev.filter(c => c.id !== id));
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderMoistureBar = (percent: number, fieldCapacity?: number) => {
    const status = getMoistureStatus(percent, fieldCapacity);
    const fc = fieldCapacity || 75;

    return (
      <div className="space-y-2">
        {/* Labels */}
        <div className="flex justify-between text-xs text-zinc-500">
          <span>0%</span>
          <span className="text-zinc-400">Optimal (55-68%)</span>
          <span>FC: {fc}%</span>
          <span>100%</span>
        </div>

        {/* Bar */}
        <div className="relative h-6 bg-zinc-800 rounded-lg overflow-hidden">
          {/* Dry zone */}
          <div className="absolute h-full bg-red-900/30" style={{ left: 0, width: '45%' }} />
          {/* Low zone */}
          <div className="absolute h-full bg-amber-900/30" style={{ left: '45%', width: '10%' }} />
          {/* Optimal zone */}
          <div className="absolute h-full bg-emerald-900/40" style={{ left: '55%', width: '13%' }} />
          {/* High zone */}
          <div className="absolute h-full bg-blue-900/30" style={{ left: '68%', width: `${fc - 68}%` }} />
          {/* Over field capacity */}
          <div className="absolute h-full bg-red-900/30" style={{ left: `${fc}%`, width: `${100 - fc}%` }} />

          {/* Current value marker */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white/50 transition-all duration-300"
            style={{ left: `${Math.min(Math.max(percent, 0), 100)}%`, transform: 'translateX(-50%)' }}
          />

          {/* Value label */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 px-2 py-0.5 rounded bg-zinc-900/80 text-sm font-bold transition-all duration-300"
            style={{
              left: `${Math.min(Math.max(percent, 5), 95)}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className={status.color}>{percent.toFixed(1)}%</span>
          </div>
        </div>

        {/* Status label */}
        <div className={`text-center text-sm font-medium ${status.color}`}>
          {status.label}
        </div>
      </div>
    );
  };

  const renderSubstrateCard = (substrate: SubstratePreset, isRecommended: boolean = false) => {
    const guidance = substrateGuidance[substrate.code];
    const isSelected = selectedSubstrateId === substrate.id;

    return (
      <button
        key={substrate.id}
        onClick={() => handleSubstrateSelect(substrate.id)}
        className={`p-4 rounded-xl border text-left transition-all ${
          isSelected
            ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                {substrate.name}
              </span>
              {isRecommended && (
                <span className="px-1.5 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded">
                  Recommended
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
              <span className="text-emerald-400 font-medium">{substrate.moisture}% moisture</span>
              {substrate.fieldCapacity && (
                <span>FC: {substrate.fieldCapacity}%</span>
              )}
            </div>
          </div>
          {guidance && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              guidance.difficulty === 'easy' ? 'bg-green-900/50 text-green-400' :
              guidance.difficulty === 'moderate' ? 'bg-yellow-900/50 text-yellow-400' :
              'bg-red-900/50 text-red-400'
            }`}>
              {guidance.difficulty}
            </span>
          )}
        </div>

        {guidance && (
          <p className="mt-2 text-xs text-zinc-500">{guidance.tip}</p>
        )}

        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
          <span>Spawn rate:</span>
          <span className="text-zinc-400">{substrate.spawnRateMin}-{substrate.spawnRateMax}%</span>
          <span className="text-emerald-400">(optimal: {substrate.spawnRateOptimal}%)</span>
        </div>
      </button>
    );
  };

  // ============================================================================
  // TAB CONTENT
  // ============================================================================

  const renderCalculatorTab = () => (
    <div className="space-y-6">
      {/* Substrate Selection */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Select Substrate Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {substratePresets.slice(0, 8).map(substrate => (
            <button
              key={substrate.id}
              onClick={() => handleSubstrateSelect(substrate.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedSubstrateId === substrate.id
                  ? 'bg-emerald-500/10 border-emerald-500/50'
                  : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <p className={`text-sm font-medium ${selectedSubstrateId === substrate.id ? 'text-white' : 'text-zinc-300'}`}>
                {substrate.name.length > 20 ? substrate.name.substring(0, 20) + '...' : substrate.name}
              </p>
              <p className="text-lg font-bold text-emerald-400">{substrate.moisture}%</p>
            </button>
          ))}
        </div>

        {/* Custom moisture override */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-1">Or enter custom moisture target</label>
            <div className="flex items-stretch">
              <input
                type="number"
                value={customMoisture}
                onChange={(e) => setCustomMoisture(e.target.value)}
                placeholder={selectedSubstrate ? selectedSubstrate.moisture.toString() : "65"}
                min={0}
                max={100}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-l-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="bg-zinc-700 border border-l-0 border-zinc-600 rounded-r-lg px-3 py-2 text-zinc-300 font-medium">
                %
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Modes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { mode: 'dry_to_hydrated' as CalcMode, title: 'Dry → Hydrated', desc: 'How much water to add' },
          { mode: 'hydrated_to_dry' as CalcMode, title: 'Hydrated → Dry', desc: 'Dry substrate needed' },
          { mode: 'check_moisture' as CalcMode, title: 'Check Moisture', desc: 'Measure actual moisture' },
          { mode: 'spawn_to_sub' as CalcMode, title: 'Spawn → Substrate', desc: 'Calculate from spawn' },
        ].map(({ mode, title, desc }) => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={`p-4 rounded-xl border text-left transition-all ${
              calcMode === mode
                ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className={`text-sm font-semibold ${calcMode === mode ? 'text-white' : 'text-zinc-300'}`}>
              {title}
            </div>
            <div className="text-xs text-zinc-500 mt-1">{desc}</div>
          </button>
        ))}
      </div>

      {/* Calculator Inputs */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/30">
          <h3 className="font-medium text-white">
            {calcMode === 'dry_to_hydrated' && 'Calculate Water Needed'}
            {calcMode === 'hydrated_to_dry' && 'Calculate Dry Substrate Needed'}
            {calcMode === 'check_moisture' && 'Check Actual Moisture Content'}
            {calcMode === 'spawn_to_sub' && 'Calculate Substrate from Spawn Weight'}
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            {calcMode === 'dry_to_hydrated' && 'Enter your dry substrate weight to calculate how much water to add.'}
            {calcMode === 'hydrated_to_dry' && 'Enter your target hydrated weight to calculate dry substrate needed.'}
            {calcMode === 'check_moisture' && 'Weigh substrate wet, then dry it and weigh again to check moisture.'}
            {calcMode === 'spawn_to_sub' && 'Enter your spawn weight and desired spawn rate to calculate substrate amount.'}
          </p>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Inputs</h4>

              {calcMode === 'dry_to_hydrated' && (
                <WeightInput
                  label="Dry Substrate Weight"
                  value={input1Grams}
                  onChange={setInput1Grams}
                  allowEmpty
                  showConversionHint
                />
              )}

              {calcMode === 'hydrated_to_dry' && (
                <WeightInput
                  label="Target Hydrated Weight"
                  value={input1Grams}
                  onChange={setInput1Grams}
                  allowEmpty
                  showConversionHint
                />
              )}

              {calcMode === 'check_moisture' && (
                <>
                  <WeightInput
                    label="Wet Weight (before drying)"
                    value={input1Grams}
                    onChange={setInput1Grams}
                    allowEmpty
                    showConversionHint
                  />
                  <WeightInput
                    label="Dry Weight (after drying)"
                    value={input2Grams}
                    onChange={setInput2Grams}
                    allowEmpty
                    showConversionHint
                  />
                </>
              )}

              {calcMode === 'spawn_to_sub' && (
                <>
                  <WeightInput
                    label="Spawn Weight"
                    value={input1Grams}
                    onChange={setInput1Grams}
                    allowEmpty
                    showConversionHint
                  />
                  <div className="space-y-2">
                    <label className="block text-sm text-zinc-400">Spawn Rate %</label>
                    <div className="flex items-stretch">
                      <input
                        type="number"
                        value={spawnRatePercent}
                        onChange={(e) => setSpawnRatePercent(e.target.value)}
                        placeholder="15"
                        min={1}
                        max={100}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-l-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                      <div className="bg-zinc-700 border border-l-0 border-zinc-600 rounded-r-lg px-3 py-2 text-zinc-300 font-medium">
                        %
                      </div>
                    </div>
                    {selectedSubstrate && (
                      <p className="text-xs text-zinc-500">
                        Recommended: {selectedSubstrate.spawnRateMin}-{selectedSubstrate.spawnRateMax}%
                        (optimal: {selectedSubstrate.spawnRateOptimal}%)
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="pt-2">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Icons.Calculator className="w-3 h-3" />
                  <span>Target moisture: <span className="text-emerald-400 font-medium">{targetMoisture}%</span></span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Results</h4>

              {calcResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {calcMode !== 'check_moisture' && (
                      <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
                        <p className="text-xs text-blue-400 mb-1">Water Needed</p>
                        <p className="text-xl font-bold text-white">{formatWeight(calcResult.waterWeight, displayUnit)}</p>
                      </div>
                    )}

                    {(calcMode === 'hydrated_to_dry' || calcMode === 'check_moisture') && (
                      <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-4">
                        <p className="text-xs text-amber-400 mb-1">Dry Substrate</p>
                        <p className="text-xl font-bold text-white">{formatWeight(calcResult.dryWeight, displayUnit)}</p>
                      </div>
                    )}

                    {calcMode !== 'hydrated_to_dry' && (
                      <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-4">
                        <p className="text-xs text-emerald-400 mb-1">Total Hydrated</p>
                        <p className="text-xl font-bold text-white">{formatWeight(calcResult.totalWeight, displayUnit)}</p>
                      </div>
                    )}

                    {calcMode === 'spawn_to_sub' && calcResult.spawnWeight && (
                      <div className="bg-purple-950/30 border border-purple-800/50 rounded-lg p-4">
                        <p className="text-xs text-purple-400 mb-1">Spawn Weight</p>
                        <p className="text-xl font-bold text-white">{formatWeight(calcResult.spawnWeight, displayUnit)}</p>
                      </div>
                    )}
                  </div>

                  {/* Moisture Bar */}
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    {renderMoistureBar(calcResult.moisturePercent, selectedSubstrate?.fieldCapacity)}
                  </div>

                  {/* Spawn Rate Status */}
                  {calcMode === 'spawn_to_sub' && selectedSubstrate && (
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-xs text-zinc-500 mb-2">Spawn Rate Analysis</p>
                      {(() => {
                        const rate = parseFloat(spawnRatePercent) || 0;
                        const status = getSpawnRateStatus(
                          rate,
                          selectedSubstrate.spawnRateMin,
                          selectedSubstrate.spawnRateOptimal,
                          selectedSubstrate.spawnRateMax
                        );
                        return (
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-white">{rate}%</span>
                            <span className={`text-sm ${status.color}`}>{status.label}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center bg-zinc-800/30 rounded-lg border border-zinc-800 border-dashed">
                  <p className="text-zinc-500 text-sm">Enter values to see results</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Quick Reference</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-emerald-400 font-medium mb-1">Field Capacity Test</p>
            <p className="text-zinc-400">Squeeze substrate firmly. A few drops = perfect. Stream = too wet. Nothing = too dry.</p>
          </div>
          <div>
            <p className="text-blue-400 font-medium mb-1">Spawn-to-Sub Ratio</p>
            <p className="text-zinc-400">Standard is 10-20% spawn. Higher = faster colonization but more expensive.</p>
          </div>
          <div>
            <p className="text-purple-400 font-medium mb-1">Pasteurization</p>
            <p className="text-zinc-400">CVG, straw, and coir only need pasteurization (160-180°F). Supplemented substrates need sterilization.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSpeciesTab = () => (
    <div className="space-y-6">
      {/* Species Selector */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Filter by Species</h3>
        <select
          value={selectedSpeciesId}
          onChange={(e) => setSelectedSpeciesId(e.target.value)}
          className="w-full max-w-md bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Species</option>
          {activeSpecies.map(species => (
            <option key={species.id} value={species.id}>
              {species.name} ({species.scientificName})
            </option>
          ))}
        </select>

        {selectedSpeciesId && (() => {
          const species = activeSpecies.find(s => s.id === selectedSpeciesId);
          if (!species) return null;
          const matchingCodes = speciesSubstrateMatch[species.scientificName || ''] || [];
          return (
            <div className="mt-4 p-4 bg-zinc-800/50 rounded-lg">
              <h4 className="font-medium text-white">{species.name}</h4>
              <p className="text-sm text-zinc-400 italic">{species.scientificName}</p>
              {matchingCodes.length > 0 ? (
                <p className="text-sm text-emerald-400 mt-2">
                  Prefers: {matchingCodes.map(c => {
                    const sub = substratePresets.find(s => s.code === c);
                    return sub?.name || c;
                  }).join(', ')}
                </p>
              ) : (
                <p className="text-sm text-zinc-500 mt-2">
                  No specific substrate preferences recorded. Most bulk substrates should work.
                </p>
              )}
            </div>
          );
        })()}
      </div>

      {/* Substrate Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {speciesRecommendations.map(substrate => {
          const species = selectedSpeciesId ? activeSpecies.find(s => s.id === selectedSpeciesId) : null;
          const matchingCodes = species ? speciesSubstrateMatch[species.scientificName || ''] || [] : [];
          const isRecommended = matchingCodes.includes(substrate.code);
          return renderSubstrateCard(substrate, isRecommended);
        })}
      </div>

      {/* Species-Substrate Matrix */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Quick Compatibility Reference</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="pb-2 pr-4">Species</th>
                <th className="pb-2 px-2 text-center">Straw</th>
                <th className="pb-2 px-2 text-center">Masters</th>
                <th className="pb-2 px-2 text-center">Sawdust</th>
                <th className="pb-2 px-2 text-center">CVG</th>
                <th className="pb-2 px-2 text-center">HWFP</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {[
                { name: 'Oyster (Pearl)', codes: speciesSubstrateMatch['Pleurotus ostreatus'] },
                { name: 'Blue Oyster', codes: speciesSubstrateMatch['Pleurotus columbinus'] },
                { name: 'King Oyster', codes: speciesSubstrateMatch['Pleurotus eryngii'] },
                { name: 'Lions Mane', codes: speciesSubstrateMatch['Hericium erinaceus'] },
                { name: 'Shiitake', codes: speciesSubstrateMatch['Lentinula edodes'] },
                { name: 'Reishi', codes: speciesSubstrateMatch['Ganoderma lucidum'] },
              ].map(row => (
                <tr key={row.name} className="border-t border-zinc-800">
                  <td className="py-2 pr-4 font-medium">{row.name}</td>
                  {['straw', 'masters', 'hwsd', 'cvg', 'hwfp'].map(code => (
                    <td key={code} className="py-2 px-2 text-center">
                      {row.codes?.includes(code) ? (
                        <span className="text-emerald-400">✓</span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBatchTab = () => (
    <div className="space-y-6">
      {/* Substrate Selection for Batch */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Select Substrate for Batch</h3>
        <select
          value={selectedSubstrateId}
          onChange={(e) => handleSubstrateSelect(e.target.value)}
          className="w-full max-w-md bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">Choose substrate type...</option>
          {substratePresets.map(substrate => (
            <option key={substrate.id} value={substrate.id}>
              {substrate.name} ({substrate.moisture}% moisture)
            </option>
          ))}
        </select>
      </div>

      {/* Container List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-400">Containers to Fill</h3>
          <button
            onClick={addBatchContainer}
            className="px-3 py-1 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
          >
            + Add Container
          </button>
        </div>

        <div className="space-y-3">
          {batchContainers.map(container => (
            <div key={container.id} className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg">
              <input
                type="text"
                value={container.name}
                onChange={(e) => updateBatchContainer(container.id, { name: e.target.value })}
                placeholder="Container name"
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">×</span>
                <input
                  type="number"
                  value={container.count}
                  onChange={(e) => updateBatchContainer(container.id, { count: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-white text-center focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={container.weightGrams}
                  onChange={(e) => updateBatchContainer(container.id, { weightGrams: parseFloat(e.target.value) || 0 })}
                  placeholder="Weight"
                  className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-white text-right focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-zinc-500">g each</span>
              </div>
              <button
                onClick={() => removeBatchContainer(container.id)}
                className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Spawn Rate */}
        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm text-zinc-400">Spawn Rate:</label>
          <div className="flex items-stretch">
            <input
              type="number"
              value={spawnRatePercent}
              onChange={(e) => setSpawnRatePercent(e.target.value)}
              min={1}
              max={100}
              className="w-20 bg-zinc-800 border border-zinc-700 rounded-l-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
            <div className="bg-zinc-700 border border-l-0 border-zinc-600 rounded-r-lg px-3 py-2 text-zinc-300">
              %
            </div>
          </div>
        </div>
      </div>

      {/* Batch Totals */}
      {batchTotals && selectedSubstrate ? (
        <div className="bg-emerald-950/20 border border-emerald-800/50 rounded-xl p-5">
          <h3 className="font-medium text-emerald-400 mb-4">Batch Summary for {selectedSubstrate.name}</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">Containers</p>
              <p className="text-2xl font-bold text-white">{batchTotals.containerCount}</p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">Total Substrate</p>
              <p className="text-2xl font-bold text-white">{formatWeight(batchTotals.totalWeight, displayUnit)}</p>
            </div>
            <div className="bg-blue-950/30 rounded-lg p-4">
              <p className="text-xs text-blue-400 mb-1">Water Needed</p>
              <p className="text-2xl font-bold text-white">{formatWeight(batchTotals.water, displayUnit)}</p>
            </div>
            <div className="bg-purple-950/30 rounded-lg p-4">
              <p className="text-xs text-purple-400 mb-1">Spawn Needed</p>
              <p className="text-2xl font-bold text-white">{formatWeight(batchTotals.spawn, displayUnit)}</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg">
            <p className="text-xs text-zinc-500 mb-2">Dry substrate to prepare</p>
            <p className="text-xl font-bold text-white">{formatWeight(batchTotals.drySubstrate, displayUnit)}</p>
            <p className="text-sm text-zinc-400 mt-1">at {targetMoisture}% target moisture</p>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500">Select a substrate type and add containers to see batch totals</p>
        </div>
      )}
    </div>
  );

  const renderInventoryTab = () => (
    <div className="space-y-6">
      {/* Substrate Materials in Inventory */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Substrate Materials in Inventory</h3>

        {substrateInventory.length > 0 ? (
          <div className="space-y-3">
            {substrateInventory.map(item => {
              const lowStock = item.quantity <= item.reorderPoint;
              return (
                <div key={item.id} className={`flex items-center justify-between p-4 rounded-lg ${
                  lowStock ? 'bg-amber-950/20 border border-amber-800/50' : 'bg-zinc-800/50'
                }`}>
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-sm text-zinc-500">{item.notes}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${lowStock ? 'text-amber-400' : 'text-white'}`}>
                      {item.quantity} {item.unit}
                    </p>
                    {lowStock && (
                      <p className="text-xs text-amber-400">Low stock</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-zinc-500">No substrate materials found in inventory</p>
            <p className="text-sm text-zinc-600 mt-1">Add items like coir, vermiculite, gypsum, straw, sawdust, etc.</p>
          </div>
        )}
      </div>

      {/* Related Recipes */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Substrate Recipes</h3>

        {activeRecipes.filter(r => r.category === 'bulk_substrate').length > 0 ? (
          <div className="grid md:grid-cols-2 gap-3">
            {activeRecipes
              .filter(r => r.category === 'bulk_substrate')
              .slice(0, 6)
              .map(recipe => (
                <div key={recipe.id} className="p-4 bg-zinc-800/50 rounded-lg">
                  <p className="font-medium text-white">{recipe.name}</p>
                  <p className="text-sm text-zinc-500 line-clamp-2">{recipe.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-emerald-400">
                      Yield: {recipe.yield.amount} {recipe.yield.unit}
                    </span>
                    {recipe.sterilizationTime && (
                      <span className="text-xs text-zinc-500">
                        • {recipe.sterilizationTime}min @ {recipe.sterilizationPsi}psi
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-zinc-500">No substrate recipes found</p>
            <p className="text-sm text-zinc-600 mt-1">Create substrate recipes in the Recipe Builder</p>
          </div>
        )}
      </div>

      {/* Substrate Prep Tips */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Preparation Tips</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div>
              <p className="text-emerald-400 font-medium">Coco Coir Prep</p>
              <p className="text-zinc-400">Break up brick, add boiling water, let cool to room temp before mixing.</p>
            </div>
            <div>
              <p className="text-blue-400 font-medium">Hardwood Pellets</p>
              <p className="text-zinc-400">Add equal weight of boiling water. Pellets will expand 4x. Mix until uniform.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-purple-400 font-medium">Straw Pasteurization</p>
              <p className="text-zinc-400">Chop to 2-3" lengths. Submerge at 160-180°F for 60-90 min. Drain well.</p>
            </div>
            <div>
              <p className="text-amber-400 font-medium">CVG Ratio</p>
              <p className="text-zinc-400">Standard: 650g coir, 2L vermiculite, 100g gypsum. Adjust moisture as needed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Substrate Workbench</h2>
          <p className="text-zinc-400 text-sm">Calculate hydration, plan batches, and match substrates to species</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        {[
          { id: 'calculator' as WorkbenchTab, label: 'Calculator', icon: Icons.Calculator },
          { id: 'species' as WorkbenchTab, label: 'Species Match', icon: Icons.Dna },
          { id: 'batch' as WorkbenchTab, label: 'Batch Planner', icon: Icons.Layers },
          { id: 'inventory' as WorkbenchTab, label: 'Inventory', icon: Icons.Package },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'calculator' && renderCalculatorTab()}
      {activeTab === 'species' && renderSpeciesTab()}
      {activeTab === 'batch' && renderBatchTab()}
      {activeTab === 'inventory' && renderInventoryTab()}
    </div>
  );
};

export default SubstrateCalculator;
