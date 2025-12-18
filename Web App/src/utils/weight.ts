// ============================================================================
// WEIGHT UTILITIES
// Convert, format, and parse weights between metric and imperial systems
// Storage: Always in grams (internal standard)
// Display: Based on user preference
// ============================================================================

export type WeightUnit = 'g' | 'kg' | 'oz' | 'lb';
export type WeightSystem = 'metric' | 'imperial';

// Conversion constants (to grams)
const GRAMS_PER_OZ = 28.3495;
const GRAMS_PER_LB = 453.592;
const GRAMS_PER_KG = 1000;

// ============================================================================
// CORE CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert any weight unit to grams
 */
export const toGrams = (value: number, unit: WeightUnit): number => {
  switch (unit) {
    case 'g': return value;
    case 'kg': return value * GRAMS_PER_KG;
    case 'oz': return value * GRAMS_PER_OZ;
    case 'lb': return value * GRAMS_PER_LB;
    default: return value;
  }
};

/**
 * Convert grams to any weight unit
 */
export const fromGrams = (grams: number, unit: WeightUnit): number => {
  switch (unit) {
    case 'g': return grams;
    case 'kg': return grams / GRAMS_PER_KG;
    case 'oz': return grams / GRAMS_PER_OZ;
    case 'lb': return grams / GRAMS_PER_LB;
    default: return grams;
  }
};

/**
 * Convert between any two units
 */
export const convertWeight = (value: number, from: WeightUnit, to: WeightUnit): number => {
  const grams = toGrams(value, from);
  return fromGrams(grams, to);
};

// ============================================================================
// SMART PARSING - Handle various input formats
// ============================================================================

interface ParsedWeight {
  grams: number;
  isValid: boolean;
  originalInput: string;
  detectedUnit?: WeightUnit;
}

/**
 * Parse a weight string in various formats:
 * - "500" (uses default unit)
 * - "500g" or "500 g" or "500 grams"
 * - "1.5kg" or "1.5 kg" or "1.5 kilograms"
 * - "8oz" or "8 oz" or "8 ounces"
 * - "2lb" or "2 lbs" or "2 pounds"
 * - "1 lb 8 oz" or "1lb 8oz" (compound imperial)
 * - "1.5 lb" (decimal imperial)
 */
export const parseWeight = (input: string, defaultUnit: WeightUnit = 'g'): ParsedWeight => {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return { grams: 0, isValid: false, originalInput: input };
  }

  // Try compound imperial format first: "1 lb 8 oz" or "1lb 8oz"
  const compoundMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)\s*(?:,?\s*)?(\d+(?:\.\d+)?)\s*(?:oz|ounces?)?$/);
  if (compoundMatch) {
    const lbs = parseFloat(compoundMatch[1]);
    const oz = parseFloat(compoundMatch[2]);
    const grams = toGrams(lbs, 'lb') + toGrams(oz, 'oz');
    return { grams, isValid: true, originalInput: input, detectedUnit: 'lb' };
  }

  // Try single value with unit
  const unitPatterns: { pattern: RegExp; unit: WeightUnit }[] = [
    { pattern: /^(\d+(?:\.\d+)?)\s*(?:kg|kilograms?|kilos?)$/, unit: 'kg' },
    { pattern: /^(\d+(?:\.\d+)?)\s*(?:g|grams?|gr)$/, unit: 'g' },
    { pattern: /^(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)$/, unit: 'lb' },
    { pattern: /^(\d+(?:\.\d+)?)\s*(?:oz|ounces?)$/, unit: 'oz' },
  ];

  for (const { pattern, unit } of unitPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      return { grams: toGrams(value, unit), isValid: true, originalInput: input, detectedUnit: unit };
    }
  }

  // Try plain number (use default unit)
  const plainNumber = trimmed.match(/^(\d+(?:\.\d+)?)$/);
  if (plainNumber) {
    const value = parseFloat(plainNumber[1]);
    return { grams: toGrams(value, defaultUnit), isValid: true, originalInput: input, detectedUnit: defaultUnit };
  }

  return { grams: 0, isValid: false, originalInput: input };
};

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

interface FormatOptions {
  precision?: number;      // Decimal places (auto if not specified)
  includeUnit?: boolean;   // Include unit suffix
  longUnit?: boolean;      // Use "grams" instead of "g"
  forceDecimal?: boolean;  // Always show decimal places
}

/**
 * Get the best unit for displaying a weight value
 * Metric: g for < 1000g, kg for >= 1000g
 * Imperial: oz for < 16oz, lb for >= 16oz
 */
export const getBestUnit = (grams: number, system: WeightSystem): WeightUnit => {
  if (system === 'metric') {
    return grams >= 1000 ? 'kg' : 'g';
  } else {
    const oz = fromGrams(grams, 'oz');
    return oz >= 16 ? 'lb' : 'oz';
  }
};

/**
 * Get display precision based on value and unit
 */
