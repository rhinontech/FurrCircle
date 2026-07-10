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

          let city: string | null = null;

          // Try Expo's native reverse geocoding first
          try {
            const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (geocode && geocode.length > 0) {
              // Some regions put city in subregion or region if city is null
              city = geocode[0].city || geocode[0].subregion || geocode[0].region || null;
            }
          } catch (e) {
            console.warn("Location.reverseGeocodeAsync failed, trying OSM Nominatim fallback:", e);
          }

          // Fallback to OSM Nominatim API if city is still null
          if (!city) {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                {
                  headers: { 'User-Agent': 'FurrCircleApp/1.0' }
                }
              );
              const data = await response.json();
              if (data && data.address) {
                city = data.address.city || data.address.town || data.address.village || data.address.county || null;
              }
            } catch (osmErr) {
              console.warn("OSM Nominatim fallback reverse geocoding failed:", osmErr);
            }
          }

          // If still no city, use coordinates to avoid blocking onboarding
          if (!city) {
            city = `Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
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
