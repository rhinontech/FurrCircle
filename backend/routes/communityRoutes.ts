import express from "express";
import {
  createCommunityPost,
  getCommunityFeed,
  getMyPosts,
  getPostById,
  getPublicPostById,
  toggleLike,
  toggleSave,
  sharePost,
  addComment,
  deleteComment,
  getEvents,
  getEventById,
  getPublicEventById,
  bookEvent,
  shareEvent,
  getChats,
  getChatById,
  sendMessage,
  startChat,
} from "../controllers/communityController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/public/events/:id", getPublicEventById);
router.get("/public/posts/:id", getPublicPostById);

router.get("/events", protect, getEvents);
router.get("/events/:id", protect, getEventById);
router.post("/events/:id/book", protect, bookEvent);
router.post("/events/:id/share", protect, shareEvent);

router.get("/chats", protect, getChats);
router.get("/chats/:id", protect, getChatById);
router.post("/chats/start", protect, startChat);
router.post("/chats/:id/messages", protect, sendMessage);

router.get("/feed", protect, getCommunityFeed);
router.post("/posts", protect, createCommunityPost);
router.get("/posts/me", protect, getMyPosts);
router.get("/posts/:id", protect, getPostById);
router.post("/posts/:id/like", protect, toggleLike);
router.post("/posts/:id/save", protect, toggleSave);
router.post("/posts/:id/share", protect, sharePost);
router.post("/posts/:id/comment", protect, addComment);
router.delete("/comments/:id", protect, deleteComment);

export default router;
