import express from "express";
import { getPendingPosts, moderatePost, getUnverifiedVets, verifyVet, getAllPets, getAllUsers, getAllVets, getAdminStats } from "../controllers/adminController.ts";
import { protect, adminOnly } from "../middleware/authMiddleware.ts";

const router = express.Router();

// Stats dashboard
router.get("/stats", protect, adminOnly, getAdminStats);

// Users
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/pets", protect, adminOnly, getAllPets);

// Vet management
router.get("/vets", protect, adminOnly, getAllVets);
router.get("/vets/pending", protect, adminOnly, getUnverifiedVets);
router.patch("/vets/:vetId/verify", protect, adminOnly, verifyVet);

// Community moderation
router.get("/pending-posts", protect, adminOnly, getPendingPosts);
router.patch("/post-moderation/:postId", protect, adminOnly, moderatePost);

export default router;
