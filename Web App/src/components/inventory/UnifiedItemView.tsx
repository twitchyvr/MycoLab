// ============================================================================
// UNIFIED ITEM VIEW - Lab Inventory
// Shows all cultures and grows from Supabase
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../store';
import type { Culture, Grow } from '../../store/types';

type ItemType = 'spore_syringe' | 'liquid_culture' | 'agar' | 'slant' | 'grow';
type ViewMode = 'grid' | 'list';

// Icons
const Icons = {
  Spore: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" strokeDasharray="4 2"/></svg>,
  LC: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M8 3v4l-2 9a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4l-2-9V3"/><line x1="9" y1="3" x2="15" y2="3"/></svg>,
  Agar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="2"/></svg>,
  Grow: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a5 5 0 0 1 10 0v2"/></svg>,
  Grid: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

const typeConfig: Record<ItemType, { label: string; icon: React.FC; color: string; bgColor: string }> = {
  spore_syringe: { label: 'Spore Syringe', icon: Icons.Spore, color: 'text-purple-400', bgColor: 'bg-purple-950/50 border-purple-800' },
  liquid_culture: { label: 'Liquid Culture', icon: Icons.LC, color: 'text-blue-400', bgColor: 'bg-blue-950/50 border-blue-800' },
  agar: { label: 'Agar', icon: Icons.Agar, color: 'text-pink-400', bgColor: 'bg-pink-950/50 border-pink-800' },
  slant: { label: 'Slant', icon: Icons.Agar, color: 'text-orange-400', bgColor: 'bg-orange-950/50 border-orange-800' },
  grow: { label: 'Grow', icon: Icons.Grow, color: 'text-emerald-400', bgColor: 'bg-emerald-950/50 border-emerald-800' },
};

const statusColors: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: 'text-emerald-400', bgColor: 'bg-emerald-950/50 border-emerald-800' },
  colonizing: { label: 'Colonizing', color: 'text-blue-400', bgColor: 'bg-blue-950/50 border-blue-800' },
  contaminated: { label: 'Contaminated', color: 'text-red-400', bgColor: 'bg-red-950/50 border-red-800' },
  depleted: { label: 'Depleted', color: 'text-zinc-500', bgColor: 'bg-zinc-900/50 border-zinc-800' },
  completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-950/50 border-green-800' },
  spawning: { label: 'Spawning', color: 'text-amber-400', bgColor: 'bg-amber-950/50 border-amber-800' },
  colonization: { label: 'Colonizing', color: 'text-blue-400', bgColor: 'bg-blue-950/50 border-blue-800' },
  fruiting: { label: 'Fruiting', color: 'text-purple-400', bgColor: 'bg-purple-950/50 border-purple-800' },
  harvesting: { label: 'Harvesting', color: 'text-green-400', bgColor: 'bg-green-950/50 border-green-800' },
};

// Health rating display
const HealthRating: React.FC<{ rating: number }> = ({ rating }) => {
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`w-1.5 h-4 rounded-sm ${i <= rating ? colors[Math.min(rating - 1, 4)] : 'bg-zinc-700'}`} />
      ))}
    </div>
  );
};

interface UnifiedItem {
  id: string;
  label: string;
  type: ItemType;
  strainId?: string;
  strainName: string;
  status: string;
  createdAt: Date;
  daysOld: number;
  healthRating?: number;
  notes?: string;
  isGrow: boolean;
  original: Culture | Grow;
}

type Page = 'dashboard' | 'today' | 'inventory' | 'stock' | 'cultures' | 'lineage' | 'grows' | 'recipes' | 'calculator' | 'spawnrate' | 'pressure' | 'contamination' | 'efficiency' | 'analytics' | 'settings' | 'devlog';

interface UnifiedItemViewProps {
  onNavigate?: (page: Page) => void;
}

