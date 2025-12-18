// ============================================================================
// WEIGHT INPUT COMPONENT
// Smart weight input with unit switching, conversion hints, and multi-format support
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useData } from '../../store';
import {
  WeightUnit,
  WeightSystem,
  parseWeight,
  formatWeight,
  fromGrams,
  toGrams,
  getUnitLabel,
  getConversionHint,
  getUnitsForSystem,
  getDefaultUnit,
  getInputExamples,
  formatWeightCompound,
} from '../../utils/weight';

interface WeightInputProps {
  /** Value in grams (storage format) */
  value: number | undefined | null;
  /** Called with new value in grams */
  onChange: (grams: number | undefined) => void;
  /** Label for the field */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Minimum weight in grams */
  min?: number;
  /** Maximum weight in grams */
  max?: number;
  /** Show conversion hint below input */
  showConversionHint?: boolean;
  /** Allow empty value (returns undefined) */
  allowEmpty?: boolean;
  /** Force a specific unit system (overrides user preference) */
  forceSystem?: WeightSystem;
  /** Compact mode for tight spaces */
  compact?: boolean;
}

export const WeightInput: React.FC<WeightInputProps> = ({
  value,
  onChange,
  label,
  placeholder,
  className = '',
  required = false,
  disabled = false,
  min,
  max,
  showConversionHint = true,
  allowEmpty = true,
  forceSystem,
  compact = false,
}) => {
  const { state } = useData();
  const system: WeightSystem = forceSystem || state.settings.defaultUnits || 'metric';

  // Current display unit
  const [displayUnit, setDisplayUnit] = useState<WeightUnit>(() => getDefaultUnit(system));

  // Raw input string (allows user to type freely)
  const [inputValue, setInputValue] = useState<string>('');

  // Track if user is actively editing
  const [isEditing, setIsEditing] = useState(false);

  // Show unit selector dropdown
  const [showUnitSelector, setShowUnitSelector] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const unitSelectorRef = useRef<HTMLDivElement>(null);

  // Sync display value when external value changes (and not editing)
  useEffect(() => {
    if (!isEditing) {
      if (value === undefined || value === null || value === 0) {
        setInputValue('');
      } else {
        // Display in current unit
        const displayValue = fromGrams(value, displayUnit);
        // Smart formatting: no decimals for whole numbers, up to 2 for decimals
        const formatted = displayValue % 1 === 0
          ? displayValue.toString()
          : displayValue.toFixed(2).replace(/\.?0+$/, '');
        setInputValue(formatted);
      }
    }
  }, [value, displayUnit, isEditing]);

  // Update display unit when system changes
  useEffect(() => {
    setDisplayUnit(getDefaultUnit(system));
  }, [system]);

  // Close unit selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (unitSelectorRef.current && !unitSelectorRef.current.contains(e.target as Node)) {
        setShowUnitSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);

    // Try to parse the input
    const parsed = parseWeight(raw, displayUnit);

    if (parsed.isValid) {
      let grams = parsed.grams;

      // Apply constraints
      if (min !== undefined && grams < min) grams = min;
      if (max !== undefined && grams > max) grams = max;

      onChange(grams);
    } else if (raw === '' && allowEmpty) {
      onChange(undefined);
    }
  }, [displayUnit, onChange, min, max, allowEmpty]);

  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);

    // Clean up input on blur
    if (inputValue === '' || inputValue === '0') {
      if (!allowEmpty) {
        setInputValue('0');
        onChange(0);
      }
      return;
    }

    // Re-parse and format properly
    const parsed = parseWeight(inputValue, displayUnit);
    if (parsed.isValid && parsed.grams > 0) {
      const displayValue = fromGrams(parsed.grams, displayUnit);
      const formatted = displayValue % 1 === 0
        ? displayValue.toString()
        : displayValue.toFixed(2).replace(/\.?0+$/, '');
      setInputValue(formatted);
    }
  }, [inputValue, displayUnit, allowEmpty, onChange]);

  const handleUnitChange = useCallback((newUnit: WeightUnit) => {
    setDisplayUnit(newUnit);
    setShowUnitSelector(false);

    // Convert current value to new unit for display
    if (value !== undefined && value !== null && value > 0) {
      const displayValue = fromGrams(value, newUnit);
      const formatted = displayValue % 1 === 0
        ? displayValue.toString()
        : displayValue.toFixed(2).replace(/\.?0+$/, '');
      setInputValue(formatted);
    }
  }, [value]);

  const cycleUnit = useCallback(() => {
    const units = getUnitsForSystem(system);
    const currentIndex = units.indexOf(displayUnit);
    const nextUnit = units[(currentIndex + 1) % units.length];
    handleUnitChange(nextUnit);
  }, [system, displayUnit, handleUnitChange]);

  // Get available units for the selector
  const availableUnits: WeightUnit[] = ['g', 'kg', 'oz', 'lb'];

  // Get conversion hint text
  const conversionHint = value && value > 0
    ? getConversionHint(value, displayUnit)
    : null;

  // Input examples for placeholder
  const examples = getInputExamples(system);

  return (
    <div className={`${compact ? 'space-y-1' : 'space-y-2'} ${className}`}>
      {/* Label */}
      {label && (
        <label className={`block ${compact ? 'text-xs' : 'text-sm'} text-zinc-400`}>
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Input with unit selector */}
      <div className="relative flex">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || examples[0]}
          disabled={disabled}
          className={`
            flex-1 bg-zinc-800 border border-zinc-700 rounded-l-lg px-3
            ${compact ? 'py-1.5 text-sm' : 'py-2'}
            text-white placeholder-zinc-500
            focus:outline-none focus:border-emerald-500
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />

        {/* Unit button/selector */}
        <div className="relative" ref={unitSelectorRef}>
          <button
            type="button"
            onClick={() => setShowUnitSelector(!showUnitSelector)}
            disabled={disabled}
            className={`
              bg-zinc-700 border border-l-0 border-zinc-600 rounded-r-lg
              ${compact ? 'px-2 py-1.5 text-sm min-w-[50px]' : 'px-3 py-2 min-w-[60px]'}
              text-zinc-300 hover:bg-zinc-600 hover:text-white
              focus:outline-none focus:ring-1 focus:ring-emerald-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors flex items-center justify-center gap-1
            `}
          >
            <span className="font-medium">{getUnitLabel(displayUnit, true, false)}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`w-3 h-3 transition-transform ${showUnitSelector ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Unit dropdown */}
          {showUnitSelector && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden min-w-[120px]">
              <div className="py-1">
                <div className="px-3 py-1 text-xs text-zinc-500 uppercase tracking-wide">Metric</div>
                {['g', 'kg'].map(unit => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleUnitChange(unit as WeightUnit)}
                    className={`
                      w-full px-3 py-2 text-left text-sm flex items-center justify-between
                      ${displayUnit === unit ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-300 hover:bg-zinc-700'}
                    `}
                  >
                    <span>{getUnitLabel(unit as WeightUnit, true, true)}</span>
                    <span className="text-xs text-zinc-500">{unit}</span>
                  </button>
                ))}
                <div className="border-t border-zinc-700 my-1" />
                <div className="px-3 py-1 text-xs text-zinc-500 uppercase tracking-wide">Imperial</div>
                {['oz', 'lb'].map(unit => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleUnitChange(unit as WeightUnit)}
                    className={`
                      w-full px-3 py-2 text-left text-sm flex items-center justify-between
                      ${displayUnit === unit ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-300 hover:bg-zinc-700'}
                    `}
                  >
                    <span>{getUnitLabel(unit as WeightUnit, true, true)}</span>
                    <span className="text-xs text-zinc-500">{unit}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conversion hint */}
      {showConversionHint && conversionHint && (
        <p className="text-xs text-zinc-500 flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          {conversionHint}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// WEIGHT DISPLAY COMPONENT
// For displaying weights in read-only contexts
// ============================================================================

interface WeightDisplayProps {
  /** Value in grams */
  grams: number;
  /** Override display unit */
  unit?: WeightUnit;
  /** Show conversion on click/hover */
  showConversion?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Use compound format for imperial (e.g., "1 lb 8 oz") */
  compound?: boolean;
}

export const WeightDisplay: React.FC<WeightDisplayProps> = ({
  grams,
  unit,
  showConversion = true,
  className = '',
  compound = false,
}) => {
  const { state } = useData();
  const system: WeightSystem = state.settings.defaultUnits || 'metric';
  const displayUnit = unit || getDefaultUnit(system);

  const [showTooltip, setShowTooltip] = useState(false);

  if (compound && system === 'imperial') {
    return (
      <span
        className={`relative ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {formatWeightCompound(grams, system)}
        {showConversion && showTooltip && (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-700 text-xs text-zinc-300 rounded whitespace-nowrap z-10">
            {formatWeight(grams, 'g')} / {formatWeight(grams, 'kg')}
          </span>
        )}
      </span>
    );
  }

  const displayText = formatWeight(grams, displayUnit);
  const otherSystemHint = getConversionHint(grams, displayUnit);

  return (
    <span
      className={`relative cursor-help ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title={showConversion ? otherSystemHint : undefined}
    >
      {displayText}
      {showConversion && showTooltip && otherSystemHint && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-700 text-xs text-zinc-300 rounded whitespace-nowrap z-10">
          {otherSystemHint}
        </span>
      )}
    </span>
  );
};

export default WeightInput;
