// ============================================================================
// LAB MAPPING COMPONENT
// Hierarchical location management for farm/lab operations
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../../store';
import { useNotifications } from '../../store/NotificationContext';
import type { Location, LocationLevel, RoomPurpose } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface LabMappingProps {
  onLocationSelect?: (location: Location) => void;
  selectedLocationId?: string;
  mode?: 'manage' | 'select';
  className?: string;
}

interface LocationTreeNode extends Location {
  children: LocationTreeNode[];
  depth: number;
}

interface LocationFormData {
  name: string;
  level: LocationLevel;
  parentId: string | null;
  roomPurpose?: RoomPurpose;
  capacity?: number;
  code?: string;
  notes?: string;
  tempRange?: { min: number; max: number };
  humidityRange?: { min: number; max: number };
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Facility: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M10 11h.01M10 15h.01M14 11h.01M14 15h.01M18 11h.01M18 15h.01"/>
      <path d="M3 7l9-4 9 4"/>
    </svg>
  ),
  Room: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 3v18M15 14l-3 3-3-3"/>
    </svg>
  ),
  Zone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M3 6h18M3 12h18M3 18h18"/>
    </svg>
  ),
  Rack: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="4" y="2" width="16" height="20" rx="1"/>
      <line x1="4" y1="7" x2="20" y2="7"/>
      <line x1="4" y1="12" x2="20" y2="12"/>
      <line x1="4" y1="17" x2="20" y2="17"/>
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
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Map: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  Tree: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M12 3v18M12 8l-4 4M12 8l4 4M12 15l-3 3M12 15l3 3"/>
    </svg>
  ),
};

// Level icons mapping
const levelIcons: Record<LocationLevel, React.FC> = {
  facility: Icons.Facility,
  room: Icons.Room,
  zone: Icons.Zone,
  rack: Icons.Rack,
  shelf: Icons.Shelf,
  slot: Icons.Slot,
};

// Level colors
const levelColors: Record<LocationLevel, { bg: string; border: string; text: string }> = {
  facility: { bg: 'bg-purple-950/50', border: 'border-purple-800', text: 'text-purple-400' },
  room: { bg: 'bg-blue-950/50', border: 'border-blue-800', text: 'text-blue-400' },
  zone: { bg: 'bg-cyan-950/50', border: 'border-cyan-800', text: 'text-cyan-400' },
  rack: { bg: 'bg-emerald-950/50', border: 'border-emerald-800', text: 'text-emerald-400' },
  shelf: { bg: 'bg-amber-950/50', border: 'border-amber-800', text: 'text-amber-400' },
  slot: { bg: 'bg-zinc-800/50', border: 'border-zinc-700', text: 'text-zinc-400' },
};

// Room purpose labels and colors
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

  // Create nodes with empty children arrays
  locations.forEach(loc => {
    locationMap.set(loc.id, { ...loc, children: [], depth: 0 });
  });

  // Build tree structure
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

  // Sort children by sortOrder
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

  return path.join(' / ');
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

