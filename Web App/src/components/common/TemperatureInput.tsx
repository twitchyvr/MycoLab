// ============================================================================
// TEMPERATURE INPUT COMPONENT
// Smart temperature input with unit switching (°C/°F)
// Respects user's defaultUnits setting
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../../store';
import {
  TemperatureUnit,
  TEMPERATURE_UNITS,
  toCelsius,
  fromCelsius,
  formatTemperature,
} from '../../utils/units';

interface TemperatureInputProps {
  /** Value in Celsius (storage format) */
  value: number | undefined | null;
  /** Called with new value in Celsius */
  onChange: (celsius: number | undefined) => void;
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
  /** Minimum temperature in Celsius */
  min?: number;
  /** Maximum temperature in Celsius */
  max?: number;
  /** Show conversion hint below input */
  showConversionHint?: boolean;
  /** Allow empty value (returns undefined) */
  allowEmpty?: boolean;
  /** Force a specific unit (overrides user preference) */
  forceUnit?: TemperatureUnit;
  /** Compact mode for tight spaces */
  compact?: boolean;
  /** Helper text to show below input */
  helperText?: string;
}

export const TemperatureInput: React.FC<TemperatureInputProps> = ({
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
  forceUnit,
  compact = false,
  helperText,
}) => {
  const { state } = useData();

  // Determine default unit based on user's unit system preference
  const getDefaultUnit = (): TemperatureUnit => {
    if (forceUnit) return forceUnit;
    return state.settings.defaultUnits === 'imperial' ? 'F' : 'C';
  };

  // Current display unit
  const [displayUnit, setDisplayUnit] = useState<TemperatureUnit>(getDefaultUnit);

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
      if (value === undefined || value === null) {
        setInputValue('');
      } else {
        // Display in current unit
        const displayValue = fromCelsius(value, displayUnit);
        // Round to 1 decimal for display
        const formatted = Math.round(displayValue * 10) / 10;
        setInputValue(formatted.toString());
      }
    }
  }, [value, displayUnit, isEditing]);

  // Update display unit when system changes
  useEffect(() => {
    if (!forceUnit) {
      setDisplayUnit(getDefaultUnit());
    }
  }, [state.settings.defaultUnits, forceUnit]);

  // Close unit selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
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
        left: rect.right - 100,
        width: 100,
      });
    }
    setShowUnitSelector(true);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);

    // Try to parse the input as a number
    const numValue = parseFloat(raw);

    if (!isNaN(numValue)) {
      let celsius = toCelsius(numValue, displayUnit);

      // Apply constraints (in Celsius)
      if (min !== undefined && celsius < min) celsius = min;
      if (max !== undefined && celsius > max) celsius = max;

      onChange(celsius);
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
    if (inputValue === '') {
      if (!allowEmpty) {
        setInputValue('0');
        onChange(0);
      }
      return;
    }

    // Re-parse and format properly
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      const formatted = Math.round(numValue * 10) / 10;
      setInputValue(formatted.toString());
    }
  }, [inputValue, allowEmpty, onChange]);

  const handleUnitChange = useCallback((newUnit: TemperatureUnit) => {
    setDisplayUnit(newUnit);
    setShowUnitSelector(false);

    // Convert current value to new unit for display
    if (value !== undefined && value !== null) {
      const displayValue = fromCelsius(value, newUnit);
      const formatted = Math.round(displayValue * 10) / 10;
      setInputValue(formatted.toString());
    }
  }, [value]);

  // Get conversion hint text
  const getConversionHint = (): string | null => {
    if (value === undefined || value === null) return null;
    if (displayUnit === 'C') {
      const fahrenheit = Math.round(fromCelsius(value, 'F') * 10) / 10;
      return `= ${fahrenheit}°F`;
    } else {
      const celsius = Math.round(value * 10) / 10;
      return `= ${celsius}°C`;
    }
  };

  const conversionHint = getConversionHint();

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
          placeholder={placeholder || (displayUnit === 'C' ? '25' : '77')}
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
              ${compact ? 'px-2 text-sm w-12' : 'px-3 w-14'}
              text-zinc-300 hover:bg-zinc-600 hover:text-white
              focus:outline-none focus:ring-1 focus:ring-emerald-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors flex items-center justify-center gap-1
            `}
          >
            <span className="font-medium text-sm">{TEMPERATURE_UNITS[displayUnit].label}</span>
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
                <button
                  type="button"
                  onClick={() => handleUnitChange('C')}
                  className={`
                    w-full px-2 py-1.5 text-left text-sm flex items-center justify-between
                    ${displayUnit === 'C' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-300 hover:bg-zinc-700'}
                  `}
                >
                  <span className="text-xs">Celsius</span>
                  <span className="text-[10px] text-zinc-500">°C</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitChange('F')}
                  className={`
                    w-full px-2 py-1.5 text-left text-sm flex items-center justify-between
                    ${displayUnit === 'F' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-300 hover:bg-zinc-700'}
                  `}
                >
                  <span className="text-xs">Fahrenheit</span>
                  <span className="text-[10px] text-zinc-500">°F</span>
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* Helper text or conversion hint */}
      {(helperText || (showConversionHint && conversionHint)) && (
        <p className="text-xs text-zinc-500 flex items-center gap-1">
          {showConversionHint && conversionHint && (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              {conversionHint}
              {helperText && <span className="mx-1">•</span>}
            </>
          )}
          {helperText}
        </p>
      )}
    </div>
  );
};

export default TemperatureInput;
