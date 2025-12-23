// ============================================================================
// SEARCHABLE DROPDOWN - Dropdown with inline search/filtering
// ============================================================================
//
// This component provides a searchable dropdown experience for large lists.
// Unlike the native <select>, users can type to filter options instantly.
//
// Features:
// - Inline search filtering
// - Keyboard navigation (arrows, enter, escape)
// - Custom option rendering with secondary info
// - "Add New" button integration via CreationContext
// - Portal rendering to avoid overflow issues
//
// Usage:
// <SearchableDropdown
//   value={formData.strainId}
//   onChange={value => setFormData({ ...formData, strainId: value })}
//   options={strains.map(s => ({ id: s.id, name: s.name, subtitle: s.species }))}
//   label="Strain"
//   placeholder="Search strains..."
//   entityType="strain"
// />
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCreation, CreatableEntityType, ENTITY_CONFIGS } from '../../store/CreationContext';
import { useAuthGuard } from '../../lib/useAuthGuard';

// ============================================================================
// TYPES
// ============================================================================

export interface SearchableOption {
  id: string;
  name: string;           // Primary display text
  subtitle?: string;      // Secondary text (species, category, etc.)
  metadata?: string;      // Additional info (difficulty, status, etc.)
  searchText?: string;    // Custom search text (defaults to name + subtitle)
}

export interface SearchableDropdownProps {
  // Core props
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];

  // Display props
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  helpText?: string;

  // Entity creation props
  entityType?: CreatableEntityType;
  fieldName?: string;
  addLabel?: string;

  // Customization
  renderOption?: (option: SearchableOption, isHighlighted: boolean) => React.ReactNode;
  emptyMessage?: string;
  maxHeight?: number;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// ============================================================================
