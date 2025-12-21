// ============================================================================
// CULTURE MULTIPLICATION CALCULATOR
// Calculate expansion costs, P-value progression, and senescence risk
// Based on commercial mycology standards (1:10 expansion ratio)
// ============================================================================

import React, { useState, useMemo } from 'react';
import { getExpectedShelfLifeDays, senescenceSigns, expansionRatios } from '../../utils/shelf-life';

// Types
interface ExpansionStep {
  generation: number;
  mediaType: MediaType;
  quantity: number;
  volumeOrWeight: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  shelfLifeDays: number;
  storageTemp: number;
  senescenceRisk: 'low' | 'moderate' | 'high' | 'critical';
}

interface CalculationScenario {
  name: string;
  steps: ExpansionStep[];
  finalCostPerUnit: number;
  totalInvestment: number;
  totalOutput: number;
}

type MediaType = 'liquid_culture' | 'agar' | 'grain_master' | 'grain_spawn' | 'substrate';
type CultureTier = 'P1' | 'P2' | 'P3';

// Constants based on commercial mycology standards
const MEDIA_CONFIGS: Record<MediaType, {
  label: string;
  defaultUnit: string;
  defaultVolume: number;
  expansionRatio: number;
  maxRatio: number;
  costPerUnit: number;
  description: string;
}> = {
  liquid_culture: {
    label: 'Liquid Culture',
    defaultUnit: 'ml',
    defaultVolume: 10,
    expansionRatio: 10,
    maxRatio: 20,
    costPerUnit: 0.50,
    description: 'Most stable storage, ages slower than agar/grain',
  },
  agar: {
    label: 'Agar Plate',
    defaultUnit: 'plates',
    defaultVolume: 1,
    expansionRatio: 6,
    maxRatio: 10,
    costPerUnit: 2.00,
    description: '4-8 wedges from one plate recommended',
  },
  grain_master: {
    label: 'Master Grain Spawn',
    defaultUnit: 'kg',
    defaultVolume: 1,
    expansionRatio: 10,
    maxRatio: 20,
    costPerUnit: 8.00,
    description: 'P2 or younger for further expansion',
  },
  grain_spawn: {
    label: 'Grain Spawn',
    defaultUnit: 'kg',
    defaultVolume: 1,
    expansionRatio: 10,
    maxRatio: 20,
    costPerUnit: 10.00,
    description: 'For substrate inoculation',
  },
  substrate: {
    label: 'Substrate Block',
    defaultUnit: 'kg',
    defaultVolume: 3,
    expansionRatio: 3.3,
    maxRatio: 5,
    costPerUnit: 5.00,
    description: 'Final fruiting stage',
  },
};

// Shelf life by P-value at proper cold storage
const SHELF_LIFE_BY_GENERATION: Record<number, { months: number; days: number; storageTempC: number }> = {
  0: { months: 6, days: 180, storageTempC: 2 },
  1: { months: 5, days: 150, storageTempC: 2 },
  2: { months: 3, days: 90, storageTempC: 2 },
  3: { months: 2, days: 60, storageTempC: 2 },
  4: { months: 1, days: 30, storageTempC: 2 }, // Fruit within 4 weeks
  5: { months: 0.5, days: 14, storageTempC: 2 }, // P5 is older, still viable
};

// Cold-sensitive species need 10°C storage
const COLD_SENSITIVE_SPECIES = [
  'Pink Oyster',
  'Pleurotus djamor',
  'Golden Oyster',
  'Pleurotus citrinopileatus',
  'Almond Mushroom',
  'Agaricus subrufescens',
  'Paddy Straw',
  'Volvariella volvacea',
  'Reishi',
  'Ganoderma lucidum',
  'Wood Ear',
  'Cloud Ear',
  'Auricularia',
];

