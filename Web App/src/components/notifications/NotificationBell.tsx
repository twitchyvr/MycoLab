// ============================================================================
// NOTIFICATION BELL COMPONENT
// Header notification bell with dropdown
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../store/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
};

// ============================================================================
// NOTIFICATION TYPE STYLES
// ============================================================================

const typeStyles = {
  success: {
    dot: 'bg-emerald-500',
    icon: 'text-emerald-400',
  },
  error: {
    dot: 'bg-red-500',
    icon: 'text-red-400',
  },
  warning: {
    dot: 'bg-amber-500',
    icon: 'text-amber-400',
  },
  info: {
    dot: 'bg-blue-500',
    icon: 'text-blue-400',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

interface NotificationBellProps {
  onNavigateToSettings?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigateToSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter to only show non-dismissed notifications
  const visibleNotifications = notifications
    .filter(n => !n.dismissedAt)
    .slice(0, 10); // Show max 10 in dropdown

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors relative"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Icons.Bell />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                  title="Mark all as read"
                >
                  <Icons.Check />
                </button>
              )}
              {visibleNotifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                  title="Clear all"
                >
                  <Icons.Trash />
                </button>
              )}
              {onNavigateToSettings && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateToSettings();
                  }}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                  title="Notification settings"
                >
                  <Icons.Settings />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                  <Icons.Bell />
                </div>
                <p className="text-sm text-zinc-400">No notifications</p>
                <p className="text-xs text-zinc-500 mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              visibleNotifications.map((notification) => {
                const styles = typeStyles[notification.type];
                const isUnread = !notification.readAt;

                return (
                  <div
                    key={notification.id}
                    className={`
                      p-3 border-b border-zinc-800 last:border-b-0
                      hover:bg-zinc-800/50 transition-colors cursor-pointer
                      ${isUnread ? 'bg-zinc-800/30' : ''}
                    `}
                    onClick={() => {
                      if (isUnread) markAsRead(notification.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread indicator */}
                      <div className="flex-shrink-0 mt-1.5">
                        {isUnread ? (
                          <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
                        ) : (
                          <div className="w-2 h-2" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isUnread ? 'text-white' : 'text-zinc-300'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-zinc-600">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                          {notification.entityName && (
                            <>
                              <span className="text-zinc-700">|</span>
                              <p className="text-xs text-zinc-500 truncate">
                                {notification.entityName}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Dismiss button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                        className="flex-shrink-0 p-1 text-zinc-600 hover:text-zinc-300 rounded transition-colors"
                        title="Dismiss"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {visibleNotifications.length > 0 && notifications.filter(n => !n.dismissedAt).length > 10 && (
            <div className="p-2 border-t border-zinc-800 text-center">
              <p className="text-xs text-zinc-500">
                Showing 10 of {notifications.filter(n => !n.dismissedAt).length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
