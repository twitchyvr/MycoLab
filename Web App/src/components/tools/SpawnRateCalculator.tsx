// ============================================================================
// SPAWN RATE CALCULATOR
// Calculate optimal spawn-to-substrate ratios for bulk grows
// ============================================================================

import React, { useState, useMemo } from 'react';

interface SpawnRatePreset {
  name: string;
  minRate: number;
  maxRate: number;
  optimalRate: number;
  description: string;
  colonizationSpeed: string;
}

interface CalculationResult {
  spawnRate: number;
  rating: 'low' | 'optimal' | 'high' | 'very-high';
  colonizationEstimate: string;
  contaminationRisk: string;
  recommendation: string;
}

interface SavedCalculation {
  id: string;
  timestamp: Date;
  spawnWeight: number;
  substrateWeight: number;
  spawnRate: number;
  preset: string;
}

// Presets for different substrate types
const presets: SpawnRatePreset[] = [
  {
    name: 'CVG (Coco Coir/Verm/Gypsum)',
    minRate: 10,
    maxRate: 30,
    optimalRate: 20,
    description: 'Standard bulk substrate for cubensis',
    colonizationSpeed: '10-14 days at 20%',
  },
  {
    name: 'Manure-Based',
    minRate: 15,
    maxRate: 35,
    optimalRate: 25,
    description: 'Horse or cow manure substrates',
    colonizationSpeed: '12-16 days at 25%',
  },
  {
    name: 'Straw (Pasteurized)',
    minRate: 10,
    maxRate: 25,
    optimalRate: 15,
    description: 'Oyster mushrooms and other aggressive species',
    colonizationSpeed: '7-10 days at 15%',
  },
  {
    name: 'Hardwood Sawdust',
    minRate: 15,
    maxRate: 30,
    optimalRate: 20,
    description: 'Gourmet species like shiitake, lions mane',
    colonizationSpeed: '14-21 days at 20%',
  },
  {
    name: "Master's Mix (50/50)",
    minRate: 10,
    maxRate: 25,
    optimalRate: 15,
    description: 'Hardwood pellets + soy hulls',
    colonizationSpeed: '10-14 days at 15%',
  },
  {
    name: 'BRF Cakes (PF Tek)',
    minRate: 0,
    maxRate: 0,
    optimalRate: 0,
    description: 'N/A - BRF is inoculated directly with spores/LC',
    colonizationSpeed: '14-21 days from inoculation',
  },
  {
    name: 'Grain-to-Grain (G2G)',
    minRate: 5,
    maxRate: 15,
    optimalRate: 10,
    description: 'Expanding grain spawn',
    colonizationSpeed: '7-10 days at 10%',
  },
];

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
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  RotateCcw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
};

