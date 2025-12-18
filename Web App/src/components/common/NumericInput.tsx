import React, { useState, useEffect, useCallback } from 'react';

interface NumericInputProps {
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  allowEmpty?: boolean; // If false, empty values become 0 (default: true)
  defaultValue?: number; // Value to use when empty and allowEmpty is false
}

/**
 * A numeric input component that properly handles backspace and empty values.
 *
 * Unlike a raw <input type="number"> with parseInt(e.target.value) || 0,
 * this component allows users to fully clear the field with backspace
 * without it snapping to "0" and causing leading zeros when typing new values.
 */
export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '',
  min,
  max,
  step,
  disabled = false,
  required = false,
  allowEmpty = true,
  defaultValue = 0,
}) => {
  // Track the display string separately to allow empty states
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (value === undefined || value === null) return '';
    return String(value);
  });

  // Sync display value when external value changes (e.g., form reset)
  useEffect(() => {
    if (value === undefined || value === null) {
      setDisplayValue('');
    } else {
      // Only update if the numeric values are different to avoid cursor jumping
      const currentNumeric = displayValue === '' ? undefined : parseFloat(displayValue);
      if (currentNumeric !== value) {
        setDisplayValue(String(value));
      }
    }
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Allow empty string
    if (rawValue === '') {
      setDisplayValue('');
      onChange(allowEmpty ? undefined : defaultValue);
      return;
    }

    // Allow typing a negative sign or decimal point as first character
    if (rawValue === '-' || rawValue === '.') {
      setDisplayValue(rawValue);
      return;
    }

    // Parse the value
    const parsed = parseFloat(rawValue);

    if (!isNaN(parsed)) {
      // Apply min/max constraints
      let constrainedValue = parsed;
      if (min !== undefined && parsed < min) constrainedValue = min;
      if (max !== undefined && parsed > max) constrainedValue = max;

      // Update display with raw value to preserve user input (e.g., "10." while typing "10.5")
      setDisplayValue(rawValue);
      onChange(constrainedValue);
    }
  }, [onChange, allowEmpty, defaultValue, min, max]);

  const handleBlur = useCallback(() => {
    // On blur, clean up the display value
    if (displayValue === '' || displayValue === '-' || displayValue === '.') {
      if (!allowEmpty) {
        setDisplayValue(String(defaultValue));
        onChange(defaultValue);
      }
      return;
    }

    const parsed = parseFloat(displayValue);
    if (!isNaN(parsed)) {
      // Clean up display (remove trailing dots, leading zeros except for decimals)
      setDisplayValue(String(parsed));
    }
  }, [displayValue, allowEmpty, defaultValue, onChange]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      step={step}
    />
  );
};

export default NumericInput;
