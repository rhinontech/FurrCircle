import express from "express";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/", protect, listNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/read-all", protect, markAllNotificationsRead);
router.patch("/:id/read", protect, markNotificationRead);

export default router;
