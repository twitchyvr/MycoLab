// ============================================================================
// ONBOARDING WIZARD - First-Time User Setup
// Guides new users through initial configuration
// ============================================================================

import React, { useState } from 'react';
import { useData } from '../../store';
import type { ExperienceLevel, GrowingPurpose, LabEquipment } from '../../store/types';

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

type WizardStep = 'welcome' | 'experience' | 'purpose' | 'location' | 'equipment' | 'strains' | 'complete';

const Icons = {
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
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Beaker: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M4.5 3h15M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3M9 3v10l-3 3M15 3v10l3 3"/>
    </svg>
  ),
  Mushroom: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M12 2L12 22M17 7C17 7 13 9 12 14M7 7C7 7 11 9 12 14"/>
    </svg>
  ),
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 22V12h6v10M3 9h18"/>
    </svg>
  ),
  Gear: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Rocket: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  ),
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Flask: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M9 3h6v7l5 9H4l5-9V3z"/><path d="M9 3h6"/>
    </svg>
  ),
  Dollar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  Microscope: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M8 6h4M13 2L9 6l4 4"/>
    </svg>
  ),
  Mix: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
};

const STEPS: WizardStep[] = ['welcome', 'experience', 'purpose', 'location', 'equipment', 'strains', 'complete'];

const experienceLevels: { level: ExperienceLevel; title: string; description: string; consequences: string; icon: React.ReactNode }[] = [
  {
    level: 'beginner',
    title: 'Beginner',
    description: 'New to mushroom cultivation.',
    consequences: 'Shows tooltips, step-by-step guides, and simplified options',
    icon: <span className="text-2xl">🌱</span>,
  },
  {
    level: 'intermediate',
    title: 'Intermediate',
    description: 'Done a few grows, understand the basics.',
    consequences: 'Shows helpful hints but fewer prompts',
    icon: <span className="text-2xl">🍄</span>,
  },
  {
    level: 'advanced',
    title: 'Advanced',
    description: 'Experienced with complex techniques.',
    consequences: 'All features visible, no hand-holding',
    icon: <span className="text-2xl">🔬</span>,
  },
  {
    level: 'expert',
    title: 'Expert',
    description: 'Professional cultivator.',
    consequences: 'Full access, bulk operations, detailed data',
    icon: <span className="text-2xl">🎓</span>,
  },
];

const growingPurposes: { purpose: GrowingPurpose; title: string; description: string; consequences: string; icon: React.ReactNode }[] = [
  {
    purpose: 'hobby',
    title: 'Hobby / Personal',
    description: 'Growing for personal use and learning.',
    consequences: 'Focus on grow tracking, simple yield logging',
    icon: <Icons.Home />,
  },
  {
    purpose: 'commercial',
    title: 'Commercial',
    description: 'Growing to sell mushrooms.',
    consequences: 'Cost tracking, profit analytics, batch management',
    icon: <Icons.Dollar />,
  },
  {
    purpose: 'research',
    title: 'Research',
    description: 'Experiments, strain development, genetics.',
    consequences: 'Detailed observations, variable tracking, lineage focus',
    icon: <Icons.Microscope />,
  },
  {
    purpose: 'mixed',
    title: 'Mixed',
    description: 'A combination of the above.',
    consequences: 'All features available, customize as needed',
    icon: <Icons.Mix />,
  },
];

