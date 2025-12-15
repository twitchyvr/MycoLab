// ============================================================================
// HARVEST FORECASTING - Stage Prediction & 7-Day Harvest Calendar (dev-041)
// Predict stage transitions, forecast yields, and view upcoming harvests
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useData } from '../../store';
import type { Grow, GrowStage, Strain, Species } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface StagePrediction {
  growId: string;
  growName: string;
  strainName: string;
  currentStage: GrowStage;
  predictedNextStage: GrowStage | null;
  daysInCurrentStage: number;
  expectedDaysRemaining: number;
  predictedTransitionDate: Date;
  confidence: 'low' | 'medium' | 'high';
  isOverdue: boolean;
}

interface DayForecast {
  date: Date;
  expectedHarvestGrams: number;
  growsHarvesting: number;
  stageTransitions: StagePrediction[];
  confidence: 'low' | 'medium' | 'high';
}

interface ForecastSummary {
  totalExpectedHarvest: number;
  peakDay: { date: Date; amount: number } | null;
  upcomingTransitions: number;
  overdueGrows: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FORECAST_DAYS = 14; // Extended to 14 days for better planning

const stageConfig: Record<GrowStage, {
  label: string;
  icon: string;
  color: string;
  nextStage: GrowStage | null;
  typicalDaysMin: number;
  typicalDaysMax: number;
}> = {
  spawning: {
    label: 'Spawning',
    icon: '🌱',
    color: 'text-purple-400 bg-purple-950/50',
    nextStage: 'colonization',
    typicalDaysMin: 1,
    typicalDaysMax: 3
  },
  colonization: {
    label: 'Colonization',
    icon: '🔵',
    color: 'text-blue-400 bg-blue-950/50',
    nextStage: 'fruiting',
    typicalDaysMin: 14,
    typicalDaysMax: 28
  },
  fruiting: {
    label: 'Fruiting',
    icon: '🍄',
    color: 'text-emerald-400 bg-emerald-950/50',
    nextStage: 'harvesting',
    typicalDaysMin: 5,
    typicalDaysMax: 10
  },
  harvesting: {
    label: 'Harvesting',
    icon: '✂️',
    color: 'text-amber-400 bg-amber-950/50',
    nextStage: 'completed',
    typicalDaysMin: 3,
    typicalDaysMax: 7
  },
  completed: {
    label: 'Completed',
    icon: '✅',
    color: 'text-green-400 bg-green-950/50',
    nextStage: null,
    typicalDaysMin: 0,
    typicalDaysMax: 0
  },
  contaminated: {
    label: 'Contaminated',
    icon: '☠️',
    color: 'text-red-400 bg-red-950/50',
    nextStage: null,
    typicalDaysMin: 0,
    typicalDaysMax: 0
  },
  aborted: {
    label: 'Aborted',
    icon: '⛔',
    color: 'text-zinc-400 bg-zinc-800',
    nextStage: null,
    typicalDaysMin: 0,
    typicalDaysMax: 0
  },
};

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  TrendingUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Scale: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13"/></svg>,
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="9 18 15 12 9 6"/></svg>,
  ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Info: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Mushroom: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 2L12 22"/><path d="M17 7C17 7 13 9 12 14"/><path d="M7 7C7 7 11 9 12 14"/></svg>,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getStageStartDate(grow: Grow, stage: GrowStage): Date | null {
  switch (stage) {
    case 'spawning':
      return new Date(grow.spawnedAt);
    case 'colonization':
      return grow.colonizationStartedAt ? new Date(grow.colonizationStartedAt) : null;
    case 'fruiting':
      return grow.fruitingStartedAt ? new Date(grow.fruitingStartedAt) : null;
    case 'harvesting':
      return grow.firstHarvestAt ? new Date(grow.firstHarvestAt) : null;
    default:
      return null;
  }
}

function getDaysInStage(grow: Grow): number {
  const stageStart = getStageStartDate(grow, grow.currentStage);
  if (!stageStart) {
    // Fallback to spawned date if stage date not set
    return Math.floor((Date.now() - new Date(grow.spawnedAt).getTime()) / (1000 * 60 * 60 * 24));
  }
  return Math.floor((Date.now() - stageStart.getTime()) / (1000 * 60 * 60 * 24));
}