// Pre-built scenarios based on commercial practices
const PRESET_SCENARIOS: Record<CultureTier, {
  price: number;
  description: string;
  shelfLife: string;
  workflow: string[];
}> = {
  P1: {
    price: 60,
    description: 'Professional grade - highest vigor, longest shelf life',
    shelfLife: '5 months at 2°C (10°C for cold-sensitive)',
    workflow: [
      'P1 LC (10ml) → 1kg P2 Master Grain',
      'P2 Master Grain → 10x 1kg P3 Grain Spawn ($6/bag)',
      'P3 Grain Spawn → 33x 3kg P4 Substrate Blocks ($1.80/bag)',
    ],
  },
  P2: {
    price: 25,
    description: 'Standard grade - good vigor, 3 month shelf life',
    shelfLife: '3 months at 2°C (10°C for cold-sensitive)',
    workflow: [
      'P2 LC (10ml) → 100ml P3 LC',
      'P3 LC → 10x 10ml P3 Syringes ($2.50/syringe)',
      'P3 Syringes → 10x 1kg P4 Grain Spawn',
      'P4 Grain Spawn → 33x 3kg P5 Substrate Blocks ($0.25/bag)',
    ],
  },
  P3: {
    price: 10,
    description: 'Economy grade - adequate vigor, 2 month shelf life',
    shelfLife: '2 months at 2°C (10°C for cold-sensitive)',
    workflow: [
      'P3 LC (10ml) → 1kg P4 Grain Spawn',
      'P4 Grain Spawn → 3x 3kg P5 Substrate Blocks',
    ],
  },
};

// Icons
const Icons = {
  Calculator: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="8" y2="10.01" />
      <line x1="12" y1="10" x2="12" y2="10.01" />
      <line x1="16" y1="10" x2="16" y2="10.01" />
      <line x1="8" y1="14" x2="8" y2="14.01" />
      <line x1="12" y1="14" x2="12" y2="14.01" />
      <line x1="16" y1="14" x2="16" y2="14.01" />
      <line x1="8" y1="18" x2="8" y2="18.01" />
      <line x1="12" y1="18" x2="16" y2="18" />
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  ArrowDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Thermometer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  ),
  DollarSign: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Flask: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M9 3h6v6l5 9H4l5-9V3z" />
      <line x1="9" y1="3" x2="15" y2="3" />
      <path d="M8 15h8" />
    </svg>
  ),
  Layers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
};

// Helper functions
const getSenescenceRisk = (generation: number): 'low' | 'moderate' | 'high' | 'critical' => {
  if (generation <= 2) return 'low';
  if (generation === 3) return 'moderate';
  if (generation === 4) return 'high';
  return 'critical';
};

const getSenescenceColor = (risk: string) => {
  switch (risk) {
    case 'low': return 'text-emerald-400 bg-emerald-950/50';
    case 'moderate': return 'text-amber-400 bg-amber-950/50';
    case 'high': return 'text-orange-400 bg-orange-950/50';
    case 'critical': return 'text-red-400 bg-red-950/50';
    default: return 'text-zinc-400 bg-zinc-800';
  }
};

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

