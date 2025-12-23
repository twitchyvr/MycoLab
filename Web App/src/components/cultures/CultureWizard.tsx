// ============================================================================
// CULTURE WIZARD - Multi-step guided culture creation workflow
// ============================================================================
//
// Redesigned culture creation form (dev-507) that guides users through:
// 1. Type & Strain - What kind of culture and which strain
// 2. Container & Location - Where it lives and what it's stored in
// 3. Recipe & Dates - Media formula and preparation/sterilization dates
// 4. Source & Cost - Optional tracking of source culture, supplier, cost
// 5. Review & Submit - Summary and final submission
//
// Features:
// - Auto-save to localStorage via CreationContext
// - Draft resume capability
// - Inline entity creation via StandardDropdown
// - Step validation before proceeding
// - Progress indicator
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../../store';
import { useCreation, ENTITY_CONFIGS } from '../../store/CreationContext';
import { Portal } from '../common';
import { StandardDropdown } from '../common/StandardDropdown';
import { StrainSearchDropdown } from '../common/StrainSearchDropdown';
import { NumericInput } from '../common/NumericInput';
import { VolumeInput } from '../common/VolumeInput';
import type { Culture, CultureType, CultureStatus } from '../../store/types';

// ============================================================================
// TYPES & CONFIGURATION
// ============================================================================

interface CultureWizardProps {
  onClose: () => void;
  onSuccess?: (culture: Culture) => void;
  initialDraftId?: string;  // Resume an existing draft
}

interface WizardStep {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  isRequired: boolean;
}

type AcquisitionMethod = 'made' | 'purchased';

interface CultureFormData {
  // Step 1: Type & Strain
  type: CultureType;
  strainId: string;
  status: CultureStatus;

  // Step 2: Container & Location
  containerId: string;
  locationId: string;
  volumeMl?: number;
  fillVolumeMl?: number;

  // Step 3: Acquisition - adapts based on acquisitionMethod
  acquisitionMethod: AcquisitionMethod;
  // For homemade cultures:
  recipeId: string;
  prepDate: string;
  sterilizationDate: string;
  // For purchased cultures:
  purchaseDate: string;
  receivedDate: string;

  // Step 4: Source & Cost
  parentId: string;
  supplierId: string;
  cost: number;
  lotNumber: string;

  // Step 5: Notes
  notes: string;
}

const CULTURE_TYPE_CONFIG: Record<CultureType, { label: string; icon: string; prefix: string; description: string }> = {
  liquid_culture: {
    label: 'Liquid Culture',
    icon: '💧',
    prefix: 'LC',
    description: 'Mycelium suspended in nutrient broth'
  },
  agar: {
    label: 'Agar Plate',
    icon: '🧫',
    prefix: 'AG',
    description: 'Mycelium growing on solid nutrient media'
  },
  slant: {
    label: 'Slant',
    icon: '🧪',
    prefix: 'SL',
    description: 'Long-term storage in test tubes'
  },
  spore_syringe: {
    label: 'Spore Syringe',
    icon: '💉',
    prefix: 'SS',
    description: 'Spores suspended in sterile water'
  },
};

const STATUS_CONFIG: Record<CultureStatus, { label: string; color: string; description: string }> = {
  colonizing: { label: 'Colonizing', color: 'text-blue-400 bg-blue-950/50', description: 'Mycelium actively growing' },
  active: { label: 'Active', color: 'text-emerald-400 bg-emerald-950/50', description: 'Ready for use/transfer' },
  ready: { label: 'Ready', color: 'text-green-400 bg-green-950/50', description: 'Fully colonized, optimal' },
  contaminated: { label: 'Contaminated', color: 'text-red-400 bg-red-950/50', description: 'Contamination detected' },
  archived: { label: 'Archived', color: 'text-zinc-400 bg-zinc-800', description: 'Stored for reference' },
  depleted: { label: 'Depleted', color: 'text-amber-400 bg-amber-950/50', description: 'Fully used up' },
};

