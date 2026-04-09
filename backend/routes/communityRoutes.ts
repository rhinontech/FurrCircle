import express from "express";
import {
  createCommunityPost,
  getCommunityFeed,
  getPostById,
  toggleLike,
  addComment,
  deleteComment,
  getEvents,
  getChats,
} from "../controllers/communityController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

// Events
router.get("/events", protect, getEvents);

// Chats (stub — returns empty list until chat feature is built)
router.get("/chats", protect, getChats);

// Feed & posts
router.get("/feed", protect, getCommunityFeed);
router.post("/posts", protect, createCommunityPost);
router.get("/posts/:id", protect, getPostById);

// Social actions on posts
router.post("/posts/:id/like", protect, toggleLike);
router.post("/posts/:id/comment", protect, addComment);

// Comment management
router.delete("/comments/:id", protect, deleteComment);

export default router;
