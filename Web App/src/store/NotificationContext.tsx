// ============================================================================
// NOTIFICATION CONTEXT
// Smart notification system for Sporely
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type {
  UserNotification,
  NotificationRule,
  NotificationPreferences,
  NotificationType,
  NotificationCategory,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

interface ToastNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  autoDismissMs?: number;
}

interface NotificationContextType {
  // Notifications state
  notifications: UserNotification[];
  unreadCount: number;

  // Toast state
  toasts: ToastNotification[];

  // Preferences
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;

  // Notification CRUD
  addNotification: (notification: Omit<UserNotification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Toast methods
  showToast: (toast: Omit<ToastNotification, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Convenience methods for common toast types
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
  };

  // Notification rules
  rules: NotificationRule[];
  updateRule: (id: string, updates: Partial<NotificationRule>) => void;
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  cultureExpiring: true,
  stageTransitions: true,
  lowInventory: true,
  harvestReady: true,
  contamination: true,
  lcAge: true,
  slowGrowth: true,
  showToasts: true,
  toastDurationMs: 5000,
  soundEnabled: false,
  pushEnabled: false,
};

const defaultRules: NotificationRule[] = [
  {
    id: 'rule-culture-expiring',
    name: 'Culture Expiring Soon',
    category: 'culture_expiring',
    enabled: true,
    thresholdDays: 7,
    notifyType: 'warning',
    repeatIntervalHours: 24,
    isActive: true,
  },
  {
    id: 'rule-lc-age',
    name: 'LC Getting Old',
    category: 'lc_age',
    enabled: true,
    thresholdDays: 30,
    notifyType: 'warning',
    repeatIntervalHours: 48,
    isActive: true,
  },
  {
    id: 'rule-low-inventory',
    name: 'Low Inventory Alert',
    category: 'low_inventory',
    enabled: true,
    notifyType: 'warning',
    repeatIntervalHours: 24,
    isActive: true,
  },
  {
    id: 'rule-harvest-ready',
    name: 'Harvest Ready',
    category: 'harvest_ready',
    enabled: true,
    notifyType: 'success',
    repeatIntervalHours: 12,
    isActive: true,
  },
  {
    id: 'rule-contamination',
    name: 'Contamination Alert',
    category: 'contamination',
    enabled: true,
    notifyType: 'error',
    repeatIntervalHours: 0,
    isActive: true,
  },
];

// ============================================================================
// CONTEXT
// ============================================================================

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [rules, setRules] = useState<NotificationRule[]>(defaultRules);
  const toastTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('sporely-notifications');
    const savedPreferences = localStorage.getItem('sporely-notification-preferences');
    const savedRules = localStorage.getItem('sporely-notification-rules');

    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed.map((n: UserNotification) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          readAt: n.readAt ? new Date(n.readAt) : undefined,
          dismissedAt: n.dismissedAt ? new Date(n.dismissedAt) : undefined,
        })));
      } catch (e) {
        console.error('Failed to parse saved notifications');
      }
    }

    if (savedPreferences) {
      try {
        setPreferences({ ...defaultPreferences, ...JSON.parse(savedPreferences) });
      } catch (e) {
        console.error('Failed to parse notification preferences');
      }
    }

    if (savedRules) {
      try {
        setRules(JSON.parse(savedRules));
      } catch (e) {
        console.error('Failed to parse notification rules');
      }
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem('sporely-notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('sporely-notification-preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('sporely-notification-rules', JSON.stringify(rules));
  }, [rules]);

  // Cleanup toast timeouts on unmount
  useEffect(() => {
    return () => {
      toastTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.readAt && !n.dismissedAt).length;

  // Generate unique ID
  const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add notification
  const addNotification = useCallback((notification: Omit<UserNotification, 'id' | 'createdAt'>) => {
    if (!preferences.enabled) return;

    const newNotification: UserNotification = {
      ...notification,
      id: generateId(),
      createdAt: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast if enabled
    if (preferences.showToasts && notification.autoDismiss !== false) {
      showToast({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionLabel: notification.actionLabel,
        autoDismissMs: notification.autoDismissMs || preferences.toastDurationMs,
      });
    }
  }, [preferences]);

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, readAt: new Date() } : n
      )
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, readAt: n.readAt || new Date() }))
    );
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, dismissedAt: new Date() } : n
      )
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update preferences
  const updatePreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  }, []);

  // Update rule
  const updateRule = useCallback((id: string, updates: Partial<NotificationRule>) => {
    setRules(prev =>
      prev.map(r =>
        r.id === id ? { ...r, ...updates } : r
      )
    );
  }, []);

  // Show toast
  const showToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = generateId();
    const newToast: ToastNotification = { ...toast, id };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss
    const duration = toast.autoDismissMs || preferences.toastDurationMs;
    if (duration > 0) {
      const timeout = setTimeout(() => {
        dismissToast(id);
      }, duration);
      toastTimeouts.current.set(id, timeout);
    }
  }, [preferences.toastDurationMs]);

  // Dismiss toast
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timeout = toastTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.current.delete(id);
    }
  }, []);

  // Convenience toast methods
  const toast = {
    success: (title: string, message?: string) => showToast({ type: 'success', title, message: message || '' }),
    error: (title: string, message?: string) => showToast({ type: 'error', title, message: message || '' }),
    warning: (title: string, message?: string) => showToast({ type: 'warning', title, message: message || '' }),
    info: (title: string, message?: string) => showToast({ type: 'info', title, message: message || '' }),
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    toasts,
    preferences,
    updatePreferences,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
    showToast,
    dismissToast,
    toast,
    rules,
    updateRule,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
