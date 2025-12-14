// ============================================================================
// INVENTORY CATEGORY FORM - Form for creating/editing inventory categories
// ============================================================================

import React from 'react';

export interface InventoryCategoryFormData {
  name: string;
  color?: string;
  icon?: string;
  notes?: string;
  isActive: boolean;
}

interface InventoryCategoryFormProps {
  data: InventoryCategoryFormData;
  onChange: (data: Partial<InventoryCategoryFormData>) => void;
  errors?: Record<string, string>;
}

const COLOR_OPTIONS = [
  { value: 'text-zinc-400 bg-zinc-800', label: 'Gray' },
  { value: 'text-emerald-400 bg-emerald-950/50', label: 'Green' },
  { value: 'text-blue-400 bg-blue-950/50', label: 'Blue' },
  { value: 'text-purple-400 bg-purple-950/50', label: 'Purple' },
  { value: 'text-amber-400 bg-amber-950/50', label: 'Amber' },
  { value: 'text-orange-400 bg-orange-950/50', label: 'Orange' },
  { value: 'text-red-400 bg-red-950/50', label: 'Red' },
  { value: 'text-pink-400 bg-pink-950/50', label: 'Pink' },
  { value: 'text-cyan-400 bg-cyan-950/50', label: 'Cyan' },
  { value: 'text-lime-400 bg-lime-950/50', label: 'Lime' },
];

const ICON_OPTIONS = [
  { value: '', label: 'None' },
  { value: '📦', label: 'Box' },
  { value: '🌾', label: 'Grain' },
  { value: '🧫', label: 'Petri Dish' },
  { value: '💊', label: 'Supplements' },
  { value: '🧪', label: 'Lab' },
  { value: '🔬', label: 'Microscope' },
  { value: '🧴', label: 'Bottle' },
  { value: '💧', label: 'Liquid' },
  { value: '🌿', label: 'Organic' },
  { value: '⚗️', label: 'Chemistry' },
  { value: '🛠️', label: 'Tools' },
  { value: '📋', label: 'Supplies' },
  { value: '🧹', label: 'Cleaning' },
  { value: '🔌', label: 'Electrical' },
  { value: '🌡️', label: 'Temperature' },
];

export const InventoryCategoryForm: React.FC<InventoryCategoryFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Category Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., Grains, Substrates, Lab Supplies, Media"
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
          autoFocus
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Icon */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Icon</label>
        <div className="grid grid-cols-8 gap-2">
          {ICON_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ icon: opt.value })}
              className={`p-2 rounded-lg border text-lg ${
                data.icon === opt.value
                  ? 'border-emerald-500 bg-emerald-950/30'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
              title={opt.label}
            >
              {opt.value || '—'}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Color</label>
        <div className="grid grid-cols-5 gap-2">
          {COLOR_OPTIONS.map(opt => {
            const [textColor, bgColor] = opt.value.split(' ');
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ color: opt.value })}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${textColor} ${bgColor} ${
                  data.color === opt.value
                    ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-900'
                    : ''
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Preview</label>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${data.color || 'text-zinc-400 bg-zinc-800'}`}>
            {data.icon && <span className="text-base">{data.icon}</span>}
            {data.name || 'Category Name'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InventoryCategoryForm;
