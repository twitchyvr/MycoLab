// ============================================================================
// GRAIN TYPE FORM - Full form for creating/editing grain types
// ============================================================================

import React from 'react';

export interface GrainTypeFormData {
  name: string;
  code: string;
  notes?: string;
  isActive: boolean;
}

interface GrainTypeFormProps {
  data: GrainTypeFormData;
  onChange: (data: Partial<GrainTypeFormData>) => void;
  errors?: Record<string, string>;
}

const commonGrains = [
  { name: 'Rye Berries', code: 'rye' },
  { name: 'Whole Oats', code: 'oats' },
  { name: 'Wheat Berries', code: 'wheat' },
  { name: 'Millet', code: 'millet' },
  { name: 'Popcorn', code: 'popcorn' },
  { name: 'Wild Bird Seed', code: 'wbs' },
  { name: 'Brown Rice', code: 'brf' },
];

export const GrainTypeForm: React.FC<GrainTypeFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  const handleQuickSelect = (grain: typeof commonGrains[0]) => {
    onChange({ name: grain.name, code: grain.code });
  };

  return (
    <div className="space-y-4">
      {/* Quick Select */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Quick Select</label>
        <div className="flex flex-wrap gap-2">
          {commonGrains.map(grain => (
            <button
              key={grain.code}
              type="button"
              onClick={() => handleQuickSelect(grain)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                data.name === grain.name
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-600'
              }`}
            >
              {grain.name}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Grain Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., Rye Berries, Whole Oats"
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Code */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Short Code</label>
        <input
          type="text"
          value={data.code || ''}
          onChange={e => onChange({ code: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
          placeholder="e.g., rye, oats, wbs"
          maxLength={10}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Used for labels and quick reference
        </p>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Notes</label>
        <textarea
          value={data.notes || ''}
          onChange={e => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Prep instructions, hydration tips, where to source..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

export default GrainTypeForm;
