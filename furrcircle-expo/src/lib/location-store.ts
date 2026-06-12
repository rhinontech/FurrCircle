import * as Location from 'expo-location';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

type LocationState = {
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  useGPS: boolean;
  updateLocation: (city: string | null, lat: number | null, lng: number | null) => void;
  setUseGPS: (val: boolean) => void;
  fetchLiveLocation: (forcePrompt?: boolean) => Promise<void>;
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      city: null,
      latitude: null,
      longitude: null,
      useGPS: true,

      updateLocation: (city, lat, lng) => set({ city, latitude: lat, longitude: lng }),
      setUseGPS: (useGPS) => set({ useGPS }),

      fetchLiveLocation: async (forcePrompt = false) => {
        try {
          let { status } = await Location.getForegroundPermissionsAsync();
          if (status !== 'granted' && forcePrompt) {
            const requestRes = await Location.requestForegroundPermissionsAsync();
            status = requestRes.status;
          }
          if (status !== 'granted') {
            return;
          }

          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const { latitude, longitude } = location.coords;

          const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
          let city = null;
          if (geocode && geocode.length > 0) {
            // Some regions put city in subregion or region if city is null
            city = geocode[0].city || geocode[0].subregion || geocode[0].region || null;
          }

          set({ city, latitude, longitude, useGPS: true });
        } catch (error) {
          console.error("Failed to fetch live location:", error);
        }
      },
    }),
    {
      name: 'furr:location',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
