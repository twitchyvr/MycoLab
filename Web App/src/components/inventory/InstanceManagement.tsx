// ============================================================================
// INSTANCE MANAGEMENT - Track individual containers/equipment
// View and manage individual instances of reusable inventory items
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useData } from '../../store';
import type { LabItemInstance, InstanceStatus } from '../../store/types';
import { format } from 'date-fns';

// Icons
const Icons = {
  Container: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M8 3v4l-2 9a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4l-2-9V3"/><line x1="9" y1="3" x2="15" y2="3"/></svg>,
  Equipment: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Link: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Steam: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M8 14c0 0 1-3 4-3s4 3 4 3"/><path d="M8 10c0 0 1-3 4-3s4 3 4 3"/><path d="M8 6c0 0 1-3 4-3s4 3 4 3"/><ellipse cx="12" cy="18" rx="8" ry="4"/></svg>,
  Sparkles: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 16l.75 2.25L8 19l-2.25.75L5 22l-.75-2.25L2 19l2.25-.75L5 16z"/><path d="M19 10l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5z"/></svg>,
};

const STATUS_CONFIG: Record<InstanceStatus, { label: string; color: string; bgColor: string; icon: React.FC }> = {
  available: { label: 'Available', color: 'text-emerald-400', bgColor: 'bg-emerald-950/50 border-emerald-700', icon: Icons.Check },
  in_use: { label: 'In Use', color: 'text-blue-400', bgColor: 'bg-blue-950/50 border-blue-700', icon: Icons.Link },
  sterilized: { label: 'Sterilized', color: 'text-purple-400', bgColor: 'bg-purple-950/50 border-purple-700', icon: Icons.Steam },
  dirty: { label: 'Needs Cleaning', color: 'text-amber-400', bgColor: 'bg-amber-950/50 border-amber-700', icon: Icons.Clock },
  damaged: { label: 'Damaged', color: 'text-red-400', bgColor: 'bg-red-950/50 border-red-700', icon: Icons.AlertTriangle },
  disposed: { label: 'Disposed', color: 'text-zinc-500', bgColor: 'bg-zinc-900/50 border-zinc-700', icon: Icons.Trash },
};

type Page = 'dashboard' | 'commandcenter' | 'today' | 'dailycheck' | 'harvest' | 'forecast' | 'coldstorage' | 'observations' | 'eventlog' | 'library' | 'cultureguide' | 'inventory' | 'stock' | 'instances' | 'cultures' | 'spawn' | 'lineage' | 'grows' | 'recipes' | 'labspaces' | 'labmapping' | 'occupancy' | 'labels' | 'scanner' | 'calculator' | 'spawnrate' | 'pressure' | 'multiplication' | 'contamination' | 'efficiency' | 'analytics' | 'financial' | 'strainanalytics' | 'outcomes' | 'settings' | 'profile' | 'devlog' | 'featuretracker';

interface InstanceManagementProps {
  onNavigate?: (page: Page, itemId?: string) => void;
}

