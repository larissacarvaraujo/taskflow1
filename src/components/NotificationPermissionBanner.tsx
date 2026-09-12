import React from 'react';
import { BellRing, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { NotificationPermissionStatus } from '../services/systemNotificationService';

interface NotificationPermissionBannerProps {
  permission: NotificationPermissionStatus;
  onRequestPermission: () => void;
  onDismiss: () => void;
  isDismissed: boolean;
}

export const NotificationPermissionBanner: React.FC<
  NotificationPermissionBannerProps
> = () => {
  // Return null to prevent the banner from blocking or covering view options.
  // Desktop notification settings are cleanly accessible via the Notification Drawer (Bell icon).
  return null;
};
