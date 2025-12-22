// ============================================================================
// CULTURE MANAGEMENT (v2 - Using Shared Data Store)
// Full CRUD for liquid cultures, agar, slants, and spore syringes
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useData, EntityOutcomeData } from '../../store';
import { useAuthGuard } from '../../lib/useAuthGuard';
import { CultureWizard } from './CultureWizard';
import { NumericInput } from '../common/NumericInput';
import { EntityDisposalModal, DisposalOutcome } from '../common/EntityDisposalModal';
import { RecordHistoryTab } from '../common/RecordHistoryTab';
import { NotificationBellCompact } from '../common/NotificationBell';
import { calculateShelfLife, formatRemainingShelfLife, getStorageRecommendation, getExpectedShelfLifeDays, coldSensitiveSpecies } from '../../utils';
import type { Culture, CultureType, CultureStatus, CultureObservation, PreparedSpawn, ContaminationType, SuspectedCause, AmendmentType } from '../../store/types';

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
  History: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
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

// P-value badge component with senescence risk indicator
interface PValueBadgeProps {
  generation: number;
  strainName?: string;
  compact?: boolean;
  showShelfLife?: boolean;
}

const getSenescenceRisk = (generation: number): { risk: 'low' | 'moderate' | 'high' | 'critical'; label: string; color: string } => {
  if (generation <= 1) return { risk: 'low', label: 'Excellent vigor', color: 'text-emerald-400 bg-emerald-950/50 border-emerald-800' };
  if (generation === 2) return { risk: 'low', label: 'Good vigor', color: 'text-green-400 bg-green-950/50 border-green-800' };
  if (generation === 3) return { risk: 'moderate', label: 'Moderate vigor', color: 'text-amber-400 bg-amber-950/50 border-amber-800' };
  if (generation === 4) return { risk: 'high', label: 'Reduced vigor', color: 'text-orange-400 bg-orange-950/50 border-orange-800' };
  return { risk: 'critical', label: 'Risk of senescence', color: 'text-red-400 bg-red-950/50 border-red-800' };
};

const PValueBadge: React.FC<PValueBadgeProps> = ({ generation, strainName, compact = false, showShelfLife = false }) => {
  const senescence = getSenescenceRisk(generation);
  const shelfLifeDays = getExpectedShelfLifeDays(generation);
  const shelfLifeMonths = Math.round(shelfLifeDays / 30);

  // Check if strain is cold-sensitive
  const isColdSensitive = strainName ? coldSensitiveSpecies.some(s =>
    strainName.toLowerCase().includes(s.toLowerCase()) ||
    s.toLowerCase().includes(strainName.toLowerCase())
  ) : false;
  const storage = getStorageRecommendation(isColdSensitive);

  if (compact) {
    // Compact version for card/table view
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${senescence.color}`}
        title={`${senescence.label} • ${shelfLifeMonths} month${shelfLifeMonths !== 1 ? 's' : ''} shelf life${isColdSensitive ? ' • Cold-sensitive!' : ''}`}
      >
        <span className="font-bold">P{generation}</span>
        {generation >= 4 && <span className="text-[10px]">⚠</span>}
      </span>
    );
  }

  // Full version for detail panel
  return (
    <div className={`rounded-lg border p-3 ${senescence.color}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">P{generation}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-black/20 capitalize">{senescence.risk}</span>
        </div>
        {generation >= 4 && (
          <span className="text-sm" title="High senescence risk">⚠️</span>
        )}
      </div>
      <p className="text-sm opacity-90">{senescence.label}</p>
      {showShelfLife && (
        <div className="mt-2 pt-2 border-t border-current/20 space-y-1">
          <p className="text-xs flex justify-between">
            <span>Expected shelf life:</span>
            <span className="font-medium">{shelfLifeMonths} month{shelfLifeMonths !== 1 ? 's' : ''}</span>
          </p>
          <p className="text-xs flex justify-between">
            <span>Storage temp:</span>
            <span className="font-medium">{storage.tempC}°C / {storage.tempF}°F</span>
          </p>
          {isColdSensitive && (
            <p className="text-xs text-amber-300 mt-1">⚠️ Cold-sensitive species - do not refrigerate below {storage.tempC}°C!</p>
          )}
        </div>
      )}
    </div>
  );
};

