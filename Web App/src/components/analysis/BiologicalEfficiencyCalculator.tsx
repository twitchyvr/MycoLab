// ============================================================================
// BIOLOGICAL EFFICIENCY CALCULATOR
// Calculate, track, and compare BE% across grows
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useData } from '../../store';
import { WeightInput } from '../common/WeightInput';

interface HarvestRecord {
  id: string;
  growId: string;
  growLabel: string;
  strainName: string;
  flushNumber: number;
  freshWeight: number; // grams
  dryWeight?: number; // grams (optional)
  drySubstrateWeight: number; // grams
  harvestDate: Date;
  substrateType: string;
  spawnType: string;
  notes?: string;
}

interface BEResult {
  freshBE: number;
  dryBE?: number;
  rating: 'poor' | 'below_average' | 'average' | 'good' | 'excellent' | 'exceptional';
  ratingColor: string;
}

// BE Rating thresholds (fresh weight basis)
const getBERating = (be: number): { rating: BEResult['rating']; color: string; label: string } => {
  if (be < 50) return { rating: 'poor', color: 'text-red-400', label: 'Poor' };
  if (be < 75) return { rating: 'below_average', color: 'text-orange-400', label: 'Below Average' };
  if (be < 100) return { rating: 'average', color: 'text-yellow-400', label: 'Average' };
  if (be < 150) return { rating: 'good', color: 'text-lime-400', label: 'Good' };
  if (be < 200) return { rating: 'excellent', color: 'text-emerald-400', label: 'Excellent' };
  return { rating: 'exceptional', color: 'text-cyan-400', label: 'Exceptional' };
};

