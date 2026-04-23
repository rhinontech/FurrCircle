import db from "../models/index.ts";
import { emitToActor } from "./realtimeService.ts";

type ActorType = "user" | "vet";
type NotificationCategory = "activity" | "campaign";
type PushStatus = "sent" | "failed" | "skipped";

type NotificationActionPayload = Record<string, unknown> | null;

type PushSendResult = {
  status: PushStatus;
  deliveredCount: number;
  failedCount: number;
  error: string | null;
};

type NotificationDeliveryResult = {
  notificationCreated: boolean;
  push: PushSendResult | null;
};

type CreateNotificationInput = {
  actorId: string;
  actorType: ActorType;
  type: string;
  title: string;
  message: string;
  category?: NotificationCategory;
  relatedId?: string;
  relatedType?: string;
  actionType?: string | null;
  actionPayload?: NotificationActionPayload;
  campaignId?: string | null;
  sendPush?: boolean;
  respectMarketingPreference?: boolean;
};

import { messaging } from "../config/firebase.ts";

const getErrorMessage = (error: unknown, fallback = "Unknown error") => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};

const defaultActionFromRelated = (relatedType?: string, relatedId?: string) => {
  switch (relatedType) {
    case "appointment":
      return { actionType: "appointment_detail", actionPayload: relatedId ? { appointmentId: relatedId } : null };
    case "event":
      return { actionType: relatedId ? "event_detail" : "events_list", actionPayload: relatedId ? { eventId: relatedId } : null };
    case "adoption_application":
      return { actionType: "notifications", actionPayload: null };
    case "vaccine":
      return { actionType: "notifications", actionPayload: null };
    default:
      return { actionType: "notifications", actionPayload: null };
  }
};

const shouldTreatAsChatAlert = (type: string, relatedType?: string) => type === "chat" || relatedType === "chat";

const getUnreadCounts = async (actorId: string, actorType: ActorType) => {
  const { notifications: Notification } = db as any;
  const [activity, campaign] = await Promise.all([
    Notification.count({ where: { userId: actorId, userType: actorType, category: "activity", isRead: false } }),
    Notification.count({ where: { userId: actorId, userType: actorType, category: "campaign", isRead: false } }),
  ]);

  return { activity, campaign, total: activity + campaign };
};

const emitUnreadCounts = async (actorId: string, actorType: ActorType) => {
  emitToActor(actorId, actorType, "notification:counts", await getUnreadCounts(actorId, actorType));
};

const isMarketingEnabledForActor = async (actorId: string, actorType: ActorType) => {
  const { notification_preferences: NotificationPreference } = db as any;
  const pref = await NotificationPreference.findOne({ where: { actorId, actorType } });
  return pref ? Boolean(pref.marketingEnabled) : true;
};

const sendFCMPush = async (messages: Array<any>): Promise<PushSendResult> => {
  if (messages.length === 0) {
    return {
      status: "failed",
      deliveredCount: 0,
      failedCount: 0,
      error: "No FCM tokens registered for the targeted actor",
    };
  }

  try {
    const response = await messaging.sendEach(messages);
    
    let deliveredCount = response.successCount;
    let failedCount = response.failureCount;
    const errors: string[] = [];

    response.responses.forEach((res, idx) => {
      if (!res.success) {
        errors.push(`Token ${idx}: ${res.error?.message || "Unknown FCM error"}`);
      }
    });

    return {
      status: deliveredCount > 0 ? "sent" : "failed",
      deliveredCount,
      failedCount,
      error: errors.length > 0 ? errors.join("; ") : null,
    };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to send FCM notifications");
    console.error("Failed to send FCM notifications:", error);
    return {
      status: "failed",
      deliveredCount: 0,
      failedCount: messages.length,
      error: message,
    };
  }
};