export const UnifiedItemView: React.FC<UnifiedItemViewProps> = ({ onNavigate }) => {
  const { state, isLoading, isConnected, activeStrains, refreshData } = useData();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ItemType[]>([]);
  const [selectedItem, setSelectedItem] = useState<UnifiedItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Listen for create-new events
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail?.page === 'inventory') {
        setShowCreateModal(true);
      }
    };
    window.addEventListener('mycolab:create-new', handler as EventListener);
    return () => window.removeEventListener('mycolab:create-new', handler as EventListener);
  }, []);

  // Transform cultures and grows into unified items
  const items = useMemo((): UnifiedItem[] => {
    const cultureItems: UnifiedItem[] = state.cultures.map(culture => {
      const strain = activeStrains.find(s => s.id === culture.strainId);
      const daysOld = Math.floor((Date.now() - new Date(culture.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: culture.id,
        label: culture.label,
        type: culture.type as ItemType,
        strainId: culture.strainId,
        strainName: strain?.name || 'Unknown',
        status: culture.status,
        createdAt: new Date(culture.createdAt),
        daysOld,
        healthRating: culture.healthRating,
        notes: culture.notes,
        isGrow: false,
        original: culture,
      };
    });

    const growItems: UnifiedItem[] = state.grows.map(grow => {
      const strain = activeStrains.find(s => s.id === grow.strainId);
      const daysOld = Math.floor((Date.now() - new Date(grow.spawnedAt).getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: grow.id,
        label: grow.name,
        type: 'grow' as ItemType,
        strainId: grow.strainId,
        strainName: strain?.name || 'Unknown',
        status: grow.currentStage,
        createdAt: new Date(grow.createdAt),
        daysOld,
        notes: grow.notes,
        isGrow: true,
        original: grow,
      };
    });

    return [...cultureItems, ...growItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [state.cultures, state.grows, activeStrains]);

  // Get unique strains from items
  const strains = useMemo(() => {
    const unique = [...new Set(items.map(i => i.strainName))];
    return unique.sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.label.toLowerCase().includes(q) ||
        item.strainName.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q)
      );
    }

    if (selectedTypes.length > 0) {
      result = result.filter(item => selectedTypes.includes(item.type));
    }

    return result;
  }, [items, searchQuery, selectedTypes]);

  // Type counts
  const typeCounts = useMemo(() => {
    const counts: Record<ItemType, number> = {
      spore_syringe: 0,
      liquid_culture: 0,
      agar: 0,
      slant: 0,
      grow: 0,
    };
    items.forEach(item => {
      if (counts[item.type] !== undefined) {
        counts[item.type]++;
      }
    });
    return counts;
  }, [items]);

  const toggleType = (type: ItemType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-zinc-400">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Lab Inventory</h2>
            <p className="text-sm text-zinc-500">
              {items.length} items • {isConnected ? 'Synced with cloud' : 'Local only'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshData()}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Refresh"
            >
              <Icons.Refresh />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Icons.Grid />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Icons.List />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Icons.Search />
          <input
            type="text"
            placeholder="Search cultures, grows, strains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <Icons.Search />
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(typeConfig) as ItemType[]).map(type => {
            const config = typeConfig[type];
            const count = typeCounts[type];
            const isSelected = selectedTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  isSelected
                    ? `${config.bgColor} ${config.color}`
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <config.icon />
                <span>{config.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${isSelected ? 'bg-black/20' : 'bg-zinc-800'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <Icons.LC />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No items yet</h3>
          <p className="text-zinc-500 mb-6 max-w-md mx-auto">
            Your lab inventory is empty. Add cultures and start grows to see them here.
          </p>
          <div className="flex justify-center gap-3">
            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">
              Add Culture
            </button>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium border border-zinc-700">
              Start Grow
            </button>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => {
            const config = typeConfig[item.type];
            const statusConfig = statusColors[item.status] || statusColors.active;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg border ${config.bgColor}`}>
                    <config.icon />
                  </div>
                  {item.healthRating && <HealthRating rating={item.healthRating} />}
                </div>
                <h4 className="font-medium text-white mb-1 truncate">{item.label}</h4>
                <p className="text-sm text-zinc-500 mb-3">{item.strainName}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                  <span className="text-xs text-zinc-500">{item.daysOld}d old</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && filteredItems.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-4 text-sm font-medium text-zinc-400">Label</th>
                <th className="text-left p-4 text-sm font-medium text-zinc-400 hidden sm:table-cell">Type</th>
                <th className="text-left p-4 text-sm font-medium text-zinc-400">Strain</th>
                <th className="text-left p-4 text-sm font-medium text-zinc-400 hidden md:table-cell">Status</th>
                <th className="text-left p-4 text-sm font-medium text-zinc-400 hidden lg:table-cell">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredItems.map(item => {
                const config = typeConfig[item.type];
                const statusConfig = statusColors[item.status] || statusColors.active;
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded border ${config.bgColor}`}>
                          <config.icon />
                        </div>
                        <span className="text-white font-medium">{item.label}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className={config.color}>{config.label}</span>
                    </td>
                    <td className="p-4 text-zinc-300">{item.strainName}</td>
                    <td className="p-4 hidden md:table-cell">
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-500 hidden lg:table-cell">{item.daysOld} days</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{selectedItem.label}</h3>
              <button onClick={() => setSelectedItem(null)} className="p-1 text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Type</p>
                  <p className={`font-medium ${typeConfig[selectedItem.type].color}`}>
                    {typeConfig[selectedItem.type].label}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Strain</p>
                  <p className="text-white font-medium">{selectedItem.strainName}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Status</p>
                  <p className={statusColors[selectedItem.status]?.color || 'text-white'}>
                    {statusColors[selectedItem.status]?.label || selectedItem.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Age</p>
                  <p className="text-white">{selectedItem.daysOld} days</p>
                </div>
                {selectedItem.healthRating && (
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Health</p>
                    <HealthRating rating={selectedItem.healthRating} />
                  </div>
                )}
              </div>
              {selectedItem.notes && (
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Notes</p>
                  <p className="text-zinc-300">{selectedItem.notes}</p>
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    const targetPage = selectedItem.isGrow ? 'grows' : 'cultures';
                    setSelectedItem(null);
                    if (onNavigate) {
                      onNavigate(targetPage);
                      // Dispatch event to select the item on the target page
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('mycolab:select-item', {
                          detail: { id: selectedItem.id, type: selectedItem.isGrow ? 'grow' : 'culture' }
                        }));
                      }, 100);
                    }
                  }}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                >
                  {selectedItem.isGrow ? 'View Grow' : 'View Culture'}
                </button>
                <button
                  onClick={() => {
                    const targetPage = selectedItem.isGrow ? 'grows' : 'cultures';
                    setSelectedItem(null);
                    if (onNavigate) {
                      onNavigate(targetPage);
                      // Dispatch event to select and edit the item on the target page
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('mycolab:edit-item', {
                          detail: { id: selectedItem.id, type: selectedItem.isGrow ? 'grow' : 'culture' }
                        }));
                      }, 100);
                    }
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
