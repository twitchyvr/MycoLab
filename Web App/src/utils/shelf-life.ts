// ============================================================================
// SHELF LIFE CALCULATIONS
// Calculate culture viability based on generation (P-value) and age
// ============================================================================

/**
 * Culture shelf life expectations by generation (P-value)
 * Based on commercial mycology standards at proper cold storage (2-4°C/35-39°F)
 *
 * P0 (Generation 0): Original culture from spores/wild - typically freshest
 * P1 (Generation 1): First expansion from P0 - 5 months expected viability
 * P2 (Generation 2): Second expansion - 3 months expected viability
 * P3+ (Generation 3+): Higher passages - 2 months expected viability
 *
 * These are conservative estimates. Actual viability depends on:
 * - Storage temperature consistency
 * - Culture media quality
 * - Sterile technique
 * - Species-specific characteristics
 */
export interface ShelfLifeEstimate {
  expectedDays: number;       // Expected total shelf life in days
  remainingDays: number;      // Days remaining from today
  percentRemaining: number;   // 0-100 percentage of life remaining
  status: 'fresh' | 'good' | 'aging' | 'expiring' | 'expired';
  statusColor: string;        // Tailwind color class for UI
  warningMessage?: string;    // Optional warning for user
}

/**
 * Get expected shelf life in days based on culture generation
 *
 * @param generation - The culture generation (P-value), 0-indexed
 * @returns Expected shelf life in days
 */
export function getExpectedShelfLifeDays(generation: number): number {
  // P0 (spores/wild) - very long shelf life for spores, shorter for tissue
  if (generation === 0) return 180; // 6 months
  // P1 - first expansion
  if (generation === 1) return 150; // 5 months
  // P2 - second expansion
  if (generation === 2) return 90;  // 3 months
  // P3+ - higher passages degrade faster
  return 60; // 2 months
}

/**
 * Calculate shelf life status for a culture
 *
 * @param createdAt - When the culture was created
 * @param generation - The culture generation (P-value)
 * @returns ShelfLifeEstimate with status and remaining time
 */
export function calculateShelfLife(
  createdAt: Date | string,
  generation: number
): ShelfLifeEstimate {
  const created = new Date(createdAt);
  const now = new Date();
  const ageMs = now.getTime() - created.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  const expectedDays = getExpectedShelfLifeDays(generation);
  const remainingDays = Math.max(0, expectedDays - ageDays);
  const percentRemaining = Math.max(0, Math.min(100, (remainingDays / expectedDays) * 100));

  // Determine status based on percentage remaining
  let status: ShelfLifeEstimate['status'];
  let statusColor: string;
  let warningMessage: string | undefined;

  if (remainingDays <= 0) {
    status = 'expired';
    statusColor = 'text-red-400 bg-red-950/50';
    warningMessage = 'Culture has exceeded expected shelf life. Consider testing viability before use.';
  } else if (percentRemaining <= 15) {
    status = 'expiring';
    statusColor = 'text-orange-400 bg-orange-950/50';
    warningMessage = `Only ${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining. Use or transfer soon.`;
  } else if (percentRemaining <= 35) {
    status = 'aging';
    statusColor = 'text-amber-400 bg-amber-950/50';
    warningMessage = 'Culture is aging. Consider creating transfers to preserve genetics.';
  } else if (percentRemaining <= 65) {
    status = 'good';
    statusColor = 'text-emerald-400 bg-emerald-950/50';
  } else {
    status = 'fresh';
    statusColor = 'text-green-400 bg-green-950/50';
  }

  return {
    expectedDays,
    remainingDays,
    percentRemaining,
    status,
    statusColor,
    warningMessage,
  };
}

/**
 * Format remaining shelf life as human-readable string
 *
 * @param remainingDays - Days remaining
 * @returns Formatted string like "2 months", "3 weeks", "5 days"
 */
export function formatRemainingShelfLife(remainingDays: number): string {
  if (remainingDays <= 0) return 'Expired';
  if (remainingDays === 1) return '1 day';
  if (remainingDays < 14) return `${remainingDays} days`;
  if (remainingDays < 60) {
    const weeks = Math.floor(remainingDays / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'}`;
  }
  const months = Math.round(remainingDays / 30);
  return `${months} month${months === 1 ? '' : 's'}`;
}

/**
 * Get storage temperature recommendation for a species
 *
 * @param coldSensitive - Whether the species is cold-sensitive
 * @param minStorageTempC - Optional custom minimum temperature in Celsius
 * @returns Storage recommendation object
 */
export function getStorageRecommendation(
  coldSensitive?: boolean,
  minStorageTempC?: number
): { tempC: number; tempF: number; warning?: string } {
  // Cold-sensitive species (tropical origins)
  if (coldSensitive || (minStorageTempC && minStorageTempC >= 10)) {
    const tempC = minStorageTempC || 10;
    return {
      tempC,
      tempF: Math.round(tempC * 9/5 + 32),
      warning: 'Cold-sensitive species - do not refrigerate below 10°C/50°F',
    };
  }

  // Standard cold storage
  const tempC = minStorageTempC || 2;
  return {
    tempC,
    tempF: Math.round(tempC * 9/5 + 32),
  };
}

/**
 * Signs of senescence (culture aging) to watch for
 */
export const senescenceSigns = [
  {
    sign: 'Incomplete colonization',
    description: 'Culture fails to fully colonize media, leaving bare patches',
    severity: 'warning' as const,
  },
  {
    sign: 'Color changes',
    description: 'Loss of typical white/cream coloring, yellowing or browning',
    severity: 'warning' as const,
  },
  {
    sign: 'Reduced vigor',
    description: 'Significantly slower growth rate than expected for species',
    severity: 'info' as const,
  },
  {
    sign: 'Abnormal morphology',
    description: 'Unusual growth patterns, sparse or wispy mycelium',
    severity: 'warning' as const,
  },
  {
    sign: 'Poor fruiting',
    description: 'Reduced yields, malformed fruits, or failure to pin',
    severity: 'critical' as const,
  },
  {
    sign: 'Sectoring',
    description: 'Distinct sectors of different growth patterns on same plate',
    severity: 'warning' as const,
  },
];

/**
 * Recommended expansion ratios by culture type
 */
export const expansionRatios = {
  liquidCulture: {
    recommended: '1:10',
    description: 'Add 10ml fresh media per 1ml culture',
    maxRatio: '1:20',
    warning: 'Higher ratios increase contamination risk and aging',
  },
  agar: {
    recommended: '1:4 to 1:8',
    description: '4-8 wedges from one plate',
    maxRatio: '1:10',
    warning: 'Too many transfers from one plate accelerates senescence',
  },
  grainSpawn: {
    recommended: '1:10',
    description: '1 lb spawn to 10 lbs grain (by weight)',
    maxRatio: '1:20',
    warning: 'Lower spawn rates = longer colonization = higher contam risk',
  },
};

/**
 * Cold-sensitive species that require warmer storage
 * These tropical species can be damaged by standard refrigeration (2-4°C)
 */
export const coldSensitiveSpecies = [
  'Agaricus subrufescens',  // Almond Mushroom / Himematsutake
  'Pleurotus djamor',       // Pink Oyster
  'Volvariella volvacea',   // Paddy Straw / Straw Mushroom
  // Additional tropical species that may be cold-sensitive:
  'Ganoderma lucidum',      // Reishi (some strains)
  'Auricularia polytricha', // Cloud Ear (wood ear)
];
