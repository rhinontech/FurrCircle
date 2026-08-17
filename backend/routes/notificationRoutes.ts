import express from "express";
import {
  listNotifications,
  getUnreadCounts,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  registerNotificationDevice,
  deleteNotificationDevice,
  togglePushEnabled,
} from "../controllers/notificationController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/", protect, listNotifications);
router.get("/unread-counts", protect, getUnreadCounts);
router.get("/preferences", protect, getNotificationPreferences);
router.patch("/preferences", protect, updateNotificationPreferences);
router.post("/devices/register", protect, registerNotificationDevice);
router.patch("/devices/push-enabled", protect, togglePushEnabled);
router.delete("/devices/:installationId", protect, deleteNotificationDevice);
router.patch("/read-all", protect, markAllNotificationsRead);
router.patch("/:id/read", protect, markNotificationRead);

export default router;
