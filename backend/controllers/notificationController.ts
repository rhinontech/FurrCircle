import type { Request, Response } from "express";
import { Op } from "sequelize";
import db from "../models/index.ts";
import { emitNotificationCountsForActor, getNotificationUnreadCounts } from "../services/notificationService.ts";

const normalizeCategory = (value: unknown) => {
  const category = String(value || "").trim().toLowerCase();
  return category === "activity" || category === "campaign" ? category : null;
};

const normalizePlatform = (value: unknown) => {
  const platform = String(value || "").trim().toLowerCase();
  return platform === "ios" || platform === "android" ? platform : null;
};

// @desc    List notifications for current user
// @route   GET /api/notifications
export const listNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notifications: Notification } = db as any;
    const userId = (req as any).user?.id;
    const userType = (req as any).userType || "user";
    const category = normalizeCategory(req.query.category);
    const cursor = String(req.query.cursor || "").trim();
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

    const where: Record<string, any> = { userId, userType };
    if (category) where.category = category;
    if (cursor) where.createdAt = { [Op.lt]: new Date(cursor) };

    const rows = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
    });

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unread notification counts by category
// @route   GET /api/notifications/unread-counts
export const getUnreadCounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userType = (req as any).userType || "user";
    res.json(await getNotificationUnreadCounts(userId, userType));
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
    const userType = (req as any).userType || "user";

    const notification = await Notification.findOne({ where: { id: req.params.id, userId, userType } });
    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    notification.isRead = true;
    await notification.save();
    await emitNotificationCountsForActor(userId, userType);
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
    const category = normalizeCategory(req.query.category);

    const where: Record<string, any> = { userId, userType, isRead: false };
    if (category) where.category = category;

    await Notification.update({ isRead: true }, { where });
    await emitNotificationCountsForActor(userId, userType);
    res.json({ message: "Notifications marked as read" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get preferences
// @route   GET /api/notifications/preferences
export const getNotificationPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notification_preferences: NotificationPreference } = db as any;
    const actorId = (req as any).user?.id;
    const actorType = (req as any).userType || "user";
    const pref = await NotificationPreference.findOne({ where: { actorId, actorType } });

    res.json({
      marketingEnabled: pref ? Boolean(pref.marketingEnabled) : true,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update preferences
// @route   PATCH /api/notifications/preferences
export const updateNotificationPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notification_preferences: NotificationPreference } = db as any;
    const actorId = (req as any).user?.id;
    const actorType = (req as any).userType || "user";
    const marketingEnabled = req.body?.marketingEnabled !== false;

    const [pref] = await NotificationPreference.findOrCreate({
      where: { actorId, actorType },
      defaults: { marketingEnabled },
    });

    pref.marketingEnabled = marketingEnabled;
    await pref.save();
    res.json({ marketingEnabled: pref.marketingEnabled });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register or update a device
// @route   POST /api/notifications/devices/register
export const registerNotificationDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notification_devices: NotificationDevice } = db as any;
    const actorId = (req as any).user?.id;
    const actorType = (req as any).userType || "user";
    const installationId = String(req.body?.installationId || "").trim();
    const expoPushToken = String(req.body?.expoPushToken || "").trim() || null;
    const platform = normalizePlatform(req.body?.platform);
    const pushEnabled = req.body?.pushEnabled !== false;

    if (!installationId || !platform) {
      res.status(400).json({ message: "installationId and valid platform are required" });
      return;
    }

    const [device] = await NotificationDevice.findOrCreate({
      where: { installationId },
      defaults: {
        actorId,
        actorType,
        installationId,
        expoPushToken,
        platform,
        pushEnabled,
        lastSeenAt: new Date(),
      },
    });

    device.actorId = actorId;
    device.actorType = actorType;
    device.platform = platform;
    device.expoPushToken = expoPushToken;
    device.pushEnabled = pushEnabled;
    device.lastSeenAt = new Date();
    await device.save();

    res.status(201).json(device);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a device registration
// @route   DELETE /api/notifications/devices/:installationId
export const deleteNotificationDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notification_devices: NotificationDevice } = db as any;
    const actorId = (req as any).user?.id;
    const actorType = (req as any).userType || "user";

    await NotificationDevice.destroy({
      where: {
        installationId: req.params.installationId,
        actorId,
        actorType,
      },
    });

    res.json({ message: "Device removed" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
