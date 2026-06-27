import express from "express";
import { getMyPets, createPet, updateListingStatus, getPetById, updatePet, deletePet, discoverPets, getPetMemories, addPetMemory } from "../controllers/petController.ts";
import { getDailyLog, upsertDailyLog } from "../controllers/dailyLogController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/discover", protect, discoverPets);

router.route("/")
  .get(protect, getMyPets)
  .post(protect, createPet);

router.route("/:id")
  .get(protect, getPetById)
  .put(protect, updatePet)
  .delete(protect, deletePet);

router.route("/:id/memories")
  .get(protect, getPetMemories)
  .post(protect, addPetMemory);

router.route("/:id/listing")
  .patch(protect, updateListingStatus);

router.route("/:id/daily-log")
  .get(protect, getDailyLog)
  .post(protect, upsertDailyLog);

export default router;
