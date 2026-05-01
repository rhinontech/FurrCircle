import express from "express";
import { protect } from "../middleware/authMiddleware.ts";
import { getPlaceDetails, textSearchPlaces } from "../controllers/placesController.ts";

const router = express.Router();

// Keep this protected so the API key can't be abused from the public internet.
// If you need this during onboarding (pre-login), we can switch to a different guard.
router.use(protect);

router.get("/text-search", textSearchPlaces);
router.post("/text-search", textSearchPlaces);

router.get("/:placeId", getPlaceDetails);

export default router;

