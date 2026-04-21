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

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const getErrorMessage = (error: unknown, fallback = "Unknown error") => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};

const summarizeExpoTicketError = (ticket: Record<string, unknown>) => {
  const details = ticket?.details;
  if (details && typeof details === "object" && typeof (details as { error?: unknown }).error === "string") {
    return String((details as { error: string }).error);
  }

  if (typeof ticket?.message === "string" && ticket.message.trim()) {
    return ticket.message;
  }

  return "Expo push rejected the message";
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

const sendExpoPush = async (messages: Array<Record<string, unknown>>): Promise<PushSendResult> => {
  if (messages.length === 0) {
    return {
      status: "failed",
      deliveredCount: 0,
      failedCount: 0,
      error: "No Expo push tokens registered for the targeted actor",
    };
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const fallback = `Expo push request failed with status ${response.status}`;
      const payloadErrors = payload && typeof payload === "object" && Array.isArray((payload as { errors?: unknown[] }).errors)
        ? (payload as { errors: Array<{ message?: string }> }).errors
        : [];
      const message = typeof payloadErrors[0]?.message === "string" && payloadErrors[0].message
        ? payloadErrors[0].message
        : fallback;

      return {
        status: "failed",
        deliveredCount: 0,
        failedCount: messages.length,
        error: message,
      };
    }

    const tickets = payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data)
      ? (payload as { data: Array<Record<string, unknown>> }).data
      : [];

    if (tickets.length === 0) {
      return {
        status: "failed",
        deliveredCount: 0,
        failedCount: messages.length,
        error: "Expo push returned no ticket data",
      };
    }

    let deliveredCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const ticket of tickets) {
      if (ticket?.status === "ok") {
        deliveredCount += 1;
        continue;
      }

      failedCount += 1;
      errors.push(summarizeExpoTicketError(ticket));
    }

    if (deliveredCount > 0) {
      return {
        status: "sent",
        deliveredCount,
        failedCount,
        error: errors.length > 0 ? errors.join("; ") : null,
      };
    }

    return {
      status: "failed",
      deliveredCount: 0,
      failedCount: failedCount || messages.length,
      error: errors.join("; ") || "Expo push rejected all messages",
    };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to send Expo push notifications");
    console.error("Failed to send Expo push notifications:", error);
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
    .map((to: string) => ({
      to,
      sound: "default",
      title,
      body: message,
      data: {
        category,
        actionType,
        actionPayload,
      },
    }));

  if (messages.length === 0) {
    return {
      status: "failed",
      deliveredCount: 0,
      failedCount: devices.length,
      error: "No Expo push tokens registered for the targeted actor",
    };
  }

  return sendExpoPush(messages);
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
