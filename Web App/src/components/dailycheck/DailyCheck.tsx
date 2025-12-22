// ============================================================================
// DAILY CHECK - Growing Room Daily Rounds Workflow (dev-040)
// Mobile-friendly workflow for daily room checks with harvest estimates
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../store';
import { RoomCheckForm, type RoomCheckFormData } from '../forms/RoomCheckForm';
import type { Grow, GrowStage, Location } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface RoomCheckData {
  locationId: string;
  checked: boolean;
  needsAttention: boolean;
  attentionReason: string;
  harvestEstimate: number; // grams for next 7 days
  notes: string;
  checkTime?: Date;
}

interface DailyCheckSession {
  id: string;
  date: Date;
  roomChecks: RoomCheckData[];
  completedAt?: Date;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="20 6 9 17 4 12"/></svg>,
  Flag: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="15 18 9 12 15 6"/></svg>,
  Clipboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  Scale: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13"/></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Mushroom: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 2L12 22"/><path d="M17 7C17 7 13 9 12 14"/><path d="M7 7C7 7 11 9 12 14"/></svg>,
  RefreshCw: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

// Stage configurations
const stageConfig: Record<GrowStage, { label: string; icon: string; color: string; harvestDays?: number }> = {
  spawning: { label: 'Spawning', icon: '🌱', color: 'text-purple-400 bg-purple-950/50' },
  colonization: { label: 'Colonizing', icon: '🔵', color: 'text-blue-400 bg-blue-950/50' },
  fruiting: { label: 'Fruiting', icon: '🍄', color: 'text-emerald-400 bg-emerald-950/50', harvestDays: 7 },
  harvesting: { label: 'Harvesting', icon: '✂️', color: 'text-amber-400 bg-amber-950/50', harvestDays: 3 },
  completed: { label: 'Completed', icon: '✅', color: 'text-green-400 bg-green-950/50' },
  contaminated: { label: 'Contaminated', icon: '☠️', color: 'text-red-400 bg-red-950/50' },
  aborted: { label: 'Aborted', icon: '⛔', color: 'text-zinc-400 bg-zinc-800' },
};

// Local storage key
const DAILY_CHECK_STORAGE_KEY = 'mycolab-daily-check';

// ============================================================================
// COMPONENTS
// ============================================================================

const RoomCard: React.FC<{
  location: Location;
  grows: Grow[];
  checkData: RoomCheckData;
  onUpdate: (data: Partial<RoomCheckData>) => void;
  onSelect: () => void;
  isActive: boolean;
}> = ({ location, grows, checkData, onUpdate, onSelect, isActive }) => {
  const activeGrows = grows.filter(g => g.status === 'active');
  const fruitingGrows = grows.filter(g => ['fruiting', 'harvesting'].includes(g.currentStage));

  // Calculate estimated harvest based on substrate weight and typical BE%
  const estimatedHarvest = useMemo(() => {
    return fruitingGrows.reduce((total, grow) => {
      // Estimate ~50% BE for fruiting grows, less for those just entering fruiting
      const daysInStage = Math.floor((Date.now() - new Date(grow.fruitingStartedAt || grow.spawnedAt).getTime()) / (1000 * 60 * 60 * 24));
      const multiplier = grow.currentStage === 'harvesting' ? 0.5 : (daysInStage > 5 ? 0.3 : 0.1);
      return total + (grow.substrateWeight * multiplier);
    }, 0);
  }, [fruitingGrows]);

  return (
    <div
      className={`bg-zinc-900/50 border rounded-xl p-4 cursor-pointer transition-all ${
        isActive ? 'border-emerald-500 ring-2 ring-emerald-500/30' :
        checkData.checked ? 'border-emerald-600/50' :
        checkData.needsAttention ? 'border-amber-500' : 'border-zinc-800'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            checkData.checked ? 'bg-emerald-500/20 text-emerald-400' :
            checkData.needsAttention ? 'bg-amber-500/20 text-amber-400' :
            'bg-zinc-800 text-zinc-400'
          }`}>
            {checkData.checked ? <Icons.Check /> : <Icons.Home />}
          </div>
          <div>
            <h3 className="font-semibold text-white">{location.name}</h3>
            <p className="text-xs text-zinc-500">{location.code || location.path}</p>
          </div>
        </div>
        {checkData.needsAttention && (
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
            <Icons.AlertTriangle />
            Attention
          </span>
        )}
      </div>

      {/* Room Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
          <p className="text-xs text-zinc-500">Active</p>
          <p className="text-lg font-bold text-white">{activeGrows.length}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
          <p className="text-xs text-zinc-500">Fruiting</p>
          <p className="text-lg font-bold text-emerald-400">{fruitingGrows.length}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
          <p className="text-xs text-zinc-500">Est. Harvest</p>
          <p className="text-lg font-bold text-amber-400">{Math.round(estimatedHarvest)}g</p>
        </div>
      </div>

      {/* Quick Status */}
      {activeGrows.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(stageConfig).map(([stage, config]) => {
            const count = grows.filter(g => g.currentStage === stage).length;
            if (count === 0) return null;
            return (
              <span key={stage} className={`px-2 py-0.5 rounded text-xs ${config.color}`}>
                {config.icon} {count}
              </span>
            );
          })}
        </div>
      )}

