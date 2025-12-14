// ============================================================================
// TAXONOMY UTILITIES
// Helper functions for formatting species, strain, and variety names
// ============================================================================

import type { Species, Strain } from '../store/types';

// ============================================================================
// DISPLAY FORMAT HELPERS
// ============================================================================

/**
 * Format a species for display: "Common Name (Scientific Name)"
 * Scientific name is returned with markers for italic rendering
 *
 * Examples:
 * - formatSpeciesDisplay(species) => "Lions Mane (Hericium erinaceus)"
 * - formatSpeciesDisplay(species) => "Psilocybe cubensis" (if no common name)
 */
export const formatSpeciesDisplay = (species: Species | null | undefined): string => {
  if (!species) return 'Unknown Species';

  // Get the primary common name (first in array, or use name field)
  const commonName = species.commonNames?.[0] ||
    (species.name !== species.scientificName ? species.name : null);

  const scientificName = species.scientificName || species.name;

  // If we have both common and scientific names, show both
  if (commonName && scientificName && commonName !== scientificName) {
    return `${commonName} (${scientificName})`;
  }

  // Otherwise just return what we have
  return scientificName || species.name;
};

/**
 * Format species for HTML display with italic scientific name
 * Returns HTML string: "Common Name (<em>Scientific Name</em>)"
 */
export const formatSpeciesDisplayHTML = (species: Species | null | undefined): string => {
  if (!species) return 'Unknown Species';

  const commonName = species.commonNames?.[0] ||
    (species.name !== species.scientificName ? species.name : null);

  const scientificName = species.scientificName || species.name;

  if (commonName && scientificName && commonName !== scientificName) {
    return `${commonName} (<em>${scientificName}</em>)`;
  }

  // Scientific name alone should still be italicized
  if (scientificName) {
    return `<em>${scientificName}</em>`;
  }

  return species.name;
};

/**
 * Format strain with its species: "Strain Name - Common Name (Scientific Name)"
 *
 * Examples:
 * - "Golden Teacher - Cubensis (Psilocybe cubensis)"
 * - "Blue Oyster - Oyster Mushroom (Pleurotus ostreatus)"
 */
export const formatStrainDisplay = (
  strain: Strain | null | undefined,
  species?: Species | null
): string => {
  if (!strain) return 'Unknown Strain';

  const strainName = strain.name;

  if (species) {
    const speciesDisplay = formatSpeciesDisplay(species);
    return `${strainName} - ${speciesDisplay}`;
  }

  // Fallback to legacy species field
  if (strain.species) {
    return `${strainName} - ${strain.species}`;
  }

  return strainName;
};

/**
 * Get a short display name for dropdowns: "Strain (Species)"
 *
 * Examples:
 * - "Golden Teacher (P. cubensis)"
 * - "Blue Oyster (P. ostreatus)"
 */
export const formatStrainShort = (
  strain: Strain | null | undefined,
  species?: Species | null
): string => {
  if (!strain) return 'Unknown';

  if (species?.scientificName) {
    // Abbreviate genus: "Psilocybe cubensis" => "P. cubensis"
    const abbreviated = abbreviateScientificName(species.scientificName);
    return `${strain.name} (${abbreviated})`;
  }

  if (strain.species) {
    return `${strain.name} (${strain.species})`;
  }

  return strain.name;
};

/**
 * Abbreviate a scientific name: "Psilocybe cubensis" => "P. cubensis"
 */
export const abbreviateScientificName = (scientificName: string): string => {
  if (!scientificName) return '';

  const parts = scientificName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
  }

  return scientificName;
};

/**
 * Get all common names as a formatted string
 */
export const formatCommonNames = (species: Species | null | undefined): string => {
  if (!species?.commonNames?.length) return '';
  return species.commonNames.join(', ');
};

/**
 * Search helper - check if species matches a search term
 * Searches scientific name, all common names, and primary name
 */
export const speciesMatchesSearch = (species: Species, searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return true;

  // Check scientific name
  if (species.scientificName?.toLowerCase().includes(term)) return true;

  // Check primary name
  if (species.name.toLowerCase().includes(term)) return true;

  // Check all common names
  if (species.commonNames?.some(name => name.toLowerCase().includes(term))) return true;

  return false;
};

/**
 * Search helper - check if strain matches a search term
 * Searches strain name and species info
 */
