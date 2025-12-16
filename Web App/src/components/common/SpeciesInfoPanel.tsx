// ============================================================================
// SPECIES INFO PANEL - Enhanced Species Detail View
// Displays comprehensive species information with tabs and tooltips
// ============================================================================

import React, { useState } from 'react';
import type { Species, GrowPhaseParameters } from '../../store/types';
import { useData } from '../../store';
import { SpeciesName, SpeciesBadge } from './SpeciesName';
import { formatTemperatureRange, getTemperatureUnit, type TemperatureUnit } from '../../utils/temperature';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type InfoTab = 'overview' | 'growing' | 'stages' | 'automation';

const tabConfig: Record<InfoTab, { label: string; icon: string }> = {
  overview: { label: 'Overview', icon: '📋' },
  growing: { label: 'Growing', icon: '🌡️' },
  stages: { label: 'Stage Guide', icon: '📖' },
  automation: { label: 'Automation', icon: '🤖' },
};

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
  Thermometer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  ),
  Droplet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  Wind: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex items-center cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-zinc-800 border border-zinc-700 rounded shadow-lg whitespace-nowrap z-50">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-700" />
        </span>
      )}
    </span>
  );
};

// ============================================================================
// ENVIRONMENTAL RANGE DISPLAY
// ============================================================================

interface RangeDisplayProps {
  label: string;
  range?: { min: number; max: number; optimal?: number };
  unit: string;
  icon: React.ReactNode;
  colorClass?: string;
  isTemperature?: boolean;
  temperatureUnit?: TemperatureUnit;
}

