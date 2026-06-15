/**
 * notification-nav.ts
 *
 * Shared routing for a notification's tap action, used by both the
 * notifications screen and the in-app toast banners. Returns true if it
 * navigated, false for unknown action types (caller may fall back).
 */
type NotifLike = {
  actionType?: string;
  actionPayload?: Record<string, any>;
  relatedId?: string;
};

export function navigateForNotification(n: NotifLike & { type?: string; relatedType?: string }, router: any): boolean {
  const p = n.actionPayload || {};

  if (
    n.actionType === "match_requests" ||
    n.actionType === "adoption_application" ||
    n.relatedType === "adoption_application" ||
    n.type === "adoption"
  ) {
    router.push({ pathname: "/match", params: { openRequests: "true" } });
    return true;
  }

  switch (n.actionType) {
    case "profile": {
      const handle = p.username || p.id || p.userId || n.relatedId;
      if (handle) { router.push(`/u/${handle}`); return true; }
      return false;
    }
    case "like":
    case "comment": {
      const postId = p.postId || n.relatedId;
      if (postId) { router.push(`/post/${postId}`); return true; }
      return false;
    }
    case "reminder":
      router.push("/today");
      return true;
    case "appointment_detail": {
      const appointmentId = p.appointmentId || n.relatedId;
      if (appointmentId) { router.push({ pathname: "/book", params: { id: appointmentId } }); return true; }
      return false;
    }
    case "chat_thread": {
      const chatId = p.conversationId || p.id || n.relatedId;
      router.push(chatId ? { pathname: "/chat", params: { id: chatId } } : "/chat");
      return true;
    }
    case "event_detail": {
      const eventId = p.eventId || p.id || n.relatedId;
      router.push(eventId ? { pathname: "/events", params: { eventId } } : "/events");
      return true;
    }
    case "question_detail":
    case "thread": {
      const questionId = p.questionId || p.id || n.relatedId;
      if (questionId) { router.push(`/thread/${questionId}`); return true; }
      return false;
    }
    case "events_list":
      router.push("/events");
      return true;
    case "discover":
      router.push("/discover");
      return true;
    case "community":
      router.push("/community");
      return true;
    default:
      return false;
  }
}
