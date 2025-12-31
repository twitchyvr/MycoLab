// ============================================================================
// SUGGESTION REVIEW PANEL
// Admin interface for reviewing and moderating community suggestions
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/AuthContext';
import {
  sendContributionApprovedEmail,
  sendContributionRejectedEmail,
  sendContributionNeedsInfoEmail,
} from '../../../lib/emailService';
import { SettingsSection } from '../common/SettingsSection';

// ============================================================================
// TYPES
// ============================================================================

interface Suggestion {
  id: string;
  suggestion_type: string;
  target_species_id: string | null;
  target_strain_id: string | null;
  title: string;
  description: string | null;
  proposed_changes: Record<string, any> | null;
  source_url: string | null;
  source_notes: string | null;
  status: string;
  admin_notes: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Joined data
  user_email?: string;
  species_name?: string;
  strain_name?: string;
}

interface CommunityPhoto {
  id: string;
  entity_type: string;
  entity_id: string;
  storage_path: string;
  storage_bucket: string;
  status: string;
  created_at: string;
}

type ReviewAction = 'approve' | 'reject' | 'needs_info';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Info: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Image: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  User: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Link: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ChevronUp: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ),
};

// ============================================================================
// STATUS & TYPE BADGES
// ============================================================================

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { color: string; label: string }> = {
    pending: { color: 'amber', label: 'Pending' },
    under_review: { color: 'blue', label: 'Under Review' },
    needs_info: { color: 'orange', label: 'Needs Info' },
    approved: { color: 'emerald', label: 'Approved' },
    rejected: { color: 'red', label: 'Rejected' },
  };
  const c = config[status] || { color: 'zinc', label: status };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-${c.color}-500/20 text-${c.color}-400 border border-${c.color}-500/30`}>
      {c.label}
    </span>
  );
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const config: Record<string, { icon: string; label: string }> = {
    species: { icon: '🍄', label: 'Species' },
    strain: { icon: '🧬', label: 'Strain' },
    correction: { icon: '✏️', label: 'Correction' },
    addition: { icon: '➕', label: 'Addition' },
    photo: { icon: '📷', label: 'Photo' },
    tip: { icon: '💡', label: 'Tip' },
    source: { icon: '🔗', label: 'Source' },
  };
  const c = config[type] || { icon: '📝', label: type };

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-zinc-700 text-zinc-300">
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SuggestionReviewPanelProps {
  isConnected: boolean;
  onCountChange?: (count: number) => void;
}

export const SuggestionReviewPanel: React.FC<SuggestionReviewPanelProps> = ({
  isConnected,
  onCountChange,
}) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Record<string, CommunityPhoto[]>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Action modal state
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    suggestion: Suggestion | null;
    action: ReviewAction | null;
  }>({ open: false, suggestion: null, action: null });
  const [actionNote, setActionNote] = useState('');

  // Clear messages after timeout
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!isConnected || !supabase) return;
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('library_suggestions')
        .select(`
          *,
          user_profiles!library_suggestions_user_id_fkey(email),
          species!library_suggestions_target_species_id_fkey(common_name),
          strains!library_suggestions_target_strain_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.in('status', ['pending', 'under_review', 'needs_info']);
      }

      const { data, error: fetchError } = await query.limit(50);

      if (fetchError) {
        // Try simpler query without joins if the main one fails
        const { data: simpleData, error: simpleError } = await supabase
          .from('library_suggestions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (simpleError) throw simpleError;

        const filtered = filter === 'pending'
          ? (simpleData || []).filter(s => ['pending', 'under_review', 'needs_info'].includes(s.status))
          : simpleData || [];

        setSuggestions(filtered);
        onCountChange?.(filtered.filter(s => ['pending', 'under_review', 'needs_info'].includes(s.status)).length);
        return;
      }

      // Transform data with joins
      const transformed = (data || []).map(s => ({
        ...s,
        user_email: s.user_profiles?.email || null,
        species_name: s.species?.common_name || null,
        strain_name: s.strains?.name || null,
      }));

      setSuggestions(transformed);
      onCountChange?.(transformed.filter(s => ['pending', 'under_review', 'needs_info'].includes(s.status)).length);
    } catch (err: any) {
      console.error('Failed to fetch suggestions:', err);
      setError(err.message || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, [isConnected, filter, onCountChange]);

  // Load on mount and filter change
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Fetch photos for a suggestion
  const fetchPhotos = async (suggestionId: string) => {
    if (!supabase || photos[suggestionId]) return;

    try {
      const { data, error } = await supabase
        .from('community_photos')
        .select('*')
        .eq('entity_type', 'suggestion')
        .eq('entity_id', suggestionId);

      if (!error && data) {
        setPhotos(prev => ({ ...prev, [suggestionId]: data }));
      }
    } catch (err) {
      console.error('Failed to fetch photos:', err);
    }
  };

  // Toggle expanded suggestion
  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchPhotos(id);
    }
  };

  // Open action modal
  const openActionModal = (suggestion: Suggestion, action: ReviewAction) => {
    setActionModal({ open: true, suggestion, action });
    setActionNote('');
  };

  // Close action modal
  const closeActionModal = () => {
    setActionModal({ open: false, suggestion: null, action: null });
    setActionNote('');
  };

  // Process the action
  const processAction = async () => {
    const { suggestion, action } = actionModal;
    if (!suggestion || !action || !supabase || !user) return;

    setProcessing(suggestion.id);
    closeActionModal();

    try {
      const now = new Date().toISOString();
      let newStatus = '';
      let updateData: Record<string, any> = {
        reviewed_at: now,
        reviewed_by: user.id,
        updated_at: now,
      };

      switch (action) {
        case 'approve':
          newStatus = 'approved';
          updateData.status = 'approved';
          updateData.admin_notes = actionNote || null;
          break;
        case 'reject':
          newStatus = 'rejected';
          updateData.status = 'rejected';
          updateData.rejection_reason = actionNote || 'Does not meet guidelines';
          break;
        case 'needs_info':
          newStatus = 'needs_info';
          updateData.status = 'needs_info';
          updateData.admin_notes = actionNote || 'Please provide more information';
          break;
      }

      // Update the suggestion
      const { error: updateError } = await supabase
        .from('library_suggestions')
        .update(updateData)
        .eq('id', suggestion.id);

      if (updateError) throw updateError;

      // Also update any associated photos if approving
      if (action === 'approve') {
        await supabase
          .from('community_photos')
          .update({
            status: 'approved',
            moderated_at: now,
            moderated_by: user.id,
          })
          .eq('entity_type', 'suggestion')
          .eq('entity_id', suggestion.id);
      } else if (action === 'reject') {
        await supabase
          .from('community_photos')
          .update({
            status: 'rejected',
            moderated_at: now,
            moderated_by: user.id,
            moderation_notes: actionNote || null,
          })
          .eq('entity_type', 'suggestion')
          .eq('entity_id', suggestion.id);
      }

      // Send email notification to user
      if (suggestion.user_email) {
        const entityName = suggestion.species_name || suggestion.strain_name || 'Library Entry';

        try {
          if (action === 'approve') {
            await sendContributionApprovedEmail(
              suggestion.user_email,
              suggestion.suggestion_type,
              entityName,
              suggestion.title,
              actionNote || undefined
            );
          } else if (action === 'reject') {
            await sendContributionRejectedEmail(
              suggestion.user_email,
              suggestion.suggestion_type,
              entityName,
              suggestion.title,
              actionNote || undefined
            );
          } else if (action === 'needs_info') {
            await sendContributionNeedsInfoEmail(
              suggestion.user_email,
              suggestion.suggestion_type,
              entityName,
              suggestion.title,
              actionNote || 'Please provide more details'
            );
          }
        } catch (emailErr) {
          console.warn('Failed to send email notification:', emailErr);
          // Don't fail the whole operation if email fails
        }
      }

      setMessage({
        type: 'success',
        text: `Suggestion ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'marked as needs info'}`,
      });

      // Refresh the list
      fetchSuggestions();
    } catch (err: any) {
      console.error('Failed to process action:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to process action' });
    } finally {
      setProcessing(null);
    }
  };

  // Get signed URL for photo
  const getPhotoUrl = (photo: CommunityPhoto) => {
    if (!supabase) return '';
    const { data } = supabase.storage
      .from(photo.storage_bucket)
      .getPublicUrl(photo.storage_path);
    return data?.publicUrl || '';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isConnected) {
    return (
      <SettingsSection title="Library Suggestions" icon="📬">
        <p className="text-zinc-500 text-sm">Connect to database to manage suggestions.</p>
      </SettingsSection>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Toast */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-emerald-950/30 border-emerald-700 text-emerald-300'
            : 'bg-red-950/30 border-red-700 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <SettingsSection
        title="Library Suggestions Queue"
        description="Review and moderate user-submitted contributions"
        icon="📬"
        headerAction={
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'pending' | 'all')}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white"
            >
              <option value="pending">Pending Review</option>
              <option value="all">All Suggestions</option>
            </select>
            <button
              onClick={fetchSuggestions}
              disabled={loading}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Icons.Refresh />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        }
      >
        {error && (
          <div className="bg-red-950/30 border border-red-800 rounded-lg p-4 mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading && suggestions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-zinc-500">Loading suggestions...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-lg mb-2">🎉 All caught up!</p>
            <p className="text-sm">No {filter === 'pending' ? 'pending ' : ''}suggestions to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`border rounded-xl overflow-hidden transition-all ${
                  expandedId === suggestion.id
                    ? 'border-emerald-500/50 bg-zinc-900'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                {/* Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleExpand(suggestion.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <TypeBadge type={suggestion.suggestion_type} />
                        <StatusBadge status={suggestion.status} />
                        {photos[suggestion.id]?.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
                            <Icons.Image />
                            {photos[suggestion.id].length}
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-white truncate">{suggestion.title}</h4>
                      {suggestion.description && (
                        <p className="text-sm text-zinc-400 line-clamp-1 mt-1">
                          {suggestion.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {expandedId === suggestion.id ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                    </div>
                  </div>

                  {/* Meta Row */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                    {suggestion.user_email && (
                      <span className="flex items-center gap-1">
                        <Icons.User />
                        {suggestion.user_email}
                      </span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true })}
                    </span>
                    {(suggestion.species_name || suggestion.strain_name) && (
                      <span className="text-emerald-400">
                        For: {suggestion.species_name || suggestion.strain_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === suggestion.id && (
                  <div className="border-t border-zinc-800 p-4 space-y-4">
                    {/* Description */}
                    {suggestion.description && (
                      <div>
                        <h5 className="text-xs font-medium text-zinc-400 mb-1">Description</h5>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                          {suggestion.description}
                        </p>
                      </div>
                    )}

                    {/* Proposed Changes */}
                    {suggestion.proposed_changes && Object.keys(suggestion.proposed_changes).length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-zinc-400 mb-2">Proposed Changes</h5>
                        <div className="bg-zinc-800/50 rounded-lg p-3 text-sm space-y-1">
                          {Object.entries(suggestion.proposed_changes).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-zinc-500 font-mono">{key}:</span>
                              <span className="text-zinc-300">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Source */}
                    {suggestion.source_url && (
                      <div>
                        <h5 className="text-xs font-medium text-zinc-400 mb-1">Source</h5>
                        <a
                          href={suggestion.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
                        >
                          <Icons.Link />
                          {suggestion.source_url}
                        </a>
                        {suggestion.source_notes && (
                          <p className="text-xs text-zinc-500 mt-1">{suggestion.source_notes}</p>
                        )}
                      </div>
                    )}

                    {/* Photos */}
                    {photos[suggestion.id]?.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-zinc-400 mb-2">
                          Attached Photos ({photos[suggestion.id].length})
                        </h5>
                        <div className="grid grid-cols-4 gap-2">
                          {photos[suggestion.id].map((photo) => (
                            <a
                              key={photo.id}
                              href={getPhotoUrl(photo)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="aspect-square rounded-lg overflow-hidden border border-zinc-700 hover:border-emerald-500/50 transition-colors"
                            >
                              <img
                                src={getPhotoUrl(photo)}
                                alt="Submission photo"
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Previous Admin Notes */}
                    {suggestion.admin_notes && suggestion.status !== 'pending' && (
                      <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3">
                        <h5 className="text-xs font-medium text-amber-400 mb-1">Admin Notes</h5>
                        <p className="text-sm text-amber-200">{suggestion.admin_notes}</p>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {suggestion.rejection_reason && (
                      <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3">
                        <h5 className="text-xs font-medium text-red-400 mb-1">Rejection Reason</h5>
                        <p className="text-sm text-red-200">{suggestion.rejection_reason}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {['pending', 'under_review', 'needs_info'].includes(suggestion.status) && (
                      <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
                        <button
                          onClick={() => openActionModal(suggestion, 'approve')}
                          disabled={processing === suggestion.id}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          <Icons.Check />
                          Approve
                        </button>
                        <button
                          onClick={() => openActionModal(suggestion, 'reject')}
                          disabled={processing === suggestion.id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          <Icons.X />
                          Reject
                        </button>
                        <button
                          onClick={() => openActionModal(suggestion, 'needs_info')}
                          disabled={processing === suggestion.id}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          <Icons.Info />
                          Needs Info
                        </button>
                        {processing === suggestion.id && (
                          <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      {/* Action Modal */}
      {actionModal.open && actionModal.suggestion && actionModal.action && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={closeActionModal}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">
                {actionModal.action === 'approve' && 'Approve Suggestion'}
                {actionModal.action === 'reject' && 'Reject Suggestion'}
                {actionModal.action === 'needs_info' && 'Request More Information'}
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                {actionModal.suggestion.title}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  {actionModal.action === 'approve' && 'Optional message to include in approval email:'}
                  {actionModal.action === 'reject' && 'Reason for rejection (will be sent to user):'}
                  {actionModal.action === 'needs_info' && 'What information is needed:'}
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={
                    actionModal.action === 'approve'
                      ? 'Great contribution! Thank you...'
                      : actionModal.action === 'reject'
                      ? 'Unfortunately, we cannot accept this because...'
                      : 'Please provide more details about...'
                  }
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              {actionModal.suggestion.user_email && (
                <p className="text-xs text-zinc-500">
                  An email will be sent to: {actionModal.suggestion.user_email}
                </p>
              )}
            </div>
            <div className="p-5 border-t border-zinc-800 flex gap-3">
              <button
                onClick={closeActionModal}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={processAction}
                className={`flex-1 py-2 text-white rounded-lg font-medium ${
                  actionModal.action === 'approve'
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : actionModal.action === 'reject'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {actionModal.action === 'approve' && 'Approve'}
                {actionModal.action === 'reject' && 'Reject'}
                {actionModal.action === 'needs_info' && 'Request Info'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionReviewPanel;
