// ============================================================================
// ANNUAL WRAPPED - Year-End Summary Feature
// Spotify Wrapped-style analytics showcase for mycology lab data
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useData } from '../../store';
import { format, startOfYear, endOfYear, getMonth, getYear, parseISO, differenceInDays } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface WrappedStats {
  // Overview
  year: number;
  totalCultures: number;
  totalGrows: number;
  totalHarvests: number;
  totalYieldWet: number;
  totalYieldDry: number;
  totalRecipes: number;

  // Success metrics
  successfulGrows: number;
  failedGrows: number;
  successRate: number;

  // Top performers
  topStrain: { name: string; count: number; yield: number } | null;
  topRecipe: { name: string; useCount: number } | null;
  bestMonth: { month: number; name: string; successCount: number } | null;
  worstMonth: { month: number; name: string; contamCount: number } | null;

  // Activity
  mostActiveMonth: { month: number; name: string; eventCount: number } | null;
  totalObservations: number;
  totalMistings: number;
  totalFaeEvents: number;

  // Contamination analysis
  totalContaminations: number;
  contaminationsByMonth: { month: number; count: number }[];

  // Records
  bestYieldGrow: { name: string; yield: number; strain: string } | null;
  longestGrow: { name: string; days: number; strain: string } | null;
  fastestGrow: { name: string; days: number; strain: string } | null;

  // Financial (if tracked)
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;

  // Fun facts
  funFacts: string[];
}

interface SlideContent {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  bgGradient: string;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  ChevronLeft: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Close: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Trophy: () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h14M12 21V9m0 0l-4 4m4-4l4 4M8 7h8" />
    </svg>
  ),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(num % 1 === 0 ? 0 : 1);
};

// ============================================================================
// WRAPPED SLIDE COMPONENTS
// ============================================================================

const WelcomeSlide: React.FC<{ year: number }> = ({ year }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-8">
    <div className="text-6xl mb-6">🍄</div>
    <h1 className="text-5xl font-bold text-white mb-4">Your {year} Wrapped</h1>
    <p className="text-xl text-zinc-300 max-w-md">
      Let's look back at your mycology journey this year
    </p>
    <div className="mt-8 animate-bounce">
      <span className="text-zinc-400">Swipe to begin</span>
    </div>
  </div>
);

const OverviewSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-8">
    <h2 className="text-3xl font-bold text-white mb-8">The Numbers</h2>
    <div className="grid grid-cols-2 gap-6 max-w-md">
      <div className="bg-white/10 rounded-2xl p-6">
        <div className="text-4xl font-bold text-emerald-400">{stats.totalGrows}</div>
        <div className="text-zinc-300 mt-1">Grows Started</div>
      </div>
      <div className="bg-white/10 rounded-2xl p-6">
        <div className="text-4xl font-bold text-blue-400">{stats.totalCultures}</div>
        <div className="text-zinc-300 mt-1">Cultures Created</div>
      </div>
      <div className="bg-white/10 rounded-2xl p-6">
        <div className="text-4xl font-bold text-amber-400">{stats.totalHarvests}</div>
        <div className="text-zinc-300 mt-1">Harvests</div>
      </div>
      <div className="bg-white/10 rounded-2xl p-6">
        <div className="text-4xl font-bold text-purple-400">{formatNumber(stats.totalYieldWet)}g</div>
        <div className="text-zinc-300 mt-1">Total Yield</div>
      </div>
    </div>
  </div>
);

const TopStrainSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-8">
    {stats.topStrain ? (
      <>
        <div className="text-5xl mb-4">🏆</div>
        <h2 className="text-2xl text-zinc-300 mb-2">Your Top Strain</h2>
        <div className="text-4xl font-bold text-white mb-4">{stats.topStrain.name}</div>
        <div className="bg-white/10 rounded-2xl p-6 max-w-xs">
          <div className="text-5xl font-bold text-emerald-400 mb-2">
            {stats.topStrain.count}
          </div>
          <div className="text-zinc-300">grows with this strain</div>
          {stats.topStrain.yield > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-2xl font-bold text-amber-400">
                {formatNumber(stats.topStrain.yield)}g
              </div>
              <div className="text-sm text-zinc-400">total yield</div>
            </div>
          )}
        </div>
      </>
    ) : (
      <>
        <div className="text-5xl mb-4">🌱</div>
        <h2 className="text-2xl text-white mb-4">No grows recorded yet</h2>
        <p className="text-zinc-300">Start your first grow to see stats!</p>
      </>
    )}
  </div>
);

const SuccessRateSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-8">
    <h2 className="text-2xl text-zinc-300 mb-4">Success Rate</h2>
    <div className="relative w-48 h-48 mb-6">
      <svg className="w-48 h-48 transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r="88"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
          fill="none"
        />
        <circle
          cx="96"
          cy="96"
          r="88"
          stroke={stats.successRate >= 70 ? '#10B981' : stats.successRate >= 40 ? '#F59E0B' : '#EF4444'}
          strokeWidth="12"
          fill="none"
          strokeDasharray={`${stats.successRate * 5.53} ${553 - stats.successRate * 5.53}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl font-bold text-white">{Math.round(stats.successRate)}%</span>
      </div>
    </div>
    <div className="flex gap-8 text-center">
      <div>
        <div className="text-2xl font-bold text-emerald-400">{stats.successfulGrows}</div>
        <div className="text-sm text-zinc-400">Successful</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-red-400">{stats.failedGrows}</div>
        <div className="text-sm text-zinc-400">Failed</div>
      </div>
    </div>
  </div>
);

const BestMonthSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-8">
    {stats.bestMonth ? (
      <>
        <div className="text-5xl mb-4">📅</div>
        <h2 className="text-2xl text-zinc-300 mb-2">Your Best Month</h2>
        <div className="text-5xl font-bold text-white mb-4">{stats.bestMonth.name}</div>
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-6">
          <div className="text-3xl font-bold text-emerald-400 mb-2">
            {stats.bestMonth.successCount} successful grows
          </div>
          <div className="text-zinc-300">Your most productive month!</div>
        </div>
      </>
    ) : (
      <>
        <div className="text-5xl mb-4">📅</div>
        <h2 className="text-2xl text-white">Every month is a learning month!</h2>
      </>
    )}
  </div>
);

const ContaminationSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-8">
    <div className="text-5xl mb-4">⚠️</div>
    <h2 className="text-2xl text-zinc-300 mb-4">Contamination Stats</h2>
    {stats.totalContaminations > 0 ? (
      <>
        <div className="text-5xl font-bold text-red-400 mb-2">{stats.totalContaminations}</div>
        <div className="text-zinc-300 mb-6">total contaminations</div>
        {stats.worstMonth && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 max-w-xs">
            <div className="text-sm text-zinc-400 mb-1">Watch out for</div>
            <div className="text-xl font-semibold text-white">{stats.worstMonth.name}</div>
            <div className="text-sm text-red-400">{stats.worstMonth.contamCount} contaminations</div>
          </div>
        )}
      </>
    ) : (
      <>
        <div className="text-4xl font-bold text-emerald-400 mb-2">0</div>
        <div className="text-xl text-white">No contaminations!</div>
        <div className="text-zinc-400 mt-2">Your sterile technique is on point! 🎉</div>
      </>
    )}
  </div>
);

const ActivitySlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-8">
    <div className="text-5xl mb-4">📝</div>
    <h2 className="text-2xl text-zinc-300 mb-6">Your Activity</h2>
    <div className="grid grid-cols-1 gap-4 max-w-sm w-full">
      <div className="bg-white/10 rounded-xl p-4 flex justify-between items-center">
        <span className="text-zinc-300">Total Observations</span>
        <span className="text-2xl font-bold text-blue-400">{stats.totalObservations}</span>
      </div>
      <div className="bg-white/10 rounded-xl p-4 flex justify-between items-center">
        <span className="text-zinc-300">Misting Events</span>
        <span className="text-2xl font-bold text-cyan-400">{stats.totalMistings}</span>
      </div>
      <div className="bg-white/10 rounded-xl p-4 flex justify-between items-center">
        <span className="text-zinc-300">FAE Events</span>
        <span className="text-2xl font-bold text-sky-400">{stats.totalFaeEvents}</span>
      </div>
    </div>
    {stats.mostActiveMonth && (
      <div className="mt-6 text-center">
        <div className="text-sm text-zinc-400">Most active month</div>
        <div className="text-xl font-semibold text-white">{stats.mostActiveMonth.name}</div>
      </div>
    )}
  </div>
);

const RecordSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-8">
    <div className="text-5xl mb-4">🏅</div>
    <h2 className="text-2xl text-zinc-300 mb-6">Your Records</h2>
    <div className="space-y-4 max-w-sm w-full">
      {stats.bestYieldGrow && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="text-sm text-amber-400 mb-1">🥇 Best Yield</div>
          <div className="text-lg font-semibold text-white">{stats.bestYieldGrow.name}</div>
          <div className="text-2xl font-bold text-amber-400">{formatNumber(stats.bestYieldGrow.yield)}g</div>
          <div className="text-xs text-zinc-400">{stats.bestYieldGrow.strain}</div>
        </div>
      )}
      {stats.fastestGrow && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="text-sm text-emerald-400 mb-1">⚡ Fastest Grow</div>
          <div className="text-lg font-semibold text-white">{stats.fastestGrow.name}</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.fastestGrow.days} days</div>
          <div className="text-xs text-zinc-400">{stats.fastestGrow.strain}</div>
        </div>
      )}
      {!stats.bestYieldGrow && !stats.fastestGrow && (
        <div className="text-zinc-400">Complete some grows to see your records!</div>
      )}
    </div>
  </div>
);

const FinancialSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-8">
    <div className="text-5xl mb-4">💰</div>
    <h2 className="text-2xl text-zinc-300 mb-6">Financial Summary</h2>
    <div className="grid grid-cols-1 gap-4 max-w-sm w-full">
      <div className="bg-white/10 rounded-xl p-4 flex justify-between items-center">
        <span className="text-zinc-300">Total Cost</span>
        <span className="text-2xl font-bold text-red-400">${formatNumber(stats.totalCost)}</span>
      </div>
      <div className="bg-white/10 rounded-xl p-4 flex justify-between items-center">
        <span className="text-zinc-300">Total Revenue</span>
        <span className="text-2xl font-bold text-emerald-400">${formatNumber(stats.totalRevenue)}</span>
      </div>
      <div className="bg-white/10 rounded-xl p-4 flex justify-between items-center">
        <span className="text-zinc-300">Net Profit</span>
        <span className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          ${formatNumber(Math.abs(stats.totalProfit))}
        </span>
      </div>
    </div>
  </div>
);

const FunFactsSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-8">
    <div className="text-5xl mb-4">✨</div>
    <h2 className="text-2xl text-zinc-300 mb-6">Fun Facts</h2>
    <div className="space-y-4 max-w-md">
      {stats.funFacts.map((fact, index) => (
        <div key={index} className="bg-white/10 rounded-xl p-4 text-left">
          <span className="text-white">{fact}</span>
        </div>
      ))}
    </div>
  </div>
);

const SummarySlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-8">
    <div className="text-6xl mb-6">🍄</div>
    <h2 className="text-3xl font-bold text-white mb-4">That's a Wrap!</h2>
    <p className="text-xl text-zinc-300 mb-6">Here's to an even better {stats.year + 1}!</p>
    <div className="bg-white/10 rounded-2xl p-6 max-w-sm">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-emerald-400">{stats.totalGrows}</div>
          <div className="text-xs text-zinc-400">Grows</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-400">{formatNumber(stats.totalYieldWet)}g</div>
          <div className="text-xs text-zinc-400">Yield</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-amber-400">{Math.round(stats.successRate)}%</div>
          <div className="text-xs text-zinc-400">Success</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-400">{stats.totalRecipes}</div>
          <div className="text-xs text-zinc-400">Recipes</div>
        </div>
      </div>
    </div>
    <p className="text-sm text-zinc-500 mt-6">Share your Wrapped with #MycoLabWrapped</p>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AnnualWrappedProps {
  isOpen: boolean;
  onClose: () => void;
  year?: number;
}

export const AnnualWrapped: React.FC<AnnualWrappedProps> = ({
  isOpen,
  onClose,
  year = new Date().getFullYear(),
}) => {
  const { state, activeStrains } = useData();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Calculate stats for the year
  const stats = useMemo<WrappedStats>(() => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    // Filter data for the year
    const yearCultures = state.cultures.filter(c => {
      const date = new Date(c.createdAt);
      return date >= yearStart && date <= yearEnd;
    });

    const yearGrows = state.grows.filter(g => {
      const date = new Date(g.spawnedAt);
      return date >= yearStart && date <= yearEnd;
    });

    const yearRecipes = state.recipes.filter(r => {
      const date = new Date(r.createdAt);
      return date >= yearStart && date <= yearEnd;
    });

    // Calculate totals
    const totalHarvests = yearGrows.reduce((sum, g) => sum + g.flushes.length, 0);
    const totalYieldWet = yearGrows.reduce((sum, g) => sum + (g.totalYield || 0), 0);
    const totalYieldDry = yearGrows.reduce((sum, g) =>
      sum + g.flushes.reduce((fs, f) => fs + (f.dryWeight || 0), 0), 0);

    // Success metrics
    const completedGrows = yearGrows.filter(g => g.status === 'completed');
    const successfulGrows = completedGrows.filter(g =>
      g.currentStage !== 'contaminated' && g.currentStage !== 'aborted'
    ).length;
    const failedGrows = yearGrows.filter(g =>
      g.currentStage === 'contaminated' || g.currentStage === 'aborted'
    ).length;
    const successRate = yearGrows.length > 0
      ? (successfulGrows / yearGrows.length) * 100
      : 0;

    // Top strain
    const strainCounts: Record<string, { count: number; yield: number }> = {};
    yearGrows.forEach(g => {
      if (!strainCounts[g.strainId]) {
        strainCounts[g.strainId] = { count: 0, yield: 0 };
      }
      strainCounts[g.strainId].count++;
      strainCounts[g.strainId].yield += g.totalYield || 0;
    });

    const topStrainId = Object.entries(strainCounts)
      .sort(([, a], [, b]) => b.count - a.count)[0]?.[0];
    const topStrainData = topStrainId ? strainCounts[topStrainId] : null;
    const topStrainInfo = activeStrains.find(s => s.id === topStrainId);

    // Monthly analysis
    const monthlySuccess: number[] = Array(12).fill(0);
    const monthlyContam: number[] = Array(12).fill(0);
    const monthlyActivity: number[] = Array(12).fill(0);

    yearGrows.forEach(g => {
      const month = getMonth(new Date(g.spawnedAt));
      if (g.currentStage !== 'contaminated' && g.currentStage !== 'aborted') {
        monthlySuccess[month]++;
      }
      if (g.currentStage === 'contaminated') {
        monthlyContam[month]++;
      }
      monthlyActivity[month]++;
      monthlyActivity[month] += g.observations.length;
    });

    // Best/worst months
    const bestMonthIdx = monthlySuccess.indexOf(Math.max(...monthlySuccess));
    const worstMonthIdx = monthlyContam.indexOf(Math.max(...monthlyContam));
    const mostActiveIdx = monthlyActivity.indexOf(Math.max(...monthlyActivity));

    // Activity counts
    const allObservations = yearGrows.flatMap(g => g.observations);
    const totalMistings = allObservations.filter(o => o.type === 'misting').length;
    const totalFaeEvents = allObservations.filter(o => o.type === 'fae').length;

    // Contamination
    const totalContaminations = yearGrows.filter(g => g.currentStage === 'contaminated').length;
    const contaminationsByMonth = monthlyContam.map((count, month) => ({ month, count }));

    // Records
    const completedWithYield = completedGrows.filter(g => g.totalYield > 0);
    const bestYieldGrow = completedWithYield.sort((a, b) => b.totalYield - a.totalYield)[0];

    const growsWithDuration = completedGrows.filter(g => g.completedAt).map(g => ({
      ...g,
      duration: differenceInDays(new Date(g.completedAt!), new Date(g.spawnedAt))
    }));
    const fastestGrow = growsWithDuration.sort((a, b) => a.duration - b.duration)[0];
    const longestGrow = growsWithDuration.sort((a, b) => b.duration - a.duration)[0];

    // Financial
    const totalCost = yearGrows.reduce((sum, g) => sum + (g.totalCost || g.estimatedCost || 0), 0);
    const totalRevenue = yearGrows.reduce((sum, g) => sum + (g.revenue || 0), 0);
    const totalProfit = totalRevenue - totalCost;

    // Fun facts
    const funFacts: string[] = [];
    if (totalYieldWet > 0) {
      funFacts.push(`You harvested ${formatNumber(totalYieldWet)}g of mushrooms - that's about ${Math.round(totalYieldWet / 100)} servings!`);
    }
    if (yearCultures.length > 0) {
      funFacts.push(`You created ${yearCultures.length} cultures this year!`);
    }
    if (totalMistings > 0) {
      funFacts.push(`You misted your grows ${totalMistings} times - dedication! 💧`);
    }
    if (successRate >= 80) {
      funFacts.push(`With ${Math.round(successRate)}% success rate, you're a pro cultivator! 🌟`);
    }
    if (yearRecipes.length > 0) {
      funFacts.push(`You experimented with ${yearRecipes.length} new recipes!`);
    }

    return {
      year,
      totalCultures: yearCultures.length,
      totalGrows: yearGrows.length,
      totalHarvests,
      totalYieldWet,
      totalYieldDry,
      totalRecipes: yearRecipes.length,
      successfulGrows,
      failedGrows,
      successRate,
      topStrain: topStrainInfo && topStrainData ? {
        name: topStrainInfo.name,
        count: topStrainData.count,
        yield: topStrainData.yield,
      } : null,
      topRecipe: null, // Would need recipe usage tracking
      bestMonth: monthlySuccess[bestMonthIdx] > 0 ? {
        month: bestMonthIdx,
        name: monthNames[bestMonthIdx],
        successCount: monthlySuccess[bestMonthIdx],
      } : null,
      worstMonth: monthlyContam[worstMonthIdx] > 0 ? {
        month: worstMonthIdx,
        name: monthNames[worstMonthIdx],
        contamCount: monthlyContam[worstMonthIdx],
      } : null,
      mostActiveMonth: monthlyActivity[mostActiveIdx] > 0 ? {
        month: mostActiveIdx,
        name: monthNames[mostActiveIdx],
        eventCount: monthlyActivity[mostActiveIdx],
      } : null,
      totalObservations: allObservations.length,
      totalMistings,
      totalFaeEvents,
      totalContaminations,
      contaminationsByMonth,
      bestYieldGrow: bestYieldGrow ? {
        name: bestYieldGrow.name,
        yield: bestYieldGrow.totalYield,
        strain: activeStrains.find(s => s.id === bestYieldGrow.strainId)?.name || 'Unknown',
      } : null,
      longestGrow: longestGrow ? {
        name: longestGrow.name,
        days: longestGrow.duration,
        strain: activeStrains.find(s => s.id === longestGrow.strainId)?.name || 'Unknown',
      } : null,
      fastestGrow: fastestGrow ? {
        name: fastestGrow.name,
        days: fastestGrow.duration,
        strain: activeStrains.find(s => s.id === fastestGrow.strainId)?.name || 'Unknown',
      } : null,
      totalCost,
      totalRevenue,
      totalProfit,
      funFacts,
    };
  }, [state, activeStrains, year]);

  // Build slides based on available data
  const slides = useMemo<SlideContent[]>(() => {
    const slideList: SlideContent[] = [
      {
        id: 'welcome',
        title: 'Welcome',
        content: <WelcomeSlide year={year} />,
        bgGradient: 'from-emerald-900 via-zinc-900 to-zinc-950',
      },
    ];

    // Only show overview if there's data
    if (stats.totalGrows > 0 || stats.totalCultures > 0) {
      slideList.push({
        id: 'overview',
        title: 'Overview',
        content: <OverviewSlide stats={stats} />,
        bgGradient: 'from-blue-900 via-zinc-900 to-zinc-950',
      });
    }

    if (stats.topStrain) {
      slideList.push({
        id: 'top-strain',
        title: 'Top Strain',
        content: <TopStrainSlide stats={stats} />,
        bgGradient: 'from-amber-900 via-zinc-900 to-zinc-950',
      });
    }

    if (stats.totalGrows > 0) {
      slideList.push({
        id: 'success-rate',
        title: 'Success Rate',
        content: <SuccessRateSlide stats={stats} />,
        bgGradient: 'from-emerald-900 via-zinc-900 to-zinc-950',
      });
    }

    if (stats.bestMonth) {
      slideList.push({
        id: 'best-month',
        title: 'Best Month',
        content: <BestMonthSlide stats={stats} />,
        bgGradient: 'from-purple-900 via-zinc-900 to-zinc-950',
      });
    }

    slideList.push({
      id: 'contamination',
      title: 'Contamination',
      content: <ContaminationSlide stats={stats} />,
      bgGradient: 'from-red-900 via-zinc-900 to-zinc-950',
    });

    if (stats.totalObservations > 0) {
      slideList.push({
        id: 'activity',
        title: 'Activity',
        content: <ActivitySlide stats={stats} />,
        bgGradient: 'from-cyan-900 via-zinc-900 to-zinc-950',
      });
    }

    if (stats.bestYieldGrow || stats.fastestGrow) {
      slideList.push({
        id: 'records',
        title: 'Records',
        content: <RecordSlide stats={stats} />,
        bgGradient: 'from-amber-900 via-zinc-900 to-zinc-950',
      });
    }

    if (stats.totalCost > 0 || stats.totalRevenue > 0) {
      slideList.push({
        id: 'financial',
        title: 'Financial',
        content: <FinancialSlide stats={stats} />,
        bgGradient: 'from-green-900 via-zinc-900 to-zinc-950',
      });
    }

    if (stats.funFacts.length > 0) {
      slideList.push({
        id: 'fun-facts',
        title: 'Fun Facts',
        content: <FunFactsSlide stats={stats} />,
        bgGradient: 'from-pink-900 via-zinc-900 to-zinc-950',
      });
    }

    slideList.push({
      id: 'summary',
      title: 'Summary',
      content: <SummarySlide stats={stats} />,
      bgGradient: 'from-emerald-900 via-zinc-900 to-zinc-950',
    });

    return slideList;
  }, [stats, year]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlide, slides.length]);

  // Handle swipe
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    setTouchStart(null);
  };

  if (!isOpen) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.bgGradient} transition-all duration-500`} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <Icons.Close />
      </button>

      {/* Progress indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentSlide
                ? 'w-8 bg-white'
                : idx < currentSlide
                  ? 'w-4 bg-white/50'
                  : 'w-4 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Slide content */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentSlideData.content}
      </div>

      {/* Navigation arrows */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-between px-6">
        <button
          onClick={prevSlide}
          className={`p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ${
            currentSlide === 0 ? 'opacity-0 pointer-events-none' : ''
          }`}
        >
          <Icons.ChevronLeft />
        </button>
        <button
          onClick={currentSlide === slides.length - 1 ? onClose : nextSlide}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          {currentSlide === slides.length - 1 ? (
            <span className="px-4 py-2 text-sm font-medium">Done</span>
          ) : (
            <Icons.ChevronRight />
          )}
        </button>
      </div>

      {/* Page counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
};

// ============================================================================
// WRAPPED TRIGGER BUTTON (for dashboard/overview)
// ============================================================================

export const WrappedTrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Only show the trigger in December or January
  const showTrigger = currentMonth === 11 || currentMonth === 0;
  const displayYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  if (!showTrigger) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl p-4 shadow-lg transition-all hover:shadow-emerald-500/25"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍄</span>
          <div className="text-left">
            <div className="font-bold">Your {displayYear} Wrapped</div>
            <div className="text-sm text-emerald-100">See your year in review!</div>
          </div>
          <span className="text-xl">→</span>
        </div>
        {/* Sparkle effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 right-8 w-2 h-2 bg-white/30 rounded-full animate-ping" />
          <div className="absolute bottom-3 right-16 w-1.5 h-1.5 bg-white/20 rounded-full animate-ping delay-300" />
        </div>
      </button>

      <AnnualWrapped
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        year={displayYear}
      />
    </>
  );
};

// ============================================================================
// WRAPPED WIDGET (compact for dashboard)
// ============================================================================

export const WrappedWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { state, activeStrains } = useData();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Show in December or January
  const showWidget = currentMonth === 11 || currentMonth === 0;
  const displayYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Quick stats
  const yearStart = startOfYear(new Date(displayYear, 0, 1));
  const yearEnd = endOfYear(new Date(displayYear, 0, 1));

  const yearGrows = state.grows.filter(g => {
    const date = new Date(g.spawnedAt);
    return date >= yearStart && date <= yearEnd;
  });

  const totalYield = yearGrows.reduce((sum, g) => sum + (g.totalYield || 0), 0);

  if (!showWidget) return null;

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="cursor-pointer bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-800/50 rounded-xl p-5 hover:border-emerald-600/50 transition-all group"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">🍄</span>
            {displayYear} Wrapped
          </h3>
          <span className="text-emerald-400 group-hover:translate-x-1 transition-transform">→</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{yearGrows.length}</div>
            <div className="text-xs text-zinc-400">Grows</div>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-emerald-400">{formatNumber(totalYield)}g</div>
            <div className="text-xs text-zinc-400">Yield</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <span className="text-sm text-emerald-400 group-hover:underline">
            View your year in review →
          </span>
        </div>
      </div>

      <AnnualWrapped
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        year={displayYear}
      />
    </>
  );
};

export default AnnualWrapped;