export const CultureMultiplicationCalculator: React.FC = () => {
  // Mode selection
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');

  // Preset mode state
  const [selectedTier, setSelectedTier] = useState<CultureTier>('P1');
  const [isColdSensitive, setIsColdSensitive] = useState(false);

  // Custom mode state
  const [startingPValue, setStartingPValue] = useState<number>(1);
  const [startingMediaType, setStartingMediaType] = useState<MediaType>('liquid_culture');
  const [startingVolume, setStartingVolume] = useState<string>('10');
  const [startingCost, setStartingCost] = useState<string>('60');
  const [customRatio, setCustomRatio] = useState<string>('10');

  // Expansion chain for custom mode
  const [expansionSteps, setExpansionSteps] = useState<Array<{
    mediaType: MediaType;
    targetQuantity: number;
  }>>([
    { mediaType: 'grain_master', targetQuantity: 1 },
  ]);

  // Get current scenario info
  const currentScenario = PRESET_SCENARIOS[selectedTier];
  const storageTemp = isColdSensitive ? 10 : 2;
  const storageTempF = isColdSensitive ? 50 : 36;

  // Calculate custom expansion chain
  const customExpansionResult = useMemo(() => {
    const ratio = parseFloat(customRatio) || 10;
    const startVol = parseFloat(startingVolume) || 10;
    const startCost = parseFloat(startingCost) || 60;

    let currentPValue = startingPValue;
    let currentVolume = startVol;
    let totalInvestment = startCost;

    const steps: ExpansionStep[] = [];

    // Add starting culture
    steps.push({
      generation: currentPValue,
      mediaType: startingMediaType,
      quantity: 1,
      volumeOrWeight: startVol,
      unit: MEDIA_CONFIGS[startingMediaType].defaultUnit,
      costPerUnit: startCost,
      totalCost: startCost,
      shelfLifeDays: SHELF_LIFE_BY_GENERATION[currentPValue]?.days || 60,
      storageTemp,
      senescenceRisk: getSenescenceRisk(currentPValue),
    });

    // Process each expansion step
    expansionSteps.forEach((step) => {
      currentPValue += 1;
      const mediaConfig = MEDIA_CONFIGS[step.mediaType];
      const outputVolume = currentVolume * ratio;
      const mediaCost = step.targetQuantity * mediaConfig.costPerUnit;
      totalInvestment += mediaCost;

      steps.push({
        generation: currentPValue,
        mediaType: step.mediaType,
        quantity: step.targetQuantity,
        volumeOrWeight: step.mediaType === 'liquid_culture'
          ? outputVolume
          : step.targetQuantity * mediaConfig.defaultVolume,
        unit: mediaConfig.defaultUnit,
        costPerUnit: (totalInvestment / step.targetQuantity),
        totalCost: mediaCost,
        shelfLifeDays: SHELF_LIFE_BY_GENERATION[currentPValue]?.days || 14,
        storageTemp,
        senescenceRisk: getSenescenceRisk(currentPValue),
      });

      currentVolume = outputVolume;
    });

    return {
      steps,
      totalInvestment,
      finalPValue: currentPValue,
      finalCostPerUnit: steps.length > 0
        ? totalInvestment / (steps[steps.length - 1]?.quantity || 1)
        : startCost,
    };
  }, [startingPValue, startingMediaType, startingVolume, startingCost, customRatio, expansionSteps, storageTemp]);

  // Add expansion step
  const addExpansionStep = () => {
    setExpansionSteps(prev => [
      ...prev,
      { mediaType: 'grain_spawn', targetQuantity: 10 },
    ]);
  };

  // Remove expansion step
  const removeExpansionStep = (index: number) => {
    setExpansionSteps(prev => prev.filter((_, i) => i !== index));
  };

  // Update expansion step
  const updateExpansionStep = (index: number, field: string, value: MediaType | number) => {
    setExpansionSteps(prev => prev.map((step, i) =>
      i === index ? { ...step, [field]: value } : step
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icons.Flask />
            Culture Multiplication Calculator
          </h2>
          <p className="text-zinc-400 text-sm">Calculate expansion costs, P-value progression, and shelf life</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
          <button
            onClick={() => setMode('preset')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'preset'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Preset Scenarios
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'custom'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Custom Calculator
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <Icons.Info />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">What is P-value and why does it matter?</p>
            <p className="text-blue-200/80">
              P-value (Passage value) tracks how many times a culture has been expanded.
              P0 is from spores, P1 is the first expansion, etc. Each expansion increases
              senescence risk (genetic degradation). Commercial labs typically stop at P3-P4.
              Use this tool to plan your expansion chain and track costs.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          {mode === 'preset' ? (
            <>
              {/* Tier Selection */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <label className="block text-sm font-medium text-zinc-400 mb-3">Starting Culture Tier</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(PRESET_SCENARIOS) as CultureTier[]).map(tier => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        selectedTier === tier
                          ? 'bg-emerald-950/30 border-emerald-700 text-white'
                          : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <p className="font-bold text-lg">{tier}</p>
                      <p className="text-2xl font-bold text-emerald-400">{formatCurrency(PRESET_SCENARIOS[tier].price)}</p>
                      <p className="text-xs text-zinc-500 mt-1">{PRESET_SCENARIOS[tier].description.split(' - ')[0]}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cold Sensitive Toggle */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icons.Thermometer />
                    <div>
                      <p className="font-medium text-white">Cold-Sensitive Species</p>
                      <p className="text-xs text-zinc-500">Pink Oyster, Golden Oyster, Almond, Paddy Straw, Reishi, Wood Ear</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsColdSensitive(!isColdSensitive)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      isColdSensitive ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      isColdSensitive ? 'translate-x-7' : ''
                    }`} />
                  </button>
                </div>
                {isColdSensitive && (
                  <div className="mt-3 p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg">
                    <p className="text-sm text-amber-400 flex items-center gap-2">
                      <Icons.AlertTriangle />
                      Store at 10°C/50°F - Do not refrigerate below this temperature!
                    </p>
                  </div>
                )}
              </div>

              {/* Workflow Visualization */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Expansion Workflow</h3>
                <div className="space-y-3">
                  {currentScenario.workflow.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-emerald-500/20 text-emerald-400' :
                        index === currentScenario.workflow.length - 1 ? 'bg-blue-500/20 text-blue-400' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 p-3 bg-zinc-800/50 rounded-lg">
                        <p className="text-sm text-white">{step}</p>
                      </div>
                      {index < currentScenario.workflow.length - 1 && (
                        <div className="text-zinc-600">
                          <Icons.ArrowDown />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                    <Icons.DollarSign />
                    Initial Cost
                  </div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(currentScenario.price)}</p>
                  <p className="text-xs text-zinc-500">for 10ml {selectedTier} LC</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                    <Icons.Clock />
                    Shelf Life
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">{currentScenario.shelfLife.split(' at')[0]}</p>
                  <p className="text-xs text-zinc-500">at {storageTemp}°C/{storageTempF}°F</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                    <Icons.Layers />
                    P-Value
                  </div>
                  <p className="text-2xl font-bold text-white">{selectedTier}</p>
                  <p className={`text-xs ${getSenescenceColor(getSenescenceRisk(parseInt(selectedTier.slice(1))))}`}>
                    {getSenescenceRisk(parseInt(selectedTier.slice(1)))} senescence risk
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Custom Calculator */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Starting Culture</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">P-Value (Generation)</label>
                    <select
                      value={startingPValue}
                      onChange={e => setStartingPValue(parseInt(e.target.value))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                    >
                      {[0, 1, 2, 3, 4, 5].map(p => (
                        <option key={p} value={p}>P{p} - {
                          p === 0 ? 'Original (from spores)' :
                          p === 1 ? 'First expansion' :
                          p === 2 ? 'Second expansion' :
                          p === 3 ? 'Third expansion' :
                          p === 4 ? 'Fourth expansion' :
                          'Fifth expansion'
                        }</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Media Type</label>
                    <select
                      value={startingMediaType}
                      onChange={e => setStartingMediaType(e.target.value as MediaType)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                    >
                      {Object.entries(MEDIA_CONFIGS).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Volume/Quantity</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={startingVolume}
                        onChange={e => setStartingVolume(e.target.value)}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                      />
                      <span className="flex items-center px-4 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400">
                        {MEDIA_CONFIGS[startingMediaType].defaultUnit}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Purchase Cost ($)</label>
                    <input
                      type="number"
                      value={startingCost}
                      onChange={e => setStartingCost(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Expansion Ratio */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Expansion Ratio</h3>
                  <span className="text-sm text-emerald-400">Recommended: 1:10</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-zinc-400">1 :</span>
                  <input
                    type="number"
                    value={customRatio}
                    onChange={e => setCustomRatio(e.target.value)}
                    min="1"
                    max="20"
                    className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-center focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex-1">
                    <input
                      type="range"
                      value={customRatio}
                      onChange={e => setCustomRatio(e.target.value)}
                      min="1"
                      max="20"
                      className="w-full"
                    />
                  </div>
                </div>
                {parseInt(customRatio) > 10 && (
                  <p className="mt-2 text-sm text-amber-400 flex items-center gap-2">
                    <Icons.AlertTriangle />
                    Ratios above 1:10 may accelerate senescence
                  </p>
                )}
              </div>

              {/* Expansion Steps */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Expansion Chain</h3>
                  <button
                    onClick={addExpansionStep}
                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30"
                  >
                    + Add Step
                  </button>
                </div>

                <div className="space-y-3">
                  {expansionSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                      <span className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm text-zinc-400">
                        {index + 2}
                      </span>
                      <select
                        value={step.mediaType}
                        onChange={e => updateExpansionStep(index, 'mediaType', e.target.value as MediaType)}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                      >
                        {Object.entries(MEDIA_CONFIGS).map(([key, config]) => (
                          <option key={key} value={key}>{config.label}</option>
                        ))}
                      </select>
                      <span className="text-zinc-400">×</span>
                      <input
                        type="number"
                        value={step.targetQuantity}
                        onChange={e => updateExpansionStep(index, 'targetQuantity', parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm text-center"
                      />
                      <button
                        onClick={() => removeExpansionStep(index)}
                        className="p-2 text-zinc-500 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Expansion Results</h3>
                <div className="space-y-2">
                  {customExpansionResult.steps.map((step, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-sm font-bold ${getSenescenceColor(step.senescenceRisk)}`}>
                          P{step.generation}
                        </span>
                        <div>
                          <p className="text-white">{MEDIA_CONFIGS[step.mediaType].label}</p>
                          <p className="text-xs text-zinc-500">{step.volumeOrWeight} {step.unit}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{formatCurrency(step.costPerUnit)}/unit</p>
                        <p className="text-xs text-zinc-500">{step.shelfLifeDays} days shelf life</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-zinc-700 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-zinc-400">Total Investment</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(customExpansionResult.totalInvestment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Final P-Value</p>
                    <p className={`text-xl font-bold ${getSenescenceColor(getSenescenceRisk(customExpansionResult.finalPValue))}`}>
                      P{customExpansionResult.finalPValue}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Final Cost/Unit</p>
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(customExpansionResult.finalCostPerUnit)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* P-Value Reference */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">P-Value (Generation) Guide</h3>
            <div className="space-y-2 text-sm">
              {[
                { p: 'P0', desc: 'Original (from spores)', risk: 'low', life: '6 months' },
                { p: 'P1', desc: 'First expansion', risk: 'low', life: '5 months' },
                { p: 'P2', desc: 'Master spawn', risk: 'low', life: '3 months' },
                { p: 'P3', desc: 'Working spawn', risk: 'moderate', life: '2 months' },
                { p: 'P4', desc: 'Production spawn', risk: 'high', life: '1 month' },
                { p: 'P5+', desc: 'Aging culture', risk: 'critical', life: '2 weeks' },
              ].map(item => (
                <div key={item.p} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSenescenceColor(item.risk)}`}>
                      {item.p}
                    </span>
                    <span className="text-zinc-400">{item.desc}</span>
                  </div>
                  <span className="text-zinc-500">{item.life}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expansion Ratio Guide */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Recommended Expansion Ratios</h3>
            <div className="space-y-3">
              {Object.entries(expansionRatios).map(([key, value]) => (
                <div key={key} className="p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-white">{
                      key === 'liquidCulture' ? 'Liquid Culture' :
                      key === 'agar' ? 'Agar' : 'Grain Spawn'
                    }</span>
                    <span className="text-emerald-400 font-bold">{value.recommended}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Senescence Warning Signs */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Signs of Senescence</h3>
            <div className="space-y-2">
              {senescenceSigns.slice(0, 5).map((sign, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className={`mt-0.5 ${
                    sign.severity === 'critical' ? 'text-red-400' :
                    sign.severity === 'warning' ? 'text-amber-400' :
                    'text-zinc-400'
                  }`}>•</span>
                  <div>
                    <p className="text-white">{sign.sign}</p>
                    <p className="text-xs text-zinc-500">{sign.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Storage Tips */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Storage Best Practices</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Icons.Check />
                <span className="text-zinc-300">Store in fridge vegetable drawer</span>
              </li>
              <li className="flex items-start gap-2">
                <Icons.Check />
                <span className="text-zinc-300">Keep in Ziploc bag away from airflow</span>
              </li>
              <li className="flex items-start gap-2">
                <Icons.Check />
                <span className="text-zinc-300">Keep in dark (avoid light exposure)</span>
              </li>
              <li className="flex items-start gap-2">
                <Icons.Check />
                <span className="text-zinc-300">Use vegetative edge for agar transfers</span>
              </li>
              <li className="flex items-start gap-2 text-amber-400">
                <Icons.AlertTriangle />
                <span>Cold-sensitive species: 10°C minimum!</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CultureMultiplicationCalculator;
