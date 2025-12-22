// ============================================================================
// CANONICAL LOCATION FORM - Single source of truth for location creation/editing
// This form is used everywhere in the app via EntityFormModal
// Features: Hierarchical locations, environment presets, multi-purpose, capacity
// ============================================================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '../../store';
import type { Location, LocationLevel, RoomPurpose } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

export interface LocationFormData {
  name: string;
  level: LocationLevel;
  parentId: string | null;
  roomPurposes: RoomPurpose[];
  environmentType?: EnvironmentType;
  capacity?: number;
  code?: string;
  notes?: string;
  description?: string;
  tempRange?: { min: number; max: number };
  humidityRange?: { min: number; max: number };
  isActive: boolean;
}

export type EnvironmentType =
  | 'incubator'
  | 'fruiting_chamber'
  | 'cold_storage'
  | 'martha_tent'
  | 'still_air_box'
  | 'flow_hood'
  | 'drying_chamber'
  | 'monotub'
  | 'outdoor'
  | 'general';

interface EnvironmentPreset {
  type: EnvironmentType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  tempRange?: { min: number; max: number };
  humidityRange?: { min: number; max: number };
  description: string;
  defaultPurposes: RoomPurpose[];
}

interface LocationFormProps {
  data: LocationFormData;
  onChange: (data: Partial<LocationFormData>) => void;
  errors?: Record<string, string>;
  context?: {
    parentId?: string;
    isNested?: boolean;
  };
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Incubator: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 9v-2M12 17v-2M9 12h-2M17 12h-2"/>
    </svg>
  ),
  FruitingChamber: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="6" width="18" height="14" rx="2"/>
      <path d="M8 2v4M16 2v4"/>
      <path d="M7 12c0-1 1-2 2-2s2 1 2 2c0 1-1 2-2 2"/>
      <path d="M13 14c0-1 1-2 2-2s2 1 2 2c0 1-1 2-2 2"/>
    </svg>
  ),
  ColdStorage: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M4 10h16"/>
      <circle cx="17" cy="6" r="1"/>
      <path d="M8 15l2 2-2 2M12 13v6"/>
    </svg>
  ),
  MarthaTent: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M4 22V8l8-6 8 6v14"/>
      <path d="M4 12h16M4 17h16"/>
      <path d="M9 22v-4h6v4"/>
    </svg>
  ),
  StillAirBox: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="2" y="6" width="20" height="14" rx="2"/>
      <circle cx="8" cy="13" r="3"/>
      <circle cx="16" cy="13" r="3"/>
    </svg>
  ),
  FlowHood: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <path d="M7 8h10M7 12h10M7 16h10"/>
      <path d="M3 8l-1 0M3 12l-1 0M3 16l-1 0"/>
    </svg>
  ),
  DryingChamber: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <path d="M8 8v8M12 6v12M16 10v4"/>
    </svg>
  ),
  Monotub: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <ellipse cx="12" cy="8" rx="8" ry="3"/>
      <path d="M4 8v8c0 1.66 3.58 3 8 3s8-1.34 8-3V8"/>
      <circle cx="6" cy="12" r="1"/>
      <circle cx="18" cy="12" r="1"/>
    </svg>
  ),
  Thermometer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
  Droplet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
};

// ============================================================================
// ENVIRONMENT PRESETS
// ============================================================================