// Mushroom categories for interest selection
const mushroomCategories = [
  {
    id: 'culinary',
    title: 'Culinary / Gourmet',
    description: 'Oyster, Shiitake, King Trumpet, Enoki, etc.',
    icon: '🍳',
  },
  {
    id: 'medicinal',
    title: 'Medicinal',
    description: "Lion's Mane, Reishi, Turkey Tail, Cordyceps, etc.",
    icon: '💊',
  },
  {
    id: 'research',
    title: 'Research / Exotic',
    description: 'Rare species, genetic work, experimental grows.',
    icon: '🔬',
  },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onSkip }) => {
  const { state, updateSettings, addLocation, activeLocationTypes } = useData();

  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(
    state.settings.experienceLevel || null
  );
  const [growingPurpose, setGrowingPurpose] = useState<GrowingPurpose | null>(
    state.settings.growingPurpose || null
  );

  // Location setup
  const [locationName, setLocationName] = useState('');
  const [locationType, setLocationType] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [createdLocationId, setCreatedLocationId] = useState<string | null>(null);

  // Equipment
  const [equipment, setEquipment] = useState<LabEquipment>(state.settings.labEquipment || {});

  // Preferred mushroom categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex) / (STEPS.length - 1)) * 100;

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'welcome':
        return true;
      case 'experience':
        return experienceLevel !== null;
      case 'purpose':
        return growingPurpose !== null;
      case 'location':
        return true; // Optional
      case 'equipment':
        return true; // Optional
      case 'strains':
        return true; // Optional
      default:
        return true;
    }
  };

  const handleNext = async () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      // Save location if provided
      if (currentStep === 'location' && locationName.trim() && !createdLocationId) {
        const newLocation = await addLocation({
          name: locationName.trim(),
          typeId: locationType || undefined,
          notes: locationDescription.trim() || undefined,
          isActive: true,
        });
        if (newLocation?.id) {
          setCreatedLocationId(newLocation.id);
        }
      }
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleComplete = async () => {
    // Save all settings
    await updateSettings({
      experienceLevel: experienceLevel || 'beginner',
      growingPurpose: growingPurpose || 'hobby',
      labEquipment: equipment,
      preferredCategories: selectedCategories,
      hasCompletedSetupWizard: true,
      showTooltips: experienceLevel === 'beginner' || experienceLevel === 'intermediate',
      showGuidedWorkflows: experienceLevel === 'beginner',
    });
    onComplete();
  };

  const handleSkip = async () => {
    // Save settings and mark wizard as completed so it doesn't pop up again
    await updateSettings({
      hasCompletedSetupWizard: true,
      ...(experienceLevel && {
        experienceLevel,
        showTooltips: experienceLevel === 'beginner' || experienceLevel === 'intermediate',
        showGuidedWorkflows: experienceLevel === 'beginner',
      }),
    });
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const toggleEquipment = (key: keyof LabEquipment) => {
    setEquipment(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Icons.Mushroom />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Welcome to MycoLab!</h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-6">
              Let's get your lab set up. This wizard will help configure your experience
              based on your needs and equipment.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <Icons.Gear />
                ~2 minutes
              </span>
              <span className="flex items-center gap-1">
                <Icons.Star />
                Personalized setup
              </span>
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="py-4">
            <h2 className="text-xl font-bold text-white mb-2">What's your experience level?</h2>
            <p className="text-zinc-400 text-sm mb-6">
              This helps us show you the right level of detail and guidance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {experienceLevels.map(({ level, title, description, consequences, icon }) => (
                <button
                  key={level}
                  onClick={() => setExperienceLevel(level)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    experienceLevel === level
                      ? 'bg-emerald-500/20 border-emerald-500 text-white'
                      : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 text-zinc-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">{icon}</div>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-xs text-zinc-500 mt-1">{description}</p>
                      {experienceLevel === level && (
                        <p className="text-xs text-emerald-400/80 mt-2 italic">{consequences}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'purpose':
        return (
          <div className="py-4">
            <h2 className="text-xl font-bold text-white mb-2">Why are you growing?</h2>
            <p className="text-zinc-400 text-sm mb-6">
              This helps us highlight the most relevant features for you.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {growingPurposes.map(({ purpose, title, description, consequences, icon }) => (
                <button
                  key={purpose}
                  onClick={() => setGrowingPurpose(purpose)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    growingPurpose === purpose
                      ? 'bg-emerald-500/20 border-emerald-500 text-white'
                      : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 text-zinc-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 text-zinc-400">{icon}</div>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-xs text-zinc-500 mt-1">{description}</p>
                      {growingPurpose === purpose && (
                        <p className="text-xs text-emerald-400/80 mt-2 italic">{consequences}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="py-4">
            <h2 className="text-xl font-bold text-white mb-2">Set up your first space</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Create your first grow room or lab space. You can add more later.
            </p>

            {/* Info box explaining locations */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
              <p className="text-xs text-blue-300">
                <span className="font-medium">Why locations matter:</span> Track where your cultures and grows are stored.
                This helps organize your lab and monitor environmental conditions per space.
              </p>
            </div>

            {createdLocationId ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Icons.Check />
                </div>
                <p className="text-emerald-400 font-medium">Location created!</p>
                <p className="text-sm text-zinc-400 mt-1">"{locationName}" is ready to use</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Space Name *
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={e => setLocationName(e.target.value)}
                    placeholder="e.g., Fruiting Chamber, Incubation Closet"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Give it a memorable name you'll recognize</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Type
                  </label>
                  <select
                    value={locationType}
                    onChange={e => setLocationType(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select type...</option>
                    {activeLocationTypes.map(lt => (
                      <option key={lt.id} value={lt.id}>{lt.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-500 mt-1">Helps filter and organize your spaces</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Description (optional)
                  </label>
                  <textarea
                    value={locationDescription}
                    onChange={e => setLocationDescription(e.target.value)}
                    placeholder="Notes about this space..."
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-zinc-500 mt-4 text-center">
              This step is optional. You can skip and add locations later.
            </p>
          </div>
        );

      case 'equipment':
        return (
          <div className="py-4">
            <h2 className="text-xl font-bold text-white mb-2">What equipment do you have?</h2>
            <p className="text-zinc-400 text-sm mb-4">
              This helps us recommend appropriate techniques and workflows.
            </p>

            {/* Equipment items with descriptions */}
            <div className="space-y-2">
              {[
                { key: 'hasPressureCooker', label: 'Pressure Cooker', icon: '🍳', hint: 'Enables grain/agar sterilization' },
                { key: 'hasFlowHood', label: 'Flow Hood', icon: '🌬️', hint: 'Sterile work with low contamination' },
                { key: 'hasStillAirBox', label: 'Still Air Box', icon: '📦', hint: 'Budget-friendly sterile work' },
                { key: 'hasDehydrator', label: 'Dehydrator', icon: '☀️', hint: 'Dry harvests for long-term storage' },
                { key: 'hasIncubationChamber', label: 'Incubation Chamber', icon: '🌡️', hint: 'Controlled colonization temps' },
                { key: 'hasFruitingChamber', label: 'Fruiting Chamber', icon: '🍄', hint: 'Humidity/FAE for fruiting' },
                { key: 'hasScales', label: 'Digital Scale', icon: '⚖️', hint: 'Accurate yield tracking' },
              ].map(({ key, label, icon, hint }) => (
                <button
                  key={key}
                  onClick={() => toggleEquipment(key as keyof LabEquipment)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    equipment[key as keyof LabEquipment]
                      ? 'bg-emerald-500/20 border-emerald-500 text-white'
                      : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 text-zinc-400'
                  }`}
                >
                  <div className="text-2xl shrink-0">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-zinc-500 truncate">{hint}</p>
                  </div>
                  {equipment[key as keyof LabEquipment] && (
                    <div className="text-emerald-400 shrink-0">
                      <Icons.Check />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-zinc-500 mt-4 text-center">
              This step is optional. You can update your equipment in Settings anytime.
            </p>
          </div>
        );

      case 'strains':
        return (
          <div className="py-4">
            <h2 className="text-xl font-bold text-white mb-2">What do you want to grow?</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Select the categories you're most interested in. We'll tailor your experience accordingly.
            </p>

            {/* Category Selection */}
            <div className="space-y-3">
              {mushroomCategories.map(({ id, title, description, icon }) => (
                <button
                  key={id}
                  onClick={() => toggleCategory(id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedCategories.includes(id)
                      ? 'bg-emerald-500/20 border-emerald-500 text-white'
                      : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 text-zinc-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">{icon}</div>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-xs text-zinc-500 mt-1">{description}</p>
                    </div>
                    {selectedCategories.includes(id) && (
                      <div className="ml-auto text-emerald-400">
                        <Icons.Check />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <p className="text-xs text-zinc-500 mt-4 text-center">
              This step is optional. You can change your preferences anytime.
            </p>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Icons.Rocket />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">You're all set!</h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-6">
              Your lab is configured and ready to go.
              {experienceLevel === 'beginner' && ' We\'ll guide you through your first steps.'}
              {experienceLevel === 'expert' && ' All advanced features are unlocked.'}
            </p>

            <div className="bg-zinc-800/50 rounded-xl p-4 max-w-sm mx-auto text-left space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Experience:</span>
                <span className="text-white capitalize">{experienceLevel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Purpose:</span>
                <span className="text-white capitalize">{growingPurpose}</span>
              </div>
              {createdLocationId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">First Space:</span>
                  <span className="text-emerald-400">{locationName}</span>
                </div>
              )}
              {Object.values(equipment).filter(Boolean).length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Equipment:</span>
                  <span className="text-white">{Object.values(equipment).filter(Boolean).length} items</span>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-zinc-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        {currentStep !== 'welcome' && currentStep !== 'complete' && (
          <div className="px-6 pt-4 flex items-center justify-center gap-2">
            {STEPS.slice(1, -1).map((step, index) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-all ${
                  STEPS.indexOf(step) <= currentStepIndex
                    ? 'bg-emerald-500'
                    : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderStepContent()}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
          {currentStep === 'welcome' ? (
            <>
              <button
                onClick={handleSkip}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Skip setup
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                Let's Go
                <Icons.ChevronRight />
              </button>
            </>
          ) : currentStep === 'complete' ? (
            <>
              <div />
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                Start Growing
                <Icons.ChevronRight />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <Icons.ChevronLeft />
                Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSkip}
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {currentStep === 'strains' ? 'Finish' : 'Next'}
                  <Icons.ChevronRight />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
