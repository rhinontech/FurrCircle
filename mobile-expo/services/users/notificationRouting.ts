import type { Router } from "expo-router";
import type { AppNotification } from "./notificationsApi";

type PushActionPayload = {
  actionType?: string | null;
  actionPayload?: Record<string, unknown> | null;
};

const getString = (value: unknown) => (typeof value === "string" && value.trim() ? value : null);

export const navigateFromNotification = (
  router: Router,
  notification: Pick<AppNotification, "actionPayload" | "actionType" | "relatedId">
) => {
  const actionType = notification.actionType || "notifications";
  const payload = notification.actionPayload || {};

  switch (actionType) {
    case "appointment_detail": {
      const appointmentId = getString(payload.appointmentId) || notification.relatedId || null;
      if (appointmentId) router.push(`/appointments/${appointmentId}` as any);
      else router.push("/appointments" as any);
      return;
    }
    case "event_detail": {
      const eventId = getString(payload.eventId) || notification.relatedId || null;
      if (eventId) router.push(`/community/events/${eventId}` as any);
      else router.push("/community/events" as any);
      return;
    }
    case "events_list":
      router.push("/community/events" as any);
      return;
    case "discover":
      router.push("/(tabs)/discover" as any);
      return;
    case "community":
      router.push("/(tabs)/community" as any);
      return;
    case "chat_thread": {
      const conversationId = getString(payload.conversationId) || notification.relatedId || null;
      if (conversationId) router.push(`/community/chat/${conversationId}` as any);
      else router.push("/community/chats" as any);
      return;
    }
    case "notifications":
    default:
      router.push("/notifications" as any);
  }
};
