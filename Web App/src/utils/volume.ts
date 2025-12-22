// ============================================================================
// VOLUME UTILITIES
// Convert, format, and parse volumes between metric and imperial systems
// Storage: Always in milliliters (internal standard)
// Display: Based on user preference
// ============================================================================

export type VolumeUnit = 'ml' | 'L' | 'fl oz' | 'cup' | 'qt' | 'gal' | 'cc';
export type VolumeSystem = 'metric' | 'imperial';

// Conversion constants (to milliliters)
const ML_PER_L = 1000;
const ML_PER_FL_OZ = 29.5735;
const ML_PER_CUP = 236.588;
const ML_PER_QT = 946.353;
const ML_PER_GAL = 3785.41;
const ML_PER_CC = 1; // 1 cc = 1 ml

// ============================================================================
// CORE CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert any volume unit to milliliters
 */
export const toMl = (value: number, unit: VolumeUnit): number => {
  switch (unit) {
    case 'ml': return value;
    case 'L': return value * ML_PER_L;
    case 'fl oz': return value * ML_PER_FL_OZ;
    case 'cup': return value * ML_PER_CUP;
    case 'qt': return value * ML_PER_QT;
    case 'gal': return value * ML_PER_GAL;
    case 'cc': return value * ML_PER_CC;
    default: return value;
  }
};

/**
 * Convert milliliters to any volume unit
 */
export const fromMl = (ml: number, unit: VolumeUnit): number => {
  switch (unit) {
    case 'ml': return ml;
    case 'L': return ml / ML_PER_L;
    case 'fl oz': return ml / ML_PER_FL_OZ;
    case 'cup': return ml / ML_PER_CUP;
    case 'qt': return ml / ML_PER_QT;
    case 'gal': return ml / ML_PER_GAL;
    case 'cc': return ml / ML_PER_CC;
    default: return ml;
  }
};

/**
 * Convert between any two units
 */
export const convertVolume = (value: number, from: VolumeUnit, to: VolumeUnit): number => {
  const ml = toMl(value, from);
  return fromMl(ml, to);
};

// ============================================================================
// SMART PARSING - Handle various input formats
// ============================================================================

interface ParsedVolume {
  ml: number;
  isValid: boolean;
  originalInput: string;
  detectedUnit?: VolumeUnit;
}

/**
 * Parse a volume string in various formats:
 * - "500" (uses default unit)
 * - "500ml" or "500 ml" or "500 milliliters"
 * - "1.5L" or "1.5 L" or "1.5 liters"
 * - "8 fl oz" or "8 fl. oz." or "8 fluid ounces"
 * - "2 cups" or "2 cup"
 * - "1 qt" or "1 quart"
 * - "1 gal" or "1 gallon"
 * - "10cc" or "10 cc"
 */
export const parseVolume = (input: string, defaultUnit: VolumeUnit = 'ml'): ParsedVolume => {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return { ml: 0, isValid: false, originalInput: input };
  }

  // Try single value with unit
  const unitPatterns: { pattern: RegExp; unit: VolumeUnit }[] = [
    { pattern: /^(\d+(?:\.\d+)?)\s*(?:ml|milliliters?|mls?)$/i, unit: 'ml' },
    { pattern: /^(\d+(?:\.\d+)?)\s*(?:l|liters?|litres?)$/i, unit: 'L' },
    { pattern: /^(\d+(?:\.\d+)?)\s*(?:fl\.?\s*oz\.?|fluid\s*ounces?)$/i, unit: 'fl oz' },
    { pattern: /^(\d+(?:\.\d+)?)\s*(?:cups?|c)$/i, unit: 'cup' },
    { pattern: /^(\d+(?:\.\d+)?)\s*(?:qt|qts?|quarts?)$/i, unit: 'qt' },
    { pattern: /^(\d+(?:\.\d+)?)\s*(?:gal|gallons?)$/i, unit: 'gal' },
    { pattern: /^(\d+(?:\.\d+)?)\s*(?:cc|cubic\s*centimeters?)$/i, unit: 'cc' },
  ];

  for (const { pattern, unit } of unitPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      return { ml: toMl(value, unit), isValid: true, originalInput: input, detectedUnit: unit };
    }
  }

  // Try plain number (use default unit)
  const plainNumber = trimmed.match(/^(\d+(?:\.\d+)?)$/);
  if (plainNumber) {
    const value = parseFloat(plainNumber[1]);
    return { ml: toMl(value, defaultUnit), isValid: true, originalInput: input, detectedUnit: defaultUnit };
  }

  return { ml: 0, isValid: false, originalInput: input };
};

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

interface FormatOptions {
  precision?: number;      // Decimal places (auto if not specified)
  includeUnit?: boolean;   // Include unit suffix
  longUnit?: boolean;      // Use "milliliters" instead of "ml"
  forceDecimal?: boolean;  // Always show decimal places
}

/**
 * Get the best unit for displaying a volume value
 * Metric: ml for < 1000ml, L for >= 1000ml
 * Imperial: fl oz for < 32 fl oz, qt for < 4 qt, gal for >= 4 qt
 */