const sendPushToActor = async (
  actorId: string,
  actorType: ActorType,
  title: string,
  message: string,
  actionType: string | null,
  actionPayload: NotificationActionPayload,
  category: NotificationCategory,
  respectMarketingPreference: boolean
): Promise<PushSendResult> => {
  const { notification_devices: NotificationDevice } = db as any;

  if (respectMarketingPreference) {
    const enabled = await isMarketingEnabledForActor(actorId, actorType);
    if (!enabled) {
      return {
        status: "skipped",
        deliveredCount: 0,
        failedCount: 0,
        error: "Recipient has marketing notifications disabled",
      };
    }
  }

  const devices = await NotificationDevice.findAll({
    where: {
      actorId,
      actorType,
      pushEnabled: true,
    },
  });

  if (devices.length === 0) {
    return {
      status: "failed",
      deliveredCount: 0,
      failedCount: 0,
      error: "No enabled devices registered for the targeted actor",
    };
  }

  const messages = devices
    .map((device: any) => String(device.expoPushToken || "").trim())
    .filter(Boolean)
    .map((token: string) => ({
      notification: { title, body: message },
      data: {
        category,
        actionType: actionType || "",
        actionPayload: JSON.stringify(actionPayload || {}),
        title,
        body: message,
      },
      token: token,
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    }));

  if (messages.length === 0) {
    return {
      status: "failed",
      deliveredCount: 0,
      failedCount: devices.length,
      error: "No FCM tokens registered for the targeted actor",
    };
  }

  return sendFCMPush(messages);
};

export const dispatchChatAlert = async (
  actorId: string,
  actorType: ActorType,
  title: string,
  message: string,
  conversationId?: string
): Promise<PushSendResult> => {
  emitToActor(actorId, actorType, "chat:unread", {
    conversationId: conversationId || null,
    at: new Date().toISOString(),
  });

  return sendPushToActor(
    actorId,
    actorType,
    title,
    message,
    "chat_thread",
    conversationId ? { conversationId } : null,
    "activity",
    false
  );
};

export const createNotification = async (
  userId: string,
  userType: string,
  type: string,
  title: string,
  message: string,
  relatedId?: string,
  relatedType?: string
): Promise<NotificationDeliveryResult> => {
  return createRichNotification({
    actorId: userId,
    actorType: (userType === "vet" ? "vet" : "user") as ActorType,
    type,
    title,
    message,
    relatedId,
    relatedType,
  });
};

export const createRichNotification = async ({
  actorId,
  actorType,
  type,
  title,
  message,
  category = "activity",
  relatedId,
  relatedType,
  actionType,
  actionPayload,
  campaignId,
  sendPush = true,
  respectMarketingPreference = category === "campaign",
}: CreateNotificationInput): Promise<NotificationDeliveryResult> => {
  try {
    if (shouldTreatAsChatAlert(type, relatedType)) {
      return {
        notificationCreated: false,
        push: await dispatchChatAlert(actorId, actorType, title, message, relatedId),
      };
    }

    const { notifications: Notification } = db as any;
    const fallbackAction = defaultActionFromRelated(relatedType, relatedId);

    const notification = await Notification.create({
      userId: actorId,
      userType: actorType,
      type,
      category,
      title,
      message,
      isRead: false,
      relatedId,
      relatedType,
      actionType: actionType ?? fallbackAction.actionType,
      actionPayload: actionPayload ?? fallbackAction.actionPayload,
      campaignId: campaignId ?? null,
    });

    emitToActor(actorId, actorType, "notification:new", notification.toJSON());
    await emitUnreadCounts(actorId, actorType);

    let push: PushSendResult | null = null;
    if (sendPush) {
      push = await sendPushToActor(
        actorId,
        actorType,
        title,
        message,
        (actionType ?? fallbackAction.actionType) || null,
        actionPayload ?? fallbackAction.actionPayload,
        category,
        respectMarketingPreference
      );
    }

    return {
      notificationCreated: true,
      push,
    };
  } catch (err) {
    console.error("Failed to create notification:", err);
    return {
      notificationCreated: false,
      push: {
        status: "failed",
        deliveredCount: 0,
        failedCount: 1,
        error: getErrorMessage(err, "Failed to create notification"),
      },
    };
  }
};

export const emitNotificationCountsForActor = emitUnreadCounts;
export const getNotificationUnreadCounts = getUnreadCounts;
