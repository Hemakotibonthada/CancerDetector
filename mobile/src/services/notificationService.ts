// ============================================================================
// Mobile Notification Service - Push notifications, local notifications, 
// and in-app notification management
// ============================================================================

import { Platform } from 'react-native';

// ============================================================================
// Types
// ============================================================================

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, any>;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  imageUrl?: string;
  category?: string;
}

export type NotificationType =
  | 'appointment_reminder'
  | 'lab_result'
  | 'medication_reminder'
  | 'screening_due'
  | 'message'
  | 'vital_alert'
  | 'treatment_update'
  | 'billing'
  | 'system'
  | 'emergency'
  | 'clinical_trial'
  | 'health_tip';

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  channels: {
    appointments: boolean;
    labResults: boolean;
    medications: boolean;
    screenings: boolean;
    messages: boolean;
    vitals: boolean;
    billing: boolean;
    system: boolean;
    healthTips: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;
  };
  frequency: 'all' | 'important_only' | 'minimal';
}

// ============================================================================
// Default Preferences
// ============================================================================

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  sound: true,
  vibration: true,
  badge: true,
  channels: {
    appointments: true,
    labResults: true,
    medications: true,
    screenings: true,
    messages: true,
    vitals: true,
    billing: true,
    system: true,
    healthTips: false,
  },
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '07:00',
  },
  frequency: 'all',
};

// ============================================================================
// In-Memory Store (in production, use AsyncStorage + backend)
// ============================================================================

let notifications: Notification[] = [];
let preferences: NotificationPreferences = { ...defaultPreferences };
let listeners: ((notifications: Notification[]) => void)[] = [];
let badgeCount = 0;

// ============================================================================
// Notification Service
// ============================================================================

class NotificationService {
  private pushToken: string | null = null;

  // ---- Registration & Permissions ----

  async requestPermissions(): Promise<boolean> {
    // In a real app, this would use expo-notifications
    // For now, simulate permission grant
    console.log('[NotificationService] Requesting notification permissions');
    return true;
  }

  async registerForPushNotifications(): Promise<string | null> {
    const granted = await this.requestPermissions();
    if (!granted) {
      console.warn('[NotificationService] Permission denied');
      return null;
    }

    // Simulate getting a push token
    this.pushToken = `ExponentPushToken[${Platform.OS}-${Date.now()}]`;
    console.log('[NotificationService] Push token:', this.pushToken);
    return this.pushToken;
  }

  getPushToken(): string | null {
    return this.pushToken;
  }

  // ---- Local Notifications ----

