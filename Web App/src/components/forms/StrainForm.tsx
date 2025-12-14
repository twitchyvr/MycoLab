// ============================================================================
// STRAIN FORM - Full form for creating/editing strains
// ============================================================================

import React from 'react';
import type { Strain } from '../../store/types';

export interface StrainFormData {
  name: string;
  species: string;
  speciesId?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  colonizationDays: { min: number; max: number };
  fruitingDays: { min: number; max: number };
  optimalTempColonization: { min: number; max: number };
  optimalTempFruiting: { min: number; max: number };
  notes?: string;
  isActive: boolean;
}

interface StrainFormProps {
  data: StrainFormData;
  onChange: (data: Partial<StrainFormData>) => void;
  errors?: Record<string, string>;
  species?: Array<{ id: string; name: string }>;
}

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner', description: 'Easy to grow, forgiving of mistakes' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience recommended' },
  { value: 'advanced', label: 'Advanced', description: 'Requires precise conditions' },
];

export const StrainForm: React.FC<StrainFormProps> = ({
  data,
  onChange,
  errors = {},
  species = [],
}) => {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Strain Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., Golden Teacher, B+, Lion's Mane"
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Species */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Species <span className="text-red-400">*</span>
        </label>
        {species.length > 0 ? (
          <select
            value={data.speciesId || ''}
            onChange={e => {
              const selected = species.find(s => s.id === e.target.value);
              onChange({
                speciesId: e.target.value,
                species: selected?.name || '',
              });
            }}
            className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
              errors.species ? 'border-red-500' : 'border-zinc-700'
            }`}
          >
            <option value="">Select species...</option>
            {species.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={data.species || ''}
            onChange={e => onChange({ species: e.target.value })}
            placeholder="e.g., Psilocybe cubensis, Hericium erinaceus"
            className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
              errors.species ? 'border-red-500' : 'border-zinc-700'
            }`}
          />
        )}
        {errors.species && <p className="text-xs text-red-400 mt-1">{errors.species}</p>}
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Difficulty Level</label>
        <div className="grid grid-cols-3 gap-2">
          {difficultyOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ difficulty: opt.value as StrainFormData['difficulty'] })}
              className={`p-3 rounded-lg border text-left transition-all ${
                data.difficulty === opt.value
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <div className="font-medium text-sm">{opt.label}</div>
              <div className="text-xs opacity-70 mt-1">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Colonization Time */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Colonization Time (days)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Minimum</label>
            <input
              type="number"
              value={data.colonizationDays?.min || ''}
              onChange={e => onChange({
                colonizationDays: {
                  ...data.colonizationDays,
                  min: parseInt(e.target.value) || 0,
                },
              })}
              min="1"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Maximum</label>
            <input
              type="number"
              value={data.colonizationDays?.max || ''}
              onChange={e => onChange({
                colonizationDays: {
                  ...data.colonizationDays,
                  max: parseInt(e.target.value) || 0,
                },
              })}
              min="1"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Fruiting Time */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Fruiting Time (days)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Minimum</label>
            <input
              type="number"
              value={data.fruitingDays?.min || ''}
              onChange={e => onChange({
                fruitingDays: {
                  ...data.fruitingDays,
                  min: parseInt(e.target.value) || 0,
                },
              })}
              min="1"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Maximum</label>
            <input
              type="number"
              value={data.fruitingDays?.max || ''}
              onChange={e => onChange({
                fruitingDays: {
                  ...data.fruitingDays,
                  max: parseInt(e.target.value) || 0,
                },
              })}
              min="1"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Colonization Temperature */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Optimal Colonization Temperature (C)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Minimum</label>
            <input
              type="number"
              value={data.optimalTempColonization?.min || ''}
              onChange={e => onChange({
                optimalTempColonization: {
                  ...data.optimalTempColonization,
                  min: parseInt(e.target.value) || 0,
                },
              })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Maximum</label>
            <input
              type="number"
              value={data.optimalTempColonization?.max || ''}
              onChange={e => onChange({
                optimalTempColonization: {
                  ...data.optimalTempColonization,
                  max: parseInt(e.target.value) || 0,
                },
              })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Fruiting Temperature */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Optimal Fruiting Temperature (C)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Minimum</label>
            <input
              type="number"
              value={data.optimalTempFruiting?.min || ''}
              onChange={e => onChange({
                optimalTempFruiting: {
                  ...data.optimalTempFruiting,
                  min: parseInt(e.target.value) || 0,
                },
              })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Maximum</label>
            <input
              type="number"
              value={data.optimalTempFruiting?.max || ''}
              onChange={e => onChange({
                optimalTempFruiting: {
                  ...data.optimalTempFruiting,
                  max: parseInt(e.target.value) || 0,
                },
              })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Notes</label>
        <textarea
          value={data.notes || ''}
          onChange={e => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Growing tips, characteristics, yield expectations..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

export default StrainForm;
