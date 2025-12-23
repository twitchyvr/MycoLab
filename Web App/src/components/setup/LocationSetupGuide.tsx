// ============================================================================
// LOCATION SETUP GUIDE - First-time user location configuration
// Guides new users through setting up their lab spaces with templates
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useData } from '../../store';
import type { LocationLevel, RoomPurpose } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface LocationSetupGuideProps {
  onComplete: () => void;
  onSkip?: () => void;
  embedded?: boolean; // When embedded in welcome page vs standalone modal
}

type SetupMode = 'template' | 'custom' | 'minimal';

interface LocationTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  complexity: 'simple' | 'moderate' | 'advanced';
  locations: {
    name: string;
    level: LocationLevel;
    parentName?: string;
    environmentType?: string;
    purposes: RoomPurpose[];
    tempRange?: { min: number; max: number };
    humidityRange?: { min: number; max: number };
  }[];
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 22V12h6v10M3 9h18"/>
    </svg>
  ),
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Thermometer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Layers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
};

// ============================================================================
// LOCATION TEMPLATES
// ============================================================================

const locationTemplates: LocationTemplate[] = [
  {
    id: 'minimal',
    name: 'Single Space',
    description: 'One simple location for everything - perfect for beginners or small operations.',
    icon: '🏠',
    complexity: 'simple',
    locations: [
      {
        name: 'My Lab',
        level: 'facility',
        purposes: ['general'],
      },
    ],
  },
  {
    id: 'desk',
    name: 'Desktop Setup',
    description: 'A dedicated desk or shelf area with a still air box.',
    icon: '🪑',
    complexity: 'simple',
    locations: [
      {
        name: 'Grow Area',
        level: 'facility',
        purposes: ['general'],
      },
      {
        name: 'Still Air Box',
        level: 'zone',
        parentName: 'Grow Area',
        environmentType: 'still_air_box',
        purposes: ['inoculation'],
      },
    ],
  },
  {
    id: 'closet',
    name: 'Closet Grow',
    description: 'A dedicated closet or small room with incubation and fruiting zones.',
    icon: '🚪',
    complexity: 'moderate',
    locations: [
      {
        name: 'Grow Closet',
        level: 'facility',
        purposes: ['colonization', 'fruiting'],
      },
      {
        name: 'Incubation Shelf',
        level: 'zone',
        parentName: 'Grow Closet',
        environmentType: 'incubator',
        purposes: ['colonization'],
        tempRange: { min: 75, max: 82 },
        humidityRange: { min: 60, max: 80 },
      },
      {
        name: 'Fruiting Chamber',
        level: 'zone',
        parentName: 'Grow Closet',
        environmentType: 'fruiting_chamber',
        purposes: ['fruiting'],
        tempRange: { min: 65, max: 75 },
        humidityRange: { min: 85, max: 95 },
      },
    ],
  },
  {
    id: 'basement',
    name: 'Basement Lab',
    description: 'Full basement setup with dedicated areas for each cultivation phase.',
    icon: '🏗️',
    complexity: 'moderate',
    locations: [
      {
        name: 'Basement Lab',
        level: 'facility',
        purposes: ['general'],
      },
      {
        name: 'Prep Area',
        level: 'room',
        parentName: 'Basement Lab',
        purposes: ['prep', 'pasteurization'],
      },
      {
        name: 'Clean Room',
        level: 'room',
        parentName: 'Basement Lab',
        purposes: ['inoculation'],
      },
      {
        name: 'Incubation Room',
        level: 'room',
        parentName: 'Basement Lab',
        purposes: ['colonization'],
      },
      {
        name: 'Main Incubator',
        level: 'zone',
        parentName: 'Incubation Room',
        environmentType: 'incubator',
        purposes: ['colonization'],
        tempRange: { min: 75, max: 82 },
      },
      {
        name: 'Fruiting Room',
        level: 'room',
        parentName: 'Basement Lab',
        purposes: ['fruiting'],
        tempRange: { min: 65, max: 75 },
        humidityRange: { min: 85, max: 95 },
      },
      {
        name: 'Cold Storage',
        level: 'zone',
        parentName: 'Basement Lab',
        environmentType: 'cold_storage',
        purposes: ['storage'],
        tempRange: { min: 35, max: 45 },
      },
    ],
  },
  {
    id: 'professional',
    name: 'Professional Farm',
    description: 'Commercial-scale operation with multiple buildings and detailed zoning.',
    icon: '🏭',
    complexity: 'advanced',
    locations: [
      {
        name: 'Main Facility',
        level: 'facility',
        purposes: ['general'],
      },
      {
        name: 'Lab Building',
        level: 'room',
        parentName: 'Main Facility',
        purposes: ['inoculation', 'prep'],
      },
      {
        name: 'Flow Hood Station',
        level: 'zone',
        parentName: 'Lab Building',
        environmentType: 'flow_hood',
        purposes: ['inoculation'],
      },
      {
        name: 'Production Building',
        level: 'room',
        parentName: 'Main Facility',
        purposes: ['colonization', 'fruiting'],
      },
      {
        name: 'Incubation Bay 1',
        level: 'zone',
        parentName: 'Production Building',
        environmentType: 'incubator',
        purposes: ['colonization'],
        tempRange: { min: 75, max: 80 },
      },
      {
        name: 'Incubation Bay 2',
        level: 'zone',
        parentName: 'Production Building',
        environmentType: 'incubator',
        purposes: ['colonization'],
        tempRange: { min: 75, max: 80 },
      },
      {
        name: 'Fruiting Room A',
        level: 'zone',
        parentName: 'Production Building',
        environmentType: 'fruiting_chamber',
        purposes: ['fruiting'],
        tempRange: { min: 60, max: 70 },
        humidityRange: { min: 85, max: 95 },
      },
      {
        name: 'Fruiting Room B',
        level: 'zone',
        parentName: 'Production Building',
        environmentType: 'fruiting_chamber',
        purposes: ['fruiting'],
        tempRange: { min: 60, max: 70 },
        humidityRange: { min: 85, max: 95 },
      },
      {
        name: 'Cold Storage',
        level: 'zone',
        parentName: 'Main Facility',
        environmentType: 'cold_storage',
        purposes: ['storage'],
        tempRange: { min: 35, max: 40 },
      },
      {
        name: 'Drying Room',
        level: 'zone',
        parentName: 'Main Facility',
        environmentType: 'drying_chamber',
        purposes: ['drying'],
      },
    ],
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LocationSetupGuide: React.FC<LocationSetupGuideProps> = ({
  onComplete,
  onSkip,
  embedded = false,
}) => {
  const { state, addLocation } = useData();
  const [step, setStep] = useState<'intro' | 'choose' | 'template' | 'custom' | 'creating' | 'complete'>('intro');
  const [selectedTemplate, setSelectedTemplate] = useState<LocationTemplate | null>(null);
  const [customLocations, setCustomLocations] = useState<{ name: string; type: string }[]>([
    { name: '', type: 'facility' },
  ]);
  const [createdCount, setCreatedCount] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user already has locations
  const hasExistingLocations = state.locations.length > 0;

  // Create locations from template
  const createFromTemplate = async (template: LocationTemplate) => {
    setStep('creating');
    setIsCreating(true);
    setError(null);
    setCreatedCount(0);

    const locationIdMap: Record<string, string> = {};

    try {
      for (const loc of template.locations) {
        const parentId = loc.parentName ? locationIdMap[loc.parentName] : undefined;

        const newLocation = await addLocation({
          name: loc.name,
          level: loc.level,
          parentId: parentId || undefined,
          roomPurposes: loc.purposes,
          tempRange: loc.tempRange,
          humidityRange: loc.humidityRange,
          isActive: true,
        });

        if (newLocation?.id) {
          locationIdMap[loc.name] = newLocation.id;
          setCreatedCount(prev => prev + 1);
        }
      }

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create locations');
      setStep('choose');
    } finally {
      setIsCreating(false);
    }
  };

  // Create custom locations
  const createCustomLocations = async () => {
    const validLocations = customLocations.filter(l => l.name.trim());
    if (validLocations.length === 0) {
      setError('Please enter at least one location name');
      return;
    }

    setStep('creating');
    setIsCreating(true);
    setError(null);
    setCreatedCount(0);

    try {
      for (const loc of validLocations) {
        await addLocation({
          name: loc.name.trim(),
          level: loc.type as LocationLevel,
          isActive: true,
        });
        setCreatedCount(prev => prev + 1);
      }

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create locations');
      setStep('custom');
    } finally {
      setIsCreating(false);
    }
  };

  // Render the hierarchy explanation
  const renderHierarchyExplanation = () => (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-6">
      <h4 className="font-medium text-white mb-3 flex items-center gap-2">
        <Icons.Layers />
        Understanding Location Hierarchy
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-3">
          <div className="w-20 text-right text-zinc-500 shrink-0">Facility</div>
          <div className="text-zinc-400">Building or property (e.g., "My House", "Farm")</div>
        </div>
        <div className="flex items-start gap-3 ml-4">
          <div className="w-20 text-right text-zinc-500 shrink-0">Room</div>
          <div className="text-zinc-400">Rooms within facility (e.g., "Basement", "Garage")</div>
        </div>
        <div className="flex items-start gap-3 ml-8">
          <div className="w-20 text-right text-zinc-500 shrink-0">Zone</div>
          <div className="text-zinc-400">Environments (e.g., "Incubator", "Fruiting Chamber")</div>
        </div>
        <div className="flex items-start gap-3 ml-12">
          <div className="w-20 text-right text-zinc-500 shrink-0">Rack/Shelf</div>
          <div className="text-zinc-400">Physical positions within zones</div>
        </div>
      </div>
      <p className="text-xs text-zinc-500 mt-3">
        You can be as simple or detailed as you want. Even a single "My Lab" location works!
      </p>
    </div>
  );

  // Intro step
  if (step === 'intro') {
    return (
      <div className={embedded ? 'bg-gradient-to-br from-blue-950/30 to-zinc-900/50 border border-blue-800/30 rounded-xl p-6' : 'space-y-6'}>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Icons.MapPin />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Set Up Your Lab Spaces</h2>
            <p className="text-zinc-400 text-sm">
              First, let's define where you'll be growing. This helps you organize cultures,
              track grows by location, and monitor environmental conditions.
            </p>
          </div>
        </div>

        {/* Why it matters */}
        <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-emerald-400 mb-2 text-sm">Why set up locations first?</h4>
          <ul className="text-xs text-zinc-400 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">•</span>
              Track where each culture and grow is stored
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">•</span>
              Monitor capacity and prevent overcrowding
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">•</span>
              Set environmental targets (temperature, humidity)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">•</span>
              Trace contamination patterns by location
            </li>
          </ul>
        </div>

        {hasExistingLocations && (
          <div className="bg-amber-950/30 border border-amber-800/30 rounded-lg p-3 mb-4">
            <p className="text-xs text-amber-300">
              <span className="font-medium">Note:</span> You already have {state.locations.length} location(s).
              You can add more or skip this step.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('choose')}
            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            Get Started
            <Icons.ChevronRight />
          </button>
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-4 py-3 text-zinc-400 hover:text-white transition-colors text-sm"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    );
  }

  // Choose mode step
  if (step === 'choose') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setStep('intro')}
            className="text-zinc-400 hover:text-white p-1"
          >
            <Icons.ChevronLeft />
          </button>
          <h2 className="text-xl font-bold text-white">Choose Your Setup</h2>
        </div>

        <p className="text-zinc-400 text-sm">
          Pick a template that matches your setup, or create custom locations.
        </p>

        {renderHierarchyExplanation()}

        {/* Template options */}
        <div className="space-y-3">
          {locationTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => {
                setSelectedTemplate(template);
                setStep('template');
              }}
              className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl hover:border-zinc-600 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{template.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white">{template.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      template.complexity === 'simple' ? 'bg-emerald-500/20 text-emerald-400' :
                      template.complexity === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {template.complexity}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{template.description}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Creates {template.locations.length} location{template.locations.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
                  <Icons.ChevronRight />
                </div>
              </div>
            </button>
          ))}

          {/* Custom option */}
          <button
            onClick={() => setStep('custom')}
            className="w-full p-4 bg-zinc-800/50 border border-zinc-700 border-dashed rounded-xl hover:border-emerald-600 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Icons.Plus />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">Custom Setup</h3>
                <p className="text-sm text-zinc-400">Define your own locations from scratch</p>
              </div>
              <div className="text-zinc-600 group-hover:text-emerald-400 transition-colors">
                <Icons.ChevronRight />
              </div>
            </div>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/30 border border-red-800/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Template preview step
  if (step === 'template' && selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setStep('choose')}
            className="text-zinc-400 hover:text-white p-1"
          >
            <Icons.ChevronLeft />
          </button>
          <h2 className="text-xl font-bold text-white">{selectedTemplate.name}</h2>
        </div>

        <p className="text-zinc-400 text-sm">{selectedTemplate.description}</p>

        {/* Preview of locations to be created */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
          <h4 className="font-medium text-zinc-300 mb-3 text-sm">Locations to create:</h4>
          <div className="space-y-2">
            {selectedTemplate.locations.map((loc, index) => {
              const indent = loc.parentName ?
                selectedTemplate.locations.findIndex(l => l.name === loc.parentName) >= 0 ?
                  (loc.level === 'zone' || loc.level === 'rack') ? 'ml-8' : 'ml-4' : '' : '';

              return (
                <div key={index} className={`flex items-center gap-2 ${indent}`}>
                  {loc.parentName && <span className="text-zinc-600">└</span>}
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    loc.level === 'facility' ? 'bg-purple-500/20 text-purple-400' :
                    loc.level === 'room' ? 'bg-blue-500/20 text-blue-400' :
                    loc.level === 'zone' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-zinc-700 text-zinc-400'
                  }`}>
                    {loc.level}
                  </span>
                  <span className="text-white text-sm">{loc.name}</span>
                  {loc.tempRange && (
                    <span className="text-xs text-zinc-500">
                      {loc.tempRange.min}°-{loc.tempRange.max}°F
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => createFromTemplate(selectedTemplate)}
            disabled={isCreating}
            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            Create {selectedTemplate.locations.length} Location{selectedTemplate.locations.length !== 1 ? 's' : ''}
            <Icons.ChevronRight />
          </button>
        </div>
      </div>
    );
  }

  // Custom creation step
  if (step === 'custom') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setStep('choose')}
            className="text-zinc-400 hover:text-white p-1"
          >
            <Icons.ChevronLeft />
          </button>
          <h2 className="text-xl font-bold text-white">Custom Setup</h2>
        </div>

        <p className="text-zinc-400 text-sm">
          Add your locations one at a time. You can always add more later from Lab Spaces.
        </p>

        {/* Custom location inputs */}
        <div className="space-y-3">
          {customLocations.map((loc, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={loc.name}
                onChange={e => {
                  const updated = [...customLocations];
                  updated[index].name = e.target.value;
                  setCustomLocations(updated);
                }}
                placeholder="Location name (e.g., My Lab, Fruiting Room)"
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <select
                value={loc.type}
                onChange={e => {
                  const updated = [...customLocations];
                  updated[index].type = e.target.value;
                  setCustomLocations(updated);
                }}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="facility">Facility</option>
                <option value="room">Room</option>
                <option value="zone">Zone/Chamber</option>
              </select>
              {customLocations.length > 1 && (
                <button
                  onClick={() => setCustomLocations(customLocations.filter((_, i) => i !== index))}
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setCustomLocations([...customLocations, { name: '', type: 'room' }])}
          className="w-full px-3 py-2 border border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors text-sm"
        >
          + Add another location
        </button>

        {error && (
          <div className="p-3 bg-red-950/30 border border-red-800/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={createCustomLocations}
            disabled={isCreating || customLocations.every(l => !l.name.trim())}
            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
          >
            Create Location{customLocations.filter(l => l.name.trim()).length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    );
  }

  // Creating step
  if (step === 'creating') {
    const total = selectedTemplate?.locations.length || customLocations.filter(l => l.name.trim()).length;
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Creating Locations...</h3>
        <p className="text-zinc-400">
          {createdCount} of {total} created
        </p>
        <div className="w-48 h-2 bg-zinc-800 rounded-full mx-auto mt-4 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(createdCount / total) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // Complete step
  if (step === 'complete') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Icons.Check />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Locations Created!</h3>
        <p className="text-zinc-400 mb-6">
          {createdCount} location{createdCount !== 1 ? 's have' : ' has'} been set up and ready to use.
        </p>

        <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-medium text-blue-400 mb-2 text-sm">What's next?</h4>
          <ul className="text-xs text-zinc-400 space-y-1">
            <li>• Create your first culture (LC, agar, or spore syringe)</li>
            <li>• Assign cultures to your new locations</li>
            <li>• Add more locations anytime from Lab Spaces</li>
          </ul>
        </div>

        <button
          onClick={onComplete}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  return null;
};

export default LocationSetupGuide;
