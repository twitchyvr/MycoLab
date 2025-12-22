// ============================================================================
// LAB SPACES COMPONENT
// Unified location management combining Lab Layout + Space Tracker
// Features: Chamber-centric design, environmental presets, occupancy tracking
// ============================================================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '../../store';
import { useNotifications } from '../../store/NotificationContext';
import { useAuthGuard } from '../../lib/useAuthGuard';
import type { Location, LocationLevel, RoomPurpose, Culture, Grow } from '../../store/types';
import { formatTemperatureRange, getTemperatureUnit, type TemperatureUnit } from '../../utils/temperature';
import { LocationForm, getDefaultLocationFormData, type LocationFormData } from '../forms/LocationForm';

// ============================================================================
// TYPES
// ============================================================================

interface LabSpacesProps {
  onNavigate?: (page: string, itemId?: string) => void;
  className?: string;
}

interface LocationTreeNode extends Location {
  children: LocationTreeNode[];
  depth: number;
}

// NOTE: LocationFormData and EnvironmentType are imported from '../forms/LocationForm'
// This ensures consistency across the app for location creation/editing

// Local types for environment presets (used in tree display)
type EnvironmentType =
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
  icon: React.FC;
  color: string;
  bgColor: string;
  borderColor: string;
  tempRange?: { min: number; max: number };
  humidityRange?: { min: number; max: number };
  description: string;
  defaultPurposes: RoomPurpose[];
}

interface OccupancyStats {
  cultureCount: number;
  growCount: number;
  totalItems: number;
  capacity: number | undefined;
  occupancyPercent: number | null;
  isColdStorage: boolean;
  strains: Map<string, { name: string; count: number }>;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  // Location levels
  Facility: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M10 11h.01M10 15h.01M14 11h.01M14 15h.01M18 11h.01M18 15h.01"/>
      <path d="M3 7l9-4 9 4"/>
    </svg>
  ),
  Room: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 3v18"/>
    </svg>
  ),
  Zone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M3 6h18M3 12h18M3 18h18"/>
    </svg>
  ),
  Shelf: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M4 6h16M4 12h16"/>
      <path d="M4 6v2M20 6v2M4 12v2M20 12v2"/>
    </svg>
  ),
  Slot: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="6" y="6" width="12" height="12" rx="1"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),

  // Environment types - NEW semantic icons
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
  Outdoor: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="5" r="3"/>
      <path d="M12 8v4M8 22v-6l4-4 4 4v6"/>
      <path d="M4 22h16"/>
    </svg>
  ),
  General: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
    </svg>
  ),

  // Actions
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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
  Move: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <line x1="12" y1="2" x2="12" y2="22"/>
    </svg>
  ),
  Culture: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
    </svg>
  ),
  Grow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 22V8"/>
      <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
      <path d="M8 5.2A10 10 0 0 1 12 4a10 10 0 0 1 4 1.2"/>
    </svg>
  ),
  Snowflake: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="12" y1="2" x2="12" y2="22"/>
      <path d="M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>
    </svg>
  ),
  Map: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  BarChart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="12" y1="20" x2="12" y2="10"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
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
    icon: Icons.Incubator,
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
    icon: Icons.FruitingChamber,
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
    icon: Icons.ColdStorage,
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
    icon: Icons.MarthaTent,
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
    icon: Icons.StillAirBox,
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/50',
    borderColor: 'border-blue-800',
    description: 'Sterile workspace for transfers and inoculation',
    defaultPurposes: ['inoculation'],
  },
  flow_hood: {
    type: 'flow_hood',
    label: 'Flow Hood Area',
    icon: Icons.FlowHood,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-950/50',
    borderColor: 'border-indigo-800',
    description: 'Laminar flow workspace for sterile procedures',
    defaultPurposes: ['inoculation'],
  },
  drying_chamber: {
    type: 'drying_chamber',
    label: 'Drying Chamber',
    icon: Icons.DryingChamber,
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
    icon: Icons.Monotub,
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
    icon: Icons.Outdoor,
    color: 'text-green-400',
    bgColor: 'bg-green-950/50',
    borderColor: 'border-green-800',
    description: 'Outdoor growing area (logs, beds, garden)',
    defaultPurposes: ['general'],
  },
  general: {
    type: 'general',
    label: 'General Purpose',
    icon: Icons.General,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-800/50',
    borderColor: 'border-zinc-700',
    description: 'General storage or work area',
    defaultPurposes: ['general'],
  },
};