// Shelf life indicator component
const ShelfLifeBadge: React.FC<{ culture: Culture; compact?: boolean }> = ({ culture, compact }) => {
  // Only show for active cultures that can age
  if (['contaminated', 'archived', 'depleted'].includes(culture.status)) {
    return null;
  }

  const shelfLife = calculateShelfLife(culture.createdAt, culture.generation);

  // Don't show anything for fresh cultures to reduce visual noise
  if (shelfLife.status === 'fresh') {
    return null;
  }

  const statusIcons = {
    good: '●',
    aging: '◐',
    expiring: '◔',
    expired: '○',
  };

  if (compact) {
    // Compact version for card view - just show icon and days
    if (shelfLife.status === 'good') return null; // Only warn on aging+

    return (
      <span
        className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${shelfLife.statusColor}`}
        title={shelfLife.warningMessage}
      >
        <span>{statusIcons[shelfLife.status as keyof typeof statusIcons]}</span>
        <span>{formatRemainingShelfLife(shelfLife.remainingDays)}</span>
      </span>
    );
  }

  // Full version for detail panel
  return (
    <div className={`text-xs px-2 py-1 rounded ${shelfLife.statusColor}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium capitalize">{shelfLife.status}</span>
        <span>{formatRemainingShelfLife(shelfLife.remainingDays)} remaining</span>
      </div>
      {shelfLife.warningMessage && (
        <p className="mt-1 text-xs opacity-80">{shelfLife.warningMessage}</p>
      )}
    </div>
  );
};

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
    availablePreparedSpawn,
    activeGrainTypes,
    getStrain,
    getLocation,
    getContainer,
    getSupplier,
    getRecipe,
    getGrainType,
    getPreparedSpawn,
    getCultureLineage,
    generateCultureLabel,
    addCulture,
    updateCulture,
    addCultureObservation,
    addCultureTransfer,
    addPreparedSpawn,
    inoculatePreparedSpawn,
    amendCulture,
    archiveCulture,
    saveEntityOutcome,
    saveContaminationDetails,
  } = useData();
  const { guardAction } = useAuthGuard();

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
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [cultureToDispose, setCultureToDispose] = useState<Culture | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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
    destinationVolumeMl: undefined as number | undefined, // Volume of existing media in destination container
    selectedPreparedSpawnId: undefined as string | undefined, // Selected prepared spawn container
    useNewContainer: true, // true = create new, false = use prepared spawn
  });


  // Listen for header "New" button click
  useEffect(() => {
    const handleCreateNew = (event: CustomEvent) => {
      if (event.detail?.page === 'cultures') {
        if (!guardAction()) return; // Show auth modal if not authenticated
        setShowWizard(true);
      }
    };
    window.addEventListener('mycolab:create-new', handleCreateNew as EventListener);
    return () => window.removeEventListener('mycolab:create-new', handleCreateNew as EventListener);
  }, [guardAction]);

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
    if (!guardAction()) return; // Show auth modal if not authenticated
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

  // Volume threshold below which a culture is considered effectively empty
  // Small amounts from drops (e.g., 0.0001ml) should be treated as depleted
  const EMPTY_VOLUME_THRESHOLD_ML = 0.5;

  // Helper: Normalize volumes - treat anything below threshold as zero
  const normalizeVolume = (volume: number | undefined | null): number => {
    if (volume === undefined || volume === null) return 0;
    return volume < EMPTY_VOLUME_THRESHOLD_ML ? 0 : volume;
  };

  // Helper: Format volume for display - show "empty" for tiny amounts
  const formatVolume = (volume: number | undefined | null): string => {
    const normalized = normalizeVolume(volume);
    return normalized === 0 ? 'empty' : `${normalized.toFixed(1)}ml`;
  };

  // Transfer handler
  const handleTransfer = async () => {
    if (!guardAction()) return; // Show auth modal if not authenticated
    if (!selectedCulture) return;

    const toId = newTransfer.createNewRecord ? `culture-${Date.now()}` : undefined;

    // Calculate transferred volume for depletion check
    let transferredVolumeMl = newTransfer.quantity;
    if (newTransfer.unit === 'drop') {
      transferredVolumeMl = newTransfer.quantity * 0.05;
    } else if (newTransfer.unit === 'wedge') {
      transferredVolumeMl = (selectedCulture.fillVolumeMl || selectedCulture.volumeMl || 20) * 0.1 * newTransfer.quantity;
    }

    // Check if this transfer will deplete the culture
    // Use threshold to consider tiny amounts (like residue from drops) as effectively empty
    const currentFillVolume = selectedCulture.fillVolumeMl ?? selectedCulture.volumeMl ?? 0;
    const remainingAfterTransfer = currentFillVolume - transferredVolumeMl;
    const willBeDepleted = remainingAfterTransfer < EMPTY_VOLUME_THRESHOLD_ML;

    // Perform the transfer
    const newCulture = addCultureTransfer(selectedCulture.id, {
      date: new Date(),
      fromId: selectedCulture.id,
      toId,
      toType: newTransfer.toType,
      quantity: newTransfer.quantity,
      unit: newTransfer.unit,
      notes: newTransfer.notes,
    });

    // If using a prepared spawn container, mark it as inoculated and link to the new culture
    if (!newTransfer.useNewContainer && newTransfer.selectedPreparedSpawnId && newCulture) {
      await inoculatePreparedSpawn(newTransfer.selectedPreparedSpawnId, newCulture.id);
    }

    setShowTransferModal(false);
    setNewTransfer({
      toType: 'agar',
      quantity: 1,
      unit: 'wedge',
      notes: '',
      createNewRecord: false,
      destinationVolumeMl: undefined,
      selectedPreparedSpawnId: undefined,
      useNewContainer: true,
    });

    // If culture is now depleted, prompt for disposal
    if (willBeDepleted) {
      // Get the updated culture from state (has new fill volume)
      const updatedCulture = state.cultures.find(c => c.id === selectedCulture.id);
      if (updatedCulture) {
        // Auto-update status to depleted
        await updateCulture(selectedCulture.id, { status: 'depleted' });
        // Prompt for disposal with pre-selected outcome
        setCultureToDispose({ ...updatedCulture, status: 'depleted' });
        setShowDisposalModal(true);
      }
    }
  };

  // Delete handler - opens disposal modal for outcome tracking
  const handleDelete = (culture: Culture) => {
    if (!guardAction()) return; // Show auth modal if not authenticated
    setCultureToDispose(culture);
    setShowDisposalModal(true);
  };

  // Disposal confirmation - records outcome and archives culture (soft delete)
  // Using archive instead of delete to preserve data integrity and FK relationships
  const handleDisposalConfirm = async (outcome: DisposalOutcome) => {
    if (!cultureToDispose) return;

    // Get fresh culture state from context to avoid stale data (prevents 409 conflicts)
    const freshCulture = cultures.find(c => c.id === cultureToDispose.id);
    if (!freshCulture) {
      console.warn('[Dispose] Culture not found in state, may have been deleted');
      setCultureToDispose(null);
      setShowDisposalModal(false);
      return;
    }

    // Skip if already archived (handles double-click, stale modals)
    if (freshCulture.isArchived) {
      console.warn('[Dispose] Culture already archived, closing modal');
      setCultureToDispose(null);
      setShowDisposalModal(false);
      return;
    }

    try {
      const strain = getStrain(freshCulture.strainId);
      const location = freshCulture.locationId ? getLocation(freshCulture.locationId) : undefined;

      // Build outcome data for historical record
      const outcomeData: EntityOutcomeData = {
        entityType: 'culture',
        entityId: freshCulture.id,
        entityName: freshCulture.label,
        outcomeCategory: outcome.outcomeCategory,
        outcomeCode: outcome.outcomeCode,
        outcomeLabel: outcome.outcomeLabel,
        startedAt: freshCulture.createdAt,
        endedAt: new Date(),
        strainId: freshCulture.strainId,
        strainName: strain?.name,
        speciesId: strain?.speciesId,
        locationId: freshCulture.locationId || undefined,
        locationName: location?.name,
        notes: outcome.notes,
      };

      // Add contamination details if relevant
      if (outcome.contaminationType || outcome.suspectedCause) {
        outcomeData.surveyResponses = {
          contamination: {
            contaminationType: outcome.contaminationType as ContaminationType | undefined,
            suspectedCause: outcome.suspectedCause as SuspectedCause | undefined,
          },
        };
      }

      // Step 1: Save the outcome record (append-only historical data)
      const savedOutcome = await saveEntityOutcome(outcomeData);

      // Step 2: Save contamination details if applicable
      if (outcomeData.surveyResponses?.contamination && savedOutcome.id) {
        const contamDetails = outcomeData.surveyResponses.contamination as {
          contaminationType?: ContaminationType;
          suspectedCause?: SuspectedCause;
        };
        if (contamDetails.contaminationType || contamDetails.suspectedCause) {
          await saveContaminationDetails(savedOutcome.id, {
            contaminationType: contamDetails.contaminationType,
            suspectedCause: contamDetails.suspectedCause,
          });
        }
      }

      // Step 3: Archive the culture (soft delete - preserves FK relationships)
      // Build a descriptive reason from the outcome
      const archiveReason = `Disposed: ${outcome.outcomeLabel}${outcome.notes ? ` - ${outcome.notes}` : ''}`;
      await archiveCulture(freshCulture.id, archiveReason);

      // Clear UI state
      if (selectedCulture?.id === freshCulture.id) {
        setSelectedCulture(null);
      }
      setCultureToDispose(null);
      setShowDisposalModal(false);
    } catch (error) {
      console.error('Error disposing culture:', error);
      // Show a user-friendly error message
      alert('Failed to dispose culture. Please try again.');
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
                        <PValueBadge generation={culture.generation} strainName={strain?.name} compact />
                        <HealthBar rating={culture.healthRating} />
                      </div>
                      {culture.volumeMl && (
                        <span className="text-zinc-400">{culture.volumeMl}ml</span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">{daysAgo(culture.createdAt)}</span>
                      <ShelfLifeBadge culture={culture} compact />
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
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">P#</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Health</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Age</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Shelf Life</th>
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
                        <td className="p-3"><PValueBadge generation={culture.generation} strainName={strain?.name} compact /></td>
                        <td className="p-3"><HealthBar rating={culture.healthRating} /></td>
                        <td className="p-3 text-sm text-zinc-500">{daysAgo(culture.createdAt)}</td>
                        <td className="p-3"><ShelfLifeBadge culture={culture} compact /></td>
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
              <div className="flex items-center gap-2">
                <NotificationBellCompact
                  muted={selectedCulture.notificationsMuted ?? false}
                  onToggle={(muted) => updateCulture(selectedCulture.id, { notificationsMuted: muted })}
                  itemLabel={`culture ${selectedCulture.label}`}
                />
                <button onClick={() => setSelectedCulture(null)} className="text-zinc-400 hover:text-white">
                  <Icons.X />
                </button>
              </div>
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

            {/* P-Value and Senescence Info */}
            <PValueBadge
              generation={selectedCulture.generation}
              strainName={getStrain(selectedCulture.strainId)?.name}
              showShelfLife
            />

            {/* Shelf Life Warning (if applicable) */}
            <ShelfLifeBadge culture={selectedCulture} />

            {/* Details */}
            <div className="space-y-2 text-sm mb-4">
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
              {(selectedCulture.volumeMl || selectedCulture.fillVolumeMl) && (() => {
                const normalizedFill = normalizeVolume(selectedCulture.fillVolumeMl);
                const capacity = selectedCulture.volumeMl ?? 0;
                const fillPercentage = capacity > 0 ? Math.round((normalizedFill / capacity) * 100) : 0;
                const isEffectivelyEmpty = normalizedFill === 0 && (selectedCulture.fillVolumeMl ?? 0) > 0;

                return (
                  <div className="py-2 border-b border-zinc-800">
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-500">Volume</span>
                      <span className="text-white">
                        {normalizedFill > 0 ? (
                          <>
                            {normalizedFill.toFixed(1)}ml
                            {capacity > 0 && normalizedFill !== capacity && (
                              <span className="text-zinc-500 text-xs ml-1">
                                / {capacity}ml ({fillPercentage}% full)
                              </span>
                            )}
                          </>
                        ) : isEffectivelyEmpty ? (
                          <span className="text-amber-400">empty (residue)</span>
                        ) : capacity > 0 ? (
                          `${capacity}ml`
                        ) : (
                          'N/A'
                        )}
                      </span>
                    </div>
                    {normalizedFill > 0 && capacity > 0 && (
                      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, fillPercentage)}%` }}
                        />
                      </div>
                    )}
                    {isEffectivelyEmpty && (
                      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500/50 rounded-full" style={{ width: '2%' }} />
                      </div>
                    )}
                  </div>
                );
              })()}
              
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

              {/* Cost/Value Section - Enhanced */}
              {(() => {
                const totalCost = (selectedCulture.purchaseCost ?? 0) + (selectedCulture.productionCost ?? 0)
                                + (selectedCulture.parentCultureCost ?? 0) + (selectedCulture.cost ?? 0);
                // Use normalized volume for cost-per-ml to avoid dividing by tiny residue amounts
                const fillVolume = normalizeVolume(selectedCulture.fillVolumeMl ?? selectedCulture.volumeMl);
                const costPerMl = fillVolume > 0 ? totalCost / fillVolume : 0;
                const hasDetailedCost = (selectedCulture.purchaseCost ?? 0) > 0
                                     || (selectedCulture.productionCost ?? 0) > 0
                                     || (selectedCulture.parentCultureCost ?? 0) > 0;

                return (
                  <div className="py-2 border-b border-zinc-800">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Total Value</span>
                      <span className="text-emerald-400 font-medium">${totalCost.toFixed(2)}</span>
                    </div>
                    {hasDetailedCost && (
                      <div className="mt-2 pl-2 space-y-1 text-xs">
                        {(selectedCulture.purchaseCost ?? 0) > 0 && (
                          <div className="flex justify-between text-zinc-500">
                            <span>Purchase cost:</span>
                            <span>${selectedCulture.purchaseCost!.toFixed(2)}</span>
                          </div>
                        )}
                        {(selectedCulture.productionCost ?? 0) > 0 && (
                          <div className="flex justify-between text-zinc-500">
                            <span>Production cost:</span>
                            <span>${selectedCulture.productionCost!.toFixed(2)}</span>
                          </div>
                        )}
                        {(selectedCulture.parentCultureCost ?? 0) > 0 && (
                          <div className="flex justify-between text-zinc-500">
                            <span>From parent culture:</span>
                            <span>${selectedCulture.parentCultureCost!.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {fillVolume > 0 && totalCost > 0 && (
                      <div className="flex justify-between mt-1 text-xs text-zinc-500">
                        <span>Cost per ml:</span>
                        <span>${costPerMl.toFixed(3)}/ml</span>
                      </div>
                    )}
                    {(selectedCulture.volumeUsed ?? 0) > 0 && (
                      <div className="flex justify-between mt-1 text-xs text-zinc-500">
                        <span>Volume used:</span>
                        <span>{selectedCulture.volumeUsed?.toFixed(1)}ml</span>
                      </div>
                    )}
                  </div>
                );
              })()}

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
                      ↑ {a.label} (P{a.generation})
                    </div>
                  ))}
                  <div className="text-emerald-400 font-medium">
                    • {selectedCulture.label} (P{selectedCulture.generation})
                  </div>
                  {lineage.descendants.map(d => (
                    <div
                      key={d.id}
                      className="text-zinc-400 cursor-pointer hover:text-white"
                      onClick={() => setSelectedCulture(d)}
                    >
                      ↓ {d.label} (P{d.generation})
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
                onClick={() => setShowHistoryModal(true)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg"
                title="View History"
              >
                <Icons.History />
              </button>
              <button
                onClick={() => handleDelete(selectedCulture)}
                className="p-2 bg-red-950/50 hover:bg-red-950 text-red-400 rounded-lg"
                title="Dispose Culture"
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
      {showTransferModal && selectedCulture && (() => {
        // Calculate transfer cost for display
        const sourceTotalCost = (selectedCulture.purchaseCost ?? 0) + (selectedCulture.productionCost ?? 0)
                              + (selectedCulture.parentCultureCost ?? 0) + (selectedCulture.cost ?? 0);
        // Use normalized volume - treat tiny residue as zero
        const sourceFillVolume = normalizeVolume(selectedCulture.fillVolumeMl ?? selectedCulture.volumeMl);
        const actualFillVolume = sourceFillVolume > 0 ? sourceFillVolume : 1; // Avoid division by zero
        const costPerMl = sourceTotalCost / actualFillVolume;

        // Convert quantity to ml for cost calculation
        let transferredVolumeMl = newTransfer.quantity;
        if (newTransfer.unit === 'drop') {
          transferredVolumeMl = newTransfer.quantity * 0.05;
        } else if (newTransfer.unit === 'cc') {
          transferredVolumeMl = newTransfer.quantity;
        } else if (newTransfer.unit === 'wedge') {
          transferredVolumeMl = actualFillVolume * 0.1 * newTransfer.quantity;
        }

        const transferCost = costPerMl * transferredVolumeMl;
        const remainingVolume = Math.max(0, sourceFillVolume - transferredVolumeMl);
        const destinationTotalVolume = (newTransfer.destinationVolumeMl ?? 0) + transferredVolumeMl;

        return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Transfer Culture</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>

            {/* Source Culture Info */}
            <div className="bg-zinc-800/50 rounded-lg p-3 mb-4 border border-zinc-700">
              <div className="text-sm text-zinc-400 mb-1">Source: {selectedCulture.label}</div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-zinc-500">Volume:</span>
                  <span className="text-white ml-1">{sourceFillVolume.toFixed(1)}ml</span>
                </div>
                <div>
                  <span className="text-zinc-500">Value:</span>
                  <span className="text-emerald-400 ml-1">${sourceTotalCost.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-zinc-500">$/ml:</span>
                  <span className="text-emerald-400 ml-1">${costPerMl.toFixed(3)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Transfer To</label>
                <select
                  value={newTransfer.toType}
                  onChange={e => {
                    const newType = e.target.value as typeof newTransfer.toType;
                    setNewTransfer(prev => ({
                      ...prev,
                      toType: newType,
                      selectedPreparedSpawnId: undefined,
                      useNewContainer: true,
                    }));
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="agar">Agar Plate</option>
                  <option value="liquid_culture">Liquid Culture</option>
                  <option value="slant">Slant</option>
                  <option value="grain_spawn">Grain Spawn</option>
                  <option value="bulk">Bulk Substrate</option>
                </select>
              </div>

              {/* Prepared Container Selection - show available prepared jars/plates */}
              {(() => {
                // Map transfer type to prepared spawn types
                const preparedSpawnTypeMap: Record<string, string[]> = {
                  grain_spawn: ['grain_jar', 'spawn_bag'],
                  liquid_culture: ['lc_jar'],
                  agar: ['agar_plate'],
                  slant: ['slant_tube'],
                };
                const matchingTypes = preparedSpawnTypeMap[newTransfer.toType] || [];
                const matchingPreparedSpawn = availablePreparedSpawn.filter(
                  ps => matchingTypes.includes(ps.type)
                );

                if (matchingTypes.length === 0) {
                  return null; // No prepared spawn types for this transfer type (e.g., bulk)
                }

                return (
                  <div className="space-y-2">
                    <label className="block text-sm text-zinc-400">Container Source</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewTransfer(prev => ({
                          ...prev,
                          useNewContainer: true,
                          selectedPreparedSpawnId: undefined,
                        }))}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          newTransfer.useNewContainer
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 border'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 border hover:border-zinc-600'
                        }`}
                      >
                        Create New
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTransfer(prev => ({ ...prev, useNewContainer: false }))}
                        disabled={matchingPreparedSpawn.length === 0}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          !newTransfer.useNewContainer
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 border'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 border hover:border-zinc-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Use Prepared ({matchingPreparedSpawn.length})
                      </button>
                    </div>

                    {/* Message when no prepared containers available */}
                    {!newTransfer.useNewContainer && matchingPreparedSpawn.length === 0 && (
                      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 text-sm">
                        <p className="text-zinc-400 mb-2">
                          No prepared {newTransfer.toType === 'grain_spawn' ? 'grain jars' : newTransfer.toType === 'liquid_culture' ? 'LC jars' : 'containers'} available.
                        </p>
                        <p className="text-zinc-500 text-xs">
                          You can log prepared containers from Lab &amp; Storage → Prepared Containers, then return here to select one.
                        </p>
                      </div>
                    )}

                    {!newTransfer.useNewContainer && matchingPreparedSpawn.length > 0 && (
                      <div className="space-y-2">
                        <select
                          value={newTransfer.selectedPreparedSpawnId || ''}
                          onChange={e => setNewTransfer(prev => ({
                            ...prev,
                            selectedPreparedSpawnId: e.target.value || undefined,
                            createNewRecord: e.target.value ? true : prev.createNewRecord,
                          }))}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                        >
                          <option value="">Select a prepared container...</option>
                          {matchingPreparedSpawn.map(ps => {
                            const container = getContainer(ps.containerId);
                            const grainType = ps.grainTypeId ? getGrainType(ps.grainTypeId) : null;
                            const location = getLocation(ps.locationId);
                            const prepDate = new Date(ps.prepDate).toLocaleDateString();
                            return (
                              <option key={ps.id} value={ps.id}>
                                {ps.label || container?.name || 'Container'} - {grainType?.name || ps.type} ({prepDate}) @ {location?.name || 'Unknown'}
                              </option>
                            );
                          })}
                        </select>

                        {newTransfer.selectedPreparedSpawnId && (() => {
                          const selected = getPreparedSpawn(newTransfer.selectedPreparedSpawnId);
                          if (!selected) return null;
                          const container = getContainer(selected.containerId);
                          const grainType = selected.grainTypeId ? getGrainType(selected.grainTypeId) : null;
                          const location = getLocation(selected.locationId);
                          return (
                            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 text-sm">
                              <div className="font-medium text-white mb-2">
                                {selected.label || container?.name || 'Prepared Container'}
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                {selected.type === 'grain_jar' || selected.type === 'spawn_bag' ? (
                                  <>
                                    <span className="text-zinc-500">Grain:</span>
                                    <span className="text-zinc-300">{grainType?.name || 'Unknown'}</span>
                                    {selected.weightGrams && (
                                      <>
                                        <span className="text-zinc-500">Weight:</span>
                                        <span className="text-zinc-300">{selected.weightGrams}g</span>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {selected.volumeMl && (
                                      <>
                                        <span className="text-zinc-500">Volume:</span>
                                        <span className="text-zinc-300">{selected.volumeMl}ml</span>
                                      </>
                                    )}
                                  </>
                                )}
                                <span className="text-zinc-500">Location:</span>
                                <span className="text-zinc-300">{location?.name || 'Unknown'}</span>
                                <span className="text-zinc-500">Prepared:</span>
                                <span className="text-zinc-300">{new Date(selected.prepDate).toLocaleDateString()}</span>
                                {selected.sterilizationMethod && (
                                  <>
                                    <span className="text-zinc-500">Sterilized:</span>
                                    <span className="text-zinc-300">{selected.sterilizationMethod}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Transfer Amount</label>
                  <NumericInput
                    value={newTransfer.quantity}
                    onChange={value => setNewTransfer(prev => ({ ...prev, quantity: value ?? 1 }))}
                    min={0.1}
                    step={0.5}
                    allowEmpty={false}
                    defaultValue={1}
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
                    <option value="ml">ml</option>
                    <option value="cc">cc</option>
                    <option value="drop">Drop (~0.05ml)</option>
                    <option value="wedge">Wedge (~10%)</option>
                  </select>
                </div>
              </div>

              {/* Destination Volume - for liquid cultures being added to existing media */}
              {newTransfer.toType === 'liquid_culture' && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Destination Media Volume (ml)
                    <span className="text-zinc-500 ml-1 font-normal">(existing sterile LC in jar)</span>
                  </label>
                  <NumericInput
                    value={newTransfer.destinationVolumeMl}
                    onChange={value => setNewTransfer(prev => ({ ...prev, destinationVolumeMl: value }))}
                    min={0}
                    step={50}
                    placeholder="e.g., 300 for a jar with 300ml LC"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                  {newTransfer.destinationVolumeMl !== undefined && newTransfer.destinationVolumeMl > 0 && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Final volume: {newTransfer.destinationVolumeMl}ml + {transferredVolumeMl.toFixed(1)}ml = {destinationTotalVolume.toFixed(1)}ml
                    </p>
                  )}
                </div>
              )}

              {/* Cost Summary */}
              <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-3">
                <div className="text-sm font-medium text-emerald-400 mb-2">Transfer Summary</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-zinc-400">Transfer volume:</div>
                  <div className="text-white text-right">{transferredVolumeMl.toFixed(2)} ml</div>
                  <div className="text-zinc-400">Transfer value:</div>
                  <div className="text-emerald-400 text-right font-medium">${transferCost.toFixed(2)}</div>
                  <div className="text-zinc-400">Source remaining:</div>
                  <div className="text-white text-right">{remainingVolume.toFixed(1)} ml</div>
                  {newTransfer.toType === 'liquid_culture' && newTransfer.destinationVolumeMl !== undefined && (
                    <>
                      <div className="text-zinc-400">Destination total:</div>
                      <div className="text-white text-right">{destinationTotalVolume.toFixed(1)} ml</div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Notes</label>
                <textarea
                  value={newTransfer.notes}
                  onChange={e => setNewTransfer(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="e.g., Added to sterilized LC jar, contamination experiment, etc."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder:text-zinc-600"
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
                  <span className="text-zinc-300">Create new culture record (tracks lineage)</span>
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
                disabled={transferredVolumeMl > sourceFillVolume}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
              >
                Transfer
              </button>
            </div>
            {transferredVolumeMl > sourceFillVolume && (
              <p className="text-red-400 text-sm text-center mt-2">
                Transfer amount exceeds available volume
              </p>
            )}
          </div>
        </div>
        );
      })()}

      {/* Entity Disposal Modal */}
      <EntityDisposalModal
        isOpen={showDisposalModal}
        onClose={() => {
          setShowDisposalModal(false);
          setCultureToDispose(null);
        }}
        onConfirm={handleDisposalConfirm}
        entityType="culture"
        entityName={cultureToDispose?.label || ''}
        entityId={cultureToDispose?.id}
        showContaminationDetails={true}
      />

      {/* History Modal */}
      {showHistoryModal && selectedCulture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHistoryModal(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 px-6 py-4 z-10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100">
                Record History - {selectedCulture.label}
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Icons.X />
              </button>
            </div>
            <div className="p-6">
              <RecordHistoryTab
                entityType="culture"
                record={selectedCulture}
                recordLabel={selectedCulture.label}
                onAmend={async (changes, amendmentType, reason) => {
                  await amendCulture(selectedCulture.id, changes as Partial<Culture>, amendmentType, reason);
                  // Refresh selected culture after amendment
                  const updated = state.cultures.find(c => c.recordGroupId === selectedCulture.recordGroupId && c.isCurrent);
                  if (updated) setSelectedCulture(updated);
                }}
                onArchive={async (reason) => {
                  await archiveCulture(selectedCulture.id, reason);
                  setShowHistoryModal(false);
                  setSelectedCulture(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CultureManagement;
