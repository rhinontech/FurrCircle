import express from "express";
import { getBreedCards, swipeBreed, getBreedMatches } from "../controllers/breedController.ts";
import { protect, userAccountOnly } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/cards", protect, userAccountOnly, getBreedCards);
router.get("/matches", protect, userAccountOnly, getBreedMatches);
router.post("/swipe", protect, userAccountOnly, swipeBreed);

export default router;
