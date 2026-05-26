import express from "express";
import {
  submitApplication,
  listMyApplications,
  listReceivedApplications,
  reviewApplication,
  adminListApplications,
} from "../controllers/adoptionController.ts";
import { protect, adminOnly } from "../middleware/authMiddleware.ts";

const router = express.Router();

// User routes
router.post("/apply", protect, submitApplication);
router.get("/my-applications", protect, listMyApplications);
router.get("/received", protect, listReceivedApplications);
router.patch("/:id/review", protect, reviewApplication);

// Admin routes
router.get("/admin", protect, adminOnly, adminListApplications);

export default router;
