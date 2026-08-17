import express from "express";
import {
  getLostPets,
  createLostPet,
  updateLostPet,
  deleteLostPet,
} from "../controllers/lostPetController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.route("/")
  .get(protect, getLostPets)
  .post(protect, createLostPet);

router.route("/:id")
  .put(protect, updateLostPet)
  .delete(protect, deleteLostPet);

export default router;
