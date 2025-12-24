// ============================================================================
// SPAWN MANAGEMENT
// Track grain spawn through colonization lifecycle
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useData } from '../../store';
import { format, differenceInDays } from 'date-fns';
import type {
  GrainSpawn,
  GrainSpawnStatus,
  GrainSpawnWorkflowStage,
  PreparedSpawn,
  PreparedSpawnStatus,
} from '../../store/types';
import { InoculateToGrainModal } from './InoculateToGrainModal';
import { ShakeModal } from './ShakeModal';
import { SpawnToBulkModal } from './SpawnToBulkModal';
import { PrepareSpawnForm } from './PrepareSpawnForm';

// Prepared spawn status config
const preparedSpawnStatusConfig: Record<PreparedSpawnStatus, { label: string; color: string; icon: string }> = {
  preparing: { label: 'Preparing', color: 'text-amber-400 bg-amber-950/50', icon: '🥣' },
  sterilizing: { label: 'Sterilizing', color: 'text-red-400 bg-red-950/50', icon: '🔥' },
  cooling: { label: 'Cooling', color: 'text-blue-400 bg-blue-950/50', icon: '❄️' },
  ready: { label: 'Ready', color: 'text-emerald-400 bg-emerald-950/50', icon: '✓' },
  reserved: { label: 'Reserved', color: 'text-purple-400 bg-purple-950/50', icon: '📌' },
  inoculated: { label: 'Inoculated', color: 'text-green-400 bg-green-950/50', icon: '💉' },
  contaminated: { label: 'Contaminated', color: 'text-red-400 bg-red-950/50', icon: '☠️' },
  expired: { label: 'Expired', color: 'text-zinc-400 bg-zinc-800', icon: '⏰' },
};

// Status configurations
const grainSpawnStatusConfig: Record<GrainSpawnStatus, { label: string; color: string; description: string }> = {
  inoculated: { label: 'Inoculated', color: 'text-blue-400 bg-blue-950/50', description: 'Recently inoculated, waiting for growth' },
  colonizing: { label: 'Colonizing', color: 'text-cyan-400 bg-cyan-950/50', description: 'Mycelium is actively growing' },
  shake_ready: { label: 'Shake Ready', color: 'text-amber-400 bg-amber-950/50', description: 'Ready for break and shake' },
  shaken: { label: 'Shaken', color: 'text-purple-400 bg-purple-950/50', description: 'Recently shaken, resuming colonization' },
  fully_colonized: { label: 'Fully Colonized', color: 'text-emerald-400 bg-emerald-950/50', description: 'Ready for spawn-to-bulk' },
  spawned_to_bulk: { label: 'Spawned', color: 'text-green-400 bg-green-950/50', description: 'Used in bulk substrate' },
  contaminated: { label: 'Contaminated', color: 'text-red-400 bg-red-950/50', description: 'Contamination detected' },
  stalled: { label: 'Stalled', color: 'text-orange-400 bg-orange-950/50', description: 'Growth has stalled' },
  expired: { label: 'Expired', color: 'text-zinc-400 bg-zinc-800', description: 'Past usable date' },
};

// Workflow stage configurations
const workflowStageConfig: Record<GrainSpawnWorkflowStage, { label: string; icon: string; color: string }> = {
  sterile_work: { label: 'Sterile Work', icon: '🧪', color: 'text-blue-400' },
  clean_work: { label: 'Clean Work', icon: '🧹', color: 'text-green-400' },
  observation: { label: 'Observation Only', icon: '👁', color: 'text-amber-400' },
  completed: { label: 'Completed', icon: '✓', color: 'text-emerald-400' },
};

// Icons
const Icons = {
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Shake: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Grid: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
};

