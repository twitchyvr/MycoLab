// ============================================================================
// UNITS UTILITY
// Centralized unit conversion and formatting for consistent measurement handling
// across the entire application (calculators, forms, displays)
// ============================================================================

// ============================================================================
// WEIGHT UNITS
// ============================================================================

export const WEIGHT_UNITS = {
  g: { label: 'g', fullLabel: 'grams', factor: 1 },
  kg: { label: 'kg', fullLabel: 'kilograms', factor: 1000 },
  oz: { label: 'oz', fullLabel: 'ounces', factor: 28.3495 },
  lb: { label: 'lb', fullLabel: 'pounds', factor: 453.592 },
} as const;

export type WeightUnit = keyof typeof WEIGHT_UNITS;

// Convert between weight units
export const convertWeight = (value: number, from: WeightUnit, to: WeightUnit): number => {
  const inGrams = value * WEIGHT_UNITS[from].factor;
  return inGrams / WEIGHT_UNITS[to].factor;
};

// Convert to grams
export const toGrams = (value: number, unit: WeightUnit): number => {
  return value * WEIGHT_UNITS[unit].factor;
};

// Convert from grams
export const fromGrams = (grams: number, unit: WeightUnit): number => {
  return grams / WEIGHT_UNITS[unit].factor;
};

// Format weight with unit
export const formatWeight = (value: number, unit: WeightUnit, decimals: number = 1): string => {
  return `${value.toFixed(decimals)} ${WEIGHT_UNITS[unit].label}`;
};

// ============================================================================
// VOLUME UNITS
// ============================================================================

export const VOLUME_UNITS = {
  ml: { label: 'ml', fullLabel: 'milliliters', factor: 1 },
  L: { label: 'L', fullLabel: 'liters', factor: 1000 },
  cc: { label: 'cc', fullLabel: 'cubic centimeters', factor: 1 }, // 1cc = 1ml
  'fl oz': { label: 'fl oz', fullLabel: 'fluid ounces', factor: 29.5735 },
  cup: { label: 'cup', fullLabel: 'cups', factor: 236.588 },
  gal: { label: 'gal', fullLabel: 'gallons', factor: 3785.41 },
} as const;

export type VolumeUnit = keyof typeof VOLUME_UNITS;

// Convert between volume units
export const convertVolume = (value: number, from: VolumeUnit, to: VolumeUnit): number => {
  const inMl = value * VOLUME_UNITS[from].factor;
  return inMl / VOLUME_UNITS[to].factor;
};

// Convert to milliliters
export const toMl = (value: number, unit: VolumeUnit): number => {
  return value * VOLUME_UNITS[unit].factor;
};

// Convert from milliliters
export const fromMl = (ml: number, unit: VolumeUnit): number => {
  return ml / VOLUME_UNITS[unit].factor;
};

// Format volume with unit
export const formatVolume = (value: number, unit: VolumeUnit, decimals: number = 1): string => {
  return `${value.toFixed(decimals)} ${VOLUME_UNITS[unit].label}`;
};

// ============================================================================
// TEMPERATURE UNITS
// ============================================================================

export const TEMPERATURE_UNITS = {
  C: { label: '°C', fullLabel: 'Celsius' },
  F: { label: '°F', fullLabel: 'Fahrenheit' },
} as const;

export type TemperatureUnit = keyof typeof TEMPERATURE_UNITS;

// Convert between temperature units
export const convertTemperature = (value: number, from: TemperatureUnit, to: TemperatureUnit): number => {
  if (from === to) return value;
  if (from === 'C' && to === 'F') return (value * 9/5) + 32;
  if (from === 'F' && to === 'C') return (value - 32) * 5/9;
  return value;
};

// Convert to Celsius (storage format)
export const toCelsius = (value: number, unit: TemperatureUnit): number => {
  if (unit === 'C') return value;
  return (value - 32) * 5/9; // Fahrenheit to Celsius
};

// Convert from Celsius (display format)
export const fromCelsius = (celsius: number, unit: TemperatureUnit): number => {
  if (unit === 'C') return celsius;
  return (celsius * 9/5) + 32; // Celsius to Fahrenheit
};

// Format temperature with unit
export const formatTemperature = (value: number, unit: TemperatureUnit, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}${TEMPERATURE_UNITS[unit].label}`;
};

// ============================================================================
// HELPER: Get appropriate decimal places based on unit size
// ============================================================================

export const getDecimalPlaces = (unit: WeightUnit | VolumeUnit): number => {
  // Larger units need more decimal places for precision
  if (unit === 'kg' || unit === 'lb' || unit === 'L' || unit === 'gal') return 2;
  if (unit === 'oz' || unit === 'cup') return 1;
  return 1;
};

// ============================================================================
// ALTITUDE UNITS
// ============================================================================

export const ALTITUDE_UNITS = {
  ft: { label: 'ft', fullLabel: 'feet', factor: 1 },
  m: { label: 'm', fullLabel: 'meters', factor: 3.28084 }, // 1m = 3.28084ft
} as const;

export type AltitudeUnit = keyof typeof ALTITUDE_UNITS;

// Convert between altitude units
export const convertAltitude = (value: number, from: AltitudeUnit, to: AltitudeUnit): number => {
  const inFeet = value * ALTITUDE_UNITS[from].factor;
  return inFeet / ALTITUDE_UNITS[to].factor;
};

// Convert to feet
export const toFeet = (value: number, unit: AltitudeUnit): number => {
  if (unit === 'ft') return value;
  return value * 3.28084; // meters to feet
};

// Convert from feet
export const fromFeet = (feet: number, unit: AltitudeUnit): number => {
  if (unit === 'ft') return feet;
  return feet / 3.28084; // feet to meters
};

// Format altitude with unit
export const formatAltitude = (value: number, unit: AltitudeUnit, decimals: number = 0): string => {
  return `${value.toFixed(decimals)} ${ALTITUDE_UNITS[unit].label}`;
};

// ============================================================================
// COMMON UNIT GROUPS FOR DROPDOWNS
// ============================================================================

export const WEIGHT_UNIT_OPTIONS = Object.entries(WEIGHT_UNITS).map(([key, value]) => ({
  value: key as WeightUnit,
  label: value.label,
  fullLabel: value.fullLabel,
}));

export const VOLUME_UNIT_OPTIONS = Object.entries(VOLUME_UNITS).map(([key, value]) => ({
  value: key as VolumeUnit,
  label: value.label,
  fullLabel: value.fullLabel,
}));

export const TEMPERATURE_UNIT_OPTIONS = Object.entries(TEMPERATURE_UNITS).map(([key, value]) => ({
  value: key as TemperatureUnit,
  label: value.label,
  fullLabel: value.fullLabel,
}));

export const ALTITUDE_UNIT_OPTIONS = Object.entries(ALTITUDE_UNITS).map(([key, value]) => ({
  value: key as AltitudeUnit,
  label: value.label,
  fullLabel: value.fullLabel,
}));
