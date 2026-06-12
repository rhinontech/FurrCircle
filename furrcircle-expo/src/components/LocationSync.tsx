import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../lib/auth-store';
import { useLocationStore } from '../lib/location-store';
import { userApi } from '../../services/user/userApi';

export function LocationSync() {
  const user = useAuthStore((s) => s.user);
  const { useGPS, city, latitude, longitude, fetchLiveLocation } = useLocationStore();
  const appState = useRef(AppState.currentState);

  const syncLocation = async () => {
    if (!user || !useGPS) return;

    try {
      // Fetch live location without forcing permission prompts (silent check)
      await fetchLiveLocation(false);

      // Grab updated state
      const freshStore = useLocationStore.getState();
      if (freshStore.latitude && freshStore.longitude && freshStore.city) {
        // Only update backend if we got valid fresh location info
        await userApi.updateProfile({
          city: freshStore.city,
          latitude: freshStore.latitude,
          longitude: freshStore.longitude,
        });
      }
    } catch (error) {
      console.warn('[LocationSync] Failed to automatically sync location:', error);
    }
  };

  useEffect(() => {
    // Sync on initial mount if authenticated
    if (user && useGPS) {
      syncLocation();
    }
  }, [user?.id, useGPS]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App returned to foreground — update location if enabled
        syncLocation();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [user?.id, useGPS]);

  return null;
}
