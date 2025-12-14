// ============================================================================
// LOCATION TYPE FORM - Create/edit location types
// ============================================================================

import React from 'react';

export interface LocationTypeFormData {
  name: string;
  code: string;
  description: string;
  notes: string;
}

interface LocationTypeFormProps {
  data: LocationTypeFormData;
  onChange: (updates: Partial<LocationTypeFormData>) => void;
  errors?: Record<string, string>;
}

// Common location type presets
const typePresets = [
  { name: 'Incubation Chamber', code: 'incubation_chamber', description: 'Warm, dark environment for colonization' },
  { name: 'Fruiting Chamber', code: 'fruiting_chamber', description: 'Humid environment with FAE for fruiting' },
  { name: 'Still Air Box', code: 'still_air_box', description: 'SAB for sterile transfers' },
  { name: 'Flow Hood', code: 'flow_hood', description: 'Laminar flow hood workspace' },
  { name: 'Storage Shelf', code: 'storage_shelf', description: 'General storage area' },
  { name: 'Refrigerator', code: 'refrigerator', description: 'Cold storage for cultures/spores' },
  { name: 'Lab Bench', code: 'lab_bench', description: 'General lab work surface' },
  { name: 'Greenhouse', code: 'greenhouse', description: 'Natural light growing environment' },
];

export const LocationTypeForm: React.FC<LocationTypeFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  // Auto-generate code from name
  const handleNameChange = (name: string) => {
    const code = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    onChange({ name, code: data.code || code });
  };

  // Apply preset
  const applyPreset = (preset: typeof typePresets[0]) => {
    onChange({
      name: preset.name,
      code: preset.code,
      description: preset.description,
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Select Presets */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Quick Select</label>
        <div className="flex flex-wrap gap-2">
          {typePresets.map((preset) => (
            <button
              key={preset.code}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                data.code === preset.code
                  ? 'border-emerald-500 bg-emerald-500/20'
                  : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Type Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
          placeholder="e.g., Fruiting Chamber"
          autoFocus
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Code */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Code</label>
        <input
          type="text"
          value={data.code}
          onChange={(e) => onChange({ code: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono"
          placeholder="fruiting_chamber"
        />
        <p className="text-xs text-zinc-500 mt-1">Auto-generated from name if left blank</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white resize-none"
          placeholder="Brief description of this location type..."
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Notes</label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={2}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white resize-none"
          placeholder="Optional notes..."
        />
      </div>
    </div>
  );
};

export default LocationTypeForm;
