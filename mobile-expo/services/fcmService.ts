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

    // 2. Register for remote messages (iOS)
    const messaging = getMessaging();
    if (!messaging) return null;

    if (Platform.OS === 'ios') {
      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        await messaging().registerDeviceForRemoteMessages();
      }
    }

    // 3. Get FCM Token
    const token = await messaging().getToken();
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
