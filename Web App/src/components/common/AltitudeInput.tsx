// ============================================================================
// ALTITUDE INPUT COMPONENT
// Smart altitude input with unit switching (feet/meters)
// Respects user's defaultUnits setting
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../../store';
import {
  AltitudeUnit,
  ALTITUDE_UNITS,
  toFeet,
  fromFeet,
  formatAltitude,
} from '../../utils/units';

interface AltitudeInputProps {
  /** Value in feet (storage format) */
  value: number | undefined | null;
  /** Called with new value in feet */
  onChange: (feet: number | undefined) => void;
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
  /** Minimum altitude in feet */
  min?: number;
  /** Maximum altitude in feet */
  max?: number;
  /** Show conversion hint below input */
  showConversionHint?: boolean;
  /** Allow empty value (returns undefined) */
  allowEmpty?: boolean;
  /** Force a specific unit (overrides user preference) */
  forceUnit?: AltitudeUnit;
  /** Compact mode for tight spaces */
  compact?: boolean;
  /** Helper text to show below input */
  helperText?: string;
}

export const AltitudeInput: React.FC<AltitudeInputProps> = ({
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
  const getDefaultUnit = (): AltitudeUnit => {
    if (forceUnit) return forceUnit;
    return state.settings.defaultUnits === 'imperial' ? 'ft' : 'm';
  };

  // Current display unit
  const [displayUnit, setDisplayUnit] = useState<AltitudeUnit>(getDefaultUnit);

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
        const displayValue = fromFeet(value, displayUnit);
        // Smart formatting: no decimals for whole numbers, up to 0 for altitude
        const formatted = Math.round(displayValue).toString();
        setInputValue(formatted);
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
      let feet = toFeet(numValue, displayUnit);

      // Apply constraints
      if (min !== undefined && feet < min) feet = min;
      if (max !== undefined && feet > max) feet = max;

      onChange(feet);
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
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      const formatted = Math.round(numValue).toString();
      setInputValue(formatted);
    }
  }, [inputValue, allowEmpty, onChange]);

  const handleUnitChange = useCallback((newUnit: AltitudeUnit) => {
    setDisplayUnit(newUnit);
    setShowUnitSelector(false);

    // Convert current value to new unit for display
    if (value !== undefined && value !== null) {
      const displayValue = fromFeet(value, newUnit);
      const formatted = Math.round(displayValue).toString();
      setInputValue(formatted);
    }
  }, [value]);

  // Get conversion hint text
  const getConversionHint = (): string | null => {
    if (!value || value === 0) return null;
    if (displayUnit === 'ft') {
      const meters = Math.round(fromFeet(value, 'm'));
      return `≈ ${meters} m`;
    } else {
      const feet = Math.round(value);
      return `≈ ${feet.toLocaleString()} ft`;
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
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || (displayUnit === 'ft' ? '0' : '0')}
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
            <span className="font-medium text-sm">{displayUnit}</span>
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
                <div className="px-2 py-0.5 text-[10px] text-zinc-500 uppercase tracking-wide">Imperial</div>
                <button
                  type="button"
                  onClick={() => handleUnitChange('ft')}
                  className={`
                    w-full px-2 py-1.5 text-left text-sm flex items-center justify-between
                    ${displayUnit === 'ft' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-300 hover:bg-zinc-700'}
                  `}
                >
                  <span className="text-xs">feet</span>
                  <span className="text-[10px] text-zinc-500">ft</span>
                </button>
                <div className="border-t border-zinc-700 my-0.5" />
                <div className="px-2 py-0.5 text-[10px] text-zinc-500 uppercase tracking-wide">Metric</div>
                <button
                  type="button"
                  onClick={() => handleUnitChange('m')}
                  className={`
                    w-full px-2 py-1.5 text-left text-sm flex items-center justify-between
                    ${displayUnit === 'm' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-300 hover:bg-zinc-700'}
                  `}
                >
                  <span className="text-xs">meters</span>
                  <span className="text-[10px] text-zinc-500">m</span>
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

export default AltitudeInput;