// Legacy level icons (for backward compatibility)
const levelIcons: Record<LocationLevel, React.FC> = {
  facility: Icons.Facility,
  room: Icons.Room,
  zone: Icons.Zone,
  rack: Icons.Incubator, // Map old "rack" to incubator icon
  shelf: Icons.Shelf,
  slot: Icons.Slot,
};

const levelColors: Record<LocationLevel, { bg: string; border: string; text: string }> = {
  facility: { bg: 'bg-purple-950/50', border: 'border-purple-800', text: 'text-purple-400' },
  room: { bg: 'bg-blue-950/50', border: 'border-blue-800', text: 'text-blue-400' },
  zone: { bg: 'bg-cyan-950/50', border: 'border-cyan-800', text: 'text-cyan-400' },
  rack: { bg: 'bg-emerald-950/50', border: 'border-emerald-800', text: 'text-emerald-400' },
  shelf: { bg: 'bg-amber-950/50', border: 'border-amber-800', text: 'text-amber-400' },
  slot: { bg: 'bg-zinc-800/50', border: 'border-zinc-700', text: 'text-zinc-400' },
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildLocationTree(locations: Location[]): LocationTreeNode[] {
  const locationMap = new Map<string, LocationTreeNode>();
  const rootNodes: LocationTreeNode[] = [];

  locations.forEach(loc => {
    locationMap.set(loc.id, { ...loc, children: [], depth: 0 });
  });

  locations.forEach(loc => {
    const node = locationMap.get(loc.id)!;
    if (loc.parentId && locationMap.has(loc.parentId)) {
      const parent = locationMap.get(loc.parentId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  const sortChildren = (nodes: LocationTreeNode[]) => {
    nodes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    nodes.forEach(node => sortChildren(node.children));
  };
  sortChildren(rootNodes);

  return rootNodes;
}

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

function getDescendantIds(locationId: string, locations: Location[]): string[] {
  const descendants: string[] = [];
  const queue = [locationId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = locations.filter(l => l.parentId === current);
    children.forEach(child => {
      descendants.push(child.id);
      queue.push(child.id);
    });
  }

  return descendants;
}

function detectEnvironmentType(location: Location): EnvironmentType {
  // Auto-detect based on temperature range
  if (location.tempRange) {
    const avgTemp = (location.tempRange.min + location.tempRange.max) / 2;
    if (avgTemp < 50) return 'cold_storage';
    if (avgTemp > 90) return 'drying_chamber';
  }

  // Check room purposes
  const purposes = location.roomPurposes || (location.roomPurpose ? [location.roomPurpose] : []);
  if (purposes.includes('inoculation')) return 'still_air_box';
  if (purposes.includes('fruiting') && purposes.includes('colonization')) return 'martha_tent';
  if (purposes.includes('fruiting')) return 'fruiting_chamber';
  if (purposes.includes('colonization')) return 'incubator';
  if (purposes.includes('drying')) return 'drying_chamber';
  if (purposes.includes('storage')) {
    if (location.tempRange && location.tempRange.max < 50) return 'cold_storage';
    return 'general';
  }

  return 'general';
}

function getLocationOccupancy(
  locationId: string,
  cultures: Culture[],
  grows: Grow[],
  strains: { id: string; name: string }[],
  location: Location
): OccupancyStats {
  const locationCultures = cultures.filter(c => c.locationId === locationId);
  const locationGrows = grows.filter(g => g.locationId === locationId);

  const strainMap = new Map<string, { name: string; count: number }>();

  locationCultures.forEach(c => {
    const strain = strains.find(s => s.id === c.strainId);
    if (strain) {
      const existing = strainMap.get(strain.id);
      if (existing) {
        existing.count++;
      } else {
        strainMap.set(strain.id, { name: strain.name, count: 1 });
      }
    }
  });

  locationGrows.forEach(g => {
    const strain = strains.find(s => s.id === g.strainId);
    if (strain) {
      const existing = strainMap.get(strain.id);
      if (existing) {
        existing.count++;
      } else {
        strainMap.set(strain.id, { name: strain.name, count: 1 });
      }
    }
  });

  const totalItems = locationCultures.length + locationGrows.length;
  const isColdStorage = location.tempRange ? location.tempRange.max < 50 : false;

  return {
    cultureCount: locationCultures.length,
    growCount: locationGrows.length,
    totalItems,
    capacity: location.capacity,
    occupancyPercent: location.capacity
      ? Math.round((totalItems / location.capacity) * 100)
      : null,
    isColdStorage,
    strains: strainMap,
  };
}

// ============================================================================
// TREE ITEM COMPONENT
// ============================================================================

interface TreeItemProps {
  node: LocationTreeNode;
  expandedIds: Set<string>;
  selectedId?: string;
  onToggle: (id: string) => void;
  onSelect: (location: Location) => void;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
  onAddChild: (parentId: string) => void;
  cultures: Culture[];
  grows: Grow[];
  strains: { id: string; name: string }[];
}

const TreeItem: React.FC<TreeItemProps> = ({
  node,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  cultures,
  grows,
  strains,
}) => {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;

  // Detect environment type for icon/colors
  const envType = detectEnvironmentType(node);
  const preset = environmentPresets[envType];
  const level = node.level || 'room';

  // Get occupancy stats
  const occupancy = getLocationOccupancy(node.id, cultures, grows, strains, node);

  // Use environment preset colors for rack level, otherwise use level colors
  const isEnvironmentalLevel = level === 'rack' || level === 'zone';
  const colors = isEnvironmentalLevel && envType !== 'general'
    ? { bg: preset.bgColor, border: preset.borderColor, text: preset.color }
    : levelColors[level];
  const Icon = isEnvironmentalLevel && envType !== 'general' ? preset.icon : levelIcons[level];

  return (
    <div className="select-none">
      <div
        className={`
          group flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer
          ${isSelected
            ? `${colors.bg} ${colors.border} border`
            : 'hover:bg-zinc-800/50'
          }
        `}
        style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {/* Expand/collapse */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
            className="p-0.5 hover:bg-zinc-700 rounded transition-colors"
          >
            {isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
          </button>
        ) : (
          <span className="w-5 h-5" />
        )}

        {/* Icon */}
        <div className={`flex-shrink-0 ${colors.text}`}>
          <Icon />
        </div>

        {/* Name and info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium truncate ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
              {node.name}
            </span>
            {node.code && (
              <span className="text-xs text-zinc-500 font-mono">[{node.code}]</span>
            )}
            {occupancy.isColdStorage && (
              <span className="text-cyan-400" title="Cold Storage">
                <Icons.Snowflake />
              </span>
            )}
          </div>
          {/* Environment type label for chambers */}
          {isEnvironmentalLevel && envType !== 'general' && (
            <span className={`text-xs ${preset.color}`}>{preset.label}</span>
          )}
        </div>

        {/* Occupancy */}
        {occupancy.totalItems > 0 && (
          <div className="flex items-center gap-2 text-xs">
            {occupancy.cultureCount > 0 && (
              <span className="flex items-center gap-1 text-blue-400">
                <Icons.Culture /> {occupancy.cultureCount}
              </span>
            )}
            {occupancy.growCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Icons.Grow /> {occupancy.growCount}
              </span>
            )}
          </div>
        )}

        {/* Occupancy bar */}
        {occupancy.occupancyPercent !== null && (
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  occupancy.occupancyPercent > 90 ? 'bg-red-500' :
                  occupancy.occupancyPercent > 70 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(occupancy.occupancyPercent, 100)}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500">{occupancy.occupancyPercent}%</span>
          </div>
        )}

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
            className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700 rounded transition-colors"
            title="Add child"
          >
            <Icons.Plus />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(node); }}
            className="p-1 text-zinc-400 hover:text-blue-400 hover:bg-zinc-700 rounded transition-colors"
            title="Edit"
          >
            <Icons.Edit />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node); }}
            className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors"
            title="Delete"
          >
            <Icons.Trash />
          </button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeItem
              key={child.id}
              node={child}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              cultures={cultures}
              grows={grows}
              strains={strains}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// LOCATION FORM MODAL - Uses canonical LocationForm for consistency
