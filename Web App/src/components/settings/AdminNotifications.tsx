// ============================================================================
// ADMIN NOTIFICATIONS - View and manage admin notifications
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';

// Types
interface AdminNotification {
  id: string;
  type: 'user_signup' | 'user_deactivated' | 'data_change' | 'system' | 'warning' | 'error';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  target_user_id: string | null;
  target_user_email: string | null;
  related_table: string | null;
  related_id: string | null;
  metadata: Record<string, any> | null;
  is_read: boolean;
  read_by: string | null;
  read_at: string | null;
  created_at: string;
}

// Icons
const Icons = {
  Bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>,
  CheckAll: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 6L7 17l-5-5"/><path d="M22 10L11 21l-2-2"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Info: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  AlertCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
  Database: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

// Get icon for notification type
const getTypeIcon = (type: AdminNotification['type']) => {
  switch (type) {
    case 'user_signup':
    case 'user_deactivated':
      return <Icons.User />;
    case 'data_change':
      return <Icons.Database />;
    case 'system':
      return <Icons.Settings />;
    case 'warning':
      return <Icons.AlertTriangle />;
    case 'error':
      return <Icons.AlertCircle />;
    default:
      return <Icons.Info />;
  }
};

// Get color classes for severity
const getSeverityClasses = (severity: AdminNotification['severity']) => {
  switch (severity) {
    case 'success':
      return {
        bg: 'bg-emerald-950/50',
        border: 'border-emerald-800',
        text: 'text-emerald-400',
        icon: 'text-emerald-400',
      };
    case 'warning':
      return {
        bg: 'bg-amber-950/50',
        border: 'border-amber-800',
        text: 'text-amber-400',
        icon: 'text-amber-400',
      };
    case 'error':
      return {
        bg: 'bg-red-950/50',
        border: 'border-red-800',
        text: 'text-red-400',
        icon: 'text-red-400',
      };
    default:
      return {
        bg: 'bg-blue-950/50',
        border: 'border-blue-800',
        text: 'text-blue-400',
        icon: 'text-blue-400',
      };
  }
};

// Format relative time
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

interface AdminNotificationsProps {
  isConnected: boolean;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({ isConnected }) => {
  const { isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Clear messages after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch notifications
  const fetchNotifications = async () => {
    console.log('[AdminNotifications] fetchNotifications called', { isConnected, isAdmin });
    if (!isConnected || !isAdmin) {
      console.log('[AdminNotifications] fetchNotifications skipped - not connected or not admin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) {
        console.log('[AdminNotifications] fetchNotifications - no supabase client');
        setLoading(false);
        return;
      }

      console.log('[AdminNotifications] Querying admin_notifications table...');
      let query = supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data, error: fetchError } = await query;
      console.log('[AdminNotifications] Query result:', { dataLength: data?.length, error: fetchError?.message });

      if (fetchError) {
        // Table might not exist yet - common during initial setup
        if (fetchError.message.includes('does not exist') ||
            fetchError.message.includes('relation') ||
            fetchError.code === '42P01') {
          console.log('[AdminNotifications] Table does not exist yet - showing empty state');
          setNotifications([]);
          setLoading(false);
          return;
        }
        // Permission denied - user might not be admin in database
        if (fetchError.message.includes('permission denied') ||
            fetchError.code === '42501') {
          console.log('[AdminNotifications] Permission denied - user may not be admin in database');
          setError('Permission denied. You may not have admin access in the database.');
          setLoading(false);
          return;
        }
        console.error('[AdminNotifications] Fetch error:', fetchError);
        setError(`Failed to fetch notifications: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      setNotifications(data || []);
    } catch (err: any) {
      console.error('[AdminNotifications] Exception:', err);
      setError(`Failed to fetch notifications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filter changes
  useEffect(() => {
    fetchNotifications();
  }, [isConnected, isAdmin, filter]);

  // Mark notification as read
  const markAsRead = async (notification: AdminNotification) => {
    if (notification.is_read) return;

    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from('admin_notifications')
        .update({
          is_read: true,
          read_by: user.id,
          read_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      if (updateError) {
        throw updateError;
      }

      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id
            ? { ...n, is_read: true, read_by: user.id, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (err: any) {
      setError(`Failed to mark as read: ${err.message}`);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error: updateError } = await supabase
        .from('admin_notifications')
        .update({
          is_read: true,
          read_by: user.id,
          read_at: new Date().toISOString(),
        })
        .in('id', unreadIds);

      if (updateError) {
        throw updateError;
      }

      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          is_read: true,
          read_by: user.id,
          read_at: new Date().toISOString(),
        }))
      );
      setSuccess('All notifications marked as read');
    } catch (err: any) {
      setError(`Failed to mark all as read: ${err.message}`);
    }
  };

  // Delete notification
  const deleteNotification = async (notification: AdminNotification) => {
    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) return;

      const { error: deleteError } = await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', notification.id);

      if (deleteError) {
        throw deleteError;
      }

      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setSuccess('Notification deleted');
    } catch (err: any) {
      setError(`Failed to delete: ${err.message}`);
    }
  };

  // Delete all read notifications
  const deleteAllRead = async () => {
    if (!confirm('Delete all read notifications?')) return;

    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) return;

      const readIds = notifications.filter(n => n.is_read).map(n => n.id);
      if (readIds.length === 0) return;

      const { error: deleteError } = await supabase
        .from('admin_notifications')
        .delete()
        .in('id', readIds);

      if (deleteError) {
        throw deleteError;
      }

      setNotifications(prev => prev.filter(n => !n.is_read));
      setSuccess('Read notifications deleted');
    } catch (err: any) {
      setError(`Failed to delete: ${err.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-zinc-500">
        You do not have permission to access this section.
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-amber-400 text-xl"><Icons.Bell /></span>
          <div>
            <p className="text-sm font-medium text-amber-300">Admin Notifications</p>
            <p className="text-sm text-zinc-400 mt-1">
              Receive alerts for important events like new user signups, data changes, and system warnings.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/50 border border-emerald-800 rounded-lg p-4 text-emerald-300">
          {success}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === 'unread'
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <Icons.Refresh />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Icons.CheckAll />
              Mark All Read
            </button>
          )}
          {notifications.some(n => n.is_read) && (
            <button
              onClick={deleteAllRead}
              className="px-3 py-2 bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-red-400 rounded-lg text-sm flex items-center gap-2"
            >
              <Icons.Trash />
              Clear Read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
              Loading notifications...
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div className="text-4xl mb-3 opacity-50"><Icons.Bell /></div>
            <p>No notifications yet</p>
            <p className="text-sm mt-1">You'll see alerts here when important events occur</p>
          </div>
        ) : (
          notifications.map(notification => {
            const colors = getSeverityClasses(notification.severity);
            return (
              <div
                key={notification.id}
                className={`border rounded-xl p-4 transition-all ${
                  notification.is_read
                    ? 'bg-zinc-900/30 border-zinc-800 opacity-75'
                    : `${colors.bg} ${colors.border}`
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`mt-0.5 ${notification.is_read ? 'text-zinc-500' : colors.icon}`}>
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`font-medium ${notification.is_read ? 'text-zinc-400' : 'text-white'}`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mt-1 ${notification.is_read ? 'text-zinc-500' : 'text-zinc-300'}`}>
                          {notification.message}
                        </p>
                      </div>
                      <span className="text-xs text-zinc-500 whitespace-nowrap">
                        {formatRelativeTime(notification.created_at)}
                      </span>
                    </div>

                    {/* Metadata */}
                    {(notification.target_user_email || notification.related_table) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {notification.target_user_email && (
                          <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
                            {notification.target_user_email}
                          </span>
                        )}
                        {notification.related_table && (
                          <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
                            {notification.related_table}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification)}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded text-xs flex items-center gap-1"
                        >
                          <Icons.Check />
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-red-400 rounded text-xs flex items-center gap-1"
                      >
                        <Icons.Trash />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-2"></div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stats */}
      {notifications.length > 0 && (
        <div className="text-sm text-zinc-500 text-center">
          Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          {unreadCount > 0 && ` (${unreadCount} unread)`}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
