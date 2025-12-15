// ============================================================================
// STRAIN PERFORMANCE ANALYTICS (dev-021)
// Track success rates, average yields, contamination rates, and optimal
// conditions per strain based on historical grows
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useData } from '../../store';
import type { Grow, Strain, Flush } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface StrainMetrics {
  strainId: string;
  strainName: string;
  speciesName: string;
  totalGrows: number;
  completedGrows: number;
  activeGrows: number;
  contaminatedGrows: number;
  abortedGrows: number;
  successRate: number;
  contaminationRate: number;
  totalYield: number;
  avgYieldPerGrow: number;
  avgBiologicalEfficiency: number;
  avgDaysToFirstHarvest: number;
  avgDaysToCompletion: number;
  totalFlushes: number;
  avgFlushesPerGrow: number;
  avgYieldPerFlush: number;
  bestYield: number;
  worstYield: number;
  avgSubstrateWeight: number;
  avgSpawnRate: number;
  preferredSubstrates: { name: string; count: number; avgBE: number }[];
  preferredContainers: { name: string; count: number; avgBE: number }[];
  monthlyTrend: { month: string; yields: number; grows: number; be: number }[];
  flushBreakdown: { flushNumber: number; avgYield: number; count: number }[];
}

interface ComparisonData {
  metric: string;
  values: { strainName: string; value: number; color: string }[];
  unit: string;
  higherIsBetter: boolean;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  TrendingDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  Award: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  Target: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  BarChart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Scale: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
      <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Layers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateStrainColor = (strainName: string, index: number): string => {
  const colors = [
    '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899',
    '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#06b6d4'
  ];
  let hash = 0;
  for (let i = 0; i < strainName.length; i++) {
    hash = strainName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[(Math.abs(hash) + index) % colors.length];
};

const formatNumber = (num: number, decimals: number = 1): string => {
  if (num === 0) return '0';
  if (num < 10) return num.toFixed(decimals);
  return Math.round(num).toLocaleString();
};

const getBEGrade = (be: number): { grade: string; color: string } => {
  if (be >= 150) return { grade: 'Exceptional', color: 'text-emerald-400' };
  if (be >= 100) return { grade: 'Excellent', color: 'text-green-400' };
  if (be >= 75) return { grade: 'Good', color: 'text-lime-400' };
  if (be >= 50) return { grade: 'Average', color: 'text-yellow-400' };
  return { grade: 'Below Average', color: 'text-orange-400' };
};

const getSuccessGrade = (rate: number): { color: string } => {
  if (rate >= 90) return { color: 'text-emerald-400' };
  if (rate >= 75) return { color: 'text-green-400' };
  if (rate >= 60) return { color: 'text-yellow-400' };
  return { color: 'text-red-400' };
};

// ============================================================================
// CHART COMPONENTS
// ============================================================================

const BarChart: React.FC<{
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  showValues?: boolean;
  height?: number;
  unit?: string;
}> = ({ data, maxValue, showValues = true, height = 180, unit = '' }) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, idx) => {
        const barHeight = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div className="w-full flex flex-col items-center justify-end" style={{ height: height - 40 }}>
              {showValues && item.value > 0 && (
                <span className="text-xs text-zinc-400 mb-1 whitespace-nowrap">
                  {formatNumber(item.value)}{unit}
                </span>
              )}
              <div
                className="w-full max-w-[40px] rounded-t-md transition-all duration-500 hover:opacity-80"
                style={{
                  height: `${Math.max(barHeight, 2)}%`,
                  backgroundColor: item.color || '#10b981',
                  minHeight: item.value > 0 ? 4 : 0,
                }}
              />
            </div>
            <span className="text-xs text-zinc-500 truncate max-w-full text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const HorizontalBarChart: React.FC<{
  data: { label: string; value: number; subLabel?: string; color?: string }[];
  unit?: string;
  maxValue?: number;
}> = ({ data, unit = '', maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const width = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <div className="flex items-center gap-2 truncate">
                <span className="text-zinc-400 w-4 flex-shrink-0">{idx + 1}.</span>
                <span className="text-white truncate">{item.label}</span>
              </div>
              <span className="text-zinc-400 flex-shrink-0 ml-2">
                {formatNumber(item.value)}{unit}
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${width}%`,
                  backgroundColor: item.color || '#10b981'
                }}
              />
            </div>
            {item.subLabel && (
              <p className="text-xs text-zinc-600 mt-1">{item.subLabel}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ProgressRing: React.FC<{
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}> = ({ value, max, size = 80, strokeWidth = 8, color = '#10b981', label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - (progress * circumference);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">{Math.round(progress * 100)}%</span>
        {label && <span className="text-xs text-zinc-500">{label}</span>}
      </div>
    </div>
  );
};

const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}> = ({ data, size = 140, thickness = 20 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, idx) => {
          const percentage = total > 0 ? item.value / total : 0;
          const strokeLength = percentage * circumference;
          const offset = currentOffset;
          currentOffset += strokeLength;

          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={thickness}
              strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
              strokeDashoffset={-offset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{total}</span>
        <span className="text-xs text-zinc-500">Total</span>
      </div>
    </div>
  );
};

const Sparkline: React.FC<{
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}> = ({ data, color = '#10b981', height = 40, width = 100 }) => {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4)}
        r="3"
        fill={color}
      />
    </svg>
  );
};

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: number;
  color?: string;
  subtext?: string;
}> = ({ label, value, unit = '', icon, trend, color = 'text-white', subtext }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-zinc-500">{label}</span>
      {icon && <span className="text-zinc-500">{icon}</span>}
    </div>
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      {unit && <span className="text-sm text-zinc-400">{unit}</span>}
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 mt-1 text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend >= 0 ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
        <span>{Math.abs(trend).toFixed(1)}%</span>
      </div>
    )}
    {subtext && <p className="text-xs text-zinc-500 mt-1">{subtext}</p>}
  </div>
);

// ============================================================================
// STRAIN DETAIL PANEL
// ============================================================================

const StrainDetailPanel: React.FC<{
  metrics: StrainMetrics;
  color: string;
}> = ({ metrics, color }) => {
  const beGrade = getBEGrade(metrics.avgBiologicalEfficiency);
  const successGrade = getSuccessGrade(metrics.successRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h3 className="text-xl font-bold text-white">{metrics.strainName}</h3>
            </div>
            <p className="text-sm text-zinc-400">{metrics.speciesName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-400">Total Grows</p>
            <p className="text-2xl font-bold text-white">{metrics.totalGrows}</p>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="text-center p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
            <p className="text-lg font-bold text-emerald-400">{metrics.completedGrows}</p>
            <p className="text-xs text-zinc-400">Completed</p>
          </div>
          <div className="text-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <p className="text-lg font-bold text-blue-400">{metrics.activeGrows}</p>
            <p className="text-xs text-zinc-400">Active</p>
          </div>
          <div className="text-center p-2 bg-red-500/10 rounded-lg border border-red-500/30">
            <p className="text-lg font-bold text-red-400">{metrics.contaminatedGrows}</p>
            <p className="text-xs text-zinc-400">Contaminated</p>
          </div>
          <div className="text-center p-2 bg-zinc-500/10 rounded-lg border border-zinc-500/30">
            <p className="text-lg font-bold text-zinc-400">{metrics.abortedGrows}</p>
            <p className="text-xs text-zinc-400">Aborted</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Success Rate"
          value={formatNumber(metrics.successRate)}
          unit="%"
          icon={<Icons.Target />}
          color={successGrade.color}
        />
        <MetricCard
          label="Contamination Rate"
          value={formatNumber(metrics.contaminationRate)}
          unit="%"
          icon={<Icons.AlertTriangle />}
          color={metrics.contaminationRate > 20 ? 'text-red-400' : 'text-zinc-300'}
        />
        <MetricCard
          label="Avg BE%"
          value={formatNumber(metrics.avgBiologicalEfficiency)}
          unit="%"
          icon={<Icons.Scale />}
          color={beGrade.color}
          subtext={beGrade.grade}
        />
        <MetricCard
          label="Total Yield"
          value={formatNumber(metrics.totalYield)}
          unit="g"
          icon={<Icons.Award />}
        />
      </div>

      {/* Yield & Timing */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-sm font-medium text-zinc-400 mb-4">Yield Statistics</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-400">Avg per Grow</span>
              <span className="text-white font-medium">{formatNumber(metrics.avgYieldPerGrow)}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Avg per Flush</span>
              <span className="text-white font-medium">{formatNumber(metrics.avgYieldPerFlush)}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Best Yield</span>
              <span className="text-emerald-400 font-medium">{formatNumber(metrics.bestYield)}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Lowest Yield</span>
              <span className="text-zinc-300 font-medium">{formatNumber(metrics.worstYield)}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Avg Flushes</span>
              <span className="text-white font-medium">{formatNumber(metrics.avgFlushesPerGrow, 1)}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-sm font-medium text-zinc-400 mb-4">Timing & Process</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-400">Days to First Harvest</span>
              <span className="text-white font-medium">
                {metrics.avgDaysToFirstHarvest > 0 ? `${Math.round(metrics.avgDaysToFirstHarvest)} days` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Days to Completion</span>
              <span className="text-white font-medium">
                {metrics.avgDaysToCompletion > 0 ? `${Math.round(metrics.avgDaysToCompletion)} days` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Avg Substrate Weight</span>
              <span className="text-white font-medium">{formatNumber(metrics.avgSubstrateWeight)}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Avg Spawn Rate</span>
              <span className="text-white font-medium">{formatNumber(metrics.avgSpawnRate)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flush Breakdown */}
      {metrics.flushBreakdown.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-sm font-medium text-zinc-400 mb-4">Yield by Flush Number</h4>
          <BarChart
            data={metrics.flushBreakdown.map((f, idx) => ({
              label: `Flush ${f.flushNumber}`,
              value: f.avgYield,
              color: idx === 0 ? color : `${color}${Math.max(40, 100 - idx * 20).toString(16)}`,
            }))}
            unit="g"
            height={160}
          />
        </div>
      )}

      {/* Monthly Trend */}
      {metrics.monthlyTrend.length > 1 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-sm font-medium text-zinc-400 mb-4">Monthly Performance</h4>
          <BarChart
            data={metrics.monthlyTrend.map(m => ({
              label: m.month,
              value: m.yields,
              color,
            }))}
            unit="g"
            height={160}
          />
        </div>
      )}

      {/* Preferred Substrates & Containers */}
      <div className="grid md:grid-cols-2 gap-6">
        {metrics.preferredSubstrates.length > 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h4 className="text-sm font-medium text-zinc-400 mb-4">Substrate Performance</h4>
            <HorizontalBarChart
              data={metrics.preferredSubstrates.map((s, idx) => ({
                label: s.name,
                value: s.avgBE,
                subLabel: `${s.count} grow${s.count > 1 ? 's' : ''}`,
                color: generateStrainColor(s.name, idx),
              }))}
              unit="% BE"
            />
          </div>
        )}

        {metrics.preferredContainers.length > 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h4 className="text-sm font-medium text-zinc-400 mb-4">Container Performance</h4>
            <HorizontalBarChart
              data={metrics.preferredContainers.map((c, idx) => ({
                label: c.name,
                value: c.avgBE,
                subLabel: `${c.count} grow${c.count > 1 ? 's' : ''}`,
                color: generateStrainColor(c.name, idx + 10),
              }))}
              unit="% BE"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPARISON VIEW
// ============================================================================

const ComparisonView: React.FC<{
  strainMetrics: StrainMetrics[];
  selectedStrains: string[];
}> = ({ strainMetrics, selectedStrains }) => {
  const selectedData = strainMetrics.filter(m => selectedStrains.includes(m.strainId));

  if (selectedData.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
        <Icons.Info />
        <p className="text-zinc-400 mt-2">Select strains to compare from the list above</p>
      </div>
    );
  }

  const comparisonMetrics: ComparisonData[] = [
    {
      metric: 'Success Rate',
      values: selectedData.map((m, idx) => ({
        strainName: m.strainName,
        value: m.successRate,
        color: generateStrainColor(m.strainName, idx),
      })),
      unit: '%',
      higherIsBetter: true,
    },
    {
      metric: 'Avg BE%',
      values: selectedData.map((m, idx) => ({
        strainName: m.strainName,
        value: m.avgBiologicalEfficiency,
        color: generateStrainColor(m.strainName, idx),
      })),
      unit: '%',
      higherIsBetter: true,
    },
    {
      metric: 'Avg Yield/Grow',
      values: selectedData.map((m, idx) => ({
        strainName: m.strainName,
        value: m.avgYieldPerGrow,
        color: generateStrainColor(m.strainName, idx),
      })),
      unit: 'g',
      higherIsBetter: true,
    },
    {
      metric: 'Contamination Rate',
      values: selectedData.map((m, idx) => ({
        strainName: m.strainName,
        value: m.contaminationRate,
        color: generateStrainColor(m.strainName, idx),
      })),
      unit: '%',
      higherIsBetter: false,
    },
    {
      metric: 'Days to Harvest',
      values: selectedData.map((m, idx) => ({
        strainName: m.strainName,
        value: m.avgDaysToFirstHarvest,
        color: generateStrainColor(m.strainName, idx),
      })),
      unit: ' days',
      higherIsBetter: false,
    },
    {
      metric: 'Avg Flushes',
      values: selectedData.map((m, idx) => ({
        strainName: m.strainName,
        value: m.avgFlushesPerGrow,
        color: generateStrainColor(m.strainName, idx),
      })),
      unit: '',
      higherIsBetter: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {selectedData.map((m, idx) => (
          <div key={m.strainId} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: generateStrainColor(m.strainName, idx) }}
            />
            <span className="text-sm text-zinc-300">{m.strainName}</span>
          </div>
        ))}
      </div>

      {/* Comparison Charts */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comparisonMetrics.map(({ metric, values, unit, higherIsBetter }) => {
          const maxVal = Math.max(...values.map(v => v.value), 1);
          const bestValue = higherIsBetter
            ? Math.max(...values.map(v => v.value))
            : Math.min(...values.filter(v => v.value > 0).map(v => v.value));

          return (
            <div key={metric} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <h4 className="text-sm font-medium text-zinc-400 mb-4">{metric}</h4>
              <div className="space-y-3">
                {values.map((v, idx) => {
                  const isBest = v.value === bestValue && v.value > 0;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={isBest ? 'text-emerald-400 font-medium' : 'text-zinc-300'}>
                          {v.strainName} {isBest && '★'}
                        </span>
                        <span className={isBest ? 'text-emerald-400' : 'text-zinc-400'}>
                          {formatNumber(v.value)}{unit}
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(v.value / maxVal) * 100}%`,
                            backgroundColor: v.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
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

export const StrainPerformanceAnalytics: React.FC = () => {
  const { state, getStrain, getSubstrateType, getContainerType, getSpecies } = useData();
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y' | 'all'>('all');
  const [selectedStrainId, setSelectedStrainId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detail' | 'compare'>('overview');
  const [compareStrains, setCompareStrains] = useState<string[]>([]);

  // Calculate strain metrics
  const strainMetrics = useMemo((): StrainMetrics[] => {
    // Filter grows by time range
    const now = new Date();
    const filterDate = new Date();
    switch (timeRange) {
      case '30d': filterDate.setDate(now.getDate() - 30); break;
      case '90d': filterDate.setDate(now.getDate() - 90); break;
      case '1y': filterDate.setFullYear(now.getFullYear() - 1); break;
      default: filterDate.setFullYear(2000);
    }

    const filteredGrows = state.grows.filter(g =>
      new Date(g.spawnedAt) >= filterDate
    );

    // Group grows by strain
    const strainGrowsMap = new Map<string, Grow[]>();
    filteredGrows.forEach(grow => {
      const existing = strainGrowsMap.get(grow.strainId) || [];
      strainGrowsMap.set(grow.strainId, [...existing, grow]);
    });

    // Calculate metrics for each strain
    return Array.from(strainGrowsMap.entries()).map(([strainId, grows]): StrainMetrics => {
      const strain = getStrain(strainId);
      const species = strain?.speciesId ? getSpecies(strain.speciesId) : undefined;

      // Count by status
      const completedGrows = grows.filter(g =>
        g.status === 'completed' || g.currentStage === 'completed'
      );
      const activeGrows = grows.filter(g =>
        g.status === 'active' && !['completed', 'contaminated', 'aborted'].includes(g.currentStage)
      );
      const contaminatedGrows = grows.filter(g =>
        g.status === 'failed' || g.currentStage === 'contaminated'
      );
      const abortedGrows = grows.filter(g => g.currentStage === 'aborted');

      // Calculate rates
      const finishedGrows = completedGrows.length + contaminatedGrows.length;
      const successRate = finishedGrows > 0
        ? (completedGrows.length / finishedGrows) * 100
        : 0;
      const contaminationRate = finishedGrows > 0
        ? (contaminatedGrows.length / finishedGrows) * 100
        : 0;

      // Yield calculations
      const totalYield = grows.reduce((sum, g) => sum + (g.totalYield || 0), 0);
      const avgYieldPerGrow = completedGrows.length > 0
        ? totalYield / completedGrows.length
        : 0;

      // Collect all flushes
      const allFlushes: Flush[] = grows.flatMap(g => g.flushes || []);
      const totalFlushes = allFlushes.length;
      const avgFlushesPerGrow = completedGrows.length > 0
        ? totalFlushes / completedGrows.length
        : 0;
      const avgYieldPerFlush = totalFlushes > 0
        ? allFlushes.reduce((sum, f) => sum + (f.wetWeight || 0), 0) / totalFlushes
        : 0;

      // BE calculation
      const growsWithBE = completedGrows.filter(g =>
        g.substrateWeight > 0 && g.totalYield > 0
      );
      const avgBiologicalEfficiency = growsWithBE.length > 0
        ? growsWithBE.reduce((sum, g) => sum + (g.totalYield / g.substrateWeight) * 100, 0) / growsWithBE.length
        : 0;

      // Timing calculations
      const growsWithHarvest = completedGrows.filter(g => g.firstHarvestAt && g.spawnedAt);
      const avgDaysToFirstHarvest = growsWithHarvest.length > 0
        ? growsWithHarvest.reduce((sum, g) => {
            const days = (new Date(g.firstHarvestAt!).getTime() - new Date(g.spawnedAt).getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / growsWithHarvest.length
        : 0;

      const growsWithCompletion = completedGrows.filter(g => g.completedAt && g.spawnedAt);
      const avgDaysToCompletion = growsWithCompletion.length > 0
        ? growsWithCompletion.reduce((sum, g) => {
            const days = (new Date(g.completedAt!).getTime() - new Date(g.spawnedAt).getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / growsWithCompletion.length
        : 0;

      // Best/worst yields
      const completedYields = completedGrows.map(g => g.totalYield || 0).filter(y => y > 0);
      const bestYield = completedYields.length > 0 ? Math.max(...completedYields) : 0;
      const worstYield = completedYields.length > 0 ? Math.min(...completedYields) : 0;

      // Substrate/spawn stats
      const avgSubstrateWeight = grows.length > 0
        ? grows.reduce((sum, g) => sum + (g.substrateWeight || 0), 0) / grows.length
        : 0;
      const avgSpawnRate = grows.length > 0
        ? grows.reduce((sum, g) => sum + (g.spawnRate || 0), 0) / grows.length
        : 0;

      // Preferred substrates
      const substrateMap = new Map<string, { count: number; totalBE: number }>();
      growsWithBE.forEach(g => {
        const subType = getSubstrateType(g.substrateTypeId);
        const name = subType?.name || 'Unknown';
        const existing = substrateMap.get(name) || { count: 0, totalBE: 0 };
        substrateMap.set(name, {
          count: existing.count + 1,
          totalBE: existing.totalBE + (g.totalYield / g.substrateWeight) * 100,
        });
      });
      const preferredSubstrates = Array.from(substrateMap.entries())
        .map(([name, data]) => ({
          name,
          count: data.count,
          avgBE: data.totalBE / data.count,
        }))
        .sort((a, b) => b.avgBE - a.avgBE);

      // Preferred containers
      const containerMap = new Map<string, { count: number; totalBE: number }>();
      growsWithBE.forEach(g => {
        const contType = getContainerType(g.containerTypeId);
        const name = contType?.name || 'Unknown';
        const existing = containerMap.get(name) || { count: 0, totalBE: 0 };
        containerMap.set(name, {
          count: existing.count + 1,
          totalBE: existing.totalBE + (g.totalYield / g.substrateWeight) * 100,
        });
      });
      const preferredContainers = Array.from(containerMap.entries())
        .map(([name, data]) => ({
          name,
          count: data.count,
          avgBE: data.totalBE / data.count,
        }))
        .sort((a, b) => b.avgBE - a.avgBE);

      // Monthly trend
      const monthlyMap = new Map<string, { yields: number; grows: number; substrates: number }>();
      grows.forEach(g => {
        const date = new Date(g.spawnedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyMap.get(monthKey) || { yields: 0, grows: 0, substrates: 0 };
        monthlyMap.set(monthKey, {
          yields: existing.yields + (g.totalYield || 0),
          grows: existing.grows + 1,
          substrates: existing.substrates + (g.substrateWeight || 0),
        });
      });
      const monthlyTrend = Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          yields: data.yields,
          grows: data.grows,
          be: data.substrates > 0 ? (data.yields / data.substrates) * 100 : 0,
        }));

      // Flush breakdown
      const flushMap = new Map<number, { total: number; count: number }>();
      allFlushes.forEach(f => {
        const existing = flushMap.get(f.flushNumber) || { total: 0, count: 0 };
        flushMap.set(f.flushNumber, {
          total: existing.total + (f.wetWeight || 0),
          count: existing.count + 1,
        });
      });
      const flushBreakdown = Array.from(flushMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([flushNumber, data]) => ({
          flushNumber,
          avgYield: data.total / data.count,
          count: data.count,
        }));

      return {
        strainId,
        strainName: strain?.name || 'Unknown Strain',
        speciesName: species?.name || strain?.species || 'Unknown Species',
        totalGrows: grows.length,
        completedGrows: completedGrows.length,
        activeGrows: activeGrows.length,
        contaminatedGrows: contaminatedGrows.length,
        abortedGrows: abortedGrows.length,
        successRate,
        contaminationRate,
        totalYield,
        avgYieldPerGrow,
        avgBiologicalEfficiency,
        avgDaysToFirstHarvest,
        avgDaysToCompletion,
        totalFlushes,
        avgFlushesPerGrow,
        avgYieldPerFlush,
        bestYield,
        worstYield,
        avgSubstrateWeight,
        avgSpawnRate,
        preferredSubstrates,
        preferredContainers,
        monthlyTrend,
        flushBreakdown,
      };
    }).sort((a, b) => b.totalGrows - a.totalGrows);
  }, [state.grows, timeRange, getStrain, getSubstrateType, getContainerType, getSpecies]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const withData = strainMetrics.filter(m => m.completedGrows > 0);
    return {
      totalStrains: strainMetrics.length,
      totalGrows: strainMetrics.reduce((sum, m) => sum + m.totalGrows, 0),
      totalYield: strainMetrics.reduce((sum, m) => sum + m.totalYield, 0),
      avgSuccessRate: withData.length > 0
        ? withData.reduce((sum, m) => sum + m.successRate, 0) / withData.length
        : 0,
      avgBE: withData.length > 0
        ? withData.reduce((sum, m) => sum + m.avgBiologicalEfficiency, 0) / withData.length
        : 0,
      bestPerformer: withData.sort((a, b) => b.avgBiologicalEfficiency - a.avgBiologicalEfficiency)[0],
      mostGrows: strainMetrics[0],
    };
  }, [strainMetrics]);

  const selectedMetrics = selectedStrainId
    ? strainMetrics.find(m => m.strainId === selectedStrainId)
    : null;

  const toggleCompareStrain = (strainId: string) => {
    setCompareStrains(prev =>
      prev.includes(strainId)
        ? prev.filter(id => id !== strainId)
        : prev.length < 5 ? [...prev, strainId] : prev
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Strain Performance Analytics</h2>
          <p className="text-zinc-400 text-sm">
            Track success rates, yields, and optimal conditions per strain
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode */}
          <div className="flex bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
            {(['overview', 'detail', 'compare'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm font-medium transition-colors capitalize ${
                  viewMode === mode
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Time Range */}
          <div className="flex bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
            {(['30d', '90d', '1y', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {range === 'all' ? 'All' : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* No Data State */}
      {strainMetrics.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
          <Icons.BarChart />
          <h3 className="text-lg font-medium text-white mt-4">No Grow Data Available</h3>
          <p className="text-zinc-400 mt-2">
            Start tracking grows to see strain performance analytics.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <MetricCard
              label="Strains Tracked"
              value={summaryStats.totalStrains}
              icon={<Icons.Layers />}
            />
            <MetricCard
              label="Total Grows"
              value={summaryStats.totalGrows}
              icon={<Icons.BarChart />}
            />
            <MetricCard
              label="Total Yield"
              value={formatNumber(summaryStats.totalYield)}
              unit="g"
              icon={<Icons.Scale />}
            />
            <MetricCard
              label="Avg Success Rate"
              value={formatNumber(summaryStats.avgSuccessRate)}
              unit="%"
              icon={<Icons.Target />}
              color={getSuccessGrade(summaryStats.avgSuccessRate).color}
            />
            <MetricCard
              label="Avg BE%"
              value={formatNumber(summaryStats.avgBE)}
              unit="%"
              icon={<Icons.Award />}
              color={getBEGrade(summaryStats.avgBE).color}
            />
            {summaryStats.bestPerformer && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500">Top Performer</span>
                  <Icons.Award />
                </div>
                <p className="text-sm font-bold text-emerald-400 truncate">
                  {summaryStats.bestPerformer.strainName}
                </p>
                <p className="text-xs text-zinc-400">
                  {formatNumber(summaryStats.bestPerformer.avgBiologicalEfficiency)}% BE
                </p>
              </div>
            )}
          </div>

          {/* Strain Selector for Detail/Compare views */}
          {(viewMode === 'detail' || viewMode === 'compare') && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-zinc-400">
                  {viewMode === 'detail' ? 'Select a Strain' : 'Select Strains to Compare (max 5)'}
                </h3>
                {viewMode === 'compare' && compareStrains.length > 0 && (
                  <button
                    onClick={() => setCompareStrains([])}
                    className="text-xs text-zinc-500 hover:text-white"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {strainMetrics.map((m, idx) => {
                  const isSelected = viewMode === 'detail'
                    ? selectedStrainId === m.strainId
                    : compareStrains.includes(m.strainId);
                  const color = generateStrainColor(m.strainName, idx);

                  return (
                    <button
                      key={m.strainId}
                      onClick={() => {
                        if (viewMode === 'detail') {
                          setSelectedStrainId(isSelected ? null : m.strainId);
                        } else {
                          toggleCompareStrain(m.strainId);
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                      } border`}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span>{m.strainName}</span>
                      <span className="text-xs text-zinc-500">({m.totalGrows})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* View Content */}
          {viewMode === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Strain Rankings by BE */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                  <Icons.Award />
                  Strain Rankings (by Avg BE%)
                </h3>
                <HorizontalBarChart
                  data={strainMetrics
                    .filter(m => m.avgBiologicalEfficiency > 0)
                    .sort((a, b) => b.avgBiologicalEfficiency - a.avgBiologicalEfficiency)
                    .slice(0, 8)
                    .map((m, idx) => ({
                      label: m.strainName,
                      value: m.avgBiologicalEfficiency,
                      subLabel: `${m.completedGrows} completed • ${formatNumber(m.totalYield)}g total`,
                      color: generateStrainColor(m.strainName, idx),
                    }))}
                  unit="% BE"
                />
              </div>

              {/* Success Rate Rankings */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                  <Icons.Target />
                  Success Rate Rankings
                </h3>
                <HorizontalBarChart
                  data={strainMetrics
                    .filter(m => m.completedGrows + m.contaminatedGrows > 0)
                    .sort((a, b) => b.successRate - a.successRate)
                    .slice(0, 8)
                    .map((m, idx) => ({
                      label: m.strainName,
                      value: m.successRate,
                      subLabel: `${m.completedGrows}/${m.completedGrows + m.contaminatedGrows} successful`,
                      color: generateStrainColor(m.strainName, idx),
                    }))}
                  unit="%"
                  maxValue={100}
                />
              </div>

              {/* Grow Distribution */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                  <Icons.Layers />
                  Grow Distribution by Strain
                </h3>
                <div className="flex items-center justify-center">
                  <DonutChart
                    data={strainMetrics.slice(0, 6).map((m, idx) => ({
                      label: m.strainName,
                      value: m.totalGrows,
                      color: generateStrainColor(m.strainName, idx),
                    }))}
                    size={160}
                  />
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {strainMetrics.slice(0, 6).map((m, idx) => (
                    <div key={m.strainId} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: generateStrainColor(m.strainName, idx) }}
                      />
                      <span className="text-xs text-zinc-400">{m.strainName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contamination Analysis */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                  <Icons.AlertTriangle />
                  Contamination Rates
                </h3>
                <HorizontalBarChart
                  data={strainMetrics
                    .filter(m => m.completedGrows + m.contaminatedGrows >= 2)
                    .sort((a, b) => b.contaminationRate - a.contaminationRate)
                    .slice(0, 6)
                    .map((m, idx) => ({
                      label: m.strainName,
                      value: m.contaminationRate,
                      subLabel: `${m.contaminatedGrows} of ${m.completedGrows + m.contaminatedGrows} grows`,
                      color: m.contaminationRate > 30 ? '#ef4444' : m.contaminationRate > 15 ? '#f59e0b' : '#10b981',
                    }))}
                  unit="%"
                  maxValue={100}
                />
              </div>
            </div>
          )}

          {viewMode === 'detail' && selectedMetrics && (
            <StrainDetailPanel
              metrics={selectedMetrics}
              color={generateStrainColor(selectedMetrics.strainName, 0)}
            />
          )}

          {viewMode === 'detail' && !selectedMetrics && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
              <Icons.BarChart />
              <h3 className="text-lg font-medium text-white mt-4">Select a Strain</h3>
              <p className="text-zinc-400 mt-2">
                Click on a strain above to view detailed performance analytics.
              </p>
            </div>
          )}

          {viewMode === 'compare' && (
            <ComparisonView
              strainMetrics={strainMetrics}
              selectedStrains={compareStrains}
            />
          )}

          {/* Insights Section */}
          {viewMode === 'overview' && strainMetrics.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Key Insights</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {summaryStats.bestPerformer && (
                  <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-lg">
                    <p className="text-sm text-emerald-400 font-medium mb-1">
                      Best Biological Efficiency
                    </p>
                    <p className="text-lg font-bold text-white">
                      {summaryStats.bestPerformer.strainName}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {formatNumber(summaryStats.bestPerformer.avgBiologicalEfficiency)}% BE avg
                      • {summaryStats.bestPerformer.completedGrows} completed grows
                    </p>
                  </div>
                )}

                {(() => {
                  const lowestContam = strainMetrics
                    .filter(m => m.completedGrows + m.contaminatedGrows >= 3)
                    .sort((a, b) => a.contaminationRate - b.contaminationRate)[0];
                  return lowestContam ? (
                    <div className="p-4 bg-blue-950/30 border border-blue-800/50 rounded-lg">
                      <p className="text-sm text-blue-400 font-medium mb-1">
                        Most Reliable
                      </p>
                      <p className="text-lg font-bold text-white">{lowestContam.strainName}</p>
                      <p className="text-xs text-zinc-400">
                        Only {formatNumber(lowestContam.contaminationRate)}% contamination rate
                        • {lowestContam.successRate.toFixed(0)}% success
                      </p>
                    </div>
                  ) : null;
                })()}

                {(() => {
                  const highestYield = strainMetrics
                    .filter(m => m.completedGrows >= 2)
                    .sort((a, b) => b.avgYieldPerGrow - a.avgYieldPerGrow)[0];
                  return highestYield ? (
                    <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-lg">
                      <p className="text-sm text-amber-400 font-medium mb-1">
                        Highest Yielder
                      </p>
                      <p className="text-lg font-bold text-white">{highestYield.strainName}</p>
                      <p className="text-xs text-zinc-400">
                        {formatNumber(highestYield.avgYieldPerGrow)}g average per grow
                        • {formatNumber(highestYield.totalYield)}g total
                      </p>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StrainPerformanceAnalytics;