  async scheduleLocalNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<string> {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date().toISOString(),
      read: false,
    };
    notifications.unshift(newNotification);
    badgeCount++;
    this.notifyListeners();
    return id;
  }

  async scheduleMedicationReminder(
    medicationName: string,
    dosage: string,
    scheduledTime: Date
  ): Promise<string> {
    return this.scheduleLocalNotification({
      title: 'Medication Reminder',
      body: `Time to take ${medicationName} (${dosage})`,
      type: 'medication_reminder',
      priority: 'high',
      data: { medicationName, dosage, scheduledTime: scheduledTime.toISOString() },
      category: 'medication',
    });
  }

  async scheduleAppointmentReminder(
    doctorName: string,
    specialty: string,
    appointmentTime: Date,
    minutesBefore: number = 60
  ): Promise<string> {
    const reminderTime = new Date(appointmentTime.getTime() - minutesBefore * 60000);
    return this.scheduleLocalNotification({
      title: 'Appointment Reminder',
      body: `Your appointment with ${doctorName} (${specialty}) is in ${minutesBefore} minutes`,
      type: 'appointment_reminder',
      priority: 'high',
      data: { doctorName, specialty, appointmentTime: appointmentTime.toISOString() },
      category: 'appointment',
    });
  }

  async scheduleScreeningReminder(
    screeningType: string,
    dueDate: Date
  ): Promise<string> {
    return this.scheduleLocalNotification({
      title: 'Cancer Screening Due',
      body: `Your ${screeningType} screening is due on ${dueDate.toLocaleDateString()}. Schedule today!`,
      type: 'screening_due',
      priority: 'normal',
      data: { screeningType, dueDate: dueDate.toISOString() },
      category: 'screening',
    });
  }

  // ---- Notification Management ----

  getNotifications(options?: {
    type?: NotificationType;
    unreadOnly?: boolean;
    limit?: number;
  }): Notification[] {
    let filtered = [...notifications];
    if (options?.type) {
      filtered = filtered.filter(n => n.type === options.type);
    }
    if (options?.unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    return filtered;
  }

  getUnreadCount(): number {
    return notifications.filter(n => !n.read).length;
  }

  getBadgeCount(): number {
    return badgeCount;
  }

  markAsRead(notificationId: string): void {
    const idx = notifications.findIndex(n => n.id === notificationId);
    if (idx !== -1 && !notifications[idx].read) {
      notifications[idx] = { ...notifications[idx], read: true };
      badgeCount = Math.max(0, badgeCount - 1);
      this.notifyListeners();
    }
  }

  markAllAsRead(): void {
    notifications = notifications.map(n => ({ ...n, read: true }));
    badgeCount = 0;
    this.notifyListeners();
  }

  deleteNotification(notificationId: string): void {
    const idx = notifications.findIndex(n => n.id === notificationId);
    if (idx !== -1) {
      if (!notifications[idx].read) {
        badgeCount = Math.max(0, badgeCount - 1);
      }
      notifications = notifications.filter(n => n.id !== notificationId);
      this.notifyListeners();
    }
  }

  clearAll(): void {
    notifications = [];
    badgeCount = 0;
    this.notifyListeners();
  }

  // ---- Preferences ----

  getPreferences(): NotificationPreferences {
    return { ...preferences };
  }

  updatePreferences(updates: Partial<NotificationPreferences>): void {
    preferences = { ...preferences, ...updates };
  }

  isChannelEnabled(channel: keyof NotificationPreferences['channels']): boolean {
    return preferences.enabled && preferences.channels[channel];
  }

  isQuietHours(): boolean {
    if (!preferences.quietHours.enabled) return false;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { start, end } = preferences.quietHours;
    if (start < end) {
      return currentTime >= start && currentTime <= end;
    }
    // Overnight quiet hours (e.g., 22:00 - 07:00)
    return currentTime >= start || currentTime <= end;
  }

  // ---- Listeners ----

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    listeners.forEach(l => l([...notifications]));
  }

  // ---- Notification Categories ----

  getNotificationCategories(): { type: NotificationType; label: string; icon: string; color: string }[] {
    return [
      { type: 'appointment_reminder', label: 'Appointments', icon: '📅', color: '#667eea' },
      { type: 'lab_result', label: 'Lab Results', icon: '🔬', color: '#4caf50' },
      { type: 'medication_reminder', label: 'Medications', icon: '💊', color: '#ff9800' },
      { type: 'screening_due', label: 'Screenings', icon: '🩺', color: '#9c27b0' },
      { type: 'message', label: 'Messages', icon: '💬', color: '#2196f3' },
      { type: 'vital_alert', label: 'Vital Alerts', icon: '❤️', color: '#f44336' },
      { type: 'treatment_update', label: 'Treatment', icon: '💉', color: '#00bcd4' },
      { type: 'billing', label: 'Billing', icon: '💳', color: '#795548' },
      { type: 'system', label: 'System', icon: '⚙️', color: '#607d8b' },
      { type: 'emergency', label: 'Emergency', icon: '🚨', color: '#d32f2f' },
      { type: 'clinical_trial', label: 'Clinical Trials', icon: '🧪', color: '#7b1fa2' },
      { type: 'health_tip', label: 'Health Tips', icon: '💡', color: '#ffc107' },
    ];
  }

  // ---- Generate Sample Notifications ----

  generateSampleNotifications(): void {
    const samples: Omit<Notification, 'id' | 'timestamp' | 'read'>[] = [
      {
        title: 'Lab Results Ready',
        body: 'Your CBC results from January 20 are now available. Tap to view details.',
        type: 'lab_result',
        priority: 'high',
        data: { orderId: 'LAB-001', testName: 'CBC' },
      },
      {
        title: 'Appointment Tomorrow',
        body: 'Reminder: Dr. Sarah Chen, Oncology at 10:00 AM. Memorial Cancer Center, Room 2B.',
        type: 'appointment_reminder',
        priority: 'normal',
        data: { appointmentId: 'APT-001', doctorName: 'Dr. Sarah Chen' },
      },
      {
        title: 'Time for Tamoxifen',
        body: 'Take Tamoxifen 20mg with food. 2 refills remaining.',
        type: 'medication_reminder',
        priority: 'high',
        data: { medicationId: 'MED-001', drugName: 'Tamoxifen' },
      },
      {
        title: 'Mammography Due',
        body: 'Your annual mammography screening is due this month. Schedule your appointment now.',
        type: 'screening_due',
        priority: 'normal',
        data: { screeningType: 'Mammography' },
      },
      {
        title: 'New Message from Dr. Chen',
        body: 'I reviewed your latest scan results. Everything looks encouraging...',
        type: 'message',
        priority: 'normal',
        data: { senderId: 'DOC-001', senderName: 'Dr. Sarah Chen' },
      },
      {
        title: '⚠️ Blood Pressure Elevated',
        body: 'Your latest BP reading (158/95) is above normal range. Consider resting and re-measuring.',
        type: 'vital_alert',
        priority: 'urgent',
        data: { vitalType: 'blood_pressure', value: '158/95' },
      },
    ];

    samples.forEach((sample, idx) => {
      const notification: Notification = {
        ...sample,
        id: `sample-${idx + 1}`,
        timestamp: new Date(Date.now() - idx * 3600000).toISOString(),
        read: idx > 3,
      };
      notifications.push(notification);
    });

    badgeCount = samples.filter((_, idx) => idx <= 3).length;
    this.notifyListeners();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const notificationService = new NotificationService();

export default notificationService;
