// ============================================================================
// SUBSTRATE HYDRATION CALCULATOR
// Four calculation modes for precise substrate preparation
// Uses standardized WeightInput component for polished unit handling
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { WeightInput } from '../common/WeightInput';
import { useData } from '../../store';
import { formatWeight, fromGrams, getDefaultUnit, WeightUnit } from '../../utils/weight';

type CalcMode =
  | 'dry_to_total'       // Mode 1: Dry weight + water % → total weight
  | 'total_to_dry'       // Mode 2: Total weight + water % → dry & water weights
  | 'weights_to_percent' // Mode 3: Water + dry weights → water %
  | 'total_dry_to_percent'; // Mode 4: Total + dry weights → water %

interface CalcResult {
  dryWeight?: number;      // In grams
  waterWeight?: number;    // In grams
  totalWeight?: number;    // In grams
  moisturePercent?: number;
}

const modeDescriptions: Record<CalcMode, { title: string; description: string; input1Label: string; input2Label: string; input1IsWeight: boolean; input2IsWeight: boolean }> = {
  dry_to_total: {
    title: 'Dry Weight → Total',
    description: 'Know your dry substrate weight and target moisture? Get the total finished weight.',
    input1Label: 'Dry Weight',
    input2Label: 'Target Moisture %',
    input1IsWeight: true,
    input2IsWeight: false,
  },
  total_to_dry: {
    title: 'Total Weight → Components',
    description: 'Have a target block weight and moisture level? Calculate dry substrate and water needed.',
    input1Label: 'Target Total Weight',
    input2Label: 'Target Moisture %',
    input1IsWeight: true,
    input2IsWeight: false,
  },
  weights_to_percent: {
    title: 'Weights → Moisture %',
    description: 'Know how much water and dry substrate you used? Calculate the moisture percentage.',
    input1Label: 'Water Weight',
    input2Label: 'Dry Weight',
    input1IsWeight: true,
    input2IsWeight: true,
  },
  total_dry_to_percent: {
    title: 'Total & Dry → Moisture %',
    description: 'Weighed before and after drying? Calculate the moisture content.',
    input1Label: 'Total Weight',
    input2Label: 'Dry Weight',
    input1IsWeight: true,
    input2IsWeight: true,
  },
};

// Common substrate moisture targets
const presets = [
  { name: 'CVG (Coco Coir)', moisture: 65, notes: 'Standard coco/verm/gypsum' },
  { name: 'Hardwood Sawdust', moisture: 60, notes: 'Oak, maple, etc.' },
  { name: 'Straw', moisture: 70, notes: 'Pasteurized straw' },
  { name: 'Manure-based', moisture: 65, notes: 'Horse manure substrate' },
  { name: 'Master\'s Mix', moisture: 60, notes: '50/50 hardwood/soy hulls' },
  { name: 'BRF Cakes', moisture: 55, notes: 'Brown rice flour + verm' },
  { name: 'Field Capacity', moisture: 72, notes: 'Maximum water retention' },
];