export const InstanceManagement: React.FC<InstanceManagementProps> = ({ onNavigate }) => {
  const {
    state,
    activeLabItemInstances,
    availableLabItemInstances,
    inUseLabItemInstances,
    getInventoryItem,
    getInventoryLot,
    updateLabItemInstance,
    releaseInstance,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<InstanceStatus[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Group instances by inventory item
  const instancesByItem = useMemo(() => {
    const grouped = new Map<string, LabItemInstance[]>();

    for (const instance of activeLabItemInstances) {
      const instances = grouped.get(instance.inventoryItemId) || [];
      instances.push(instance);
      grouped.set(instance.inventoryItemId, instances);
    }

    // Sort instances within each group by instance number
    grouped.forEach((instances) => {
      instances.sort((a, b) => a.instanceNumber - b.instanceNumber);
    });

    return grouped;
  }, [activeLabItemInstances]);

  // Get unique inventory items that have instances
  const itemsWithInstances = useMemo(() => {
    return Array.from(instancesByItem.keys())
      .map(id => getInventoryItem(id))
      .filter(Boolean)
      .sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
  }, [instancesByItem, getInventoryItem]);

  // Filter instances
  const filteredInstances = useMemo(() => {
    let instances = activeLabItemInstances;

    // Filter by status
    if (selectedStatuses.length > 0) {
      instances = instances.filter(i => selectedStatuses.includes(i.status));
    }

    // Filter by inventory item
    if (selectedItemId) {
      instances = instances.filter(i => i.inventoryItemId === selectedItemId);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      instances = instances.filter(i => {
        const item = getInventoryItem(i.inventoryItemId);
        return (
          item?.name.toLowerCase().includes(query) ||
          i.label?.toLowerCase().includes(query) ||
          i.usageRef?.entityLabel?.toLowerCase().includes(query) ||
          `#${i.instanceNumber}`.includes(query)
        );
      });
    }

    return instances;
  }, [activeLabItemInstances, selectedStatuses, selectedItemId, searchQuery, getInventoryItem]);

  // Stats
  const stats = useMemo(() => ({
    total: activeLabItemInstances.length,
    available: availableLabItemInstances.length,
    inUse: inUseLabItemInstances.length,
    dirty: activeLabItemInstances.filter(i => i.status === 'dirty').length,
    sterilized: activeLabItemInstances.filter(i => i.status === 'sterilized').length,
    damaged: activeLabItemInstances.filter(i => i.status === 'damaged').length,
  }), [activeLabItemInstances, availableLabItemInstances, inUseLabItemInstances]);

  const toggleStatus = (status: InstanceStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleStatusChange = async (instanceId: string, newStatus: InstanceStatus) => {
    const instance = activeLabItemInstances.find(i => i.id === instanceId);
    if (!instance) return;

    // If changing from in_use to available, use releaseInstance (handles lot updates)
    if (instance.status === 'in_use' && newStatus === 'available') {
      await releaseInstance(instanceId);
    } else {
      // For all other status changes, just update the status directly
      await updateLabItemInstance(instanceId, { status: newStatus });
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Container & Equipment Instances</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Track individual jars, bags, plates, and equipment
          </p>
        </div>
        {/* Clickable stats for quick filtering */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setSelectedStatuses([])}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              selectedStatuses.length === 0
                ? 'bg-zinc-700 border-zinc-600 text-white'
                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <span className="text-zinc-400">Total:</span>{' '}
            <span className="font-medium">{stats.total}</span>
          </button>
          <button
            onClick={() => setSelectedStatuses(['available'])}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              selectedStatuses.length === 1 && selectedStatuses[0] === 'available'
                ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400 hover:bg-emerald-950/50'
            }`}
          >
            {stats.available} available
          </button>
          <button
            onClick={() => setSelectedStatuses(['in_use'])}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              selectedStatuses.length === 1 && selectedStatuses[0] === 'in_use'
                ? 'bg-blue-950/50 border-blue-700 text-blue-300'
                : 'bg-blue-950/30 border-blue-800/50 text-blue-400 hover:bg-blue-950/50'
            }`}
          >
            {stats.inUse} in use
          </button>
          {stats.dirty > 0 && (
            <button
              onClick={() => setSelectedStatuses(['dirty'])}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                selectedStatuses.length === 1 && selectedStatuses[0] === 'dirty'
                  ? 'bg-amber-950/50 border-amber-700 text-amber-300'
                  : 'bg-amber-950/30 border-amber-800/50 text-amber-400 hover:bg-amber-950/50'
              }`}
            >
              {stats.dirty} need cleaning
            </button>
          )}
          {stats.sterilized > 0 && (
            <button
              onClick={() => setSelectedStatuses(['sterilized'])}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                selectedStatuses.length === 1 && selectedStatuses[0] === 'sterilized'
                  ? 'bg-purple-950/50 border-purple-700 text-purple-300'
                  : 'bg-purple-950/30 border-purple-800/50 text-purple-400 hover:bg-purple-950/50'
              }`}
            >
              {stats.sterilized} sterilized
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search instances by name, label, or linked item..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <Icons.Search />
          </div>
        </div>

        {/* Item Type Filter */}
        <select
          value={selectedItemId || ''}
          onChange={e => setSelectedItemId(e.target.value || null)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Item Types</option>
          {itemsWithInstances.map(item => item && (
            <option key={item.id} value={item.id}>
              {item.name} ({instancesByItem.get(item.id)?.length || 0})
            </option>
          ))}
        </select>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-sm"><Icons.Filter /></span>
          {(Object.entries(STATUS_CONFIG) as [InstanceStatus, typeof STATUS_CONFIG[InstanceStatus]][])
            .filter(([status]) => status !== 'disposed')
            .map(([status, config]) => (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                  selectedStatuses.includes(status)
                    ? `${config.bgColor} ${config.color} border`
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-300'
                }`}
              >
                <config.icon />
                {config.label}
              </button>
            ))}
        </div>
      </div>

      {/* Instance List */}
      {activeLabItemInstances.length === 0 ? (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-700/50 text-zinc-400 mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
              <path d="M8 3v4l-2 9a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4l-2-9V3"/>
              <line x1="9" y1="3" x2="15" y2="3"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No tracked instances yet</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
            When you receive containers or equipment with "container" or "equipment" behavior,
            individual instances will be created and tracked here. You can then assign them to
            cultures, grows, and spawn.
          </p>
          <button
            onClick={() => onNavigate?.('stock')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Icons.Container />
            Go to Stock Management
          </button>
        </div>
      ) : filteredInstances.length === 0 ? (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-8 text-center">
          <p className="text-zinc-400">No instances match your filters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedStatuses([]);
              setSelectedItemId(null);
            }}
            className="text-sm text-emerald-400 hover:text-emerald-300 mt-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Group by inventory item if no specific item selected */}
          {!selectedItemId ? (
            itemsWithInstances.map(item => {
              if (!item) return null;
              const itemInstances = filteredInstances.filter(i => i.inventoryItemId === item.id);
              if (itemInstances.length === 0) return null;

              const isExpanded = expandedItems.has(item.id);
              const availableCount = itemInstances.filter(i => i.status === 'available').length;
              const inUseCount = itemInstances.filter(i => i.status === 'in_use').length;

              return (
                <div key={item.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg overflow-hidden">
                  {/* Item Header */}
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.itemBehavior === 'container' ? 'bg-blue-950/50 text-blue-400' : 'bg-purple-950/50 text-purple-400'}`}>
                        {item.itemBehavior === 'container' ? <Icons.Container /> : <Icons.Equipment />}
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-sm text-zinc-400">
                          {itemInstances.length} instances
                          {availableCount > 0 && <span className="text-emerald-400 ml-2">{availableCount} available</span>}
                          {inUseCount > 0 && <span className="text-blue-400 ml-2">{inUseCount} in use</span>}
                        </p>
                      </div>
                    </div>
                    <div className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {/* Instance List */}
                  {isExpanded && (
                    <div className="border-t border-zinc-700 divide-y divide-zinc-700/50">
                      {itemInstances.map(instance => (
                        <InstanceRow
                          key={instance.id}
                          instance={instance}
                          item={item}
                          onStatusChange={handleStatusChange}
                          onNavigate={onNavigate}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            /* Flat list when specific item selected */
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg divide-y divide-zinc-700/50">
              {filteredInstances.map(instance => {
                const item = getInventoryItem(instance.inventoryItemId);
                return (
                  <InstanceRow
                    key={instance.id}
                    instance={instance}
                    item={item}
                    onStatusChange={handleStatusChange}
                    onNavigate={onNavigate}
                    formatCurrency={formatCurrency}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Instance Row Component
interface InstanceRowProps {
  instance: LabItemInstance;
  item: ReturnType<ReturnType<typeof useData>['getInventoryItem']>;
  onStatusChange: (instanceId: string, status: InstanceStatus) => void;
  onNavigate?: (page: Page, itemId?: string) => void;
  formatCurrency: (value: number) => string;
  showItemName?: boolean;
}

const InstanceRow: React.FC<InstanceRowProps> = ({ instance, item, onStatusChange, onNavigate, formatCurrency, showItemName }) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusConfig = STATUS_CONFIG[instance.status];

  // Map entity type to navigation page
  const getNavigationPage = (entityType: string): Page | null => {
    switch (entityType) {
      case 'prepared_spawn': return 'spawn';
      case 'culture': return 'cultures';
      case 'grow': return 'grows';
      default: return null;
    }
  };

  const handleLinkClick = () => {
    if (instance.usageRef && onNavigate) {
      const page = getNavigationPage(instance.usageRef.entityType);
      if (page) {
        onNavigate(page, instance.usageRef.entityId);
      }
    }
  };

  // Quick action buttons based on current status
  const getQuickActions = () => {
    switch (instance.status) {
      case 'dirty':
        return [
          { status: 'available' as InstanceStatus, label: 'Mark Clean', icon: Icons.Sparkles },
          { status: 'sterilized' as InstanceStatus, label: 'Sterilize', icon: Icons.Steam },
        ];
      case 'available':
        return [
          { status: 'sterilized' as InstanceStatus, label: 'Sterilize', icon: Icons.Steam },
        ];
      case 'in_use':
        return []; // Can't quick-change in_use status (need to release properly)
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  return (
    <div className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Instance Number */}
        <div className="w-10 h-10 rounded-lg bg-zinc-700/50 flex items-center justify-center text-zinc-300 font-medium shrink-0">
          #{instance.instanceNumber}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">
            {instance.label || `${item?.name || 'Instance'} #${instance.instanceNumber}`}
          </p>
          <div className="flex items-center gap-3 text-sm text-zinc-400 flex-wrap">
            {/* Linked entity - clickable */}
            {instance.usageRef && (
              <button
                onClick={handleLinkClick}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                title={`Go to ${instance.usageRef.entityType.replace('_', ' ')}`}
              >
                <Icons.Link />
                <span className="truncate max-w-[150px]">
                  {instance.usageRef.entityLabel || instance.usageRef.entityType.replace('_', ' ')}
                </span>
              </button>
            )}
            {/* Usage count */}
            {instance.usageCount > 0 && (
              <span className="flex items-center gap-1">
                <Icons.Clock />
                {instance.usageCount}x used
              </span>
            )}
            {/* Cost */}
            <span className="text-zinc-500">{formatCurrency(instance.unitCost)}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="flex items-center gap-1 hidden md:flex">
          {quickActions.map(action => (
            <button
              key={action.status}
              onClick={() => onStatusChange(instance.id, action.status)}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                STATUS_CONFIG[action.status].color
              } hover:bg-zinc-700/50`}
              title={action.label}
            >
              <action.icon />
              <span className="hidden lg:inline">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Status Badge + Menu */}
      <div className="relative">
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 border ${statusConfig.bgColor} ${statusConfig.color}`}
        >
          <statusConfig.icon />
          <span className="hidden sm:inline">{statusConfig.label}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 ml-1">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showStatusMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden min-w-[160px]">
              {(Object.entries(STATUS_CONFIG) as [InstanceStatus, typeof STATUS_CONFIG[InstanceStatus]][])
                .filter(([status]) => status !== instance.status && status !== 'in_use')
                .map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => {
                      onStatusChange(instance.id, status);
                      setShowStatusMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-zinc-700/50 ${config.color}`}
                  >
                    <config.icon />
                    {config.label}
                  </button>
                ))}
            </div>
          </>
        )}
      </div>

      {/* Timestamps */}
      <div className="text-xs text-zinc-500 text-right hidden lg:block w-24 shrink-0">
        {instance.lastSterilizedAt && (
          <p className="text-purple-400/80">
            Sterilized: {format(new Date(instance.lastSterilizedAt), 'MMM d')}
          </p>
        )}
        {instance.lastUsedAt && (
          <p>Last used: {format(new Date(instance.lastUsedAt), 'MMM d')}</p>
        )}
      </div>
    </div>
  );
};

export default InstanceManagement;
