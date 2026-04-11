import express from "express";
import {
  getPendingPosts, moderatePost, getAllPosts,
  getUnverifiedVets, verifyVet, deleteVet, getAllVets,
  getAllPets, getAllUsers, deleteUser,
  getAdminStats,
  getAdminEvents, createAdminEvent, updateAdminEvent, deleteAdminEvent,
  getAdoptionPets,
} from "../controllers/adminController.ts";
import { protect, adminOnly } from "../middleware/authMiddleware.ts";

const router = express.Router();

// Stats
router.get("/stats", protect, adminOnly, getAdminStats);

// Users
router.get("/users", protect, adminOnly, getAllUsers);
router.delete("/users/:userId", protect, adminOnly, deleteUser);

// Pets
router.get("/pets", protect, adminOnly, getAllPets);

// Adoptions
router.get("/adoptions", protect, adminOnly, getAdoptionPets);

// Vet management
router.get("/vets", protect, adminOnly, getAllVets);
router.get("/vets/pending", protect, adminOnly, getUnverifiedVets);
router.patch("/vets/:vetId/verify", protect, adminOnly, verifyVet);
router.delete("/vets/:vetId", protect, adminOnly, deleteVet);

// Community posts
router.get("/pending-posts", protect, adminOnly, getPendingPosts);
router.get("/posts", protect, adminOnly, getAllPosts);
router.patch("/post-moderation/:postId", protect, adminOnly, moderatePost);

// Events
router.get("/events", protect, adminOnly, getAdminEvents);
router.post("/events", protect, adminOnly, createAdminEvent);
router.patch("/events/:eventId", protect, adminOnly, updateAdminEvent);
router.delete("/events/:eventId", protect, adminOnly, deleteAdminEvent);

export default router;
