// ============================================================================
// COLD STORAGE CHECK (Fridge/Cool Room Inventory)
// Mobile-friendly interface for reviewing cold storage items
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useData } from '../../store';
import { format, differenceInDays, addDays } from 'date-fns';
import type { Culture, Location } from '../../store/types';
import { formatTemperatureRange, type TemperatureUnit } from '../../utils/temperature';

// ============================================================================
// TYPES
// ============================================================================

interface StorageItem {
  id: string;
  type: 'culture' | 'spawn' | 'harvest';
  label: string;
  strain?: string;
  locationId: string;
  storedAt?: Date;
  expiresAt?: Date;
  status: string;
  healthRating?: number;
  notes?: string;
  daysStored?: number;
  daysUntilExpiry?: number;
}

interface CheckResult {
  itemId: string;
  status: 'good' | 'attention' | 'remove';
  notes?: string;
  checkedAt: Date;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Snowflake: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18M5.63 5.63l12.74 12.74M5.63 18.37L18.37 5.63M3 12h18M7.76 7.76l8.48 8.48M7.76 16.24l8.48-8.48" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Thermometer: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Clipboard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  Location: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

// ============================================================================
// HEALTH INDICATOR
// ============================================================================

const HealthIndicator: React.FC<{ rating: number }> = ({ rating }) => {
  const color = rating >= 8 ? 'text-emerald-400' : rating >= 5 ? 'text-amber-400' : 'text-red-400';
  const bg = rating >= 8 ? 'bg-emerald-400' : rating >= 5 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-3 rounded-sm ${i < rating ? bg : 'bg-zinc-700'}`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${color}`}>{rating}/10</span>
    </div>
  );
};

// ============================================================================
// STORAGE ITEM CARD
// ============================================================================

