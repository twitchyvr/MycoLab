// ============================================================================
// CANONICAL GROW FORM - Single source of truth for creating/editing grows
// Used everywhere in the app: GrowManagement, CommandCenter, etc.
// Features: Spawn rate calculator, draft support, comprehensive grow setup
// ============================================================================

import React, { useMemo } from 'react';
import { StandardDropdown } from '../common/StandardDropdown';
import { NumericInput } from '../common/NumericInput';
import { WeightInput } from '../common/WeightInput';
import type { Strain, Container, Location, SubstrateType, GrainType } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

export interface GrowFormData {
  name: string;
  strainId: string;
  sourceCultureId: string;
  grainTypeId: string;
  spawnWeight: number;
  substrateTypeId: string;
  substrateWeight: number;
  containerId: string;
  containerCount: number;
  locationId: string;
  inoculationDate: string;
  targetTempColonization: number;
  targetTempFruiting: number;
  targetHumidity: number;
  estimatedCost: number;
  notes: string;
}

interface CultureOption {
  id: string;
  name: string;
}

interface GrowFormProps {
  /** Current form data */
  data: GrowFormData;
  /** Called when form data changes */
  onChange: (data: Partial<GrowFormData>) => void;
  /** Validation errors by field */
  errors?: Record<string, string>;
  /** Whether this is edit mode (some fields may be read-only) */
  isEditMode?: boolean;
  /** Available strains */
  strains?: Strain[];
  /** Available containers (filtered for grow usage) */
  containers?: Container[];
  /** Available locations */
  locations?: Location[];
  /** Available substrate types */
  substrateTypes?: SubstrateType[];
  /** Available grain types */
  grainTypes?: GrainType[];
  /** Available source cultures (ready/active) */
  sourceCultures?: CultureOption[];
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Show advanced fields */
  showAdvanced?: boolean;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GrowForm: React.FC<GrowFormProps> = ({
  data,
  onChange,
  errors = {},
  isEditMode = false,
  strains = [],
  containers = [],
  locations = [],
  substrateTypes = [],
  grainTypes = [],
  sourceCultures = [],
  compact = false,
  showAdvanced = false,
}) => {
  // Calculate spawn rate from weights
  const calculatedSpawnRate = useMemo(() => {
    if (!data.spawnWeight || !data.substrateWeight) return 0;
    return Math.round((data.spawnWeight / (data.spawnWeight + data.substrateWeight)) * 100);
  }, [data.spawnWeight, data.substrateWeight]);

  // Filter containers for grow usage context
  const growContainers = useMemo(() => {
    return containers.filter(c => c.usageContext?.includes('grow'));
  }, [containers]);

  // Filter substrate types for bulk category
  const bulkSubstrates = useMemo(() => {
    return substrateTypes.filter(s => s.category === 'bulk');
  }, [substrateTypes]);

  const spacing = compact ? 'space-y-3' : 'space-y-4';
  const gridGap = compact ? 'gap-3' : 'gap-4';

  return (
    <div className={spacing}>
      {/* Name (optional - auto-generated) */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Name <span className="text-zinc-600">(optional)</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Auto-generated if blank"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Strain & Source Culture */}
      <div className={`grid grid-cols-2 ${gridGap}`}>
        <StandardDropdown
          label="Strain"
          required
          value={data.strainId}
          onChange={(value) => onChange({ strainId: value })}
          options={strains}
          placeholder="Select..."
          entityType="strain"
          fieldName="strainId"
        />
        <StandardDropdown
          label="Source Culture"
          value={data.sourceCultureId}
          onChange={(value) => onChange({ sourceCultureId: value })}
          options={sourceCultures}
          placeholder="None"
          fieldName="sourceCultureId"
        />
      </div>
      {errors.strainId && <p className="text-red-400 text-xs -mt-2">{errors.strainId}</p>}

      {/* Spawn Type & Weight */}
      <div className={`grid grid-cols-2 ${gridGap}`}>
        <StandardDropdown
          label="Spawn Type"
          value={data.grainTypeId}
          onChange={(value) => onChange({ grainTypeId: value })}
          options={grainTypes}
          placeholder="Select..."
          entityType="grainType"
          fieldName="grainTypeId"
        />
        <WeightInput
          label="Spawn Weight"
          value={data.spawnWeight}
          onChange={(value) => onChange({ spawnWeight: value ?? 0 })}
          allowEmpty={false}
          showConversionHint={!compact}
        />
      </div>

      {/* Substrate & Weight */}
      <div className={`grid grid-cols-2 ${gridGap}`}>
        <StandardDropdown
          label="Substrate"
          required
          value={data.substrateTypeId}
          onChange={(value) => onChange({ substrateTypeId: value })}
          options={bulkSubstrates}
          placeholder="Select..."
          entityType="substrateType"
          fieldName="substrateTypeId"
        />
        <WeightInput
          label="Substrate Weight"
          value={data.substrateWeight}
          onChange={(value) => onChange({ substrateWeight: value ?? 0 })}
          allowEmpty={false}
          showConversionHint={!compact}
        />
      </div>
      {errors.substrateTypeId && <p className="text-red-400 text-xs -mt-2">{errors.substrateTypeId}</p>}

      {/* Calculated Spawn Rate */}
      {calculatedSpawnRate > 0 && (
        <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-zinc-500">Calculated Spawn Rate</p>
          <p className="text-xl font-bold text-emerald-400">{calculatedSpawnRate}%</p>
          <p className="text-xs text-zinc-600 mt-1">
            {calculatedSpawnRate < 10 ? 'Low - may take longer to colonize' :
             calculatedSpawnRate > 30 ? 'High - faster but more spawn used' :
             'Optimal range for most species'}
          </p>
        </div>
      )}

      {/* Container & Count */}
      <div className={`grid grid-cols-2 ${gridGap}`}>
        <StandardDropdown
          label="Container"
          required
          value={data.containerId}
          onChange={(value) => onChange({ containerId: value })}
          options={growContainers.length > 0 ? growContainers : containers}
          placeholder="Select..."
          entityType="container"
          fieldName="containerId"
        />
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Count</label>
          <NumericInput
            value={data.containerCount}
            onChange={(value) => onChange({ containerCount: value ?? 1 })}
            min={1}
            allowEmpty={false}
            defaultValue={1}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
      {errors.containerId && <p className="text-red-400 text-xs -mt-2">{errors.containerId}</p>}

      {/* Location & Inoculation Date */}
      <div className={`grid grid-cols-2 ${gridGap}`}>
        <StandardDropdown
          label="Location"
          required
          value={data.locationId}
          onChange={(value) => onChange({ locationId: value })}
          options={locations}
          placeholder="Select..."
          entityType="location"
          fieldName="locationId"
        />
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Inoculation Date</label>
          <input
            type="date"
            value={data.inoculationDate}
            onChange={(e) => onChange({ inoculationDate: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white [color-scheme:dark] focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
      {errors.locationId && <p className="text-red-400 text-xs -mt-2">{errors.locationId}</p>}

      {/* Advanced Fields */}
      {showAdvanced && (
        <>
          {/* Target Temperatures */}
          <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Icons.Info />
              <span>Target Conditions (optional)</span>
            </div>

            <div className={`grid grid-cols-3 ${gridGap}`}>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Colonization °C</label>
                <NumericInput
                  value={data.targetTempColonization}
                  onChange={(value) => onChange({ targetTempColonization: value ?? 24 })}
                  min={15}
                  max={35}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Fruiting °C</label>
                <NumericInput
                  value={data.targetTempFruiting}
                  onChange={(value) => onChange({ targetTempFruiting: value ?? 22 })}
                  min={10}
                  max={30}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Humidity %</label>
                <NumericInput
                  value={data.targetHumidity}
                  onChange={(value) => onChange({ targetHumidity: value ?? 90 })}
                  min={50}
                  max={100}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Estimated Cost */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Estimated Cost ($)</label>
            <NumericInput
              value={data.estimatedCost}
              onChange={(value) => onChange({ estimatedCost: value ?? 0 })}
              step={0.01}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Notes</label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={compact ? 2 : 3}
          placeholder="Any additional notes about this grow..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

// ============================================================================
// DEFAULT FORM DATA
// ============================================================================

const getTodayString = () => new Date().toISOString().split('T')[0];

export const getDefaultGrowFormData = (): GrowFormData => ({
  name: '',
  strainId: '',
  sourceCultureId: '',
  grainTypeId: '',
  spawnWeight: 500,
  substrateTypeId: '',
  substrateWeight: 2000,
  containerId: '',
  containerCount: 1,
  locationId: '',
  inoculationDate: getTodayString(),
  targetTempColonization: 24,
  targetTempFruiting: 22,
  targetHumidity: 90,
  estimatedCost: 0,
  notes: '',
});

// ============================================================================
// VALIDATION HELPER
// ============================================================================

export const validateGrowFormData = (data: GrowFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.strainId) {
    errors.strainId = 'Strain is required';
  }
  if (!data.substrateTypeId) {
    errors.substrateTypeId = 'Substrate type is required';
  }
  if (!data.containerId) {
    errors.containerId = 'Container is required';
  }
  if (!data.locationId) {
    errors.locationId = 'Location is required';
  }

  return errors;
};

export default GrowForm;
