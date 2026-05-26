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
} from "../controllers/notificationController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/", protect, listNotifications);
router.get("/unread-counts", protect, getUnreadCounts);
router.get("/preferences", protect, getNotificationPreferences);
router.patch("/preferences", protect, updateNotificationPreferences);
router.post("/devices/register", protect, registerNotificationDevice);
router.delete("/devices/:installationId", protect, deleteNotificationDevice);
router.patch("/read-all", protect, markAllNotificationsRead);
router.patch("/:id/read", protect, markNotificationRead);

export default router;
