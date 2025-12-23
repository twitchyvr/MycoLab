// ============================================================================
// STRAIN SEARCH DROPDOWN - Searchable strain selector with rich info display
// ============================================================================
//
// A specialized searchable dropdown for strain selection that displays:
// - Strain name (primary)
// - Species (scientific name, abbreviated)
// - Phenotype/variety if present
// - Difficulty level indicator
//
// Searches across: strain name, species, phenotype, variety, notes
// ============================================================================

import React, { useMemo } from 'react';
import { useData } from '../../store';
import { SearchableDropdown, SearchableOption } from './SearchableDropdown';
import type { Strain, Species } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

export interface StrainSearchDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  helpText?: string;
  fieldName?: string;
  // Filter options
  speciesFilter?: string;  // Filter by species ID
  difficultyFilter?: ('beginner' | 'intermediate' | 'advanced')[];
}

// ============================================================================
// HELPERS
// ============================================================================

// Abbreviate scientific name: "Pleurotus ostreatus" => "P. ostreatus"
const abbreviateScientificName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
  }
  return name;
};

// Get difficulty badge style
const getDifficultyStyle = (difficulty: string): { text: string; bg: string } => {
  switch (difficulty) {
    case 'beginner':
      return { text: 'text-emerald-400', bg: 'bg-emerald-950/50' };
    case 'intermediate':
      return { text: 'text-amber-400', bg: 'bg-amber-950/50' };
    case 'advanced':
      return { text: 'text-red-400', bg: 'bg-red-950/50' };
    default:
      return { text: 'text-zinc-400', bg: 'bg-zinc-800' };
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export const StrainSearchDropdown: React.FC<StrainSearchDropdownProps> = ({
  value,
  onChange,
  label = 'Strain',
  placeholder = 'Select strain...',
  required,
  disabled,
  className = '',
  error,
  helpText,
  fieldName = 'strainId',
  speciesFilter,
  difficultyFilter,
}) => {
  const { activeStrains, activeSpecies } = useData();

  // Build species lookup map
  const speciesMap = useMemo(() => {
    const map = new Map<string, Species>();
    activeSpecies.forEach(s => map.set(s.id, s));
    return map;
  }, [activeSpecies]);

  // Transform strains to searchable options with rich info
  const strainOptions = useMemo((): SearchableOption[] => {
    let strains = activeStrains;

    // Apply filters
    if (speciesFilter) {
      strains = strains.filter(s => s.speciesId === speciesFilter);
    }
    if (difficultyFilter?.length) {
      strains = strains.filter(s => difficultyFilter.includes(s.difficulty));
    }

    return strains.map(strain => {
      // Get species info
      const species = strain.speciesId ? speciesMap.get(strain.speciesId) : null;
      let speciesDisplay = strain.species || ''; // Legacy field fallback

      if (species?.scientificName) {
        speciesDisplay = abbreviateScientificName(species.scientificName);
      }

      // Build subtitle parts
      const subtitleParts: string[] = [];
      if (speciesDisplay) {
        subtitleParts.push(speciesDisplay);
      }
      if (strain.phenotype) {
        subtitleParts.push(strain.phenotype);
      } else if (strain.variety) {
        subtitleParts.push(strain.variety);
      }

      // Build search text (includes more fields for better search)
      const searchParts = [
        strain.name,
        speciesDisplay,
        strain.species,
        species?.scientificName,
        species?.commonNames?.join(' '),
        strain.phenotype,
        strain.variety,
        strain.geneticsSource,
        strain.notes,
      ].filter(Boolean);

      return {
        id: strain.id,
        name: strain.name,
        subtitle: subtitleParts.join(' • ') || undefined,
        metadata: strain.difficulty,
        searchText: searchParts.join(' '),
      };
    });
  }, [activeStrains, speciesMap, speciesFilter, difficultyFilter]);

  // Custom option renderer with difficulty badge
  const renderStrainOption = (option: SearchableOption, isHighlighted: boolean) => {
    const difficulty = option.metadata as string | undefined;
    const diffStyle = difficulty ? getDifficultyStyle(difficulty) : null;

    return (
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{option.name}</span>
            {difficulty && diffStyle && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${diffStyle.text} ${diffStyle.bg}`}>
                {difficulty}
              </span>
            )}
          </div>
          {option.subtitle && (
            <div className="text-xs text-zinc-400 italic truncate mt-0.5">
              {option.subtitle}
            </div>
          )}
        </div>
        {option.id === value && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-400 flex-shrink-0">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    );
  };

  return (
    <SearchableDropdown
      value={value}
      onChange={onChange}
      options={strainOptions}
      label={label}
      placeholder={placeholder}
      searchPlaceholder="Search by name, species, phenotype..."
      required={required}
      disabled={disabled}
      className={className}
      error={error}
      helpText={helpText}
      entityType="strain"
      fieldName={fieldName}
      addLabel="Add New Strain"
      renderOption={renderStrainOption}
      emptyMessage="No strains found"
    />
  );
};

export default StrainSearchDropdown;
