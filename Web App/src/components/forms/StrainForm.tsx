// ============================================================================
// STRAIN FORM - Full form for creating/editing strains
// ============================================================================

import React from 'react';
import type { Strain, Species } from '../../store/types';
import { formatSpeciesDisplay } from '../../utils/taxonomy';

export interface StrainFormData {
  name: string;
  species: string;
  speciesId?: string;
  // Variety/Phenotype
  variety?: string;
  phenotype?: string;
  geneticsSource?: string;
  isolationType?: 'multispore' | 'clone' | 'agar_isolation' | 'spore_isolation' | 'lc_isolation' | 'unknown';
  generation?: number;
  // Growing characteristics
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  colonizationDays: { min: number; max: number };
  fruitingDays: { min: number; max: number };
  optimalTempColonization: { min: number; max: number };
  optimalTempFruiting: { min: number; max: number };
  // Additional metadata
  origin?: string;
  description?: string;
  notes?: string;
  isActive: boolean;
}

interface StrainFormProps {
  data: StrainFormData;
  onChange: (data: Partial<StrainFormData>) => void;
  errors?: Record<string, string>;
  species?: Species[];
}

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner', description: 'Easy to grow, forgiving of mistakes' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience recommended' },
  { value: 'advanced', label: 'Advanced', description: 'Requires precise conditions' },
];

const isolationTypeOptions = [
  { value: 'multispore', label: 'Multispore', description: 'From spore print/syringe' },
  { value: 'clone', label: 'Clone', description: 'Tissue clone from fruiting body' },
  { value: 'agar_isolation', label: 'Agar Isolation', description: 'Isolated on agar' },
  { value: 'spore_isolation', label: 'Spore Isolation', description: 'Single spore isolation' },
  { value: 'lc_isolation', label: 'LC Isolation', description: 'Isolated in liquid culture' },
  { value: 'unknown', label: 'Unknown', description: 'Origin unknown' },
];

const phenotypeOptions = [
  'Standard',
  'Albino',
  'Leucistic',
  'APE (Albino Penis Envy)',
  'TAT (True Albino Teacher)',
  'Rusty Whyte',
  'Ghost',
  'Jack Frost',
  'Yeti',
  'Other',
];

export const StrainForm: React.FC<StrainFormProps> = ({
  data,
  onChange,
  errors = {},
  species = [],
}) => {
  // Group species by category for better organization
  const groupedSpecies = React.useMemo(() => {
    const groups: Record<string, Species[]> = {
      gourmet: [],
      medicinal: [],
      research: [],
      other: [],
    };
    species.forEach(s => {
      const cat = s.category || 'other';
      if (groups[cat]) groups[cat].push(s);
      else groups.other.push(s);
    });
    return groups;
  }, [species]);

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
          placeholder="e.g., Golden Teacher, B+, Pink Oyster"
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Species - with formatted display */}
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
                species: selected?.scientificName || selected?.name || '',
              });
            }}
            className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
              errors.species ? 'border-red-500' : 'border-zinc-700'
            }`}
          >
            <option value="">Select species...</option>
            {/* Gourmet */}
            {groupedSpecies.gourmet.length > 0 && (
              <optgroup label="Gourmet/Culinary">
                {groupedSpecies.gourmet.map(s => (
                  <option key={s.id} value={s.id}>{formatSpeciesDisplay(s)}</option>
                ))}
              </optgroup>
            )}
            {/* Medicinal */}
            {groupedSpecies.medicinal.length > 0 && (
              <optgroup label="Medicinal">
                {groupedSpecies.medicinal.map(s => (
                  <option key={s.id} value={s.id}>{formatSpeciesDisplay(s)}</option>
                ))}
              </optgroup>
            )}
            {/* Research */}
            {groupedSpecies.research.length > 0 && (
              <optgroup label="Research">
                {groupedSpecies.research.map(s => (
                  <option key={s.id} value={s.id}>{formatSpeciesDisplay(s)}</option>
                ))}
              </optgroup>
            )}
            {/* Other */}
            {groupedSpecies.other.length > 0 && (
              <optgroup label="Other">
                {groupedSpecies.other.map(s => (
                  <option key={s.id} value={s.id}>{formatSpeciesDisplay(s)}</option>
                ))}
              </optgroup>
            )}
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

      {/* Phenotype / Variety Section */}
      <div className="border-t border-zinc-700 pt-4">
        <label className="block text-sm text-zinc-300 mb-3">Genetics & Phenotype</label>
        <div className="grid grid-cols-2 gap-4">
          {/* Phenotype */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Phenotype</label>
            <select
              value={data.phenotype || ''}
              onChange={e => onChange({ phenotype: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">Standard/None</option>
              {phenotypeOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Variety */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Variety/Cultivar</label>
            <input
              type="text"
              value={data.variety || ''}
              onChange={e => onChange({ variety: e.target.value })}
              placeholder="e.g., var. alba"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Isolation Type */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Isolation Type</label>
            <select
              value={data.isolationType || ''}
              onChange={e => onChange({ isolationType: e.target.value as any })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select...</option>
              {isolationTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Generation */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Generation</label>
            <input
              type="number"
              value={data.generation ?? ''}
              onChange={e => onChange({ generation: parseInt(e.target.value) || undefined })}
              placeholder="e.g., 0, 1, 2..."
              min="0"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Genetics Source */}
        <div className="mt-3">
          <label className="block text-xs text-zinc-500 mb-1">Genetics Source</label>
          <input
            type="text"
            value={data.geneticsSource || ''}
            onChange={e => onChange({ geneticsSource: e.target.value })}
            placeholder="e.g., Sporeworks, trade with user, wild isolation"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Origin */}
        <div className="mt-3">
          <label className="block text-xs text-zinc-500 mb-1">Geographic Origin</label>
          <input
            type="text"
            value={data.origin || ''}
            onChange={e => onChange({ origin: e.target.value })}
            placeholder="e.g., Amazon Basin, Pacific Northwest, Thai"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
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
