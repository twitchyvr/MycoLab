// ============================================================================
// LOCATION FORM - Full form for creating/editing locations
// ============================================================================

import React from 'react';

export interface LocationFormData {
  name: string;
  type: 'incubation' | 'fruiting' | 'storage' | 'lab' | 'other';
  description?: string;
  tempRange?: { min: number; max: number };
  humidityRange?: { min: number; max: number };
  notes?: string;
  isActive: boolean;
}

interface LocationFormProps {
  data: LocationFormData;
  onChange: (data: Partial<LocationFormData>) => void;
  errors?: Record<string, string>;
}

const locationTypes = [
  { value: 'incubation', label: 'Incubation', icon: '🌡️', description: 'Warm area for colonization' },
  { value: 'fruiting', label: 'Fruiting', icon: '🍄', description: 'Controlled environment for fruiting' },
  { value: 'storage', label: 'Storage', icon: '📦', description: 'General storage area' },
  { value: 'lab', label: 'Lab/Clean', icon: '🧪', description: 'Sterile work area' },
  { value: 'other', label: 'Other', icon: '📍', description: 'Custom location type' },
];

export const LocationForm: React.FC<LocationFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Location Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., Incubation Chamber, Martha Tent, Fridge #2"
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Location Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {locationTypes.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange({ type: type.value as LocationFormData['type'] })}
              className={`p-3 rounded-lg border text-left transition-all ${
                data.type === type.value
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{type.icon}</span>
                <span className="font-medium text-sm">{type.label}</span>
              </div>
              <div className="text-xs opacity-70 mt-1">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Description</label>
        <input
          type="text"
          value={data.description || ''}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Brief description of this location"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Temperature Range - only show for incubation/fruiting */}
      {(data.type === 'incubation' || data.type === 'fruiting') && (
        <div>
          <label className="block text-sm text-zinc-400 mb-2">
            Temperature Range (C)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Minimum</label>
              <input
                type="number"
                value={data.tempRange?.min || ''}
                onChange={e => onChange({
                  tempRange: {
                    ...data.tempRange,
                    min: parseInt(e.target.value) || 0,
                    max: data.tempRange?.max || 0,
                  },
                })}
                placeholder="e.g., 20"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Maximum</label>
              <input
                type="number"
                value={data.tempRange?.max || ''}
                onChange={e => onChange({
                  tempRange: {
                    ...data.tempRange,
                    min: data.tempRange?.min || 0,
                    max: parseInt(e.target.value) || 0,
                  },
                })}
                placeholder="e.g., 26"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Humidity Range - only show for fruiting */}
      {data.type === 'fruiting' && (
        <div>
          <label className="block text-sm text-zinc-400 mb-2">
            Humidity Range (%)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Minimum</label>
              <input
                type="number"
                value={data.humidityRange?.min || ''}
                onChange={e => onChange({
                  humidityRange: {
                    ...data.humidityRange,
                    min: parseInt(e.target.value) || 0,
                    max: data.humidityRange?.max || 0,
                  },
                })}
                placeholder="e.g., 80"
                min="0"
                max="100"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Maximum</label>
              <input
                type="number"
                value={data.humidityRange?.max || ''}
                onChange={e => onChange({
                  humidityRange: {
                    ...data.humidityRange,
                    min: data.humidityRange?.min || 0,
                    max: parseInt(e.target.value) || 0,
                  },
                })}
                placeholder="e.g., 95"
                min="0"
                max="100"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Notes</label>
        <textarea
          value={data.notes || ''}
          onChange={e => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Equipment details, maintenance notes..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

export default LocationForm;