export const getBestUnit = (ml: number, system: VolumeSystem): VolumeUnit => {
  if (system === 'metric') {
    return ml >= 1000 ? 'L' : 'ml';
  } else {
    const flOz = fromMl(ml, 'fl oz');
    const qt = fromMl(ml, 'qt');
    if (flOz < 32) return 'fl oz';
    if (qt < 4) return 'qt';
    return 'gal';
  }
};

/**
 * Get display precision based on value and unit
 */
const getAutoPrecision = (value: number, unit: VolumeUnit): number => {
  if (unit === 'ml' || unit === 'cc') {
    return value >= 100 ? 0 : value >= 10 ? 1 : 2;
  }
  if (unit === 'L') {
    return value >= 10 ? 1 : 2;
  }
  if (unit === 'fl oz') {
    return value >= 10 ? 1 : 2;
  }
  if (unit === 'cup' || unit === 'qt') {
    return value >= 10 ? 1 : 2;
  }
  if (unit === 'gal') {
    return 2;
  }
  return 2;
};

/**
 * Get unit label (short or long)
 */
export const getUnitLabel = (unit: VolumeUnit, plural: boolean = true, long: boolean = false): string => {
  const labels: Record<VolumeUnit, { short: string; long: string; longPlural: string }> = {
    ml: { short: 'ml', long: 'milliliter', longPlural: 'milliliters' },
    L: { short: 'L', long: 'liter', longPlural: 'liters' },
    'fl oz': { short: 'fl oz', long: 'fluid ounce', longPlural: 'fluid ounces' },
    cup: { short: 'cup', long: 'cup', longPlural: 'cups' },
    qt: { short: 'qt', long: 'quart', longPlural: 'quarts' },
    gal: { short: 'gal', long: 'gallon', longPlural: 'gallons' },
    cc: { short: 'cc', long: 'cubic centimeter', longPlural: 'cubic centimeters' },
  };

  const label = labels[unit];
  if (long) {
    return plural ? label.longPlural : label.long;
  }
  return label.short;
};

/**
 * Format a volume value for display
 * @param ml - Volume in milliliters (storage format)
 * @param unit - Target display unit
 * @param options - Formatting options
 */
export const formatVolume = (
  ml: number,
  unit: VolumeUnit,
  options: FormatOptions = {}
): string => {
  const { precision, includeUnit = true, longUnit = false, forceDecimal = false } = options;

  const value = fromMl(ml, unit);
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
 * Format volume using best unit for the system
 */
export const formatVolumeAuto = (ml: number, system: VolumeSystem, options: FormatOptions = {}): string => {
  const unit = getBestUnit(ml, system);
  return formatVolume(ml, unit, options);
};

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get all conversions for a volume value (for tooltips/info)
 */
export const getAllConversions = (ml: number): Record<VolumeUnit, string> => {
  return {
    ml: formatVolume(ml, 'ml', { precision: 0 }),
    L: formatVolume(ml, 'L', { precision: 2 }),
    'fl oz': formatVolume(ml, 'fl oz', { precision: 1 }),
    cup: formatVolume(ml, 'cup', { precision: 2 }),
    qt: formatVolume(ml, 'qt', { precision: 2 }),
    gal: formatVolume(ml, 'gal', { precision: 2 }),
    cc: formatVolume(ml, 'cc', { precision: 0 }),
  };
};

/**
 * Get a human-readable conversion hint
 */
export const getConversionHint = (ml: number, currentUnit: VolumeUnit): string => {
  const conversions = getAllConversions(ml);
  const hints: string[] = [];

  // Show the "other system" conversion
  if (currentUnit === 'ml' || currentUnit === 'L' || currentUnit === 'cc') {
    // Currently metric, show imperial
    if (ml >= ML_PER_GAL) {
      hints.push(conversions.gal);
    } else if (ml >= ML_PER_QT) {
      hints.push(conversions.qt);
    } else {
      hints.push(conversions['fl oz']);
    }
  } else {
    // Currently imperial, show metric
    if (ml >= 1000) {
      hints.push(conversions.L);
    } else {
      hints.push(conversions.ml);
    }
  }

  return hints.join(' / ');
};

/**
 * Get default unit for a system
 */
export const getDefaultUnit = (system: VolumeSystem): VolumeUnit => {
  return system === 'metric' ? 'ml' : 'fl oz';
};

/**
 * Get all units for a system
 */
export const getUnitsForSystem = (system: VolumeSystem): VolumeUnit[] => {
  return system === 'metric' ? ['ml', 'L', 'cc'] : ['fl oz', 'cup', 'qt', 'gal'];
};

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate a volume input string
 */
export const isValidVolumeInput = (input: string): boolean => {
  const parsed = parseVolume(input);
  return parsed.isValid && parsed.ml >= 0;
};

/**
 * Get suggested input formats for a system
 */
export const getInputExamples = (system: VolumeSystem): string[] => {
  if (system === 'metric') {
    return ['500', '500ml', '1.5L', '10cc'];
  }
  return ['8 fl oz', '2 cups', '1 qt', '1.5 gal'];
};
