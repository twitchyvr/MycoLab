// ============================================================================
// STANDARD DROPDOWN - Unified dropdown with "Add New" support
// ============================================================================
//
// This component provides a consistent dropdown experience across the app.
// When "Add New" is clicked, it integrates with CreationContext to:
// 1. Save the current form as a draft
// 2. Open the full entity creation form
// 3. Return to the original form with the new entity selected
//
// Usage:
// <StandardDropdown
//   value={formData.strainId}
//   onChange={value => updateFormData({ strainId: value })}
//   options={activeStrains}
//   entityType="strain"
//   fieldName="strainId"
//   label="Strain"
//   required
// />
// ============================================================================

import React, { useMemo } from 'react';
import { useCreation, CreatableEntityType, ENTITY_CONFIGS } from '../../store/CreationContext';

// Icons
const Icons = {
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
};

interface Option {
  id: string;
  name: string;
  [key: string]: any;
}

export interface StandardDropdownProps {
  // Core props
  value: string;
  onChange: (value: string) => void;
  options: Option[];

  // Display props
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  helpText?: string;

  // Entity creation props
  entityType?: CreatableEntityType;  // If provided, enables "Add New" functionality
  fieldName?: string;                 // The field name to auto-fill when entity is created

  // Filter/customize options
  filterFn?: (option: Option) => boolean;
  sortFn?: (a: Option, b: Option) => number;

  // Customization
  renderOption?: (option: Option) => React.ReactNode;
  addLabel?: string;                  // Custom label for "Add New" button
}

