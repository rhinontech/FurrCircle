import type { ExpoConfig } from 'expo/config';
import { existsSync } from 'fs';
import path from 'path';

const root = __dirname;
const androidGoogleServicesFile = path.join(root, 'google-services.json');
const iosGoogleServicesFile = path.join(root, 'GoogleService-Info.plist');

const config: ExpoConfig = {
  name: 'FurrCircle',
  slug: 'furrcircle',
  scheme: 'furrcircle',
  version: '1.0.1',
  orientation: 'portrait',
  icon: './assets/furrcircle_main_light_logo.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-furrcircle-rhinon.png',
    resizeMode: 'cover',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.furrcircle.app',
    buildNumber: '2',
    ...(existsSync(iosGoogleServicesFile) ? { googleServicesFile: './GoogleService-Info.plist' } : {}),
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.furrcircle.app',
    versionCode: 2,
    ...(existsSync(androidGoogleServicesFile) ? { googleServicesFile: './google-services.json' } : {}),
    permissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    apiUrl: 'https://api.furrcircle.com',
    router: {},
    eas: {
      projectId: '1af6e06b-38e1-453f-bd8a-52fddbf93df4',
    },
  },
  plugins: [
    'expo-font',
    'expo-router',
    'expo-web-browser',
    'expo-notifications',
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#2563EB',
        defaultChannel: 'default',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow FurrCircle to access your photos so you can upload a profile picture of your pet.',
        cameraPermission: 'Allow FurrCircle to access your camera so you can take a profile picture of your pet or scan medical documents.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Allow FurrCircle to access your location to auto-fill your city and help you find nearby vets.',
      },
    ],
    '@react-native-community/datetimepicker',
  ],
  owner: 'furrcircle',
};

export default config;
