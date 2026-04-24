import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const getMessaging = () => {
  if (Constants.appOwnership === 'expo') return null;
  try {
    return require('@react-native-firebase/messaging').default;
  } catch {
    return null;
  }
};
import { Platform } from 'react-native';

type FirebaseMessagingModule = typeof import('@react-native-firebase/messaging');
type FirebaseMessaging = ReturnType<NonNullable<FirebaseMessagingModule['default']>>;

const isExpoGo = Constants.executionEnvironment === 'storeClient';

const getFirebaseMessaging = (): FirebaseMessaging | null => {
  if (isExpoGo || (Platform.OS !== 'ios' && Platform.OS !== 'android')) {
    return null;
  }

  try {
    const module = require('@react-native-firebase/messaging') as FirebaseMessagingModule;
    return typeof module.default === 'function' ? module.default() : null;
  } catch (error) {
    console.warn('Firebase messaging is unavailable in this build.', error);
    return null;
  }
};

export const registerForPushNotificationsAsync = async () => {
  try {
    // 1. Request Permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    const firebaseMessaging = getFirebaseMessaging();
    if (!firebaseMessaging) {
      return null;
    }

    // 2. Register for remote messages (iOS)
    const messaging = getMessaging();
    if (!messaging) return null;

    if (Platform.OS === 'ios') {
      if (!firebaseMessaging.isDeviceRegisteredForRemoteMessages) {
        await firebaseMessaging.registerDeviceForRemoteMessages();
      }
    }

    // 3. Get FCM Token
    const token = await firebaseMessaging.getToken();
    return token;
  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error);
    return null;
  }
};

export const getFCMToken = async () => {
  try {
    const messaging = getMessaging();
    if (!messaging) return null;
    return await messaging().getToken();
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export { getFirebaseMessaging, isExpoGo };
