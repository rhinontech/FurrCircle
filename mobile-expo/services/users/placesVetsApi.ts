import { api } from "../api";

export type PlacesVetLite = {
  id: string;
  source: "places";
  city: string;
  placeId: string;
  name: string | null;
  clinic_name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUri: string | null;
  types: string[];
};

export type PlacesVetsCacheResponse = {
  city: string;
  fetchedAt: string | null;
  items: PlacesVetLite[];
};

export type PlacesVetsRefreshResponse = {
  city: string;
  fetchedAt: string;
  items: PlacesVetLite[];
};

export type PlacesVetDetails = {
  placeId: string;
  name: string | null;
  address: string | null;
  location: { latitude: number; longitude: number } | null;
  types: string[];
  primaryType: string | null;
  rating: number | null;
  userRatingCount: number | null;
  businessStatus: string | null;
  googleMapsUri: string | null;
  websiteUri: string | null;
  nationalPhoneNumber: string | null;
  internationalPhoneNumber: string | null;
  regularOpeningHours: any | null;
  currentOpeningHours: any | null;
  utcOffsetMinutes: number | null;
};

export const placesVetsApi = {
  getCachedByCity: (city: string) => api.get<PlacesVetsCacheResponse>("/places-vets", { city }),
  refreshByCity: (payload: { city: string; lat?: number; lng?: number; radiusMeters?: number; query?: string }) =>
    api.post<PlacesVetsRefreshResponse>("/places-vets/refresh", payload),
  getPlaceDetails: (placeId: string) => api.get<PlacesVetDetails>(`/places/${encodeURIComponent(placeId)}`),
};

