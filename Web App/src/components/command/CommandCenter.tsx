// ============================================================================
// COMMAND CENTER - Unified Daily Operations Hub
// Consolidates: Today View + Daily Check + Harvest Workflow
// The mycologist's daily cockpit for lab operations
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../store';
import type { Grow, Culture, Location, Flush } from '../../store/types';
import { format, differenceInDays, addDays } from 'date-fns';
import { NumericInput } from '../common/NumericInput';
import { HarvestEntryForm, getDefaultHarvestEntryData, type HarvestEntryData } from '../forms/HarvestEntryForm';
import { RoomCheckForm } from '../forms/RoomCheckForm';

// ============================================================================
// TYPES
// ============================================================================

type CommandMode = 'overview' | 'walkthrough' | 'harvest';

interface Task {
  id: string;
  type: 'culture' | 'grow' | 'room' | 'harvest';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  subtitle?: string;
  entityId?: string;
  locationId?: string;
  action?: string;
  dueInfo?: string;
}

interface RoomStatus {
  locationId: string;
  locationName: string;
  checked: boolean;
  needsAttention: boolean;
  attentionReason?: string;
  harvestEstimate?: number;
  notes?: string;
  growCount: number;
  fruitingCount: number;
}

// HarvestEntry extends HarvestEntryData with growId for tracking which grow
interface HarvestEntry extends HarvestEntryData {
  growId: string;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Scale: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Mushroom: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M12 2C7 2 3 6 3 11h18c0-5-4-9-9-9z"/>
      <path d="M9 11v9a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-9"/>
    </svg>
  ),
  Droplet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  Wind: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
    </svg>
  ),
  Thermometer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getPriorityColor = (priority: Task['priority']) => {
  switch (priority) {
    case 'urgent': return 'text-red-400 bg-red-950/50 border-red-800';
    case 'high': return 'text-amber-400 bg-amber-950/50 border-amber-800';
    case 'medium': return 'text-blue-400 bg-blue-950/50 border-blue-800';
    default: return 'text-zinc-400 bg-zinc-800/50 border-zinc-700';
  }
};

