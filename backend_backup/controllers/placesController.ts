import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.ts";
import { placesGetDetails, placesTextSearch, type PlacesTextSearchInput } from "../services/googlePlacesService.ts";

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (value == null || value === "") return undefined;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
};

// @desc    Text search for places (POC)
// @route   POST /api/places/text-search
// @route   GET /api/places/text-search?q=...
export const textSearchPlaces = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = String(req.body?.query ?? req.body?.q ?? req.query?.query ?? req.query?.q ?? "").trim();
    if (!query) {
      res.status(400).json({ message: "Missing required field: query" });
      return;
    }

    const latitude = toNumberOrUndefined(req.body?.latitude ?? req.body?.lat ?? req.query?.latitude ?? req.query?.lat);
    const longitude = toNumberOrUndefined(req.body?.longitude ?? req.body?.lng ?? req.query?.longitude ?? req.query?.lng);
    const radiusMeters = toNumberOrUndefined(req.body?.radiusMeters ?? req.body?.radius ?? req.query?.radiusMeters ?? req.query?.radius);

    const input: PlacesTextSearchInput = {
      query,
      pageSize: toNumberOrUndefined(req.body?.pageSize ?? req.query?.pageSize),
      pageToken: (req.body?.pageToken ?? req.query?.pageToken) ? String(req.body?.pageToken ?? req.query?.pageToken) : undefined,
      languageCode: (req.body?.languageCode ?? req.query?.languageCode) ? String(req.body?.languageCode ?? req.query?.languageCode) : undefined,
      regionCode: (req.body?.regionCode ?? req.query?.regionCode) ? String(req.body?.regionCode ?? req.query?.regionCode) : undefined,
      includedType: (req.body?.includedType ?? req.query?.includedType) ? String(req.body?.includedType ?? req.query?.includedType) : undefined,
    };

    if (latitude != null && longitude != null && radiusMeters != null) {
      input.locationBias = {
        center: { latitude, longitude },
        radiusMeters,
      };
    }

    const data = await placesTextSearch(input);

    const places = Array.isArray(data?.places) ? data.places : [];
    const items = places.map((p: any) => ({
      placeId: p?.id,
      name: p?.displayName?.text ?? null,
      address: p?.formattedAddress ?? null,
      location: p?.location ?? null,
      types: Array.isArray(p?.types) ? p.types : [],
      rating: p?.rating ?? null,
      userRatingCount: p?.userRatingCount ?? null,
      googleMapsUri: p?.googleMapsUri ?? null,
      nationalPhoneNumber: p?.nationalPhoneNumber ?? null,
      internationalPhoneNumber: p?.internationalPhoneNumber ?? null,
    }));

    res.json({
      items,
      nextPageToken: data?.nextPageToken ?? null,
      raw: data,
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

    res.status(500).json({ message: error?.message || "Failed to search places" });
  }
};

// @desc    Get place details (POC)
// @route   GET /api/places/:placeId
export const getPlaceDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const placeId = String(req.params.placeId || "").trim();
    if (!placeId) {
      res.status(400).json({ message: "Missing required param: placeId" });
      return;
    }

    const data = await placesGetDetails(placeId);

    res.json({
      placeId: data?.id ?? placeId,
      name: data?.displayName?.text ?? null,
      address: data?.formattedAddress ?? null,
      location: data?.location ?? null,
      types: Array.isArray(data?.types) ? data.types : [],
      primaryType: data?.primaryType ?? null,
      rating: data?.rating ?? null,
      userRatingCount: data?.userRatingCount ?? null,
      businessStatus: data?.businessStatus ?? null,
      googleMapsUri: data?.googleMapsUri ?? null,
      websiteUri: data?.websiteUri ?? null,
      nationalPhoneNumber: data?.nationalPhoneNumber ?? null,
      internationalPhoneNumber: data?.internationalPhoneNumber ?? null,
      regularOpeningHours: data?.regularOpeningHours ?? null,
      currentOpeningHours: data?.currentOpeningHours ?? null,
      utcOffsetMinutes: data?.utcOffsetMinutes ?? null,
      raw: data,
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

    res.status(500).json({ message: error?.message || "Failed to fetch place details" });
  }
};

