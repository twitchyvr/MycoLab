// ============================================================================
// CULTURE MANAGEMENT (v2 - Using Shared Data Store)
// Full CRUD for liquid cultures, agar, slants, and spore syringes
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../store';
import { CultureWizard } from './CultureWizard';
import type { Culture, CultureType, CultureStatus, CultureObservation } from '../../store/types';

// Type configurations
const cultureTypeConfig: Record<CultureType, { label: string; icon: string; prefix: string }> = {
  liquid_culture: { label: 'Liquid Culture', icon: '💧', prefix: 'LC' },
  agar: { label: 'Agar Plate', icon: '🧫', prefix: 'AG' },
  slant: { label: 'Slant', icon: '🧪', prefix: 'SL' },
  spore_syringe: { label: 'Spore Syringe', icon: '💉', prefix: 'SS' },
};

const cultureStatusConfig: Record<CultureStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'text-emerald-400 bg-emerald-950/50' },
  colonizing: { label: 'Colonizing', color: 'text-blue-400 bg-blue-950/50' },
  ready: { label: 'Ready', color: 'text-green-400 bg-green-950/50' },
  contaminated: { label: 'Contaminated', color: 'text-red-400 bg-red-950/50' },
  archived: { label: 'Archived', color: 'text-zinc-400 bg-zinc-800' },
  depleted: { label: 'Depleted', color: 'text-amber-400 bg-amber-950/50' },
};

// Icons
const Icons = {
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Grid: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Share: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Clipboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
};

// Health bar component
const HealthBar: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        className={`w-1.5 h-4 rounded-sm ${
          i <= rating
            ? rating >= 4 ? 'bg-emerald-500' : rating >= 2 ? 'bg-amber-500' : 'bg-red-500'
            : 'bg-zinc-700'
        }`}
      />
    ))}
  </div>
);

// Days ago helper
const daysAgo = (date: Date): string => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

