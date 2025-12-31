// ============================================================================
// SUGGESTION REVIEW PANEL
// Admin interface for reviewing and moderating community suggestions
// Enhanced with bulk actions, search, stats, templates, and keyboard shortcuts
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
// REJECTION TEMPLATES
// ============================================================================

const REJECTION_TEMPLATES = [
  {
    id: 'duplicate',
    label: 'Duplicate Entry',
    message: 'This information already exists in our library. Thank you for your contribution!',
  },
  {
    id: 'insufficient_info',
    label: 'Insufficient Information',
    message: 'We need more details to verify this information. Please resubmit with additional sources or documentation.',
  },
  {
    id: 'unverifiable',
    label: 'Cannot Verify',
    message: 'We were unable to verify this information from reliable sources. Please provide scientific references or documentation.',
  },
  {
    id: 'out_of_scope',
    label: 'Out of Scope',
    message: 'This submission falls outside the scope of our mycology library. We focus on cultivation-relevant species and strains.',
  },
  {
    id: 'quality',
    label: 'Quality Standards',
    message: 'This submission does not meet our quality standards. Please review our guidelines and consider resubmitting.',
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate Content',
    message: 'This submission contains content that is not appropriate for our platform.',
  },
];

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
  Search: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  CheckSquare: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Square: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
    </svg>
  ),
  Keyboard: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Template: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
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

  // NEW: Search and type filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // NEW: Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // NEW: Keyboard shortcuts help
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Action modal state
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    suggestion: Suggestion | null;
    action: ReviewAction | null;
    isBulk?: boolean;
  }>({ open: false, suggestion: null, action: null, isBulk: false });
  const [actionNote, setActionNote] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Clear messages after timeout
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle template selection
  useEffect(() => {
    if (selectedTemplate) {
      const template = REJECTION_TEMPLATES.find(t => t.id === selectedTemplate);
      if (template) {
        setActionNote(template.message);
      }
    }
  }, [selectedTemplate]);

  // ============================================================================
  // FILTERED SUGGESTIONS & STATS
  // ============================================================================

  const filteredSuggestions = useMemo(() => {
    let result = suggestions;

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(s => s.suggestion_type === typeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.user_email?.toLowerCase().includes(query) ||
        s.species_name?.toLowerCase().includes(query) ||
        s.strain_name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [suggestions, typeFilter, searchQuery]);

  const stats = useMemo(() => {
    const pending = suggestions.filter(s => ['pending', 'under_review', 'needs_info'].includes(s.status)).length;
    const approved = suggestions.filter(s => s.status === 'approved').length;
    const rejected = suggestions.filter(s => s.status === 'rejected').length;
    const byType = suggestions.reduce((acc, s) => {
      acc[s.suggestion_type] = (acc[s.suggestion_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { pending, approved, rejected, total: suggestions.length, byType };
  }, [suggestions]);

  // Get unique types for filter dropdown
  const uniqueTypes = useMemo(() => {
    const types = new Set(suggestions.map(s => s.suggestion_type));
    return Array.from(types).sort();
  }, [suggestions]);

  // ============================================================================
  // BULK SELECTION HANDLERS
  // ============================================================================

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const actionableIds = filteredSuggestions
      .filter(s => ['pending', 'under_review', 'needs_info'].includes(s.status))
      .map(s => s.id);
    setSelectedIds(new Set(actionableIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const isAllSelected = useMemo(() => {
    const actionable = filteredSuggestions.filter(s => ['pending', 'under_review', 'needs_info'].includes(s.status));
    return actionable.length > 0 && actionable.every(s => selectedIds.has(s.id));
  }, [filteredSuggestions, selectedIds]);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // ? = Show shortcuts help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowShortcuts(prev => !prev);
        return;
      }

      // Escape = Close modal or clear selection
      if (e.key === 'Escape') {
        if (actionModal.open) {
          closeActionModal();
        } else if (showShortcuts) {
          setShowShortcuts(false);
        } else if (selectedIds.size > 0) {
          clearSelection();
        }
        return;
      }

      // r = Refresh
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        fetchSuggestions();
        return;
      }

      // a = Select all (when not in modal)
      if (e.key === 'a' && !e.ctrlKey && !e.metaKey && !actionModal.open) {
        e.preventDefault();
        if (isAllSelected) {
          clearSelection();
        } else {
          selectAll();
        }
        return;
      }

      // If we have selection and expanded item
      if (expandedId && !actionModal.open) {
        const suggestion = suggestions.find(s => s.id === expandedId);
        if (suggestion && ['pending', 'under_review', 'needs_info'].includes(suggestion.status)) {
          // 1 = Approve
          if (e.key === '1') {
            openActionModal(suggestion, 'approve');
            return;
          }
          // 2 = Reject
          if (e.key === '2') {
            openActionModal(suggestion, 'reject');
            return;
          }
          // 3 = Needs Info
          if (e.key === '3') {
            openActionModal(suggestion, 'needs_info');
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedId, suggestions, actionModal.open, selectedIds.size, isAllSelected, showShortcuts]);

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

  // Open action modal (single or bulk)
  const openActionModal = (suggestion: Suggestion | null, action: ReviewAction, isBulk = false) => {
    setActionModal({ open: true, suggestion, action, isBulk });
    setActionNote('');
    setSelectedTemplate('');
  };

  // Close action modal
  const closeActionModal = () => {
    setActionModal({ open: false, suggestion: null, action: null, isBulk: false });
    setActionNote('');
    setSelectedTemplate('');
  };

  // Process the action (single or bulk)
  const processAction = async () => {
    const { suggestion, action, isBulk } = actionModal;
    if (!action || !supabase || !user) return;

    // Handle bulk processing
    if (isBulk && selectedIds.size > 0) {
      await processBulkAction(action);
      return;
    }

    if (!suggestion) return;

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

  // Process bulk action
  const processBulkAction = async (action: ReviewAction) => {
    if (!supabase || !user || selectedIds.size === 0) return;

    setBulkProcessing(true);
    closeActionModal();

    const selectedSuggestions = suggestions.filter(s => selectedIds.has(s.id));
    let successCount = 0;
    let failCount = 0;

    try {
      const now = new Date().toISOString();

      for (const suggestion of selectedSuggestions) {
        try {
          let updateData: Record<string, any> = {
            reviewed_at: now,
            reviewed_by: user.id,
            updated_at: now,
          };

          switch (action) {
            case 'approve':
              updateData.status = 'approved';
              updateData.admin_notes = actionNote || null;
              break;
            case 'reject':
              updateData.status = 'rejected';
              updateData.rejection_reason = actionNote || 'Does not meet guidelines';
              break;
            case 'needs_info':
              updateData.status = 'needs_info';
              updateData.admin_notes = actionNote || 'Please provide more information';
              break;
          }

          const { error: updateError } = await supabase
            .from('library_suggestions')
            .update(updateData)
            .eq('id', suggestion.id);

          if (updateError) throw updateError;

          // Update photos
          if (action === 'approve' || action === 'reject') {
            await supabase
              .from('community_photos')
              .update({
                status: action === 'approve' ? 'approved' : 'rejected',
                moderated_at: now,
                moderated_by: user.id,
              })
              .eq('entity_type', 'suggestion')
              .eq('entity_id', suggestion.id);
          }

          // Send email (fire and forget for bulk)
          if (suggestion.user_email) {
            const entityName = suggestion.species_name || suggestion.strain_name || 'Library Entry';
            try {
              if (action === 'approve') {
                sendContributionApprovedEmail(suggestion.user_email, suggestion.suggestion_type, entityName, suggestion.title, actionNote || undefined);
              } else if (action === 'reject') {
                sendContributionRejectedEmail(suggestion.user_email, suggestion.suggestion_type, entityName, suggestion.title, actionNote || undefined);
              } else if (action === 'needs_info') {
                sendContributionNeedsInfoEmail(suggestion.user_email, suggestion.suggestion_type, entityName, suggestion.title, actionNote || 'Please provide more details');
              }
            } catch (e) {
              // Ignore email errors in bulk mode
            }
          }

          successCount++;
        } catch (err) {
          console.error(`Failed to process suggestion ${suggestion.id}:`, err);
          failCount++;
        }
      }

      // Show result
      if (failCount === 0) {
        setMessage({
          type: 'success',
          text: `Successfully ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'requested info for'} ${successCount} suggestion(s)`,
        });
      } else {
        setMessage({
          type: 'error',
          text: `Processed ${successCount} suggestion(s), ${failCount} failed`,
        });
      }

      // Clear selection and refresh
      clearSelection();
      fetchSuggestions();
    } catch (err: any) {
      console.error('Bulk action failed:', err);
      setMessage({ type: 'error', text: err.message || 'Bulk action failed' });
    } finally {
      setBulkProcessing(false);
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

      {/* Quick Stats Header */}
      {suggestions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-xs text-zinc-400">Pending</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.approved}</div>
            <div className="text-xs text-zinc-400">Approved</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
            <div className="text-xs text-zinc-400">Rejected</div>
          </div>
          <div className="bg-zinc-500/10 border border-zinc-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-zinc-300">{stats.total}</div>
            <div className="text-xs text-zinc-400">Total</div>
          </div>
        </div>
      )}

      <SettingsSection
        title="Library Suggestions Queue"
        description="Review and moderate user-submitted contributions"
        icon="📬"
        headerAction={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShortcuts(true)}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <Icons.Keyboard />
            </button>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'pending' | 'all')}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white"
            >
              <option value="pending">Pending Review</option>
              <option value="all">All Suggestions</option>
            </select>
            <button
              onClick={() => fetchSuggestions()}
              disabled={loading}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Icons.Refresh />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        }
      >
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Icons.Search />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search suggestions..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              style={{ paddingLeft: '2.5rem' }}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <Icons.Search />
            </div>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Bulk Selection Bar */}
        {filteredSuggestions.some(s => ['pending', 'under_review', 'needs_info'].includes(s.status)) && (
          <div className="flex items-center justify-between gap-4 mb-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="flex items-center gap-3">
              <button
                onClick={() => isAllSelected ? clearSelection() : selectAll()}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {isAllSelected ? <Icons.CheckSquare /> : <Icons.Square />}
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </button>
              {selectedIds.size > 0 && (
                <span className="text-sm text-emerald-400 font-medium">
                  {selectedIds.size} selected
                </span>
              )}
            </div>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openActionModal(null, 'approve', true)}
                  disabled={bulkProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Icons.Check />
                  Approve All
                </button>
                <button
                  onClick={() => openActionModal(null, 'reject', true)}
                  disabled={bulkProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Icons.X />
                  Reject All
                </button>
                {bulkProcessing && (
                  <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            )}
          </div>
        )}

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
        ) : filteredSuggestions.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-lg mb-2">🎉 All caught up!</p>
            <p className="text-sm">
              {searchQuery || typeFilter !== 'all'
                ? 'No suggestions match your filters.'
                : `No ${filter === 'pending' ? 'pending ' : ''}suggestions to review.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`border rounded-xl overflow-hidden transition-all ${
                  selectedIds.has(suggestion.id)
                    ? 'border-emerald-500/70 bg-emerald-950/20'
                    : expandedId === suggestion.id
                    ? 'border-emerald-500/50 bg-zinc-900'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                {/* Header */}
                <div className="p-4 cursor-pointer flex items-start gap-3">
                  {/* Checkbox */}
                  {['pending', 'under_review', 'needs_info'].includes(suggestion.status) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(suggestion.id);
                      }}
                      className="mt-1 text-zinc-500 hover:text-emerald-400 transition-colors"
                    >
                      {selectedIds.has(suggestion.id) ? <Icons.CheckSquare /> : <Icons.Square />}
                    </button>
                  )}
                  <div
                    className="flex-1 min-w-0"
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

      {/* Action Modal - Single or Bulk */}
      {actionModal.open && actionModal.action && (actionModal.suggestion || actionModal.isBulk) && (
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
                {actionModal.isBulk ? (
                  <>
                    {actionModal.action === 'approve' && `Approve ${selectedIds.size} Suggestions`}
                    {actionModal.action === 'reject' && `Reject ${selectedIds.size} Suggestions`}
                    {actionModal.action === 'needs_info' && `Request Info for ${selectedIds.size} Suggestions`}
                  </>
                ) : (
                  <>
                    {actionModal.action === 'approve' && 'Approve Suggestion'}
                    {actionModal.action === 'reject' && 'Reject Suggestion'}
                    {actionModal.action === 'needs_info' && 'Request More Information'}
                  </>
                )}
              </h3>
              {actionModal.suggestion && (
                <p className="text-sm text-zinc-400 mt-1">
                  {actionModal.suggestion.title}
                </p>
              )}
              {actionModal.isBulk && (
                <p className="text-sm text-zinc-400 mt-1">
                  This action will be applied to all {selectedIds.size} selected suggestions.
                </p>
              )}
            </div>
            <div className="p-5 space-y-4">
              {/* Rejection Templates */}
              {actionModal.action === 'reject' && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-2 flex items-center gap-2">
                    <Icons.Template />
                    Quick Templates
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {REJECTION_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors ${
                          selectedTemplate === template.id
                            ? 'bg-red-500/20 border-red-500/50 text-red-300'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  {actionModal.action === 'approve' && 'Optional message to include in approval email:'}
                  {actionModal.action === 'reject' && 'Reason for rejection (will be sent to user):'}
                  {actionModal.action === 'needs_info' && 'What information is needed:'}
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => {
                    setActionNote(e.target.value);
                    setSelectedTemplate(''); // Clear template when manually editing
                  }}
                  placeholder={
                    actionModal.action === 'approve'
                      ? 'Great contribution! Thank you...'
                      : actionModal.action === 'reject'
                      ? 'Select a template above or write a custom message...'
                      : 'Please provide more details about...'
                  }
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              {!actionModal.isBulk && actionModal.suggestion?.user_email && (
                <p className="text-xs text-zinc-500">
                  An email will be sent to: {actionModal.suggestion.user_email}
                </p>
              )}
              {actionModal.isBulk && (
                <p className="text-xs text-zinc-500">
                  Emails will be sent to all affected users.
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
                {actionModal.isBulk ? (
                  <>
                    {actionModal.action === 'approve' && `Approve All (${selectedIds.size})`}
                    {actionModal.action === 'reject' && `Reject All (${selectedIds.size})`}
                    {actionModal.action === 'needs_info' && `Request Info (${selectedIds.size})`}
                  </>
                ) : (
                  <>
                    {actionModal.action === 'approve' && 'Approve'}
                    {actionModal.action === 'reject' && 'Reject'}
                    {actionModal.action === 'needs_info' && 'Request Info'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Icons.Keyboard />
                Keyboard Shortcuts
              </h3>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Show/hide shortcuts</span>
                  <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 font-mono">?</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Refresh list</span>
                  <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 font-mono">R</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Select/deselect all</span>
                  <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 font-mono">A</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Close modal / clear selection</span>
                  <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 font-mono">Esc</kbd>
                </div>
                <div className="border-t border-zinc-800 pt-3 mt-3">
                  <p className="text-xs text-zinc-500 mb-2">When a suggestion is expanded:</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-emerald-400">Approve</span>
                      <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 font-mono">1</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-400">Reject</span>
                      <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 font-mono">2</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-amber-400">Needs Info</span>
                      <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 font-mono">3</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-zinc-800">
              <button
                onClick={() => setShowShortcuts(false)}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionReviewPanel;
