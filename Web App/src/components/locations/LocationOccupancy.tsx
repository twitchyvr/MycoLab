// ============================================================================
// LOCATION OCCUPANCY TRACKING
// View batches within each location, determine item counts, estimate yields,
// and see which varieties are in each location
// ============================================================================

import React, { useMemo, useState } from 'react';
import { useData } from '../../store';
import type { Location, Culture, Grow, Strain, GrowStage } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface LocationOccupancyProps {
  className?: string;
}

interface LocationOccupancyStats {
  locationId: string;
  locationName: string;
  locationPath: string;
  level: string;

  // Counts
  cultureCount: number;
  growCount: number;
  containerCount: number; // Total containers/blocks from grows
  totalItems: number;

  // Capacity
  capacity?: number;
  occupancyPercent: number;

  // Yields
  actualYield: number;      // Total harvested (grams)
  expectedYield: number;    // Estimated from active grows

  // Breakdown by strain
  strainBreakdown: {
    strainId: string;
    strainName: string;
    cultureCount: number;
    growCount: number;
    containerCount: number;
    totalYield: number;
  }[];

  // Items
  cultures: CultureSummary[];
  grows: GrowSummary[];

  // Child locations summary
  childCount: number;
  childOccupancy: number; // Aggregate from children
}

interface CultureSummary {
  id: string;
  label: string;
  type: string;
  strainName: string;
  status: string;
  createdAt: Date;
}

interface GrowSummary {
  id: string;
  name: string;
  strainName: string;
  stage: GrowStage;
  status: string;
  containerCount: number;
  totalYield: number;
  expectedYield: number;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Location: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Culture: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  ),
  Grow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M7 17l2-8h6l2 8" />
      <path d="M3 20h18" />
      <path d="M12 3c3 0 5.5 2 5.5 5 0 3-2.5 5-5.5 5s-5.5-2-5.5-5c0-3 2.5-5 5.5-5z" />
    </svg>
  ),
  Box: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Scale: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Dna: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M2 15c6.667-6 13.333 0 20-6" />
      <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
      <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
      <path d="M17 6l-2.5-2.5" />
      <path d="M14 8l-3-3" />
      <path d="M7 18l2.5 2.5" />
      <path d="M10 16l3 3" />
    </svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
};

