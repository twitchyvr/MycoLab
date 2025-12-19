// ============================================================================
// OUTCOMES ANALYTICS DASHBOARD
// Visualizes historical entity outcomes from the append-only tracking system
// Shows disposal patterns, contamination analysis, success rates, and costs
// ============================================================================

import React, { useMemo, useState } from 'react';
import { useData } from '../../store';
import {
  EntityOutcome,
  OutcomeCategory,
  CULTURE_OUTCOME_OPTIONS,
  GROW_OUTCOME_OPTIONS,
  CONTAINER_OUTCOME_OPTIONS,
  INVENTORY_OUTCOME_OPTIONS,
  EQUIPMENT_OUTCOME_OPTIONS,
} from '../../store/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

// Colors for outcome categories
const CATEGORY_COLORS: Record<OutcomeCategory, string> = {
  success: '#10b981', // emerald-500
  failure: '#ef4444', // red-500
  neutral: '#71717a', // zinc-500
  partial: '#f59e0b', // amber-500
};

// Entity type labels
const ENTITY_TYPE_LABELS: Record<string, string> = {
  grow: 'Grows',
  culture: 'Cultures',
  container: 'Containers',
  inventory_item: 'Inventory',
  inventory_lot: 'Inventory Lots',
  equipment: 'Equipment',
};

// Get outcome options for a given entity type
const getOutcomeOptions = (entityType: string) => {
  switch (entityType) {
    case 'grow': return GROW_OUTCOME_OPTIONS;
    case 'culture': return CULTURE_OUTCOME_OPTIONS;
    case 'container': return CONTAINER_OUTCOME_OPTIONS;
    case 'inventory_item':
    case 'inventory_lot': return INVENTORY_OUTCOME_OPTIONS;
    case 'equipment': return EQUIPMENT_OUTCOME_OPTIONS;
    default: return CULTURE_OUTCOME_OPTIONS;
  }
};

// Time range options
type TimeRange = '30d' | '90d' | '1y' | 'all';