const getAutoPrecision = (value: number, unit: WeightUnit): number => {
  if (unit === 'g') {
    return value >= 100 ? 0 : value >= 10 ? 1 : 2;
  }
  if (unit === 'kg') {
    return value >= 10 ? 1 : 2;
  }
  if (unit === 'oz') {
    return value >= 10 ? 1 : 2;
  }
  if (unit === 'lb') {
    return value >= 10 ? 1 : 2;
  }
  return 2;
};

/**
 * Get unit label (short or long)
 */
export const getUnitLabel = (unit: WeightUnit, plural: boolean = true, long: boolean = false): string => {
  const labels: Record<WeightUnit, { short: string; long: string; longPlural: string }> = {
    g: { short: 'g', long: 'gram', longPlural: 'grams' },
    kg: { short: 'kg', long: 'kilogram', longPlural: 'kilograms' },
    oz: { short: 'oz', long: 'ounce', longPlural: 'ounces' },
    lb: { short: 'lb', long: 'pound', longPlural: 'pounds' },
  };

  const label = labels[unit];
  if (long) {
    return plural ? label.longPlural : label.long;
  }
  return label.short;
};

/**
 * Format a weight value for display
 * @param grams - Weight in grams (storage format)
 * @param unit - Target display unit
 * @param options - Formatting options
 */
export const formatWeight = (
  grams: number,
  unit: WeightUnit,
  options: FormatOptions = {}
): string => {
  const { precision, includeUnit = true, longUnit = false, forceDecimal = false } = options;

  const value = fromGrams(grams, unit);
  const autoPrecision = precision ?? getAutoPrecision(value, unit);

  let formatted: string;
  if (forceDecimal || autoPrecision > 0) {
    formatted = value.toFixed(autoPrecision);
  } else {
    formatted = Math.round(value).toString();
  }

  // Remove trailing zeros after decimal point (unless forceDecimal)
  if (!forceDecimal && formatted.includes('.')) {
    formatted = formatted.replace(/\.?0+$/, '');
  }

  if (includeUnit) {
    const unitLabel = getUnitLabel(unit, value !== 1, longUnit);
    return `${formatted} ${unitLabel}`;
  }

  return formatted;
};

/**
 * Format weight using best unit for the system
 */
export const formatWeightAuto = (grams: number, system: WeightSystem, options: FormatOptions = {}): string => {
  const unit = getBestUnit(grams, system);
  return formatWeight(grams, unit, options);
};

/**
 * Format weight with compound imperial (e.g., "1 lb 8 oz")
 */
export const formatWeightCompound = (grams: number, system: WeightSystem): string => {
  if (system === 'metric') {
    return formatWeightAuto(grams, system);
  }

  const totalOz = fromGrams(grams, 'oz');
  if (totalOz < 16) {
    return formatWeight(grams, 'oz');
  }

  const lbs = Math.floor(totalOz / 16);
  const remainingOz = totalOz % 16;

  if (remainingOz < 0.1) {
    return `${lbs} lb`;
  }

  return `${lbs} lb ${remainingOz.toFixed(1).replace(/\.0$/, '')} oz`;
};

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get all conversions for a weight value (for tooltips/info)
 */
export const getAllConversions = (grams: number): Record<WeightUnit, string> => {
  return {
    g: formatWeight(grams, 'g', { precision: 1 }),
    kg: formatWeight(grams, 'kg', { precision: 3 }),
    oz: formatWeight(grams, 'oz', { precision: 2 }),
    lb: formatWeight(grams, 'lb', { precision: 3 }),
  };
};

/**
 * Get a human-readable conversion hint
 */
export const getConversionHint = (grams: number, currentUnit: WeightUnit): string => {
  const conversions = getAllConversions(grams);
  const hints: string[] = [];

  // Show the "other system" conversion
  if (currentUnit === 'g' || currentUnit === 'kg') {
    // Currently metric, show imperial
    if (grams >= GRAMS_PER_LB) {
      hints.push(conversions.lb);
    } else {
      hints.push(conversions.oz);
    }
  } else {
    // Currently imperial, show metric
    if (grams >= 1000) {
      hints.push(conversions.kg);
    } else {
      hints.push(conversions.g);
    }
  }

  return hints.join(' / ');
};

/**
 * Get default unit for a system
 */
export const getDefaultUnit = (system: WeightSystem): WeightUnit => {
  return system === 'metric' ? 'g' : 'oz';
};

/**
 * Get all units for a system
 */
export const getUnitsForSystem = (system: WeightSystem): WeightUnit[] => {
  return system === 'metric' ? ['g', 'kg'] : ['oz', 'lb'];
};

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate a weight input string
 */
export const isValidWeightInput = (input: string): boolean => {
  const parsed = parseWeight(input);
  return parsed.isValid && parsed.grams >= 0;
};

/**
 * Get suggested input formats for a system
 */
export const getInputExamples = (system: WeightSystem): string[] => {
  if (system === 'metric') {
    return ['500', '500g', '1.5kg', '1500 grams'];
  }
  return ['8oz', '2lb', '2 lb 8 oz', '1.5 pounds'];
};
