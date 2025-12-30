// ============================================================================
// CONTRIBUTION MODAL
// Full-featured modal for submitting community contributions
// Supports: info corrections, additions, photo uploads, cultivation tips
// ============================================================================

import React, { useState, useCallback } from 'react';
import { useData } from '../../store';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import type { SuggestionType } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'species' | 'strain';
  entityId: string;
  entityName: string;
  existingData?: Record<string, any>;
}

type ContributionType = 'correction' | 'addition' | 'photo' | 'tip' | 'source';

interface ContributionFormData {
  contributionType: ContributionType;
  title: string;
  description: string;
  proposedChanges: Record<string, any>;
  sourceUrl: string;
  sourceNotes: string;
  photos: File[];
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Close: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Camera: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Lightbulb: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  Link: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
};

// ============================================================================
// CONTRIBUTION TYPE SELECTOR
// ============================================================================

const contributionTypes: Array<{
  type: ContributionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    type: 'correction',
    label: 'Suggest Correction',
    description: 'Fix incorrect or outdated information',
    icon: <Icons.Edit />,
    color: 'amber',
  },
  {
    type: 'addition',
    label: 'Add Information',
    description: 'Contribute new details like temperatures, timing, or techniques',
    icon: <Icons.Plus />,
    color: 'emerald',
  },
  {
    type: 'photo',
    label: 'Add Photos',
    description: 'Share photos of this species/strain',
    icon: <Icons.Camera />,
    color: 'blue',
  },
  {
    type: 'tip',
    label: 'Share Cultivation Tip',
    description: 'Share your experience and best practices',
    icon: <Icons.Lightbulb />,
    color: 'purple',
  },
  {
    type: 'source',
    label: 'Add Source/Reference',
    description: 'Link to research papers, articles, or documentation',
    icon: <Icons.Link />,
    color: 'pink',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ContributionModal: React.FC<ContributionModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  existingData,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'type' | 'form' | 'preview' | 'success'>('type');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ContributionFormData>({
    contributionType: 'correction',
    title: '',
    description: '',
    proposedChanges: {},
    sourceUrl: '',
    sourceNotes: '',
    photos: [],
  });

  const handleTypeSelect = (type: ContributionType) => {
    setFormData(prev => ({ ...prev, contributionType: type }));
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!user || !supabase) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Map contribution type to suggestion type
      const suggestionType: SuggestionType =
        formData.contributionType === 'correction' ? 'correction' :
        formData.contributionType === 'addition' ? 'addition' :
        entityType;

      // Insert the suggestion
      const { data, error: insertError } = await supabase
        .from('library_suggestions')
        .insert({
          suggestion_type: suggestionType,
          target_species_id: entityType === 'species' ? entityId : null,
          target_strain_id: entityType === 'strain' ? entityId : null,
          title: formData.title || `${formData.contributionType} for ${entityName}`,
          description: formData.description,
          proposed_changes: formData.proposedChanges,
          source_url: formData.sourceUrl || null,
          source_notes: formData.sourceNotes || null,
          status: 'pending',
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Handle photo uploads if any
      if (formData.photos.length > 0 && data) {
        for (const photo of formData.photos) {
          await uploadPhoto(photo, 'suggestion', data.id);
        }
      }

      setStep('success');
    } catch (err: any) {
      console.error('Failed to submit contribution:', err);
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadPhoto = async (file: File, entityType: string, entityId: string) => {
    if (!user || !supabase) return;

    // Check quota first
    const { data: quotaCheck } = await supabase.rpc('can_upload_photo', {
      p_user_id: user.id,
      p_file_size: file.size,
    });

    if (!quotaCheck?.allowed) {
      throw new Error(`Upload quota exceeded: ${quotaCheck?.reason}`);
    }

    // Upload to storage
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const path = `${entityType}/${entityId}/${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('community-photos')
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Create photo record
    const { error: recordError } = await supabase
      .from('community_photos')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        storage_path: path,
        storage_bucket: 'community-photos',
        file_size_bytes: file.size,
        mime_type: file.type,
        status: 'pending',
        user_id: user.id,
      });

    if (recordError) throw recordError;

    // Increment quota
    await supabase.rpc('increment_photo_quota', {
      p_user_id: user.id,
      p_file_size: file.size,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Limit to 5 photos per submission
    const allowedFiles = files.slice(0, 5 - formData.photos.length);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...allowedFiles],
    }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {step === 'type' && 'Contribute to Library'}
              {step === 'form' && contributionTypes.find(t => t.type === formData.contributionType)?.label}
              {step === 'preview' && 'Review Your Contribution'}
              {step === 'success' && 'Thank You!'}
            </h3>
            <p className="text-sm text-zinc-400">{entityName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Icons.Close />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Choose Contribution Type */}
          {step === 'type' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-sm mb-4">
                How would you like to contribute? All submissions are reviewed before being published.
              </p>
              {contributionTypes.map((type) => (
                <button
                  key={type.type}
                  onClick={() => handleTypeSelect(type.type)}
                  className={`
                    w-full flex items-start gap-4 p-4 rounded-xl border border-zinc-800
                    hover:border-${type.color}-500/50 hover:bg-${type.color}-950/20
                    transition-all duration-200 text-left group
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    bg-${type.color}-500/20 text-${type.color}-400
                    group-hover:bg-${type.color}-500/30
                  `}>
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                      {type.label}
                    </h4>
                    <p className="text-sm text-zinc-400">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Contribution Form */}
          {step === 'form' && (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief summary of your contribution"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={
                    formData.contributionType === 'correction'
                      ? "What information is incorrect? What should it be instead?"
                      : formData.contributionType === 'tip'
                      ? "Share your cultivation tip or experience..."
                      : "Describe your contribution in detail..."
                  }
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Specific fields based on type */}
              {formData.contributionType === 'source' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Source URL
                    </label>
                    <input
                      type="url"
                      value={formData.sourceUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Source Notes
                    </label>
                    <input
                      type="text"
                      value={formData.sourceNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, sourceNotes: e.target.value }))}
                      placeholder="Author, publication, date, etc."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </>
              )}

              {/* Photo Upload */}
              {formData.contributionType === 'photo' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Photos (up to 5)
                  </label>

                  {/* Upload Zone */}
                  <label className="block border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={formData.photos.length >= 5}
                    />
                    <Icons.Upload />
                    <p className="text-zinc-400 mt-2">
                      {formData.photos.length >= 5
                        ? 'Maximum 5 photos reached'
                        : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">PNG, JPG up to 5MB each</p>
                  </label>

                  {/* Photo Previews */}
                  {formData.photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {formData.photos.map((file, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Community Guidelines */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <h5 className="text-sm font-medium text-zinc-300 mb-2">Community Guidelines</h5>
                <ul className="text-xs text-zinc-400 space-y-1">
                  <li>• Be accurate and cite sources when possible</li>
                  <li>• Be respectful and constructive</li>
                  <li>• Only share photos you have permission to use</li>
                  <li>• Contributions are reviewed before publishing</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Icons.Check />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">
                Contribution Submitted!
              </h4>
              <p className="text-zinc-400 mb-6">
                Thank you for helping improve the library. Your contribution will be reviewed by our team
                and you'll be notified when it's approved.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'form' && (
          <div className="p-4 border-t border-zinc-800 flex justify-between">
            <button
              onClick={() => setStep('type')}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Contribution'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContributionModal;
