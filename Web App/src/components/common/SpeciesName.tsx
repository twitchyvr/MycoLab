// ============================================================================
// SPECIES NAME COMPONENT
// Consistently displays species names with proper formatting:
// "Common Name (Scientific Name)" with scientific name italicized
// ============================================================================

import React from 'react';
import type { Species, Strain } from '../../store/types';
import {
  formatSpeciesDisplay,
  getSpeciesDisplayParts,
  formatStrainShort,
  formatStrainDisplay,
  abbreviateScientificName,
} from '../../utils/taxonomy';

// ============================================================================
// SPECIES NAME DISPLAY
// ============================================================================

interface SpeciesNameProps {
  species: Species | null | undefined;
  /** Show abbreviated scientific name (P. cubensis vs Psilocybe cubensis) */
  abbreviated?: boolean;
  /** Custom class name */
  className?: string;
  /** Show only scientific name */
  scientificOnly?: boolean;
  /** Show only common name */
  commonOnly?: boolean;
}

/**
 * Renders a species name with proper formatting.
 * Common name in regular text, scientific name in italics.
 *
 * Examples:
 * - <SpeciesName species={lionsMane} /> => "Lions Mane (Hericium erinaceus)"
 * - <SpeciesName species={cubensis} abbreviated /> => "Cubensis (P. cubensis)"
 */
export const SpeciesName: React.FC<SpeciesNameProps> = ({
  species,
  abbreviated = false,
  className = '',
  scientificOnly = false,
  commonOnly = false,
}) => {
  if (!species) {
    return <span className={`text-zinc-500 ${className}`}>Unknown Species</span>;
  }

  const { commonName, scientificName } = getSpeciesDisplayParts(species);

  // Scientific only
  if (scientificOnly && scientificName) {
    const displayName = abbreviated ? abbreviateScientificName(scientificName) : scientificName;
    return <em className={className}>{displayName}</em>;
  }

  // Common only
  if (commonOnly) {
    return <span className={className}>{commonName || scientificName || species.name}</span>;
  }

  // Full display: "Common Name (Scientific Name)"
  const sciDisplay = abbreviated && scientificName
    ? abbreviateScientificName(scientificName)
    : scientificName;

  if (commonName && sciDisplay && commonName !== sciDisplay) {
    return (
      <span className={className}>
        {commonName} (<em>{sciDisplay}</em>)
      </span>
    );
  }

  // If only scientific name or they're the same
  if (sciDisplay) {
    return <em className={className}>{sciDisplay}</em>;
  }

  return <span className={className}>{species.name}</span>;
};

// ============================================================================
// STRAIN NAME DISPLAY (includes species)
// ============================================================================

interface StrainNameProps {
  strain: Strain | null | undefined;
  species?: Species | null;
  /** Show full species name or abbreviated */
  abbreviated?: boolean;
  /** Show only strain name without species */
  strainOnly?: boolean;
  /** Custom class name */
  className?: string;
  /** Show phenotype if present */
  showPhenotype?: boolean;
}

/**
 * Renders a strain name with its species.
 *
 * Examples:
 * - <StrainName strain={goldenTeacher} species={cubensis} />
 *   => "Golden Teacher (P. cubensis)"
 * - <StrainName strain={ape} species={cubensis} showPhenotype />
 *   => "APE [Albino] (P. cubensis)"
 */
export const StrainName: React.FC<StrainNameProps> = ({
  strain,
  species,
  abbreviated = true,
  strainOnly = false,
  className = '',
  showPhenotype = false,
}) => {
  if (!strain) {
    return <span className={`text-zinc-500 ${className}`}>Unknown Strain</span>;
  }

  // Strain only mode
  if (strainOnly) {
    return (
      <span className={className}>
        {strain.name}
        {showPhenotype && strain.phenotype && (
          <span className="text-zinc-400 ml-1">[{strain.phenotype}]</span>
        )}
      </span>
    );
  }

  // Get species display
  const scientificName = species?.scientificName || strain.species;
  const sciDisplay = abbreviated && scientificName
    ? abbreviateScientificName(scientificName)
    : scientificName;

  return (
    <span className={className}>
      {strain.name}
      {showPhenotype && strain.phenotype && (
        <span className="text-zinc-400 ml-1">[{strain.phenotype}]</span>
      )}
      {sciDisplay && (
        <span className="text-zinc-400">
          {' '}(<em>{sciDisplay}</em>)
        </span>
      )}
    </span>
  );
};

// ============================================================================
// DROPDOWN OPTION RENDERERS
// ============================================================================

/**
 * Render function for species in dropdown options (plain text, no JSX)
 * Use this in <select> elements where only text is supported
 */
export const renderSpeciesOption = (species: Species): string => {
  return formatSpeciesDisplay(species);
};

/**
 * Render function for strain in dropdown options (plain text)
 */
export const renderStrainOption = (strain: Strain, species?: Species | null): string => {
  return formatStrainShort(strain, species);
};

// ============================================================================
// SPECIES BADGE (for category indication)
// ============================================================================

interface SpeciesBadgeProps {
  species: Species;
  size?: 'sm' | 'md';
}

const categoryColors: Record<Species['category'], string> = {
  gourmet: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medicinal: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  research: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  other: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

const categoryLabels: Record<Species['category'], string> = {
  gourmet: 'Gourmet',
  medicinal: 'Medicinal',
  research: 'Research',
  other: 'Other',
};

export const SpeciesBadge: React.FC<SpeciesBadgeProps> = ({ species, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full border ${categoryColors[species.category]} ${sizeClasses}`}>
      {categoryLabels[species.category]}
    </span>
  );
};

// ============================================================================
// FULL SPECIES DISPLAY (for detail views)
// ============================================================================

interface SpeciesDetailProps {
  species: Species;
  className?: string;
}

export const SpeciesDetail: React.FC<SpeciesDetailProps> = ({ species, className = '' }) => {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <SpeciesName species={species} className="text-lg font-medium" />
        <SpeciesBadge species={species} />
      </div>
      {species.commonNames && species.commonNames.length > 1 && (
        <div className="text-sm text-zinc-400 mt-1">
          Also known as: {species.commonNames.slice(1).join(', ')}
        </div>
      )}
      {species.notes && (
        <div className="text-sm text-zinc-500 mt-2">{species.notes}</div>
      )}
    </div>
  );
};

export default SpeciesName;