export const strainMatchesSearch = (
  strain: Strain,
  searchTerm: string,
  species?: Species | null
): boolean => {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return true;

  // Check strain name
  if (strain.name.toLowerCase().includes(term)) return true;

  // Check legacy species field
  if (strain.species?.toLowerCase().includes(term)) return true;

  // Check linked species
  if (species && speciesMatchesSearch(species, searchTerm)) return true;

  return false;
};

// ============================================================================
// DROPDOWN OPTION FORMATTERS
// ============================================================================

/**
 * Format species options for dropdown display
 * Returns array of { id, name, displayName, scientificName, commonNames }
 */
export const formatSpeciesOptions = (speciesList: Species[]) => {
  return speciesList.map(species => ({
    ...species,
    displayName: formatSpeciesDisplay(species),
    // For sorting, use common name if available, otherwise scientific
    sortName: species.commonNames?.[0] || species.scientificName || species.name,
  }));
};

/**
 * Format strain options with species info for dropdown display
 */
export const formatStrainOptions = (
  strains: Strain[],
  speciesMap: Map<string, Species> | Record<string, Species>
) => {
  const getSpecies = (id?: string): Species | undefined => {
    if (!id) return undefined;
    if (speciesMap instanceof Map) return speciesMap.get(id);
    return speciesMap[id];
  };

  return strains.map(strain => {
    const species = getSpecies(strain.speciesId);
    return {
      ...strain,
      displayName: formatStrainShort(strain, species),
      fullDisplayName: formatStrainDisplay(strain, species),
      speciesDisplayName: species ? formatSpeciesDisplay(species) : strain.species,
    };
  });
};

// ============================================================================
// REACT COMPONENT HELPERS
// ============================================================================

/**
 * Props for rendering species name with proper formatting
 */
export interface SpeciesNameProps {
  species: Species | null | undefined;
  showCommonName?: boolean;
  showScientificName?: boolean;
  className?: string;
}

/**
 * Create inline styles for italic text (for use in select options where HTML isn't supported)
 */
export const getSpeciesDisplayParts = (species: Species | null | undefined): {
  commonName: string | null;
  scientificName: string | null;
  formatted: string;
} => {
  if (!species) {
    return { commonName: null, scientificName: null, formatted: 'Unknown Species' };
  }

  const commonName = species.commonNames?.[0] ||
    (species.name !== species.scientificName ? species.name : null);
  const scientificName = species.scientificName || species.name;

  return {
    commonName,
    scientificName,
    formatted: formatSpeciesDisplay(species),
  };
};

// ============================================================================
// TAXONOMY HIERARCHY HELPERS
// ============================================================================

/**
 * Group strains by species for organized display
 */
export const groupStrainsBySpecies = (
  strains: Strain[],
  speciesList: Species[]
): Map<string, { species: Species | null; strains: Strain[] }> => {
  const speciesMap = new Map(speciesList.map(s => [s.id, s]));
  const groups = new Map<string, { species: Species | null; strains: Strain[] }>();

  // Group strains with species
  strains.forEach(strain => {
    const speciesId = strain.speciesId || 'unknown';
    const species = strain.speciesId ? speciesMap.get(strain.speciesId) || null : null;

    if (!groups.has(speciesId)) {
      groups.set(speciesId, { species, strains: [] });
    }
    groups.get(speciesId)!.strains.push(strain);
  });

  return groups;
};

/**
 * Get category label with proper capitalization
 */
export const getCategoryLabel = (category: Species['category']): string => {
  const labels: Record<Species['category'], string> = {
    gourmet: 'Gourmet/Culinary',
    medicinal: 'Medicinal',
    research: 'Research',
    other: 'Other',
  };
  return labels[category] || category;
};

/**
 * Group species by category for organized display
 */
export const groupSpeciesByCategory = (
  speciesList: Species[]
): Map<Species['category'], Species[]> => {
  const groups = new Map<Species['category'], Species[]>();

  speciesList.forEach(species => {
    const category = species.category || 'other';
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(species);
  });

  // Sort each group alphabetically
  groups.forEach(speciesInGroup => {
    speciesInGroup.sort((a, b) => {
      const nameA = a.commonNames?.[0] || a.name;
      const nameB = b.commonNames?.[0] || b.name;
      return nameA.localeCompare(nameB);
    });
  });

  return groups;
};