function getExpectedStageDays(stage: GrowStage, strain?: Strain): { min: number; max: number; typical: number } {
  const config = stageConfig[stage];

  // Use strain-specific data if available
  if (strain) {
    if (stage === 'colonization' && strain.colonizationDays) {
      return {
        min: strain.colonizationDays.min,
        max: strain.colonizationDays.max,
        typical: Math.round((strain.colonizationDays.min + strain.colonizationDays.max) / 2)
      };
    }
    if (stage === 'fruiting' && strain.fruitingDays) {
      return {
        min: strain.fruitingDays.min,
        max: strain.fruitingDays.max,
        typical: Math.round((strain.fruitingDays.min + strain.fruitingDays.max) / 2)
      };
    }
  }

  // Fall back to defaults
  return {
    min: config.typicalDaysMin,
    max: config.typicalDaysMax,
    typical: Math.round((config.typicalDaysMin + config.typicalDaysMax) / 2)
  };
}

function calculateConfidence(daysInStage: number, expectedDays: { min: number; max: number }): 'low' | 'medium' | 'high' {
  const midpoint = (expectedDays.min + expectedDays.max) / 2;
  const range = expectedDays.max - expectedDays.min;

  // If within expected range with good data, high confidence
  if (daysInStage >= expectedDays.min * 0.8 && daysInStage <= expectedDays.max * 1.2) {
    return 'high';
  }
  // If close to expected, medium confidence
  if (daysInStage >= expectedDays.min * 0.5 && daysInStage <= expectedDays.max * 1.5) {
    return 'medium';
  }
  // Otherwise low confidence
  return 'low';
}

function estimateHarvestWeight(grow: Grow, daysFromNow: number): number {
  // Base estimate on substrate weight and typical BE%
  const baseWeight = grow.substrateWeight;

  // Different multipliers based on stage and timing
  if (grow.currentStage === 'harvesting') {
    // Already harvesting - expect continuing harvests
    return baseWeight * 0.15; // ~15% of substrate per day during harvest
  }

  if (grow.currentStage === 'fruiting') {
    const daysInFruiting = getDaysInStage(grow);
    // As we get closer to expected harvest, increase confidence
    if (daysInFruiting + daysFromNow >= 5) {
      return baseWeight * 0.5; // ~50% BE expected
    }
    return baseWeight * 0.3; // Lower estimate early in fruiting
  }

  return 0; // Not fruiting/harvesting yet
}

// ============================================================================
// HOOKS
// ============================================================================

function useForecastData() {
  const { state, getStrain } = useData();
  const grows = state.grows;

  // Calculate predictions for all active grows
  const predictions = useMemo<StagePrediction[]>(() => {
    return grows
      .filter(g => g.status === 'active' && !['completed', 'contaminated', 'aborted'].includes(g.currentStage))
      .map(grow => {
        const strain = getStrain(grow.strainId);
        const daysInCurrentStage = getDaysInStage(grow);
        const expectedDays = getExpectedStageDays(grow.currentStage, strain);
        const config = stageConfig[grow.currentStage];

        const expectedDaysRemaining = Math.max(0, expectedDays.typical - daysInCurrentStage);
        const predictedTransitionDate = new Date();
        predictedTransitionDate.setDate(predictedTransitionDate.getDate() + expectedDaysRemaining);

        const isOverdue = daysInCurrentStage > expectedDays.max;

        return {
          growId: grow.id,
          growName: grow.name,
          strainName: strain?.name || 'Unknown Strain',
          currentStage: grow.currentStage,
          predictedNextStage: config.nextStage,
          daysInCurrentStage,
          expectedDaysRemaining,
          predictedTransitionDate,
          confidence: calculateConfidence(daysInCurrentStage, expectedDays),
          isOverdue,
        };
      })
      .sort((a, b) => a.predictedTransitionDate.getTime() - b.predictedTransitionDate.getTime());
  }, [grows, getStrain]);

  // Generate 14-day forecast
  const dailyForecast = useMemo<DayForecast[]>(() => {
    const forecast: DayForecast[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < FORECAST_DAYS; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Find stage transitions expected on this day
      const transitions = predictions.filter(p => {
        const transitionDate = new Date(p.predictedTransitionDate);
        transitionDate.setHours(0, 0, 0, 0);
        return transitionDate.getTime() === date.getTime();
      });

      // Calculate expected harvest for this day
      const harvestingGrows = grows.filter(g =>
        g.status === 'active' &&
        ['fruiting', 'harvesting'].includes(g.currentStage)
      );

      let expectedHarvest = 0;
      harvestingGrows.forEach(grow => {
        expectedHarvest += estimateHarvestWeight(grow, i);
      });

      // Determine overall confidence for the day
      let confidence: 'low' | 'medium' | 'high' = 'high';
      if (transitions.length > 0) {
        const lowCount = transitions.filter(t => t.confidence === 'low').length;
        const medCount = transitions.filter(t => t.confidence === 'medium').length;
        if (lowCount > medCount) confidence = 'low';
        else if (medCount > 0) confidence = 'medium';
      }
      if (i > 7) confidence = confidence === 'high' ? 'medium' : 'low'; // Less confident further out

      forecast.push({
        date,
        expectedHarvestGrams: Math.round(expectedHarvest),
        growsHarvesting: harvestingGrows.length,
        stageTransitions: transitions,
        confidence,
      });
    }

    return forecast;
  }, [predictions, grows]);

  // Calculate summary stats
  const summary = useMemo<ForecastSummary>(() => {
    const totalExpectedHarvest = dailyForecast
      .slice(0, 7) // 7-day total
      .reduce((sum, day) => sum + day.expectedHarvestGrams, 0);

    const peakDay = dailyForecast.reduce((max, day) => {
      if (!max || day.expectedHarvestGrams > max.amount) {
        return { date: day.date, amount: day.expectedHarvestGrams };
      }
      return max;
    }, null as { date: Date; amount: number } | null);

    const upcomingTransitions = predictions.filter(p =>
      p.expectedDaysRemaining <= 7 && p.predictedNextStage
    ).length;

    const overdueGrows = predictions.filter(p => p.isOverdue).length;

    return {
      totalExpectedHarvest,
      peakDay,
      upcomingTransitions,
      overdueGrows,
    };
  }, [dailyForecast, predictions]);

  return { predictions, dailyForecast, summary };
}

