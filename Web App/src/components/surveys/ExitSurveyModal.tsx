// ============================================================================
// EXIT SURVEY MODAL
// Multi-step survey for capturing outcome data when removing/completing entities
// ============================================================================

import React, { useState, useMemo } from 'react';
import { Portal } from '../common';
import {
  OutcomeCategory,
  OutcomeCode,
  GrowOutcomeCode,
  CultureOutcomeCode,
  ContaminationType,
  ContaminationStage,
  SuspectedCause,
  GROW_OUTCOME_OPTIONS,
  CULTURE_OUTCOME_OPTIONS,
  CONTAMINATION_TYPE_OPTIONS,
  SUSPECTED_CAUSE_OPTIONS,
  OutcomeOption,
} from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ExitSurveyData {
  // Required: Outcome classification
  outcomeCategory: OutcomeCategory;
  outcomeCode: OutcomeCode;
  outcomeLabel: string;

  // Optional: Contamination details (if applicable)
  contamination?: {
    type?: ContaminationType;
    stage?: ContaminationStage;
    suspectedCause?: SuspectedCause;
    notes?: string;
  };

  // Optional: User feedback
  feedback?: {
    overallSatisfaction?: number; // 1-5
    difficultyRating?: number; // 1-5
    wouldRepeat?: boolean;
    whatWorked?: string;
    whatFailed?: string;
    notes?: string;
  };
}

interface ExitSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: ExitSurveyData) => void;
  onSkip: () => void;
  entityType: 'grow' | 'culture' | 'inventory_item';
  entityName: string;
  // Pre-select outcome for cases where it's already known (e.g., marking contaminated)
  preselectedOutcome?: OutcomeCode;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Warning: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const CategoryBadge: React.FC<{ category: OutcomeCategory }> = ({ category }) => {
  const styles = {
    success: 'bg-emerald-950/50 text-emerald-400 border-emerald-800',
    failure: 'bg-red-950/50 text-red-400 border-red-800',
    neutral: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    partial: 'bg-amber-950/50 text-amber-400 border-amber-800',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[category]}`}>
      {category}
    </span>
  );
};

const StarRating: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label?: string;
}> = ({ value, onChange, label }) => {
  return (
    <div>
      {label && <p className="text-sm text-zinc-400 mb-2">{label}</p>}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg transition-colors text-base font-medium ${
              star <= value
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700'
            }`}
          >
            {star}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// STEP COMPONENTS
// ============================================================================

interface StepProps {
  surveyData: ExitSurveyData;
  setSurveyData: React.Dispatch<React.SetStateAction<ExitSurveyData>>;
  entityType: 'grow' | 'culture' | 'inventory_item';
}

