// ============================================================================
// Notification Context - Global notification management
// ============================================================================
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================
export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'appointment' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  sender?: string;
  avatar?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  sound: boolean;
  desktop: boolean;
  email: boolean;
  sms: boolean;
  categories: Record<string, boolean>;
  quietHours: { enabled: boolean; start: string; end: string };
}

// ============================================================================
// CONTEXT
// ============================================================================
interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  preferences: {
    sound: true,
    desktop: true,
    email: true,
    sms: false,
    categories: {},
    quietHours: { enabled: false, start: '22:00', end: '07:00' },
  },
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  removeNotification: () => {},
  clearAll: () => {},
  updatePreferences: () => {},
  requestPermission: async () => false,
});

export const useNotifications = () => useContext(NotificationContext);

// ============================================================================
// PROVIDER
// ============================================================================
interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children, maxNotifications = 100,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('notifications');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem('notification-preferences');
      return saved ? JSON.parse(saved) : {
        sound: true, desktop: true, email: true, sms: false,
        categories: {},
        quietHours: { enabled: false, start: '22:00', end: '07:00' },
      };
    } catch {
      return {
        sound: true, desktop: true, email: true, sms: false,
        categories: {},
        quietHours: { enabled: false, start: '22:00', end: '07:00' },
      };
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Persist notifications
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, maxNotifications)));
  }, [notifications, maxNotifications]);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem('notification-preferences', JSON.stringify(preferences));
  }, [preferences]);

  const isQuietHours = useCallback(() => {
    if (!preferences.quietHours.enabled) return false;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const current = hours * 60 + minutes;
    const [startH, startM] = preferences.quietHours.start.split(':').map(Number);
    const [endH, endM] = preferences.quietHours.end.split(':').map(Number);
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;
    if (start <= end) return current >= start && current <= end;
    return current >= start || current <= end;
  }, [preferences.quietHours]);

  const playSound = useCallback(() => {
    if (!preferences.sound || isQuietHours()) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczHj6LxN/Gu1kwFDuH0OjLvV8xDTqFz+3NwWY0DDWAT/DQwGo4Bi97RPXSwG09BSl0OvfNwXBBAiZxNfHHvnFBBiNrMO7EvHRBBxtrK+vDvHlBBhhhIeLEv4BBBxVdGd/Fw4hBBxJXFF4HxpBBBw5PCWAJ');
      }
      audioRef.current.play().catch(() => {});
    } catch {}
  }, [preferences.sound, isQuietHours]);

  const showDesktopNotification = useCallback((title: string, message: string) => {
    if (!preferences.desktop || isQuietHours()) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }, [preferences.desktop, isQuietHours]);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, maxNotifications));
    playSound();
    showDesktopNotification(notification.title, notification.message);
  }, [maxNotifications, playSound, showDesktopNotification]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...prefs }));
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        updatePreferences,
        requestPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