export const OutcomesAnalytics: React.FC = () => {
  const { state, getStrain, getLocation } = useData();
  const outcomes = state.entityOutcomes || [];

  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  // Filter outcomes by time range
  const filteredOutcomes = useMemo(() => {
    let filtered = outcomes;

    // Time filter
    const now = new Date();
    if (timeRange === '30d') {
      filtered = filtered.filter(o => new Date(o.endedAt) >= subDays(now, 30));
    } else if (timeRange === '90d') {
      filtered = filtered.filter(o => new Date(o.endedAt) >= subDays(now, 90));
    } else if (timeRange === '1y') {
      filtered = filtered.filter(o => new Date(o.endedAt) >= subDays(now, 365));
    }

    // Entity type filter
    if (entityFilter !== 'all') {
      filtered = filtered.filter(o => o.entityType === entityFilter);
    }

    return filtered;
  }, [outcomes, timeRange, entityFilter]);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const total = filteredOutcomes.length;
    const byCategory: Record<OutcomeCategory, number> = {
      success: 0, failure: 0, neutral: 0, partial: 0
    };
    const byEntityType: Record<string, number> = {};
    let totalCost = 0;
    let totalYield = 0;
    let avgDuration = 0;
    let durationCount = 0;

    filteredOutcomes.forEach(o => {
      byCategory[o.outcomeCategory] = (byCategory[o.outcomeCategory] || 0) + 1;
      byEntityType[o.entityType] = (byEntityType[o.entityType] || 0) + 1;
      if (o.totalCost) totalCost += o.totalCost;
      if (o.totalYieldWet) totalYield += o.totalYieldWet;
      if (o.durationDays) {
        avgDuration += o.durationDays;
        durationCount++;
      }
    });

    const successRate = total > 0 ? (byCategory.success / total) * 100 : 0;
    const failureRate = total > 0 ? (byCategory.failure / total) * 100 : 0;

    return {
      total,
      byCategory,
      byEntityType,
      successRate,
      failureRate,
      totalCost,
      totalYield,
      avgDuration: durationCount > 0 ? avgDuration / durationCount : 0,
    };
  }, [filteredOutcomes]);

  // Pie chart data for categories
  const categoryPieData = useMemo(() => {
    return Object.entries(metrics.byCategory)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: count,
        color: CATEGORY_COLORS[category as OutcomeCategory],
      }));
  }, [metrics.byCategory]);

  // Entity type bar chart data
  const entityBarData = useMemo(() => {
    return Object.entries(metrics.byEntityType)
      .map(([type, count]) => ({
        name: ENTITY_TYPE_LABELS[type] || type,
        count,
        type,
      }))
      .sort((a, b) => b.count - a.count);
  }, [metrics.byEntityType]);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    if (filteredOutcomes.length === 0) return [];

    const dates = filteredOutcomes.map(o => new Date(o.endedAt));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    const months = eachMonthOfInterval({ start: startOfMonth(minDate), end: endOfMonth(maxDate) });

    return months.map(month => {
      const monthEnd = endOfMonth(month);
      const monthOutcomes = filteredOutcomes.filter(o => {
        const date = new Date(o.endedAt);
        return date >= month && date <= monthEnd;
      });

      return {
        month: format(month, 'MMM yy'),
        total: monthOutcomes.length,
        success: monthOutcomes.filter(o => o.outcomeCategory === 'success').length,
        failure: monthOutcomes.filter(o => o.outcomeCategory === 'failure').length,
        neutral: monthOutcomes.filter(o => o.outcomeCategory === 'neutral').length,
      };
    });
  }, [filteredOutcomes]);

  // Top failure reasons
  const failureReasons = useMemo(() => {
    const failures = filteredOutcomes.filter(o => o.outcomeCategory === 'failure');
    const reasons: Record<string, { count: number; label: string }> = {};

    failures.forEach(o => {
      const key = o.outcomeCode;
      if (!reasons[key]) {
        // Find label from outcome options
        const options = getOutcomeOptions(o.entityType);
        const option = options.find(opt => opt.code === o.outcomeCode);
        reasons[key] = { count: 0, label: option?.label || o.outcomeLabel || key };
      }
      reasons[key].count++;
    });

    return Object.entries(reasons)
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredOutcomes]);

  // Recent outcomes for table
  const recentOutcomes = useMemo(() => {
    return [...filteredOutcomes]
      .sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime())
      .slice(0, 20);
  }, [filteredOutcomes]);

  // Available entity types for filter
  const entityTypes = useMemo(() => {
    const types = new Set(outcomes.map(o => o.entityType));
    return Array.from(types);
  }, [outcomes]);

  if (outcomes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Outcomes Analytics</h1>
            <p className="text-zinc-400">Historical tracking and disposal analysis</p>
          </div>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-zinc-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No Outcome Data Yet</h3>
          <p className="text-zinc-500 max-w-md mx-auto">
            Outcome data will appear here when you dispose of cultures, complete grows,
            or archive other entities. This provides historical tracking for analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Outcomes Analytics</h1>
          <p className="text-zinc-400">Historical tracking and disposal analysis</p>
        </div>

        <div className="flex gap-2">
          {/* Time range filter */}
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as TimeRange)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>

          {/* Entity type filter */}
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
          >
            <option value="all">All Entities</option>
            {entityTypes.map(type => (
              <option key={type} value={type}>{ENTITY_TYPE_LABELS[type] || type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
          <div className="text-sm text-zinc-400">Total Outcomes</div>
          <div className="text-2xl font-bold text-zinc-100 mt-1">{metrics.total}</div>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
          <div className="text-sm text-zinc-400">Success Rate</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics.successRate.toFixed(1)}%</div>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
          <div className="text-sm text-zinc-400">Failure Rate</div>
          <div className="text-2xl font-bold text-red-400 mt-1">{metrics.failureRate.toFixed(1)}%</div>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
          <div className="text-sm text-zinc-400">Total Yield</div>
          <div className="text-2xl font-bold text-zinc-100 mt-1">{metrics.totalYield.toFixed(0)}g</div>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
          <div className="text-sm text-zinc-400">Avg Duration</div>
          <div className="text-2xl font-bold text-zinc-100 mt-1">{metrics.avgDuration.toFixed(0)} days</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Outcome Distribution</h3>
          {categoryPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px' }}
                  labelStyle={{ color: '#fafafa' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-zinc-500">No data</div>
          )}
        </div>

        {/* Entity Type Breakdown */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">By Entity Type</h3>
          {entityBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={entityBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis type="number" stroke="#71717a" />
                <YAxis type="category" dataKey="name" stroke="#71717a" width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px' }}
                  labelStyle={{ color: '#fafafa' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-zinc-500">No data</div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      {monthlyTrend.length > 1 && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="month" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px' }}
                labelStyle={{ color: '#fafafa' }}
              />
              <Legend />
              <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} name="Success" />
              <Line type="monotone" dataKey="failure" stroke="#ef4444" strokeWidth={2} name="Failure" />
              <Line type="monotone" dataKey="neutral" stroke="#71717a" strokeWidth={2} name="Neutral" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Failure Analysis */}
      {failureReasons.length > 0 && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Top Failure Reasons</h3>
          <div className="space-y-2">
            {failureReasons.map(reason => {
              const percentage = (reason.count / metrics.byCategory.failure) * 100;
              return (
                <div key={reason.code} className="flex items-center gap-3">
                  <div className="w-32 text-sm text-zinc-300 truncate">{reason.label}</div>
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm text-zinc-400">{reason.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Outcomes Table */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Recent Outcomes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-2 px-3 text-zinc-400 font-medium">Date</th>
                <th className="text-left py-2 px-3 text-zinc-400 font-medium">Entity</th>
                <th className="text-left py-2 px-3 text-zinc-400 font-medium">Type</th>
                <th className="text-left py-2 px-3 text-zinc-400 font-medium">Outcome</th>
                <th className="text-left py-2 px-3 text-zinc-400 font-medium">Category</th>
                <th className="text-right py-2 px-3 text-zinc-400 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {recentOutcomes.map(outcome => (
                <tr key={outcome.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="py-2 px-3 text-zinc-300">
                    {format(new Date(outcome.endedAt), 'MMM d, yyyy')}
                  </td>
                  <td className="py-2 px-3 text-zinc-100 font-medium">
                    {outcome.entityName || outcome.entityId.slice(0, 8)}
                  </td>
                  <td className="py-2 px-3 text-zinc-400">
                    {ENTITY_TYPE_LABELS[outcome.entityType] || outcome.entityType}
                  </td>
                  <td className="py-2 px-3 text-zinc-300">
                    {outcome.outcomeLabel || outcome.outcomeCode}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        outcome.outcomeCategory === 'success' ? 'bg-emerald-950/50 text-emerald-400' :
                        outcome.outcomeCategory === 'failure' ? 'bg-red-950/50 text-red-400' :
                        outcome.outcomeCategory === 'partial' ? 'bg-amber-950/50 text-amber-400' :
                        'bg-zinc-700 text-zinc-400'
                      }`}
                    >
                      {outcome.outcomeCategory}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-zinc-400">
                    {outcome.durationDays ? `${outcome.durationDays}d` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OutcomesAnalytics;