// Step 1: Outcome Selection
const OutcomeStep: React.FC<StepProps> = ({ surveyData, setSurveyData, entityType }) => {
  const options: OutcomeOption[] = entityType === 'grow'
    ? GROW_OUTCOME_OPTIONS
    : entityType === 'culture'
    ? CULTURE_OUTCOME_OPTIONS
    : GROW_OUTCOME_OPTIONS; // Fallback for inventory

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<OutcomeCategory, OutcomeOption[]> = {
      success: [],
      partial: [],
      failure: [],
      neutral: [],
    };
    options.forEach(opt => groups[opt.category].push(opt));
    return groups;
  }, [options]);

  const categoryOrder: OutcomeCategory[] = ['success', 'partial', 'failure', 'neutral'];
  const categoryLabels: Record<OutcomeCategory, string> = {
    success: 'Success',
    partial: 'Partial Success',
    failure: 'Failure',
    neutral: 'Other',
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">What happened?</h3>
        <p className="text-sm text-zinc-400">
          Select the outcome that best describes this {entityType.replace('_', ' ')}
        </p>
      </div>

      {categoryOrder.map(category => {
        const categoryOptions = grouped[category];
        if (categoryOptions.length === 0) return null;

        return (
          <div key={category}>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
              {categoryLabels[category]}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {categoryOptions.map(option => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setSurveyData(prev => ({
                    ...prev,
                    outcomeCategory: option.category,
                    outcomeCode: option.code,
                    outcomeLabel: option.label,
                  }))}
                  className={`p-4 min-h-[56px] rounded-lg border text-left transition-all ${
                    surveyData.outcomeCode === option.code
                      ? 'border-emerald-500 bg-emerald-950/30'
                      : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800'
                  }`}
                >
                  <p className={`font-medium text-sm ${
                    surveyData.outcomeCode === option.code ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {option.label}
                  </p>
                  {option.description && (
                    <p className="text-xs text-zinc-500 mt-1">{option.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Step 2: Contamination Details (conditional)
const ContaminationStep: React.FC<StepProps> = ({ surveyData, setSurveyData }) => {
  const updateContamination = (updates: Partial<ExitSurveyData['contamination']>) => {
    setSurveyData(prev => ({
      ...prev,
      contamination: { ...prev.contamination, ...updates },
    }));
  };

  const contaminationStageOptions: { code: ContaminationStage; label: string }[] = [
    { code: 'agar', label: 'Agar' },
    { code: 'liquid_culture', label: 'Liquid Culture' },
    { code: 'grain_spawn', label: 'Grain Spawn' },
    { code: 'bulk_colonization', label: 'Bulk Colonization' },
    { code: 'fruiting', label: 'Fruiting' },
    { code: 'storage', label: 'Storage' },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Contamination Details</h3>
        <p className="text-sm text-zinc-400">
          Help us track contamination patterns (optional but valuable!)
        </p>
      </div>

      {/* Contamination Type */}
      <div>
        <p className="text-sm text-zinc-400 mb-2">Type of Contamination</p>
        <div className="grid grid-cols-2 gap-2">
          {CONTAMINATION_TYPE_OPTIONS.map(option => (
            <button
              key={option.code}
              type="button"
              onClick={() => updateContamination({ type: option.code })}
              className={`p-3 min-h-[48px] rounded-lg border text-left transition-all ${
                surveyData.contamination?.type === option.code
                  ? 'border-red-500 bg-red-950/30'
                  : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800'
              }`}
            >
              <p className={`font-medium text-sm ${
                surveyData.contamination?.type === option.code ? 'text-red-400' : 'text-white'
              }`}>
                {option.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Stage When Detected */}
      <div>
        <p className="text-sm text-zinc-400 mb-2">Stage When Detected</p>
        <div className="flex flex-wrap gap-2">
          {contaminationStageOptions.map(option => (
            <button
              key={option.code}
              type="button"
              onClick={() => updateContamination({ stage: option.code })}
              className={`px-4 py-2.5 min-h-[44px] rounded-lg border text-sm font-medium transition-all ${
                surveyData.contamination?.stage === option.code
                  ? 'border-red-500 bg-red-950/30 text-red-400'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Suspected Cause */}
      <div>
        <p className="text-sm text-zinc-400 mb-2">Suspected Cause</p>
        <div className="grid grid-cols-2 gap-2">
          {SUSPECTED_CAUSE_OPTIONS.map(option => (
            <button
              key={option.code}
              type="button"
              onClick={() => updateContamination({ suspectedCause: option.code })}
              className={`p-3 min-h-[48px] rounded-lg border text-left transition-all ${
                surveyData.contamination?.suspectedCause === option.code
                  ? 'border-amber-500 bg-amber-950/30'
                  : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800'
              }`}
            >
              <p className={`font-medium text-sm ${
                surveyData.contamination?.suspectedCause === option.code ? 'text-amber-400' : 'text-white'
              }`}>
                {option.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <p className="text-sm text-zinc-400 mb-2">Additional Notes (optional)</p>
        <textarea
          value={surveyData.contamination?.notes || ''}
          onChange={(e) => updateContamination({ notes: e.target.value })}
          placeholder="Any other details about the contamination..."
          rows={2}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

// Step 3: Feedback & Lessons Learned
const FeedbackStep: React.FC<StepProps> = ({ surveyData, setSurveyData }) => {
  const updateFeedback = (updates: Partial<ExitSurveyData['feedback']>) => {
    setSurveyData(prev => ({
      ...prev,
      feedback: { ...prev.feedback, ...updates },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Lessons Learned</h3>
        <p className="text-sm text-zinc-400">
          Optional feedback to help track patterns (skip if you prefer)
        </p>
      </div>

      {/* Satisfaction */}
      <StarRating
        label="Overall Satisfaction (1 = Poor, 5 = Excellent)"
        value={surveyData.feedback?.overallSatisfaction || 0}
        onChange={(value) => updateFeedback({ overallSatisfaction: value })}
      />

      {/* Difficulty */}
      <StarRating
        label="Difficulty Level (1 = Very Easy, 5 = Very Hard)"
        value={surveyData.feedback?.difficultyRating || 0}
        onChange={(value) => updateFeedback({ difficultyRating: value })}
      />

      {/* Would Repeat */}
      <div>
        <p className="text-sm text-zinc-400 mb-2">Would you do this again?</p>
        <div className="flex gap-2">
          {[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ].map(option => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => updateFeedback({ wouldRepeat: option.value })}
              className={`flex-1 py-3 min-h-[48px] rounded-lg border text-sm font-medium transition-all ${
                surveyData.feedback?.wouldRepeat === option.value
                  ? option.value
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400'
                    : 'border-red-500 bg-red-950/30 text-red-400'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* What Worked */}
      <div>
        <p className="text-sm text-zinc-400 mb-2">What worked well?</p>
        <textarea
          value={surveyData.feedback?.whatWorked || ''}
          onChange={(e) => updateFeedback({ whatWorked: e.target.value })}
          placeholder="e.g., Substrate recipe was great, colonization was fast..."
          rows={2}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* What Failed */}
      <div>
        <p className="text-sm text-zinc-400 mb-2">What could be improved?</p>
        <textarea
          value={surveyData.feedback?.whatFailed || ''}
          onChange={(e) => updateFeedback({ whatFailed: e.target.value })}
          placeholder="e.g., FAE was too low, humidity dropped..."
          rows={2}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Additional Notes */}
      <div>
        <p className="text-sm text-zinc-400 mb-2">Additional notes</p>
        <textarea
          value={surveyData.feedback?.notes || ''}
          onChange={(e) => updateFeedback({ notes: e.target.value })}
          placeholder="Any other thoughts or lessons learned..."
          rows={2}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ExitSurveyModal: React.FC<ExitSurveyModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onSkip,
  entityType,
  entityName,
  preselectedOutcome,
}) => {
  // Find preselected option
  const preselectedOption = useMemo(() => {
    if (!preselectedOutcome) return null;
    const options = entityType === 'grow' ? GROW_OUTCOME_OPTIONS : CULTURE_OUTCOME_OPTIONS;
    return options.find(o => o.code === preselectedOutcome) || null;
  }, [preselectedOutcome, entityType]);

  // Survey state
  const [surveyData, setSurveyData] = useState<ExitSurveyData>({
    outcomeCategory: preselectedOption?.category || 'neutral',
    outcomeCode: preselectedOutcome || '' as OutcomeCode,
    outcomeLabel: preselectedOption?.label || '',
    contamination: {},
    feedback: {},
  });

  // Step management
  const [currentStep, setCurrentStep] = useState(0);

  // Determine which steps to show
  const isContaminationOutcome = surveyData.outcomeCode?.toString().includes('contamination');
  const steps = useMemo(() => {
    const baseSteps = [
      { id: 'outcome', label: 'Outcome', component: OutcomeStep },
    ];

    if (isContaminationOutcome) {
      baseSteps.push({ id: 'contamination', label: 'Details', component: ContaminationStep });
    }

    baseSteps.push({ id: 'feedback', label: 'Feedback', component: FeedbackStep });

    return baseSteps;
  }, [isContaminationOutcome]);

  // Navigation
  const canGoNext = currentStep < steps.length - 1;
  const canGoBack = currentStep > 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Validate outcomeCode is set before completing
    if (!surveyData.outcomeCode) {
      console.error('[ExitSurvey] outcomeCode is empty in handleComplete');
      alert('Please select an outcome before completing.');
      return;
    }
    onComplete(surveyData);
  };

  if (!isOpen) return null;

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 sm:p-4 overflow-y-auto">
        <div className="bg-zinc-900 w-full sm:max-w-lg border-t sm:border border-zinc-700 rounded-t-2xl sm:rounded-xl max-h-[95vh] sm:max-h-[90vh] flex flex-col safe-area-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Log Outcome</h2>
            <p className="text-sm text-zinc-400">{entityName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 min-w-[44px] min-h-[44px] text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-center"
          >
            <Icons.X />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                {index > 0 && (
                  <div className={`flex-1 h-0.5 ${
                    index <= currentStep ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`} />
                )}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  index < currentStep
                    ? 'bg-emerald-500 text-white'
                    : index === currentStep
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                    : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {index < currentStep ? <Icons.Check /> : index + 1}
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <span
                key={step.id}
                className={`text-xs ${index === currentStep ? 'text-emerald-400' : 'text-zinc-500'}`}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <CurrentStepComponent
            surveyData={surveyData}
            setSurveyData={setSurveyData}
            entityType={entityType}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800 gap-2">
          <button
            onClick={onSkip}
            className="px-3 py-2.5 min-h-[48px] text-zinc-400 hover:text-white text-sm transition-colors rounded-lg hover:bg-zinc-800"
          >
            Skip
          </button>

          <div className="flex gap-2">
            {canGoBack && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-4 py-2.5 min-h-[48px] bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Icons.ChevronLeft />
                Back
              </button>
            )}

            {isLastStep ? (
              <button
                onClick={handleComplete}
                disabled={!surveyData.outcomeCode}
                className="flex items-center gap-1 px-5 py-2.5 min-h-[48px] bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Icons.Check />
                Complete
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentStep === 0 && !surveyData.outcomeCode}
                className="flex items-center gap-1 px-5 py-2.5 min-h-[48px] bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Next
                <Icons.ChevronRight />
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </Portal>
  );
};

export default ExitSurveyModal;