export const CultureManagement: React.FC = () => {
  const {
    state,
    activeStrains,
    activeLocations,
    activeContainers,
    activeSuppliers,
    activeRecipes,
    getStrain,
    getLocation,
    getContainer,
    getSupplier,
    getRecipe,
    getCultureLineage,
    generateCultureLabel,
    addCulture,
    updateCulture,
    deleteCulture,
    addCultureObservation,
    addCultureTransfer,
  } = useData();

  const cultures = state.cultures;

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<CultureType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<CultureStatus | 'all'>('all');
  const [filterStrain, setFilterStrain] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'strain' | 'health'>('date');
  const [selectedCulture, setSelectedCulture] = useState<Culture | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [newObservation, setNewObservation] = useState({
    type: 'general' as CultureObservation['type'],
    notes: '',
    healthRating: undefined as number | undefined,
  });

  const [newTransfer, setNewTransfer] = useState({
    toType: 'agar' as CultureType | 'grain_spawn' | 'bulk',
    quantity: 1,
    unit: 'wedge',
    notes: '',
    createNewRecord: false,
  });

  // Listen for header "New" button click
  useEffect(() => {
    const handleCreateNew = (event: CustomEvent) => {
      if (event.detail?.page === 'cultures') {
        setShowWizard(true);
      }
    };
    window.addEventListener('mycolab:create-new', handleCreateNew as EventListener);
    return () => window.removeEventListener('mycolab:create-new', handleCreateNew as EventListener);
  }, []);

  // Listen for select-item and edit-item events from Lab Inventory
  useEffect(() => {
    const handleSelectItem = (event: CustomEvent) => {
      if (event.detail?.type === 'culture') {
        const culture = cultures.find(c => c.id === event.detail.id);
        if (culture) {
          setSelectedCulture(culture);
        }
      }
    };
    const handleEditItem = (event: CustomEvent) => {
      if (event.detail?.type === 'culture') {
        const culture = cultures.find(c => c.id === event.detail.id);
        if (culture) {
          setSelectedCulture(culture);
          // For now, just select it - could open edit modal in future
        }
      }
    };
    window.addEventListener('mycolab:select-item', handleSelectItem as EventListener);
    window.addEventListener('mycolab:edit-item', handleEditItem as EventListener);
    return () => {
      window.removeEventListener('mycolab:select-item', handleSelectItem as EventListener);
      window.removeEventListener('mycolab:edit-item', handleEditItem as EventListener);
    };
  }, [cultures]);

  // Keep selectedCulture in sync with state.cultures when cultures data changes
  useEffect(() => {
    if (selectedCulture) {
      const updated = cultures.find(c => c.id === selectedCulture.id);
      if (updated) {
        // Only update if the culture data has actually changed
        if (JSON.stringify(updated) !== JSON.stringify(selectedCulture)) {
          setSelectedCulture(updated);
        }
      } else {
        // Culture was deleted
        setSelectedCulture(null);
      }
    }
  }, [cultures, selectedCulture]);

  // Filtered and sorted cultures
  const filteredCultures = useMemo(() => {
    let result = [...cultures];

    if (filterType !== 'all') result = result.filter(c => c.type === filterType);
    if (filterStatus !== 'all') result = result.filter(c => c.status === filterStatus);
    if (filterStrain !== 'all') result = result.filter(c => c.strainId === filterStrain);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.label.toLowerCase().includes(q) ||
        getStrain(c.strainId)?.name.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'date':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name':
        result.sort((a, b) => a.label.localeCompare(b.label));
        break;
      case 'strain':
        result.sort((a, b) => (getStrain(a.strainId)?.name || '').localeCompare(getStrain(b.strainId)?.name || ''));
        break;
      case 'health':
        result.sort((a, b) => b.healthRating - a.healthRating);
        break;
    }

    return result;
  }, [cultures, filterType, filterStatus, filterStrain, searchQuery, sortBy, getStrain]);

  // Stats
  const stats = useMemo(() => {
    const active = cultures.filter(c => !['contaminated', 'archived', 'depleted'].includes(c.status));
    return {
      liquidCulture: active.filter(c => c.type === 'liquid_culture').length,
      agar: active.filter(c => c.type === 'agar').length,
      slant: active.filter(c => c.type === 'slant').length,
      sporeSyringe: active.filter(c => c.type === 'spore_syringe').length,
    };
  }, [cultures]);

  // Get unique strains from cultures
  const usedStrainIds = useMemo(() => 
    [...new Set(cultures.map(c => c.strainId))], 
    [cultures]
  );

  // Add observation handler
  const handleAddObservation = () => {
    if (!selectedCulture || !newObservation.notes) return;

    addCultureObservation(selectedCulture.id, {
      date: new Date(),
      type: newObservation.type,
      notes: newObservation.notes,
      healthRating: newObservation.healthRating,
    });
    // selectedCulture will be auto-updated by the sync useEffect when state.cultures changes

    setShowObservationModal(false);
    setNewObservation({ type: 'general', notes: '', healthRating: undefined });
  };

  // Transfer handler
  const handleTransfer = () => {
    if (!selectedCulture) return;

    const toId = newTransfer.createNewRecord ? `culture-${Date.now()}` : undefined;

    addCultureTransfer(selectedCulture.id, {
      date: new Date(),
      fromId: selectedCulture.id,
      toId,
      toType: newTransfer.toType,
      quantity: newTransfer.quantity,
      unit: newTransfer.unit,
      notes: newTransfer.notes,
    });
    // selectedCulture will be auto-updated by the sync useEffect when state.cultures changes

    setShowTransferModal(false);
    setNewTransfer({ toType: 'agar', quantity: 1, unit: 'wedge', notes: '', createNewRecord: false });
  };

  // Delete handler
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this culture?')) {
      deleteCulture(id);
      if (selectedCulture?.id === id) setSelectedCulture(null);
    }
  };

  // Status update handler
  const handleStatusChange = (status: CultureStatus) => {
    if (!selectedCulture) return;
    updateCulture(selectedCulture.id, { status });
    setSelectedCulture({ ...selectedCulture, status });
  };

  // Get lineage for selected culture
  const lineage = useMemo(() => {
    if (!selectedCulture) return { ancestors: [], descendants: [] };
    return getCultureLineage(selectedCulture.id);
  }, [selectedCulture, getCultureLineage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Culture Library</h2>
          <p className="text-zinc-400 text-sm">Manage your living cultures and genetics</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
        >
          <Icons.Plus />
          New Culture
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">💧</span>
          <div>
            <p className="text-xs text-zinc-500">Liquid Cultures</p>
            <p className="text-xl font-bold text-white">{stats.liquidCulture}</p>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">🧫</span>
          <div>
            <p className="text-xs text-zinc-500">Agar Plates</p>
            <p className="text-xl font-bold text-white">{stats.agar}</p>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">🧪</span>
          <div>
            <p className="text-xs text-zinc-500">Slants</p>
            <p className="text-xl font-bold text-white">{stats.slant}</p>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">💉</span>
          <div>
            <p className="text-xs text-zinc-500">Spore Syringes</p>
            <p className="text-xl font-bold text-white">{stats.sporeSyringe}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-64 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <Icons.Search />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search cultures..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as CultureType | 'all')}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Types</option>
          {Object.entries(cultureTypeConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.icon} {config.label}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as CultureStatus | 'all')}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Statuses</option>
          {Object.entries(cultureStatusConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>

        <select
          value={filterStrain}
          onChange={e => setFilterStrain(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Strains</option>
          {usedStrainIds.map(id => {
            const strain = getStrain(id);
            return strain ? <option key={id} value={id}>{strain.name}</option> : null;
          })}
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="strain">Sort by Strain</option>
          <option value="health">Sort by Health</option>
        </select>

        <div className="flex bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
          >
            <Icons.Grid />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
          >
            <Icons.List />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Grid/List View */}
        <div className="flex-1">
          {viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCultures.map(culture => {
                const strain = getStrain(culture.strainId);
                const typeConfig = cultureTypeConfig[culture.type];
                const statusConfig = cultureStatusConfig[culture.status];
                
                return (
                  <div
                    key={culture.id}
                    onClick={() => setSelectedCulture(culture)}
                    className={`bg-zinc-900/50 border rounded-xl p-4 cursor-pointer transition-all hover:border-zinc-600 ${
                      selectedCulture?.id === culture.id ? 'border-emerald-600' : 'border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{typeConfig.icon}</span>
                        <div>
                          <p className="font-semibold text-white">{culture.label}</p>
                          <p className="text-xs text-zinc-500">{strain?.name || 'Unknown'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">G{culture.generation}</span>
                        <HealthBar rating={culture.healthRating} />
                      </div>
                      {culture.volumeMl && (
                        <span className="text-zinc-400">{culture.volumeMl}ml</span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
                      {daysAgo(culture.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Culture</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Strain</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Gen</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Health</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCultures.map(culture => {
                    const strain = getStrain(culture.strainId);
                    const typeConfig = cultureTypeConfig[culture.type];
                    const statusConfig = cultureStatusConfig[culture.status];
                    
                    return (
                      <tr
                        key={culture.id}
                        onClick={() => setSelectedCulture(culture)}
                        className={`border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/30 ${
                          selectedCulture?.id === culture.id ? 'bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span>{typeConfig.icon}</span>
                            <span className="font-medium text-white">{culture.label}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-white">{strain?.name || 'Unknown'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-zinc-400">G{culture.generation}</td>
                        <td className="p-3"><HealthBar rating={culture.healthRating} /></td>
                        <td className="p-3 text-sm text-zinc-500">{daysAgo(culture.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedCulture && (
          <div className="w-96 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 h-fit sticky top-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{cultureTypeConfig[selectedCulture.type].icon}</span>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCulture.label}</h3>
                  <p className="text-sm text-zinc-400">{getStrain(selectedCulture.strainId)?.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCulture(null)} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(cultureStatusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key as CultureStatus)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    selectedCulture.status === key
                      ? config.color + ' ring-1 ring-white/20'
                      : 'bg-zinc-800 text-zinc-500 hover:text-white'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500">Generation</span>
                <span className="text-white">G{selectedCulture.generation}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500">Health</span>
                <HealthBar rating={selectedCulture.healthRating} />
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500">Location</span>
                <span className="text-white">{getLocation(selectedCulture.locationId)?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500">Container</span>
                <span className="text-white">{getContainer(selectedCulture.containerId)?.name}</span>
              </div>
              
              {/* Recipe/Media Info */}
              {selectedCulture.recipeId && (
                <div className="py-2 border-b border-zinc-800">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Recipe</span>
                    <span className="text-emerald-400 font-medium">{getRecipe(selectedCulture.recipeId)?.name || 'Unknown'}</span>
                  </div>
                  {getRecipe(selectedCulture.recipeId)?.description && (
                    <p className="text-xs text-zinc-500 mt-1">{getRecipe(selectedCulture.recipeId)?.description}</p>
                  )}
                </div>
              )}
              
              {/* Volume info - show both capacity and fill amount */}
              {(selectedCulture.volumeMl || selectedCulture.fillVolumeMl) && (
                <div className="py-2 border-b border-zinc-800">
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-500">Volume</span>
                    <span className="text-white">
                      {selectedCulture.fillVolumeMl || selectedCulture.volumeMl}ml
                      {selectedCulture.fillVolumeMl && selectedCulture.volumeMl && selectedCulture.fillVolumeMl !== selectedCulture.volumeMl && (
                        <span className="text-zinc-500 text-xs ml-1">
                          / {selectedCulture.volumeMl}ml ({Math.round((selectedCulture.fillVolumeMl / selectedCulture.volumeMl) * 100)}% full)
                        </span>
                      )}
                    </span>
                  </div>
                  {selectedCulture.fillVolumeMl && selectedCulture.volumeMl && (
                    <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, (selectedCulture.fillVolumeMl / selectedCulture.volumeMl) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Prep Date */}
              {selectedCulture.prepDate && (
                <div className="flex justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-500">Prep Date</span>
                  <span className="text-white">{new Date(selectedCulture.prepDate).toLocaleDateString()}</span>
                </div>
              )}
              
              {selectedCulture.supplierId && (
                <div className="flex justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-500">Supplier</span>
                  <span className="text-white">{getSupplier(selectedCulture.supplierId)?.name}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500">Cost</span>
                <span className="text-white">${selectedCulture.cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500">Created</span>
                <span className="text-white">{new Date(selectedCulture.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Lineage */}
            {(lineage.ancestors.length > 0 || lineage.descendants.length > 0) && (
              <div className="mb-4">
                <p className="text-xs text-zinc-500 mb-2">Lineage</p>
                <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1 text-sm">
                  {lineage.ancestors.map(a => (
                    <div 
                      key={a.id} 
                      className="text-zinc-400 cursor-pointer hover:text-white"
                      onClick={() => setSelectedCulture(a)}
                    >
                      ↑ {a.label} (G{a.generation})
                    </div>
                  ))}
                  <div className="text-emerald-400 font-medium">
                    • {selectedCulture.label} (G{selectedCulture.generation})
                  </div>
                  {lineage.descendants.map(d => (
                    <div 
                      key={d.id} 
                      className="text-zinc-400 cursor-pointer hover:text-white"
                      onClick={() => setSelectedCulture(d)}
                    >
                      ↓ {d.label} (G{d.generation})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedCulture.notes && (
              <div className="mb-4">
                <p className="text-xs text-zinc-500 mb-1">Notes</p>
                <p className="text-sm text-zinc-300 bg-zinc-800/50 rounded p-2">{selectedCulture.notes}</p>
              </div>
            )}

            {/* Recent Observations */}
            {selectedCulture.observations.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-zinc-500 mb-2">Recent Observations</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedCulture.observations.slice(-3).reverse().map(obs => (
                    <div key={obs.id} className="bg-zinc-800/50 rounded p-2 text-xs">
                      <div className="flex justify-between text-zinc-500 mb-1">
                        <span>{obs.type}</span>
                        <span>{new Date(obs.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-zinc-300">{obs.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800">
              <button
                onClick={() => setShowObservationModal(true)}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium"
              >
                <Icons.Clipboard />
                Log
              </button>
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium"
              >
                <Icons.Share />
                Transfer
              </button>
              <button
                onClick={() => handleDelete(selectedCulture.id)}
                className="p-2 bg-red-950/50 hover:bg-red-950 text-red-400 rounded-lg"
              >
                <Icons.Trash />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Culture Creation Wizard */}
      {showWizard && (
        <CultureWizard
          onClose={() => setShowWizard(false)}
          onSuccess={(culture) => {
            // Optionally select the newly created culture
            setSelectedCulture(culture);
          }}
        />
      )}

      {/* Observation Modal */}
      {showObservationModal && selectedCulture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Log Observation</h3>
              <button onClick={() => setShowObservationModal(false)} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Type</label>
                <select
                  value={newObservation.type}
                  onChange={e => setNewObservation(prev => ({ ...prev, type: e.target.value as CultureObservation['type'] }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="general">General</option>
                  <option value="growth">Growth</option>
                  <option value="contamination">Contamination</option>
                  <option value="transfer">Transfer</option>
                  <option value="harvest">Harvest</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Health Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setNewObservation(prev => ({ ...prev, healthRating: rating }))}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        newObservation.healthRating === rating
                          ? 'bg-emerald-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Notes *</label>
                <textarea
                  value={newObservation.notes}
                  onChange={e => setNewObservation(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowObservationModal(false)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddObservation}
                disabled={!newObservation.notes}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedCulture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Transfer Culture</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Transfer To</label>
                <select
                  value={newTransfer.toType}
                  onChange={e => setNewTransfer(prev => ({ ...prev, toType: e.target.value as typeof newTransfer.toType }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="agar">Agar Plate</option>
                  <option value="liquid_culture">Liquid Culture</option>
                  <option value="slant">Slant</option>
                  <option value="grain_spawn">Grain Spawn</option>
                  <option value="bulk">Bulk Substrate</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={newTransfer.quantity}
                    onChange={e => setNewTransfer(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    min="1"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Unit</label>
                  <select
                    value={newTransfer.unit}
                    onChange={e => setNewTransfer(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="wedge">Wedge</option>
                    <option value="ml">ml</option>
                    <option value="cc">cc</option>
                    <option value="drop">Drop</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Notes</label>
                <textarea
                  value={newTransfer.notes}
                  onChange={e => setNewTransfer(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              {['agar', 'liquid_culture', 'slant', 'spore_syringe'].includes(newTransfer.toType) && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newTransfer.createNewRecord}
                    onChange={e => setNewTransfer(prev => ({ ...prev, createNewRecord: e.target.checked }))}
                    className="rounded border-zinc-600"
                  />
                  <span className="text-zinc-300">Create new culture record</span>
                </label>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CultureManagement;