const getStorageKey = () => `mycolab-command-${format(new Date(), 'yyyy-MM-dd')}`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CommandCenter: React.FC = () => {
  const { state, getStrain, getLocation, addFlush } = useData();
  const { cultures, grows, locations } = state;

  // Mode selection
  const [mode, setMode] = useState<CommandMode>('overview');

  // Task completion tracking (session-based)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Room walkthrough state
  const [roomStatuses, setRoomStatuses] = useState<Record<string, RoomStatus>>({});
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // Harvest state
  const [selectedGrowForHarvest, setSelectedGrowForHarvest] = useState<Grow | null>(null);
  const [harvestEntry, setHarvestEntry] = useState<HarvestEntry>({
    growId: '',
    wetWeight: 0,
    quality: 'good',
  });

  // Load persisted room statuses
  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey());
    if (stored) {
      try {
        setRoomStatuses(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load room statuses:', e);
      }
    }
  }, []);

  // Save room statuses when they change
  useEffect(() => {
    if (Object.keys(roomStatuses).length > 0) {
      localStorage.setItem(getStorageKey(), JSON.stringify(roomStatuses));
    }
  }, [roomStatuses]);

  // ============================================================================
  // COMPUTED DATA
  // ============================================================================

  // Active cultures and grows
  const activeCultures = useMemo(() =>
    cultures.filter(c => c.status === 'active' || c.status === 'colonizing'),
    [cultures]
  );

  const activeGrows = useMemo(() =>
    grows.filter(g => g.status === 'active'),
    [grows]
  );

  const fruitingGrows = useMemo(() =>
    activeGrows.filter(g => g.currentStage === 'fruiting' || g.currentStage === 'harvesting'),
    [activeGrows]
  );

  // Generate tasks from cultures and grows
  const tasks = useMemo((): Task[] => {
    const taskList: Task[] = [];
    const now = new Date();

    // Culture tasks
    activeCultures.forEach(culture => {
      const strain = getStrain(culture.strainId);
      const location = getLocation(culture.locationId);
      const daysSinceCreation = differenceInDays(now, new Date(culture.createdAt));

      // Check readiness based on strain colonization time
      if (strain && culture.status === 'colonizing') {
        const expectedDays = strain.colonizationDays
          ? (strain.colonizationDays.min + strain.colonizationDays.max) / 2
          : 14; // Default to 14 days if not specified
        const daysRemaining = Math.ceil(expectedDays - daysSinceCreation);

        if (daysRemaining <= 0) {
          taskList.push({
            id: `culture-ready-${culture.id}`,
            type: 'culture',
            priority: 'high',
            title: `${culture.label} may be ready`,
            subtitle: `${strain.name} - Check colonization`,
            entityId: culture.id,
            locationId: culture.locationId,
            action: 'Check & transfer',
            dueInfo: location?.name,
          });
        } else if (daysRemaining <= 3) {
          taskList.push({
            id: `culture-soon-${culture.id}`,
            type: 'culture',
            priority: 'medium',
            title: `${culture.label} nearing ready`,
            subtitle: `${strain.name} - ~${daysRemaining} days left`,
            entityId: culture.id,
            locationId: culture.locationId,
            dueInfo: location?.name,
          });
        }
      }

      // Health check for older cultures
      if (culture.healthRating && culture.healthRating <= 2 && daysSinceCreation > 7) {
        taskList.push({
          id: `culture-health-${culture.id}`,
          type: 'culture',
          priority: 'urgent',
          title: `${culture.label} health concern`,
          subtitle: `Health rating: ${culture.healthRating}/5`,
          entityId: culture.id,
          action: 'Inspect for contamination',
        });
      }
    });

    // Grow tasks
    activeGrows.forEach(grow => {
      const strain = getStrain(grow.strainId);
      const location = getLocation(grow.locationId);
      const daysSinceSpawn = grow.spawnedAt ? differenceInDays(now, new Date(grow.spawnedAt)) : 0;

      // Fruiting/harvesting grows need daily attention
      if (grow.currentStage === 'fruiting' || grow.currentStage === 'harvesting') {
        taskList.push({
          id: `grow-fae-${grow.id}`,
          type: 'grow',
          priority: grow.currentStage === 'harvesting' ? 'urgent' : 'high',
          title: grow.currentStage === 'harvesting'
            ? `🍄 ${grow.name} - Harvest ready!`
            : `${grow.name} - FAE & misting`,
          subtitle: strain?.name,
          entityId: grow.id,
          locationId: grow.locationId,
          action: grow.currentStage === 'harvesting' ? 'Record harvest' : 'Check pins',
          dueInfo: location?.name,
        });
      }

      // Colonization check
      if (grow.currentStage === 'colonization' && strain) {
        const expectedDays = strain.colonizationDays
          ? (strain.colonizationDays.min + strain.colonizationDays.max) / 2
          : 14; // Default to 14 days if not specified
        const daysSinceColonization = grow.colonizationStartedAt
          ? differenceInDays(now, new Date(grow.colonizationStartedAt))
          : daysSinceSpawn;
        const daysRemaining = Math.ceil(expectedDays - daysSinceColonization);

        if (daysRemaining <= 0) {
          taskList.push({
            id: `grow-ready-${grow.id}`,
            type: 'grow',
            priority: 'high',
            title: `${grow.name} ready for fruiting?`,
            subtitle: `${strain.name} - Check colonization %`,
            entityId: grow.id,
            locationId: grow.locationId,
            action: 'Inspect & introduce to fruiting',
            dueInfo: location?.name,
          });
        }
      }
    });

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return taskList.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [activeCultures, activeGrows, getStrain, getLocation]);

  // Filter out completed tasks
  const pendingTasks = useMemo(() =>
    tasks.filter(t => !completedTasks.has(t.id)),
    [tasks, completedTasks]
  );

  const urgentCount = useMemo(() =>
    pendingTasks.filter(t => t.priority === 'urgent').length,
    [pendingTasks]
  );

  // Room data for walkthrough
  const rooms = useMemo((): RoomStatus[] => {
    const roomMap = new Map<string, RoomStatus>();

    // Initialize rooms from locations
    locations.filter(l => l.isActive).forEach(loc => {
      roomMap.set(loc.id, {
        locationId: loc.id,
        locationName: loc.name,
        checked: roomStatuses[loc.id]?.checked || false,
        needsAttention: roomStatuses[loc.id]?.needsAttention || false,
        attentionReason: roomStatuses[loc.id]?.attentionReason,
        harvestEstimate: roomStatuses[loc.id]?.harvestEstimate,
        notes: roomStatuses[loc.id]?.notes,
        growCount: 0,
        fruitingCount: 0,
      });
    });

    // Count grows per room
    activeGrows.forEach(grow => {
      if (grow.locationId && roomMap.has(grow.locationId)) {
        const room = roomMap.get(grow.locationId)!;
        room.growCount++;
        if (grow.currentStage === 'fruiting' || grow.currentStage === 'harvesting') {
          room.fruitingCount++;
        }
      }
    });

    return Array.from(roomMap.values()).filter(r => r.growCount > 0 || r.fruitingCount > 0);
  }, [locations, activeGrows, roomStatuses]);

  const roomsChecked = rooms.filter(r => r.checked).length;
  const roomsNeedingAttention = rooms.filter(r => r.needsAttention).length;

  // Harvestable grows
  const harvestableGrows = useMemo(() =>
    activeGrows.filter(g => g.currentStage === 'fruiting' || g.currentStage === 'harvesting'),
    [activeGrows]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleTaskComplete = (taskId: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const updateRoomStatus = (roomId: string, updates: Partial<RoomStatus>) => {
    setRoomStatuses(prev => ({
      ...prev,
      [roomId]: { ...prev[roomId], ...updates },
    }));
  };

  // Harvest submission state
  const [isSubmittingHarvest, setIsSubmittingHarvest] = useState(false);
  const [harvestError, setHarvestError] = useState<string | null>(null);

  const handleHarvestSubmit = async () => {
    if (!selectedGrowForHarvest || harvestEntry.wetWeight <= 0) return;

    setIsSubmittingHarvest(true);
    setHarvestError(null);

    try {
      await addFlush(selectedGrowForHarvest.id, {
        harvestDate: new Date(),
        wetWeight: harvestEntry.wetWeight,
        dryWeight: harvestEntry.dryWeight ?? 0,
        mushroomCount: harvestEntry.mushroomCount,
        quality: harvestEntry.quality,
        notes: harvestEntry.notes,
      });

      // Success - reset and go back to harvest list
      setSelectedGrowForHarvest(null);
      setHarvestEntry({ growId: '', wetWeight: 0, quality: 'good' });
    } catch (e: any) {
      console.error('Failed to record harvest:', e);
      const message = e?.message || e?.error?.message || 'Failed to save harvest. Please try again.';
      setHarvestError(message);
    } finally {
      setIsSubmittingHarvest(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Greeting */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Icons.Mushroom />
                Command Center
              </h1>
              <p className="text-zinc-400 text-sm">{getGreeting()}, cultivator</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">{format(new Date(), 'EEEE, MMM d')}</p>
              {urgentCount > 0 && (
                <p className="text-red-400 text-sm font-medium">{urgentCount} urgent</p>
              )}
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'overview' as CommandMode, icon: Icons.Sun, label: 'Today', badge: pendingTasks.length },
              { id: 'walkthrough' as CommandMode, icon: Icons.MapPin, label: 'Room Walk', badge: rooms.length > 0 ? `${roomsChecked}/${rooms.length}` : null },
              { id: 'harvest' as CommandMode, icon: Icons.Scale, label: 'Harvest', badge: harvestableGrows.length || null },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:bg-zinc-800'
                }`}
              >
                <tab.icon />
                {tab.label}
                {tab.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    mode === tab.id ? 'bg-emerald-500/30' : 'bg-zinc-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ========== OVERVIEW MODE ========== */}
        {mode === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Cultures', value: activeCultures.length, icon: Icons.Droplet, color: 'text-blue-400' },
                { label: 'Grows', value: activeGrows.length, icon: Icons.Mushroom, color: 'text-emerald-400' },
                { label: 'Fruiting', value: fruitingGrows.length, icon: Icons.Wind, color: 'text-amber-400' },
                { label: 'Urgent', value: urgentCount, icon: Icons.AlertTriangle, color: urgentCount > 0 ? 'text-red-400' : 'text-zinc-500' },
              ].map(stat => (
                <div key={stat.label} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
                  <div className={`flex justify-center mb-1 ${stat.color}`}>
                    <stat.icon />
                  </div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Task List */}
            {pendingTasks.length > 0 ? (
              <div className="space-y-2">
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                  Today's Tasks ({pendingTasks.length})
                </h2>
                {pendingTasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      getPriorityColor(task.priority)
                    }`}
                  >
                    <button
                      onClick={() => toggleTaskComplete(task.id)}
                      className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0 hover:bg-current/20 transition-colors"
                    >
                      {completedTasks.has(task.id) && <Icons.Check />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{task.title}</p>
                      {task.subtitle && (
                        <p className="text-sm text-zinc-400 truncate">{task.subtitle}</p>
                      )}
                    </div>
                    {task.dueInfo && (
                      <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                        {task.dueInfo}
                      </span>
                    )}
                    {task.action && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle different actions
                          if (task.action === 'Record harvest' && task.entityId) {
                            const grow = grows.find(g => g.id === task.entityId);
                            if (grow) {
                              setSelectedGrowForHarvest(grow);
                              setHarvestEntry({ growId: grow.id, wetWeight: 0, quality: 'good' });
                              setMode('harvest');
                            }
                          }
                          // Mark task as completed after action
                          toggleTaskComplete(task.id);
                        }}
                        className="text-xs px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                      >
                        {task.action}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-zinc-900/30 rounded-xl border border-zinc-800">
                <Icons.Check />
                <p className="text-lg font-medium text-emerald-400 mt-2">All caught up! 🍄</p>
                <p className="text-sm text-zinc-500 mt-1">No urgent tasks right now</p>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.size > 0 && (
              <div className="pt-4 border-t border-zinc-800">
                <p className="text-sm text-zinc-500">
                  ✓ {completedTasks.size} task{completedTasks.size > 1 ? 's' : ''} completed today
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========== ROOM WALKTHROUGH MODE ========== */}
        {mode === 'walkthrough' && (
          <div className="space-y-4">
            {!selectedRoom ? (
              <>
                {/* Room Overview */}
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                    Room Walkthrough
                  </h2>
                  <span className="text-sm text-zinc-500">
                    {roomsChecked}/{rooms.length} checked
                    {roomsNeedingAttention > 0 && (
                      <span className="text-amber-400 ml-2">
                        • {roomsNeedingAttention} need attention
                      </span>
                    )}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: rooms.length > 0 ? `${(roomsChecked / rooms.length) * 100}%` : '0%' }}
                  />
                </div>

                {/* Room Cards */}
                {rooms.length > 0 ? (
                  <div className="grid gap-3">
                    {rooms.map(room => (
                      <button
                        key={room.locationId}
                        onClick={() => setSelectedRoom(room.locationId)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          room.checked
                            ? room.needsAttention
                              ? 'bg-amber-950/30 border-amber-800'
                              : 'bg-emerald-950/30 border-emerald-800'
                            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              room.checked
                                ? room.needsAttention ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {room.checked ? (room.needsAttention ? <Icons.AlertTriangle /> : <Icons.Check />) : <Icons.MapPin />}
                            </div>
                            <div>
                              <p className="font-medium text-white">{room.locationName}</p>
                              <p className="text-sm text-zinc-400">
                                {room.growCount} grow{room.growCount !== 1 ? 's' : ''}
                                {room.fruitingCount > 0 && (
                                  <span className="text-amber-400 ml-2">
                                    • {room.fruitingCount} fruiting
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <Icons.ChevronRight />
                        </div>
                        {room.harvestEstimate && room.harvestEstimate > 0 && (
                          <p className="text-xs text-emerald-400 mt-2">
                            ~{room.harvestEstimate}g estimated harvest
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-zinc-900/30 rounded-xl border border-zinc-800">
                    <Icons.MapPin />
                    <p className="text-lg font-medium text-zinc-400 mt-2">No active rooms</p>
                    <p className="text-sm text-zinc-500 mt-1">Start some grows to see them here</p>
                  </div>
                )}
              </>
            ) : (
              /* Room Detail View */
              <RoomDetailView
                room={rooms.find(r => r.locationId === selectedRoom)!}
                grows={activeGrows.filter(g => g.locationId === selectedRoom)}
                onBack={() => setSelectedRoom(null)}
                onUpdate={(updates) => updateRoomStatus(selectedRoom, updates)}
                getStrain={getStrain}
              />
            )}
          </div>
        )}

        {/* ========== HARVEST MODE ========== */}
        {mode === 'harvest' && (
          <div className="space-y-4">
            {!selectedGrowForHarvest ? (
              <>
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                  Ready to Harvest ({harvestableGrows.length})
                </h2>

                {harvestableGrows.length > 0 ? (
                  <div className="grid gap-3">
                    {harvestableGrows.map(grow => {
                      const strain = getStrain(grow.strainId);
                      const location = getLocation(grow.locationId);
                      return (
                        <button
                          key={grow.id}
                          onClick={() => {
                            setSelectedGrowForHarvest(grow);
                            setHarvestEntry({ growId: grow.id, wetWeight: 0, quality: 'good' });
                          }}
                          className="w-full text-left p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:border-emerald-800 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-white">{grow.name}</p>
                              <p className="text-sm text-zinc-400">{strain?.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-zinc-500">{location?.name}</p>
                              <p className="text-sm text-amber-400">
                                {grow.flushes.length > 0
                                  ? `Flush ${grow.flushes.length + 1}`
                                  : 'First harvest'
                                }
                              </p>
                            </div>
                          </div>
                          {grow.totalYield > 0 && (
                            <p className="text-xs text-emerald-400 mt-2">
                              Total yield so far: {grow.totalYield}g wet
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-zinc-900/30 rounded-xl border border-zinc-800">
                    <Icons.Scale />
                    <p className="text-lg font-medium text-zinc-400 mt-2">Nothing ready yet</p>
                    <p className="text-sm text-zinc-500 mt-1">Grows in fruiting stage will appear here</p>
                  </div>
                )}
              </>
            ) : (
              /* Harvest Entry Form - Uses canonical form */
              <HarvestEntryForm
                grow={selectedGrowForHarvest}
                strainName={getStrain(selectedGrowForHarvest.strainId)?.name}
                data={harvestEntry}
                onChange={(updates) => setHarvestEntry(prev => ({ ...prev, ...updates }))}
                onSubmit={handleHarvestSubmit}
                onCancel={() => { setSelectedGrowForHarvest(null); setHarvestError(null); }}
                isLoading={isSubmittingHarvest}
                error={harvestError}
                showHeader={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface RoomDetailViewProps {
  room: RoomStatus;
  grows: Grow[];
  onBack: () => void;
  onUpdate: (updates: Partial<RoomStatus>) => void;
  getStrain: (id: string) => any;
}

const RoomDetailView: React.FC<RoomDetailViewProps> = ({
  room, grows, onBack, onUpdate, getStrain
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
        >
          ←
        </button>
        <div>
          <h2 className="text-lg font-semibold text-white">{room.locationName}</h2>
          <p className="text-sm text-zinc-400">{grows.length} active grow{grows.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Grows in this room */}
      <div className="space-y-2">
        {grows.map(grow => {
          const strain = getStrain(grow.strainId);
          return (
            <div key={grow.id} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{grow.name}</p>
                  <p className="text-sm text-zinc-400">{strain?.name}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  grow.currentStage === 'harvesting' ? 'bg-amber-500/20 text-amber-400' :
                  grow.currentStage === 'fruiting' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {grow.currentStage}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Canonical Room Check Form */}
      <div className="pt-4 border-t border-zinc-800">
        <RoomCheckForm
          data={{
            checked: room.checked,
            needsAttention: room.needsAttention,
            attentionReason: room.attentionReason || '',
            harvestEstimate: room.harvestEstimate || 0,
            notes: room.notes || '',
          }}
          onChange={(updates) => onUpdate(updates)}
          completeButtonLabel={room.checked ? '✓ Room Checked' : 'Mark Room Checked'}
          compact
        />
      </div>
    </div>
  );
};

// HarvestEntryForm is now imported from '../forms/HarvestEntryForm' (canonical form)

export default CommandCenter;
