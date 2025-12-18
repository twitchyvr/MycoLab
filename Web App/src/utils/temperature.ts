// ============================================================================
// TEMPERATURE UTILITIES
// Convert and format temperatures based on user preferences
// ============================================================================

export type TemperatureUnit = 'metric' | 'imperial';

/**
 * Convert Fahrenheit to Celsius
 */
export const fahrenheitToCelsius = (f: number): number => {
  return Math.round(((f - 32) * 5) / 9);
};

/**
 * Convert Celsius to Fahrenheit
 */
export const celsiusToFahrenheit = (c: number): number => {
  return Math.round((c * 9) / 5 + 32);
};

/**
 * Format a temperature value based on the unit preference
 * @param tempF - Temperature in Fahrenheit (stored format)
 * @param unit - User's preferred unit ('metric' for Celsius, 'imperial' for Fahrenheit)
 * @param includeUnit - Whether to include the °F/°C suffix
 */
export const formatTemperature = (
  tempF: number,
  unit: TemperatureUnit,
  includeUnit: boolean = true
): string => {
  if (unit === 'metric') {
    const celsius = fahrenheitToCelsius(tempF);
    return includeUnit ? `${celsius}°C` : `${celsius}`;
  }
  return includeUnit ? `${tempF}°F` : `${tempF}`;
};

/**
 * Format a temperature range based on the unit preference
 * @param minF - Minimum temperature in Fahrenheit
 * @param maxF - Maximum temperature in Fahrenheit
 * @param unit - User's preferred unit
 */
export const formatTemperatureRange = (
  minF: number,
  maxF: number,
  unit: TemperatureUnit
): string => {
  if (unit === 'metric') {
    return `${fahrenheitToCelsius(minF)}-${fahrenheitToCelsius(maxF)}°C`;
  }
  return `${minF}-${maxF}°F`;
};

/**
 * Get the temperature unit symbol
 */
export const getTemperatureUnit = (unit: TemperatureUnit): string => {
  return unit === 'metric' ? '°C' : '°F';
};

/**
 * Format a temperature range object
 */
export const formatTempRange = (
  range: { min: number; max: number; optimal?: number } | undefined,
  unit: TemperatureUnit
): { min: string; max: string; optimal?: string; unit: string } | null => {
  if (!range) return null;

  if (unit === 'metric') {
    return {
      min: `${fahrenheitToCelsius(range.min)}`,
      max: `${fahrenheitToCelsius(range.max)}`,
      optimal: range.optimal ? `${fahrenheitToCelsius(range.optimal)}` : undefined,
      unit: '°C',
    };
  }

  return {
    min: `${range.min}`,
    max: `${range.max}`,
    optimal: range.optimal ? `${range.optimal}` : undefined,
    unit: '°F',
  };
};
