// ============================================================================
// COMMENT THREAD
// Discussion thread for suggestions (like Reddit comments)
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import type { SuggestionMessage } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface CommentThreadProps {
  suggestionId: string;
  maxHeight?: string;
  showHeader?: boolean;
}

interface CommentData extends SuggestionMessage {
  userDisplayName?: string;
  userEmail?: string;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Send: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  User: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Chat: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
};

// ============================================================================
// SINGLE COMMENT COMPONENT
// ============================================================================

interface CommentProps {
  comment: CommentData;
  isCurrentUser: boolean;
}

const Comment: React.FC<CommentProps> = ({ comment, isCurrentUser }) => {
  const displayName = comment.userDisplayName || comment.userEmail?.split('@')[0] || 'Anonymous';
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  return (
    <div className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
        ${comment.isAdminMessage
          ? 'bg-amber-500/20 text-amber-400'
          : isCurrentUser
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-zinc-700 text-zinc-400'
        }
      `}>
        {comment.isAdminMessage ? <Icons.Shield /> : <Icons.User />}
      </div>

      {/* Message Bubble */}
      <div className={`flex-1 max-w-[80%] ${isCurrentUser ? 'text-right' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium ${comment.isAdminMessage ? 'text-amber-400' : 'text-zinc-300'}`}>
            {comment.isAdminMessage ? 'MycoLab Team' : displayName}
          </span>
          <span className="text-xs text-zinc-500">{timeAgo}</span>
        </div>
        <div className={`
          inline-block px-4 py-2 rounded-2xl text-sm
          ${isCurrentUser
            ? 'bg-emerald-500/20 text-emerald-100 rounded-tr-sm'
            : comment.isAdminMessage
              ? 'bg-amber-500/10 text-amber-100 border border-amber-500/20 rounded-tl-sm'
              : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
          }
        `}>
          {comment.message}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMMENT THREAD COMPONENT
// ============================================================================

export const CommentThread: React.FC<CommentThreadProps> = ({
  suggestionId,
  maxHeight = '400px',
  showHeader = true,
}) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('suggestion_messages')
        .select(`
          id,
          suggestion_id,
          user_id,
          message,
          is_admin_message,
          is_read,
          created_at
        `)
        .eq('suggestion_id', suggestionId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Fetch user display names
      const userIds = [...new Set(data?.map(m => m.user_id) || [])];
      const { data: profiles } = supabase ? await supabase
        .from('user_profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds) : { data: null };

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const commentsWithNames: CommentData[] = (data || []).map(m => ({
        id: m.id,
        suggestionId: m.suggestion_id,
        userId: m.user_id,
        message: m.message,
        isAdminMessage: m.is_admin_message,
        isRead: m.is_read,
        createdAt: new Date(m.created_at),
        userDisplayName: profileMap.get(m.user_id)?.display_name,
        userEmail: profileMap.get(m.user_id)?.email,
      }));

      setComments(commentsWithNames);

      // Mark messages as read
      if (user && supabase) {
        await supabase
          .from('suggestion_messages')
          .update({ is_read: true })
          .eq('suggestion_id', suggestionId)
          .neq('user_id', user.id)
          .eq('is_read', false);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [suggestionId, user]);

  useEffect(() => {
    fetchComments();

    if (!supabase) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`suggestion_${suggestionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'suggestion_messages',
          filter: `suggestion_id=eq.${suggestionId}`,
        },
        (payload) => {
          // Refresh to get user info
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [suggestionId, fetchComments]);

  // Send message
  const handleSend = async () => {
    if (!user || !supabase || !newMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('suggestion_messages')
        .insert({
          suggestion_id: suggestionId,
          user_id: user.id,
          message: newMessage.trim(),
          is_admin_message: isAdmin,
        });

      if (insertError) throw insertError;

      setNewMessage('');
      // Refresh happens via subscription
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      {showHeader && (
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <Icons.Chat />
          <h4 className="font-medium text-white">Discussion</h4>
          <span className="text-xs text-zinc-500">({comments.length} messages)</span>
        </div>
      )}

      {/* Messages */}
      <div
        className="p-4 space-y-4 overflow-y-auto"
        style={{ maxHeight }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <Icons.Chat />
            <p className="mt-2 text-sm">No comments yet. Start the discussion!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              isCurrentUser={comment.userId === user?.id}
            />
          ))
        )}
      </div>

      {/* Input */}
      {isAuthenticated ? (
        <div className="p-4 border-t border-zinc-800">
          {error && (
            <p className="text-xs text-red-400 mb-2">{error}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icons.Send />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-zinc-800 text-center">
          <p className="text-sm text-zinc-400">
            <a href="/login" className="text-emerald-400 hover:text-emerald-300">Sign in</a> to join the discussion
          </p>
        </div>
      )}
    </div>
  );
};

export default CommentThread;
