import express from "express";
import { getBreedCards, swipeBreed } from "../controllers/breedController.ts";
import { protect, userAccountOnly } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/cards", protect, userAccountOnly, getBreedCards);
router.post("/swipe", protect, userAccountOnly, swipeBreed);

export default router;