const environmentPresets: Record<EnvironmentType, EnvironmentPreset> = {
  incubator: {
    type: 'incubator',
    label: 'Incubator',
    icon: <Icons.Incubator />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/50',
    borderColor: 'border-amber-800',
    tempRange: { min: 75, max: 82 },
    humidityRange: { min: 60, max: 80 },
    description: 'Warm, dark environment for colonization',
    defaultPurposes: ['colonization'],
  },
  fruiting_chamber: {
    type: 'fruiting_chamber',
    label: 'Fruiting Chamber',
    icon: <Icons.FruitingChamber />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/50',
    borderColor: 'border-purple-800',
    tempRange: { min: 65, max: 75 },
    humidityRange: { min: 85, max: 95 },
    description: 'High humidity with fresh air exchange',
    defaultPurposes: ['fruiting'],
  },
  cold_storage: {
    type: 'cold_storage',
    label: 'Cold Storage',
    icon: <Icons.ColdStorage />,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/50',
    borderColor: 'border-cyan-800',
    tempRange: { min: 35, max: 45 },
    humidityRange: { min: 30, max: 50 },
    description: 'Refrigerated storage for cultures and spawn',
    defaultPurposes: ['storage'],
  },
  martha_tent: {
    type: 'martha_tent',
    label: 'Martha Tent',
    icon: <Icons.MarthaTent />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/50',
    borderColor: 'border-emerald-800',
    tempRange: { min: 68, max: 75 },
    humidityRange: { min: 90, max: 99 },
    description: 'Budget-friendly fruiting chamber with shelves',
    defaultPurposes: ['fruiting', 'colonization'],
  },
  still_air_box: {
    type: 'still_air_box',
    label: 'Still Air Box (SAB)',
    icon: <Icons.StillAirBox />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/50',
    borderColor: 'border-blue-800',
    description: 'Sterile workspace for transfers and inoculation',
    defaultPurposes: ['inoculation'],
  },
  flow_hood: {
    type: 'flow_hood',
    label: 'Flow Hood Area',
    icon: <Icons.FlowHood />,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-950/50',
    borderColor: 'border-indigo-800',
    description: 'Laminar flow workspace for sterile procedures',
    defaultPurposes: ['inoculation'],
  },
  drying_chamber: {
    type: 'drying_chamber',
    label: 'Drying Chamber',
    icon: <Icons.DryingChamber />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-950/50',
    borderColor: 'border-orange-800',
    tempRange: { min: 95, max: 165 },
    humidityRange: { min: 10, max: 30 },
    description: 'Dehydrator or drying area for harvested mushrooms',
    defaultPurposes: ['drying'],
  },
  monotub: {
    type: 'monotub',
    label: 'Monotub',
    icon: <Icons.Monotub />,
    color: 'text-teal-400',
    bgColor: 'bg-teal-950/50',
    borderColor: 'border-teal-800',
    tempRange: { min: 68, max: 76 },
    humidityRange: { min: 85, max: 95 },
    description: 'Self-contained fruiting chamber (tub with holes)',
    defaultPurposes: ['fruiting', 'colonization'],
  },
  outdoor: {
    type: 'outdoor',
    label: 'Outdoor Area',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="5" r="3"/>
      <path d="M12 8v4M8 22v-6l4-4 4 4v6"/>
      <path d="M4 22h16"/>
    </svg>,
    color: 'text-green-400',
    bgColor: 'bg-green-950/50',
    borderColor: 'border-green-800',
    description: 'Outdoor growing area (logs, beds, garden)',
    defaultPurposes: ['general'],
  },
  general: {
    type: 'general',
    label: 'General Purpose',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
    </svg>,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-800/50',
    borderColor: 'border-zinc-700',
    description: 'General storage or work area',
    defaultPurposes: ['general'],
  },
};

const roomPurposeConfig: Record<RoomPurpose, { label: string; color: string }> = {
  pasteurization: { label: 'Pasteurization', color: 'text-red-400' },
  inoculation: { label: 'Inoculation', color: 'text-blue-400' },
  colonization: { label: 'Colonization', color: 'text-emerald-400' },
  fruiting: { label: 'Fruiting', color: 'text-purple-400' },
  storage: { label: 'Storage', color: 'text-zinc-400' },
  prep: { label: 'Prep Area', color: 'text-amber-400' },
  drying: { label: 'Drying', color: 'text-orange-400' },
  packaging: { label: 'Packaging', color: 'text-pink-400' },
  general: { label: 'General', color: 'text-zinc-500' },
};

