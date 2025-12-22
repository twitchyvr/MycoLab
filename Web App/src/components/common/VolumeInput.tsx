// ============================================================================
// VOLUME INPUT COMPONENT
// Smart volume input with unit switching, conversion hints, and multi-format support
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../../store';
import {
  VolumeUnit,
  VolumeSystem,
  parseVolume,
  formatVolume,
  fromMl,
  toMl,
  getUnitLabel,
  getConversionHint,
  getUnitsForSystem,
  getDefaultUnit,
  getInputExamples,
} from '../../utils/volume';

interface VolumeInputProps {
  /** Value in milliliters (storage format) */
  value: number | undefined | null;
  /** Called with new value in milliliters */
  onChange: (ml: number | undefined) => void;
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
  /** Minimum volume in ml */
  min?: number;
  /** Maximum volume in ml */
  max?: number;
  /** Show conversion hint below input */
  showConversionHint?: boolean;
  /** Allow empty value (returns undefined) */
  allowEmpty?: boolean;
  /** Force a specific unit system (overrides user preference) */
  forceSystem?: VolumeSystem;
  /** Compact mode for tight spaces */
  compact?: boolean;
}

export const VolumeInput: React.FC<VolumeInputProps> = ({
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
  const system: VolumeSystem = forceSystem || state.settings.defaultUnits || 'metric';

  // Current display unit
  const [displayUnit, setDisplayUnit] = useState<VolumeUnit>(() => getDefaultUnit(system));

  // Raw input string (allows user to type freely)
  const [inputValue, setInputValue] = useState<string>('');

  // Track if user is actively editing
  const [isEditing, setIsEditing] = useState(false);

  // Show unit selector dropdown
  const [showUnitSelector, setShowUnitSelector] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const unitSelectorRef = useRef<HTMLDivElement>(null);
  const unitButtonRef = useRef<HTMLButtonElement>(null);

  // Sync display value when external value changes (and not editing)
  useEffect(() => {
    if (!isEditing) {
      if (value === undefined || value === null || value === 0) {
        setInputValue('');
      } else {
        // Display in current unit
        const displayValue = fromMl(value, displayUnit);
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
      const target = e.target as Node;
      // Check if click is outside both the button and the dropdown
      if (
        unitButtonRef.current && !unitButtonRef.current.contains(target) &&
        unitSelectorRef.current && !unitSelectorRef.current.contains(target)
      ) {
        setShowUnitSelector(false);
      }
    };
    if (showUnitSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUnitSelector]);

  // Calculate dropdown position when opening
  const openUnitSelector = useCallback(() => {
    if (unitButtonRef.current) {
      const rect = unitButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.right - 120, // 120px for unit dropdown width
        width: 120,
      });
    }
    setShowUnitSelector(true);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);

    // Try to parse the input
    const parsed = parseVolume(raw, displayUnit);

    if (parsed.isValid) {
      let ml = parsed.ml;

      // Apply constraints
      if (min !== undefined && ml < min) ml = min;
      if (max !== undefined && ml > max) ml = max;

      onChange(ml);
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
    const parsed = parseVolume(inputValue, displayUnit);
    if (parsed.isValid && parsed.ml > 0) {
      const displayValue = fromMl(parsed.ml, displayUnit);
      const formatted = displayValue % 1 === 0
        ? displayValue.toString()
        : displayValue.toFixed(2).replace(/\.?0+$/, '');
      setInputValue(formatted);
    }
  }, [inputValue, displayUnit, allowEmpty, onChange]);

  const handleUnitChange = useCallback((newUnit: VolumeUnit) => {
    setDisplayUnit(newUnit);
    setShowUnitSelector(false);

    // Convert current value to new unit for display
    if (value !== undefined && value !== null && value > 0) {
      const displayValue = fromMl(value, newUnit);
      const formatted = displayValue % 1 === 0
        ? displayValue.toString()
        : displayValue.toFixed(2).replace(/\.?0+$/, '');
      setInputValue(formatted);
    }
  }, [value]);

  // Get conversion hint text
  const conversionHint = value && value > 0
    ? getConversionHint(value, displayUnit)
    : null;

  // Input examples for placeholder
  const examples = getInputExamples(system);

  // All available units
  const metricUnits: VolumeUnit[] = ['ml', 'L', 'cc'];
  const imperialUnits: VolumeUnit[] = ['fl oz', 'cup', 'qt', 'gal'];

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
      <div className="relative flex items-stretch">
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
            min-w-0 flex-1 bg-zinc-800 border border-zinc-700 rounded-l-lg px-3
            ${compact ? 'py-1.5 text-sm' : 'py-2'}
            text-white placeholder-zinc-500
            focus:outline-none focus:border-emerald-500
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />

        {/* Unit button/selector */}
        <div className="relative flex-shrink-0">
          <button
            ref={unitButtonRef}
            type="button"
            onClick={() => showUnitSelector ? setShowUnitSelector(false) : openUnitSelector()}
            disabled={disabled}
            className={`
              h-full bg-zinc-700 border border-l-0 border-zinc-600 rounded-r-lg
              ${compact ? 'px-2 text-sm w-14' : 'px-2 w-16'}
              text-zinc-300 hover:bg-zinc-600 hover:text-white
              focus:outline-none focus:ring-1 focus:ring-emerald-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors flex items-center justify-center gap-0.5
            `}
          >
            <span className="font-medium text-xs">{displayUnit}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`w-3 h-3 flex-shrink-0 transition-transform ${showUnitSelector ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Unit dropdown - rendered via portal to avoid overflow clipping */}
          {showUnitSelector && dropdownPosition && createPortal(
            <div
              ref={unitSelectorRef}
              className="fixed z-[9999] bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
              }}
            >
              <div className="py-1">
                <div className="px-2 py-0.5 text-[10px] text-zinc-500 uppercase tracking-wide">Metric</div>
                {metricUnits.map(unit => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleUnitChange(unit)}
                    className={`
                      w-full px-2 py-1.5 text-left text-sm flex items-center justify-between
                      ${displayUnit === unit ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-300 hover:bg-zinc-700'}
                    `}
                  >
                    <span className="text-xs">{getUnitLabel(unit, true, true)}</span>
                    <span className="text-[10px] text-zinc-500">{unit}</span>
                  </button>
                ))}
                <div className="border-t border-zinc-700 my-0.5" />
                <div className="px-2 py-0.5 text-[10px] text-zinc-500 uppercase tracking-wide">Imperial</div>
                {imperialUnits.map(unit => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleUnitChange(unit)}
                    className={`
                      w-full px-2 py-1.5 text-left text-sm flex items-center justify-between
                      ${displayUnit === unit ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-300 hover:bg-zinc-700'}
                    `}
                  >
                    <span className="text-xs">{getUnitLabel(unit, true, true)}</span>
                    <span className="text-[10px] text-zinc-500">{unit}</span>
                  </button>
                ))}
              </div>
            </div>,
            document.body
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
// VOLUME DISPLAY COMPONENT
// For displaying volumes in read-only contexts
// ============================================================================

interface VolumeDisplayProps {
  /** Value in milliliters */
  ml: number;
  /** Override display unit */
  unit?: VolumeUnit;
  /** Show conversion on click/hover */
  showConversion?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const VolumeDisplay: React.FC<VolumeDisplayProps> = ({
  ml,
  unit,
  showConversion = true,
  className = '',
}) => {
  const { state } = useData();
  const system: VolumeSystem = state.settings.defaultUnits || 'metric';
  const displayUnit = unit || getDefaultUnit(system);

  const [showTooltip, setShowTooltip] = useState(false);

  const displayText = formatVolume(ml, displayUnit);
  const otherSystemHint = getConversionHint(ml, displayUnit);

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

export default VolumeInput;
