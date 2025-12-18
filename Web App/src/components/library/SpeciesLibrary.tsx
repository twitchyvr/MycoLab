// ============================================================================
// SPECIES & STRAIN LIBRARY
// Comprehensive, searchable reference for all species and strains
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../../store';
import type { Species, Strain } from '../../store/types';
import { formatTemperatureRange, type TemperatureUnit } from '../../utils/temperature';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'grid' | 'list' | 'detail';
type CategoryFilter = 'all' | 'gourmet' | 'medicinal' | 'research' | 'other';
type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface SuggestionDraft {
  type: 'species' | 'strain' | 'edit';
  entityId?: string;
  data: Partial<Species | Strain>;
  notes: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Search: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Grid: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  List: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Info: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Thermometer: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
    </svg>
  ),
  Star: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  Leaf: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Filter: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  DNA: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  BookOpen: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Lightbulb: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  Beaker: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// ============================================================================
// DIFFICULTY BADGE
// ============================================================================

const DifficultyBadge: React.FC<{ difficulty?: string }> = ({ difficulty }) => {
  const colors: Record<string, string> = {
    beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    advanced: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    expert: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  if (!difficulty) return null;

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[difficulty] || 'bg-zinc-700 text-zinc-400'}`}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
};

// ============================================================================
// CATEGORY BADGE
// ============================================================================

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const config: Record<string, { icon: string; color: string }> = {
    gourmet: { icon: '🍄', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    medicinal: { icon: '💊', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    research: { icon: '🔬', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    other: { icon: '📦', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  };

  const cfg = config[category] || config.other;

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.color} flex items-center gap-1`}>
      <span>{cfg.icon}</span>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  );
};

// ============================================================================
// SPECIES CARD
// ============================================================================

