import db from "../models/index.ts";

export const createNotification = async (
  userId: string,
  userType: string,
  type: string,
  title: string,
  message: string,
  relatedId?: string,
  relatedType?: string
): Promise<void> => {
  try {
    const { notifications: Notification } = db as any;
    if (!Notification) return;
    await Notification.create({ userId, userType, type, title, message, isRead: false, relatedId, relatedType });
  } catch (err) {
    // notification creation is best-effort — never block the main operation
    console.error("Failed to create notification:", err);
  }
};