export const SpawnRateCalculator: React.FC = () => {
  // Calculator mode
  const [mode, setMode] = useState<'calculate' | 'plan'>('calculate');
  
  // Calculate mode inputs
  const [spawnWeight, setSpawnWeight] = useState<string>('');
  const [substrateWeight, setSubstrateWeight] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>(presets[0].name);
  
  // Plan mode inputs
  const [targetRate, setTargetRate] = useState<string>('20');
  const [availableSpawn, setAvailableSpawn] = useState<string>('');
  const [targetSubstrate, setTargetSubstrate] = useState<string>('');
  const [planMode, setPlanMode] = useState<'fromSpawn' | 'fromSubstrate'>('fromSpawn');
  
  // Saved calculations
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  
  // Get current preset
  const currentPreset = presets.find(p => p.name === selectedPreset) || presets[0];

  // Calculate spawn rate and get result
  const calculationResult = useMemo((): CalculationResult | null => {
    const spawn = parseFloat(spawnWeight);
    const substrate = parseFloat(substrateWeight);
    
    if (isNaN(spawn) || isNaN(substrate) || spawn <= 0 || substrate <= 0) {
      return null;
    }
    
    const totalWeight = spawn + substrate;
    const spawnRate = (spawn / totalWeight) * 100;
    
    // Determine rating based on preset
    let rating: CalculationResult['rating'];
    let colonizationEstimate: string;
    let contaminationRisk: string;
    let recommendation: string;
    
    if (currentPreset.name === 'BRF Cakes (PF Tek)') {
      return {
        spawnRate,
        rating: 'optimal',
        colonizationEstimate: 'N/A - BRF uses direct inoculation',
        contaminationRisk: 'N/A',
        recommendation: 'BRF cakes are inoculated directly with spores or LC, not spawned to bulk.',
      };
    }
    
    if (spawnRate < currentPreset.minRate) {
      rating = 'low';
      colonizationEstimate = '21+ days (slow)';
      contaminationRisk = 'HIGH - slow colonization allows contaminants to establish';
      recommendation = `Increase spawn to at least ${currentPreset.minRate}% for reliable colonization. Current rate may lead to stalls or contamination.`;
    } else if (spawnRate <= currentPreset.optimalRate) {
      rating = 'optimal';
      const baseDays = currentPreset.colonizationSpeed.match(/(\d+)-(\d+)/);
      colonizationEstimate = baseDays ? `${baseDays[1]}-${baseDays[2]} days` : '10-14 days';
      contaminationRisk = 'LOW - good balance of speed and efficiency';
      recommendation = 'Optimal spawn rate! Good balance between colonization speed and spawn efficiency.';
    } else if (spawnRate <= currentPreset.maxRate) {
      rating = 'high';
      colonizationEstimate = '7-10 days (fast)';
      contaminationRisk = 'VERY LOW - fast colonization outpaces contaminants';
      recommendation = 'Higher spawn rate will colonize quickly but uses more spawn. Good for contamination-prone environments.';
    } else {
      rating = 'very-high';
      colonizationEstimate = '5-7 days (very fast)';
      contaminationRisk = 'MINIMAL';
      recommendation = `Very high spawn rate (>${currentPreset.maxRate}%). Will colonize very fast but may reduce total yield per spawn invested.`;
    }
    
    return { spawnRate, rating, colonizationEstimate, contaminationRisk, recommendation };
  }, [spawnWeight, substrateWeight, currentPreset]);

  // Plan mode calculation
  const planResult = useMemo(() => {
    const rate = parseFloat(targetRate);
    if (isNaN(rate) || rate <= 0 || rate >= 100) return null;
    
    if (planMode === 'fromSpawn') {
      const spawn = parseFloat(availableSpawn);
      if (isNaN(spawn) || spawn <= 0) return null;
      
      // spawn / (spawn + substrate) = rate/100
      // spawn = (rate/100) * (spawn + substrate)
      // spawn = (rate/100) * spawn + (rate/100) * substrate
      // spawn - (rate/100) * spawn = (rate/100) * substrate
      // spawn * (1 - rate/100) = (rate/100) * substrate
      // substrate = spawn * (1 - rate/100) / (rate/100)
      // substrate = spawn * (100 - rate) / rate
      const substrateNeeded = spawn * (100 - rate) / rate;
      const totalWeight = spawn + substrateNeeded;
      
      return {
        spawnWeight: spawn,
        substrateWeight: Math.round(substrateNeeded),
        totalWeight: Math.round(totalWeight),
        actualRate: rate,
      };
    } else {
      const substrate = parseFloat(targetSubstrate);
      if (isNaN(substrate) || substrate <= 0) return null;
      
      // spawn / (spawn + substrate) = rate/100
      // spawn = (rate/100) * (spawn + substrate)
      // spawn - (rate/100) * spawn = (rate/100) * substrate
      // spawn * (100 - rate) / 100 = (rate/100) * substrate
      // spawn = (rate * substrate) / (100 - rate)
      const spawnNeeded = (rate * substrate) / (100 - rate);
      const totalWeight = spawnNeeded + substrate;
      
      return {
        spawnWeight: Math.round(spawnNeeded),
        substrateWeight: substrate,
        totalWeight: Math.round(totalWeight),
        actualRate: rate,
      };
    }
  }, [targetRate, availableSpawn, targetSubstrate, planMode]);

  // Save current calculation
  const saveCalculation = () => {
    if (!calculationResult) return;
    
    const newCalc: SavedCalculation = {
      id: Date.now().toString(),
      timestamp: new Date(),
      spawnWeight: parseFloat(spawnWeight),
      substrateWeight: parseFloat(substrateWeight),
      spawnRate: calculationResult.spawnRate,
      preset: selectedPreset,
    };
    
    setSavedCalculations(prev => [newCalc, ...prev].slice(0, 10));
  };

  // Clear inputs
  const clearInputs = () => {
    setSpawnWeight('');
    setSubstrateWeight('');
    setAvailableSpawn('');
    setTargetSubstrate('');
  };

  // Rating color helper
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'low': return 'text-red-400 bg-red-950/50 border-red-800';
      case 'optimal': return 'text-emerald-400 bg-emerald-950/50 border-emerald-800';
      case 'high': return 'text-amber-400 bg-amber-950/50 border-amber-800';
      case 'very-high': return 'text-orange-400 bg-orange-950/50 border-orange-800';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icons.Calculator />
            Spawn Rate Calculator
          </h2>
          <p className="text-zinc-400 text-sm">Calculate optimal spawn-to-substrate ratios</p>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
          <button
            onClick={() => setMode('calculate')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'calculate'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Calculate Rate
          </button>
          <button
            onClick={() => setMode('plan')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'plan'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Plan Batch
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calculator Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preset Selection */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <label className="block text-sm font-medium text-zinc-400 mb-3">Substrate Type</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {presets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedPreset(preset.name)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedPreset === preset.name
                      ? 'bg-emerald-950/30 border-emerald-700 text-white'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <p className="font-medium text-sm">{preset.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {preset.optimalRate > 0 ? `Optimal: ${preset.optimalRate}%` : 'Direct inoculation'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {mode === 'calculate' ? (
            /* Calculate Mode */
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Enter Weights</h3>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Spawn Weight (g)</label>
                  <input
                    type="number"
                    value={spawnWeight}
                    onChange={e => setSpawnWeight(e.target.value)}
                    placeholder="e.g., 500"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Colonized grain spawn</p>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Substrate Weight (g)</label>
                  <input
                    type="number"
                    value={substrateWeight}
                    onChange={e => setSubstrateWeight(e.target.value)}
                    placeholder="e.g., 2000"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Hydrated bulk substrate</p>
                </div>
              </div>

              {/* Result */}
              {calculationResult && (
                <div className="space-y-4">
                  {/* Main Result */}
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="text-sm text-zinc-400">Spawn Rate</p>
                      <p className="text-3xl font-bold text-white">
                        {calculationResult.spawnRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border font-medium ${getRatingColor(calculationResult.rating)}`}>
                      {calculationResult.rating === 'optimal' && '✓ Optimal'}
                      {calculationResult.rating === 'low' && '⚠ Low'}
                      {calculationResult.rating === 'high' && '↑ High'}
                      {calculationResult.rating === 'very-high' && '↑↑ Very High'}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-zinc-800/30 rounded-lg">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                        <Icons.Clock />
                        Colonization
                      </div>
                      <p className="text-white font-medium">{calculationResult.colonizationEstimate}</p>
                    </div>
                    <div className="p-3 bg-zinc-800/30 rounded-lg">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                        <Icons.AlertTriangle />
                        Contam Risk
                      </div>
                      <p className="text-white font-medium">{calculationResult.contaminationRisk.split(' - ')[0]}</p>
                    </div>
                    <div className="p-3 bg-zinc-800/30 rounded-lg">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                        <Icons.Zap />
                        Total Weight
                      </div>
                      <p className="text-white font-medium">
                        {(parseFloat(spawnWeight) + parseFloat(substrateWeight)).toLocaleString()}g
                      </p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className={`p-4 rounded-lg border ${getRatingColor(calculationResult.rating)}`}>
                    <p className="text-sm">{calculationResult.recommendation}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={saveCalculation}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                    >
                      <Icons.Save />
                      Save
                    </button>
                    <button
                      onClick={clearInputs}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                      <Icons.RotateCcw />
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {!calculationResult && spawnWeight && substrateWeight && (
                <p className="text-zinc-500 text-center py-4">Enter valid weights to calculate</p>
              )}
            </div>
          ) : (
            /* Plan Mode */
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Plan Your Batch</h3>
              
              {/* Plan Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setPlanMode('fromSpawn')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    planMode === 'fromSpawn'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-700'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  I have spawn, need substrate
                </button>
                <button
                  onClick={() => setPlanMode('fromSubstrate')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    planMode === 'fromSubstrate'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-700'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  I have substrate, need spawn
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Target Spawn Rate (%)</label>
                  <input
                    type="number"
                    value={targetRate}
                    onChange={e => setTargetRate(e.target.value)}
                    placeholder="e.g., 20"
                    min="1"
                    max="99"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Optimal for {currentPreset.name}: {currentPreset.optimalRate}%
                  </p>
                </div>
                
                {planMode === 'fromSpawn' ? (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Available Spawn (g)</label>
                    <input
                      type="number"
                      value={availableSpawn}
                      onChange={e => setAvailableSpawn(e.target.value)}
                      placeholder="e.g., 500"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Target Substrate (g)</label>
                    <input
                      type="number"
                      value={targetSubstrate}
                      onChange={e => setTargetSubstrate(e.target.value)}
                      placeholder="e.g., 2000"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Plan Result */}
              {planResult && (
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-zinc-400 mb-3">Batch Plan</h4>
                  <div className="flex items-center justify-center gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">{planResult.spawnWeight.toLocaleString()}g</p>
                      <p className="text-xs text-zinc-500">Spawn</p>
                    </div>
                    <div className="text-zinc-600">
                      <Icons.ArrowRight />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{planResult.substrateWeight.toLocaleString()}g</p>
                      <p className="text-xs text-zinc-500">Substrate</p>
                    </div>
                    <div className="text-zinc-600">=</div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">{planResult.totalWeight.toLocaleString()}g</p>
                      <p className="text-xs text-zinc-500">Total</p>
                    </div>
                  </div>
                  <p className="text-center text-sm text-zinc-400 mt-3">
                    at {planResult.actualRate}% spawn rate
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preset Info */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-950/50 rounded-lg text-blue-400">
                <Icons.Info />
              </div>
              <div>
                <h4 className="font-medium text-white">{currentPreset.name}</h4>
                <p className="text-sm text-zinc-400 mt-1">{currentPreset.description}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-zinc-500">
                    Range: <span className="text-white">{currentPreset.minRate}-{currentPreset.maxRate}%</span>
                  </span>
                  <span className="text-zinc-500">
                    Colonization: <span className="text-white">{currentPreset.colonizationSpeed}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Reference */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Quick Reference</h3>
            <div className="space-y-3">
              <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
                <p className="text-xs text-red-400 font-medium mb-1">&lt;10% - Too Low</p>
                <p className="text-xs text-zinc-500">Slow colonization, high contam risk</p>
              </div>
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
                <p className="text-xs text-emerald-400 font-medium mb-1">10-25% - Optimal</p>
                <p className="text-xs text-zinc-500">Best balance of speed and efficiency</p>
              </div>
              <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg">
                <p className="text-xs text-amber-400 font-medium mb-1">25-35% - High</p>
                <p className="text-xs text-zinc-500">Fast colonization, uses more spawn</p>
              </div>
              <div className="p-3 bg-orange-950/30 border border-orange-900/50 rounded-lg">
                <p className="text-xs text-orange-400 font-medium mb-1">&gt;35% - Very High</p>
                <p className="text-xs text-zinc-500">Fastest but inefficient spawn use</p>
              </div>
            </div>
          </div>

          {/* Common Ratios */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Common Ratios</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">1:1</span>
                <span className="text-white">50% (G2G expansion)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">1:2</span>
                <span className="text-white">33% (aggressive)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">1:3</span>
                <span className="text-white">25% (high)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">1:4</span>
                <span className="text-emerald-400 font-medium">20% (optimal)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">1:5</span>
                <span className="text-white">17% (efficient)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-400">1:10</span>
                <span className="text-white">9% (minimum)</span>
              </div>
            </div>
          </div>

          {/* Saved Calculations */}
          {savedCalculations.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Recent Calculations</h3>
              <div className="space-y-2">
                {savedCalculations.slice(0, 5).map(calc => (
                  <div
                    key={calc.id}
                    className="p-2 bg-zinc-800/50 rounded-lg text-sm cursor-pointer hover:bg-zinc-800"
                    onClick={() => {
                      setSpawnWeight(calc.spawnWeight.toString());
                      setSubstrateWeight(calc.substrateWeight.toString());
                      setSelectedPreset(calc.preset);
                      setMode('calculate');
                    }}
                  >
                    <div className="flex justify-between">
                      <span className="text-white">{calc.spawnRate.toFixed(1)}%</span>
                      <span className="text-zinc-500 text-xs">
                        {calc.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {calc.spawnWeight}g + {calc.substrateWeight}g
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpawnRateCalculator;