const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: 'Type & Strain', shortTitle: 'Type', description: 'Choose culture type and strain', isRequired: true },
  { id: 2, title: 'Container & Location', shortTitle: 'Container', description: 'Where this culture lives', isRequired: true },
  { id: 3, title: 'Acquisition', shortTitle: 'Acquisition', description: 'How you got this culture', isRequired: false },
  { id: 4, title: 'Source & Cost', shortTitle: 'Source', description: 'Origin and tracking info', isRequired: false },
  { id: 5, title: 'Review & Submit', shortTitle: 'Review', description: 'Confirm and create', isRequired: true },
];

const INITIAL_FORM_DATA: CultureFormData = {
  type: 'agar',
  strainId: '',
  status: 'colonizing',
  containerId: '',
  locationId: '',
  volumeMl: undefined,
  fillVolumeMl: undefined,
  acquisitionMethod: 'made',
  recipeId: '',
  prepDate: new Date().toISOString().split('T')[0],
  sterilizationDate: '',
  purchaseDate: '',
  receivedDate: new Date().toISOString().split('T')[0],
  parentId: '',
  supplierId: '',
  cost: 0,
  lotNumber: '',
  notes: '',
};

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="9 6 15 12 9 18"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Beaker: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M4.5 3h15M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3M6 14h12"/>
    </svg>
  ),
  Cart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
};

// ============================================================================
// STEP COMPONENTS
// ============================================================================

interface StepProps {
  formData: CultureFormData;
  onChange: (updates: Partial<CultureFormData>) => void;
  errors: Record<string, string>;
}

