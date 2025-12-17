// ============================================================================
// GROW MANAGEMENT (v2 - Using Shared Data Store)
// Full CRUD for grow tracking with stage progression and harvest logging
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../store';
import type { Grow, GrowStage, GrowStatus, GrowObservation, Flush, GrowOutcomeCode } from '../../store/types';
import { StandardDropdown } from '../common/StandardDropdown';
import { ExitSurveyModal, ExitSurveyData } from '../surveys';

// Draft key for localStorage
const GROW_DRAFT_KEY = 'mycolab-grow-draft';

// Stage configurations
const stageConfig: Record<GrowStage, { label: string; icon: string; color: string }> = {
  spawning: { label: 'Spawning', icon: '🌱', color: 'text-purple-400 bg-purple-950/50' },
  colonization: { label: 'Colonization', icon: '🔵', color: 'text-blue-400 bg-blue-950/50' },
  fruiting: { label: 'Fruiting', icon: '🍄', color: 'text-emerald-400 bg-emerald-950/50' },
  harvesting: { label: 'Harvesting', icon: '✂️', color: 'text-amber-400 bg-amber-950/50' },
  completed: { label: 'Completed', icon: '✅', color: 'text-green-400 bg-green-950/50' },
  contaminated: { label: 'Contaminated', icon: '☠️', color: 'text-red-400 bg-red-950/50' },
  aborted: { label: 'Aborted', icon: '⛔', color: 'text-zinc-400 bg-zinc-800' },
};

const stageOrder: GrowStage[] = ['spawning', 'colonization', 'fruiting', 'harvesting', 'completed'];

// Icons
const Icons = {
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Grid: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>,
  Clipboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  Scale: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13"/></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
};