export const SubstrateCalculator: React.FC = () => {
  const { state } = useData();
  const displayUnit: WeightUnit = getDefaultUnit(state.settings.defaultUnits || 'metric');

  const [mode, setMode] = useState<CalcMode>('dry_to_total');
  // Weight inputs stored in grams (like WeightInput expects)
  const [input1Grams, setInput1Grams] = useState<number | undefined>(undefined);
  // Percentage input stored as number
  const [input2Percent, setInput2Percent] = useState<string>('');
  // For modes where both inputs are weights
  const [input2Grams, setInput2Grams] = useState<number | undefined>(undefined);

  const [showPresets, setShowPresets] = useState(false);
  const [savedCalculations, setSavedCalculations] = useState<Array<{
    id: string;
    mode: CalcMode;
    inputs: { input1: number; input2: number };
    result: CalcResult;
    timestamp: Date;
  }>>([]);

  const modeConfig = modeDescriptions[mode];

  // Calculate results whenever inputs change
  const result = useMemo((): CalcResult | null => {
    const val1 = input1Grams;
    const val2 = modeConfig.input2IsWeight ? input2Grams : parseFloat(input2Percent);

    if (val1 === undefined || val1 <= 0 || val2 === undefined || isNaN(val2) || val2 <= 0) {
      return null;
    }

    switch (mode) {
      case 'dry_to_total': {
        // Dry weight + moisture % → total & water
        if (val2 >= 100) return null;
        const waterNeeded = val1 * (val2 / (100 - val2));
        return {
          dryWeight: Math.round(val1 * 10) / 10,
          moisturePercent: val2,
          waterWeight: Math.round(waterNeeded * 10) / 10,
          totalWeight: Math.round((val1 + waterNeeded) * 10) / 10,
        };
      }

      case 'total_to_dry': {
        // Total weight + moisture % → dry & water
        if (val2 >= 100) return null;
        const waterFromTotal = val1 * (val2 / 100);
        return {
          totalWeight: Math.round(val1 * 10) / 10,
          moisturePercent: val2,
          waterWeight: Math.round(waterFromTotal * 10) / 10,
          dryWeight: Math.round((val1 - waterFromTotal) * 10) / 10,
        };
      }

      case 'weights_to_percent': {
        // Water + dry → moisture %
        const totalFromWeights = val1 + val2;
        return {
          waterWeight: Math.round(val1 * 10) / 10,
          dryWeight: Math.round(val2 * 10) / 10,
          totalWeight: Math.round(totalFromWeights * 10) / 10,
          moisturePercent: Math.round((val1 / totalFromWeights) * 1000) / 10,
        };
      }

      case 'total_dry_to_percent': {
        // Total + dry → moisture % & water
        if (val2 > val1) return null;
        const waterContent = val1 - val2;
        return {
          totalWeight: Math.round(val1 * 10) / 10,
          dryWeight: Math.round(val2 * 10) / 10,
          waterWeight: Math.round(waterContent * 10) / 10,
          moisturePercent: Math.round((waterContent / val1) * 1000) / 10,
        };
      }
    }
  }, [mode, input1Grams, input2Grams, input2Percent, modeConfig.input2IsWeight]);

  const handleModeChange = (newMode: CalcMode) => {
    setMode(newMode);
    setInput1Grams(undefined);
    setInput2Percent('');
    setInput2Grams(undefined);
  };

  const applyPreset = (moisture: number) => {
    if (!modeConfig.input2IsWeight) {
      setInput2Percent(moisture.toString());
    }
    setShowPresets(false);
  };

  const saveCalculation = () => {
    if (!result) return;
    const input2Value = modeConfig.input2IsWeight ? (input2Grams || 0) : parseFloat(input2Percent);
    const newCalc = {
      id: Date.now().toString(),
      mode,
      inputs: { input1: input1Grams || 0, input2: input2Value },
      result,
      timestamp: new Date(),
    };
    setSavedCalculations(prev => [newCalc, ...prev].slice(0, 10));
  };

  const getMoistureQuality = (percent: number): { label: string; color: string } => {
    if (percent < 50) return { label: 'Too Dry', color: 'text-amber-400' };
    if (percent < 55) return { label: 'Low', color: 'text-yellow-400' };
    if (percent <= 65) return { label: 'Optimal', color: 'text-emerald-400' };
    if (percent <= 72) return { label: 'High (Field Capacity)', color: 'text-blue-400' };
    return { label: 'Too Wet', color: 'text-red-400' };
  };

  // Format weight for display in user's preferred unit
  const formatResultWeight = (grams: number): string => {
    return formatWeight(grams, displayUnit);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Substrate Calculator</h2>
          <p className="text-zinc-400 text-sm">Four ways to calculate perfect hydration ratios</p>
        </div>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium border border-zinc-700 transition-colors"
        >
          Presets
        </button>
      </div>

      {/* Presets Dropdown */}
      {showPresets && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 animate-fade-in">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Common Substrate Targets</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset.moisture)}
                className="p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-left transition-colors group"
              >
                <p className="text-sm font-medium text-white group-hover:text-emerald-400">{preset.name}</p>
                <p className="text-lg font-bold text-emerald-400">{preset.moisture}%</p>
                <p className="text-xs text-zinc-500">{preset.notes}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(modeDescriptions) as CalcMode[]).map((m, index) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`p-4 rounded-xl border text-left transition-all ${
              mode === m
                ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className={`text-xs font-medium mb-1 ${mode === m ? 'text-emerald-400' : 'text-zinc-500'}`}>
              Mode {index + 1}
            </div>
            <div className={`text-sm font-semibold ${mode === m ? 'text-white' : 'text-zinc-300'}`}>
              {modeDescriptions[m].title}
            </div>
          </button>
        ))}
      </div>

      {/* Calculator Card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Mode Description */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/30">
          <p className="text-zinc-400">{modeConfig.description}</p>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Inputs</h3>

              {/* Input 1 - Always a weight */}
              <WeightInput
                label={modeConfig.input1Label}
                value={input1Grams}
                onChange={(grams) => setInput1Grams(grams)}
                allowEmpty={true}
                showConversionHint={true}
              />

              {/* Input 2 - Either weight or percentage */}
              {modeConfig.input2IsWeight ? (
                <WeightInput
                  label={modeConfig.input2Label}
                  value={input2Grams}
                  onChange={(grams) => setInput2Grams(grams)}
                  allowEmpty={true}
                  showConversionHint={true}
                />
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm text-zinc-400">
                    {modeConfig.input2Label}
                  </label>
                  <div className="relative flex items-stretch">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={input2Percent}
                      onChange={(e) => setInput2Percent(e.target.value)}
                      placeholder="65"
                      min={0}
                      max={100}
                      className="min-w-0 flex-1 bg-zinc-800 border border-zinc-700 rounded-l-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex-shrink-0 h-full bg-zinc-700 border border-l-0 border-zinc-600 rounded-r-lg px-3 py-2 text-zinc-300 font-medium text-sm flex items-center">
                      %
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">Common range: 55-72%</p>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Results</h3>

              {result ? (
                <div className="space-y-3">
                  {/* Primary Results */}
                  <div className="grid grid-cols-2 gap-3">
                    {result.waterWeight !== undefined && (
                      <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
                        <p className="text-xs text-blue-400 mb-1">Water</p>
                        <p className="text-xl font-bold text-white">{formatResultWeight(result.waterWeight)}</p>
                      </div>
                    )}
                    {result.dryWeight !== undefined && mode !== 'dry_to_total' && (
                      <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-4">
                        <p className="text-xs text-amber-400 mb-1">Dry Substrate</p>
                        <p className="text-xl font-bold text-white">{formatResultWeight(result.dryWeight)}</p>
                      </div>
                    )}
                    {result.totalWeight !== undefined && mode !== 'total_to_dry' && mode !== 'total_dry_to_percent' && (
                      <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-4">
                        <p className="text-xs text-emerald-400 mb-1">Total Weight</p>
                        <p className="text-xl font-bold text-white">{formatResultWeight(result.totalWeight)}</p>
                      </div>
                    )}
                    {result.moisturePercent !== undefined && (mode === 'weights_to_percent' || mode === 'total_dry_to_percent') && (
                      <div className="bg-purple-950/30 border border-purple-800/50 rounded-lg p-4 col-span-2">
                        <p className="text-xs text-purple-400 mb-1">Moisture Content</p>
                        <div className="flex items-baseline gap-3">
                          <p className="text-2xl font-bold text-white">{result.moisturePercent}%</p>
                          <span className={`text-sm font-medium ${getMoistureQuality(result.moisturePercent).color}`}>
                            {getMoistureQuality(result.moisturePercent).label}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Moisture Bar Visualization */}
                  {result.moisturePercent !== undefined && (
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <div className="flex justify-between text-xs text-zinc-500 mb-2">
                        <span>0%</span>
                        <span>50%</span>
                        <span>72%</span>
                        <span>100%</span>
                      </div>
                      <div className="relative h-4 bg-zinc-700 rounded-full overflow-hidden">
                        {/* Optimal zone indicator */}
                        <div
                          className="absolute h-full bg-emerald-900/50"
                          style={{ left: '55%', width: '17%' }}
                        />
                        {/* Current value marker */}
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg shadow-white/50"
                          style={{ left: `${Math.min(result.moisturePercent, 100)}%`, transform: 'translateX(-50%)' }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-2">
                        <span className="text-amber-400">Dry</span>
                        <span className="text-emerald-400">Optimal (55-72%)</span>
                        <span className="text-red-400">Wet</span>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <button
                    onClick={saveCalculation}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium border border-zinc-700 transition-colors"
                  >
                    Save Calculation
                  </button>
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
            <p className="text-zinc-400">Standard is 1:2 to 1:4 (spawn:substrate by weight). Higher spawn = faster colonization.</p>
          </div>
          <div>
            <p className="text-purple-400 font-medium mb-1">Biological Efficiency</p>
            <p className="text-zinc-400">BE% = (fresh mushroom weight / dry substrate weight) x 100. Good = 100%+</p>
          </div>
        </div>
      </div>

      {/* Saved Calculations */}
      {savedCalculations.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Recent Calculations</h3>
          <div className="space-y-2">
            {savedCalculations.map((calc) => (
              <div key={calc.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-500">{modeDescriptions[calc.mode].title}</span>
                  <span className="text-sm text-white font-mono">
                    {formatWeight(calc.inputs.input1, displayUnit)}
                    {' + '}
                    {modeDescriptions[calc.mode].input2IsWeight
                      ? formatWeight(calc.inputs.input2, displayUnit)
                      : `${calc.inputs.input2}%`
                    }
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {calc.result.waterWeight && (
                    <span className="text-sm text-blue-400">{formatWeight(calc.result.waterWeight, displayUnit)} water</span>
                  )}
                  {calc.result.moisturePercent && (
                    <span className="text-sm text-emerald-400">{calc.result.moisturePercent}%</span>
                  )}
                  <span className="text-xs text-zinc-500">
                    {calc.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubstrateCalculator;
