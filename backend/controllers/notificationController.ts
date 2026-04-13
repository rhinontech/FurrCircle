import type { Request, Response } from "express";
import db from "../models/index.ts";

// @desc    List notifications for current user
// @route   GET /api/notifications
export const listNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notifications: Notification } = db as any;
    const userId = (req as any).user?.id;
    const userType = (req as any).userType || "user";

    const rows = await Notification.findAll({
      where: { userId, userType },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notifications: Notification } = db as any;
    const userId = (req as any).user?.id;
    const userType = (req as any).userType || "user";

    const count = await Notification.count({ where: { userId, userType, isRead: false } });
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notifications: Notification } = db as any;
    const userId = (req as any).user?.id;

    const notification = await Notification.findOne({ where: { id: req.params.id, userId } });
    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
export const markAllNotificationsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notifications: Notification } = db as any;
    const userId = (req as any).user?.id;
    const userType = (req as any).userType || "user";

    await Notification.update({ isRead: true }, { where: { userId, userType, isRead: false } });
    res.json({ message: "All notifications marked as read" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