// ============================================================================
// COMPONENTS
// ============================================================================

const SummaryCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}> = ({ icon, label, value, subValue, color = 'text-white' }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
    <div className="flex items-center gap-3">
      <div className={color}>{icon}</div>
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        {subValue && <p className="text-xs text-zinc-500">{subValue}</p>}
      </div>
    </div>
  </div>
);

const CalendarDay: React.FC<{
  forecast: DayForecast;
  isToday: boolean;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ forecast, isToday, isSelected, onSelect }) => {
  const dayName = forecast.date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = forecast.date.getDate();
  const hasTransitions = forecast.stageTransitions.length > 0;
  const hasHarvest = forecast.expectedHarvestGrams > 0;

  return (
    <button
      onClick={onSelect}
      className={`
        relative flex flex-col items-center p-2 rounded-lg transition-all min-w-[60px]
        ${isSelected ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'}
        border
      `}
    >
      <span className={`text-xs ${isToday ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
        {isToday ? 'Today' : dayName}
      </span>
      <span className={`text-lg font-bold ${isToday ? 'text-white' : 'text-zinc-300'}`}>
        {dayNum}
      </span>

      {/* Indicators */}
      <div className="flex gap-1 mt-1">
        {hasTransitions && (
          <span className="w-2 h-2 rounded-full bg-blue-400" title="Stage transitions" />
        )}
        {hasHarvest && (
          <span className="w-2 h-2 rounded-full bg-emerald-400" title="Expected harvest" />
        )}
      </div>

      {/* Harvest amount */}
      {hasHarvest && (
        <span className="text-xs text-emerald-400 mt-1">
          {forecast.expectedHarvestGrams >= 1000
            ? `${(forecast.expectedHarvestGrams / 1000).toFixed(1)}kg`
            : `${forecast.expectedHarvestGrams}g`
          }
        </span>
      )}

      {/* Confidence indicator */}
      <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
        forecast.confidence === 'high' ? 'bg-emerald-500' :
        forecast.confidence === 'medium' ? 'bg-amber-500' : 'bg-red-500'
      }`} />
    </button>
  );
};

