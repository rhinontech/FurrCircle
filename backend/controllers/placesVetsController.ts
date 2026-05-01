import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.ts";
import db from "../models/index.ts";
import { placesTextSearch } from "../services/googlePlacesService.ts";

const normalizeCity = (value: unknown) => String(value || "").trim();
const normalizeCityKey = (value: unknown) => normalizeCity(value).toLowerCase();

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (value == null || value === "") return undefined;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const toPlaceVetItem = (city: string, place: any) => {
  const placeId = place?.id ?? null;
  const name = place?.displayName?.text ?? null;
  const address = place?.formattedAddress ?? null;
  const location = place?.location ?? null;

  return {
    id: placeId, // for expo-router /vets/[id]
    source: "places" as const,
    city,
    placeId,
    name,
    clinic_name: name,
    address,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    rating: place?.rating ?? null,
    userRatingCount: place?.userRatingCount ?? null,
    googleMapsUri: place?.googleMapsUri ?? null,
    types: Array.isArray(place?.types) ? place.types : [],
  };
};

// @desc    Get cached places-based vets for a city (does not call Google)
// @route   GET /api/places-vets?city=Hyderabad
export const getCachedVetsByCity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const city = normalizeCity(req.query.city);
    if (!city) {
      res.status(400).json({ message: "Missing required query param: city" });
      return;
    }

    const { places_vet_caches: PlacesVetCache } = db as any;
    const record = await PlacesVetCache.findOne({ where: { cityNormalized: normalizeCityKey(city) } });

    res.json({
      city,
      fetchedAt: record?.fetchedAt ?? null,
      items: Array.isArray(record?.items) ? record.items : [],
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Failed to load cached vets" });
  }
};

// @desc    Refresh cached places-based vets for a city (calls Google + persists)
// @route   POST /api/places-vets/refresh
export const refreshVetsByCity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const city = normalizeCity(req.body?.city ?? req.query?.city);
    if (!city) {
      res.status(400).json({ message: "Missing required field: city" });
      return;
    }

    const latitude = toNumberOrUndefined(req.body?.latitude ?? req.body?.lat ?? req.query?.latitude ?? req.query?.lat);
    const longitude = toNumberOrUndefined(req.body?.longitude ?? req.body?.lng ?? req.query?.longitude ?? req.query?.lng);
    const radiusMeters =
      toNumberOrUndefined(req.body?.radiusMeters ?? req.body?.radius ?? req.query?.radiusMeters ?? req.query?.radius) ?? 20000;

    const query = String(req.body?.query || "").trim() || `vets in ${city}`;

    const googleData = await placesTextSearch({
      query,
      includedType: "veterinary_care",
      pageSize: 20,
      ...(latitude != null && longitude != null
        ? {
            locationBias: {
              center: { latitude, longitude },
              radiusMeters,
            },
          }
        : null),
    });

    const places = Array.isArray(googleData?.places) ? googleData.places : [];
    const items = places.map((p: any) => toPlaceVetItem(city, p)).filter((i: any) => i.placeId);

    const { places_vet_caches: PlacesVetCache } = db as any;
    const cityNormalized = normalizeCityKey(city);
    const now = new Date();

    const existing = await PlacesVetCache.findOne({ where: { cityNormalized } });
    if (existing) {
      existing.city = city;
      existing.items = items;
      existing.fetchedAt = now;
      await existing.save();
    } else {
      await PlacesVetCache.create({ city, cityNormalized, items, fetchedAt: now });
    }

    res.json({
      city,
      fetchedAt: now,
      items,
    });
  } catch (error: any) {
    const googleErr = error?.response?.data?.error;
    if (googleErr) {
      res.status(Number(googleErr.code) || 502).json({
        message: "Google Places error",
        google: googleErr,
      });
      return;
    }

    res.status(500).json({ message: error?.message || "Failed to refresh vets" });
  }
};

