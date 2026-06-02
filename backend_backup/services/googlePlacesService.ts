import axios from "axios";

const PLACES_API_BASE_URL = "https://places.googleapis.com/v1";

function getPlacesApiKey(): string {
  const key =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_DEMO_KEY;

  if (!key) {
    throw new Error("Missing Google Places API key. Set GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY / GOOGLE_MAPS_DEMO_KEY).");
  }

  return key;
}

const TEXT_SEARCH_FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.googleMapsUri,places.nationalPhoneNumber,places.internationalPhoneNumber";

const PLACE_DETAILS_FIELD_MASK =
  "id,displayName,formattedAddress,location,types,primaryType,rating,userRatingCount,googleMapsUri,websiteUri,nationalPhoneNumber,internationalPhoneNumber,businessStatus,regularOpeningHours.weekdayDescriptions,currentOpeningHours.openNow,utcOffsetMinutes";

type LatLng = { latitude: number; longitude: number };

export type PlacesTextSearchInput = {
  query: string;
  pageSize?: number;
  pageToken?: string;
  languageCode?: string;
  regionCode?: string;
  includedType?: string;
  locationBias?: {
    center: LatLng;
    radiusMeters: number;
  };
};

export async function placesTextSearch(input: PlacesTextSearchInput): Promise<any> {
  const apiKey = getPlacesApiKey();

  const pageSize = input.pageSize != null ? Math.max(1, Math.min(20, Math.floor(input.pageSize))) : undefined;
  const requestBody: Record<string, any> = {
    textQuery: input.query,
    ...(input.languageCode ? { languageCode: input.languageCode } : null),
    ...(input.regionCode ? { regionCode: input.regionCode } : null),
    ...(input.includedType ? { includedType: input.includedType } : null),
    ...(pageSize ? { pageSize } : null),
    ...(input.pageToken ? { pageToken: input.pageToken } : null),
  };

  if (input.locationBias?.center && Number.isFinite(input.locationBias.radiusMeters)) {
    requestBody.locationBias = {
      circle: {
        center: input.locationBias.center,
        radius: Math.max(1, Math.min(50000, Math.floor(input.locationBias.radiusMeters))),
      },
    };
  }

  const response = await axios.post(`${PLACES_API_BASE_URL}/places:searchText`, requestBody, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": TEXT_SEARCH_FIELD_MASK,
    },
    timeout: 15000,
  });

  return response.data;
}

export async function placesGetDetails(placeId: string): Promise<any> {
  const apiKey = getPlacesApiKey();

  const response = await axios.get(`${PLACES_API_BASE_URL}/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK,
    },
    timeout: 15000,
  });

  return response.data;
}

