import express from "express";
import { protect } from "../middleware/authMiddleware.ts";
import { getCachedVetsByCity, refreshVetsByCity } from "../controllers/placesVetsController.ts";

const router = express.Router();

router.use(protect);

router.get("/", getCachedVetsByCity);
router.post("/refresh", refreshVetsByCity);

export default router;

