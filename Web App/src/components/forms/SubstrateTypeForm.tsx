// ============================================================================
// SUBSTRATE TYPE FORM - Full form for creating/editing substrate types
// ============================================================================

import React from 'react';

export interface SubstrateTypeFormData {
  name: string;
  code: string;
  category: 'grain' | 'bulk' | 'casing' | 'supplement' | 'other';
  notes?: string;
  isActive: boolean;
}

interface SubstrateTypeFormProps {
  data: SubstrateTypeFormData;
  onChange: (data: Partial<SubstrateTypeFormData>) => void;
  errors?: Record<string, string>;
}

const categories = [
  { value: 'grain', label: 'Grain Spawn', description: 'Colonized grain for spawning' },
  { value: 'bulk', label: 'Bulk Substrate', description: 'Main fruiting substrate' },
  { value: 'casing', label: 'Casing Layer', description: 'Top layer for moisture retention' },
  { value: 'supplement', label: 'Supplement', description: 'Nutritional additives' },
  { value: 'other', label: 'Other', description: 'Custom category' },
];

const commonSubstrates = [
  { name: 'CVG (Coco Coir, Vermiculite, Gypsum)', code: 'cvg', category: 'bulk' },
  { name: 'Pasteurized Straw', code: 'straw', category: 'bulk' },
  { name: 'Hardwood Fuel Pellets', code: 'hwfp', category: 'bulk' },
  { name: 'Masters Mix (50/50 HWFP/Soy)', code: 'masters', category: 'bulk' },
  { name: 'Manure-Based', code: 'manure', category: 'bulk' },
  { name: 'Peat Moss Casing', code: 'peat', category: 'casing' },
  { name: 'Vermiculite Casing', code: 'verm', category: 'casing' },
];

export const SubstrateTypeForm: React.FC<SubstrateTypeFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  const handleQuickSelect = (substrate: typeof commonSubstrates[0]) => {
    onChange({
      name: substrate.name,
      code: substrate.code,
      category: substrate.category as SubstrateTypeFormData['category'],
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Select */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Quick Select</label>
        <div className="flex flex-wrap gap-2">
          {commonSubstrates.map(substrate => (
            <button
              key={substrate.code}
              type="button"
              onClick={() => handleQuickSelect(substrate)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                data.name === substrate.name
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-600'
              }`}
            >
              {substrate.name.length > 20 ? substrate.code.toUpperCase() : substrate.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Category <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => onChange({ category: cat.value as SubstrateTypeFormData['category'] })}
              className={`p-3 rounded-lg border text-left transition-all ${
                data.category === cat.value
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <div className="font-medium text-sm">{cat.label}</div>
              <div className="text-xs opacity-70 mt-1">{cat.description}</div>
            </button>
          ))}
        </div>
        {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category}</p>}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Substrate Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., CVG, Masters Mix, Pasteurized Straw"
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
          placeholder="e.g., cvg, straw, hwfp"
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
          placeholder="Prep instructions, field capacity, pasteurization method..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

export default SubstrateTypeForm;