const TransitionCard: React.FC<{
  prediction: StagePrediction;
  onViewGrow?: () => void;
}> = ({ prediction, onViewGrow }) => {
  const currentConfig = stageConfig[prediction.currentStage];
  const nextConfig = prediction.predictedNextStage ? stageConfig[prediction.predictedNextStage] : null;

  return (
    <div className={`bg-zinc-900/50 border rounded-lg p-3 ${prediction.isOverdue ? 'border-amber-500' : 'border-zinc-800'}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-white">{prediction.growName}</h4>
          <p className="text-xs text-zinc-500">{prediction.strainName}</p>
        </div>
        {prediction.isOverdue && (
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
            <Icons.AlertTriangle />
            Overdue
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className={`px-2 py-0.5 rounded ${currentConfig.color}`}>
          {currentConfig.icon} {currentConfig.label}
        </span>
        {nextConfig && (
          <>
            <Icons.ArrowRight />
            <span className={`px-2 py-0.5 rounded ${nextConfig.color}`}>
              {nextConfig.icon} {nextConfig.label}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
        <span>Day {prediction.daysInCurrentStage} in stage</span>
        <span className={`px-1.5 py-0.5 rounded ${
          prediction.confidence === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
          prediction.confidence === 'medium' ? 'bg-amber-500/20 text-amber-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {prediction.confidence} confidence
        </span>
      </div>
    </div>
  );
};

const DayDetail: React.FC<{
  forecast: DayForecast;
}> = ({ forecast }) => {
  const dateStr = forecast.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">{dateStr}</h3>
        <span className={`px-2 py-1 rounded text-xs ${
          forecast.confidence === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
          forecast.confidence === 'medium' ? 'bg-amber-500/20 text-amber-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {forecast.confidence} confidence
        </span>
      </div>

      {/* Harvest Estimate */}
      <div className="bg-zinc-800/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <Icons.Scale />
          <span className="text-sm text-zinc-400">Expected Harvest</span>
        </div>
        <p className="text-2xl font-bold text-emerald-400">
          {forecast.expectedHarvestGrams >= 1000
            ? `${(forecast.expectedHarvestGrams / 1000).toFixed(1)} kg`
            : `${forecast.expectedHarvestGrams} g`
          }
        </p>
        <p className="text-xs text-zinc-500">
          From {forecast.growsHarvesting} grow{forecast.growsHarvesting !== 1 ? 's' : ''} in fruiting/harvest stage
        </p>
      </div>

      {/* Stage Transitions */}
      {forecast.stageTransitions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-400 mb-2 flex items-center gap-2">
            <Icons.Clock />
            Expected Stage Transitions ({forecast.stageTransitions.length})
          </h4>
          <div className="space-y-2">
            {forecast.stageTransitions.map(transition => (
              <TransitionCard key={transition.growId} prediction={transition} />
            ))}
          </div>
        </div>
      )}

      {forecast.stageTransitions.length === 0 && forecast.expectedHarvestGrams === 0 && (
        <div className="text-center py-4 text-zinc-500">
          <Icons.Info />
          <p className="mt-2">No significant events predicted for this day</p>
        </div>
      )}
    </div>
  );
};

const TimelineView: React.FC<{
  predictions: StagePrediction[];
}> = ({ predictions }) => {
  // Group predictions by expected transition date
  const grouped = useMemo(() => {
    const groups: Record<string, StagePrediction[]> = {};
    predictions.forEach(p => {
      const dateKey = p.predictedTransitionDate.toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(p);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(0, 10); // Show next 10 dates with transitions
  }, [predictions]);

  if (grouped.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
        <Icons.Clock />
        <p className="text-zinc-400 mt-2">No active grows to forecast</p>
        <p className="text-xs text-zinc-500 mt-1">Start some grows to see predictions here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([dateStr, items]) => {
        const date = new Date(dateStr);
        const isToday = date.toDateString() === new Date().toDateString();
        const isPast = date < new Date() && !isToday;

        return (
          <div key={dateStr} className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-zinc-800" />

            {/* Timeline dot */}
            <div className={`absolute left-0 top-2 w-4 h-4 rounded-full border-2 ${
              isPast ? 'bg-amber-500 border-amber-400' :
              isToday ? 'bg-emerald-500 border-emerald-400' :
              'bg-zinc-800 border-zinc-600'
            }`} />

            {/* Date header */}
            <div className="mb-2">
              <span className={`text-sm font-semibold ${
                isPast ? 'text-amber-400' :
                isToday ? 'text-emerald-400' : 'text-white'
              }`}>
                {isToday ? 'Today' : date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              {isPast && (
                <span className="ml-2 text-xs text-amber-400">(overdue)</span>
              )}
            </div>

            {/* Transitions */}
            <div className="space-y-2">
              {items.map(prediction => (
                <TransitionCard key={prediction.growId} prediction={prediction} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const HarvestForecast: React.FC = () => {
  const { predictions, dailyForecast, summary } = useForecastData();
  const [selectedDay, setSelectedDay] = useState(0);
  const [view, setView] = useState<'calendar' | 'timeline'>('calendar');
  const [weekOffset, setWeekOffset] = useState(0);

  const visibleDays = dailyForecast.slice(weekOffset * 7, (weekOffset + 1) * 7);
  const canGoBack = weekOffset > 0;
  const canGoForward = weekOffset < 1; // 2 weeks total

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Harvest Forecasting</h1>
          <p className="text-zinc-400 text-sm">
            Predict stage transitions and forecast upcoming harvests
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('calendar')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'calendar'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Icons.Calendar />
              Calendar
            </span>
          </button>
          <button
            onClick={() => setView('timeline')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'timeline'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Icons.Clock />
              Timeline
            </span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Icons.Scale />}
          label="7-Day Harvest"
          value={summary.totalExpectedHarvest >= 1000
            ? `${(summary.totalExpectedHarvest / 1000).toFixed(1)} kg`
            : `${summary.totalExpectedHarvest} g`
          }
          subValue="Expected total"
          color="text-emerald-400"
        />
        <SummaryCard
          icon={<Icons.TrendingUp />}
          label="Peak Day"
          value={summary.peakDay
            ? summary.peakDay.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : '-'
          }
          subValue={summary.peakDay ? `${summary.peakDay.amount}g expected` : 'No data'}
          color="text-blue-400"
        />
        <SummaryCard
          icon={<Icons.Clock />}
          label="Upcoming Transitions"
          value={summary.upcomingTransitions}
          subValue="Next 7 days"
          color="text-purple-400"
        />
        <SummaryCard
          icon={<Icons.AlertTriangle />}
          label="Overdue Grows"
          value={summary.overdueGrows}
          subValue={summary.overdueGrows > 0 ? 'Need attention' : 'All on track'}
          color={summary.overdueGrows > 0 ? 'text-amber-400' : 'text-zinc-400'}
        />
      </div>

      {view === 'calendar' ? (
        <>
          {/* Calendar Week Navigation */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                disabled={!canGoBack}
                className={`p-2 rounded-lg transition-colors ${
                  canGoBack ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                }`}
              >
                <Icons.ChevronLeft />
              </button>
              <span className="text-sm font-medium text-zinc-400">
                {weekOffset === 0 ? 'This Week' : 'Next Week'}
              </span>
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                disabled={!canGoForward}
                className={`p-2 rounded-lg transition-colors ${
                  canGoForward ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                }`}
              >
                <Icons.ChevronRight />
              </button>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {visibleDays.map((day, i) => {
                const globalIndex = weekOffset * 7 + i;
                return (
                  <CalendarDay
                    key={day.date.toISOString()}
                    forecast={day}
                    isToday={globalIndex === 0}
                    isSelected={selectedDay === globalIndex}
                    onSelect={() => setSelectedDay(globalIndex)}
                  />
                );
              })}
            </div>
          </div>

          {/* Selected Day Detail */}
          <DayDetail forecast={dailyForecast[selectedDay]} />
        </>
      ) : (
        /* Timeline View */
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Icons.Clock />
            Transition Timeline
          </h3>
          <TimelineView predictions={predictions} />
        </div>
      )}

      {/* Overdue Grows Alert */}
      {summary.overdueGrows > 0 && (
        <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-4">
          <h3 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <Icons.AlertTriangle />
            Grows Needing Attention
          </h3>
          <p className="text-sm text-zinc-400 mb-3">
            These grows have been in their current stage longer than expected:
          </p>
          <div className="space-y-2">
            {predictions.filter(p => p.isOverdue).map(prediction => (
              <TransitionCard key={prediction.growId} prediction={prediction} />
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
          <Icons.Info />
          About Forecasting
        </h3>
        <div className="text-sm text-zinc-400 space-y-2">
          <p>
            <span className="text-emerald-400">●</span> <strong>High confidence</strong> - Prediction is within expected range based on strain data
          </p>
          <p>
            <span className="text-amber-400">●</span> <strong>Medium confidence</strong> - Some uncertainty, may vary from prediction
          </p>
          <p>
            <span className="text-red-400">●</span> <strong>Low confidence</strong> - Limited data or grow is outside typical parameters
          </p>
          <p className="mt-3 text-zinc-500">
            Forecasts are calculated using strain-specific colonization and fruiting timelines.
            Harvest estimates are based on substrate weight and typical biological efficiency (~50%).
            Update your strain data for more accurate predictions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HarvestForecast;
