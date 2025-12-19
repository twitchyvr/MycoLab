// ============================================================================
// FINANCIAL DASHBOARD
// Lab valuation, profitability analysis, and cost tracking
// ============================================================================

import React, { useMemo, useState } from 'react';
import { useData } from '../../store';

// Icons
const Icons = {
  DollarSign: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  TrendingDown: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  ),
  Package: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Beaker: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  Calculator: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Download: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

// Stat Card component
const StatCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple';
  trend?: { value: number; label: string };
}> = ({ title, value, subtitle, icon, color = 'emerald', trend }) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-400">{title}</span>
        <span className={color === 'emerald' ? 'text-emerald-400' : color === 'blue' ? 'text-blue-400' : color === 'amber' ? 'text-amber-400' : color === 'red' ? 'text-red-400' : 'text-purple-400'}>
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-sm text-zinc-500 mt-1">{subtitle}</div>}
      {trend && (
        <div className={`text-sm mt-2 flex items-center gap-1 ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend.value >= 0 ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
          <span>{trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}% {trend.label}</span>
        </div>
      )}
    </div>
  );
};

// Section header
const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-4">
    <h2 className="text-lg font-semibold text-white">{title}</h2>
    {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
  </div>
);

export const FinancialDashboard: React.FC = () => {
  const { state, getLabValuation, getStrain } = useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'profitability' | 'export'>('overview');

  // Calculate lab valuation
  const labValuation = useMemo(() => getLabValuation(), [getLabValuation]);

  // Calculate culture values
  const cultureValues = useMemo(() => {
    let total = 0;
    let byType: Record<string, number> = {};

    state.cultures.forEach(culture => {
      if (culture.status !== 'contaminated' && culture.status !== 'depleted' && culture.status !== 'archived') {
        const value = (culture.purchaseCost ?? 0) + (culture.productionCost ?? 0)
                    + (culture.parentCultureCost ?? 0) + (culture.cost ?? 0);
        total += value;
        byType[culture.type] = (byType[culture.type] || 0) + value;
      }
    });

    return { total, byType };
  }, [state.cultures]);

  // Calculate grow stats
  const growStats = useMemo(() => {
    let totalCost = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    let activeGrowsValue = 0;
    let completedCount = 0;
    let profitableCount = 0;
    const byStrain: Record<string, { cost: number; revenue: number; profit: number; yield: number; count: number }> = {};

    state.grows.forEach(grow => {
      const strain = getStrain(grow.strainId);
      const strainName = strain?.name || 'Unknown';

      const cost = grow.totalCost ?? grow.estimatedCost ?? 0;
      const revenue = grow.revenue ?? 0;
      const profit = grow.profit ?? (revenue - cost);

      if (grow.status === 'active' || grow.currentStage !== 'completed') {
        activeGrowsValue += cost;
      }

      if (grow.status === 'completed' || grow.currentStage === 'completed') {
        completedCount++;
        totalCost += cost;
        totalRevenue += revenue;
        totalProfit += profit;
        if (profit > 0) profitableCount++;

        if (!byStrain[strainName]) {
          byStrain[strainName] = { cost: 0, revenue: 0, profit: 0, yield: 0, count: 0 };
        }
        byStrain[strainName].cost += cost;
        byStrain[strainName].revenue += revenue;
        byStrain[strainName].profit += profit;
        byStrain[strainName].yield += grow.totalYield || 0;
        byStrain[strainName].count++;
      }
    });

    return {
      totalCost,
      totalRevenue,
      totalProfit,
      activeGrowsValue,
      completedCount,
      profitableCount,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      byStrain,
    };
  }, [state.grows, getStrain]);

  // Calculate cost breakdown by category
  const costBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {
      'Substrate & Grain': 0,
      'Cultures': 0,
      'Containers': 0,
      'Supplies': 0,
      'Equipment': 0,
      'Other': 0,
    };

    state.inventoryItems.forEach(item => {
      const value = (item.currentValue ?? (item.unitCost * item.quantity));
      const assetType = item.assetType ?? 'consumable';
      const category = state.inventoryCategories.find(c => c.id === item.categoryId);
      const categoryName = category?.name?.toLowerCase() || '';

      if (assetType === 'equipment') {
        breakdown['Equipment'] += value;
      } else if (categoryName.includes('substrate') || categoryName.includes('grain')) {
        breakdown['Substrate & Grain'] += value;
      } else if (categoryName.includes('container') || categoryName.includes('jar')) {
        breakdown['Containers'] += value;
      } else if (assetType === 'culture_source') {
        breakdown['Cultures'] += value;
      } else {
        breakdown['Supplies'] += value;
      }
    });

    return breakdown;
  }, [state.inventoryItems, state.inventoryCategories]);

  // Export function
  const handleExport = (format: 'csv' | 'json') => {
    const exportData = {
      exportDate: new Date().toISOString(),
      labValuation: labValuation,
      cultureValues: cultureValues,
      growStats: {
        totalCost: growStats.totalCost,
        totalRevenue: growStats.totalRevenue,
        totalProfit: growStats.totalProfit,
        completedGrows: growStats.completedCount,
        profitMargin: growStats.profitMargin,
      },
      costBreakdown: costBreakdown,
      grows: state.grows.map(g => ({
        id: g.id,
        name: g.name,
        strain: getStrain(g.strainId)?.name,
        status: g.status,
        stage: g.currentStage,
        estimatedCost: g.estimatedCost,
        totalCost: g.totalCost,
        revenue: g.revenue,
        profit: g.profit,
        totalYield: g.totalYield,
        costPerGramWet: g.costPerGramWet,
        costPerGramDry: g.costPerGramDry,
        createdAt: g.createdAt,
        completedAt: g.completedAt,
      })),
      cultures: state.cultures.map(c => ({
        id: c.id,
        label: c.label,
        type: c.type,
        status: c.status,
        cost: c.cost,
        purchaseCost: c.purchaseCost,
        productionCost: c.productionCost,
        parentCultureCost: c.parentCultureCost,
        volumeMl: c.volumeMl,
        fillVolumeMl: c.fillVolumeMl,
        volumeUsed: c.volumeUsed,
        costPerMl: c.costPerMl,
        createdAt: c.createdAt,
      })),
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mycolab-financial-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV export - grows summary
      const headers = ['Name', 'Strain', 'Status', 'Stage', 'Cost', 'Revenue', 'Profit', 'Yield (g)', 'Cost/g', 'Created', 'Completed'];
      const rows = state.grows.map(g => [
        g.name,
        getStrain(g.strainId)?.name || 'Unknown',
        g.status,
        g.currentStage,
        (g.totalCost ?? g.estimatedCost ?? 0).toFixed(2),
        (g.revenue ?? 0).toFixed(2),
        (g.profit ?? 0).toFixed(2),
        (g.totalYield ?? 0).toFixed(0),
        (g.costPerGramWet ?? 0).toFixed(3),
        new Date(g.createdAt).toLocaleDateString(),
        g.completedAt ? new Date(g.completedAt).toLocaleDateString() : '',
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mycolab-grows-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-4">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'costs', label: 'Cost Analysis' },
          { id: 'profitability', label: 'Profitability' },
          { id: 'export', label: 'Export Data' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <SectionHeader title="Lab Valuation" subtitle="Total value of all lab assets" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Lab Value"
              value={`$${labValuation.total.toFixed(2)}`}
              subtitle="All assets combined"
              icon={<Icons.DollarSign />}
              color="emerald"
            />
            <StatCard
              title="Equipment"
              value={`$${labValuation.equipment.toFixed(2)}`}
              subtitle="Non-consumable assets"
              icon={<Icons.Package />}
              color="blue"
            />
            <StatCard
              title="Consumables"
              value={`$${labValuation.consumables.toFixed(2)}`}
              subtitle="Inventory items"
              icon={<Icons.Beaker />}
              color="amber"
            />
            <StatCard
              title="Durables"
              value={`$${labValuation.durables.toFixed(2)}`}
              subtitle="Reusable items"
              icon={<Icons.Package />}
              color="purple"
            />
          </div>

          <SectionHeader title="Culture Values" subtitle="Value of active cultures" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Culture Value"
              value={`$${cultureValues.total.toFixed(2)}`}
              subtitle={`${state.cultures.filter(c => !['contaminated', 'depleted', 'archived'].includes(c.status)).length} active cultures`}
              icon={<Icons.Beaker />}
              color="emerald"
            />
            {Object.entries(cultureValues.byType).map(([type, value]) => (
              <StatCard
                key={type}
                title={type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                value={`$${value.toFixed(2)}`}
                icon={<Icons.Beaker />}
                color="blue"
              />
            ))}
          </div>

          <SectionHeader title="Grow Summary" subtitle="Cost and revenue from grows" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Grows Value"
              value={`$${growStats.activeGrowsValue.toFixed(2)}`}
              subtitle={`${state.grows.filter(g => g.status === 'active').length} active grows`}
              icon={<Icons.Package />}
              color="amber"
            />
            <StatCard
              title="Total Revenue"
              value={`$${growStats.totalRevenue.toFixed(2)}`}
              subtitle={`${growStats.completedCount} completed grows`}
              icon={<Icons.TrendingUp />}
              color="emerald"
            />
            <StatCard
              title="Total Costs"
              value={`$${growStats.totalCost.toFixed(2)}`}
              subtitle="All grow costs"
              icon={<Icons.Calculator />}
              color="blue"
            />
            <StatCard
              title="Total Profit"
              value={`$${growStats.totalProfit.toFixed(2)}`}
              subtitle={`${growStats.profitMargin.toFixed(1)}% margin`}
              icon={growStats.totalProfit >= 0 ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
              color={growStats.totalProfit >= 0 ? 'emerald' : 'red'}
            />
          </div>
        </>
      )}

      {/* Cost Analysis Tab */}
      {activeTab === 'costs' && (
        <>
          <SectionHeader title="Cost Breakdown" subtitle="Where your money goes" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost by Category */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
              <h3 className="font-medium text-white mb-4">Cost by Category</h3>
              <div className="space-y-3">
                {Object.entries(costBreakdown)
                  .filter(([, value]) => value > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, value]) => {
                    const total = Object.values(costBreakdown).reduce((a, b) => a + b, 0);
                    const percent = total > 0 ? (value / total) * 100 : 0;
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-zinc-400">{category}</span>
                          <span className="text-white">${value.toFixed(2)} ({percent.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Cost per Grow */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
              <h3 className="font-medium text-white mb-4">Cost per Grow by Strain</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {Object.entries(growStats.byStrain)
                  .sort((a, b) => b[1].cost - a[1].cost)
                  .map(([strain, data]) => (
                    <div key={strain} className="flex justify-between items-center p-2 bg-zinc-800/50 rounded-lg">
                      <div>
                        <div className="text-white font-medium">{strain}</div>
                        <div className="text-xs text-zinc-500">{data.count} grows, {data.yield.toFixed(0)}g total yield</div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400">${(data.cost / data.count).toFixed(2)}/grow</div>
                        <div className="text-xs text-zinc-500">
                          ${data.yield > 0 ? (data.cost / data.yield).toFixed(3) : '0.000'}/g
                        </div>
                      </div>
                    </div>
                  ))}
                {Object.keys(growStats.byStrain).length === 0 && (
                  <div className="text-zinc-500 text-center py-4">No completed grows yet</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Profitability Tab */}
      {activeTab === 'profitability' && (
        <>
          <SectionHeader title="Profitability Analysis" subtitle="Revenue and profit by strain" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              title="Profit Margin"
              value={`${growStats.profitMargin.toFixed(1)}%`}
              subtitle={`${growStats.profitableCount}/${growStats.completedCount} profitable`}
              icon={<Icons.TrendingUp />}
              color={growStats.profitMargin >= 0 ? 'emerald' : 'red'}
            />
            <StatCard
              title="Avg Revenue per Grow"
              value={`$${(growStats.completedCount > 0 ? growStats.totalRevenue / growStats.completedCount : 0).toFixed(2)}`}
              icon={<Icons.DollarSign />}
              color="blue"
            />
            <StatCard
              title="Avg Profit per Grow"
              value={`$${(growStats.completedCount > 0 ? growStats.totalProfit / growStats.completedCount : 0).toFixed(2)}`}
              icon={<Icons.Calculator />}
              color={growStats.totalProfit >= 0 ? 'emerald' : 'red'}
            />
          </div>

          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
            <h3 className="font-medium text-white mb-4">Profitability by Strain</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left py-2 px-3">Strain</th>
                    <th className="text-right py-2 px-3">Grows</th>
                    <th className="text-right py-2 px-3">Total Cost</th>
                    <th className="text-right py-2 px-3">Total Revenue</th>
                    <th className="text-right py-2 px-3">Total Profit</th>
                    <th className="text-right py-2 px-3">Margin</th>
                    <th className="text-right py-2 px-3">Yield (g)</th>
                    <th className="text-right py-2 px-3">$/gram</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(growStats.byStrain)
                    .sort((a, b) => b[1].profit - a[1].profit)
                    .map(([strain, data]) => {
                      const margin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
                      const costPerGram = data.yield > 0 ? data.cost / data.yield : 0;
                      return (
                        <tr key={strain} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                          <td className="py-2 px-3 text-white font-medium">{strain}</td>
                          <td className="py-2 px-3 text-right text-zinc-400">{data.count}</td>
                          <td className="py-2 px-3 text-right text-zinc-400">${data.cost.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-zinc-400">${data.revenue.toFixed(2)}</td>
                          <td className={`py-2 px-3 text-right font-medium ${data.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${data.profit.toFixed(2)}
                          </td>
                          <td className={`py-2 px-3 text-right ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {margin.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right text-zinc-400">{data.yield.toFixed(0)}g</td>
                          <td className="py-2 px-3 text-right text-zinc-400">${costPerGram.toFixed(3)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {Object.keys(growStats.byStrain).length === 0 && (
                <div className="text-zinc-500 text-center py-8">
                  No completed grows with revenue data yet.
                  <br />
                  <span className="text-sm">Add revenue to completed grows to see profitability analysis.</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <>
          <SectionHeader title="Export Financial Data" subtitle="Download your financial records" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <Icons.Download />
                </div>
                <div>
                  <h3 className="font-medium text-white">Export to JSON</h3>
                  <p className="text-sm text-zinc-500">Full financial data export</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                Exports complete financial data including lab valuation, grow costs, culture values,
                and detailed breakdowns. Ideal for backups or importing into other systems.
              </p>
              <button
                onClick={() => handleExport('json')}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Icons.Download />
                Download JSON
              </button>
            </div>

            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                  <Icons.Download />
                </div>
                <div>
                  <h3 className="font-medium text-white">Export to CSV</h3>
                  <p className="text-sm text-zinc-500">Spreadsheet-ready format</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                Exports grow data in CSV format for use in spreadsheet applications
                like Excel or Google Sheets. Includes costs, revenue, profit, and yields.
              </p>
              <button
                onClick={() => handleExport('csv')}
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Icons.Download />
                Download CSV
              </button>
            </div>
          </div>

          <div className="bg-zinc-800/30 rounded-xl p-4 mt-4">
            <h4 className="text-sm font-medium text-zinc-400 mb-2">What's Included in Exports</h4>
            <ul className="text-sm text-zinc-500 space-y-1 list-disc list-inside">
              <li>Lab valuation breakdown (equipment, consumables, durables)</li>
              <li>Culture values by type with cost breakdown</li>
              <li>Grow costs, revenue, profit, and yields</li>
              <li>Cost per gram calculations</li>
              <li>Profitability analysis by strain</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialDashboard;
