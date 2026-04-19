import db from "../models/index.ts";
import { emitToActor } from "./realtimeService.ts";

type ActorType = "user" | "vet";
type NotificationCategory = "activity" | "campaign";

type NotificationActionPayload = Record<string, unknown> | null;

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

const sendExpoPush = async (messages: Array<Record<string, unknown>>) => {
  if (messages.length === 0) return;

  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.error("Failed to send Expo push notifications:", error);
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
) => {
  const { notification_devices: NotificationDevice } = db as any;

  if (respectMarketingPreference) {
    const enabled = await isMarketingEnabledForActor(actorId, actorType);
    if (!enabled) {
      return;
    }
  }

  const devices = await NotificationDevice.findAll({
    where: {
      actorId,
      actorType,
      pushEnabled: true,
    },
  });

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

  await sendExpoPush(messages);
};

export const dispatchChatAlert = async (
  actorId: string,
  actorType: ActorType,
  title: string,
  message: string,
  conversationId?: string
) => {
  emitToActor(actorId, actorType, "chat:unread", {
    conversationId: conversationId || null,
    at: new Date().toISOString(),
  });

  await sendPushToActor(
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
): Promise<void> => {
  await createRichNotification({
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
}: CreateNotificationInput): Promise<void> => {
  try {
    if (shouldTreatAsChatAlert(type, relatedType)) {
      await dispatchChatAlert(actorId, actorType, title, message, relatedId);
      return;
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

    if (sendPush) {
      await sendPushToActor(
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
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};

export const emitNotificationCountsForActor = emitUnreadCounts;
export const getNotificationUnreadCounts = getUnreadCounts;