// Stage colors
const stageColors: Record<GrowStage, { bg: string; text: string }> = {
  spawning: { bg: 'bg-amber-950/50', text: 'text-amber-400' },
  colonization: { bg: 'bg-blue-950/50', text: 'text-blue-400' },
  fruiting: { bg: 'bg-purple-950/50', text: 'text-purple-400' },
  harvesting: { bg: 'bg-emerald-950/50', text: 'text-emerald-400' },
  completed: { bg: 'bg-zinc-800/50', text: 'text-zinc-400' },
  contaminated: { bg: 'bg-red-950/50', text: 'text-red-400' },
  aborted: { bg: 'bg-zinc-800/50', text: 'text-zinc-500' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getLocationPath(locationId: string, locations: Location[]): string {
  const path: string[] = [];
  let current = locations.find(l => l.id === locationId);

  while (current) {
    path.unshift(current.name);
    current = current.parentId
      ? locations.find(l => l.id === current!.parentId)
      : undefined;
  }

  return path.join(' / ');
}

function calculateExpectedYield(grow: Grow): number {
  // Simple estimation based on substrate weight and spawn rate
  // Average BE (Biological Efficiency) assumption: 75% for fruiting, 50% for colonizing
  if (grow.status !== 'active') return 0;

  const substrateWeight = grow.substrateWeight || 0;
  const containerCount = grow.containerCount || 1;
  const totalSubstrate = substrateWeight * containerCount;

  // Estimate based on stage
  let efficiencyFactor = 0;
  switch (grow.currentStage) {
    case 'fruiting':
    case 'harvesting':
      efficiencyFactor = 0.75; // 75% BE expected
      break;
    case 'colonization':
      efficiencyFactor = 0.65; // Slightly lower for still colonizing
      break;
    case 'spawning':
      efficiencyFactor = 0.50; // Lower still for early stage
      break;
    default:
      efficiencyFactor = 0;
  }

  // Expected yield = substrate dry weight * BE factor
  // Assuming substrate is ~70% water for wet weight
  const drySubstrate = totalSubstrate * 0.3;
  return Math.round(drySubstrate * efficiencyFactor);
}

function calculateLocationStats(
  location: Location,
  allLocations: Location[],
  cultures: Culture[],
  grows: Grow[],
  strains: Strain[]
): LocationOccupancyStats {
  // Get cultures and grows at this location
  const locationCultures = cultures.filter(c => c.locationId === location.id);
  const locationGrows = grows.filter(g => g.locationId === location.id);

  // Get child locations
  const childLocations = allLocations.filter(l => l.parentId === location.id && l.isActive);

  // Calculate container count (from grows)
  const containerCount = locationGrows.reduce((sum, g) => sum + (g.containerCount || 1), 0);

  // Calculate yields
  const actualYield = locationGrows.reduce((sum, g) => sum + (g.totalYield || 0), 0);
  const expectedYield = locationGrows
    .filter(g => g.status === 'active')
    .reduce((sum, g) => sum + calculateExpectedYield(g), 0);

  // Build strain breakdown
  const strainMap = new Map<string, {
    strainId: string;
    strainName: string;
    cultureCount: number;
    growCount: number;
    containerCount: number;
    totalYield: number;
  }>();

  locationCultures.forEach(c => {
    const strain = strains.find(s => s.id === c.strainId);
    const strainName = strain?.name || 'Unknown';
    const existing = strainMap.get(c.strainId) || {
      strainId: c.strainId,
      strainName,
      cultureCount: 0,
      growCount: 0,
      containerCount: 0,
      totalYield: 0,
    };
    existing.cultureCount++;
    strainMap.set(c.strainId, existing);
  });

  locationGrows.forEach(g => {
    const strain = strains.find(s => s.id === g.strainId);
    const strainName = strain?.name || 'Unknown';
    const existing = strainMap.get(g.strainId) || {
      strainId: g.strainId,
      strainName,
      cultureCount: 0,
      growCount: 0,
      containerCount: 0,
      totalYield: 0,
    };
    existing.growCount++;
    existing.containerCount += g.containerCount || 1;
    existing.totalYield += g.totalYield || 0;
    strainMap.set(g.strainId, existing);
  });

  // Calculate child occupancy (recursive sum)
  let childOccupancy = 0;
  childLocations.forEach(child => {
    const childStats = calculateLocationStats(child, allLocations, cultures, grows, strains);
    childOccupancy += childStats.totalItems + childStats.childOccupancy;
  });

  const totalItems = locationCultures.length + locationGrows.length;
  const occupancyPercent = location.capacity
    ? Math.round(((totalItems + childOccupancy) / location.capacity) * 100)
    : 0;

  return {
    locationId: location.id,
    locationName: location.name,
    locationPath: getLocationPath(location.id, allLocations),
    level: location.level || 'room',
    cultureCount: locationCultures.length,
    growCount: locationGrows.length,
    containerCount,
    totalItems,
    capacity: location.capacity,
    occupancyPercent,
    actualYield,
    expectedYield,
    strainBreakdown: Array.from(strainMap.values()).sort((a, b) =>
      (b.cultureCount + b.growCount) - (a.cultureCount + a.growCount)
    ),
    cultures: locationCultures.map(c => {
      const strain = strains.find(s => s.id === c.strainId);
      return {
        id: c.id,
        label: c.label,
        type: c.type,
        strainName: strain?.name || 'Unknown',
        status: c.status,
        createdAt: c.createdAt,
      };
    }),
    grows: locationGrows.map(g => {
      const strain = strains.find(s => s.id === g.strainId);
      return {
        id: g.id,
        name: g.name,
        strainName: strain?.name || 'Unknown',
        stage: g.currentStage,
        status: g.status,
        containerCount: g.containerCount || 1,
        totalYield: g.totalYield || 0,
        expectedYield: calculateExpectedYield(g),
      };
    }),
    childCount: childLocations.length,
    childOccupancy,
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subValue, color = 'text-white' }) => (
  <div className="bg-zinc-800/50 rounded-lg p-3">
    <div className="flex items-center gap-2 mb-1">
      <span className={color}>{icon}</span>
      <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
    </div>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    {subValue && <p className="text-xs text-zinc-500">{subValue}</p>}
  </div>
);

interface LocationRowProps {
  stats: LocationOccupancyStats;
  isExpanded: boolean;
  onToggle: () => void;
  depth: number;
}

const LocationRow: React.FC<LocationRowProps> = ({ stats, isExpanded, onToggle, depth }) => {
  const hasItems = stats.totalItems > 0 || stats.childOccupancy > 0;
  const occupancyColor =
    stats.occupancyPercent > 90 ? 'text-red-400' :
    stats.occupancyPercent > 70 ? 'text-amber-400' :
    stats.occupancyPercent > 0 ? 'text-emerald-400' : 'text-zinc-500';

  return (
    <div className="border-b border-zinc-800 last:border-b-0">
      <div
        className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 cursor-pointer transition-colors"
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
        onClick={onToggle}
      >
        {/* Expand/collapse */}
        <button className="p-0.5 text-zinc-500 hover:text-white">
          {hasItems ? (
            isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />
          ) : (
            <span className="w-4" />
          )}
        </button>

        {/* Location name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">{stats.locationName}</span>
            <span className="text-xs text-zinc-500 capitalize">({stats.level})</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 text-sm">
          {/* Cultures */}
          <div className="flex items-center gap-1.5 text-blue-400">
            <Icons.Culture />
            <span>{stats.cultureCount}</span>
          </div>

          {/* Grows */}
          <div className="flex items-center gap-1.5 text-purple-400">
            <Icons.Grow />
            <span>{stats.growCount}</span>
          </div>

          {/* Containers */}
          <div className="flex items-center gap-1.5 text-amber-400">
            <Icons.Box />
            <span>{stats.containerCount}</span>
          </div>

          {/* Yield */}
          {(stats.actualYield > 0 || stats.expectedYield > 0) && (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Icons.Scale />
              <span>{stats.actualYield}g</span>
              {stats.expectedYield > 0 && (
                <span className="text-zinc-500 text-xs">(+{stats.expectedYield}g)</span>
              )}
            </div>
          )}

          {/* Occupancy */}
          {stats.capacity && (
            <div className={`flex items-center gap-1.5 ${occupancyColor}`}>
              <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    stats.occupancyPercent > 90 ? 'bg-red-500' :
                    stats.occupancyPercent > 70 ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(stats.occupancyPercent, 100)}%` }}
                />
              </div>
              <span className="text-xs">{stats.occupancyPercent}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && hasItems && (
        <div className="bg-zinc-900/50 border-t border-zinc-800 p-4" style={{ marginLeft: `${depth * 20 + 12}px` }}>
          {/* Strain breakdown */}
          {stats.strainBreakdown.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <Icons.Dna />
                Varieties at this Location
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {stats.strainBreakdown.map(strain => (
                  <div key={strain.strainId} className="bg-zinc-800/50 rounded-lg p-2">
                    <p className="font-medium text-white text-sm truncate">{strain.strainName}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                      {strain.cultureCount > 0 && (
                        <span className="text-blue-400">{strain.cultureCount} culture{strain.cultureCount !== 1 ? 's' : ''}</span>
                      )}
                      {strain.growCount > 0 && (
                        <span className="text-purple-400">{strain.growCount} grow{strain.growCount !== 1 ? 's' : ''}</span>
                      )}
                      {strain.containerCount > 0 && (
                        <span className="text-amber-400">{strain.containerCount} block{strain.containerCount !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    {strain.totalYield > 0 && (
                      <p className="text-xs text-emerald-400 mt-1">{strain.totalYield}g harvested</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cultures list */}
          {stats.cultures.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <Icons.Culture />
                Cultures ({stats.cultures.length})
              </h4>
              <div className="space-y-1">
                {stats.cultures.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-zinc-800/30 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-blue-400">{c.label}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-sm text-zinc-300">{c.strainName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-zinc-700 rounded capitalize">{c.type.replace('_', ' ')}</span>
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                        c.status === 'active' ? 'bg-emerald-950/50 text-emerald-400' :
                        c.status === 'ready' ? 'bg-blue-950/50 text-blue-400' :
                        c.status === 'contaminated' ? 'bg-red-950/50 text-red-400' :
                        'bg-zinc-700 text-zinc-400'
                      }`}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grows list */}
          {stats.grows.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <Icons.Grow />
                Grows ({stats.grows.length})
              </h4>
              <div className="space-y-1">
                {stats.grows.map(g => (
                  <div key={g.id} className="flex items-center justify-between bg-zinc-800/30 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-purple-400">{g.name}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-sm text-zinc-300">{g.strainName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-amber-400">{g.containerCount} block{g.containerCount !== 1 ? 's' : ''}</span>
                      {g.totalYield > 0 && (
                        <span className="text-xs text-emerald-400">{g.totalYield}g</span>
                      )}
                      {g.expectedYield > 0 && (
                        <span className="text-xs text-zinc-500">(+{g.expectedYield}g est.)</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${stageColors[g.stage].bg} ${stageColors[g.stage].text}`}>
                        {g.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LocationOccupancy: React.FC<LocationOccupancyProps> = ({ className = '' }) => {
  const { state } = useData();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterStrain, setFilterStrain] = useState<string>('all');
  const [showEmptyLocations, setShowEmptyLocations] = useState(true);

  // Calculate stats for all active locations
  const locationStats = useMemo(() => {
    const activeLocations = state.locations.filter(l => l.isActive);
    const activeCultures = state.cultures.filter(c => c.status !== 'archived');
    const activeGrows = state.grows;

    return activeLocations.map(loc =>
      calculateLocationStats(loc, activeLocations, activeCultures, activeGrows, state.strains)
    );
  }, [state.locations, state.cultures, state.grows, state.strains]);

  // Build hierarchical structure
  const rootStats = useMemo(() => {
    return locationStats.filter(ls => {
      const location = state.locations.find(l => l.id === ls.locationId);
      return !location?.parentId;
    });
  }, [locationStats, state.locations]);

  // Calculate totals
  const totals = useMemo(() => {
    return locationStats.reduce((acc, ls) => ({
      cultures: acc.cultures + ls.cultureCount,
      grows: acc.grows + ls.growCount,
      containers: acc.containers + ls.containerCount,
      actualYield: acc.actualYield + ls.actualYield,
      expectedYield: acc.expectedYield + ls.expectedYield,
      uniqueStrains: new Set([...acc.uniqueStrains, ...ls.strainBreakdown.map(s => s.strainId)]),
    }), {
      cultures: 0,
      grows: 0,
      containers: 0,
      actualYield: 0,
      expectedYield: 0,
      uniqueStrains: new Set<string>(),
    });
  }, [locationStats]);

  // Get all strains that have items
  const activeStrains = useMemo(() => {
    const strainIds = new Set<string>();
    locationStats.forEach(ls => {
      ls.strainBreakdown.forEach(s => strainIds.add(s.strainId));
    });
    return state.strains.filter(s => strainIds.has(s.id));
  }, [locationStats, state.strains]);

  // Filter stats
  const filteredStats = useMemo(() => {
    let filtered = locationStats;

    if (!showEmptyLocations) {
      filtered = filtered.filter(ls => ls.totalItems > 0 || ls.childOccupancy > 0);
    }

    if (filterStrain !== 'all') {
      filtered = filtered.filter(ls =>
        ls.strainBreakdown.some(s => s.strainId === filterStrain)
      );
    }

    return filtered;
  }, [locationStats, showEmptyLocations, filterStrain]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(locationStats.map(ls => ls.locationId)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Recursive render function for hierarchical display
  const renderLocationStats = (stats: LocationOccupancyStats, depth: number = 0): React.ReactNode => {
    const childStats = filteredStats.filter(ls => {
      const location = state.locations.find(l => l.id === ls.locationId);
      return location?.parentId === stats.locationId;
    });

    if (!showEmptyLocations && stats.totalItems === 0 && stats.childOccupancy === 0) {
      // Still render children even if parent is empty
      return childStats.map(child => renderLocationStats(child, depth));
    }

    return (
      <div key={stats.locationId}>
        <LocationRow
          stats={stats}
          isExpanded={expandedIds.has(stats.locationId)}
          onToggle={() => toggleExpand(stats.locationId)}
          depth={depth}
        />
        {childStats.map(child => renderLocationStats(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Location Occupancy</h2>
          <p className="text-sm text-zinc-400">Track items, varieties, and yields across your lab</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Icons.Location />}
          label="Locations"
          value={state.locations.filter(l => l.isActive).length}
          color="text-purple-400"
        />
        <StatCard
          icon={<Icons.Culture />}
          label="Cultures"
          value={totals.cultures}
          color="text-blue-400"
        />
        <StatCard
          icon={<Icons.Grow />}
          label="Active Grows"
          value={totals.grows}
          color="text-purple-400"
        />
        <StatCard
          icon={<Icons.Box />}
          label="Total Blocks"
          value={totals.containers}
          color="text-amber-400"
        />
        <StatCard
          icon={<Icons.Scale />}
          label="Harvested"
          value={`${totals.actualYield}g`}
          subValue={totals.expectedYield > 0 ? `+${totals.expectedYield}g expected` : undefined}
          color="text-emerald-400"
        />
        <StatCard
          icon={<Icons.Dna />}
          label="Varieties"
          value={totals.uniqueStrains.size}
          color="text-pink-400"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-400">Strain:</label>
          <select
            value={filterStrain}
            onChange={(e) => setFilterStrain(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Strains</option>
            {activeStrains.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showEmptyLocations}
            onChange={(e) => setShowEmptyLocations(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-700 border-zinc-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
          />
          Show empty locations
        </label>

        <div className="flex-1" />

        <button
          onClick={expandAll}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Collapse All
        </button>
      </div>

      {/* Location List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center gap-3 p-3 border-b border-zinc-800 bg-zinc-800/50 text-sm text-zinc-400">
          <span className="w-5" /> {/* Spacer for chevron */}
          <span className="flex-1">Location</span>
          <div className="flex items-center gap-4">
            <span className="w-12 text-center">Cultures</span>
            <span className="w-12 text-center">Grows</span>
            <span className="w-12 text-center">Blocks</span>
            <span className="w-24 text-center">Yield</span>
            <span className="w-24 text-center">Occupancy</span>
          </div>
        </div>

        {/* Location Rows */}
        <div className="divide-y divide-zinc-800">
          {rootStats
            .filter(rs => filteredStats.some(fs => {
              const loc = state.locations.find(l => l.id === fs.locationId);
              // Include if it's a root or descendant of this root
              let current = loc;
              while (current) {
                if (current.id === rs.locationId) return true;
                current = current.parentId ? state.locations.find(l => l.id === current?.parentId) : undefined;
              }
              return false;
            }))
            .map(rs => renderLocationStats(rs, 0))
          }
        </div>

        {filteredStats.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-zinc-400">No locations match the current filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationOccupancy;
