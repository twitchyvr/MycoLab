// ============================================================================
// STRAIN FORM - Full form for creating/editing strains
// ============================================================================
// Designed to be intuitive for beginners while not being intrusive for experts.
// - Required fields are clearly marked
// - Advanced sections are collapsible (collapsed by default)
// - Help tooltips explain fields without cluttering the UI
// - Smart defaults guide users toward best practices
// ============================================================================

import React, { useState } from 'react';
import { NumericInput } from '../common/NumericInput';
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

// ============================================================================
// HELP TOOLTIP COMPONENT
// ============================================================================
// Shows a small "?" icon that reveals help text on hover.
// Non-intrusive for experts, helpful for beginners.

const HelpTooltip: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className={`relative inline-flex ml-1.5 ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="w-4 h-4 rounded-full bg-zinc-700 text-zinc-400 text-xs flex items-center justify-center cursor-help hover:bg-zinc-600 hover:text-zinc-300 transition-colors">
        ?
      </span>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl z-50">
          <div className="text-xs text-zinc-300 leading-relaxed">{text}</div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-zinc-600" />
          </div>
        </div>
      )}
    </span>
  );
};

// ============================================================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================================================
// Allows advanced options to be hidden by default.
// Experts can expand, beginners aren't overwhelmed.

const CollapsibleSection: React.FC<{
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}> = ({ title, subtitle, defaultOpen = false, children, badge }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">{title}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {subtitle && !isOpen && (
            <span className="text-xs text-zinc-500">{subtitle}</span>
          )}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="px-4 py-4 bg-zinc-900/30 border-t border-zinc-700/50">
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// OPTION DEFINITIONS
// ============================================================================

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner', description: 'Easy to grow, forgiving of mistakes', color: 'emerald' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience recommended', color: 'amber' },
  { value: 'advanced', label: 'Advanced', description: 'Requires precise conditions', color: 'red' },
];

const isolationTypeOptions = [
  { value: 'multispore', label: 'Multispore', description: 'Grown from spore print or syringe - genetic lottery, variable results' },
  { value: 'clone', label: 'Clone', description: 'Tissue clone from a fruiting body - preserves exact genetics' },
  { value: 'agar_isolation', label: 'Agar Isolation', description: 'Isolated and purified on agar plates' },
  { value: 'spore_isolation', label: 'Spore Isolation', description: 'Single spore isolation - creates stable genetics' },
  { value: 'lc_isolation', label: 'LC Isolation', description: 'Isolated and expanded in liquid culture' },
  { value: 'unknown', label: 'Unknown', description: 'Genetics origin is not known' },
];

const phenotypeOptions = [
  { value: '', label: 'Standard', description: 'Normal coloration and appearance' },
  { value: 'Albino', label: 'Albino', description: 'Complete lack of pigmentation - white/pale appearance' },
  { value: 'Leucistic', label: 'Leucistic', description: 'Partial lack of pigmentation - lighter than normal' },
  { value: 'APE (Albino Penis Envy)', label: 'APE', description: 'Albino Penis Envy - albino variant of PE genetics' },
  { value: 'TAT (True Albino Teacher)', label: 'TAT', description: 'True Albino Teacher - albino variant of GT' },
  { value: 'Rusty Whyte', label: 'Rusty Whyte', description: 'Leucistic with rusty-colored spores' },
  { value: 'Ghost', label: 'Ghost', description: 'Very pale/translucent appearance' },
  { value: 'Jack Frost', label: 'Jack Frost', description: 'Leucistic with distinctive frosted caps' },
  { value: 'Yeti', label: 'Yeti', description: 'True albino with unique morphology' },
  { value: 'Other', label: 'Other', description: 'Custom or rare phenotype' },
];

// ============================================================================
// MAIN FORM COMPONENT
// ============================================================================

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
    // Sort each group alphabetically
    Object.values(groups).forEach(group => {
      group.sort((a, b) => {
        const nameA = a.commonNames?.[0] || a.name;
        const nameB = b.commonNames?.[0] || b.name;
        return nameA.localeCompare(nameB);
      });
    });
    return groups;
  }, [species]);

  // Check if advanced sections have data (to auto-expand if editing)
  const hasGeneticsData = Boolean(
    data.phenotype || data.variety || data.isolationType ||
    data.generation || data.geneticsSource || data.origin
  );

  const hasTimingData = Boolean(
    data.colonizationDays?.min || data.colonizationDays?.max ||
    data.fruitingDays?.min || data.fruitingDays?.max
  );

  const hasTempData = Boolean(
    data.optimalTempColonization?.min || data.optimalTempColonization?.max ||
    data.optimalTempFruiting?.min || data.optimalTempFruiting?.max
  );

  return (
    <div className="space-y-5">
      {/* ================================================================== */}
      {/* BASIC INFO - Always visible, essential fields */}
      {/* ================================================================== */}

      {/* Strain Name */}
      <div>
        <label className="flex items-center text-sm text-zinc-400 mb-2">
          Strain Name <span className="text-red-400 ml-1">*</span>
          <HelpTooltip text="The common name for this strain. This is how you'll identify it throughout the app." />
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., Golden Teacher, B+, Pink Oyster"
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Species Selection */}
      <div>
        <label className="flex items-center text-sm text-zinc-400 mb-2">
          Species <span className="text-red-400 ml-1">*</span>
          <HelpTooltip text="The biological species this strain belongs to. Species are scientific classifications like Psilocybe cubensis or Hericium erinaceus." />
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
            className={`w-full bg-zinc-800 border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 ${
              errors.species ? 'border-red-500' : 'border-zinc-700'
            }`}
          >
            <option value="">Select a species...</option>
            {/* Gourmet */}
            {groupedSpecies.gourmet.length > 0 && (
              <optgroup label="🍄 Gourmet/Culinary">
                {groupedSpecies.gourmet.map(s => (
                  <option key={s.id} value={s.id}>{formatSpeciesDisplay(s)}</option>
                ))}
              </optgroup>
            )}
            {/* Medicinal */}
            {groupedSpecies.medicinal.length > 0 && (
              <optgroup label="💊 Medicinal">
                {groupedSpecies.medicinal.map(s => (
                  <option key={s.id} value={s.id}>{formatSpeciesDisplay(s)}</option>
                ))}
              </optgroup>
            )}
            {/* Research */}
            {groupedSpecies.research.length > 0 && (
              <optgroup label="🔬 Research">
                {groupedSpecies.research.map(s => (
                  <option key={s.id} value={s.id}>{formatSpeciesDisplay(s)}</option>
                ))}
              </optgroup>
            )}
            {/* Other */}
            {groupedSpecies.other.length > 0 && (
              <optgroup label="📦 Other">
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
            className={`w-full bg-zinc-800 border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 ${
              errors.species ? 'border-red-500' : 'border-zinc-700'
            }`}
          />
        )}
        {errors.species && <p className="text-xs text-red-400 mt-1">{errors.species}</p>}
      </div>

      {/* Difficulty - Always visible, important for strain selection */}
      <div>
        <label className="flex items-center text-sm text-zinc-400 mb-2">
          Difficulty Level
          <HelpTooltip text="How challenging is this strain to grow? Beginner strains are forgiving, advanced strains need precise conditions." />
        </label>
        <div className="grid grid-cols-3 gap-2">
          {difficultyOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ difficulty: opt.value as StrainFormData['difficulty'] })}
              className={`p-3 rounded-lg border text-left transition-all ${
                data.difficulty === opt.value
                  ? opt.color === 'emerald'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : opt.color === 'amber'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <div className="font-medium text-sm">{opt.label}</div>
              <div className="text-xs opacity-70 mt-1 line-clamp-1">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/* GENETICS & PHENOTYPE - Collapsible, for detailed tracking */}
      {/* ================================================================== */}

      <CollapsibleSection
        title="Genetics & Phenotype"
        subtitle="Track lineage and appearance"
        defaultOpen={hasGeneticsData}
        badge="Optional"
      >
        <p className="text-xs text-zinc-500 mb-4">
          Track the genetic lineage and physical characteristics of this strain.
          Helpful for maintaining quality genetics and identifying variants.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Phenotype */}
          <div>
            <label className="flex items-center text-xs text-zinc-400 mb-1.5">
              Phenotype
              <HelpTooltip text="Observable physical traits like coloration. Albino strains lack pigmentation, Leucistic have reduced pigmentation." />
            </label>
            <select
              value={data.phenotype || ''}
              onChange={e => onChange({ phenotype: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              {phenotypeOptions.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Isolation Type */}
          <div>
            <label className="flex items-center text-xs text-zinc-400 mb-1.5">
              Isolation Type
              <HelpTooltip text="How were these genetics obtained? Multispore = from spores (variable). Clone = tissue sample (stable). Isolation = purified culture." />
            </label>
            <select
              value={data.isolationType || ''}
              onChange={e => onChange({ isolationType: e.target.value as any })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">Not specified</option>
              {isolationTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Generation */}
          <div>
            <label className="flex items-center text-xs text-zinc-400 mb-1.5">
              Generation
              <HelpTooltip text="How many generations from the original culture? G0 = original, G1 = first transfer, G2 = second, etc. Lower is often better." />
            </label>
            <input
              type="number"
              value={data.generation ?? ''}
              onChange={e => onChange({ generation: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="e.g., 0, 1, 2..."
              min="0"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Variety/Cultivar */}
          <div>
            <label className="flex items-center text-xs text-zinc-400 mb-1.5">
              Variety/Cultivar
              <HelpTooltip text="A specific botanical variety, like 'var. alba'. Most strains won't have this - it's for formal taxonomy." />
            </label>
            <input
              type="text"
              value={data.variety || ''}
              onChange={e => onChange({ variety: e.target.value })}
              placeholder="e.g., var. alba"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Genetics Source - Full width */}
        <div className="mt-4">
          <label className="flex items-center text-xs text-zinc-400 mb-1.5">
            Genetics Source
            <HelpTooltip text="Where did you get these genetics? A vendor name, trade partner, or your own isolation work." />
          </label>
          <input
            type="text"
            value={data.geneticsSource || ''}
            onChange={e => onChange({ geneticsSource: e.target.value })}
            placeholder="e.g., Sporeworks, trade with mycofriend, wild isolation 2024"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Geographic Origin */}
        <div className="mt-4">
          <label className="flex items-center text-xs text-zinc-400 mb-1.5">
            Geographic Origin
            <HelpTooltip text="Where did this strain originally come from? Could be a region, country, or the breeder who developed it." />
          </label>
          <input
            type="text"
            value={data.origin || ''}
            onChange={e => onChange({ origin: e.target.value })}
            placeholder="e.g., Amazon Basin, Thailand, Pacific Northwest, 'Developed by XXX'"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </CollapsibleSection>

      {/* ================================================================== */}
      {/* GROWING TIMELINE - Collapsible, for detailed cultivation data */}
      {/* ================================================================== */}

      <CollapsibleSection
        title="Growing Timeline"
        subtitle="Colonization & fruiting times"
        defaultOpen={hasTimingData}
        badge="Optional"
      >
        <p className="text-xs text-zinc-500 mb-4">
          Expected timelines for this strain. These help estimate when grows will be ready.
          Leave blank if unknown - defaults will be used based on species.
        </p>

        {/* Colonization Time */}
        <div className="mb-4">
          <label className="flex items-center text-sm text-zinc-400 mb-2">
            Colonization Time (days)
            <HelpTooltip text="How long does it take for mycelium to fully colonize the substrate? This varies by strain and conditions." />
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
                placeholder="e.g., 14"
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
                placeholder="e.g., 21"
                min="1"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Fruiting Time */}
        <div>
          <label className="flex items-center text-sm text-zinc-400 mb-2">
            Fruiting Time (days)
            <HelpTooltip text="How long from pinning to harvest? Fast-fruiting strains can be done in 5-7 days, slower ones may take 14+." />
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
                placeholder="e.g., 5"
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
                placeholder="e.g., 10"
                min="1"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ================================================================== */}
      {/* TEMPERATURE REQUIREMENTS - Collapsible, for environmental control */}
      {/* ================================================================== */}

      <CollapsibleSection
        title="Temperature Requirements"
        subtitle="Optimal growing temps"
        defaultOpen={hasTempData}
        badge="Optional"
      >
        <p className="text-xs text-zinc-500 mb-4">
          Optimal temperature ranges for this strain. Helps plan grow room conditions
          and select appropriate locations for incubation and fruiting.
        </p>

        {/* Colonization Temperature */}
        <div className="mb-4">
          <label className="flex items-center text-sm text-zinc-400 mb-2">
            Colonization Temperature (°C)
            <HelpTooltip text="Temperature range during colonization. Most strains like 24-27°C (75-80°F). Too hot = contamination risk, too cold = slow growth." />
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
                placeholder="e.g., 24"
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
                placeholder="e.g., 27"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Fruiting Temperature */}
        <div>
          <label className="flex items-center text-sm text-zinc-400 mb-2">
            Fruiting Temperature (°C)
            <HelpTooltip text="Temperature during fruiting. Usually cooler than colonization. A 5-10°C drop often triggers pinning." />
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
                placeholder="e.g., 18"
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
                placeholder="e.g., 24"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ================================================================== */}
      {/* NOTES - Always visible, freeform info */}
      {/* ================================================================== */}

      <div>
        <label className="flex items-center text-sm text-zinc-400 mb-2">
          Notes
          <HelpTooltip text="Any additional information about this strain - growing tips, yield expectations, special characteristics, or personal observations." />
        </label>
        <textarea
          value={data.notes || ''}
          onChange={e => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Growing tips, yield expectations, special characteristics, substrate preferences..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>
    </div>
  );
};

export default StrainForm;