// Step 1: Type & Strain
const Step1TypeStrain: React.FC<StepProps> = ({ formData, onChange, errors }) => {
  const { activeStrains } = useData();

  return (
    <div className="space-y-6">
      {/* Culture Type Selection */}
      <div>
        <label className="block text-sm text-zinc-400 mb-3">
          Culture Type <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(CULTURE_TYPE_CONFIG) as [CultureType, typeof CULTURE_TYPE_CONFIG[CultureType]][]).map(([type, config]) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ type })}
              className={`p-4 rounded-xl border text-left transition-all ${
                formData.type === type
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div>
                  <p className={`font-medium ${formData.type === type ? 'text-emerald-400' : 'text-white'}`}>
                    {config.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{config.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Strain Selection - Searchable with species info */}
      <StrainSearchDropdown
        label="Strain"
        required
        value={formData.strainId}
        onChange={value => onChange({ strainId: value })}
        placeholder="Search for a strain..."
        fieldName="strainId"
        error={errors.strainId}
        helpText="Which species/strain is this culture?"
      />

      {/* Initial Status */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Initial Status
        </label>
        <div className="flex flex-wrap gap-2">
          {(['colonizing', 'active', 'ready'] as CultureStatus[]).map(status => {
            const config = STATUS_CONFIG[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => onChange({ status })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  formData.status === status
                    ? `${config.color} ring-1 ring-white/20`
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          {STATUS_CONFIG[formData.status]?.description}
        </p>
      </div>
    </div>
  );
};

// Step 2: Container & Location
const Step2ContainerLocation: React.FC<StepProps> = ({ formData, onChange, errors }) => {
  const { activeContainers, activeLocations, getContainer } = useData();

  // Filter containers by culture usage context
  const cultureContainers = useMemo(() =>
    activeContainers.filter(c => c.usageContext.includes('culture')),
    [activeContainers]
  );

  // Auto-fill volume from selected container
  const selectedContainer = formData.containerId ? getContainer(formData.containerId) : undefined;

  useEffect(() => {
    if (selectedContainer?.volumeMl && !formData.volumeMl) {
      onChange({ volumeMl: selectedContainer.volumeMl });
    }
  }, [selectedContainer, formData.volumeMl, onChange]);

  const showVolumeFields = formData.type === 'liquid_culture' || formData.type === 'spore_syringe';

  return (
    <div className="space-y-6">
      {/* Container Selection */}
      <StandardDropdown
        label="Container"
        required
        value={formData.containerId}
        onChange={value => onChange({ containerId: value })}
        options={cultureContainers}
        placeholder="Select container type..."
        entityType="container"
        fieldName="containerId"
        error={errors.containerId}
        helpText="What type of vessel holds this culture?"
      />

      {/* Location Selection */}
      <StandardDropdown
        label="Location"
        required
        value={formData.locationId}
        onChange={value => onChange({ locationId: value })}
        options={activeLocations}
        placeholder="Where is it stored?"
        entityType="location"
        fieldName="locationId"
        error={errors.locationId}
        helpText="Current storage location"
      />

      {/* Volume Fields - Show for LC and Spore Syringes */}
      {showVolumeFields && (
        <div className="grid grid-cols-2 gap-4">
          <VolumeInput
            label="Container Capacity"
            value={formData.volumeMl}
            onChange={value => onChange({ volumeMl: value })}
            placeholder="e.g., 1000"
            showConversionHint
          />
          <VolumeInput
            label="Fill Amount"
            value={formData.fillVolumeMl}
            onChange={value => onChange({ fillVolumeMl: value })}
            placeholder="e.g., 600"
            showConversionHint
          />
        </div>
      )}

      {/* Volume Preview */}
      {showVolumeFields && formData.volumeMl && formData.fillVolumeMl && (
        <div className="bg-zinc-800/50 rounded-lg p-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-400">Fill Level</span>
            <span className="text-white">
              {formData.fillVolumeMl}ml / {formData.volumeMl}ml
              ({Math.round((formData.fillVolumeMl / formData.volumeMl) * 100)}%)
            </span>
          </div>
          <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (formData.fillVolumeMl / formData.volumeMl) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Step 3: Acquisition - adapts based on whether culture is homemade or purchased
const Step3Acquisition: React.FC<StepProps> = ({ formData, onChange }) => {
  const { activeRecipes, activeSuppliers, getRecipe } = useData();

  // Filter recipes by culture type
  const filteredRecipes = useMemo(() => {
    return activeRecipes.filter(r => {
      if (formData.type === 'liquid_culture') return r.category === 'liquid_culture';
      if (formData.type === 'agar' || formData.type === 'slant') return r.category === 'agar';
      if (formData.type === 'spore_syringe') return r.category === 'liquid_culture' || r.category === 'other';
      return true;
    });
  }, [activeRecipes, formData.type]);

  const selectedRecipe = formData.recipeId ? getRecipe(formData.recipeId) : undefined;
  const isMade = formData.acquisitionMethod === 'made';

  return (
    <div className="space-y-6">
      {/* Acquisition Method Toggle */}
      <div>
        <label className="block text-sm text-zinc-400 mb-3">
          How did you get this culture?
        </label>
        <div className="flex rounded-lg overflow-hidden border border-zinc-700">
          <button
            type="button"
            onClick={() => onChange({ acquisitionMethod: 'made' })}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              isMade
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Icons.Beaker />
              Made It Myself
            </span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ acquisitionMethod: 'purchased' })}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              !isMade
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Icons.Cart />
              Purchased / Received
            </span>
          </button>
        </div>
      </div>

      {/* MADE IT MYSELF - Recipe & Dates */}
      {isMade && (
        <>
          {/* Recipe Selection */}
          <div>
            <StandardDropdown
              label="Recipe / Media Formula"
              value={formData.recipeId}
              onChange={value => onChange({ recipeId: value })}
              options={filteredRecipes}
              placeholder="Select media recipe..."
              entityType="recipe"
              fieldName="recipeId"
              helpText="What nutrient media is in this container?"
            />

            {/* Recipe Preview */}
            {selectedRecipe && (
              <div className="mt-3 bg-zinc-800/50 rounded-lg p-3">
                <p className="text-sm text-emerald-400 font-medium">{selectedRecipe.name}</p>
                {selectedRecipe.description && (
                  <p className="text-xs text-zinc-400 mt-1">{selectedRecipe.description}</p>
                )}
                {selectedRecipe.yield && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Yield: {selectedRecipe.yield.amount} {selectedRecipe.yield.unit}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Prep Date */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Preparation Date
            </label>
            <input
              type="date"
              value={formData.prepDate}
              onChange={e => onChange({ prepDate: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-xs text-zinc-500 mt-1">When was the media prepared?</p>
          </div>

          {/* Sterilization Date */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Sterilization Date
            </label>
            <input
              type="date"
              value={formData.sterilizationDate}
              onChange={e => onChange({ sterilizationDate: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-xs text-zinc-500 mt-1">When was it sterilized (pressure cooked)?</p>
          </div>

          {/* Quick Date Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                onChange({ prepDate: today, sterilizationDate: today });
              }}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
            >
              Set both to today
            </button>
            <button
              type="button"
              onClick={() => onChange({ sterilizationDate: formData.prepDate })}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
            >
              Same as prep date
            </button>
          </div>
        </>
      )}

      {/* PURCHASED / RECEIVED */}
      {!isMade && (
        <>
          {/* Supplier Selection */}
          <StandardDropdown
            label="Supplier / Vendor"
            value={formData.supplierId}
            onChange={value => onChange({ supplierId: value })}
            options={activeSuppliers}
            placeholder="Select supplier..."
            entityType="supplier"
            fieldName="supplierId"
            helpText="Where did you purchase this from?"
          />

          {/* Purchase Date */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Purchase / Order Date
            </label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={e => onChange({ purchaseDate: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-xs text-zinc-500 mt-1">When did you order or purchase it?</p>
          </div>

          {/* Received Date */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Received Date <span className="text-emerald-400">*</span>
            </label>
            <input
              type="date"
              value={formData.receivedDate}
              onChange={e => onChange({ receivedDate: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-xs text-zinc-500 mt-1">When did you receive it? (Important for tracking freshness)</p>
          </div>

          {/* Quick Date Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                onChange({ receivedDate: today });
              }}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
            >
              Received today
            </button>
          </div>

          {/* Lot Number */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Lot Number
            </label>
            <input
              type="text"
              value={formData.lotNumber}
              onChange={e => onChange({ lotNumber: e.target.value })}
              placeholder="e.g., LOT-2025-001"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-xs text-zinc-500 mt-1">Manufacturer's lot/batch number (if provided)</p>
          </div>
        </>
      )}
    </div>
  );
};

// Step 4: Source & Cost - adapts based on acquisition method
const Step4SourceCost: React.FC<StepProps> = ({ formData, onChange }) => {
  const { state, activeSuppliers, getStrain, getCulture, getSupplier } = useData();
  const isPurchased = formData.acquisitionMethod === 'purchased';

  // Get cultures of same strain for parent selection
  const potentialParents = useMemo(() => {
    if (!formData.strainId) return [];
    return state.cultures.filter(c =>
      c.strainId === formData.strainId &&
      !['contaminated', 'depleted'].includes(c.status)
    );
  }, [state.cultures, formData.strainId]);

  const selectedParent = formData.parentId ? getCulture(formData.parentId) : undefined;
  const supplier = formData.supplierId ? getSupplier(formData.supplierId) : undefined;

  return (
    <div className="space-y-6">
      {/* Info Banner - different based on acquisition method */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 flex gap-3">
        <Icons.Info />
        <div className="text-sm">
          <p className="text-zinc-300 font-medium">
            {isPurchased ? 'Lineage & Cost Tracking' : 'Optional Tracking'}
          </p>
          <p className="text-zinc-500 mt-1">
            {isPurchased
              ? 'Track lineage if this came from another culture, and record your purchase cost.'
              : 'This information helps track lineage and costs. Skip if not applicable.'
            }
          </p>
        </div>
      </div>

      {/* Show supplier info if purchased (captured in Step 3) */}
      {isPurchased && supplier && (
        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-3">
          <p className="text-xs text-emerald-400 font-medium mb-1">Supplier (from Acquisition step)</p>
          <p className="text-sm text-white">{supplier.name}</p>
          {formData.lotNumber && (
            <p className="text-xs text-zinc-400 mt-1">Lot #: {formData.lotNumber}</p>
          )}
        </div>
      )}

      {/* Source Culture (Parent) - always shown */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Source Culture (Parent)
        </label>
        <select
          value={formData.parentId}
          onChange={e => onChange({ parentId: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">No parent (original source)</option>
          {potentialParents.map(culture => (
            <option key={culture.id} value={culture.id}>
              {culture.label} (G{culture.generation}) - {CULTURE_TYPE_CONFIG[culture.type]?.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500 mt-1">
          {selectedParent
            ? `This will be generation G${selectedParent.generation + 1}`
            : isPurchased
              ? 'Select if you derived this from another culture after receiving it'
              : 'Select if this culture came from another culture in your library'
          }
        </p>
      </div>

      {/* Supplier - only show for homemade cultures (purchased already captured in Step 3) */}
      {!isPurchased && (
        <StandardDropdown
          label="Supplier"
          value={formData.supplierId}
          onChange={value => onChange({ supplierId: value })}
          options={activeSuppliers}
          placeholder="Select supplier..."
          entityType="supplier"
          fieldName="supplierId"
          helpText="Where did you get the source material? (optional)"
        />
      )}

      {/* Cost - always shown */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Cost ($)
        </label>
        <NumericInput
          value={formData.cost}
          onChange={value => onChange({ cost: value ?? 0 })}
          placeholder="0.00"
          step={0.01}
          min={0}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          {isPurchased ? 'How much did you pay for this?' : 'Cost of materials used (optional)'}
        </p>
      </div>

      {/* Lot Number - only show for homemade (purchased already captured in Step 3) */}
      {!isPurchased && (
        <div>
          <label className="block text-sm text-zinc-400 mb-2">
            Lot Number
          </label>
          <input
            type="text"
            value={formData.lotNumber}
            onChange={e => onChange({ lotNumber: e.target.value })}
            placeholder="e.g., LOT-2025-001"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          />
          <p className="text-xs text-zinc-500 mt-1">Your batch/lot identifier (optional)</p>
        </div>
      )}
    </div>
  );
};

// Step 5: Review & Submit
const Step5Review: React.FC<StepProps & { onSubmit: () => void; isSubmitting: boolean }> = ({
  formData,
  onChange,
  onSubmit,
  isSubmitting
}) => {
  const { getStrain, getContainer, getLocation, getRecipe, getSupplier, getCulture, generateCultureLabel } = useData();

  const strain = formData.strainId ? getStrain(formData.strainId) : undefined;
  const container = formData.containerId ? getContainer(formData.containerId) : undefined;
  const location = formData.locationId ? getLocation(formData.locationId) : undefined;
  const recipe = formData.recipeId ? getRecipe(formData.recipeId) : undefined;
  const supplier = formData.supplierId ? getSupplier(formData.supplierId) : undefined;
  const parent = formData.parentId ? getCulture(formData.parentId) : undefined;

  const typeConfig = CULTURE_TYPE_CONFIG[formData.type];
  const previewLabel = generateCultureLabel(formData.type);
  const generation = parent ? parent.generation + 1 : 0;

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{typeConfig.icon}</span>
          <div>
            <p className="text-lg font-bold text-white">{previewLabel}</p>
            <p className="text-sm text-zinc-400">{strain?.name || 'Unknown Strain'}</p>
          </div>
          <span className={`ml-auto px-2 py-1 rounded text-xs font-medium ${STATUS_CONFIG[formData.status].color}`}>
            {STATUS_CONFIG[formData.status].label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-zinc-900/50 rounded-lg p-3">
            <p className="text-zinc-500 text-xs">Type</p>
            <p className="text-white">{typeConfig.label}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-3">
            <p className="text-zinc-500 text-xs">Generation</p>
            <p className="text-white">G{generation}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-3">
            <p className="text-zinc-500 text-xs">Container</p>
            <p className="text-white">{container?.name || 'Not set'}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-3">
            <p className="text-zinc-500 text-xs">Location</p>
            <p className="text-white">{location?.name || 'Not set'}</p>
          </div>
          {/* Acquisition method badge */}
          <div className="bg-zinc-900/50 rounded-lg p-3 col-span-2">
            <p className="text-zinc-500 text-xs">Acquisition</p>
            <p className="text-white flex items-center gap-2">
              {formData.acquisitionMethod === 'made' ? (
                <><Icons.Beaker /> Made It Myself</>
              ) : (
                <><Icons.Cart /> Purchased / Received</>
              )}
            </p>
          </div>

          {/* For homemade: Show recipe and prep dates */}
          {formData.acquisitionMethod === 'made' && (
            <>
              {recipe && (
                <div className="bg-zinc-900/50 rounded-lg p-3 col-span-2">
                  <p className="text-zinc-500 text-xs">Recipe</p>
                  <p className="text-emerald-400">{recipe.name}</p>
                </div>
              )}
              {formData.prepDate && (
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs">Prep Date</p>
                  <p className="text-white">{formData.prepDate}</p>
                </div>
              )}
              {formData.sterilizationDate && (
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs">Sterilization Date</p>
                  <p className="text-white">{formData.sterilizationDate}</p>
                </div>
              )}
            </>
          )}

          {/* For purchased: Show supplier, received date, lot number */}
          {formData.acquisitionMethod === 'purchased' && (
            <>
              {supplier && (
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs">Supplier</p>
                  <p className="text-white">{supplier.name}</p>
                </div>
              )}
              {formData.receivedDate && (
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs">Received Date</p>
                  <p className="text-white">{formData.receivedDate}</p>
                </div>
              )}
              {formData.purchaseDate && (
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs">Purchase Date</p>
                  <p className="text-white">{formData.purchaseDate}</p>
                </div>
              )}
              {formData.lotNumber && (
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs">Lot Number</p>
                  <p className="text-white">{formData.lotNumber}</p>
                </div>
              )}
            </>
          )}

          {(formData.volumeMl || formData.fillVolumeMl) && (
            <div className="bg-zinc-900/50 rounded-lg p-3 col-span-2">
              <p className="text-zinc-500 text-xs">Volume</p>
              <p className="text-white">
                {formData.fillVolumeMl || formData.volumeMl}ml
                {formData.fillVolumeMl && formData.volumeMl && formData.fillVolumeMl !== formData.volumeMl && (
                  <span className="text-zinc-500"> / {formData.volumeMl}ml</span>
                )}
              </p>
            </div>
          )}
          {parent && (
            <div className="bg-zinc-900/50 rounded-lg p-3 col-span-2">
              <p className="text-zinc-500 text-xs">Parent Culture</p>
              <p className="text-white">{parent.label} (G{parent.generation})</p>
            </div>
          )}
          {formData.cost > 0 && (
            <div className="bg-zinc-900/50 rounded-lg p-3">
              <p className="text-zinc-500 text-xs">Cost</p>
              <p className="text-white">${formData.cost.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={e => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Any additional notes about this culture..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl font-medium text-lg transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin">⏳</span>
            Creating...
          </>
        ) : (
          <>
            <Icons.Check />
            Create Culture
          </>
        )}
      </button>
    </div>
  );
};

// ============================================================================
// PROGRESS STEPPER
// ============================================================================

interface ProgressStepperProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (step: number) => void;
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.has(step.id);
        const isClickable = isCompleted || step.id <= currentStep;

        return (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`
                flex flex-col items-center gap-1 transition-all
                ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
              `}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all
                ${isActive
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
                  : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                }
              `}>
                {isCompleted && !isActive ? <Icons.Check /> : step.id}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                isActive ? 'text-emerald-400' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'
              }`}>
                {step.shortTitle}
              </span>
            </button>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                completedSteps.has(step.id) ? 'bg-emerald-500' : 'bg-zinc-700'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

export const CultureWizard: React.FC<CultureWizardProps> = ({
  onClose,
  onSuccess,
  initialDraftId,
}) => {
  const {
    addCulture,
    generateCultureLabel,
    getCulture,
  } = useData();

  const creation = useCreation();

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CultureFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId || null);

  // Initialize from draft or create new draft
  useEffect(() => {
    if (initialDraftId) {
      const draft = creation.getDraft(initialDraftId);
      if (draft && draft.entityType === 'culture') {
        setFormData({ ...INITIAL_FORM_DATA, ...draft.formData });
        setDraftId(initialDraftId);
      }
    } else {
      // Start a new draft
      const newDraftId = creation.startCreation('culture', {
        initialData: INITIAL_FORM_DATA,
        label: 'New Culture',
      });
      setDraftId(newDraftId);
    }
  }, [initialDraftId]);

  // Auto-save form data to draft
  useEffect(() => {
    if (draftId) {
      creation.updateDraft(draftId, formData);
    }
  }, [formData, draftId]);

  // Handle form changes
  const handleChange = useCallback((updates: Partial<CultureFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const errorsToClear = Object.keys(updates);
    if (errorsToClear.length > 0) {
      setErrors(prev => {
        const next = { ...prev };
        errorsToClear.forEach(key => delete next[key]);
        return next;
      });
    }
  }, []);

  // Validate current step
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.strainId) newErrors.strainId = 'Please select a strain';
        break;
      case 2:
        if (!formData.containerId) newErrors.containerId = 'Please select a container';
        if (!formData.locationId) newErrors.locationId = 'Please select a location';
        break;
      // Steps 3, 4 are optional
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length));
    }
  }, [currentStep, validateStep]);

  // Navigate to previous step
  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Jump to a specific step
  const handleStepClick = useCallback((step: number) => {
    // Can only go back or to completed steps
    if (step < currentStep || completedSteps.has(step)) {
      setCurrentStep(step);
    }
  }, [currentStep, completedSteps]);

  // Submit the culture
  const handleSubmit = useCallback(async () => {
    // Validate all required steps
    if (!validateStep(1) || !validateStep(2)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const parent = formData.parentId ? getCulture(formData.parentId) : undefined;
      const generation = parent ? parent.generation + 1 : 0;

      const newCulture = await addCulture({
        type: formData.type,
        label: generateCultureLabel(formData.type),
        strainId: formData.strainId,
        status: formData.status,
        generation,
        locationId: formData.locationId,
        containerId: formData.containerId,
        // For homemade cultures
        recipeId: formData.acquisitionMethod === 'made' ? (formData.recipeId || undefined) : undefined,
        prepDate: formData.acquisitionMethod === 'made' ? (formData.prepDate || undefined) : undefined,
        sterilizationDate: formData.acquisitionMethod === 'made' ? (formData.sterilizationDate || undefined) : undefined,
        // For purchased cultures
        acquisitionMethod: formData.acquisitionMethod,
        purchaseDate: formData.acquisitionMethod === 'purchased' ? (formData.purchaseDate || undefined) : undefined,
        receivedDate: formData.acquisitionMethod === 'purchased' ? (formData.receivedDate || undefined) : undefined,
        // Common fields
        volumeMl: formData.volumeMl,
        fillVolumeMl: formData.fillVolumeMl,
        parentId: formData.parentId || undefined,
        healthRating: 5,
        notes: formData.notes,
        cost: formData.cost,
        supplierId: formData.supplierId || undefined,
        lotNumber: formData.lotNumber || undefined,
      });

      // Clear the draft
      if (draftId) {
        creation.completeCreation(draftId, {
          id: newCulture.id,
          name: newCulture.label,
          entityType: 'culture',
        });
      }

      onSuccess?.(newCulture);
      onClose();
    } catch (error) {
      console.error('Failed to create culture:', error);
      setErrors({ submit: 'Failed to create culture. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, draftId, creation, addCulture, generateCultureLabel, getCulture, onSuccess, onClose, validateStep]);

  // Handle close (cancel draft)
  const handleClose = useCallback(() => {
    if (draftId) {
      // Keep the draft for later (don't cancel it)
      // User can resume it later
    }
    onClose();
  }, [draftId, onClose]);

  // Render current step content
  const renderStepContent = () => {
    const stepProps: StepProps = { formData, onChange: handleChange, errors };

    switch (currentStep) {
      case 1:
        return <Step1TypeStrain {...stepProps} />;
      case 2:
        return <Step2ContainerLocation {...stepProps} />;
      case 3:
        return <Step3Acquisition {...stepProps} />;
      case 4:
        return <Step4SourceCost {...stepProps} />;
      case 5:
        return <Step5Review {...stepProps} onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
      default:
        return null;
    }
  };

  const currentStepConfig = WIZARD_STEPS[currentStep - 1];
  const isLastStep = currentStep === WIZARD_STEPS.length;
  const isFirstStep = currentStep === 1;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">New Culture</h2>
              <p className="text-sm text-zinc-400">{currentStepConfig.description}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Icons.X />
            </button>
          </div>

          {/* Progress Stepper */}
          <ProgressStepper
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStepContent()}
        </div>

        {/* Footer Navigation (not on final step) */}
        {!isLastStep && (
          <div className="px-6 py-4 border-t border-zinc-800 flex justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                ${isFirstStep
                  ? 'text-zinc-600 cursor-not-allowed'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                }
              `}
            >
              <Icons.ChevronLeft />
              Back
            </button>

            <div className="flex items-center gap-2">
              {/* Skip button for optional steps */}
              {!currentStepConfig.isRequired && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Skip
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                {currentStep === WIZARD_STEPS.length - 1 ? 'Review' : 'Next'}
                <Icons.ChevronRight />
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </Portal>
  );
};

export default CultureWizard;
