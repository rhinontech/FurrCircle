import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

type LocationState = {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  region: string | null;
};

interface LocationContextData {
  location: LocationState;
  isLoading: boolean;
  errorMsg: string | null;
  fetchCurrentLocation: () => Promise<void>;
  setManualLocation: (lat: number, lng: number, address: string, city?: string, region?: string) => void;
  recentLocations: LocationState[];
}

const LocationContext = createContext<LocationContextData>({} as LocationContextData);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    address: null,
    city: null,
    region: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentLocations, setRecentLocations] = useState<LocationState[]>([]);
  const { isLoggedIn, updateProfile } = useAuth();

  const fetchCurrentLocation = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setIsLoading(false);
        return;
      }

      let currentPosition = await Location.getCurrentPositionAsync({});
      const lat = currentPosition.coords.latitude;
      const lng = currentPosition.coords.longitude;

      let geocode = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      let addressStr = 'Unknown Location';
      let cityStr: string | null = null;
      let regionStr: string | null = null;
      if (geocode.length > 0) {
        const place = geocode[0];
        // e.g., "123 Main St, New York"
        addressStr = [place.streetNumber, place.street, place.city]
          .filter(Boolean)
          .join(', ');
        
        if (!addressStr || addressStr.trim() === '') {
            addressStr = place.name || 'Unknown Location';
        }
        cityStr = place.city || null;
        regionStr = place.region || null;
      }

      setLocation({
        latitude: lat,
        longitude: lng,
        address: addressStr,
        city: cityStr,
        region: regionStr,
      });

      // Save to local storage for next time
      AsyncStorage.setItem('last_known_location', JSON.stringify({
        latitude: lat,
        longitude: lng,
        address: addressStr,
        city: cityStr,
        region: regionStr,
      })).catch(() => {});
      
      if (isLoggedIn) {
        updateProfile({
          latitude: lat,
          longitude: lng,
          address: addressStr,
          city: cityStr || undefined,
        }).catch(err => console.error('Failed to sync location with profile:', err));
      }
      
    } catch (error) {
      console.error('Error fetching location:', error);
      setErrorMsg('Failed to fetch location');
    } finally {
      setIsLoading(false);
    }
  };

  const setManualLocation = (lat: number, lng: number, address: string, city?: string, region?: string) => {
    const newLocation = {
      latitude: lat,
      longitude: lng,
      address,
      city: city || null,
      region: region || null,
    };
    setLocation(newLocation);
    AsyncStorage.setItem('last_known_location', JSON.stringify(newLocation)).catch(() => {});

    // Update recent locations
    setRecentLocations(prev => {
      const filtered = prev.filter(loc => loc.address !== address);
      const updated = [newLocation, ...filtered].slice(0, 5);
      AsyncStorage.setItem('recent_locations', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    if (isLoggedIn) {
      updateProfile({
        latitude: lat,
        longitude: lng,
        address,
        city,
      }).catch(err => console.error('Failed to sync manual location with profile:', err));
    }
  };

  useEffect(() => {
    // 1. Try to load last known location immediately for instant UI
    const loadCached = async () => {
      try {
        const [cached, recent] = await Promise.all([
          AsyncStorage.getItem('last_known_location'),
          AsyncStorage.getItem('recent_locations'),
        ]);
        if (cached) {
          setLocation(JSON.parse(cached));
        }
        if (recent) {
          setRecentLocations(JSON.parse(recent));
        }
      } catch (e) {}
      
      // 2. Fetch fresh location in background
      fetchCurrentLocation();
    };

    loadCached();
  }, []);

  return (
    <LocationContext.Provider value={{ location, isLoading, errorMsg, fetchCurrentLocation, setManualLocation, recentLocations }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
