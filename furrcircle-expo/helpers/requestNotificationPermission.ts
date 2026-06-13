import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Requests Firebase Messaging notification permission PRE-LOGIN.
 *
 * Called on the Login / Signup screen so the device push token is registered
 * BEFORE the user's first OTP is sent. Without this, the first-time user
 * never receives OTP push notifications because the permission isn't granted yet.
 *
 * Returns:
 *  - 'granted'  : permission allowed, FCM token available
 *  - 'denied'   : user explicitly denied (can still receive email/SMS OTP)
 *  - 'skipped'  : Expo Go / web where Firebase isn't available
 */
export type NotificationPermissionResult = 'granted' | 'denied' | 'skipped';

const getMessaging = () => {
  if (Constants.appOwnership === 'expo' || Platform.OS === 'web') return null;
  try {
    return require('@react-native-firebase/messaging').default;
  } catch {
    return null;
  }
};

export const requestNotificationPermissionEarly = async (): Promise<NotificationPermissionResult> => {
  if (Platform.OS === 'web') return 'skipped';

  const messaging = getMessaging();
  if (!messaging) {
    try {
      const Notifications = require('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted' ? 'granted' : 'denied';
    } catch (err) {
      console.warn('[Push] Expo notification permission request failed:', err);
      return 'skipped';
    }
  }

  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled ? 'granted' : 'denied';
  } catch (err) {
    console.warn('[Push] Early permission request failed:', err);
    return 'skipped';
  }
};