      {checkData.checkTime && (
        <p className="text-xs text-zinc-600 mt-2">
          Checked {new Date(checkData.checkTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
};

const RoomDetailView: React.FC<{
  location: Location;
  grows: Grow[];
  checkData: RoomCheckData;
  onUpdate: (data: Partial<RoomCheckData>) => void;
  onComplete: () => void;
  onBack: () => void;
  getStrain: (id: string) => { name: string } | undefined;
}> = ({ location, grows, checkData, onUpdate, onComplete, onBack, getStrain }) => {
  const activeGrows = grows.filter(g => g.status === 'active');

  const handleMarkComplete = () => {
    onUpdate({ checked: true, checkTime: new Date() });
    onComplete();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <Icons.ChevronLeft />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{location.name}</h2>
          <p className="text-sm text-zinc-500">{location.code || location.path}</p>
        </div>
        {checkData.checked && (
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm flex items-center gap-1">
            <Icons.Check /> Checked
          </span>
        )}
      </div>

      {/* Active Grows List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Active Grows ({activeGrows.length})</h3>
        {activeGrows.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-4">No active grows in this room</p>
        ) : (
          <div className="space-y-2">
            {activeGrows.map(grow => {
              const strain = getStrain(grow.strainId);
              const config = stageConfig[grow.currentStage];
              const daysInStage = Math.floor((Date.now() - new Date(grow.fruitingStartedAt || grow.colonizationStartedAt || grow.spawnedAt).getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div key={grow.id} className="bg-zinc-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-white">{grow.name}</p>
                      <p className="text-xs text-zinc-500">{strain?.name || 'Unknown Strain'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${config.color}`}>
                      {config.icon} {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>Day {daysInStage} in stage</span>
                    <span>{grow.containerCount} container{grow.containerCount !== 1 ? 's' : ''}</span>
                    <span>{grow.substrateWeight}g substrate</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Canonical Room Check Form */}
      <RoomCheckForm
        data={{
          checked: checkData.checked,
          checkTime: checkData.checkTime,
          needsAttention: checkData.needsAttention,
          attentionReason: checkData.attentionReason,
          harvestEstimate: checkData.harvestEstimate,
          notes: checkData.notes,
        }}
        onChange={(updates) => onUpdate(updates)}
        onComplete={handleMarkComplete}
        completeButtonLabel={checkData.checked ? 'Update & Continue' : 'Mark Complete'}
      />
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const DailyCheck: React.FC = () => {
  const { state, getStrain, getLocation } = useData();
  const grows = state.grows;
  const locations = state.locations;

  // Get fruiting/growing rooms only (supports multi-purpose rooms)
  const growingRooms = useMemo(() => {
    const growingPurposes = ['fruiting', 'colonization', 'inoculation'];
    return locations.filter(loc => {
      if (!loc.isActive) return false;
      if (loc.level !== 'room' && !loc.roomPurpose && !loc.roomPurposes?.length) return false;

      // Check new roomPurposes array (if any purpose matches growing criteria)
      if (loc.roomPurposes?.some(p => growingPurposes.includes(p))) {
        return true;
      }

      // Fall back to legacy roomPurpose field for backwards compatibility
      return growingPurposes.includes(loc.roomPurpose || '');
    });
  }, [locations]);

  // Initialize check data
  const [checkData, setCheckData] = useState<Record<string, RoomCheckData>>(() => {
    const saved = localStorage.getItem(DAILY_CHECK_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const today = new Date().toDateString();
        if (parsed.date === today) {
          return parsed.data;
        }
      } catch (e) {}
    }
    // Initialize empty check data for each room
    const initial: Record<string, RoomCheckData> = {};
    growingRooms.forEach(room => {
      initial[room.id] = {
        locationId: room.id,
        checked: false,
        needsAttention: false,
        attentionReason: '',
        harvestEstimate: 0,
        notes: '',
      };
    });
    return initial;
  });

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [view, setView] = useState<'overview' | 'detail'>('overview');

  // Save to localStorage
  useEffect(() => {
    const data = {
      date: new Date().toDateString(),
      data: checkData,
    };
    localStorage.setItem(DAILY_CHECK_STORAGE_KEY, JSON.stringify(data));
  }, [checkData]);

  // Update check data for a room
  const updateRoomCheck = (roomId: string, data: Partial<RoomCheckData>) => {
    setCheckData(prev => ({
      ...prev,
      [roomId]: { ...prev[roomId], ...data },
    }));
  };

  // Get grows for a specific room
  const getGrowsForRoom = (roomId: string) => {
    return grows.filter(g => g.locationId === roomId && g.status === 'active');
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const checkedCount = Object.values(checkData).filter(c => c.checked).length;
    const needsAttention = Object.values(checkData).filter(c => c.needsAttention).length;
    const totalHarvest = Object.values(checkData).reduce((sum, c) => sum + (c.harvestEstimate || 0), 0);
    return { checkedCount, needsAttention, totalHarvest, totalRooms: growingRooms.length };
  }, [checkData, growingRooms]);

  // Reset daily check
  const resetCheck = () => {
    const initial: Record<string, RoomCheckData> = {};
    growingRooms.forEach(room => {
      initial[room.id] = {
        locationId: room.id,
        checked: false,
        needsAttention: false,
        attentionReason: '',
        harvestEstimate: 0,
        notes: '',
      };
    });
    setCheckData(initial);
    setSelectedRoomId(null);
    setView('overview');
  };

  // Handle room selection
  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setView('detail');
  };

  // Handle completing a room check
  const handleCompleteRoom = () => {
    // Find next unchecked room
    const uncheckedRoom = growingRooms.find(room => !checkData[room.id]?.checked);
    if (uncheckedRoom) {
      setSelectedRoomId(uncheckedRoom.id);
    } else {
      setView('overview');
      setSelectedRoomId(null);
    }
  };

  const selectedRoom = selectedRoomId ? getLocation(selectedRoomId) : null;

  return (
    <div className="max-w-4xl mx-auto">
      {view === 'overview' ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Daily Room Check</h1>
              <p className="text-zinc-400 text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={resetCheck}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Reset daily check"
            >
              <Icons.RefreshCw />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500">Progress</p>
              <p className="text-2xl font-bold text-white">
                {summaryStats.checkedCount}/{summaryStats.totalRooms}
              </p>
              <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${summaryStats.totalRooms > 0 ? (summaryStats.checkedCount / summaryStats.totalRooms) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500">Needs Attention</p>
              <p className={`text-2xl font-bold ${summaryStats.needsAttention > 0 ? 'text-amber-400' : 'text-white'}`}>
                {summaryStats.needsAttention}
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500">7-Day Harvest Est.</p>
              <p className="text-2xl font-bold text-emerald-400">{summaryStats.totalHarvest}g</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500">Active Grows</p>
              <p className="text-2xl font-bold text-blue-400">
                {grows.filter(g => g.status === 'active').length}
              </p>
            </div>
          </div>

          {/* Room Grid */}
          {growingRooms.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                <Icons.Home />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Growing Rooms Found</h3>
              <p className="text-zinc-400 max-w-md mx-auto">
                Set up your lab locations with room purposes like "fruiting" or "colonization" to use the daily check feature.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {growingRooms.map(room => (
                <RoomCard
                  key={room.id}
                  location={room}
                  grows={getGrowsForRoom(room.id)}
                  checkData={checkData[room.id] || {
                    locationId: room.id,
                    checked: false,
                    needsAttention: false,
                    attentionReason: '',
                    harvestEstimate: 0,
                    notes: '',
                  }}
                  onUpdate={(data) => updateRoomCheck(room.id, data)}
                  onSelect={() => handleSelectRoom(room.id)}
                  isActive={selectedRoomId === room.id}
                />
              ))}
            </div>
          )}

          {/* Flagged Rooms Summary */}
          {summaryStats.needsAttention > 0 && (
            <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-4">
              <h3 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <Icons.AlertTriangle />
                Rooms Needing Attention
              </h3>
              <div className="space-y-2">
                {Object.entries(checkData)
                  .filter(([_, data]) => data.needsAttention)
                  .map(([roomId, data]) => {
                    const room = getLocation(roomId);
                    return (
                      <div key={roomId} className="bg-zinc-900/50 rounded-lg p-3">
                        <p className="font-medium text-white">{room?.name || 'Unknown Room'}</p>
                        {data.attentionReason && (
                          <p className="text-sm text-zinc-400 mt-1">{data.attentionReason}</p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Completion Banner */}
          {summaryStats.checkedCount === summaryStats.totalRooms && summaryStats.totalRooms > 0 && (
            <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-emerald-400 mb-2">Daily Check Complete!</h3>
              <p className="text-zinc-400">
                All {summaryStats.totalRooms} rooms have been checked.
                Total estimated harvest: <span className="text-emerald-400 font-medium">{summaryStats.totalHarvest}g</span>
              </p>
            </div>
          )}
        </div>
      ) : selectedRoom ? (
        <RoomDetailView
          location={selectedRoom}
          grows={getGrowsForRoom(selectedRoom.id)}
          checkData={checkData[selectedRoom.id] || {
            locationId: selectedRoom.id,
            checked: false,
            needsAttention: false,
            attentionReason: '',
            harvestEstimate: 0,
            notes: '',
          }}
          onUpdate={(data) => updateRoomCheck(selectedRoom.id, data)}
          onComplete={handleCompleteRoom}
          onBack={() => {
            setView('overview');
            setSelectedRoomId(null);
          }}
          getStrain={getStrain}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-zinc-500">No room selected</p>
          <button
            onClick={() => setView('overview')}
            className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
          >
            Back to Overview
          </button>
        </div>
      )}
    </div>
  );
};

export default DailyCheck;