// This is a thin wrapper around the canonical LocationForm component
// ============================================================================

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LocationFormData) => void;
  initialData?: Partial<LocationFormData>;
  parentLocation?: Location;
}

const LocationFormModal: React.FC<LocationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  parentLocation,
}) => {
  const getNextLevel = (parentLevel?: LocationLevel): LocationLevel => {
    const levelOrder: LocationLevel[] = ['facility', 'room', 'zone', 'rack', 'shelf', 'slot'];
    if (!parentLevel) return 'facility';
    const idx = levelOrder.indexOf(parentLevel);
    return levelOrder[Math.min(idx + 1, levelOrder.length - 1)];
  };

  const createFormData = useCallback((): LocationFormData => {
    const defaultData = getDefaultLocationFormData({ parentId: parentLocation?.id });
    return {
      ...defaultData,
      name: initialData?.name || '',
      level: initialData?.level || (parentLocation ? getNextLevel(parentLocation.level) : 'facility'),
      parentId: initialData?.parentId ?? parentLocation?.id ?? null,
      environmentType: initialData?.environmentType,
      roomPurposes: initialData?.roomPurposes || [],
      capacity: initialData?.capacity,
      code: initialData?.code || '',
      notes: initialData?.notes || '',
      description: initialData?.description || '',
      tempRange: initialData?.tempRange,
      humidityRange: initialData?.humidityRange,
    };
  }, [initialData, parentLocation]);

  const [formData, setFormData] = useState<LocationFormData>(createFormData);

  useEffect(() => {
    if (isOpen) {
      setFormData(createFormData());
    }
  }, [isOpen, createFormData]);

  const handleFormChange = useCallback((updates: Partial<LocationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  if (!isOpen) return null;

  const isEditMode = !!initialData?.name;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col safe-area-bottom">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">
            {isEditMode ? 'Edit Location' : 'Add Location'}
          </h3>
          <button
            onClick={onClose}
            className="p-2.5 min-w-[44px] min-h-[44px] hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center"
          >
            <Icons.X />
          </button>
        </div>

        {/* Form Content - Uses canonical LocationForm */}
        <div className="flex-1 overflow-y-auto p-4">
          <LocationForm
            data={formData}
            onChange={handleFormChange}
            errors={{}}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 min-h-[48px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (formData.name.trim()) {
                onSave(formData);
              }
            }}
            disabled={!formData.name.trim()}
            className="px-5 py-2.5 min-h-[48px] bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors sm:order-2"
          >
            {isEditMode ? 'Save Changes' : 'Create Location'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// LOCATION DETAILS PANEL
// ============================================================================

interface LocationDetailsPanelProps {
  location: Location;
  locations: Location[];
  cultures: Culture[];
  grows: Grow[];
  strains: { id: string; name: string }[];
  onEdit: (location: Location) => void;
  onClose: () => void;
  onNavigate?: (page: string, itemId?: string) => void;
  temperatureUnit: TemperatureUnit;
}

const LocationDetailsPanel: React.FC<LocationDetailsPanelProps> = ({
  location,
  locations,
  cultures,
  grows,
  strains,
  onEdit,
  onClose,
  onNavigate,
  temperatureUnit,
}) => {
  const envType = detectEnvironmentType(location);
  const preset = environmentPresets[envType];
  const level = location.level || 'room';

  const isEnvironmental = level === 'zone' || level === 'rack';
  const colors = isEnvironmental && envType !== 'general'
    ? { bg: preset.bgColor, border: preset.borderColor, text: preset.color }
    : levelColors[level];
  const Icon = isEnvironmental && envType !== 'general' ? preset.icon : levelIcons[level];

  const occupancy = getLocationOccupancy(location.id, cultures, grows, strains, location);
  const childLocations = locations.filter(l => l.parentId === location.id);

  const locationCultures = cultures.filter(c => c.locationId === location.id);
  const locationGrows = grows.filter(g => g.locationId === location.id);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${colors.bg} border-b ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.text} ${colors.bg} border ${colors.border}`}>
              <Icon />
            </div>
            <div>
              <h3 className="font-semibold text-white">{location.name}</h3>
              <p className="text-xs text-zinc-400">
                {isEnvironmental && envType !== 'general' ? preset.label : level}
                {location.code && ` • ${location.code}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(location)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <Icons.Edit />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <Icons.X />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Environmental Info - Prominently displayed */}
        {(location.tempRange || location.humidityRange || occupancy.isColdStorage) && (
          <div className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
            <div className="flex items-center gap-4">
              {location.tempRange && (
                <div className="flex items-center gap-2">
                  <Icons.Thermometer />
                  <span className="text-white font-medium">
                    {formatTemperatureRange(location.tempRange.min, location.tempRange.max, temperatureUnit)}
                  </span>
                </div>
              )}
              {location.humidityRange && (
                <div className="flex items-center gap-2">
                  <Icons.Droplet />
                  <span className="text-white font-medium">
                    {location.humidityRange.min}% - {location.humidityRange.max}%
                  </span>
                </div>
              )}
              {occupancy.isColdStorage && (
                <div className="flex items-center gap-2 text-cyan-400">
                  <Icons.Snowflake />
                  <span className="text-sm">Cold Storage</span>
                </div>
              )}
            </div>
            {isEnvironmental && envType !== 'general' && (
              <p className="text-xs text-zinc-400 mt-2">{preset.description}</p>
            )}
          </div>
        )}

        {/* Occupancy Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
            <div className="text-xl font-bold text-white">{occupancy.cultureCount}</div>
            <div className="text-xs text-zinc-500">Cultures</div>
          </div>
          <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
            <div className="text-xl font-bold text-white">{occupancy.growCount}</div>
            <div className="text-xs text-zinc-500">Grows</div>
          </div>
          <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
            {occupancy.capacity ? (
              <>
                <div className="text-xl font-bold text-white">{occupancy.occupancyPercent}%</div>
                <div className="text-xs text-zinc-500">{occupancy.totalItems}/{occupancy.capacity}</div>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-white">{occupancy.totalItems}</div>
                <div className="text-xs text-zinc-500">Total Items</div>
              </>
            )}
          </div>
        </div>

        {/* Capacity Bar */}
        {occupancy.capacity && occupancy.occupancyPercent !== null && (
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Capacity</span>
              <span>{occupancy.totalItems} / {occupancy.capacity}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  occupancy.occupancyPercent > 90 ? 'bg-red-500' :
                  occupancy.occupancyPercent > 70 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(occupancy.occupancyPercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Strain Breakdown */}
        {occupancy.strains.size > 0 && (
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-2">Strains Here</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(occupancy.strains.entries()).map(([id, { name, count }]) => (
                <span key={id} className="px-2 py-1 bg-zinc-800/50 rounded text-xs text-zinc-300">
                  {name} <span className="text-zinc-500">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Items List */}
        {(locationCultures.length > 0 || locationGrows.length > 0) && (
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-2">Items</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {locationCultures.map(c => (
                <button
                  key={c.id}
                  onClick={() => onNavigate?.('cultures', c.id)}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-zinc-800/50 rounded transition-colors"
                >
                  <span className="text-blue-400"><Icons.Culture /></span>
                  <span className="text-sm text-zinc-300">{c.label}</span>
                  <span className="text-xs text-zinc-500">{c.type}</span>
                </button>
              ))}
              {locationGrows.map(g => (
                <button
                  key={g.id}
                  onClick={() => onNavigate?.('grows', g.id)}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-zinc-800/50 rounded transition-colors"
                >
                  <span className="text-emerald-400"><Icons.Grow /></span>
                  <span className="text-sm text-zinc-300">{g.name}</span>
                  <span className="text-xs text-zinc-500">{g.currentStage}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Child Locations */}
        {childLocations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-2">
              Sub-locations ({childLocations.length})
            </h4>
            <div className="space-y-1">
              {childLocations.slice(0, 5).map(child => {
                const childEnvType = detectEnvironmentType(child);
                const childPreset = environmentPresets[childEnvType];
                const ChildIcon = childPreset.icon;
                return (
                  <div key={child.id} className="flex items-center gap-2 text-sm">
                    <span className={childPreset.color}><ChildIcon /></span>
                    <span className="text-zinc-300">{child.name}</span>
                  </div>
                );
              })}
              {childLocations.length > 5 && (
                <p className="text-xs text-zinc-500">+{childLocations.length - 5} more...</p>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {location.notes && (
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-1">Notes</h4>
            <p className="text-sm text-zinc-300">{location.notes}</p>
          </div>
        )}

        {/* Path */}
        <div className="pt-2 border-t border-zinc-800">
          <p className="text-xs text-zinc-500">
            {getLocationPath(location.id, locations)}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DASHBOARD OVERVIEW
// ============================================================================

interface DashboardOverviewProps {
  locations: Location[];
  cultures: Culture[];
  grows: Grow[];
  strains: { id: string; name: string }[];
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  locations,
  cultures,
  grows,
  strains,
}) => {
  const stats = useMemo(() => {
    const active = locations.filter(l => l.isActive);

    // Count by environment type
    const envCounts = new Map<EnvironmentType, number>();
    active.forEach(loc => {
      const type = detectEnvironmentType(loc);
      envCounts.set(type, (envCounts.get(type) || 0) + 1);
    });

    // Cold storage count
    const coldStorageCount = active.filter(l =>
      l.tempRange && l.tempRange.max < 50
    ).length;

    // Items by location
    const itemsByLocation = new Map<string, number>();
    cultures.forEach(c => {
      if (c.locationId) {
        itemsByLocation.set(c.locationId, (itemsByLocation.get(c.locationId) || 0) + 1);
      }
    });
    grows.forEach(g => {
      if (g.locationId) {
        itemsByLocation.set(g.locationId, (itemsByLocation.get(g.locationId) || 0) + 1);
      }
    });

    // Most used locations
    const topLocations = Array.from(itemsByLocation.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({
        location: active.find(l => l.id === id),
        count,
      }))
      .filter(item => item.location);

    // Strain distribution across locations
    const strainLocations = new Map<string, Set<string>>();
    [...cultures, ...grows].forEach(item => {
      if (item.strainId && item.locationId) {
        if (!strainLocations.has(item.strainId)) {
          strainLocations.set(item.strainId, new Set());
        }
        strainLocations.get(item.strainId)!.add(item.locationId);
      }
    });

    return {
      total: active.length,
      facilities: active.filter(l => l.level === 'facility').length,
      rooms: active.filter(l => l.level === 'room').length,
      chambers: active.filter(l => l.level === 'zone' || l.level === 'rack').length,
      coldStorageCount,
      envCounts,
      topLocations,
      totalCultures: cultures.length,
      totalGrows: grows.length,
    };
  }, [locations, cultures, grows]);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-purple-950/30 border border-purple-800/50 rounded-xl">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Icons.Map />
            <span className="text-xs font-medium">LOCATIONS</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="p-4 bg-blue-950/30 border border-blue-800/50 rounded-xl">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Icons.Culture />
            <span className="text-xs font-medium">CULTURES</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalCultures}</div>
        </div>
        <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Icons.Grow />
            <span className="text-xs font-medium">GROWS</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalGrows}</div>
        </div>
        <div className="p-4 bg-cyan-950/30 border border-cyan-800/50 rounded-xl">
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <Icons.Snowflake />
            <span className="text-xs font-medium">COLD STORAGE</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.coldStorageCount}</div>
        </div>
      </div>

      {/* Environment Type Breakdown */}
      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">Environment Types</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from(stats.envCounts.entries())
            .filter(([type, count]) => count > 0 && type !== 'general')
            .map(([type, count]) => {
              const preset = environmentPresets[type];
              const TypeIcon = preset.icon;
              return (
                <div
                  key={type}
                  className={`flex items-center gap-2 p-2 rounded-lg ${preset.bgColor} border ${preset.borderColor}`}
                >
                  <span className={preset.color}><TypeIcon /></span>
                  <div>
                    <div className="text-sm font-medium text-white">{count}</div>
                    <div className="text-xs text-zinc-400">{preset.label}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Top Locations by Usage */}
      {stats.topLocations.length > 0 && (
        <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
          <h4 className="text-sm font-medium text-zinc-400 mb-3">Most Active Locations</h4>
          <div className="space-y-2">
            {stats.topLocations.map(({ location, count }) => {
              if (!location) return null;
              const envType = detectEnvironmentType(location);
              const preset = environmentPresets[envType];
              const Icon = preset.icon;
              return (
                <div key={location.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-700/30">
                  <span className={preset.color}><Icon /></span>
                  <span className="flex-1 text-sm text-zinc-300">{location.name}</span>
                  <span className="text-sm font-medium text-white">{count} items</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Legend */}
      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">Chamber Types</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(environmentPresets)
            .filter(([key]) => key !== 'general')
            .slice(0, 8)
            .map(([key, preset]) => {
              const Icon = preset.icon;
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className={preset.color}><Icon /></span>
                  <span className="text-zinc-400">{preset.label}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LabSpaces: React.FC<LabSpacesProps> = ({
  onNavigate,
  className = '',
}) => {
  const { state, addLocation, updateLocation, deleteLocation, generateId } = useData();
  const { toast } = useNotifications();
  const { guardAction, isAuthenticated } = useAuthGuard();
  const temperatureUnit: TemperatureUnit = state.settings?.defaultUnits || 'imperial';

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [parentForNew, setParentForNew] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'dashboard'>('tree');

  // Auto-expand on initial load
  useEffect(() => {
    const topLevelIds = state.locations
      .filter(l => l.isActive && !l.parentId)
      .map(l => l.id);
    setExpandedIds(new Set(topLevelIds));
  }, []);

  // Filter and build tree
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return state.locations.filter(l => l.isActive);
    const query = searchQuery.toLowerCase();
    return state.locations.filter(l =>
      l.isActive && (
        l.name.toLowerCase().includes(query) ||
        l.code?.toLowerCase().includes(query) ||
        l.roomPurpose?.toLowerCase().includes(query)
      )
    );
  }, [state.locations, searchQuery]);

  const locationTree = useMemo(() =>
    buildLocationTree(filteredLocations),
    [filteredLocations]
  );

  const strains = useMemo(() =>
    state.strains.map(s => ({ id: s.id, name: s.name })),
    [state.strains]
  );

  // Handlers
  const handleToggle = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback((location: Location) => {
    setSelectedLocation(location);
  }, []);

  const handleAddRoot = () => {
    if (!guardAction()) return; // Show auth modal if not authenticated
    setEditingLocation(null);
    setParentForNew(null);
    setShowForm(true);
  };

  const handleAddChild = (parentId: string) => {
    if (!guardAction()) return; // Show auth modal if not authenticated
    setEditingLocation(null);
    setParentForNew(parentId);
    setShowForm(true);
  };

  const handleEdit = (location: Location) => {
    if (!guardAction()) return; // Show auth modal if not authenticated
    setEditingLocation(location);
    setParentForNew(null);
    setShowForm(true);
  };

  const handleDelete = async (location: Location) => {
    if (!guardAction()) return; // Show auth modal if not authenticated
    const descendants = getDescendantIds(location.id, state.locations);
    const totalToDelete = descendants.length + 1;

    if (totalToDelete > 1) {
      const confirmed = window.confirm(
        `Delete "${location.name}" and ${descendants.length} sub-location(s)?`
      );
      if (!confirmed) return;
    }

    try {
      for (const id of descendants.reverse()) {
        await deleteLocation(id);
      }
      await deleteLocation(location.id);

      if (selectedLocation?.id === location.id) {
        setSelectedLocation(null);
      }

      toast.success(`Deleted ${location.name}`);
    } catch (error) {
      toast.error('Failed to delete location');
    }
  };

  const handleSave = async (data: LocationFormData) => {
    try {
      const path = data.parentId
        ? `${getLocationPath(data.parentId, state.locations)} > ${data.name}`
        : data.name;

      if (editingLocation) {
        await updateLocation(editingLocation.id, {
          ...editingLocation,
          name: data.name,
          level: data.level,
          parentId: data.parentId || undefined,
          roomPurposes: data.roomPurposes,
          roomPurpose: data.roomPurposes?.[0],
          capacity: data.capacity,
          code: data.code,
          notes: data.notes,
          tempRange: data.tempRange,
          humidityRange: data.humidityRange,
          path,
        });
        toast.success(`Updated ${data.name}`);
      } else {
        const newLocation: Location = {
          id: generateId('location'),
          name: data.name,
          level: data.level,
          parentId: data.parentId || undefined,
          roomPurposes: data.roomPurposes,
          roomPurpose: data.roomPurposes?.[0],
          capacity: data.capacity,
          currentOccupancy: 0,
          code: data.code,
          notes: data.notes,
          tempRange: data.tempRange,
          humidityRange: data.humidityRange,
          path,
          sortOrder: state.locations.length + 1,
          isActive: true,
        };
        await addLocation(newLocation);

        if (data.parentId) {
          setExpandedIds(prev => new Set([...prev, data.parentId!]));
        }

        toast.success(`Added ${data.name}`);
      }

      setShowForm(false);
      setEditingLocation(null);
      setParentForNew(null);
    } catch (error) {
      toast.error('Failed to save location');
    }
  };

  const expandAll = () => {
    setExpandedIds(new Set(state.locations.map(l => l.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Left Panel - Tree View */}
      <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-950/50 border border-purple-800 flex items-center justify-center text-purple-400">
                <Icons.Map />
              </div>
              <div>
                <h3 className="font-semibold text-white">Lab Spaces</h3>
                <p className="text-xs text-zinc-500">
                  Manage your lab locations and environments
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex bg-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('tree')}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    viewMode === 'tree' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tree
                </button>
                <button
                  onClick={() => setViewMode('dashboard')}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    viewMode === 'dashboard' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Overview
                </button>
              </div>
              <button
                onClick={handleAddRoot}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
              >
                <Icons.Plus />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>

          {/* Search and controls */}
          {viewMode === 'tree' && (
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={expandAll}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Expand all"
              >
                <Icons.ChevronDown />
              </button>
              <button
                onClick={collapseAll}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Collapse all"
              >
                <Icons.ChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2 max-h-[600px] overflow-y-auto">
          {viewMode === 'dashboard' ? (
            <DashboardOverview
              locations={filteredLocations}
              cultures={state.cultures}
              grows={state.grows}
              strains={strains}
            />
          ) : locationTree.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                <Icons.Map />
              </div>
              <p className="text-zinc-400 mb-2">No locations yet</p>
              <p className="text-sm text-zinc-500 mb-4">
                Set up your lab by adding facilities, rooms, and chambers.
              </p>
              <button
                onClick={handleAddRoot}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm"
              >
                Add First Location
              </button>
            </div>
          ) : (
            locationTree.map(node => (
              <TreeItem
                key={node.id}
                node={node}
                expandedIds={expandedIds}
                selectedId={selectedLocation?.id}
                onToggle={handleToggle}
                onSelect={handleSelect}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddChild={handleAddChild}
                cultures={state.cultures}
                grows={state.grows}
                strains={strains}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Details or Dashboard */}
      <div className="lg:col-span-1">
        {selectedLocation ? (
          <LocationDetailsPanel
            location={selectedLocation}
            locations={state.locations}
            cultures={state.cultures}
            grows={state.grows}
            strains={strains}
            onEdit={handleEdit}
            onClose={() => setSelectedLocation(null)}
            onNavigate={onNavigate}
            temperatureUnit={temperatureUnit}
          />
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                <Icons.Map />
              </div>
              <p className="text-zinc-400 mb-1">Select a location</p>
              <p className="text-sm text-zinc-500">
                Click on any location to view details and contents
              </p>
            </div>

            {/* Quick Create Chambers */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-zinc-400 mb-3">Quick Create</h4>
              <div className="grid grid-cols-2 gap-2">
                {(['incubator', 'fruiting_chamber', 'cold_storage', 'martha_tent'] as EnvironmentType[]).map(type => {
                  const preset = environmentPresets[type];
                  const Icon = preset.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setEditingLocation(null);
                        setParentForNew(null);
                        setShowForm(true);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${preset.borderColor} hover:${preset.bgColor}`}
                    >
                      <span className={preset.color}><Icon /></span>
                      <span className="text-xs text-zinc-300">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal - Uses canonical LocationForm for consistency */}
      <LocationFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingLocation(null);
          setParentForNew(null);
        }}
        onSave={handleSave}
        initialData={editingLocation ? {
          name: editingLocation.name,
          level: editingLocation.level,
          parentId: editingLocation.parentId || null,
          roomPurposes: editingLocation.roomPurposes || (editingLocation.roomPurpose ? [editingLocation.roomPurpose] : []),
          capacity: editingLocation.capacity,
          code: editingLocation.code,
          notes: editingLocation.notes,
          description: editingLocation.description,
          tempRange: editingLocation.tempRange,
          humidityRange: editingLocation.humidityRange,
        } : undefined}
        parentLocation={parentForNew ? state.locations.find(l => l.id === parentForNew) : undefined}
      />
    </div>
  );
};

export default LabSpaces;
