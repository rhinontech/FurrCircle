import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const FB_GRAPH_VERSION = 'v17.0';
const IG_SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'pages_read_engagement',
  'pages_show_list',
].join(',');

// This must exactly match what's whitelisted in Meta App → Facebook Login → Valid OAuth Redirect URIs
const INSTAGRAM_REDIRECT_URI = 'https://api.furrcircle.com/api/auth/instagram/callback';
const REDIRECT_DEEP_LINK = 'furrcircle://instagram-callback';

export function useInstagramOAuth() {
  const { user, refreshUser } = useAuth();

  const connectInstagram = async (): Promise<boolean> => {
    const appId = process.env.EXPO_PUBLIC_INSTAGRAM_APP_ID;
    const jwtToken = user?.token;

    if (!appId || !jwtToken) {
      Alert.alert('Error', 'Missing configuration. Please try again.');
      return false;
    }

    const oauthUrl =
      `https://www.facebook.com/${FB_GRAPH_VERSION}/dialog/oauth` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(IG_SCOPES)}` +
      `&state=${encodeURIComponent(jwtToken)}` +
      `&response_type=code`;

    const result = await WebBrowser.openAuthSessionAsync(oauthUrl, REDIRECT_DEEP_LINK);

    if (result.type !== 'success') {
      return false;
    }

    // Parse query params from the deep link
    const url = result.url;
    const params = new URLSearchParams(url.split('?')[1] ?? '');
    const success = params.get('success');
    const error = params.get('error');

    if (success === 'true') {
      await refreshUser();
      Alert.alert('Connected!', 'Instagram account synced. Posts will now be shared automatically.');
      return true;
    }

    Alert.alert('Connection Failed', decodeURIComponent(error || 'Could not link Instagram account.'));
    return false;
  };

  return { connectInstagram };
}