const RangeDisplay: React.FC<RangeDisplayProps> = ({
  label,
  range,
  unit,
  icon,
  colorClass = 'text-emerald-400',
  isTemperature = false,
  temperatureUnit = 'imperial'
}) => {
  if (!range) return null;

  // Format values based on whether this is a temperature display
  let displayMin: string | number = range.min;
  let displayMax: string | number = range.max;
  let displayOptimal: string | number | undefined = range.optimal;
  let displayUnit = unit;

  if (isTemperature) {
    displayUnit = getTemperatureUnit(temperatureUnit);
    if (temperatureUnit === 'metric') {
      // Convert from Fahrenheit (stored) to Celsius
      displayMin = Math.round(((range.min - 32) * 5) / 9);
      displayMax = Math.round(((range.max - 32) * 5) / 9);
      displayOptimal = range.optimal ? Math.round(((range.optimal - 32) * 5) / 9) : undefined;
    }
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <span className={`${colorClass}`}>{icon}</span>
      <div className="flex-1">
        <span className="text-zinc-400 text-sm">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-white font-medium">
          {displayMin}-{displayMax}{displayUnit}
        </span>
        {displayOptimal !== undefined && (
          <Tooltip text="Optimal value for best results">
            <span className="ml-2 text-xs text-emerald-400">(optimal: {displayOptimal}{displayUnit})</span>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// GROW PHASE CARD
// ============================================================================

interface PhaseCardProps {
  title: string;
  phase?: GrowPhaseParameters;
  notes?: string;
  colorClass: string;
  temperatureUnit?: TemperatureUnit;
}

const PhaseCard: React.FC<PhaseCardProps> = ({ title, phase, notes, colorClass, temperatureUnit = 'imperial' }) => {
  if (!phase && !notes) return null;

  return (
    <div className={`bg-zinc-900/50 border rounded-xl p-4 ${colorClass}`}>
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-current" />
        {title}
      </h4>

      {phase && (
        <div className="space-y-2 mb-3">
          {/* Duration */}
          {(phase.daysMin || phase.daysMax || phase.daysTypical) && (
            <div className="flex items-center gap-2 text-sm">
              <Icons.Clock />
              <span className="text-zinc-400">Duration:</span>
              <span className="text-white">
                {phase.daysTypical
                  ? `~${phase.daysTypical} days`
                  : phase.daysMin && phase.daysMax
                  ? `${phase.daysMin}-${phase.daysMax} days`
                  : phase.daysMin
                  ? `${phase.daysMin}+ days`
                  : `up to ${phase.daysMax} days`}
              </span>
            </div>
          )}

          {/* Temperature */}
          {phase.tempRange && (
            <RangeDisplay
              label="Temperature"
              range={phase.tempRange}
              unit="°F"
              icon={<Icons.Thermometer />}
              colorClass="text-orange-400"
              isTemperature={true}
              temperatureUnit={temperatureUnit}
            />
          )}

          {/* Humidity */}
          {phase.humidityRange && (
            <RangeDisplay
              label="Humidity"
              range={phase.humidityRange}
              unit="%"
              icon={<Icons.Droplet />}
              colorClass="text-blue-400"
            />
          )}

          {/* CO2 */}
          {phase.co2Range && (
            <RangeDisplay
              label="CO2"
              range={phase.co2Range}
              unit=" ppm"
              icon={<Icons.Wind />}
              colorClass="text-purple-400"
            />
          )}

          {/* Light */}
          {phase.lightRequirement && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-amber-400"><Icons.Sun /></span>
              <span className="text-zinc-400">Light:</span>
              <span className="text-white capitalize">{phase.lightRequirement.replace('_', ' ')}</span>
            </div>
          )}

          {/* FAE */}
          {phase.faeFrequency && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-cyan-400"><Icons.Wind /></span>
              <span className="text-zinc-400">FAE:</span>
              <span className="text-white">{phase.faeFrequency}</span>
            </div>
          )}
        </div>
      )}

      {/* Stage Notes */}
      {notes && (
        <div className="text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-3 mt-2">
          {notes}
        </div>
      )}

      {/* Transition Criteria */}
      {phase?.transitionCriteria?.visualIndicators && phase.transitionCriteria.visualIndicators.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-700">
          <p className="text-xs text-zinc-500 mb-2">Ready to advance when:</p>
          <ul className="text-xs text-zinc-400 space-y-1">
            {phase.transitionCriteria.visualIndicators.map((indicator, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                {indicator}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SpeciesInfoPanelProps {
  species: Species;
  className?: string;
  defaultTab?: InfoTab;
  compact?: boolean;
}

export const SpeciesInfoPanel: React.FC<SpeciesInfoPanelProps> = ({
  species,
  className = '',
  defaultTab = 'overview',
  compact = false,
}) => {
  const { state } = useData();
  const [activeTab, setActiveTab] = useState<InfoTab>(defaultTab);

  // Get temperature unit from settings
  const temperatureUnit: TemperatureUnit = state.settings?.defaultUnits || 'imperial';

  // Check if species has grow phase data
  const hasGrowData = species.spawnColonization || species.bulkColonization || species.pinning || species.maturation;
  const hasStageNotes = species.spawnColonizationNotes || species.bulkColonizationNotes || species.pinningNotes || species.maturationNotes;
  const hasAutomationConfig = species.automationConfig;

  // Determine which tabs to show
  const availableTabs: InfoTab[] = ['overview'];
  if (hasGrowData) availableTabs.push('growing');
  if (hasStageNotes) availableTabs.push('stages');
  if (hasAutomationConfig || hasGrowData) availableTabs.push('automation');

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <SpeciesName species={species} className="text-lg font-semibold text-white" />
            <div className="flex items-center gap-2 mt-1">
              <SpeciesBadge species={species} size="sm" />
              {species.difficulty && (
                <span className={`px-2 py-0.5 rounded text-xs border ${
                  species.difficulty === 'beginner' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-700' :
                  species.difficulty === 'intermediate' ? 'bg-amber-950/50 text-amber-400 border-amber-700' :
                  species.difficulty === 'advanced' ? 'bg-orange-950/50 text-orange-400 border-orange-700' :
                  'bg-red-950/50 text-red-400 border-red-700'
                }`}>
                  {species.difficulty}
                </span>
              )}
            </div>
          </div>
          {species.typicalYield && (
            <div className="text-right">
              <p className="text-xs text-zinc-500">Typical Yield</p>
              <p className="text-sm text-emerald-400 font-medium">{species.typicalYield}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!compact && availableTabs.length > 1 && (
        <div className="flex gap-1 p-2 bg-zinc-800/30 border-b border-zinc-800">
          {availableTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>{tabConfig[tab].icon}</span>
              {tabConfig[tab].label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Description */}
            {species.characteristics && (
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Characteristics</h4>
                <p className="text-sm text-zinc-300">{species.characteristics}</p>
              </div>
            )}

            {/* Common Names */}
            {species.commonNames && species.commonNames.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Also Known As</h4>
                <div className="flex flex-wrap gap-2">
                  {species.commonNames.map((name, i) => (
                    <span key={i} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300">{name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred Substrates */}
            {species.preferredSubstrates && species.preferredSubstrates.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Preferred Substrates</h4>
                <div className="flex flex-wrap gap-2">
                  {species.preferredSubstrates.map((sub, i) => (
                    <span key={i} className="px-2 py-1 bg-emerald-950/30 border border-emerald-800 rounded text-xs text-emerald-400">{sub}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Flavor Profile */}
            {species.flavorProfile && (
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Flavor Profile</h4>
                <p className="text-sm text-zinc-300">{species.flavorProfile}</p>
              </div>
            )}

            {/* Culinary Notes */}
            {species.culinaryNotes && (
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Culinary Notes</h4>
                <p className="text-sm text-zinc-300">{species.culinaryNotes}</p>
              </div>
            )}

            {/* Medicinal Properties */}
            {species.medicinalProperties && (
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Medicinal Properties</h4>
                <p className="text-sm text-zinc-300">{species.medicinalProperties}</p>
              </div>
            )}

            {/* Community Tips */}
            {species.communityTips && (
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Community Tips</h4>
                <p className="text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-3">{species.communityTips}</p>
              </div>
            )}

            {/* Important Facts */}
            {species.importantFacts && (
              <div className="bg-amber-950/20 border border-amber-800/50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Icons.Info />
                  Important
                </h4>
                <p className="text-sm text-zinc-300">{species.importantFacts}</p>
              </div>
            )}

            {/* Flush Count & Shelf Life */}
            <div className="grid grid-cols-2 gap-4">
              {species.flushCount && (
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Expected Flushes</p>
                  <p className="text-sm text-white font-medium">{species.flushCount}</p>
                </div>
              )}
              {species.shelfLifeDays && (
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Shelf Life</p>
                  <p className="text-sm text-white font-medium">{species.shelfLifeDays.min}-{species.shelfLifeDays.max} days</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Growing Tab */}
        {activeTab === 'growing' && hasGrowData && (
          <div className="grid gap-4">
            <PhaseCard
              title="Spawn Colonization"
              phase={species.spawnColonization}
              colorClass="border-purple-800"
              temperatureUnit={temperatureUnit}
            />
            <PhaseCard
              title="Bulk Colonization"
              phase={species.bulkColonization}
              colorClass="border-blue-800"
              temperatureUnit={temperatureUnit}
            />
            <PhaseCard
              title="Pinning"
              phase={species.pinning}
              colorClass="border-emerald-800"
              temperatureUnit={temperatureUnit}
            />
            <PhaseCard
              title="Maturation & Harvest"
              phase={species.maturation}
              colorClass="border-amber-800"
              temperatureUnit={temperatureUnit}
            />
          </div>
        )}

        {/* Stage Notes Tab */}
        {activeTab === 'stages' && hasStageNotes && (
          <div className="space-y-4">
            {species.spawnColonizationNotes && (
              <div className="bg-purple-950/20 border border-purple-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Spawn Colonization
                </h4>
                <p className="text-sm text-zinc-300 whitespace-pre-line">{species.spawnColonizationNotes}</p>
              </div>
            )}
            {species.bulkColonizationNotes && (
              <div className="bg-blue-950/20 border border-blue-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Bulk Colonization
                </h4>
                <p className="text-sm text-zinc-300 whitespace-pre-line">{species.bulkColonizationNotes}</p>
              </div>
            )}
            {species.pinningNotes && (
              <div className="bg-emerald-950/20 border border-emerald-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Pinning Stage
                </h4>
                <p className="text-sm text-zinc-300 whitespace-pre-line">{species.pinningNotes}</p>
              </div>
            )}
            {species.maturationNotes && (
              <div className="bg-amber-950/20 border border-amber-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Maturation & Harvest
                </h4>
                <p className="text-sm text-zinc-300 whitespace-pre-line">{species.maturationNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Automation Tab */}
        {activeTab === 'automation' && (
          <div className="space-y-4">
            {species.automationConfig ? (
              <>
                {/* Automation Status */}
                <div className={`rounded-lg p-3 flex items-center gap-3 ${
                  species.automationConfig.automationTested
                    ? 'bg-emerald-950/30 border border-emerald-800'
                    : 'bg-zinc-800/50 border border-zinc-700'
                }`}>
                  <span className={species.automationConfig.automationTested ? 'text-emerald-400' : 'text-zinc-500'}>
                    {species.automationConfig.automationTested ? '✓' : '○'}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${species.automationConfig.automationTested ? 'text-emerald-400' : 'text-zinc-400'}`}>
                      {species.automationConfig.automationTested ? 'Automation Tested' : 'Not Yet Tested'}
                    </p>
                    {species.automationConfig.automationNotes && (
                      <p className="text-xs text-zinc-500 mt-0.5">{species.automationConfig.automationNotes}</p>
                    )}
                  </div>
                </div>

                {/* Required Sensors */}
                {species.automationConfig.requiredSensors && species.automationConfig.requiredSensors.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Required Sensors</h4>
                    <div className="flex flex-wrap gap-2">
                      {species.automationConfig.requiredSensors.map((sensor, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-950/30 border border-blue-800 rounded text-xs text-blue-400 capitalize">{sensor}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional Sensors */}
                {species.automationConfig.optionalSensors && species.automationConfig.optionalSensors.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Optional Sensors</h4>
                    <div className="flex flex-wrap gap-2">
                      {species.automationConfig.optionalSensors.map((sensor, i) => (
                        <span key={i} className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-400 capitalize">{sensor}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Controller Compatibility */}
                {species.automationConfig.controllerTypes && species.automationConfig.controllerTypes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Compatible Controllers</h4>
                    <div className="flex flex-wrap gap-2">
                      {species.automationConfig.controllerTypes.map((ctrl, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-950/30 border border-purple-800 rounded text-xs text-purple-400">{ctrl}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alert Thresholds */}
                <div className="grid grid-cols-2 gap-4">
                  {species.automationConfig.alertOnTempDeviation && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-xs text-zinc-500">Temp Alert Threshold</p>
                      <p className="text-sm text-white font-medium">
                        ±{temperatureUnit === 'metric'
                          ? Math.round((species.automationConfig.alertOnTempDeviation * 5) / 9)
                          : species.automationConfig.alertOnTempDeviation
                        }{getTemperatureUnit(temperatureUnit)}
                      </p>
                    </div>
                  )}
                  {species.automationConfig.alertOnHumidityDeviation && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-xs text-zinc-500">Humidity Alert Threshold</p>
                      <p className="text-sm text-white font-medium">±{species.automationConfig.alertOnHumidityDeviation}%</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <span className="text-3xl mb-2 block">🤖</span>
                <p className="text-sm">Automation parameters not yet configured for this species.</p>
                <p className="text-xs mt-1">Check the Growing tab for environmental guidelines.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPACT PREVIEW (for dropdowns/hovers)
// ============================================================================

interface SpeciesPreviewProps {
  species: Species;
  className?: string;
}

export const SpeciesPreview: React.FC<SpeciesPreviewProps> = ({ species, className = '' }) => {
  const { state } = useData();
  const temperatureUnit: TemperatureUnit = state.settings?.defaultUnits || 'imperial';

  return (
    <div className={`bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl max-w-sm ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <SpeciesName species={species} className="text-sm font-medium text-white" />
          <div className="flex items-center gap-2 mt-1">
            <SpeciesBadge species={species} size="sm" />
            {species.difficulty && (
              <span className="text-xs text-zinc-500 capitalize">{species.difficulty}</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {(species.typicalYield || species.flushCount) && (
        <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-800">
          {species.typicalYield && (
            <div>
              <p className="text-xs text-zinc-500">Yield</p>
              <p className="text-xs text-emerald-400">{species.typicalYield}</p>
            </div>
          )}
          {species.flushCount && (
            <div>
              <p className="text-xs text-zinc-500">Flushes</p>
              <p className="text-xs text-white">{species.flushCount}</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Environment Info */}
      {species.spawnColonization?.tempRange && (
        <div className="mt-2 text-xs text-zinc-400">
          Colonization: {formatTemperatureRange(
            species.spawnColonization.tempRange.min,
            species.spawnColonization.tempRange.max,
            temperatureUnit
          )}
        </div>
      )}
      {species.pinning?.tempRange && (
        <div className="text-xs text-zinc-400">
          Fruiting: {formatTemperatureRange(
            species.pinning.tempRange.min,
            species.pinning.tempRange.max,
            temperatureUnit
          )}
        </div>
      )}
    </div>
  );
};

export default SpeciesInfoPanel;
