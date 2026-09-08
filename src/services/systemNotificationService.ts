/**
 * Browser-native Notification API service
 * Sends OS-level system alerts even if the application is not the active browser tab.
 */

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported';

const NOTIFIED_CACHE_KEY = 'taskflow_notified_deadlines_v1';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getSystemNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestSystemNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    // Standard promise-based API with fallback for older callback implementations
    let permission: NotificationPermission;
    if (typeof Notification.requestPermission().then === 'function') {
      permission = await Notification.requestPermission();
    } else {
      permission = await new Promise((resolve) => {
        Notification.requestPermission(resolve);
      });
    }
    return permission;
  } catch (error) {
    console.warn('Failed to request notification permission:', error);
    return Notification.permission;
  }
}

// Track what was already alerted in current session to prevent repetitive spam
const notifiedSet = new Set<string>();

// Load from session storage if available
try {
  const cached = sessionStorage.getItem(NOTIFIED_CACHE_KEY);
  if (cached) {
    const list = JSON.parse(cached);
    if (Array.isArray(list)) {
      list.forEach((id) => notifiedSet.add(id));
    }
  }
} catch {
  // Ignore storage errors
}

function saveNotifiedSet() {
  try {
    sessionStorage.setItem(
      NOTIFIED_CACHE_KEY,
      JSON.stringify(Array.from(notifiedSet))
    );
  } catch {
    // Ignore storage errors
  }
}

export interface SystemNotificationOptions {
  title: string;
  body: string;
  tag?: string;
  taskId?: string;
  icon?: string;
  onClick?: () => void;
}

export function sendSystemNotification(options: SystemNotificationOptions): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Default app icon or generic badge
    const icon = options.icon || 'https://api.iconify.design/lucide:alarm-clock.svg?color=%234f46e5';

    const notification = new Notification(options.title, {
      body: options.body,
      icon,
      tag: options.tag || (options.taskId ? `taskflow-task-${options.taskId}` : undefined),
      requireInteraction: false,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch {
        // focus can fail in some iframe environments
      }
      if (options.onClick) {
        options.onClick();
      }
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('Error displaying system notification:', err);
    return false;
  }
}

/**
 * Checks if a specific task deadline has already triggered a system alert today
 */
export function hasBeenNotified(dedupeKey: string): boolean {
  return notifiedSet.has(dedupeKey);
}

/**
 * Marks a deadline as notified to prevent duplicate popup alerts
 */
export function markAsNotified(dedupeKey: string): void {
  notifiedSet.add(dedupeKey);
  saveNotifiedSet();
}

/**
 * Clear notification history (e.g. for testing)
 */
export function resetNotifiedHistory(): void {
  notifiedSet.clear();
  try {
    sessionStorage.removeItem(NOTIFIED_CACHE_KEY);
  } catch {
    // Ignore
  }
}