// Colonization progress bar component
const ColonizationProgress: React.FC<{ progress: number; status: GrainSpawnStatus }> = ({ progress, status }) => {
  const getProgressColor = () => {
    if (status === 'contaminated') return 'bg-red-500';
    if (status === 'stalled') return 'bg-orange-500';
    if (progress >= 100) return 'bg-emerald-500';
    if (progress >= 70) return 'bg-green-500';
    if (progress >= 30) return 'bg-cyan-500';
    return 'bg-blue-500';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">Colonization</span>
        <span className="text-zinc-300">{progress}%</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-500`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};

// Workflow stage indicator
const WorkflowIndicator: React.FC<{ stage: GrainSpawnWorkflowStage }> = ({ stage }) => {
  const config = workflowStageConfig[stage];
  return (
    <div className={`flex items-center gap-1 text-xs ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};

export const SpawnManagement: React.FC = () => {
  const {
    state,
    getStrain,
    getLocation,
    getGrainType,
    getContainer,
    shakeGrainSpawn,
    markGrainSpawnFullyColonized,
    markGrainSpawnContaminated,
    deleteGrainSpawn,
    updatePreparedSpawn,
  } = useData();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<GrainSpawnStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSpawn, setSelectedSpawn] = useState<GrainSpawn | null>(null);

  // Modal state
  const [showInoculateModal, setShowInoculateModal] = useState(false);
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [shakeModalSpawn, setShakeModalSpawn] = useState<GrainSpawn | null>(null);
  const [spawnToBulkSpawn, setSpawnToBulkSpawn] = useState<GrainSpawn | null>(null);
  const [selectedPreparedSpawn, setSelectedPreparedSpawn] = useState<PreparedSpawn | null>(null);

  // Tab state for prepared vs inoculated
  const [activeTab, setActiveTab] = useState<'prepared' | 'inoculated'>('prepared');

  // Get prepared spawn in workflow
  const preparedSpawnInProgress = useMemo(() => {
    return state.preparedSpawn.filter(ps =>
      ps.isActive &&
      ['preparing', 'sterilizing', 'cooling', 'ready'].includes(ps.status) &&
      (ps.type === 'grain_jar' || ps.type === 'spawn_bag')
    ).sort((a, b) => {
      // Sort by status priority
      const statusPriority: Record<string, number> = {
        cooling: 0,  // Most urgent - needs attention
        ready: 1,    // Ready to inoculate
        sterilizing: 2,
        preparing: 3,
      };
      return (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99);
    });
  }, [state.preparedSpawn]);

  // Calculate stats
  const stats = useMemo(() => {
    const all = state.grainSpawn.filter(gs => !gs.isArchived);
    const active = all.filter(gs => !['contaminated', 'expired', 'spawned_to_bulk'].includes(gs.status));
    const contaminated = all.filter(gs => gs.status === 'contaminated');
    const shakeReady = all.filter(gs => gs.status === 'shake_ready');
    const fullyColonized = all.filter(gs => gs.status === 'fully_colonized');

    // Calculate average colonization time for completed batches
    const completedBatches = all.filter(gs => gs.status === 'fully_colonized' && gs.fullyColonizedAt && gs.inoculatedAt);
    const avgColonizationDays = completedBatches.length > 0
      ? completedBatches.reduce((sum, gs) => sum + differenceInDays(gs.fullyColonizedAt!, gs.inoculatedAt), 0) / completedBatches.length
      : null;

    return {
      total: all.length,
      active: active.length,
      colonizing: all.filter(gs => ['inoculated', 'colonizing', 'shaken'].includes(gs.status)).length,
      shakeReady: shakeReady.length,
      ready: fullyColonized.length,
      contaminated: contaminated.length,
      avgColonizationDays,
      contaminationRate: all.length > 0 ? (contaminated.length / all.length) * 100 : 0,
    };
  }, [state.grainSpawn]);

  // Filter grain spawn
  const filteredSpawn = useMemo(() => {
    return state.grainSpawn.filter(gs => {
      if (gs.isArchived) return false;
      if (statusFilter !== 'all' && gs.status !== statusFilter) return false;
      if (searchTerm) {
        const strain = getStrain(gs.strainId);
        const searchLower = searchTerm.toLowerCase();
        const matchesLabel = gs.label?.toLowerCase().includes(searchLower);
        const matchesStrain = strain?.name.toLowerCase().includes(searchLower);
        const matchesNotes = gs.notes?.toLowerCase().includes(searchLower);
        if (!matchesLabel && !matchesStrain && !matchesNotes) return false;
      }
      return true;
    }).sort((a, b) => {
      // Sort by status priority, then by date
      const statusPriority: Record<GrainSpawnStatus, number> = {
        shake_ready: 0,
        fully_colonized: 1,
        colonizing: 2,
        shaken: 3,
        inoculated: 4,
        stalled: 5,
        contaminated: 6,
        spawned_to_bulk: 7,
        expired: 8,
      };
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.inoculatedAt).getTime() - new Date(a.inoculatedAt).getTime();
    });
  }, [state.grainSpawn, statusFilter, searchTerm, getStrain]);

  // Handle actions
  const handleOpenShakeModal = (spawn: GrainSpawn) => {
    setShakeModalSpawn(spawn);
    setSelectedSpawn(null);
  };

  const handleOpenSpawnToBulkModal = (spawn: GrainSpawn) => {
    setSpawnToBulkSpawn(spawn);
    setSelectedSpawn(null);
  };

  const handleMarkColonized = async (spawn: GrainSpawn) => {
    try {
      await markGrainSpawnFullyColonized(spawn.id);
    } catch (error) {
      console.error('Failed to mark as colonized:', error);
    }
  };

  const handleMarkContaminated = async (spawn: GrainSpawn, notes?: string) => {
    try {
      await markGrainSpawnContaminated(spawn.id, notes);
    } catch (error) {
      console.error('Failed to mark as contaminated:', error);
    }
  };

  // Render spawn card
  const renderSpawnCard = (spawn: GrainSpawn) => {
    const strain = getStrain(spawn.strainId);
    const location = spawn.locationId ? getLocation(spawn.locationId) : null;
    const grainType = spawn.grainTypeId ? getGrainType(spawn.grainTypeId) : null;
    const statusConfig = grainSpawnStatusConfig[spawn.status];
    const daysColonizing = differenceInDays(new Date(), spawn.inoculatedAt);

    return (
      <div
        key={spawn.id}
        className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 cursor-pointer transition-colors"
        onClick={() => setSelectedSpawn(spawn)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium text-zinc-100">
              {spawn.label || `Spawn ${spawn.id.slice(-6)}`}
            </h3>
            <p className="text-sm text-zinc-400">{strain?.name || 'Unknown Strain'}</p>
          </div>
          <span className={`px-2 py-1 text-xs rounded-md ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Progress */}
        <ColonizationProgress progress={spawn.colonizationProgress} status={spawn.status} />

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div>
            <span className="text-zinc-500">Age</span>
            <div className="text-zinc-300">{daysColonizing}d</div>
          </div>
          <div>
            <span className="text-zinc-500">Shakes</span>
            <div className="text-zinc-300">{spawn.shakeCount}</div>
          </div>
          {grainType && (
            <div>
              <span className="text-zinc-500">Grain</span>
              <div className="text-zinc-300 truncate">{grainType.name}</div>
            </div>
          )}
        </div>

        {/* Workflow indicator */}
        {spawn.workflowStage && (
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <WorkflowIndicator stage={spawn.workflowStage} />
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 mt-3">
          {spawn.status === 'shake_ready' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenShakeModal(spawn); }}
              className="flex-1 px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <Icons.Shake /> Shake
            </button>
          )}
          {spawn.status === 'fully_colonized' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenSpawnToBulkModal(spawn); }}
              className="flex-1 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <Icons.ArrowRight /> Spawn to Bulk
            </button>
          )}
          {['colonizing', 'shaken'].includes(spawn.status) && spawn.colonizationProgress >= 80 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleMarkColonized(spawn); }}
              className="flex-1 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <Icons.CheckCircle /> Mark Colonized
            </button>
          )}
        </div>

        {/* Location */}
        {location && (
          <div className="mt-2 text-xs text-zinc-500">
            {location.name}
          </div>
        )}
      </div>
    );
  };

  // Render list item
  const renderListItem = (spawn: GrainSpawn) => {
    const strain = getStrain(spawn.strainId);
    const statusConfig = grainSpawnStatusConfig[spawn.status];
    const daysColonizing = differenceInDays(new Date(), spawn.inoculatedAt);

    return (
      <div
        key={spawn.id}
        className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 cursor-pointer transition-colors"
        onClick={() => setSelectedSpawn(spawn)}
      >
        {/* Progress indicator */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg className="w-12 h-12 -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-zinc-800"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${spawn.colonizationProgress * 1.25} 125`}
              className={spawn.status === 'contaminated' ? 'text-red-500' : 'text-emerald-500'}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-zinc-300">
            {spawn.colonizationProgress}%
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-100 truncate">
              {spawn.label || `Spawn ${spawn.id.slice(-6)}`}
            </span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          <div className="text-sm text-zinc-400 truncate">
            {strain?.name || 'Unknown Strain'} • {daysColonizing} days
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {spawn.status === 'shake_ready' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenShakeModal(spawn); }}
              className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors"
            >
              Shake
            </button>
          )}
          {spawn.status === 'fully_colonized' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenSpawnToBulkModal(spawn); }}
              className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
            >
              Spawn to Bulk
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Grain Spawn</h1>
          <p className="text-zinc-400 mt-1">Prepare, sterilize, and track spawn through colonization</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPrepareModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
          >
            <Icons.Plus />
            <span>Prepare Spawn</span>
          </button>
          <button
            onClick={() => setShowInoculateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
          >
            <Icons.Plus />
            <span>Inoculate</span>
          </button>
        </div>
      </div>

      {/* Tabs: Prepared vs Inoculated */}
      <div className="flex gap-1 p-1 bg-zinc-800/50 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('prepared')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'prepared'
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Preparation ({preparedSpawnInProgress.length})
        </button>
        <button
          onClick={() => setActiveTab('inoculated')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'inoculated'
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Colonizing ({stats.active})
        </button>
      </div>

      {/* Prepared Tab Content */}
      {activeTab === 'prepared' && (
        <>
          {/* Prepared Spawn Workflow Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-400">
                {preparedSpawnInProgress.filter(ps => ps.status === 'preparing').length}
              </div>
              <div className="text-sm text-zinc-400">Preparing</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">
                {preparedSpawnInProgress.filter(ps => ps.status === 'sterilizing').length}
              </div>
              <div className="text-sm text-zinc-400">Sterilizing</div>
            </div>
            <div className="bg-zinc-900/50 border border-blue-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">
                {preparedSpawnInProgress.filter(ps => ps.status === 'cooling').length}
              </div>
              <div className="text-sm text-zinc-400">Cooling</div>
            </div>
            <div className="bg-zinc-900/50 border border-emerald-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-400">
                {preparedSpawnInProgress.filter(ps => ps.status === 'ready').length}
              </div>
              <div className="text-sm text-zinc-400">Ready to Inoculate</div>
            </div>
          </div>

          {/* Prepared Spawn List */}
          {preparedSpawnInProgress.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-zinc-300 mb-2">No Spawn in Preparation</h3>
              <p className="text-zinc-500 mb-4">Start by preparing grain jars or bags</p>
              <button
                onClick={() => setShowPrepareModal(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
              >
                Prepare Spawn
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {preparedSpawnInProgress.map(ps => {
                const statusConfig = preparedSpawnStatusConfig[ps.status];
                const container = state.containers.find(c => c.id === ps.containerId);
                const grainType = ps.grainTypeId ? state.grainTypes.find(g => g.id === ps.grainTypeId) : null;

                return (
                  <div
                    key={ps.id}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-zinc-100">
                          {ps.label || container?.name || 'Prepared Spawn'}
                        </h3>
                        <p className="text-sm text-zinc-400">
                          {grainType?.name || ps.type.replace('_', ' ')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 ${statusConfig.color}`}>
                        <span>{statusConfig.icon}</span>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      {ps.containerCount > 1 && (
                        <div className="flex justify-between text-zinc-400">
                          <span>Containers:</span>
                          <span className="text-zinc-200">{ps.containerCount}</span>
                        </div>
                      )}
                      {ps.weightGrams && (
                        <div className="flex justify-between text-zinc-400">
                          <span>Weight:</span>
                          <span className="text-zinc-200">{ps.weightGrams}g</span>
                        </div>
                      )}
                      <div className="flex justify-between text-zinc-400">
                        <span>Prepared:</span>
                        <span className="text-zinc-200">{format(ps.prepDate, 'MMM d')}</span>
                      </div>
                      {ps.currentTempC !== undefined && (
                        <div className="flex justify-between text-zinc-400">
                          <span>Temperature:</span>
                          <span className={`${ps.currentTempC <= (ps.targetTempC || 25) ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {ps.currentTempC}°C
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions based on status */}
                    <div className="flex gap-2 mt-4">
                      {ps.status === 'preparing' && (
                        <button
                          onClick={() => {/* Navigate to PC calculator */}}
                          className="flex-1 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
                        >
                          Start Sterilization
                        </button>
                      )}
                      {ps.status === 'cooling' && (
                        <button
                          onClick={() => setSelectedPreparedSpawn(ps)}
                          className="flex-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
                        >
                          Update Temperature
                        </button>
                      )}
                      {ps.status === 'ready' && (
                        <button
                          onClick={() => setShowInoculateModal(true)}
                          className="flex-1 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
                        >
                          Inoculate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Inoculated Tab Content */}
      {activeTab === 'inoculated' && (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
              <div className="text-sm text-zinc-400">Active Batches</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-cyan-400">{stats.colonizing}</div>
              <div className="text-sm text-zinc-400">Colonizing</div>
            </div>
            <div className={`bg-zinc-900/50 border rounded-lg p-4 ${stats.shakeReady > 0 ? 'border-amber-700' : 'border-zinc-800'}`}>
              <div className={`text-2xl font-bold ${stats.shakeReady > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>{stats.shakeReady}</div>
              <div className="text-sm text-zinc-400">Shake Ready</div>
            </div>
            <div className={`bg-zinc-900/50 border rounded-lg p-4 ${stats.ready > 0 ? 'border-emerald-700' : 'border-zinc-800'}`}>
              <div className={`text-2xl font-bold ${stats.ready > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>{stats.ready}</div>
              <div className="text-sm text-zinc-400">Ready to Spawn</div>
            </div>
          </div>

          {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <Icons.Search />
          </div>
          <input
            type="text"
            placeholder="Search by label, strain, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <Icons.X />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as GrainSpawnStatus | 'all')}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
        >
          <option value="all">All Statuses</option>
          {Object.entries(grainSpawnStatusConfig).map(([status, config]) => (
            <option key={status} value={status}>{config.label}</option>
          ))}
        </select>

        {/* View Toggle */}
        <div className="flex border border-zinc-800 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-zinc-800 text-emerald-400' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-300'}`}
          >
            <Icons.Grid />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-zinc-800 text-emerald-400' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-300'}`}
          >
            <Icons.List />
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredSpawn.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌾</div>
          <h3 className="text-lg font-medium text-zinc-300 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No matching grain spawn' : 'No grain spawn yet'}
          </h3>
          <p className="text-zinc-500 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Inoculate prepared spawn to start tracking colonization'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setShowInoculateModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              Inoculate First Batch
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSpawn.map(renderSpawnCard)}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSpawn.map(renderListItem)}
        </div>
      )}

      {/* Stats footer */}
      {stats.total > 0 && (
        <div className="flex items-center justify-center gap-6 text-sm text-zinc-500 py-4">
          {stats.avgColonizationDays !== null && (
            <span>Avg. colonization: {Math.round(stats.avgColonizationDays)} days</span>
          )}
          {stats.contaminationRate > 0 && (
            <span className="text-red-400">
              Contamination rate: {stats.contaminationRate.toFixed(1)}%
            </span>
          )}
        </div>
      )}
        </>
      )}

      {/* Detail Modal */}
      {selectedSpawn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-100">
                {selectedSpawn.label || 'Grain Spawn Details'}
              </h2>
              <button
                onClick={() => setSelectedSpawn(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <Icons.X />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Status</span>
                  <div className={`mt-1 px-2 py-1 rounded-md inline-block ${grainSpawnStatusConfig[selectedSpawn.status].color}`}>
                    {grainSpawnStatusConfig[selectedSpawn.status].label}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500">Progress</span>
                  <div className="mt-1 text-zinc-100">{selectedSpawn.colonizationProgress}%</div>
                </div>
                <div>
                  <span className="text-zinc-500">Inoculated</span>
                  <div className="mt-1 text-zinc-100">{format(selectedSpawn.inoculatedAt, 'MMM d, yyyy')}</div>
                </div>
                <div>
                  <span className="text-zinc-500">Shakes</span>
                  <div className="mt-1 text-zinc-100">{selectedSpawn.shakeCount}</div>
                </div>
              </div>
              <ColonizationProgress progress={selectedSpawn.colonizationProgress} status={selectedSpawn.status} />
              {selectedSpawn.notes && (
                <div>
                  <span className="text-zinc-500 text-sm">Notes</span>
                  <p className="mt-1 text-zinc-300 text-sm">{selectedSpawn.notes}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              {selectedSpawn.status === 'shake_ready' && (
                <button
                  onClick={() => handleOpenShakeModal(selectedSpawn)}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
                >
                  Break & Shake
                </button>
              )}
              {selectedSpawn.status === 'fully_colonized' && (
                <button
                  onClick={() => handleOpenSpawnToBulkModal(selectedSpawn)}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Spawn to Bulk
                </button>
              )}
              {!['contaminated', 'spawned_to_bulk', 'expired'].includes(selectedSpawn.status) && (
                <button
                  onClick={() => { handleMarkContaminated(selectedSpawn); setSelectedSpawn(null); }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  Mark Contaminated
                </button>
              )}
              <button
                onClick={() => setSelectedSpawn(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <InoculateToGrainModal
        isOpen={showInoculateModal}
        onClose={() => setShowInoculateModal(false)}
      />

      {shakeModalSpawn && (
        <ShakeModal
          isOpen={!!shakeModalSpawn}
          onClose={() => setShakeModalSpawn(null)}
          grainSpawn={shakeModalSpawn}
        />
      )}

      {spawnToBulkSpawn && (
        <SpawnToBulkModal
          isOpen={!!spawnToBulkSpawn}
          onClose={() => setSpawnToBulkSpawn(null)}
          initialGrainSpawn={spawnToBulkSpawn}
        />
      )}

      <PrepareSpawnForm
        isOpen={showPrepareModal}
        onClose={() => setShowPrepareModal(false)}
      />
    </div>
  );
};
