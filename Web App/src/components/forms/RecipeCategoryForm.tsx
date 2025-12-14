// ============================================================================
// RECIPE CATEGORY FORM - Create/edit recipe categories
// ============================================================================

import React from 'react';

export interface RecipeCategoryFormData {
  name: string;
  code: string;
  icon: string;
  color: string;
  notes: string;
}

interface RecipeCategoryFormProps {
  data: RecipeCategoryFormData;
  onChange: (updates: Partial<RecipeCategoryFormData>) => void;
  errors?: Record<string, string>;
}

// Common category presets
const categoryPresets = [
  { name: 'Agar', icon: '🧫', code: 'agar', color: 'text-purple-400 bg-purple-950/50' },
  { name: 'Liquid Culture', icon: '💧', code: 'liquid_culture', color: 'text-blue-400 bg-blue-950/50' },
  { name: 'Grain Spawn', icon: '🌾', code: 'grain_spawn', color: 'text-amber-400 bg-amber-950/50' },
  { name: 'Bulk Substrate', icon: '🪵', code: 'bulk_substrate', color: 'text-orange-400 bg-orange-950/50' },
  { name: 'Casing', icon: '🥥', code: 'casing', color: 'text-emerald-400 bg-emerald-950/50' },
  { name: 'Other', icon: '📦', code: 'other', color: 'text-zinc-400 bg-zinc-800' },
];

// Color options
const colorOptions = [
  { value: 'text-purple-400 bg-purple-950/50', label: 'Purple' },
  { value: 'text-blue-400 bg-blue-950/50', label: 'Blue' },
  { value: 'text-amber-400 bg-amber-950/50', label: 'Amber' },
  { value: 'text-orange-400 bg-orange-950/50', label: 'Orange' },
  { value: 'text-emerald-400 bg-emerald-950/50', label: 'Emerald' },
  { value: 'text-red-400 bg-red-950/50', label: 'Red' },
  { value: 'text-pink-400 bg-pink-950/50', label: 'Pink' },
  { value: 'text-cyan-400 bg-cyan-950/50', label: 'Cyan' },
  { value: 'text-zinc-400 bg-zinc-800', label: 'Gray' },
];

export const RecipeCategoryForm: React.FC<RecipeCategoryFormProps> = ({
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
  const applyPreset = (preset: typeof categoryPresets[0]) => {
    onChange({
      name: preset.name,
      code: preset.code,
      icon: preset.icon,
      color: preset.color,
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Select Presets */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Quick Select</label>
        <div className="flex flex-wrap gap-2">
          {categoryPresets.map((preset) => (
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
              <span className="mr-1">{preset.icon}</span>
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Category Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
          placeholder="e.g., Liquid Culture"
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
          placeholder="liquid_culture"
        />
        <p className="text-xs text-zinc-500 mt-1">Auto-generated from name if left blank</p>
      </div>

      {/* Icon & Color */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Icon (emoji)</label>
          <input
            type="text"
            value={data.icon}
            onChange={(e) => onChange({ icon: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-center text-2xl"
            maxLength={4}
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Color</label>
          <select
            value={data.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
          >
            {colorOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Preview</label>
        <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-3">
          <span className="text-2xl">{data.icon}</span>
          <span className={`px-2 py-0.5 rounded text-sm ${data.color}`}>
            {data.name || 'Category Name'}
          </span>
        </div>
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

export default RecipeCategoryForm;