// Stage timeline component
const StageTimeline: React.FC<{ currentStage: GrowStage }> = ({ currentStage }) => {
  if (currentStage === 'contaminated' || currentStage === 'aborted') {
    const config = stageConfig[currentStage];
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </div>
    );
  }

  const currentIndex = stageOrder.indexOf(currentStage);

  return (
    <div className="flex items-center gap-1">
      {stageOrder.map((stage, i) => {
        const config = stageConfig[stage];
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;

        return (
          <React.Fragment key={stage}>
            {i > 0 && (
              <div className={`w-3 h-0.5 ${isPast ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
            )}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                isCurrent
                  ? 'bg-emerald-500 text-white'
                  : isPast
                  ? 'bg-emerald-500/30 text-emerald-400'
                  : 'bg-zinc-800 text-zinc-600'
              }`}
              title={config.label}
            >
              {isCurrent ? config.icon : i + 1}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Days active calculator
const daysActive = (startDate: Date, endDate?: Date): number => {
  const end = endDate ? new Date(endDate) : new Date();
  return Math.floor((end.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
};

export const GrowManagement: React.FC = () => {
  const {
    state,
    activeStrains,
    activeLocations,
    activeContainers,
    activeSubstrateTypes,
    activeGrainTypes,
    getStrain,
    getLocation,
    getContainer,
    getSubstrateType,
    getGrainType,
    getCulture,
    addGrow,
    updateGrow,
    deleteGrow,
    advanceGrowStage,
    markGrowContaminated,
    addGrowObservation,
    addFlush,
  } = useData();

  const grows = state.grows;
  const cultures = state.cultures;

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<GrowStage | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<GrowStatus | 'all'>('all');
  const [filterStrain, setFilterStrain] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'yield' | 'stage'>('date');
  const [selectedGrow, setSelectedGrow] = useState<Grow | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'timeline' | 'harvests'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showExitSurveyModal, setShowExitSurveyModal] = useState(false);
  const [exitSurveyGrow, setExitSurveyGrow] = useState<Grow | null>(null);
  const [preselectedOutcome, setPreselectedOutcome] = useState<GrowOutcomeCode | undefined>(undefined);
  const [hasDraft, setHasDraft] = useState(false);

  // Form type
  interface GrowFormState {
    name: string;
    strainId: string;
    sourceCultureId: string;
    grainTypeId: string;
    spawnWeight: number;
    substrateTypeId: string;
    substrateWeight: number;
    containerId: string;
    containerCount: number;
    locationId: string;
    inoculationDate: string; // ISO date string for the date input
    targetTempColonization: number;
    targetTempFruiting: number;
    targetHumidity: number;
    estimatedCost: number;
    notes: string;
  }

  // Get today's date in YYYY-MM-DD format for date input default
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const defaultFormState: GrowFormState = {
    name: '',
    strainId: '',
    sourceCultureId: '',
    grainTypeId: '',
    spawnWeight: 500,
    substrateTypeId: '',
    substrateWeight: 2000,
    containerId: '',
    containerCount: 1,
    locationId: '',
    inoculationDate: getTodayString(),
    targetTempColonization: 24,
    targetTempFruiting: 22,
    targetHumidity: 90,
    estimatedCost: 0,
    notes: '',
  };

  // Initialize form with draft if exists
  const getInitialFormState = (): GrowFormState => {
    const saved = localStorage.getItem(GROW_DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure inoculationDate exists (handle old drafts without this field)
        return {
          ...defaultFormState,
          ...parsed,
          inoculationDate: parsed.inoculationDate || getTodayString(),
        };
      } catch (e) {}
    }
    return defaultFormState;
  };

  // Form state
  const [newGrow, setNewGrow] = useState<GrowFormState>(getInitialFormState);

  // Edit form state
  const [editGrow, setEditGrow] = useState<GrowFormState & { id: string }>(
    { ...defaultFormState, id: '' }
  );

  // Check for draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(GROW_DRAFT_KEY);
    setHasDraft(!!saved);
  }, []);

  // Auto-save draft when form changes
  useEffect(() => {
    if (showCreateModal) {
      const hasData = newGrow.strainId || newGrow.name || newGrow.substrateTypeId || newGrow.containerId;
      if (hasData) {
        localStorage.setItem(GROW_DRAFT_KEY, JSON.stringify(newGrow));
        setHasDraft(true);
      }
    }
  }, [newGrow, showCreateModal]);

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem(GROW_DRAFT_KEY);
    setHasDraft(false);
  };

  // Load draft
  const loadDraft = () => {
    const saved = localStorage.getItem(GROW_DRAFT_KEY);
    if (saved) {
      try {
        setNewGrow(JSON.parse(saved));
        setShowCreateModal(true);
      } catch (e) {}
    }
  };

  const [newObservation, setNewObservation] = useState({
    type: 'general' as GrowObservation['type'],
    title: '',
    notes: '',
    colonizationPercent: undefined as number | undefined,
  });

  const [newHarvest, setNewHarvest] = useState({
    wetWeight: 0,
    dryWeight: 0,
    mushroomCount: undefined as number | undefined,
    quality: 'good' as Flush['quality'],
    notes: '',
  });

  // Listen for header "New" button click
  useEffect(() => {
    const handleCreateNew = (event: CustomEvent) => {
      if (event.detail?.page === 'grows') {
        setShowCreateModal(true);
      }
    };
    window.addEventListener('mycolab:create-new', handleCreateNew as EventListener);
    return () => window.removeEventListener('mycolab:create-new', handleCreateNew as EventListener);
  }, []);

  // Listen for select-item and edit-item events from Lab Inventory
  useEffect(() => {
    const handleSelectItem = (event: CustomEvent) => {
      if (event.detail?.type === 'grow') {
        const grow = grows.find(g => g.id === event.detail.id);
        if (grow) {
          setSelectedGrow(grow);
        }
      }
    };
    const handleEditItem = (event: CustomEvent) => {
      if (event.detail?.type === 'grow') {
        const grow = grows.find(g => g.id === event.detail.id);
        if (grow) {
          setSelectedGrow(grow);
          openEditModal(grow);
        }
      }
    };
    window.addEventListener('mycolab:select-item', handleSelectItem as EventListener);
    window.addEventListener('mycolab:edit-item', handleEditItem as EventListener);
    return () => {
      window.removeEventListener('mycolab:select-item', handleSelectItem as EventListener);
      window.removeEventListener('mycolab:edit-item', handleEditItem as EventListener);
    };
  }, [grows]);

  // Keep selectedGrow in sync with state.grows when grows data changes
  useEffect(() => {
    if (selectedGrow) {
      const updated = grows.find(g => g.id === selectedGrow.id);
      if (updated) {
        // Only update if the grow data has actually changed
        if (JSON.stringify(updated) !== JSON.stringify(selectedGrow)) {
          setSelectedGrow(updated);
        }
      } else {
        // Grow was deleted
        setSelectedGrow(null);
      }
    }
  }, [grows, selectedGrow]);

  // Calculated spawn rate
  const calculatedSpawnRate = useMemo(() => {
    if (!newGrow.spawnWeight || !newGrow.substrateWeight) return 0;
    return Math.round((newGrow.spawnWeight / (newGrow.spawnWeight + newGrow.substrateWeight)) * 100);
  }, [newGrow.spawnWeight, newGrow.substrateWeight]);

  // Filtered and sorted grows
  const filteredGrows = useMemo(() => {
    let result = [...grows];

    if (filterStage !== 'all') result = result.filter(g => g.currentStage === filterStage);
    if (filterStatus !== 'all') result = result.filter(g => g.status === filterStatus);
    if (filterStrain !== 'all') result = result.filter(g => g.strainId === filterStrain);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(q) ||
        getStrain(g.strainId)?.name.toLowerCase().includes(q) ||
        g.notes.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'date':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'yield':
        result.sort((a, b) => b.totalYield - a.totalYield);
        break;
      case 'stage':
        result.sort((a, b) => stageOrder.indexOf(a.currentStage) - stageOrder.indexOf(b.currentStage));
        break;
    }

    return result;
  }, [grows, filterStage, filterStatus, filterStrain, searchQuery, sortBy, getStrain]);

  // Stats
  const stats = useMemo(() => {
    const active = grows.filter(g => g.status === 'active');
    const completed = grows.filter(g => g.status === 'completed');
    const failed = grows.filter(g => g.status === 'failed');
    const totalYield = grows.reduce((sum, g) => sum + g.totalYield, 0);
    const avgYield = completed.length > 0 ? totalYield / completed.length : 0;
    const totalCost = grows.reduce((sum, g) => sum + g.estimatedCost, 0);

    return { active: active.length, completed: completed.length, failed: failed.length, totalYield, avgYield, totalCost };
  }, [grows]);

  // Used strains
  const usedStrainIds = useMemo(() => [...new Set(grows.map(g => g.strainId))], [grows]);

  // Ready cultures for source selection
  const readyCultures = useMemo(() =>
    cultures.filter(c => ['active', 'ready'].includes(c.status)),
    [cultures]
  );

  // Ready cultures formatted for dropdown
  const readyCultureOptions = useMemo(() =>
    readyCultures.map(c => ({
      id: c.id,
      name: `${c.label} - ${getStrain(c.strainId)?.name || 'Unknown'}`,
    })),
    [readyCultures, getStrain]
  );

  // Create grow handler
  const handleCreateGrow = () => {
    if (!newGrow.strainId || !newGrow.substrateTypeId || !newGrow.containerId || !newGrow.locationId) return;

    const strain = getStrain(newGrow.strainId);
    const container = getContainer(newGrow.containerId);
    const grainType = getGrainType(newGrow.grainTypeId);
    const existingCount = grows.filter(g => g.strainId === newGrow.strainId && getContainer(g.containerId)?.id === newGrow.containerId).length;
    const autoName = newGrow.name || `${strain?.name || 'Unknown'} ${container?.name || 'Grow'} #${existingCount + 1}`;

    // Parse the inoculation date - use noon to avoid timezone issues
    const inoculationDate = newGrow.inoculationDate
      ? new Date(newGrow.inoculationDate + 'T12:00:00')
      : new Date();

    addGrow({
      name: autoName,
      strainId: newGrow.strainId,
      status: 'active',
      currentStage: 'spawning',
      sourceCultureId: newGrow.sourceCultureId || undefined,
      spawnType: grainType?.name || 'Unknown',
      spawnWeight: newGrow.spawnWeight,
      substrateTypeId: newGrow.substrateTypeId,
      substrateWeight: newGrow.substrateWeight,
      spawnRate: calculatedSpawnRate,
      containerId: newGrow.containerId,
      containerCount: newGrow.containerCount,
      spawnedAt: inoculationDate,
      locationId: newGrow.locationId,
      targetTempColonization: newGrow.targetTempColonization,
      targetTempFruiting: newGrow.targetTempFruiting,
      targetHumidity: newGrow.targetHumidity,
      estimatedCost: newGrow.estimatedCost,
      notes: newGrow.notes,
    });

    setShowCreateModal(false);
    clearDraft(); // Clear draft on successful creation
    setNewGrow(defaultFormState);
  };

  // Open edit modal with grow data
  const openEditModal = (grow: Grow) => {
    setEditGrow({
      id: grow.id,
      name: grow.name,
      strainId: grow.strainId,
      sourceCultureId: grow.sourceCultureId || '',
      grainTypeId: '', // Not stored on grow, just spawn type name
      spawnWeight: grow.spawnWeight,
      substrateTypeId: grow.substrateTypeId,
      substrateWeight: grow.substrateWeight,
      containerId: grow.containerId,
      containerCount: grow.containerCount,
      locationId: grow.locationId,
      inoculationDate: new Date(grow.spawnedAt).toISOString().split('T')[0],
      targetTempColonization: grow.targetTempColonization || 24,
      targetTempFruiting: grow.targetTempFruiting || 22,
      targetHumidity: grow.targetHumidity || 90,
      estimatedCost: grow.estimatedCost,
      notes: grow.notes,
    });
    setShowEditModal(true);
  };

  // Get downstream effects for a grow (for warning display)
  const getDownstreamEffects = (grow: Grow) => {
    const effects: string[] = [];

    if (grow.flushes.length > 0) {
      effects.push(`${grow.flushes.length} harvest record${grow.flushes.length !== 1 ? 's' : ''}`);
    }
    if (grow.observations.length > 0) {
      effects.push(`${grow.observations.length} observation${grow.observations.length !== 1 ? 's' : ''}`);
    }
    if (grow.totalYield > 0) {
      effects.push(`${grow.totalYield}g total yield`);
    }

    return effects;
  };

  // Update grow handler
  const handleUpdateGrow = async () => {
    if (!editGrow.id || !editGrow.strainId || !editGrow.substrateTypeId || !editGrow.containerId || !editGrow.locationId) return;

    // Parse the inoculation date
    const inoculationDate = editGrow.inoculationDate
      ? new Date(editGrow.inoculationDate + 'T12:00:00')
      : new Date();

    // Calculate new spawn rate
    const newSpawnRate = editGrow.spawnWeight && editGrow.substrateWeight
      ? Math.round((editGrow.spawnWeight / (editGrow.spawnWeight + editGrow.substrateWeight)) * 100)
      : 0;

    await updateGrow(editGrow.id, {
      name: editGrow.name,
      strainId: editGrow.strainId,
      sourceCultureId: editGrow.sourceCultureId || undefined,
      spawnWeight: editGrow.spawnWeight,
      substrateTypeId: editGrow.substrateTypeId,
      substrateWeight: editGrow.substrateWeight,
      spawnRate: newSpawnRate,
      containerId: editGrow.containerId,
      containerCount: editGrow.containerCount,
      locationId: editGrow.locationId,
      spawnedAt: inoculationDate,
      targetTempColonization: editGrow.targetTempColonization,
      targetTempFruiting: editGrow.targetTempFruiting,
      targetHumidity: editGrow.targetHumidity,
      estimatedCost: editGrow.estimatedCost,
      notes: editGrow.notes,
    });

    setShowEditModal(false);
  };

  // Advance stage handler
  const handleAdvanceStage = async () => {
    if (!selectedGrow) return;
    await advanceGrowStage(selectedGrow.id);
    // selectedGrow will be auto-updated by the sync useEffect when state.grows changes
  };

  // Mark contaminated handler
  const handleMarkContaminated = async () => {
    if (!selectedGrow) return;
    if (confirm('Mark this grow as contaminated? This action cannot be undone.')) {
      await markGrowContaminated(selectedGrow.id);
      // selectedGrow will be auto-updated by the sync useEffect when state.grows changes
    }
  };

  // Add observation handler
  const handleAddObservation = () => {
    if (!selectedGrow || !newObservation.title) return;

    addGrowObservation(selectedGrow.id, {
      date: new Date(),
      stage: selectedGrow.currentStage,
      type: newObservation.type,
      title: newObservation.title,
      notes: newObservation.notes,
      colonizationPercent: newObservation.colonizationPercent,
    });
    // selectedGrow will be auto-updated by the sync useEffect when state.grows changes

    setShowObservationModal(false);
    setNewObservation({ type: 'general', title: '', notes: '', colonizationPercent: undefined });
  };

  // Add harvest handler
  const handleAddHarvest = async () => {
    if (!selectedGrow || !newHarvest.wetWeight) return;

    await addFlush(selectedGrow.id, {
      harvestDate: new Date(),
      wetWeight: newHarvest.wetWeight,
      dryWeight: newHarvest.dryWeight || Math.round(newHarvest.wetWeight * 0.1),
      mushroomCount: newHarvest.mushroomCount,
      quality: newHarvest.quality,
      notes: newHarvest.notes,
    });
    // selectedGrow will be auto-updated by the sync useEffect when state.grows changes

    setShowHarvestModal(false);
    setNewHarvest({ wetWeight: 0, dryWeight: 0, mushroomCount: undefined, quality: 'good', notes: '' });
  };

  // Open exit survey for a grow
  const openExitSurvey = (grow: Grow, preselected?: GrowOutcomeCode) => {
    setExitSurveyGrow(grow);
    setPreselectedOutcome(preselected);
    setShowExitSurveyModal(true);
  };

  // Handle exit survey completion
  const handleExitSurveyComplete = async (surveyData: ExitSurveyData) => {
    if (!exitSurveyGrow) return;

    const strain = getStrain(exitSurveyGrow.strainId);
    const location = getLocation(exitSurveyGrow.locationId);

    // Build the outcome data
    const outcomeData = {
      entityType: 'grow' as const,
      entityId: exitSurveyGrow.id,
      entityName: exitSurveyGrow.name,
      outcomeCategory: surveyData.outcomeCategory,
      outcomeCode: surveyData.outcomeCode,
      outcomeLabel: surveyData.outcomeLabel,
      startedAt: exitSurveyGrow.spawnedAt,
      endedAt: new Date(),
      totalCost: exitSurveyGrow.estimatedCost,
      totalYieldWet: exitSurveyGrow.totalYield,
      flushCount: exitSurveyGrow.flushes.length,
      strainId: exitSurveyGrow.strainId,
      strainName: strain?.name,
      locationId: exitSurveyGrow.locationId,
      locationName: location?.name,
      surveyResponses: {
        contamination: surveyData.contamination,
        feedback: surveyData.feedback,
      },
      notes: surveyData.feedback?.notes,
    };

    // Delete the grow with outcome data
    await deleteGrow(exitSurveyGrow.id, outcomeData);

    // Clean up
    setShowExitSurveyModal(false);
    setExitSurveyGrow(null);
    setPreselectedOutcome(undefined);
    if (selectedGrow?.id === exitSurveyGrow.id) setSelectedGrow(null);
  };

  // Handle skip survey (delete without logging)
  const handleSkipSurvey = async () => {
    if (!exitSurveyGrow) return;

    if (confirm('Delete this grow without logging the outcome? This data helps track patterns.')) {
      await deleteGrow(exitSurveyGrow.id);
      setShowExitSurveyModal(false);
      setExitSurveyGrow(null);
      setPreselectedOutcome(undefined);
      if (selectedGrow?.id === exitSurveyGrow.id) setSelectedGrow(null);
    }
  };

  // Delete handler - now opens exit survey
  const handleDelete = (grow: Grow) => {
    openExitSurvey(grow);
  };

  // Mark contaminated handler - opens exit survey with preselected contamination
  const handleMarkContaminatedWithSurvey = (grow: Grow) => {
    // Determine which contamination code based on days active
    const days = daysActive(grow.spawnedAt);
    let outcomeCode: GrowOutcomeCode = 'contamination_mid';
    if (days <= 7) outcomeCode = 'contamination_early';
    else if (days > 21) outcomeCode = 'contamination_late';

    openExitSurvey(grow, outcomeCode);
  };

  // Complete grow handler - opens exit survey with success preselected
  const handleCompleteGrow = (grow: Grow) => {
    // Determine success level based on yield
    let outcomeCode: GrowOutcomeCode = 'completed_success';
    // Could add logic here to suggest excellent/low_yield based on species typical yield

    openExitSurvey(grow, outcomeCode);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Grow Tracker</h2>
          <p className="text-zinc-400 text-sm">Track your cultivation projects from spawn to harvest</p>
        </div>
        {hasDraft && !showCreateModal && (
          <button
            onClick={loadDraft}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-400 rounded-lg text-sm font-medium transition-colors"
          >
            <span>📝</span>
            Continue Draft
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Active</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Completed</p>
          <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Failed</p>
          <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Total Yield</p>
          <p className="text-2xl font-bold text-white">{stats.totalYield}g</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Avg Yield</p>
          <p className="text-2xl font-bold text-white">{stats.avgYield.toFixed(1)}g</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Total Cost</p>
          <p className="text-2xl font-bold text-white">${stats.totalCost.toFixed(0)}</p>
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
            placeholder="Search grows..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={filterStage}
          onChange={e => setFilterStage(e.target.value as GrowStage | 'all')}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Stages</option>
          {Object.entries(stageConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.icon} {config.label}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as GrowStatus | 'all')}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
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
          <option value="yield">Sort by Yield</option>
          <option value="stage">Sort by Stage</option>
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
              {filteredGrows.map(grow => {
                const strain = getStrain(grow.strainId);
                const container = getContainer(grow.containerId);
                const days = daysActive(grow.spawnedAt, grow.completedAt);

                return (
                  <div
                    key={grow.id}
                    onClick={() => setSelectedGrow(grow)}
                    className={`bg-zinc-900/50 border rounded-xl p-4 cursor-pointer transition-all hover:border-zinc-600 ${
                      selectedGrow?.id === grow.id ? 'border-emerald-600' : 'border-zinc-800'
                    }`}
                  >
                    {/* Stage Timeline */}
                    <div className="mb-3">
                      <StageTimeline currentStage={grow.currentStage} />
                    </div>

                    {/* Name & Strain */}
                    <div className="mb-3">
                      <p className="font-semibold text-white">{grow.name}</p>
                      <p className="text-xs text-zinc-500">{strain?.name}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      <div className="bg-zinc-800/50 rounded p-2">
                        <p className="text-xs text-zinc-500">Days</p>
                        <p className="text-sm font-medium text-white">{days}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded p-2">
                        <p className="text-xs text-zinc-500">Flushes</p>
                        <p className="text-sm font-medium text-white">{grow.flushes.length}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded p-2">
                        <p className="text-xs text-zinc-500">Yield</p>
                        <p className="text-sm font-medium text-emerald-400">{grow.totalYield}g</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-800">
                      <span>{container?.name}</span>
                      <span>{grow.spawnRate}% spawn rate</span>
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
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Grow</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Strain</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Stage</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Days</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Flushes</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-400">Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrows.map(grow => {
                    const strain = getStrain(grow.strainId);
                    const config = stageConfig[grow.currentStage];
                    const days = daysActive(grow.spawnedAt, grow.completedAt);

                    return (
                      <tr
                        key={grow.id}
                        onClick={() => setSelectedGrow(grow)}
                        className={`border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/30 ${
                          selectedGrow?.id === grow.id ? 'bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="p-3 font-medium text-white">{grow.name}</td>
                        <td className="p-3 text-sm text-white">{strain?.name}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                          </span>
                        </td>
                        <td className="p-3 text-sm text-zinc-400">{days}</td>
                        <td className="p-3 text-sm text-zinc-400">{grow.flushes.length}</td>
                        <td className="p-3 text-sm font-medium text-emerald-400">{grow.totalYield}g</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedGrow && (
          <div className="w-96 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 h-fit sticky top-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedGrow.name}</h3>
                <p className="text-sm text-zinc-400">{getStrain(selectedGrow.strainId)?.name}</p>
              </div>
              <button onClick={() => setSelectedGrow(null)} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>

            {/* Stage */}
            <div className="mb-4">
              <StageTimeline currentStage={selectedGrow.currentStage} />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-zinc-800 rounded-lg p-1">
              {(['overview', 'timeline', 'harvests'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                    detailTab === tab ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {detailTab === 'overview' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-zinc-500">Days Active</p>
                    <p className="text-xl font-bold text-white">{daysActive(selectedGrow.spawnedAt, selectedGrow.completedAt)}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-zinc-500">Total Yield</p>
                    <p className="text-xl font-bold text-emerald-400">{selectedGrow.totalYield}g</p>
                  </div>
                </div>

                <div className="text-sm space-y-2">
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-500">Container</span>
                    <span className="text-white">{getContainer(selectedGrow.containerId)?.name} x{selectedGrow.containerCount}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-500">Substrate</span>
                    <span className="text-white">{getSubstrateType(selectedGrow.substrateTypeId)?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-500">Spawn Rate</span>
                    <span className="text-white">{selectedGrow.spawnRate}%</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-500">Location</span>
                    <span className="text-white">{getLocation(selectedGrow.locationId)?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-500">Spawned</span>
                    <span className="text-white">{new Date(selectedGrow.spawnedAt).toLocaleDateString()}</span>
                  </div>
                  {selectedGrow.sourceCultureId && (
                    <div className="flex justify-between py-2 border-b border-zinc-800">
                      <span className="text-zinc-500">Source</span>
                      <span className="text-white">{getCulture(selectedGrow.sourceCultureId)?.label}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-500">Est. Cost</span>
                    <span className="text-white">${selectedGrow.estimatedCost.toFixed(2)}</span>
                  </div>
                </div>

                {selectedGrow.notes && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Notes</p>
                    <p className="text-sm text-zinc-300 bg-zinc-800/50 rounded p-2">{selectedGrow.notes}</p>
                  </div>
                )}
              </div>
            )}

            {detailTab === 'timeline' && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedGrow.observations.slice().reverse().map(obs => (
                  <div key={obs.id} className="bg-zinc-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${stageConfig[obs.stage].color}`}>
                        {stageConfig[obs.stage].icon}
                      </span>
                      <span className="text-sm font-medium text-white">{obs.title}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-1">{new Date(obs.date).toLocaleDateString()}</p>
                    {obs.notes && <p className="text-xs text-zinc-300">{obs.notes}</p>}
                    {obs.colonizationPercent !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-500">Colonization</span>
                          <span className="text-white">{obs.colonizationPercent}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${obs.colonizationPercent}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {selectedGrow.observations.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">No observations yet</p>
                )}
              </div>
            )}

            {detailTab === 'harvests' && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedGrow.flushes.map(flush => (
                  <div key={flush.id} className="bg-zinc-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">Flush #{flush.flushNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        flush.quality === 'excellent' ? 'bg-emerald-950/50 text-emerald-400' :
                        flush.quality === 'good' ? 'bg-blue-950/50 text-blue-400' :
                        flush.quality === 'fair' ? 'bg-amber-950/50 text-amber-400' :
                        'bg-red-950/50 text-red-400'
                      }`}>
                        {flush.quality}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-zinc-500">Wet</p>
                        <p className="text-white font-medium">{flush.wetWeight}g</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Dry</p>
                        <p className="text-emerald-400 font-medium">{flush.dryWeight}g</p>
                      </div>
                      {flush.mushroomCount && (
                        <div>
                          <p className="text-zinc-500">Count</p>
                          <p className="text-white font-medium">{flush.mushroomCount}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">{new Date(flush.harvestDate).toLocaleDateString()}</p>
                  </div>
                ))}
                {selectedGrow.flushes.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">No harvests yet</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-zinc-800">
              {/* Primary action buttons row */}
              {!['completed', 'contaminated', 'aborted'].includes(selectedGrow.currentStage) && (
                <>
                  {selectedGrow.currentStage === 'harvesting' ? (
                    <button
                      onClick={() => handleCompleteGrow(selectedGrow)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
                      title="Complete this grow and log outcome"
                    >
                      <Icons.Check />
                      Complete
                    </button>
                  ) : (
                    <button
                      onClick={handleAdvanceStage}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
                    >
                      <Icons.ChevronRight />
                      Advance
                    </button>
                  )}
                </>
              )}
              {['fruiting', 'harvesting'].includes(selectedGrow.currentStage) && (
                <button
                  onClick={() => setShowHarvestModal(true)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm font-medium"
                >
                  <Icons.Scale />
                  Harvest
                </button>
              )}
              <button
                onClick={() => setShowObservationModal(true)}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium"
              >
                <Icons.Clipboard />
                Log
              </button>

              {/* Secondary action buttons row */}
              <button
                onClick={() => openEditModal(selectedGrow)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
                title="Edit Grow"
              >
                <Icons.Edit />
              </button>
              {!['completed', 'contaminated', 'aborted'].includes(selectedGrow.currentStage) && (
                <button
                  onClick={() => handleMarkContaminatedWithSurvey(selectedGrow)}
                  className="p-2 bg-red-950/50 hover:bg-red-950 text-red-400 rounded-lg text-sm"
                  title="Mark Contaminated (log outcome)"
                >
                  ☠️
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedGrow)}
                className="p-2 bg-red-950/50 hover:bg-red-950 text-red-400 rounded-lg"
                title="Remove Grow (log outcome)"
              >
                <Icons.Trash />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">New Grow</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white"
                title="Close (draft will be saved)"
              >
                <Icons.X />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Name (optional)</label>
                <input
                  type="text"
                  value={newGrow.name}
                  onChange={e => setNewGrow(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Auto-generated if blank"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StandardDropdown
                  label="Strain"
                  required
                  value={newGrow.strainId}
                  onChange={value => setNewGrow(prev => ({ ...prev, strainId: value }))}
                  options={activeStrains}
                  placeholder="Select..."
                  entityType="strain"
                  fieldName="strainId"
                />
                <StandardDropdown
                  label="Source Culture"
                  value={newGrow.sourceCultureId}
                  onChange={value => setNewGrow(prev => ({ ...prev, sourceCultureId: value }))}
                  options={readyCultureOptions}
                  placeholder="None"
                  fieldName="sourceCultureId"
                  // Note: No entityType - cultures are too complex for inline creation
                  // Users should create cultures separately in the Cultures page
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StandardDropdown
                  label="Spawn Type"
                  value={newGrow.grainTypeId}
                  onChange={value => setNewGrow(prev => ({ ...prev, grainTypeId: value }))}
                  options={activeGrainTypes}
                  placeholder="Select..."
                  entityType="grainType"
                  fieldName="grainTypeId"
                />
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Spawn Weight (g)</label>
                  <input
                    type="number"
                    value={newGrow.spawnWeight}
                    onChange={e => setNewGrow(prev => ({ ...prev, spawnWeight: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StandardDropdown
                  label="Substrate"
                  required
                  value={newGrow.substrateTypeId}
                  onChange={value => setNewGrow(prev => ({ ...prev, substrateTypeId: value }))}
                  options={activeSubstrateTypes}
                  filterFn={s => s.category === 'bulk'}
                  placeholder="Select..."
                  entityType="substrateType"
                  fieldName="substrateTypeId"
                />
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Substrate Weight (g)</label>
                  <input
                    type="number"
                    value={newGrow.substrateWeight}
                    onChange={e => setNewGrow(prev => ({ ...prev, substrateWeight: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {calculatedSpawnRate > 0 && (
                <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500">Calculated Spawn Rate</p>
                  <p className="text-xl font-bold text-emerald-400">{calculatedSpawnRate}%</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <StandardDropdown
                  label="Container"
                  required
                  value={newGrow.containerId}
                  onChange={value => setNewGrow(prev => ({ ...prev, containerId: value }))}
                  options={activeContainers.filter(c => c.usageContext.includes('grow'))}
                  placeholder="Select..."
                  entityType="container"
                  fieldName="containerId"
                />
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Count</label>
                  <input
                    type="number"
                    value={newGrow.containerCount}
                    onChange={e => setNewGrow(prev => ({ ...prev, containerCount: parseInt(e.target.value) || 1 }))}
                    min="1"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StandardDropdown
                  label="Location"
                  required
                  value={newGrow.locationId}
                  onChange={value => setNewGrow(prev => ({ ...prev, locationId: value }))}
                  options={activeLocations}
                  placeholder="Select..."
                  entityType="location"
                  fieldName="locationId"
                />
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Inoculation Date</label>
                  <input
                    type="date"
                    value={newGrow.inoculationDate}
                    onChange={e => setNewGrow(prev => ({ ...prev, inoculationDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Estimated Cost ($)</label>
                <input
                  type="number"
                  value={newGrow.estimatedCost}
                  onChange={e => setNewGrow(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                  step="0.01"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Notes</label>
                <textarea
                  value={newGrow.notes}
                  onChange={e => setNewGrow(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  clearDraft();
                  setNewGrow(defaultFormState);
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Draft is already auto-saved, just close the modal
                  setShowCreateModal(false);
                }}
                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-400 rounded-lg font-medium"
              >
                Save Draft
              </button>
              <button
                onClick={handleCreateGrow}
                disabled={!newGrow.strainId || !newGrow.substrateTypeId || !newGrow.containerId || !newGrow.locationId}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
              >
                Create Grow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (() => {
        const growToEdit = grows.find(g => g.id === editGrow.id);
        const downstreamEffects = growToEdit ? getDownstreamEffects(growToEdit) : [];
        const editSpawnRate = editGrow.spawnWeight && editGrow.substrateWeight
          ? Math.round((editGrow.spawnWeight / (editGrow.spawnWeight + editGrow.substrateWeight)) * 100)
          : 0;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Edit Grow</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <Icons.X />
                </button>
              </div>

              {/* Warning about downstream effects */}
              {downstreamEffects.length > 0 && (
                <div className="mb-6 p-4 bg-amber-950/30 border border-amber-800/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-400 text-lg">⚠️</span>
                    <div>
                      <p className="text-amber-400 font-medium text-sm mb-1">This grow has existing data</p>
                      <p className="text-amber-300/70 text-xs mb-2">
                        Changes to core fields (strain, dates, container) may affect data integrity. The following data is associated with this grow:
                      </p>
                      <ul className="text-xs text-amber-300/60 list-disc list-inside">
                        {downstreamEffects.map((effect, i) => (
                          <li key={i}>{effect}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={editGrow.name}
                    onChange={e => setEditGrow(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <StandardDropdown
                    label="Strain"
                    required
                    value={editGrow.strainId}
                    onChange={value => setEditGrow(prev => ({ ...prev, strainId: value }))}
                    options={activeStrains}
                    placeholder="Select..."
                    entityType="strain"
                    fieldName="strainId"
                  />
                  <StandardDropdown
                    label="Source Culture"
                    value={editGrow.sourceCultureId}
                    onChange={value => setEditGrow(prev => ({ ...prev, sourceCultureId: value }))}
                    options={readyCultureOptions}
                    placeholder="None"
                    fieldName="sourceCultureId"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <StandardDropdown
                    label="Spawn Type"
                    value={editGrow.grainTypeId}
                    onChange={value => setEditGrow(prev => ({ ...prev, grainTypeId: value }))}
                    options={activeGrainTypes}
                    placeholder="Select..."
                    entityType="grainType"
                    fieldName="grainTypeId"
                  />
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Spawn Weight (g)</label>
                    <input
                      type="number"
                      value={editGrow.spawnWeight}
                      onChange={e => setEditGrow(prev => ({ ...prev, spawnWeight: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <StandardDropdown
                    label="Substrate"
                    required
                    value={editGrow.substrateTypeId}
                    onChange={value => setEditGrow(prev => ({ ...prev, substrateTypeId: value }))}
                    options={activeSubstrateTypes}
                    filterFn={s => s.category === 'bulk'}
                    placeholder="Select..."
                    entityType="substrateType"
                    fieldName="substrateTypeId"
                  />
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Substrate Weight (g)</label>
                    <input
                      type="number"
                      value={editGrow.substrateWeight}
                      onChange={e => setEditGrow(prev => ({ ...prev, substrateWeight: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                {editSpawnRate > 0 && (
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-zinc-500">Calculated Spawn Rate</p>
                    <p className="text-xl font-bold text-emerald-400">{editSpawnRate}%</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <StandardDropdown
                    label="Container"
                    required
                    value={editGrow.containerId}
                    onChange={value => setEditGrow(prev => ({ ...prev, containerId: value }))}
                    options={activeContainers.filter(c => c.usageContext.includes('grow'))}
                    placeholder="Select..."
                    entityType="container"
                    fieldName="containerId"
                  />
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Count</label>
                    <input
                      type="number"
                      value={editGrow.containerCount}
                      onChange={e => setEditGrow(prev => ({ ...prev, containerCount: parseInt(e.target.value) || 1 }))}
                      min="1"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <StandardDropdown
                    label="Location"
                    required
                    value={editGrow.locationId}
                    onChange={value => setEditGrow(prev => ({ ...prev, locationId: value }))}
                    options={activeLocations}
                    placeholder="Select..."
                    entityType="location"
                    fieldName="locationId"
                  />
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Inoculation Date</label>
                    <input
                      type="date"
                      value={editGrow.inoculationDate}
                      onChange={e => setEditGrow(prev => ({ ...prev, inoculationDate: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Estimated Cost ($)</label>
                  <input
                    type="number"
                    value={editGrow.estimatedCost}
                    onChange={e => setEditGrow(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                    step="0.01"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Notes</label>
                  <textarea
                    value={editGrow.notes}
                    onChange={e => setEditGrow(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateGrow}
                  disabled={!editGrow.strainId || !editGrow.substrateTypeId || !editGrow.containerId || !editGrow.locationId}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Observation Modal */}
      {showObservationModal && selectedGrow && (
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
                  onChange={e => setNewObservation(prev => ({ ...prev, type: e.target.value as GrowObservation['type'] }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="general">General</option>
                  <option value="environmental">Environmental</option>
                  <option value="contamination">Contamination</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Title *</label>
                <input
                  type="text"
                  value={newObservation.title}
                  onChange={e => setNewObservation(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              {selectedGrow.currentStage === 'colonization' && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Colonization %</label>
                  <input
                    type="number"
                    value={newObservation.colonizationPercent || ''}
                    onChange={e => setNewObservation(prev => ({ ...prev, colonizationPercent: parseInt(e.target.value) || undefined }))}
                    min="0"
                    max="100"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Notes</label>
                <textarea
                  value={newObservation.notes}
                  onChange={e => setNewObservation(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
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
                disabled={!newObservation.title}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Harvest Modal */}
      {showHarvestModal && selectedGrow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Record Harvest</h3>
              <button onClick={() => setShowHarvestModal(false)} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500">This will be</p>
                <p className="text-xl font-bold text-white">Flush #{selectedGrow.flushes.length + 1}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Wet Weight (g) *</label>
                  <input
                    type="number"
                    value={newHarvest.wetWeight || ''}
                    onChange={e => setNewHarvest(prev => ({ ...prev, wetWeight: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Dry Weight (g)</label>
                  <input
                    type="number"
                    value={newHarvest.dryWeight || ''}
                    onChange={e => setNewHarvest(prev => ({ ...prev, dryWeight: parseFloat(e.target.value) || 0 }))}
                    placeholder={newHarvest.wetWeight ? `~${Math.round(newHarvest.wetWeight * 0.1)}` : ''}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Mushroom Count</label>
                <input
                  type="number"
                  value={newHarvest.mushroomCount || ''}
                  onChange={e => setNewHarvest(prev => ({ ...prev, mushroomCount: parseInt(e.target.value) || undefined }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Quality</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['excellent', 'good', 'fair', 'poor'] as const).map(q => (
                    <button
                      key={q}
                      onClick={() => setNewHarvest(prev => ({ ...prev, quality: q }))}
                      className={`py-2 rounded-lg text-xs font-medium transition-all ${
                        newHarvest.quality === q
                          ? q === 'excellent' ? 'bg-emerald-500 text-white' :
                            q === 'good' ? 'bg-blue-500 text-white' :
                            q === 'fair' ? 'bg-amber-500 text-white' :
                            'bg-red-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {q.charAt(0).toUpperCase() + q.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Notes</label>
                <textarea
                  value={newHarvest.notes}
                  onChange={e => setNewHarvest(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowHarvestModal(false)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHarvest}
                disabled={!newHarvest.wetWeight}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
              >
                Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Survey Modal */}
      {exitSurveyGrow && (
        <ExitSurveyModal
          isOpen={showExitSurveyModal}
          onClose={() => {
            setShowExitSurveyModal(false);
            setExitSurveyGrow(null);
            setPreselectedOutcome(undefined);
          }}
          onComplete={handleExitSurveyComplete}
          onSkip={handleSkipSurvey}
          entityType="grow"
          entityName={exitSurveyGrow.name}
          preselectedOutcome={preselectedOutcome}
        />
      )}
    </div>
  );
};

export default GrowManagement;