const SpeciesCard: React.FC<{
  species: Species;
  strains: Strain[];
  onClick: () => void;
  isSelected?: boolean;
}> = ({ species, strains, onClick, isSelected }) => {
  const strainsForSpecies = strains.filter(s => s.speciesId === species.id);

  return (
    <div
      onClick={onClick}
      className={`
        bg-zinc-900/50 border rounded-xl p-4 cursor-pointer transition-all hover:border-emerald-500/50 hover:bg-zinc-800/50
        ${isSelected ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-zinc-800'}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">{species.name}</h3>
          {species.scientificName && (
            <p className="text-sm text-zinc-400 italic">{species.scientificName}</p>
          )}
        </div>
        <CategoryBadge category={species.category} />
      </div>

      {species.commonNames && species.commonNames.length > 0 && (
        <p className="text-xs text-zinc-500 mb-2">
          Also known as: {species.commonNames.slice(0, 3).join(', ')}
          {species.commonNames.length > 3 && ` +${species.commonNames.length - 3} more`}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <DifficultyBadge difficulty={species.difficulty} />
        {strainsForSpecies.length > 0 && (
          <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded-full">
            {strainsForSpecies.length} strain{strainsForSpecies.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {species.characteristics && (
        <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{species.characteristics}</p>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {species.typicalYield && (
          <div className="flex items-center gap-1 text-zinc-400">
            <Icons.Star />
            <span>{species.typicalYield}</span>
          </div>
        )}
        {species.flushCount && (
          <div className="flex items-center gap-1 text-zinc-400">
            <Icons.Leaf />
            <span>{species.flushCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// STRAIN CARD
// ============================================================================

const StrainCard: React.FC<{
  strain: Strain;
  species?: Species;
  onClick: () => void;
  compact?: boolean;
}> = ({ strain, species, onClick, compact }) => {
  const { state } = useData();
  const temperatureUnit: TemperatureUnit = state.settings?.defaultUnits || 'imperial';

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 cursor-pointer hover:bg-zinc-700/50 hover:border-zinc-600 transition-all"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">{strain.name}</p>
            <p className="text-xs text-zinc-500">{strain.species || species?.name}</p>
          </div>
          <DifficultyBadge difficulty={strain.difficulty} />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 hover:bg-zinc-800/50 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-white">{strain.name}</h4>
          <p className="text-sm text-zinc-400 italic">{strain.species || species?.name}</p>
          {strain.variety && <p className="text-xs text-zinc-500">var. {strain.variety}</p>}
          {strain.phenotype && <span className="text-xs text-purple-400 ml-1">({strain.phenotype})</span>}
        </div>
        <DifficultyBadge difficulty={strain.difficulty} />
      </div>

      {strain.geneticsSource && (
        <p className="text-xs text-zinc-500 mb-2">Source: {strain.geneticsSource}</p>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 mt-3">
        <div className="flex items-center gap-1">
          <Icons.Clock />
          <span>Col: {strain.colonizationDays?.min}-{strain.colonizationDays?.max}d</span>
        </div>
        <div className="flex items-center gap-1">
          <Icons.Leaf />
          <span>Fruit: {strain.fruitingDays?.min}-{strain.fruitingDays?.max}d</span>
        </div>
        {strain.optimalTempColonization && (
          <div className="flex items-center gap-1">
            <Icons.Thermometer />
            <span>Col: {formatTemperatureRange(strain.optimalTempColonization.min, strain.optimalTempColonization.max, temperatureUnit)}</span>
          </div>
        )}
        {strain.optimalTempFruiting && (
          <div className="flex items-center gap-1">
            <Icons.Thermometer />
            <span>Fruit: {formatTemperatureRange(strain.optimalTempFruiting.min, strain.optimalTempFruiting.max, temperatureUnit)}</span>
          </div>
        )}
      </div>

      {strain.description && (
        <p className="text-sm text-zinc-400 mt-3 line-clamp-2">{strain.description}</p>
      )}
    </div>
  );
};

// ============================================================================
// SPECIES DETAIL VIEW
// ============================================================================

const SpeciesDetailView: React.FC<{
  species: Species;
  strains: Strain[];
  onBack: () => void;
  onSelectStrain: (strain: Strain) => void;
}> = ({ species, strains, onBack, onSelectStrain }) => {
  const { state } = useData();
  const temperatureUnit: TemperatureUnit = state.settings?.defaultUnits || 'imperial';
  const [activeTab, setActiveTab] = useState<'overview' | 'growing' | 'culinary' | 'strains'>('overview');

  const speciesStrains = strains.filter(s => s.speciesId === species.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <Icons.ArrowLeft />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-white">{species.name}</h2>
            <CategoryBadge category={species.category} />
            <DifficultyBadge difficulty={species.difficulty} />
          </div>
          {species.scientificName && (
            <p className="text-lg text-zinc-400 italic mt-1">{species.scientificName}</p>
          )}
          {species.commonNames && species.commonNames.length > 0 && (
            <p className="text-sm text-zinc-500 mt-1">
              Also known as: {species.commonNames.join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 pb-1">
        {(['overview', 'growing', 'culinary', 'strains'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'strains' && speciesStrains.length > 0 && (
              <span className="ml-1 text-xs text-zinc-500">({speciesStrains.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {species.characteristics && (
              <div>
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  <Icons.Info />
                  Characteristics
                </h4>
                <p className="text-zinc-300">{species.characteristics}</p>
              </div>
            )}

            {species.importantFacts && (
              <div>
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  <Icons.Lightbulb />
                  Important Facts
                </h4>
                <p className="text-zinc-300">{species.importantFacts}</p>
              </div>
            )}

            {species.communityTips && (
              <div>
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  <Icons.BookOpen />
                  Community Tips
                </h4>
                <p className="text-zinc-300">{species.communityTips}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {species.typicalYield && (
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Typical Yield</p>
                  <p className="text-white font-medium">{species.typicalYield}</p>
                </div>
              )}
              {species.flushCount && (
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Flush Count</p>
                  <p className="text-white font-medium">{species.flushCount}</p>
                </div>
              )}
              {species.shelfLifeDays && (
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Shelf Life</p>
                  <p className="text-white font-medium">{species.shelfLifeDays.min}-{species.shelfLifeDays.max} days</p>
                </div>
              )}
              {species.difficulty && (
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Difficulty</p>
                  <p className="text-white font-medium capitalize">{species.difficulty}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'growing' && (
          <div className="space-y-6">
            {/* Growing Phases */}
            {[
              { key: 'spawnColonization', label: 'Spawn Colonization', notes: species.spawnColonizationNotes, params: species.spawnColonization },
              { key: 'bulkColonization', label: 'Bulk Colonization', notes: species.bulkColonizationNotes, params: species.bulkColonization },
              { key: 'pinning', label: 'Pinning', notes: species.pinningNotes, params: species.pinning },
              { key: 'maturation', label: 'Maturation/Harvest', notes: species.maturationNotes, params: species.maturation },
            ].map(phase => (
              <div key={phase.key} className="bg-zinc-800/30 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">{phase.label}</h4>
                {phase.params && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {phase.params.tempRange && (
                      <div className="text-sm">
                        <p className="text-zinc-500 text-xs">Temperature</p>
                        <p className="text-zinc-300">{formatTemperatureRange(phase.params.tempRange.min, phase.params.tempRange.max, temperatureUnit)}</p>
                      </div>
                    )}
                    {phase.params.humidityRange && (
                      <div className="text-sm">
                        <p className="text-zinc-500 text-xs">Humidity</p>
                        <p className="text-zinc-300">{phase.params.humidityRange.min}-{phase.params.humidityRange.max}%</p>
                      </div>
                    )}
                    {phase.params.daysMin !== undefined && (
                      <div className="text-sm">
                        <p className="text-zinc-500 text-xs">Duration</p>
                        <p className="text-zinc-300">{phase.params.daysMin}-{phase.params.daysMax} days</p>
                      </div>
                    )}
                    {phase.params.lightRequirement && (
                      <div className="text-sm">
                        <p className="text-zinc-500 text-xs">Light</p>
                        <p className="text-zinc-300 capitalize">{phase.params.lightRequirement.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                  </div>
                )}
                {phase.notes && (
                  <p className="text-sm text-zinc-400">{phase.notes}</p>
                )}
                {!phase.params && !phase.notes && (
                  <p className="text-sm text-zinc-500 italic">No data available for this phase</p>
                )}
              </div>
            ))}

            {/* Substrate Preferences */}
            {species.preferredSubstrates && species.preferredSubstrates.length > 0 && (
              <div>
                <h4 className="font-medium text-white mb-2">Preferred Substrates</h4>
                <div className="flex flex-wrap gap-2">
                  {species.preferredSubstrates.map((sub, i) => (
                    <span key={i} className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-sm">
                      {sub}
                    </span>
                  ))}
                </div>
                {species.substrateNotes && (
                  <p className="text-sm text-zinc-400 mt-2">{species.substrateNotes}</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'culinary' && (
          <div className="space-y-6">
            {species.flavorProfile && (
              <div>
                <h4 className="font-medium text-white mb-2">Flavor Profile</h4>
                <p className="text-zinc-300">{species.flavorProfile}</p>
              </div>
            )}
            {species.culinaryNotes && (
              <div>
                <h4 className="font-medium text-white mb-2">Culinary Notes</h4>
                <p className="text-zinc-300">{species.culinaryNotes}</p>
              </div>
            )}
            {species.medicinalProperties && (
              <div>
                <h4 className="font-medium text-white mb-2">Medicinal Properties</h4>
                <p className="text-zinc-300">{species.medicinalProperties}</p>
              </div>
            )}
            {!species.flavorProfile && !species.culinaryNotes && !species.medicinalProperties && (
              <p className="text-zinc-500 italic">No culinary or medicinal information available yet.</p>
            )}
          </div>
        )}

        {activeTab === 'strains' && (
          <div className="space-y-4">
            {speciesStrains.length === 0 ? (
              <p className="text-zinc-500 italic">No strains recorded for this species yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {speciesStrains.map(strain => (
                  <StrainCard
                    key={strain.id}
                    strain={strain}
                    species={species}
                    onClick={() => onSelectStrain(strain)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {species.notes && (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
          <h4 className="font-medium text-white mb-2">Notes</h4>
          <p className="text-zinc-300">{species.notes}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// STRAIN DETAIL VIEW
// ============================================================================

const StrainDetailView: React.FC<{
  strain: Strain;
  species?: Species;
  onBack: () => void;
}> = ({ strain, species, onBack }) => {
  const { state } = useData();
  const temperatureUnit: TemperatureUnit = state.settings?.defaultUnits || 'imperial';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <Icons.ArrowLeft />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-white">{strain.name}</h2>
            <DifficultyBadge difficulty={strain.difficulty} />
            {strain.phenotype && (
              <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
                {strain.phenotype}
              </span>
            )}
          </div>
          <p className="text-lg text-zinc-400 italic mt-1">{strain.species || species?.name}</p>
          {strain.variety && <p className="text-sm text-zinc-500">var. {strain.variety}</p>}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Growing Parameters */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Icons.Beaker />
              Growing Parameters
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Colonization Time</p>
                <p className="text-white font-medium">{strain.colonizationDays?.min}-{strain.colonizationDays?.max} days</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Fruiting Time</p>
                <p className="text-white font-medium">{strain.fruitingDays?.min}-{strain.fruitingDays?.max} days</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Colonization Temp</p>
                <p className="text-white font-medium">{strain.optimalTempColonization ? formatTemperatureRange(strain.optimalTempColonization.min, strain.optimalTempColonization.max, temperatureUnit) : 'N/A'}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Fruiting Temp</p>
                <p className="text-white font-medium">{strain.optimalTempFruiting ? formatTemperatureRange(strain.optimalTempFruiting.min, strain.optimalTempFruiting.max, temperatureUnit) : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {strain.description && (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Description</h3>
              <p className="text-zinc-300">{strain.description}</p>
            </div>
          )}

          {/* Notes */}
          {strain.notes && (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Notes</h3>
              <p className="text-zinc-300">{strain.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-4">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
            <h4 className="font-medium text-white mb-3 flex items-center gap-2">
              <Icons.DNA />
              Genetics Info
            </h4>
            <div className="space-y-3">
              {strain.geneticsSource && (
                <div>
                  <p className="text-xs text-zinc-500">Source</p>
                  <p className="text-zinc-300">{strain.geneticsSource}</p>
                </div>
              )}
              {strain.isolationType && (
                <div>
                  <p className="text-xs text-zinc-500">Isolation Type</p>
                  <p className="text-zinc-300 capitalize">{strain.isolationType.replace(/_/g, ' ')}</p>
                </div>
              )}
              {strain.generation !== undefined && (
                <div>
                  <p className="text-xs text-zinc-500">Generation</p>
                  <p className="text-zinc-300">G{strain.generation}</p>
                </div>
              )}
              {strain.origin && (
                <div>
                  <p className="text-xs text-zinc-500">Origin</p>
                  <p className="text-zinc-300">{strain.origin}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUGGESTION MODAL (For Community Contributions)
// ============================================================================

const SuggestionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  type: 'species' | 'strain';
}> = ({ isOpen, onClose, type }) => {
  const [formData, setFormData] = useState({
    name: '',
    scientificName: '',
    description: '',
    notes: '',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Suggest New {type === 'species' ? 'Species' : 'Strain'}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <Icons.Close />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-4">
            <p className="text-sm text-amber-400">
              Suggestions will be reviewed by an administrator before being added to the library.
              Please provide as much accurate information as possible.
            </p>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder={type === 'species' ? 'e.g., Pearl Oyster' : 'e.g., Blue Oyster #1'}
            />
          </div>

          {type === 'species' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Scientific Name</label>
              <input
                type="text"
                value={formData.scientificName}
                onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 italic"
                placeholder="e.g., Pleurotus ostreatus"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 h-24 resize-none"
              placeholder="Describe the key characteristics..."
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Additional Notes / Sources</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 h-20 resize-none"
              placeholder="Include any sources or additional context..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!formData.name.trim()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
          >
            Submit Suggestion
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TERMINOLOGY EXPLAINER (Educational Component)
// ============================================================================

const TerminologyGuide: React.FC<{ isOpen: boolean; onToggle: () => void }> = ({ isOpen, onToggle }) => {
  const terms = [
    {
      term: 'Species',
      icon: '🍄',
      color: 'emerald',
      definition: 'The biological classification - e.g., "Pleurotus ostreatus" (Oyster Mushroom)',
      example: 'Lions Mane, King Oyster, Shiitake',
      description: 'A species is the fundamental unit of biological classification. All mushrooms of the same species share the same genetic makeup and can reproduce together.',
    },
    {
      term: 'Strain',
      icon: '🧬',
      color: 'blue',
      definition: 'A specific genetic line within a species, often selected for particular traits',
      example: 'Blue Oyster, Pearl Oyster, Pink Oyster (all P. ostreatus strains)',
      description: 'A strain is a subgroup within a species that has been isolated and cultivated for specific characteristics like color, size, flavor, or growing conditions.',
    },
    {
      term: 'Variety',
      icon: '🌿',
      color: 'purple',
      definition: 'A naturally occurring variant within a species (botanical classification)',
      example: 'Pleurotus ostreatus var. columbinus',
      description: 'A variety (var.) is a taxonomic rank used for naturally occurring variants. Unlike strains, varieties occur naturally in the wild.',
    },
    {
      term: 'Phenotype',
      icon: '🎨',
      color: 'amber',
      definition: 'Observable physical characteristics of a mushroom',
      example: 'Albino, Leucistic, Blue, Giant',
      description: 'Phenotypes describe what you can see - color, size, shape. Two mushrooms of the same strain can show different phenotypes based on growing conditions.',
    },
    {
      term: 'Isolate',
      icon: '🔬',
      color: 'pink',
      definition: 'A genetically uniform culture derived from a single spore or tissue sample',
      example: 'Clone isolation, Spore isolation',
      description: 'An isolate is a pure genetic line created by isolating tissue from a single mushroom or germinating a single spore to ensure genetic consistency.',
    },
    {
      term: 'Generation',
      icon: '📊',
      color: 'cyan',
      definition: 'How many times cultures have been transferred from the original source',
      example: 'G0 (original), G1 (first transfer), G2, etc.',
      description: 'Tracking generations helps monitor genetic drift. Higher generations may lose vigor - most cultivators reset genetics after G3-G5.',
    },
  ];

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Icons.BookOpen />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-white">Understanding Mycology Terms</h3>
            <p className="text-xs text-zinc-500">Species vs Strains vs Varieties - What's the difference?</p>
          </div>
        </div>
        <div className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <Icons.ChevronDown />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-zinc-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {terms.map(term => (
              <div
                key={term.term}
                className={`bg-zinc-800/30 rounded-lg p-4 border border-${term.color}-500/20 hover:border-${term.color}-500/40 transition-colors`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{term.icon}</span>
                  <h4 className={`font-semibold text-${term.color}-400`}>{term.term}</h4>
                </div>
                <p className="text-sm text-zinc-300 mb-2">{term.definition}</p>
                <p className="text-xs text-zinc-500 mb-2">
                  <span className="text-zinc-400">Example:</span> {term.example}
                </p>
                <details className="group">
                  <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400 flex items-center gap-1">
                    <span className="group-open:hidden">Learn more...</span>
                    <span className="hidden group-open:inline">Less</span>
                  </summary>
                  <p className="text-xs text-zinc-400 mt-2 pt-2 border-t border-zinc-700">
                    {term.description}
                  </p>
                </details>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-emerald-950/30 border border-emerald-800/30 rounded-lg">
            <h4 className="font-medium text-emerald-400 mb-2 flex items-center gap-2">
              <Icons.Lightbulb />
              Quick Reference
            </h4>
            <div className="text-sm text-zinc-300 space-y-1">
              <p><span className="text-emerald-400">Species</span> → <span className="text-blue-400">Strains</span> → <span className="text-amber-400">Phenotypes</span></p>
              <p className="text-xs text-zinc-500">
                Think of it like: Dog (species) → Labrador (breed/strain) → Black Lab (phenotype/color)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HIERARCHY VISUALIZATION
// ============================================================================

const HierarchyVisualization: React.FC<{
  species: Species[];
  strains: Strain[];
  onSelectSpecies: (species: Species) => void;
  onSelectStrain: (strain: Strain) => void;
}> = ({ species, strains, onSelectSpecies, onSelectStrain }) => {
  const [expandedSpecies, setExpandedSpecies] = useState<Set<string>>(new Set());

  const toggleSpecies = (id: string) => {
    setExpandedSpecies(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group strains by species
  const strainsBySpecies = useMemo(() => {
    const map = new Map<string, Strain[]>();
    strains.forEach(strain => {
      const key = strain.speciesId || 'unlinked';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(strain);
    });
    return map;
  }, [strains]);

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <Icons.DNA />
        Taxonomy Browser
        <span className="text-xs font-normal text-zinc-500 ml-2">
          Click to expand species and view strains
        </span>
      </h3>

      <div className="space-y-2">
        {species.map(sp => {
          const speciesStrains = strainsBySpecies.get(sp.id) || [];
          const isExpanded = expandedSpecies.has(sp.id);

          return (
            <div key={sp.id} className="border border-zinc-800 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSpecies(sp.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800/50 transition-colors"
              >
                <div className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                  <Icons.ChevronRight />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{sp.name}</span>
                    <CategoryBadge category={sp.category} />
                    {speciesStrains.length > 0 && (
                      <span className="text-xs text-zinc-500">
                        ({speciesStrains.length} strain{speciesStrains.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                  {sp.scientificName && (
                    <p className="text-xs text-zinc-500 italic">{sp.scientificName}</p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectSpecies(sp); }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1"
                >
                  View Details
                </button>
              </button>

              {isExpanded && speciesStrains.length > 0 && (
                <div className="bg-zinc-800/30 border-t border-zinc-800 p-2 pl-10 space-y-1">
                  {speciesStrains.map(strain => (
                    <button
                      key={strain.id}
                      onClick={() => onSelectStrain(strain)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-700/50 transition-colors text-left"
                    >
                      <span className="text-blue-400 text-xs">└─</span>
                      <div className="flex-1">
                        <span className="text-sm text-zinc-300">{strain.name}</span>
                        {strain.phenotype && (
                          <span className="text-xs text-purple-400 ml-2">({strain.phenotype})</span>
                        )}
                        {strain.variety && (
                          <span className="text-xs text-zinc-500 ml-2">var. {strain.variety}</span>
                        )}
                      </div>
                      <DifficultyBadge difficulty={strain.difficulty} />
                    </button>
                  ))}
                </div>
              )}

              {isExpanded && speciesStrains.length === 0 && (
                <div className="bg-zinc-800/30 border-t border-zinc-800 p-3 pl-10">
                  <p className="text-xs text-zinc-500 italic">No strains recorded for this species</p>
                </div>
              )}
            </div>
          );
        })}

        {/* Unlinked Strains */}
        {strainsBySpecies.has('unlinked') && (
          <div className="border border-zinc-700 rounded-lg overflow-hidden">
            <div className="p-3 bg-zinc-800/30">
              <span className="text-sm text-zinc-400">Strains without linked species</span>
            </div>
            <div className="p-2 space-y-1">
              {strainsBySpecies.get('unlinked')!.map(strain => (
                <button
                  key={strain.id}
                  onClick={() => onSelectStrain(strain)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-700/50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <span className="text-sm text-zinc-300">{strain.name}</span>
                    <span className="text-xs text-zinc-500 ml-2">({strain.species})</span>
                  </div>
                  <DifficultyBadge difficulty={strain.difficulty} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SpeciesLibrary: React.FC = () => {
  const { state, activeSpecies, activeStrains } = useData();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [browseMode, setBrowseMode] = useState<'cards' | 'taxonomy'>('cards');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showTerminology, setShowTerminology] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
  const [suggestionModal, setSuggestionModal] = useState<{ open: boolean; type: 'species' | 'strain' }>({ open: false, type: 'species' });

  // Filter species
  const filteredSpecies = useMemo(() => {
    return activeSpecies.filter(species => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchFields = [
          species.name,
          species.scientificName,
          ...(species.commonNames || []),
          species.characteristics,
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchFields.includes(query)) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && species.category !== categoryFilter) return false;

      // Difficulty filter
      if (difficultyFilter !== 'all' && species.difficulty !== difficultyFilter) return false;

      return true;
    });
  }, [activeSpecies, searchQuery, categoryFilter, difficultyFilter]);

  // Filter strains (not linked to species)
  const unlinkedStrains = useMemo(() => {
    return activeStrains.filter(strain => {
      if (strain.speciesId && activeSpecies.some(s => s.id === strain.speciesId)) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchFields = [
          strain.name,
          strain.species,
          strain.variety,
          strain.phenotype,
          strain.description,
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchFields.includes(query)) return false;
      }

      if (difficultyFilter !== 'all' && strain.difficulty !== difficultyFilter) return false;

      return true;
    });
  }, [activeStrains, activeSpecies, searchQuery, difficultyFilter]);

  // Stats
  const stats = useMemo(() => ({
    speciesCount: activeSpecies.length,
    strainCount: activeStrains.length,
    gourmetCount: activeSpecies.filter(s => s.category === 'gourmet').length,
    medicinalCount: activeSpecies.filter(s => s.category === 'medicinal').length,
    researchCount: activeSpecies.filter(s => s.category === 'research').length,
  }), [activeSpecies, activeStrains]);

  // Handle strain selection
  const handleSelectStrain = useCallback((strain: Strain) => {
    setSelectedStrain(strain);
  }, []);

  // Render detail view if selected
  if (selectedStrain) {
    const species = activeSpecies.find(s => s.id === selectedStrain.speciesId);
    return (
      <StrainDetailView
        strain={selectedStrain}
        species={species}
        onBack={() => setSelectedStrain(null)}
      />
    );
  }

  if (selectedSpecies) {
    return (
      <SpeciesDetailView
        species={selectedSpecies}
        strains={activeStrains}
        onBack={() => setSelectedSpecies(null)}
        onSelectStrain={handleSelectStrain}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Icons.BookOpen />
            Species & Strain Library
          </h1>
          <p className="text-zinc-400 mt-1">
            Comprehensive reference for all mushroom species and strains
          </p>
        </div>
        <button
          onClick={() => setSuggestionModal({ open: true, type: 'species' })}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Icons.Plus />
          Suggest Entry
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Species</p>
          <p className="text-2xl font-bold text-white">{stats.speciesCount}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Strains</p>
          <p className="text-2xl font-bold text-white">{stats.strainCount}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Gourmet</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.gourmetCount}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Medicinal</p>
          <p className="text-2xl font-bold text-blue-400">{stats.medicinalCount}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Research</p>
          <p className="text-2xl font-bold text-purple-400">{stats.researchCount}</p>
        </div>
      </div>

      {/* Terminology Guide - Collapsible Education Section */}
      <TerminologyGuide isOpen={showTerminology} onToggle={() => setShowTerminology(!showTerminology)} />

      {/* Browse Mode Toggle */}
      <div className="flex items-center gap-4 p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl">
        <span className="text-sm text-zinc-400">Browse by:</span>
        <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setBrowseMode('cards')}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              browseMode === 'cards' ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setBrowseMode('taxonomy')}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              browseMode === 'taxonomy' ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Taxonomy Tree
          </button>
        </div>
        <span className="text-xs text-zinc-500 hidden md:inline">
          {browseMode === 'cards'
            ? 'Visual cards for quick browsing'
            : 'Hierarchical view showing Species → Strains'}
        </span>
      </div>

      {/* Search & Filters */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Icons.Search />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search species, strains, scientific names..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              style={{ paddingLeft: '2.5rem' }}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <Icons.Search />
            </div>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Icons.Grid />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Icons.List />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Icons.Filter />
            Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Categories</option>
                <option value="gourmet">Gourmet</option>
                <option value="medicinal">Medicinal</option>
                <option value="research">Research</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Difficulty</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <button
              onClick={() => {
                setCategoryFilter('all');
                setDifficultyFilter('all');
                setSearchQuery('');
              }}
              className="self-end px-3 py-2 text-sm text-zinc-400 hover:text-white"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content - Cards or Taxonomy View */}
      {browseMode === 'taxonomy' ? (
        <HierarchyVisualization
          species={filteredSpecies}
          strains={activeStrains}
          onSelectSpecies={setSelectedSpecies}
          onSelectStrain={handleSelectStrain}
        />
      ) : (
        <>
          {/* Species Section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              Species
              <span className="text-sm font-normal text-zinc-500">({filteredSpecies.length})</span>
            </h2>

            {filteredSpecies.length === 0 ? (
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8 text-center">
                <p className="text-zinc-400">No species match your search criteria.</p>
                <button
                  onClick={() => setSuggestionModal({ open: true, type: 'species' })}
                  className="mt-4 text-emerald-400 hover:text-emerald-300"
                >
                  Suggest a new species
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
              }>
                {filteredSpecies.map(species => (
                  <SpeciesCard
                    key={species.id}
                    species={species}
                    strains={activeStrains}
                    onClick={() => setSelectedSpecies(species)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Unlinked Strains Section */}
          {unlinkedStrains.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                Strains
                <span className="text-sm font-normal text-zinc-500">({unlinkedStrains.length})</span>
              </h2>
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
              }>
                {unlinkedStrains.map(strain => (
                  <StrainCard
                    key={strain.id}
                    strain={strain}
                    onClick={() => setSelectedStrain(strain)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {activeSpecies.length === 0 && activeStrains.length === 0 && (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <span className="text-2xl">📚</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Library is Empty</h3>
          <p className="text-zinc-400 max-w-md mx-auto mb-6">
            Start building your species and strain library by adding entries in Settings,
            or suggest new entries to contribute to the community.
          </p>
          <button
            onClick={() => setSuggestionModal({ open: true, type: 'species' })}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
          >
            Suggest First Entry
          </button>
        </div>
      )}

      {/* Suggestion Modal */}
      <SuggestionModal
        isOpen={suggestionModal.open}
        onClose={() => setSuggestionModal({ ...suggestionModal, open: false })}
        type={suggestionModal.type}
      />
    </div>
  );
};

export default SpeciesLibrary;
