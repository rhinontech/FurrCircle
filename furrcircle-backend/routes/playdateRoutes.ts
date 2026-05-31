import express from "express";
import { getPlaydateCards, swipePlaydate } from "../controllers/playdateController.ts";
import { protect, userAccountOnly } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/cards", protect, userAccountOnly, getPlaydateCards);
router.post("/swipe", protect, userAccountOnly, swipePlaydate);

export default router;