// Icons
const Icons = {
  Calculator: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/></svg>,
  TrendingUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  BarChart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Award: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  Info: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  History: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

export const BiologicalEfficiencyCalculator: React.FC = () => {
  const { state, getStrain, getSubstrateType } = useData();
  const [activeTab, setActiveTab] = useState<'calculator' | 'history' | 'compare'>('calculator');

  // Calculator inputs (stored in grams)
  const [freshWeight, setFreshWeight] = useState<number | undefined>(undefined);
  const [dryWeight, setDryWeight] = useState<number | undefined>(undefined);
  const [substrateWeight, setSubstrateWeight] = useState<number | undefined>(undefined);
  const [calculatedBE, setCalculatedBE] = useState<BEResult | null>(null);

  // Derive harvest records from real grow data with flushes
  const records = useMemo(() => {
    const harvestRecords: HarvestRecord[] = [];
    
    state.grows.forEach(grow => {
      if (!grow.flushes || grow.flushes.length === 0) return;
      
      const strain = getStrain(grow.strainId);
      const substrate = getSubstrateType(grow.substrateTypeId);
      
      grow.flushes.forEach((flush, index) => {
        harvestRecords.push({
          id: `${grow.id}-flush-${index}`,
          growId: grow.id,
          growLabel: grow.name,
          strainName: strain?.name || 'Unknown',
          flushNumber: index + 1,
          freshWeight: flush.wetWeight || 0,
          dryWeight: flush.dryWeight,
          drySubstrateWeight: grow.substrateWeight || 0,
          harvestDate: new Date(flush.harvestDate),
          substrateType: substrate?.name || 'Unknown',
          spawnType: grow.spawnType || 'Unknown',
        });
      });
    });
    
    return harvestRecords;
  }, [state.grows, getStrain, getSubstrateType]);

  // Calculate BE
  const calculateBE = () => {
    // Values are already in grams from WeightInput
    if (!freshWeight || !substrateWeight || freshWeight <= 0 || substrateWeight <= 0) {
      setCalculatedBE(null);
      return;
    }

    const freshBE = (freshWeight / substrateWeight) * 100;
    const dryBE = dryWeight && dryWeight > 0 ? (dryWeight / substrateWeight) * 100 : undefined;
    const rating = getBERating(freshBE);

    setCalculatedBE({
      freshBE: Math.round(freshBE * 10) / 10,
      dryBE: dryBE ? Math.round(dryBE * 10) / 10 : undefined,
      rating: rating.rating,
      ratingColor: rating.color,
    });
  };

  // Reset calculator
  const resetCalculator = () => {
    setFreshWeight(undefined);
    setDryWeight(undefined);
    setSubstrateWeight(undefined);
    setCalculatedBE(null);
  };

  // Historical analysis
  const analysis = useMemo(() => {
    // Group by grow
    const growMap = new Map<string, HarvestRecord[]>();
    records.forEach(r => {
      const existing = growMap.get(r.growId) || [];
      growMap.set(r.growId, [...existing, r]);
    });

    // Calculate total BE per grow
    const growBEs = Array.from(growMap.entries()).map(([growId, harvests]) => {
      const totalFresh = harvests.reduce((sum, h) => sum + h.freshWeight, 0);
      const totalDry = harvests.reduce((sum, h) => sum + (h.dryWeight || 0), 0);
      const substrateWeight = harvests[0].drySubstrateWeight;
      const freshBE = (totalFresh / substrateWeight) * 100;
      const dryBE = totalDry > 0 ? (totalDry / substrateWeight) * 100 : undefined;
      
      return {
        growId,
        growLabel: harvests[0].growLabel,
        strainName: harvests[0].strainName,
        substrateType: harvests[0].substrateType,
        spawnType: harvests[0].spawnType,
        flushCount: harvests.length,
        totalFresh,
        totalDry,
        freshBE: Math.round(freshBE * 10) / 10,
        dryBE: dryBE ? Math.round(dryBE * 10) / 10 : undefined,
        rating: getBERating(freshBE),
      };
    });

    // By strain
    const strainMap = new Map<string, { totalFresh: number; totalSubstrate: number; count: number }>();
    growBEs.forEach(g => {
      const existing = strainMap.get(g.strainName) || { totalFresh: 0, totalSubstrate: 0, count: 0 };
      const grow = growMap.get(g.growId)!;
      strainMap.set(g.strainName, {
        totalFresh: existing.totalFresh + g.totalFresh,
        totalSubstrate: existing.totalSubstrate + grow[0].drySubstrateWeight,
        count: existing.count + 1,
      });
    });

    const strainBEs = Array.from(strainMap.entries()).map(([strain, data]) => ({
      strain,
      avgBE: Math.round((data.totalFresh / data.totalSubstrate) * 1000) / 10,
      growCount: data.count,
    })).sort((a, b) => b.avgBE - a.avgBE);

    // By substrate type
    const substrateMap = new Map<string, { totalFresh: number; totalSubstrate: number; count: number }>();
    growBEs.forEach(g => {
      const existing = substrateMap.get(g.substrateType) || { totalFresh: 0, totalSubstrate: 0, count: 0 };
      const grow = growMap.get(g.growId)!;
      substrateMap.set(g.substrateType, {
        totalFresh: existing.totalFresh + g.totalFresh,
        totalSubstrate: existing.totalSubstrate + grow[0].drySubstrateWeight,
        count: existing.count + 1,
      });
    });

    const substrateBEs = Array.from(substrateMap.entries()).map(([substrate, data]) => ({
      substrate,
      avgBE: Math.round((data.totalFresh / data.totalSubstrate) * 1000) / 10,
      growCount: data.count,
    })).sort((a, b) => b.avgBE - a.avgBE);

    // Overall stats
    const totalFresh = records.reduce((sum, r) => sum + r.freshWeight, 0);
    const totalSubstrate = growBEs.reduce((sum, g) => {
      const grow = growMap.get(g.growId)!;
      return sum + grow[0].drySubstrateWeight;
    }, 0);
    const overallBE = (totalFresh / totalSubstrate) * 100;

    // Best performers
    const bestGrow = growBEs.reduce((best, g) => g.freshBE > best.freshBE ? g : best, growBEs[0]);
    const bestStrain = strainBEs[0];

    return {
      growBEs: growBEs.sort((a, b) => b.freshBE - a.freshBE),
      strainBEs,
      substrateBEs,
      overallBE: Math.round(overallBE * 10) / 10,
      totalHarvests: records.length,
      totalGrows: growBEs.length,
      totalFresh: Math.round(totalFresh),
      bestGrow,
      bestStrain,
    };
  }, [records]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Biological Efficiency</h2>
        <p className="text-zinc-400 text-sm">Calculate and track BE% across your grows</p>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <Icons.Info />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">What is Biological Efficiency (BE%)?</p>
            <p className="text-blue-200/80">
              BE% measures how efficiently your substrate converts to mushroom yield.
              It's calculated as (fresh harvest weight / dry substrate weight) × 100.
              100% means you harvested the same weight in mushrooms as your dry substrate input -
              anything over 100% is excellent! Use this to compare strains, substrates, and techniques.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Overall Avg BE%</p>
          <p className={`text-2xl font-bold ${getBERating(analysis.overallBE).color}`}>
            {analysis.overallBE}%
          </p>
        </div>
        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4">
          <p className="text-xs text-emerald-400 mb-1">Best Grow</p>
          <p className="text-2xl font-bold text-white">{analysis.bestGrow?.freshBE}%</p>
          <p className="text-xs text-zinc-500">{analysis.bestGrow?.growLabel}</p>
        </div>
        <div className="bg-blue-950/30 border border-blue-800/50 rounded-xl p-4">
          <p className="text-xs text-blue-400 mb-1">Best Strain</p>
          <p className="text-2xl font-bold text-white">{analysis.bestStrain?.avgBE}%</p>
          <p className="text-xs text-zinc-500">{analysis.bestStrain?.strain}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Total Harvests</p>
          <p className="text-2xl font-bold text-white">{analysis.totalHarvests}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Total Yield</p>
          <p className="text-2xl font-bold text-white">{analysis.totalFresh}g</p>
          <p className="text-xs text-zinc-500">fresh weight</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        {[
          { id: 'calculator', label: 'Calculator', icon: Icons.Calculator },
          { id: 'history', label: 'Grow History', icon: Icons.History },
          { id: 'compare', label: 'Compare', icon: Icons.BarChart },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'calculator' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Calculator */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Icons.Calculator />
              BE Calculator
            </h3>

            <div className="space-y-4">
              <WeightInput
                label="Fresh Mushroom Weight"
                value={freshWeight}
                onChange={setFreshWeight}
                placeholder="e.g., 285"
                required
                showConversionHint
              />

              <div>
                <WeightInput
                  label="Dry Mushroom Weight"
                  value={dryWeight}
                  onChange={setDryWeight}
                  placeholder="e.g., 28"
                  showConversionHint
                />
                <p className="text-xs text-zinc-600 mt-1">~10% of fresh weight typically</p>
              </div>

              <div>
                <WeightInput
                  label="Dry Substrate Weight"
                  value={substrateWeight}
                  onChange={setSubstrateWeight}
                  placeholder="e.g., 450"
                  required
                  showConversionHint
                />
                <p className="text-xs text-zinc-600 mt-1">Weight of substrate before hydration</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={calculateBE}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                  Calculate BE%
                </button>
                <button
                  onClick={resetCalculator}
                  className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium border border-zinc-700 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="space-y-6">
            {calculatedBE ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 animate-fade-in">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Icons.Award />
                  Results
                </h3>

                <div className="space-y-4">
                  {/* Fresh BE */}
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-sm text-zinc-400 mb-1">Fresh Weight BE%</p>
                    <div className="flex items-baseline gap-3">
                      <p className={`text-4xl font-bold ${calculatedBE.ratingColor}`}>
                        {calculatedBE.freshBE}%
                      </p>
                      <span className={`px-2 py-1 rounded text-sm font-medium bg-zinc-800 ${calculatedBE.ratingColor}`}>
                        {getBERating(calculatedBE.freshBE).label}
                      </span>
                    </div>
                  </div>

                  {/* Dry BE (if provided) */}
                  {calculatedBE.dryBE && (
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-sm text-zinc-400 mb-1">Dry Weight BE%</p>
                      <p className="text-2xl font-bold text-white">{calculatedBE.dryBE}%</p>
                    </div>
                  )}

                  {/* Visual scale */}
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 mb-2">BE% Scale</p>
                    <div className="relative h-4 bg-zinc-700 rounded-full overflow-hidden">
                      <div className="absolute inset-0 flex">
                        <div className="bg-red-600/50 w-[25%]" />
                        <div className="bg-orange-600/50 w-[12.5%]" />
                        <div className="bg-yellow-600/50 w-[12.5%]" />
                        <div className="bg-lime-600/50 w-[25%]" />
                        <div className="bg-emerald-600/50 w-[25%]" />
                      </div>
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg shadow-white/50"
                        style={{ left: `${Math.min(calculatedBE.freshBE / 2, 100)}%`, transform: 'translateX(-50%)' }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                      <span>150%</span>
                      <span>200%+</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
                <Icons.Calculator />
                <p className="text-zinc-500 mt-2">Enter values to calculate BE%</p>
              </div>
            )}

            {/* Reference */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Icons.Info />
                BE% Reference
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-red-400">Poor</span>
                  <span className="text-zinc-500">&lt;50%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-400">Below Average</span>
                  <span className="text-zinc-500">50-75%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-400">Average</span>
                  <span className="text-zinc-500">75-100%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-lime-400">Good</span>
                  <span className="text-zinc-500">100-150%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-400">Excellent</span>
                  <span className="text-zinc-500">150-200%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400">Exceptional</span>
                  <span className="text-zinc-500">&gt;200%</span>
                </div>
              </div>
              <p className="text-xs text-zinc-600 mt-3">
                BE% = (Fresh Mushroom Weight / Dry Substrate Weight) × 100
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <p className="text-zinc-400 text-sm">All recorded grows sorted by BE%</p>
          
          <div className="space-y-3">
            {analysis.growBEs.map(grow => (
              <div key={grow.growId} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold ${grow.rating.color} bg-zinc-800`}>
                      {grow.freshBE}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-white">{grow.growLabel}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 ${grow.rating.color}`}>
                          {grow.rating.label}
                        </span>
                      </div>
                      <p className="text-sm text-emerald-400">{grow.strainName}</p>
                      <p className="text-xs text-zinc-500">{grow.substrateType} • {grow.spawnType} • {grow.flushCount} flush{grow.flushCount > 1 ? 'es' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">{grow.totalFresh}g</p>
                    <p className="text-xs text-zinc-500">fresh total</p>
                    {grow.dryBE && (
                      <p className="text-xs text-zinc-400 mt-1">Dry: {grow.dryBE}%</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* By Strain */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Average BE% by Strain</h3>
            <div className="space-y-3">
              {analysis.strainBEs.map((strain, idx) => (
                <div key={strain.strain} className="flex items-center gap-3">
                  <div className="w-6 text-right">
                    <span className={`text-sm font-medium ${idx === 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                      {idx === 0 ? '🥇' : `#${idx + 1}`}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{strain.strain}</span>
                      <span className={getBERating(strain.avgBE).color}>{strain.avgBE}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                        }`}
                        style={{ width: `${Math.min(strain.avgBE / 2, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">{strain.growCount} grow{strain.growCount > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Substrate */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Average BE% by Substrate</h3>
            <div className="space-y-3">
              {analysis.substrateBEs.map((sub, idx) => (
                <div key={sub.substrate} className="flex items-center gap-3">
                  <div className="w-6 text-right">
                    <span className={`text-sm font-medium ${idx === 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                      {idx === 0 ? '🥇' : `#${idx + 1}`}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{sub.substrate}</span>
                      <span className={getBERating(sub.avgBE).color}>{sub.avgBE}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-teal-600 to-teal-500'
                        }`}
                        style={{ width: `${Math.min(sub.avgBE / 2, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">{sub.growCount} grow{sub.growCount > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="md:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">🔍 Insights</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-lg">
                <p className="text-sm text-emerald-400 font-medium mb-1">Top Performer</p>
                <p className="text-lg font-bold text-white">{analysis.bestStrain?.strain}</p>
                <p className="text-xs text-zinc-400">Averaging {analysis.bestStrain?.avgBE}% BE across {analysis.bestStrain?.growCount} grow(s)</p>
              </div>
              
              {analysis.substrateBEs.length > 1 && (
                <div className="p-4 bg-blue-950/30 border border-blue-800/50 rounded-lg">
                  <p className="text-sm text-blue-400 font-medium mb-1">Best Substrate</p>
                  <p className="text-lg font-bold text-white">{analysis.substrateBEs[0].substrate}</p>
                  <p className="text-xs text-zinc-400">{Math.round(analysis.substrateBEs[0].avgBE - analysis.substrateBEs[analysis.substrateBEs.length - 1].avgBE)}% better than lowest</p>
                </div>
              )}

              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <p className="text-sm text-zinc-400 font-medium mb-1">Total Production</p>
                <p className="text-lg font-bold text-white">{analysis.totalFresh}g fresh</p>
                <p className="text-xs text-zinc-400">From {analysis.totalGrows} grows, {analysis.totalHarvests} harvests</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiologicalEfficiencyCalculator;
