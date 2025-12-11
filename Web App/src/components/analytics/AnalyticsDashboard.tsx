// ============================================================================
// ANALYTICS DASHBOARD
// Comprehensive data visualization for mycology lab performance
// ============================================================================

import React, { useState, useMemo } from 'react';

// Types for analytics data
interface GrowRecord {
  id: string;
  strain: string;
  substrate: string;
  spawnType: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'contaminated' | 'aborted';
  totalYield: number;
  flushCount: number;
  drySubstrateWeight: number;
  cost: number;
  location: string;
}

interface MonthlyData {
  month: string;
  yields: number;
  grows: number;
  contaminations: number;
  successRate: number;
  avgBE: number;
}

interface StrainPerformance {
  strain: string;
  avgBE: number;
  totalYield: number;
  growCount: number;
  successRate: number;
  avgDaysToHarvest: number;
  color: string;
}

// Sample data
const sampleGrows: GrowRecord[] = [
  { id: 'g1', strain: 'B+', substrate: 'CVG', spawnType: 'Oat Groats', startDate: new Date('2024-09-01'), endDate: new Date('2024-10-15'), status: 'completed', totalYield: 600, flushCount: 3, drySubstrateWeight: 450, cost: 25, location: 'Fruiting Chamber' },
  { id: 'g2', strain: 'B+', substrate: 'Manure', spawnType: 'Rye', startDate: new Date('2024-09-15'), endDate: new Date('2024-11-01'), status: 'completed', totalYield: 565, flushCount: 2, drySubstrateWeight: 500, cost: 30, location: 'Fruiting Chamber' },
  { id: 'g3', strain: 'Penis Envy', substrate: 'CVG', spawnType: 'Rye', startDate: new Date('2024-10-01'), endDate: new Date('2024-11-20'), status: 'completed', totalYield: 243, flushCount: 2, drySubstrateWeight: 300, cost: 22, location: 'Fruiting Chamber' },
  { id: 'g4', strain: 'JMF', substrate: 'CVG', spawnType: 'Oat Groats', startDate: new Date('2024-10-15'), endDate: new Date('2024-12-01'), status: 'completed', totalYield: 210, flushCount: 1, drySubstrateWeight: 400, cost: 24, location: 'Fruiting Chamber' },
  { id: 'g5', strain: 'Blue Oyster', substrate: 'Masters Mix', spawnType: 'Wheat', startDate: new Date('2024-10-20'), endDate: new Date('2024-11-25'), status: 'completed', totalYield: 900, flushCount: 2, drySubstrateWeight: 600, cost: 18, location: 'Fruiting Chamber' },
  { id: 'g6', strain: 'B+', substrate: 'CVG', spawnType: 'Oat Groats', startDate: new Date('2024-11-01'), status: 'contaminated', totalYield: 0, flushCount: 0, drySubstrateWeight: 450, cost: 25, location: 'Incubator' },
  { id: 'g7', strain: 'Penis Envy', substrate: 'CVG', spawnType: 'Rye', startDate: new Date('2024-11-10'), status: 'active', totalYield: 0, flushCount: 0, drySubstrateWeight: 350, cost: 26, location: 'Incubator' },
  { id: 'g8', strain: 'Enoki', substrate: 'Sawdust', spawnType: 'Wheat', startDate: new Date('2024-11-15'), endDate: new Date('2024-12-10'), status: 'completed', totalYield: 180, flushCount: 1, drySubstrateWeight: 400, cost: 15, location: 'Fruiting Chamber' },
  { id: 'g9', strain: 'B+', substrate: 'CVG', spawnType: 'Popcorn', startDate: new Date('2024-11-20'), status: 'active', totalYield: 0, flushCount: 0, drySubstrateWeight: 500, cost: 28, location: 'Fruiting Chamber' },
  { id: 'g10', strain: 'Blue Oyster', substrate: 'Straw', spawnType: 'Wheat', startDate: new Date('2024-12-01'), status: 'active', totalYield: 0, flushCount: 0, drySubstrateWeight: 800, cost: 12, location: 'Incubator' },
];

const strainColors: Record<string, string> = {
  'B+': '#10b981',
  'Penis Envy': '#8b5cf6',
  'JMF': '#f59e0b',
  'Blue Oyster': '#3b82f6',
  'Enoki': '#ec4899',
};

// Icons
const Icons = {
  TrendingUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  TrendingDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  BarChart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  PieChart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  Activity: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Award: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  Target: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Zap: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Filter: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  ChevronDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="6 9 12 15 18 9"/></svg>,
};

// Simple bar chart component
const BarChart: React.FC<{
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  showValues?: boolean;
  height?: number;
}> = ({ data, maxValue, showValues = true, height = 200 }) => {
  const max = maxValue || Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, idx) => {
        const barHeight = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col items-center justify-end" style={{ height: height - 40 }}>
              {showValues && item.value > 0 && (
                <span className="text-xs text-zinc-400 mb-1">{item.value}</span>
              )}
              <div
                className="w-full rounded-t-md transition-all duration-500 hover:opacity-80"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: item.color || '#10b981',
                  minHeight: item.value > 0 ? 4 : 0,
                }}
              />
            </div>
            <span className="text-xs text-zinc-500 truncate max-w-full">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// Donut chart component
const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}> = ({ data, size = 160, thickness = 24 }) => {
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
        <span className="text-2xl font-bold text-white">{total}</span>
        <span className="text-xs text-zinc-500">Total</span>
      </div>
    </div>
  );
};

// Sparkline component
const Sparkline: React.FC<{
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}> = ({ data, color = '#10b981', height = 40, width = 100 }) => {
  if (data.length === 0) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
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
      {/* End dot */}
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={color}
      />
    </svg>
  );
};

// Progress ring component
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

// Heatmap calendar component
const HeatmapCalendar: React.FC<{
  data: { date: Date; value: number }[];
  months?: number;
}> = ({ data, months = 3 }) => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - months);
  
  // Generate weeks
  const weeks: { date: Date; value: number }[][] = [];
  let currentWeek: { date: Date; value: number }[] = [];
  
  const current = new Date(startDate);
  current.setDate(current.getDate() - current.getDay()); // Start from Sunday
  
  while (current <= today) {
    const dayData = data.find(d => 
      d.date.toDateString() === current.toDateString()
    );
    currentWeek.push({
      date: new Date(current),
      value: dayData?.value || 0
    });
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    current.setDate(current.getDate() + 1);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  const getColor = (value: number) => {
    if (value === 0) return 'bg-zinc-800';
    const intensity = value / maxValue;
    if (intensity < 0.25) return 'bg-emerald-900/50';
    if (intensity < 0.5) return 'bg-emerald-700/60';
    if (intensity < 0.75) return 'bg-emerald-500/70';
    return 'bg-emerald-400';
  };
  
  return (
    <div className="flex gap-1">
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="flex flex-col gap-1">
          {week.map((day, dayIdx) => (
            <div
              key={dayIdx}
              className={`w-3 h-3 rounded-sm ${getColor(day.value)} transition-colors hover:ring-1 hover:ring-white/30`}
              title={`${day.date.toLocaleDateString()}: ${day.value}g`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Horizontal bar chart for rankings
const RankingChart: React.FC<{
  data: { label: string; value: number; subLabel?: string; color?: string }[];
  unit?: string;
  maxValue?: number;
}> = ({ data, unit = '', maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const width = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 w-4">{idx + 1}.</span>
                <span className="text-white">{item.label}</span>
              </div>
              <span className="text-zinc-400">{item.value}{unit}</span>
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

export const AnalyticsDashboard: React.FC = () => {
  const [grows] = useState<GrowRecord[]>(sampleGrows);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y' | 'all'>('90d');
  const [selectedStrain, setSelectedStrain] = useState<string | 'all'>('all');

  // Calculate analytics
  const analytics = useMemo(() => {
    // Filter by time range
    const now = new Date();
    const filterDate = new Date();
    switch (timeRange) {
      case '30d': filterDate.setDate(now.getDate() - 30); break;
      case '90d': filterDate.setDate(now.getDate() - 90); break;
      case '1y': filterDate.setFullYear(now.getFullYear() - 1); break;
      default: filterDate.setFullYear(2000);
    }
    
    let filteredGrows = grows.filter(g => g.startDate >= filterDate);
    if (selectedStrain !== 'all') {
      filteredGrows = filteredGrows.filter(g => g.strain === selectedStrain);
    }

    // Basic stats
    const completedGrows = filteredGrows.filter(g => g.status === 'completed');
    const contaminatedGrows = filteredGrows.filter(g => g.status === 'contaminated');
    const activeGrows = filteredGrows.filter(g => g.status === 'active');
    
    const totalYield = completedGrows.reduce((sum, g) => sum + g.totalYield, 0);
    const totalCost = filteredGrows.reduce((sum, g) => sum + g.cost, 0);
    const avgBE = completedGrows.length > 0
      ? completedGrows.reduce((sum, g) => sum + (g.totalYield / g.drySubstrateWeight) * 100, 0) / completedGrows.length
      : 0;
    const successRate = filteredGrows.length > 0
      ? (completedGrows.length / (completedGrows.length + contaminatedGrows.length)) * 100
      : 0;
    const costPerGram = totalYield > 0 ? totalCost / totalYield : 0;

    // Strain performance
    const strainMap = new Map<string, GrowRecord[]>();
    completedGrows.forEach(g => {
      const existing = strainMap.get(g.strain) || [];
      strainMap.set(g.strain, [...existing, g]);
    });
    
    const strainPerformance: StrainPerformance[] = Array.from(strainMap.entries()).map(([strain, strainGrows]) => {
      const totalYield = strainGrows.reduce((sum, g) => sum + g.totalYield, 0);
      const totalSubstrate = strainGrows.reduce((sum, g) => sum + g.drySubstrateWeight, 0);
      const avgDays = strainGrows.reduce((sum, g) => {
        if (g.endDate) {
          return sum + Math.floor((g.endDate.getTime() - g.startDate.getTime()) / (1000 * 60 * 60 * 24));
        }
        return sum;
      }, 0) / strainGrows.length;
      
      return {
        strain,
        avgBE: Math.round((totalYield / totalSubstrate) * 100),
        totalYield,
        growCount: strainGrows.length,
        successRate: 100, // All these are completed
        avgDaysToHarvest: Math.round(avgDays),
        color: strainColors[strain] || '#6b7280',
      };
    }).sort((a, b) => b.avgBE - a.avgBE);

    // Monthly data
    const monthlyMap = new Map<string, { yields: number; grows: number; contaminations: number; substrates: number }>();
    filteredGrows.forEach(g => {
      const monthKey = `${g.startDate.getFullYear()}-${String(g.startDate.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyMap.get(monthKey) || { yields: 0, grows: 0, contaminations: 0, substrates: 0 };
      monthlyMap.set(monthKey, {
        yields: existing.yields + g.totalYield,
        grows: existing.grows + 1,
        contaminations: existing.contaminations + (g.status === 'contaminated' ? 1 : 0),
        substrates: existing.substrates + g.drySubstrateWeight,
      });
    });
    
    const monthlyData: MonthlyData[] = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        yields: data.yields,
        grows: data.grows,
        contaminations: data.contaminations,
        successRate: data.grows > 0 ? Math.round(((data.grows - data.contaminations) / data.grows) * 100) : 0,
        avgBE: data.substrates > 0 ? Math.round((data.yields / data.substrates) * 100) : 0,
      }));

    // Substrate comparison
    const substrateMap = new Map<string, { totalYield: number; totalSubstrate: number; count: number }>();
    completedGrows.forEach(g => {
      const existing = substrateMap.get(g.substrate) || { totalYield: 0, totalSubstrate: 0, count: 0 };
      substrateMap.set(g.substrate, {
        totalYield: existing.totalYield + g.totalYield,
        totalSubstrate: existing.totalSubstrate + g.drySubstrateWeight,
        count: existing.count + 1,
      });
    });
    
    const substratePerformance = Array.from(substrateMap.entries())
      .map(([substrate, data]) => ({
        label: substrate,
        value: Math.round((data.totalYield / data.totalSubstrate) * 100),
        subLabel: `${data.count} grow${data.count > 1 ? 's' : ''}`,
        color: substrate === 'CVG' ? '#10b981' : substrate === 'Masters Mix' ? '#3b82f6' : '#f59e0b',
      }))
      .sort((a, b) => b.value - a.value);

    // Status distribution for donut
    const statusDistribution = [
      { label: 'Completed', value: completedGrows.length, color: '#10b981' },
      { label: 'Active', value: activeGrows.length, color: '#3b82f6' },
      { label: 'Contaminated', value: contaminatedGrows.length, color: '#ef4444' },
    ].filter(s => s.value > 0);

    // Harvest heatmap data
    const harvestData = completedGrows
      .filter(g => g.endDate)
      .map(g => ({ date: g.endDate!, value: g.totalYield }));

    // Yield sparkline data (last 6 months)
    const yieldTrend = monthlyData.slice(-6).map(m => m.yields);

    return {
      totalGrows: filteredGrows.length,
      completedGrows: completedGrows.length,
      activeGrows: activeGrows.length,
      contaminatedGrows: contaminatedGrows.length,
      totalYield,
      totalCost,
      avgBE: Math.round(avgBE),
      successRate: Math.round(successRate),
      costPerGram: Math.round(costPerGram * 100) / 100,
      strainPerformance,
      monthlyData,
      substratePerformance,
      statusDistribution,
      harvestData,
      yieldTrend,
    };
  }, [grows, timeRange, selectedStrain]);

  const uniqueStrains = [...new Set(grows.map(g => g.strain))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics</h2>
          <p className="text-zinc-400 text-sm">Performance insights and data visualization</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Strain Filter */}
          <select
            value={selectedStrain}
            onChange={e => setSelectedStrain(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Strains</option>
            {uniqueStrains.map(strain => (
              <option key={strain} value={strain}>{strain}</option>
            ))}
          </select>
          
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
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Total Yield</span>
            <Icons.TrendingUp />
          </div>
          <p className="text-2xl font-bold text-white">{analytics.totalYield.toLocaleString()}g</p>
          <Sparkline data={analytics.yieldTrend} height={30} width={80} />
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Avg BE%</span>
            <Icons.Target />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{analytics.avgBE}%</p>
          <p className="text-xs text-zinc-500 mt-1">
            {analytics.avgBE >= 100 ? '✓ Above average' : 'Room to improve'}
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Success Rate</span>
            <Icons.Award />
          </div>
          <p className={`text-2xl font-bold ${analytics.successRate >= 80 ? 'text-emerald-400' : analytics.successRate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {analytics.successRate}%
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {analytics.completedGrows}/{analytics.completedGrows + analytics.contaminatedGrows} completed
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Cost/Gram</span>
            <Icons.Zap />
          </div>
          <p className="text-2xl font-bold text-white">${analytics.costPerGram}</p>
          <p className="text-xs text-zinc-500 mt-1">${analytics.totalCost} total invested</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Active Grows</span>
            <Icons.Activity />
          </div>
          <p className="text-2xl font-bold text-blue-400">{analytics.activeGrows}</p>
          <p className="text-xs text-zinc-500 mt-1">In progress</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Total Grows</span>
            <Icons.Calendar />
          </div>
          <p className="text-2xl font-bold text-white">{analytics.totalGrows}</p>
          <p className="text-xs text-zinc-500 mt-1">{analytics.contaminatedGrows} contaminated</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Monthly Yields */}
        <div className="md:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
            <Icons.BarChart />
            Monthly Yields (g)
          </h3>
          <BarChart
            data={analytics.monthlyData.map(m => ({
              label: m.month,
              value: m.yields,
              color: '#10b981'
            }))}
            height={180}
          />
        </div>

        {/* Status Distribution */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
            <Icons.PieChart />
            Grow Status
          </h3>
          <div className="flex items-center justify-center">
            <DonutChart data={analytics.statusDistribution} />
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {analytics.statusDistribution.map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-zinc-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strain Performance */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Strain Performance (BE%)</h3>
          <RankingChart
            data={analytics.strainPerformance.map(s => ({
              label: s.strain,
              value: s.avgBE,
              subLabel: `${s.growCount} grow${s.growCount > 1 ? 's' : ''} • ${s.totalYield}g total`,
              color: s.color,
            }))}
            unit="%"
          />
        </div>

        {/* Substrate Comparison */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Substrate Performance (BE%)</h3>
          <RankingChart data={analytics.substratePerformance} unit="%" />
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Monthly BE Trend */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Monthly Avg BE%</h3>
          <BarChart
            data={analytics.monthlyData.map(m => ({
              label: m.month,
              value: m.avgBE,
              color: m.avgBE >= 100 ? '#10b981' : m.avgBE >= 75 ? '#f59e0b' : '#ef4444'
            }))}
            height={140}
          />
        </div>

        {/* Success Rate Trend */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Monthly Success Rate</h3>
          <BarChart
            data={analytics.monthlyData.map(m => ({
              label: m.month,
              value: m.successRate,
              color: m.successRate >= 80 ? '#10b981' : m.successRate >= 60 ? '#f59e0b' : '#ef4444'
            }))}
            maxValue={100}
            height={140}
          />
        </div>

        {/* Quick Stats */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Performance Goals</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <ProgressRing
              value={analytics.avgBE}
              max={150}
              color="#10b981"
              label="BE%"
            />
            <ProgressRing
              value={analytics.successRate}
              max={100}
              color="#3b82f6"
              label="Success"
            />
          </div>
        </div>
      </div>

      {/* Harvest Activity Heatmap */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Harvest Activity (Last 3 Months)</h3>
        <div className="flex items-start gap-4">
          <HeatmapCalendar data={analytics.harvestData} months={3} />
          <div className="flex flex-col gap-1 text-xs text-zinc-500">
            <span>More harvests →</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-zinc-800" />
              <div className="w-3 h-3 rounded-sm bg-emerald-900/50" />
              <div className="w-3 h-3 rounded-sm bg-emerald-700/60" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">🔍 Key Insights</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {analytics.strainPerformance[0] && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-lg">
              <p className="text-sm text-emerald-400 font-medium mb-1">Top Performing Strain</p>
              <p className="text-lg font-bold text-white">{analytics.strainPerformance[0].strain}</p>
              <p className="text-xs text-zinc-400">{analytics.strainPerformance[0].avgBE}% BE average</p>
            </div>
          )}
          
          {analytics.substratePerformance[0] && (
            <div className="p-4 bg-blue-950/30 border border-blue-800/50 rounded-lg">
              <p className="text-sm text-blue-400 font-medium mb-1">Best Substrate</p>
              <p className="text-lg font-bold text-white">{analytics.substratePerformance[0].label}</p>
              <p className="text-xs text-zinc-400">{analytics.substratePerformance[0].value}% BE average</p>
            </div>
          )}
          
          <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
            <p className="text-sm text-zinc-400 font-medium mb-1">Efficiency Score</p>
            <p className="text-lg font-bold text-white">
              {analytics.costPerGram > 0 ? `$${analytics.costPerGram}/g` : 'N/A'}
            </p>
            <p className="text-xs text-zinc-400">
              {analytics.costPerGram < 0.05 ? 'Excellent efficiency!' : 
               analytics.costPerGram < 0.10 ? 'Good efficiency' : 'Room to optimize'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
