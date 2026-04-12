import { api } from '../api';
import { normalizeConversation, normalizeEvent, normalizePost, normalizeProfile } from '../shared/normalizers';

export const userCommunityApi = {
  getCommunityData: async () => {
    const [feed, events, chats] = await Promise.all([
      api.get<any[]>('/community/feed'),
      api.get<any[]>('/community/events'),
      api.get<any[]>('/community/chats'),
    ]);

    return {
      feed: (feed || []).map(normalizePost).filter(Boolean),
      events: (events || []).map(normalizeEvent).filter(Boolean),
      chats: (chats || []).map(normalizeConversation).filter(Boolean),
    };
  },
  listEvents: async () => {
    const events = await api.get<any[]>('/community/events');
    return (events || []).map(normalizeEvent).filter(Boolean);
  },
  getEventById: async (id: string) => normalizeEvent(await api.get<any>(`/community/events/${id}`)),
  bookEvent: async (id: string, note?: string) => {
    const result = await api.post<any>(`/community/events/${id}/book`, { note });
    return {
      ...result,
      event: normalizeEvent(result?.event),
    };
  },
  getMyPosts: async () => {
    const posts = await api.get<any[]>('/community/posts/me');
    return (posts || []).map(normalizePost).filter(Boolean);
  },
  createPost: async (payload: Record<string, unknown>) => {
    const result = await api.post<any>('/community/posts', payload);
    return normalizePost(result?.post ?? result);
  },
  getPostById: async (id: string) => normalizePost(await api.get<any>(`/community/posts/${id}`)),
  togglePostLike: (id: string) => api.post<{ liked: boolean }>(`/community/posts/${id}/like`),
  togglePostSave: (id: string) => api.post<{ saved: boolean }>(`/community/posts/${id}/save`),
  sharePost: (id: string) => api.post<{ shareCount: number }>(`/community/posts/${id}/share`),
  addPostComment: async (id: string, text: string) => {
    const result = await api.post<{ comment: any }>(`/community/posts/${id}/comment`, { text });
    return {
      ...result,
      comment: result?.comment ? { ...result.comment, author: normalizeProfile(result.comment.author) } : result?.comment,
    };
  },
  getChatById: async (id: string) => normalizeConversation(await api.get<any>(`/community/chats/${id}`)),
  sendMessage: async (id: string, payload: Record<string, unknown>) => {
    const result = await api.post<any>(`/community/chats/${id}/messages`, payload);
    return {
      ...result,
      conversation: normalizeConversation(result?.conversation),
      message: result?.message ? { ...result.message, sender: normalizeProfile(result.message.sender) } : result?.message,
    };
  },
  startChat: async (payload: Record<string, unknown>) => normalizeConversation(await api.post<any>('/community/chats/start', payload)),
  getChats: async () => {
    const chats = await api.get<any[]>('/community/chats');
    return (chats || []).map(normalizeConversation).filter(Boolean);
  },
};