const StorageItemCard: React.FC<{
  item: StorageItem;
  checkResult?: CheckResult;
  onCheck: (status: 'good' | 'attention' | 'remove', notes?: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ item, checkResult, onCheck, isExpanded, onToggle }) => {
  const [notes, setNotes] = useState(checkResult?.notes || '');

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-zinc-700';
    if (status === 'good') return 'bg-emerald-500';
    if (status === 'attention') return 'bg-amber-500';
    if (status === 'remove') return 'bg-red-500';
    return 'bg-zinc-700';
  };

  const getExpiryStatus = () => {
    if (!item.daysUntilExpiry) return null;
    if (item.daysUntilExpiry < 0) return { text: 'Expired', color: 'text-red-400 bg-red-500/20' };
    if (item.daysUntilExpiry <= 7) return { text: `${item.daysUntilExpiry}d left`, color: 'text-amber-400 bg-amber-500/20' };
    return { text: `${item.daysUntilExpiry}d left`, color: 'text-zinc-400 bg-zinc-700' };
  };

  const expiryStatus = getExpiryStatus();

  return (
    <div className={`bg-zinc-900/50 border rounded-xl overflow-hidden transition-all ${
      checkResult ?
        checkResult.status === 'good' ? 'border-emerald-500/30' :
        checkResult.status === 'attention' ? 'border-amber-500/30' :
        'border-red-500/30'
      : 'border-zinc-800'
    }`}>
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors"
      >
        {/* Check Status Indicator */}
        <div className={`w-3 h-3 rounded-full ${getStatusColor(checkResult?.status)} flex-shrink-0`} />

        {/* Main Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white">{item.label}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              item.type === 'culture' ? 'bg-blue-500/20 text-blue-400' :
              item.type === 'spawn' ? 'bg-emerald-500/20 text-emerald-400' :
              'bg-purple-500/20 text-purple-400'
            }`}>
              {item.type}
            </span>
            {expiryStatus && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${expiryStatus.color}`}>
                {expiryStatus.text}
              </span>
            )}
          </div>
          {item.strain && (
            <p className="text-sm text-zinc-400 truncate">{item.strain}</p>
          )}
        </div>

        {/* Expand Icon */}
        <div className="text-zinc-500">
          {isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-zinc-800/50 pt-4 space-y-4">
          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {item.daysStored !== undefined && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Icons.Clock />
                <span>Stored: {item.daysStored} days</span>
              </div>
            )}
            {item.healthRating !== undefined && (
              <div>
                <HealthIndicator rating={item.healthRating} />
              </div>
            )}
            {item.storedAt && (
              <div className="text-xs text-zinc-500">
                Added: {format(item.storedAt, 'MMM d, yyyy')}
              </div>
            )}
            {item.expiresAt && (
              <div className="text-xs text-zinc-500">
                Expires: {format(item.expiresAt, 'MMM d, yyyy')}
              </div>
            )}
          </div>

          {item.notes && (
            <p className="text-sm text-zinc-400 bg-zinc-800/30 rounded-lg p-2">
              {item.notes}
            </p>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onCheck('good', notes)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                checkResult?.status === 'good'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
            >
              <Icons.Check />
              Good
            </button>
            <button
              onClick={() => onCheck('attention', notes)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                checkResult?.status === 'attention'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
              }`}
            >
              <Icons.AlertTriangle />
              Attention
            </button>
            <button
              onClick={() => onCheck('remove', notes)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                checkResult?.status === 'remove'
                  ? 'bg-red-500 text-white'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              <Icons.Trash />
              Remove
            </button>
          </div>

          {/* Notes Input */}
          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this item..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none h-20"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COLD STORAGE SECTION
// ============================================================================

const ColdStorageSection: React.FC<{
  location: Location;
  items: StorageItem[];
  checkResults: Map<string, CheckResult>;
  onCheck: (itemId: string, status: 'good' | 'attention' | 'remove', notes?: string) => void;
  expandedItem: string | null;
  onToggleItem: (itemId: string) => void;
  temperatureUnit: TemperatureUnit;
}> = ({ location, items, checkResults, onCheck, expandedItem, onToggleItem, temperatureUnit }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const checkedCount = items.filter(i => checkResults.has(i.id)).length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  const stats = useMemo(() => {
    let good = 0, attention = 0, remove = 0;
    items.forEach(item => {
      const result = checkResults.get(item.id);
      if (result?.status === 'good') good++;
      else if (result?.status === 'attention') attention++;
      else if (result?.status === 'remove') remove++;
    });
    return { good, attention, remove };
  }, [items, checkResults]);

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-4 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Icons.Snowflake />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{location.name}</h3>
            <span className="text-xs text-zinc-500">({items.length} items)</span>
          </div>
          {location.tempRange && (
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <Icons.Thermometer />
              {formatTemperatureRange(location.tempRange.min, location.tempRange.max, temperatureUnit)}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            {stats.good > 0 && <span className="text-emerald-400">{stats.good}</span>}
            {stats.attention > 0 && <span className="text-amber-400">{stats.attention}</span>}
            {stats.remove > 0 && <span className="text-red-400">{stats.remove}</span>}
          </div>
          <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 w-10">{Math.round(progress)}%</span>
          <div className="text-zinc-400">
            {isCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronDown />}
          </div>
        </div>
      </button>

      {!isCollapsed && (
        <div className="p-4 pt-0 space-y-3">
          {items.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-4">No items in this location</p>
          ) : (
            items.map(item => (
              <StorageItemCard
                key={item.id}
                item={item}
                checkResult={checkResults.get(item.id)}
                onCheck={(status, notes) => onCheck(item.id, status, notes)}
                isExpanded={expandedItem === item.id}
                onToggle={() => onToggleItem(item.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ColdStorageCheck: React.FC = () => {
  const { state, getLocation, getStrain, updateCulture } = useData();
  const temperatureUnit: TemperatureUnit = state.settings?.defaultUnits || 'imperial';

  // State
  const [checkResults, setCheckResults] = useState<Map<string, CheckResult>>(new Map());
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Get cold storage locations (fridge, cold storage types)
  const coldStorageLocations = useMemo(() => {
    return state.locations.filter(loc => {
      // Check if it's a cold storage location by type or temperature
      const isColdType = loc.type === 'storage' ||
                         loc.name.toLowerCase().includes('fridge') ||
                         loc.name.toLowerCase().includes('refrigerat') ||
                         loc.name.toLowerCase().includes('cold');
      const isColdTemp = loc.tempRange && loc.tempRange.max <= 45; // Below 45°F / ~7°C
      return (isColdType || isColdTemp) && loc.isActive;
    });
  }, [state.locations]);

  // Get items in cold storage
  const storageItems = useMemo(() => {
    const items: StorageItem[] = [];
    const now = new Date();

    // Add cultures in cold storage
    state.cultures.forEach(culture => {
      if (culture.locationId && coldStorageLocations.some(loc => loc.id === culture.locationId)) {
        const strain = culture.strainId ? getStrain(culture.strainId) : undefined;
        const storedAt = culture.createdAt ? new Date(culture.createdAt) : undefined;
        const expiresAt = culture.expiresAt ? new Date(culture.expiresAt) : undefined;

        items.push({
          id: culture.id,
          type: 'culture',
          label: culture.label,
          strain: strain?.name,
          locationId: culture.locationId,
          storedAt,
          expiresAt,
          status: culture.status,
          healthRating: culture.healthRating,
          notes: culture.notes,
          daysStored: storedAt ? differenceInDays(now, storedAt) : undefined,
          daysUntilExpiry: expiresAt ? differenceInDays(expiresAt, now) : undefined,
        });
      }
    });

    return items;
  }, [state.cultures, coldStorageLocations, getStrain]);

  // Group items by location
  const itemsByLocation = useMemo(() => {
    const map = new Map<string, StorageItem[]>();
    coldStorageLocations.forEach(loc => map.set(loc.id, []));
    storageItems.forEach(item => {
      const items = map.get(item.locationId) || [];
      items.push(item);
      map.set(item.locationId, items);
    });
    return map;
  }, [storageItems, coldStorageLocations]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = storageItems.length;
    const checked = checkResults.size;
    const good = Array.from(checkResults.values()).filter(r => r.status === 'good').length;
    const attention = Array.from(checkResults.values()).filter(r => r.status === 'attention').length;
    const remove = Array.from(checkResults.values()).filter(r => r.status === 'remove').length;
    const expiring = storageItems.filter(i => i.daysUntilExpiry !== undefined && i.daysUntilExpiry <= 7 && i.daysUntilExpiry >= 0).length;
    const expired = storageItems.filter(i => i.daysUntilExpiry !== undefined && i.daysUntilExpiry < 0).length;

    return { total, checked, good, attention, remove, expiring, expired };
  }, [storageItems, checkResults]);

  // Handle check
  const handleCheck = (itemId: string, status: 'good' | 'attention' | 'remove', notes?: string) => {
    setCheckResults(prev => {
      const next = new Map(prev);
      next.set(itemId, { itemId, status, notes, checkedAt: new Date() });
      return next;
    });
  };

  // Handle toggle item
  const handleToggleItem = (itemId: string) => {
    setExpandedItem(prev => prev === itemId ? null : itemId);
  };

  // Complete check session
  const handleCompleteCheck = async () => {
    // Apply actions for items marked for removal or attention
    for (const [itemId, result] of checkResults) {
      const item = storageItems.find(i => i.id === itemId);
      if (!item) continue;

      if (result.status === 'remove' && item.type === 'culture') {
        await updateCulture(itemId, {
          status: 'archived',
          notes: `${item.notes || ''}\n[${format(new Date(), 'MMM d, yyyy')}] Removed during cold storage check: ${result.notes || 'No notes'}`
        });
      }
    }

    setShowSummary(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Icons.Snowflake />
            Cold Storage Check
          </h1>
          <p className="text-zinc-400 mt-1">Review fridge and cold room inventory</p>
        </div>
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Icons.Clipboard />
          {showSummary ? 'Hide Summary' : 'View Summary'}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Items</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Checked</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.checked}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Good</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.good}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Attention</p>
          <p className="text-2xl font-bold text-amber-400">{stats.attention}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Remove</p>
          <p className="text-2xl font-bold text-red-400">{stats.remove}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Expiring Soon</p>
          <p className="text-2xl font-bold text-amber-400">{stats.expiring}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Expired</p>
          <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Check Progress</span>
          <span className="text-sm text-zinc-400">
            {stats.checked}/{stats.total} items ({stats.total > 0 ? Math.round((stats.checked / stats.total) * 100) : 0}%)
          </span>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
            style={{ width: `${stats.total > 0 ? (stats.checked / stats.total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <div className="bg-zinc-900/50 border border-emerald-500/30 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Check Summary</h3>

          <div className="space-y-4">
            {stats.attention > 0 && (
              <div>
                <h4 className="text-amber-400 font-medium mb-2">Items Needing Attention ({stats.attention})</h4>
                <div className="space-y-2">
                  {Array.from(checkResults.entries())
                    .filter(([, r]) => r.status === 'attention')
                    .map(([id, r]) => {
                      const item = storageItems.find(i => i.id === id);
                      return (
                        <div key={id} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
                          <span className="text-white font-medium">{item?.label}</span>
                          {r.notes && <p className="text-amber-400 mt-1">{r.notes}</p>}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {stats.remove > 0 && (
              <div>
                <h4 className="text-red-400 font-medium mb-2">Items to Remove ({stats.remove})</h4>
                <div className="space-y-2">
                  {Array.from(checkResults.entries())
                    .filter(([, r]) => r.status === 'remove')
                    .map(([id, r]) => {
                      const item = storageItems.find(i => i.id === id);
                      return (
                        <div key={id} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm">
                          <span className="text-white font-medium">{item?.label}</span>
                          {r.notes && <p className="text-red-400 mt-1">{r.notes}</p>}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {stats.checked > 0 && stats.checked === stats.total && (
              <button
                onClick={handleCompleteCheck}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Complete Check & Apply Actions
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cold Storage Locations */}
      {coldStorageLocations.length === 0 ? (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <Icons.Snowflake />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Cold Storage Locations</h3>
          <p className="text-zinc-400 max-w-md mx-auto">
            Set up cold storage locations in Lab Mapping first.
            Create locations with "cold_storage" type or temperatures below 45°F.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {coldStorageLocations.map(location => (
            <ColdStorageSection
              key={location.id}
              location={location}
              items={itemsByLocation.get(location.id) || []}
              checkResults={checkResults}
              onCheck={handleCheck}
              expandedItem={expandedItem}
              onToggleItem={handleToggleItem}
              temperatureUnit={temperatureUnit}
            />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {stats.total > 0 && (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                storageItems.forEach(item => {
                  if (!checkResults.has(item.id)) {
                    handleCheck(item.id, 'good');
                  }
                });
              }}
              className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors"
            >
              Mark All Remaining as Good
            </button>
            <button
              onClick={() => setCheckResults(new Map())}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Reset All Checks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColdStorageCheck;