const levelOptions: { value: LocationLevel; label: string; description: string }[] = [
  { value: 'facility', label: 'Facility (Building/Property)', description: 'Top-level location' },
  { value: 'room', label: 'Room', description: 'A room within a facility' },
  { value: 'zone', label: 'Environment / Chamber', description: 'Controlled environment like incubators, fruiting chambers' },
  { value: 'rack', label: 'Equipment (Rack/Chamber/Box)', description: 'Physical equipment within a room' },
  { value: 'shelf', label: 'Shelf', description: 'A shelf within a rack or chamber' },
  { value: 'slot', label: 'Position / Slot', description: 'A specific position for items' },
];

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

  return path.join(' > ');
}

// ============================================================================
// MAIN FORM COMPONENT
// ============================================================================

export const LocationForm: React.FC<LocationFormProps> = ({
  data,
  onChange,
  errors = {},
  context,
}) => {
  const { state } = useData();
  const [showEnvironmental, setShowEnvironmental] = useState(
    !!(data.tempRange || data.humidityRange)
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get user experience level for conditional UI
  const isExpert = state.settings?.experienceLevel === 'expert' || state.settings?.advancedMode;

  // Available parent locations (exclude self and descendants to prevent cycles)
  const availableParents = useMemo(() => {
    return state.locations.filter(l => l.isActive);
  }, [state.locations]);

  // Show chamber presets for zone/rack levels
  const showChamberPresets = data.level === 'zone' || data.level === 'rack';
  const isEditMode = !!(data.name && data.name.trim());

  // Apply environment preset
  const applyPreset = useCallback((type: EnvironmentType) => {
    const preset = environmentPresets[type];
    onChange({
      environmentType: type,
      tempRange: preset.tempRange,
      humidityRange: preset.humidityRange,
      roomPurposes: preset.defaultPurposes,
      level: data.parentId ? data.level : 'zone', // Default to zone for chambers
    });
    if (preset.tempRange || preset.humidityRange) {
      setShowEnvironmental(true);
    }
  }, [onChange, data.level, data.parentId]);

  // Update environmental visibility when temp/humidity changes
  useEffect(() => {
    if (data.tempRange || data.humidityRange) {
      setShowEnvironmental(true);
    }
  }, [data.tempRange, data.humidityRange]);

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., Main Incubator, Basement Lab, Fruiting Room"
          className={`w-full px-3 py-2 bg-zinc-800 border rounded-lg text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Type / Level */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">
          Type <span className="text-red-400">*</span>
        </label>
        <select
          value={data.level}
          onChange={e => onChange({ level: e.target.value as LocationLevel })}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          {levelOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500">
          {levelOptions.find(o => o.value === data.level)?.description}
        </p>
      </div>

      {/* Quick Setup - Environment Presets */}
      {showChamberPresets && !isEditMode && (
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Quick Setup - Environment Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(environmentPresets)
              .filter(([key]) => key !== 'general')
              .slice(0, 8)
              .map(([key, preset]) => {
                const isSelected = data.environmentType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key as EnvironmentType)}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
                      isSelected
                        ? `${preset.bgColor} ${preset.borderColor}`
                        : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
                    }`}
                  >
                    <span className={preset.color}>{preset.icon}</span>
                    <span className={`text-sm ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                      {preset.label}
                    </span>
                  </button>
                );
              })}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Select a preset to auto-fill temperature and humidity targets
          </p>
        </div>
      )}

      {/* Parent Location */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">Parent Location</label>
        <select
          value={data.parentId || ''}
          onChange={e => onChange({ parentId: e.target.value || null })}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">(No parent - top level)</option>
          {availableParents.map(l => (
            <option key={l.id} value={l.id}>
              {getLocationPath(l.id, state.locations)}
            </option>
          ))}
        </select>
      </div>

      {/* Room Purposes - show for room/zone levels */}
      {(data.level === 'room' || data.level === 'zone' || data.level === 'rack') && (
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Purposes <span className="text-zinc-500 text-xs">(select all that apply)</span>
          </label>
          <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
            {Object.entries(roomPurposeConfig).map(([key, { label, color }]) => {
              const purpose = key as RoomPurpose;
              const isSelected = data.roomPurposes?.includes(purpose) || false;
              return (
                <label
                  key={key}
                  className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-zinc-700/50' : 'hover:bg-zinc-700/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={e => {
                      const newPurposes = e.target.checked
                        ? [...(data.roomPurposes || []), purpose]
                        : (data.roomPurposes || []).filter(p => p !== purpose);
                      onChange({ roomPurposes: newPurposes });
                    }}
                    className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-700 text-emerald-500"
                  />
                  <span className={`text-xs ${isSelected ? color : 'text-zinc-400'}`}>
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Code and Capacity - always show for expert, toggle for beginners */}
      {(isExpert || showAdvanced) && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Code</label>
            <input
              type="text"
              value={data.code || ''}
              onChange={e => onChange({ code: e.target.value })}
              placeholder="e.g., INC-1, FC-A"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="mt-1 text-xs text-zinc-500">Short identifier for labels</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Capacity</label>
            <input
              type="number"
              value={data.capacity || ''}
              onChange={e => onChange({ capacity: parseInt(e.target.value) || undefined })}
              placeholder="Max items"
              min="0"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="mt-1 text-xs text-zinc-500">Maximum items this location holds</p>
          </div>
        </div>
      )}

      {/* Toggle for advanced options (for non-expert users) */}
      {!isExpert && (
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
        >
          <Icons.ChevronDown />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>
      )}

      {/* Environmental Targets Toggle */}
      <button
        type="button"
        onClick={() => setShowEnvironmental(!showEnvironmental)}
        className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
      >
        <Icons.Thermometer />
        {showEnvironmental ? 'Hide' : 'Add'} Environmental Targets
      </button>

      {/* Environmental Ranges */}
      {showEnvironmental && (
        <div className="space-y-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
            <Icons.Thermometer />
            <span>Temperature (°F)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Min</label>
              <input
                type="number"
                value={data.tempRange?.min || ''}
                onChange={e => onChange({
                  tempRange: { min: parseInt(e.target.value) || 0, max: data.tempRange?.max || 0 }
                })}
                placeholder="e.g., 70"
                className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Max</label>
              <input
                type="number"
                value={data.tempRange?.max || ''}
                onChange={e => onChange({
                  tempRange: { min: data.tempRange?.min || 0, max: parseInt(e.target.value) || 0 }
                })}
                placeholder="e.g., 80"
                className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-400 mt-4 mb-2">
            <Icons.Droplet />
            <span>Humidity (%)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Min</label>
              <input
                type="number"
                value={data.humidityRange?.min || ''}
                onChange={e => onChange({
                  humidityRange: { min: parseInt(e.target.value) || 0, max: data.humidityRange?.max || 0 }
                })}
                placeholder="e.g., 80"
                min="0"
                max="100"
                className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Max</label>
              <input
                type="number"
                value={data.humidityRange?.max || ''}
                onChange={e => onChange({
                  humidityRange: { min: data.humidityRange?.min || 0, max: parseInt(e.target.value) || 0 }
                })}
                placeholder="e.g., 95"
                min="0"
                max="100"
                className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
        <input
          type="text"
          value={data.description || ''}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Brief description of this location"
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">Notes</label>
        <textarea
          value={data.notes || ''}
          onChange={e => onChange({ notes: e.target.value })}
          rows={2}
          placeholder="Equipment details, maintenance notes, special instructions..."
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

// ============================================================================
// DEFAULT FORM DATA
// ============================================================================

export const getDefaultLocationFormData = (context?: { parentId?: string }): LocationFormData => ({
  name: '',
  level: context?.parentId ? 'zone' : 'facility',
  parentId: context?.parentId || null,
  roomPurposes: [],
  capacity: undefined,
  code: '',
  notes: '',
  description: '',
  tempRange: undefined,
  humidityRange: undefined,
  isActive: true,
});

export default LocationForm;
