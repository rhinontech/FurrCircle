import express from "express";
import {
  getVetReviews,
  submitVetReview,
  deleteVetReview,
} from "../controllers/vetReviewController.ts";
import { protect, ownerOnly } from "../middleware/authMiddleware.ts";

const router = express.Router({ mergeParams: true }); // mergeParams to access :vetId

router.get("/", getVetReviews); // public — anyone can read reviews
router.post("/", protect, ownerOnly, submitVetReview);
router.delete("/", protect, ownerOnly, deleteVetReview);

export default router;