// ============================================================================
// LOCATION TREE ITEM COMPONENT
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
  mode: 'manage' | 'select';
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
  mode,
}) => {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;
  const level = node.level || 'room';
  const LevelIcon = levelIcons[level];
  const colors = levelColors[level];

  const occupancyPercent = node.capacity && node.currentOccupancy
    ? Math.round((node.currentOccupancy / node.capacity) * 100)
    : null;

  return (
    <div className="select-none">
      {/* Node row */}
      <div
        className={`
          group flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer
          ${isSelected
            ? `${colors.bg} ${colors.border} border`
            : 'hover:bg-zinc-800/50'
          }
        `}
        style={{ paddingLeft: `${node.depth * 24 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {/* Expand/collapse button */}
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
          <LevelIcon />
        </div>

        {/* Name and info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium truncate ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
              {node.name}
            </span>
            {node.code && (
              <span className="text-xs text-zinc-500 font-mono">
                [{node.code}]
              </span>
            )}
          </div>
          {node.roomPurpose && (
            <span className={`text-xs ${roomPurposeConfig[node.roomPurpose].color}`}>
              {roomPurposeConfig[node.roomPurpose].label}
            </span>
          )}
        </div>

        {/* Occupancy indicator */}
        {occupancyPercent !== null && (
          <div className="flex items-center gap-1">
            <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  occupancyPercent > 90 ? 'bg-red-500' :
                  occupancyPercent > 70 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500">
              {node.currentOccupancy}/{node.capacity}
            </span>
          </div>
        )}

        {/* Actions (only in manage mode) */}
        {mode === 'manage' && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
              className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700 rounded transition-colors"
              title="Add child location"
            >
              <Icons.Plus />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(node); }}
              className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-zinc-700 rounded transition-colors"
              title="Edit location"
            >
              <Icons.Edit />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(node); }}
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors"
              title="Delete location"
            >
              <Icons.Trash />
            </button>
          </div>
        )}
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
              mode={mode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// LOCATION FORM MODAL
// ============================================================================

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LocationFormData) => void;
  initialData?: Partial<LocationFormData>;
  parentLocation?: Location;
  locations: Location[];
}

const LocationFormModal: React.FC<LocationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  parentLocation,
  locations,
}) => {
  const [formData, setFormData] = useState<LocationFormData>({
    name: initialData?.name || '',
    level: initialData?.level || (parentLocation ? getNextLevel(parentLocation.level) : 'facility'),
    parentId: initialData?.parentId || parentLocation?.id || null,
    roomPurpose: initialData?.roomPurpose,
    capacity: initialData?.capacity,
    code: initialData?.code || '',
    notes: initialData?.notes || '',
    tempRange: initialData?.tempRange,
    humidityRange: initialData?.humidityRange,
  });

  const [showEnvironmental, setShowEnvironmental] = useState(
    !!(initialData?.tempRange || initialData?.humidityRange)
  );

  function getNextLevel(parentLevel?: LocationLevel): LocationLevel {
    const levelOrder: LocationLevel[] = ['facility', 'room', 'zone', 'rack', 'shelf', 'slot'];
    if (!parentLevel) return 'facility';
    const idx = levelOrder.indexOf(parentLevel);
    return levelOrder[Math.min(idx + 1, levelOrder.length - 1)];
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {initialData?.name ? 'Edit Location' : 'Add Location'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <Icons.X />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g., Main Grow Room"
            />
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Level *</label>
            <select
              value={formData.level}
              onChange={(e) => setFormData(d => ({ ...d, level: e.target.value as LocationLevel }))}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="facility">Facility (Building)</option>
              <option value="room">Room</option>
              <option value="zone">Zone (Area)</option>
              <option value="rack">Rack</option>
              <option value="shelf">Shelf</option>
              <option value="slot">Slot (Position)</option>
            </select>
          </div>

          {/* Parent Location */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Parent Location</label>
            <select
              value={formData.parentId || ''}
              onChange={(e) => setFormData(d => ({ ...d, parentId: e.target.value || null }))}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">(No parent - top level)</option>
              {locations
                .filter(l => l.isActive)
                .map(l => (
                  <option key={l.id} value={l.id}>
                    {getLocationPath(l.id, locations)}
                  </option>
                ))}
            </select>
          </div>

          {/* Room Purpose (only for room level) */}
          {(formData.level === 'room' || formData.level === 'zone') && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Purpose</label>
              <select
                value={formData.roomPurpose || ''}
                onChange={(e) => setFormData(d => ({
                  ...d,
                  roomPurpose: (e.target.value || undefined) as RoomPurpose | undefined
                }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select purpose...</option>
                {Object.entries(roomPurposeConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Code and Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(d => ({ ...d, code: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g., GR-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Capacity</label>
              <input
                type="number"
                value={formData.capacity || ''}
                onChange={(e) => setFormData(d => ({ ...d, capacity: parseInt(e.target.value) || undefined }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="Max items"
              />
            </div>
          </div>

          {/* Environmental Toggle */}
          <button
            type="button"
            onClick={() => setShowEnvironmental(!showEnvironmental)}
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            {showEnvironmental ? '- Hide' : '+ Add'} Environmental Targets
          </button>

          {/* Environmental Ranges */}
          {showEnvironmental && (
            <div className="space-y-3 p-3 bg-zinc-800/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Temp Min (°F)</label>
                  <input
                    type="number"
                    value={formData.tempRange?.min || ''}
                    onChange={(e) => setFormData(d => ({
                      ...d,
                      tempRange: { ...d.tempRange, min: parseInt(e.target.value) || 0, max: d.tempRange?.max || 0 }
                    }))}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Temp Max (°F)</label>
                  <input
                    type="number"
                    value={formData.tempRange?.max || ''}
                    onChange={(e) => setFormData(d => ({
                      ...d,
                      tempRange: { ...d.tempRange, min: d.tempRange?.min || 0, max: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Humidity Min (%)</label>
                  <input
                    type="number"
                    value={formData.humidityRange?.min || ''}
                    onChange={(e) => setFormData(d => ({
                      ...d,
                      humidityRange: { ...d.humidityRange, min: parseInt(e.target.value) || 0, max: d.humidityRange?.max || 0 }
                    }))}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Humidity Max (%)</label>
                  <input
                    type="number"
                    value={formData.humidityRange?.max || ''}
                    onChange={(e) => setFormData(d => ({
                      ...d,
                      humidityRange: { ...d.humidityRange, min: d.humidityRange?.min || 0, max: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(d => ({ ...d, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors"
          >
            Save Location
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
  onEdit: (location: Location) => void;
  onClose: () => void;
  cultures: { id: string; label: string; locationId: string }[];
  grows: { id: string; name: string; locationId: string }[];
}

const LocationDetailsPanel: React.FC<LocationDetailsPanelProps> = ({
  location,
  locations,
  onEdit,
  onClose,
  cultures,
  grows,
}) => {
  const level = location.level || 'room';
  const colors = levelColors[level];
  const LevelIcon = levelIcons[level];

  // Get items at this location
  const locationCultures = cultures.filter(c => c.locationId === location.id);
  const locationGrows = grows.filter(g => g.locationId === location.id);

  // Get child locations
  const childLocations = locations.filter(l => l.parentId === location.id);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${colors.bg} border-b ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={colors.text}>
              <LevelIcon />
            </div>
            <div>
              <h3 className="font-semibold text-white">{location.name}</h3>
              <p className="text-xs text-zinc-400">
                {getLocationPath(location.id, locations)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(location)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Icons.Edit />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Icons.X />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          {location.code && (
            <div>
              <p className="text-xs text-zinc-500">Code</p>
              <p className="font-mono text-white">{location.code}</p>
            </div>
          )}
          {location.roomPurpose && (
            <div>
              <p className="text-xs text-zinc-500">Purpose</p>
              <p className={roomPurposeConfig[location.roomPurpose].color}>
                {roomPurposeConfig[location.roomPurpose].label}
              </p>
            </div>
          )}
          {location.capacity && (
            <div>
              <p className="text-xs text-zinc-500">Capacity</p>
              <p className="text-white">
                {location.currentOccupancy || 0} / {location.capacity}
              </p>
            </div>
          )}
          {location.tempRange && (
            <div>
              <p className="text-xs text-zinc-500">Temperature</p>
              <p className="text-white">
                {location.tempRange.min}° - {location.tempRange.max}°F
              </p>
            </div>
          )}
          {location.humidityRange && (
            <div>
              <p className="text-xs text-zinc-500">Humidity</p>
              <p className="text-white">
                {location.humidityRange.min}% - {location.humidityRange.max}%
              </p>
            </div>
          )}
        </div>

        {/* Child Locations */}
        {childLocations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-2">
              Sub-locations ({childLocations.length})
            </h4>
            <div className="space-y-1">
              {childLocations.slice(0, 5).map(child => {
                const childLevel = child.level || 'room';
                const ChildIcon = levelIcons[childLevel];
                return (
                  <div key={child.id} className="flex items-center gap-2 text-sm">
                    <span className={levelColors[childLevel].text}>
                      <ChildIcon />
                    </span>
                    <span className="text-zinc-300">{child.name}</span>
                  </div>
                );
              })}
              {childLocations.length > 5 && (
                <p className="text-xs text-zinc-500">
                  +{childLocations.length - 5} more...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Items in Location */}
        {(locationCultures.length > 0 || locationGrows.length > 0) && (
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-2">Items Here</h4>
            {locationCultures.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-zinc-500 mb-1">Cultures ({locationCultures.length})</p>
                <div className="flex flex-wrap gap-1">
                  {locationCultures.slice(0, 5).map(c => (
                    <span key={c.id} className="px-2 py-0.5 bg-blue-950/50 text-blue-400 text-xs rounded">
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {locationGrows.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Grows ({locationGrows.length})</p>
                <div className="flex flex-wrap gap-1">
                  {locationGrows.slice(0, 5).map(g => (
                    <span key={g.id} className="px-2 py-0.5 bg-emerald-950/50 text-emerald-400 text-xs rounded">
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {location.notes && (
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-1">Notes</h4>
            <p className="text-sm text-zinc-300">{location.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LabMapping: React.FC<LabMappingProps> = ({
  onLocationSelect,
  selectedLocationId,
  mode = 'manage',
  className = '',
}) => {
  const { state, addLocation, updateLocation, deleteLocation, generateId } = useData();
  const { toast } = useNotifications();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [parentForNew, setParentForNew] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'map'>('tree');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Stats
  const stats = useMemo(() => {
    const active = state.locations.filter(l => l.isActive);
    return {
      total: active.length,
      facilities: active.filter(l => l.level === 'facility').length,
      rooms: active.filter(l => l.level === 'room').length,
      racks: active.filter(l => l.level === 'rack' || l.level === 'shelf' || l.level === 'slot').length,
    };
  }, [state.locations]);

  // Handlers
  const handleToggle = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback((location: Location) => {
    setSelectedLocation(location);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  }, [onLocationSelect]);

  const handleAddRoot = () => {
    setEditingLocation(null);
    setParentForNew(null);
    setShowForm(true);
  };

  const handleAddChild = (parentId: string) => {
    setEditingLocation(null);
    setParentForNew(parentId);
    setShowForm(true);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setParentForNew(null);
    setShowForm(true);
  };

  const handleDelete = async (location: Location) => {
    const descendants = getDescendantIds(location.id, state.locations);
    const totalToDelete = descendants.length + 1;

    if (totalToDelete > 1) {
      const confirmed = window.confirm(
        `Delete "${location.name}" and ${descendants.length} sub-location(s)?`
      );
      if (!confirmed) return;
    }

    try {
      // Delete descendants first
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
        ? `${getLocationPath(data.parentId, state.locations)} / ${data.name}`
        : data.name;

      if (editingLocation) {
        await updateLocation(editingLocation.id, {
          ...editingLocation,
          name: data.name,
          level: data.level,
          parentId: data.parentId || undefined,
          roomPurpose: data.roomPurpose,
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
          roomPurpose: data.roomPurpose,
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

        // Auto-expand parent
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
    const allIds = new Set(state.locations.map(l => l.id));
    setExpandedIds(allIds);
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
                <h3 className="font-semibold text-white">Lab Mapping</h3>
                <p className="text-xs text-zinc-500">
                  {stats.total} locations • {stats.facilities} facilities • {stats.rooms} rooms
                </p>
              </div>
            </div>
            {mode === 'manage' && (
              <button
                onClick={handleAddRoot}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
              >
                <Icons.Plus />
                <span className="hidden sm:inline">Add Location</span>
              </button>
            )}
          </div>

          {/* Search and controls */}
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
        </div>

        {/* Tree View */}
        <div className="p-2 max-h-[600px] overflow-y-auto">
          {locationTree.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                <Icons.Map />
              </div>
              <p className="text-zinc-400 mb-2">No locations yet</p>
              <p className="text-sm text-zinc-500 mb-4">
                Create your lab structure by adding facilities, rooms, racks, and shelves.
              </p>
              {mode === 'manage' && (
                <button
                  onClick={handleAddRoot}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm"
                >
                  Add First Location
                </button>
              )}
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
                mode={mode}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Details */}
      <div className="lg:col-span-1">
        {selectedLocation ? (
          <LocationDetailsPanel
            location={selectedLocation}
            locations={state.locations}
            onEdit={handleEdit}
            onClose={() => setSelectedLocation(null)}
            cultures={state.cultures.map(c => ({ id: c.id, label: c.label, locationId: c.locationId }))}
            grows={state.grows.map(g => ({ id: g.id, name: g.name, locationId: g.locationId }))}
          />
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600">
              <Icons.Facility />
            </div>
            <p className="text-zinc-400 mb-1">Select a location</p>
            <p className="text-sm text-zinc-500">
              Click on any location to view details
            </p>
          </div>
        )}

        {/* Quick legend */}
        <div className="mt-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h4 className="text-sm font-medium text-zinc-400 mb-3">Location Types</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(levelColors).map(([level, colors]) => {
              const Icon = levelIcons[level as LocationLevel];
              return (
                <div key={level} className="flex items-center gap-2">
                  <span className={colors.text}><Icon /></span>
                  <span className="text-xs text-zinc-400 capitalize">{level}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Modal */}
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
          roomPurpose: editingLocation.roomPurpose,
          capacity: editingLocation.capacity,
          code: editingLocation.code,
          notes: editingLocation.notes,
          tempRange: editingLocation.tempRange,
          humidityRange: editingLocation.humidityRange,
        } : undefined}
        parentLocation={parentForNew ? state.locations.find(l => l.id === parentForNew) : undefined}
        locations={state.locations}
      />
    </div>
  );
};

export default LabMapping;
