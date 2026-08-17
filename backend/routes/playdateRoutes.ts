import express from "express";
import { getPlaydateCards, swipePlaydate, getPlaydateMatches } from "../controllers/playdateController.ts";
import { protect, userAccountOnly } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/cards", protect, userAccountOnly, getPlaydateCards);
router.get("/matches", protect, userAccountOnly, getPlaydateMatches);
router.post("/swipe", protect, userAccountOnly, swipePlaydate);

export default router;
