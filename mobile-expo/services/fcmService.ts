import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const getMessaging = () => {
  if (isExpoGo) {
    console.warn('[FCMService] Firebase Cloud Messaging is not supported in Expo Go. Use a development build.');
    return null;
  }
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    if (!messaging) {
      console.warn('[FCMService] @react-native-firebase/messaging not found');
      return null;
    }
    return messaging;
  } catch (error) {
    console.warn('[FCMService] Error loading @react-native-firebase/messaging:', error);
    return null;
  }
};

export const registerForPushNotificationsAsync = async () => {
  try {
    // 1. Request Permissions (Expo-Notifications for UI/Settings)
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('[FCMService] Notification permissions not granted');
      return null;
    }

    // 2. Get Messaging Instance
    const messaging = getMessaging();
    if (!messaging) return null;

    // 3. Firebase Specific Permissions (especially for iOS)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('[FCMService] Firebase messaging permissions not granted');
      return null;
    }

    // 4. Register for remote messages (iOS)
    if (Platform.OS === 'ios') {
      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        await messaging().registerDeviceForRemoteMessages();
      }
    }

    // 5. Get FCM Token
    const token = await messaging().getToken();
    if (!token) {
      console.warn('[FCMService] Failed to obtain FCM token');
    } else {
      console.log('[FCMService] FCM Token obtained:', token);
    }
    return token;
  } catch (error) {
    console.error('[FCMService] Error in registerForPushNotificationsAsync:', error);
    return null;
  }
};

export const getFCMToken = async () => {
  try {
    const messaging = getMessaging();
    if (!messaging) return null;
    return await messaging().getToken();
  } catch (error) {
    console.error('[FCMService] Error getting FCM token:', error);
    return null;
  }
};