// COMPONENT
// ============================================================================

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  required,
  disabled,
  className = '',
  error,
  helpText,
  entityType,
  fieldName,
  addLabel,
  renderOption,
  emptyMessage = 'No options found',
  maxHeight = 280,
}) => {
  const creation = useCreation();
  const { guardAction } = useAuthGuard();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Entity config for "Add New" button
  const entityConfig = entityType ? ENTITY_CONFIGS[entityType] : null;
  const canAddNew = entityType && !disabled;
  const addButtonLabel = addLabel || (entityConfig ? `Add New ${entityConfig.label}` : 'Add New');

  // Get selected option
  const selectedOption = useMemo(() =>
    options.find(opt => opt.id === value),
    [options, value]
  );

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase().trim();
    return options.filter(opt => {
      const searchText = opt.searchText || `${opt.name} ${opt.subtitle || ''} ${opt.metadata || ''}`;
      return searchText.toLowerCase().includes(query);
    });
  }, [options, searchQuery]);

  // Reset highlight when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Determine if dropdown should open upward
      const dropdownHeight = Math.min(maxHeight, filteredOptions.length * 48 + 60);
      const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownPosition({
        top: openUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [maxHeight, filteredOptions.length]);

  // Open dropdown
  const openDropdown = useCallback(() => {
    if (disabled) return;
    updateDropdownPosition();
    setIsOpen(true);
    setSearchQuery('');
    setHighlightedIndex(0);
    // Focus the search input after a brief delay
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [disabled, updateDropdownPosition]);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  // Select an option
  const selectOption = useCallback((optionId: string) => {
    onChange(optionId);
    closeDropdown();
  }, [onChange, closeDropdown]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;

      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          selectOption(filteredOptions[highlightedIndex].id);
        }
        break;

      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;

      case 'Tab':
        closeDropdown();
        break;
    }
  }, [isOpen, filteredOptions, highlightedIndex, openDropdown, selectOption, closeDropdown]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && optionRefs.current.has(highlightedIndex)) {
      optionRefs.current.get(highlightedIndex)?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [highlightedIndex, isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, closeDropdown]);

  // Update position on scroll/resize
  useEffect(() => {
    if (isOpen) {
      const handleUpdate = () => updateDropdownPosition();
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Handle "Add New" click
  const handleAddNew = useCallback(() => {
    if (!entityType) return;
    if (!guardAction()) return;

    closeDropdown();
    creation.startCreation(entityType, {
      fieldToFill: fieldName,
      label: `New ${entityConfig?.label || entityType}`,
    });
  }, [entityType, guardAction, closeDropdown, creation, fieldName, entityConfig]);

  // Clear selection
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  }, [onChange]);

  // Default option renderer
  const defaultRenderOption = (option: SearchableOption, isHighlighted: boolean) => (
    <div className="flex items-center justify-between gap-2 w-full">
      <div className="min-w-0 flex-1">
        <div className="font-medium text-white truncate">{option.name}</div>
        {option.subtitle && (
          <div className="text-xs text-zinc-400 truncate">{option.subtitle}</div>
        )}
      </div>
      {option.metadata && (
        <span className="text-xs text-zinc-500 flex-shrink-0">{option.metadata}</span>
      )}
      {option.id === value && (
        <span className="text-emerald-400 flex-shrink-0">
          <Icons.Check />
        </span>
      )}
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm text-zinc-400 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      {/* Trigger button */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => isOpen ? closeDropdown() : openDropdown()}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            flex-1 flex items-center justify-between gap-2
            bg-zinc-800 border rounded-lg px-3 py-2
            text-left cursor-pointer
            focus:outline-none focus:border-emerald-500
            disabled:cursor-not-allowed disabled:opacity-50
            transition-colors
            ${error ? 'border-red-500' : isOpen ? 'border-emerald-500' : 'border-zinc-700'}
          `}
        >
          {selectedOption ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-white truncate">{selectedOption.name}</span>
              {selectedOption.subtitle && (
                <span className="text-zinc-400 text-sm truncate hidden sm:inline">
                  ({selectedOption.subtitle})
                </span>
              )}
            </div>
          ) : (
            <span className="text-zinc-500">{placeholder}</span>
          )}

          <div className="flex items-center gap-1 flex-shrink-0">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Clear selection"
              >
                <Icons.X />
              </button>
            )}
            <span className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              <Icons.ChevronDown />
            </span>
          </div>
        </button>

        {/* Add New button */}
        {canAddNew && (
          <button
            type="button"
            onClick={handleAddNew}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 hover:border-emerald-500 hover:bg-zinc-700 text-emerald-400 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
            title={addButtonLabel}
          >
            <Icons.Plus />
            <span className="hidden sm:inline text-sm">Add</span>
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}

      {/* Help text */}
      {helpText && !error && (
        <p className="text-xs text-zinc-500 mt-1">{helpText}</p>
      )}

      {/* Dropdown portal */}
      {isOpen && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          {/* Search input */}
          <div className="p-2 border-b border-zinc-700">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <Icons.Search />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md pl-9 pr-3 py-1.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Options list */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.id}
                  ref={el => {
                    if (el) optionRefs.current.set(index, el);
                    else optionRefs.current.delete(index);
                  }}
                  type="button"
                  onClick={() => selectOption(option.id)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    w-full px-3 py-2 text-left transition-colors
                    ${highlightedIndex === index ? 'bg-zinc-700' : 'hover:bg-zinc-700/50'}
                    ${option.id === value ? 'bg-emerald-500/10' : ''}
                  `}
                >
                  {renderOption
                    ? renderOption(option, highlightedIndex === index)
                    : defaultRenderOption(option, highlightedIndex === index)
                  }
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-zinc-500 text-sm">
                {searchQuery ? (
                  <div>
                    <p>No matches for "{searchQuery}"</p>
                    {canAddNew && (
                      <button
                        type="button"
                        onClick={handleAddNew}
                        className="mt-2 text-emerald-400 hover:text-emerald-300"
                      >
                        + {addButtonLabel}
                      </button>
                    )}
                  </div>
                ) : (
                  emptyMessage
                )}
              </div>
            )}
          </div>

          {/* Footer with count */}
          {filteredOptions.length > 0 && (
            <div className="px-3 py-1.5 border-t border-zinc-700 text-xs text-zinc-500 flex items-center justify-between">
              <span>
                {filteredOptions.length === options.length
                  ? `${options.length} items`
                  : `${filteredOptions.length} of ${options.length} items`
                }
              </span>
              <span className="text-zinc-600">↑↓ navigate • Enter select • Esc close</span>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default SearchableDropdown;
