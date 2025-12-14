// ============================================================================
// RECIPE FORM - Quick form for creating recipes inline
// ============================================================================
// This is a simplified form for creating recipes from the "Add" button in
// dropdowns (e.g., when selecting a recipe for a culture). For full recipe
// editing with ingredients and instructions, use the RecipeBuilder component.
// ============================================================================

import React from 'react';
import type { RecipeCategory } from '../../store/types';

export interface RecipeFormData {
  name: string;
  category: RecipeCategory;
  description?: string;
  yield?: { amount: number; unit: string };
  prepTime?: number;
  sterilizationTime?: number;
  sterilizationPsi?: number;
  notes?: string;
  isActive: boolean;
}

interface RecipeFormProps {
  data: RecipeFormData;
  onChange: (data: Partial<RecipeFormData>) => void;
  errors?: Record<string, string>;
  recipeCategories?: Array<{ id: string; name: string; code: string }>;
}

const defaultCategories = [
  { value: 'agar', label: 'Agar', icon: '🧫', description: 'Agar plate media recipes' },
  { value: 'liquid_culture', label: 'Liquid Culture', icon: '💧', description: 'LC media recipes' },
  { value: 'grain_spawn', label: 'Grain Spawn', icon: '🌾', description: 'Grain preparation recipes' },
  { value: 'bulk_substrate', label: 'Bulk Substrate', icon: '🪵', description: 'Fruiting substrates' },
  { value: 'casing', label: 'Casing', icon: '🧱', description: 'Casing layer recipes' },
  { value: 'other', label: 'Other', icon: '📦', description: 'Other recipe types' },
];

const yieldUnits = ['ml', 'L', 'g', 'kg', 'jars', 'plates', 'bags'];

export const RecipeForm: React.FC<RecipeFormProps> = ({
  data,
  onChange,
  errors = {},
  recipeCategories = [],
}) => {
  // Combine default categories with custom ones
  const allCategories = [
    ...defaultCategories,
    ...recipeCategories
      .filter(cat => !defaultCategories.some(d => d.value === cat.code))
      .map(cat => ({
        value: cat.code,
        label: cat.name,
        icon: '📋',
        description: 'Custom category',
      })),
  ];

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Recipe Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., MEA, PDYA, Oat Grain Prep, CVG Substrate"
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Category <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {allCategories.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => onChange({ category: cat.value })}
              className={`p-3 rounded-lg border text-left transition-all ${
                data.category === cat.value
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="font-medium text-sm">{cat.label}</span>
              </div>
              <div className="text-xs opacity-70 mt-1 line-clamp-1">{cat.description}</div>
            </button>
          ))}
        </div>
        {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Description</label>
        <textarea
          value={data.description || ''}
          onChange={e => onChange({ description: e.target.value })}
          rows={2}
          placeholder="Brief description of this recipe..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Yield */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Yield</label>
        <div className="flex gap-3">
          <input
            type="number"
            value={data.yield?.amount || ''}
            onChange={e => onChange({
              yield: {
                amount: parseInt(e.target.value) || 0,
                unit: data.yield?.unit || 'ml',
              },
            })}
            placeholder="Amount"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          />
          <select
            value={data.yield?.unit || 'ml'}
            onChange={e => onChange({
              yield: {
                amount: data.yield?.amount || 0,
                unit: e.target.value,
              },
            })}
            className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          >
            {yieldUnits.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          How much this recipe produces
        </p>
      </div>

      {/* Timing */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Prep Time</label>
          <div className="relative">
            <input
              type="number"
              value={data.prepTime || ''}
              onChange={e => onChange({ prepTime: parseInt(e.target.value) || undefined })}
              placeholder="15"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">min</span>
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Sterilization</label>
          <div className="relative">
            <input
              type="number"
              value={data.sterilizationTime || ''}
              onChange={e => onChange({ sterilizationTime: parseInt(e.target.value) || undefined })}
              placeholder="45"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">min</span>
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Pressure</label>
          <div className="relative">
            <input
              type="number"
              value={data.sterilizationPsi || ''}
              onChange={e => onChange({ sterilizationPsi: parseInt(e.target.value) || undefined })}
              placeholder="15"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">PSI</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Notes</label>
        <textarea
          value={data.notes || ''}
          onChange={e => onChange({ notes: e.target.value })}
          rows={2}
          placeholder="Tips, variations, or additional information..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      <p className="text-xs text-zinc-500">
        This creates a basic recipe entry. Use the Recipe Builder for full recipe editing with ingredients and instructions.
      </p>
    </div>
  );
};

export default RecipeForm;