export const StandardDropdown: React.FC<StandardDropdownProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select...',
  required,
  disabled,
  className = '',
  error,
  helpText,
  entityType,
  fieldName,
  filterFn,
  sortFn,
  renderOption,
  addLabel,
}) => {
  const creation = useCreation();

  // Get entity config if entityType is provided
  const entityConfig = entityType ? ENTITY_CONFIGS[entityType] : null;

  // Process options
  const processedOptions = useMemo(() => {
    let result = [...options];

    if (filterFn) {
      result = result.filter(filterFn);
    }

    if (sortFn) {
      result.sort(sortFn);
    } else {
      // Default: sort alphabetically by name
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [options, filterFn, sortFn]);

  // Handle "Add New" click
  const handleAddNew = () => {
    if (!entityType) return;

    // Start creation with field name so the context knows what to update
    creation.startCreation(entityType, {
      fieldToFill: fieldName,
      label: `New ${entityConfig?.label || entityType}`,
    });
  };

  // Get display value
  const selectedOption = processedOptions.find(opt => opt.id === value);

  // Determine add label
  const addButtonLabel = addLabel || (entityConfig ? `Add New ${entityConfig.label}` : 'Add New');

  // Can add new?
  const canAddNew = entityType && !disabled;

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm text-zinc-400 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      {/* Select with Add New button */}
      <div className="flex gap-2">
        {/* Select wrapper */}
        <div className="relative flex-1">
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className={`
              w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white
              appearance-none cursor-pointer
              focus:outline-none focus:border-emerald-500
              disabled:cursor-not-allowed disabled:opacity-50
              ${error ? 'border-red-500' : 'border-zinc-700'}
            `}
          >
            <option value="">{placeholder}</option>

            {/* Options */}
            {processedOptions.map(opt => (
              <option key={opt.id} value={opt.id}>
                {renderOption ? renderOption(opt) : opt.name}
              </option>
            ))}
          </select>

          {/* Chevron icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
            <Icons.ChevronDown />
          </div>
        </div>

        {/* Add New button - visible beside the dropdown */}
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
    </div>
  );
};

// ============================================================================
// SPECIALIZED DROPDOWN VARIANTS
// ============================================================================

// Pre-configured dropdown for species with formatted names
export const SpeciesDropdown: React.FC<Omit<StandardDropdownProps, 'entityType' | 'fieldName' | 'renderOption'> & { fieldName?: string }> = (props) => (
  <StandardDropdown
    {...props}
    entityType="species"
    fieldName={props.fieldName || 'speciesId'}
    addLabel="Add New Species"
    renderOption={(opt) => {
      // Format: "Common Name (Scientific Name)"
      const species = opt as any;
      const commonName = species.commonNames?.[0] ||
        (species.name !== species.scientificName ? species.name : null);
      const scientificName = species.scientificName || species.name;

      if (commonName && scientificName && commonName !== scientificName) {
        return `${commonName} (${scientificName})`;
      }
      return scientificName || species.name;
    }}
  />
);

// Pre-configured dropdown for strains with species info
export const StrainDropdown: React.FC<Omit<StandardDropdownProps, 'entityType' | 'fieldName'> & {
  fieldName?: string;
  speciesMap?: Map<string, any> | Record<string, any>;
}> = ({ speciesMap, ...props }) => (
  <StandardDropdown
    {...props}
    entityType="strain"
    fieldName={props.fieldName || 'strainId'}
    addLabel="Add New Strain"
    renderOption={(opt) => {
      const strain = opt as any;
      // Try to get species info for display
      let speciesDisplay = strain.species || '';

      if (speciesMap && strain.speciesId) {
        const species = speciesMap instanceof Map
          ? speciesMap.get(strain.speciesId)
          : speciesMap[strain.speciesId];
        if (species?.scientificName) {
          // Abbreviate: "Psilocybe cubensis" => "P. cubensis"
          const parts = species.scientificName.split(/\s+/);
          speciesDisplay = parts.length >= 2
            ? `${parts[0][0]}. ${parts.slice(1).join(' ')}`
            : species.scientificName;
        }
      }

      if (speciesDisplay) {
        return `${strain.name} (${speciesDisplay})`;
      }
      return strain.name;
    }}
  />
);

// Pre-configured dropdown for locations
export const LocationDropdown: React.FC<Omit<StandardDropdownProps, 'entityType' | 'fieldName'> & { fieldName?: string }> = (props) => (
  <StandardDropdown
    {...props}
    entityType="location"
    fieldName={props.fieldName || 'locationId'}
    addLabel="Add New Location"
  />
);

// Pre-configured dropdown for vessels
export const VesselDropdown: React.FC<Omit<StandardDropdownProps, 'entityType' | 'fieldName'> & { fieldName?: string }> = (props) => (
  <StandardDropdown
    {...props}
    entityType="vessel"
    fieldName={props.fieldName || 'vesselId'}
    addLabel="Add New Vessel"
  />
);

// Pre-configured dropdown for suppliers
export const SupplierDropdown: React.FC<Omit<StandardDropdownProps, 'entityType' | 'fieldName'> & { fieldName?: string }> = (props) => (
  <StandardDropdown
    {...props}
    entityType="supplier"
    fieldName={props.fieldName || 'supplierId'}
    addLabel="Add New Supplier"
  />
);

// Pre-configured dropdown for grain types
export const GrainTypeDropdown: React.FC<Omit<StandardDropdownProps, 'entityType' | 'fieldName'> & { fieldName?: string }> = (props) => (
  <StandardDropdown
    {...props}
    entityType="grainType"
    fieldName={props.fieldName || 'grainTypeId'}
    addLabel="Add New Grain Type"
  />
);

// Pre-configured dropdown for substrate types
export const SubstrateTypeDropdown: React.FC<Omit<StandardDropdownProps, 'entityType' | 'fieldName'> & { fieldName?: string }> = (props) => (
  <StandardDropdown
    {...props}
    entityType="substrateType"
    fieldName={props.fieldName || 'substrateTypeId'}
    addLabel="Add New Substrate Type"
  />
);

// Pre-configured dropdown for container types
export const ContainerTypeDropdown: React.FC<Omit<StandardDropdownProps, 'entityType' | 'fieldName'> & { fieldName?: string }> = (props) => (
  <StandardDropdown
    {...props}
    entityType="containerType"
    fieldName={props.fieldName || 'containerTypeId'}
    addLabel="Add New Container Type"
  />
);

// Pre-configured dropdown for inventory items
export const InventoryItemDropdown: React.FC<Omit<StandardDropdownProps, 'entityType' | 'fieldName'> & { fieldName?: string }> = (props) => (
  <StandardDropdown
    {...props}
    entityType="inventoryItem"
    fieldName={props.fieldName || 'inventoryItemId'}
    addLabel="Add New Item"
  />
);

// Pre-configured dropdown for inventory categories
export const InventoryCategoryDropdown: React.FC<Omit<StandardDropdownProps, 'entityType' | 'fieldName'> & { fieldName?: string }> = (props) => (
  <StandardDropdown
    {...props}
    entityType="inventoryCategory"
    fieldName={props.fieldName || 'categoryId'}
    addLabel="Add New Category"
  />
);

export default StandardDropdown;
