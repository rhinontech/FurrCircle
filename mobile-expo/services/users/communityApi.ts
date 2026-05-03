import { api } from '../api';
import { normalizeConversation, normalizeEvent, normalizePost, normalizeProfile } from '../shared/normalizers';

export type FeedTab = 'for_you' | 'trending' | 'nearby';

export interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  viewCount: number;
  viewedByMe: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface StoryGroup {
  userId: string;
  author: { id: string; name: string; avatar_url: string | null };
  stories: StoryItem[];
}

export interface MyStoryResponse {
  stories: StoryItem[];
  totalViews: number;
}

export interface FeedPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export const userCommunityApi = {
  getCommunityData: async () => {
    const [feedResult, events] = await Promise.all([
      api.get<any>('/community/feed?tab=for_you&page=1&limit=20'),
      api.get<any[]>('/community/events'),
    ]);

    const rawFeed = feedResult?.posts ?? feedResult ?? [];
    return {
      feed: (Array.isArray(rawFeed) ? rawFeed : []).map(normalizePost).filter(Boolean),
      events: (events || []).map(normalizeEvent).filter(Boolean),
    };
  },
  getFeed: async (params: { tab?: FeedTab; page?: number; limit?: number } = {}): Promise<{ posts: any[]; pagination: FeedPagination }> => {
    const { tab = 'for_you', page = 1, limit = 20 } = params;
    const result = await api.get<any>(`/community/feed?tab=${tab}&page=${page}&limit=${limit}`);
    const rawPosts = result?.posts ?? result ?? [];
    return {
      posts: (Array.isArray(rawPosts) ? rawPosts : []).map(normalizePost).filter(Boolean),
      pagination: result?.pagination ?? { page, limit, total: 0, hasMore: false },
    };
  },
  updateInterests: (payload: { petTypeInterests: string[]; topicInterests: string[] }) =>
    api.patch<{ petTypeInterests: string[]; topicInterests: string[] }>('/community/interests', payload),
  getSpotlight: async () => {
    const post = await api.get<any>('/community/spotlight');
    return post ? normalizePost(post) : null;
  },
  getStories: () => api.get<StoryGroup[]>('/community/stories'),
  getMyStory: () => api.get<MyStoryResponse>('/community/stories/me'),
  createStory: (payload: { mediaUrl: string; mediaType: 'image' | 'video' }) =>
    api.post<{ story: any }>('/community/stories', payload),
  viewStory: (id: string) => api.post<{ viewCount: number }>(`/community/stories/${id}/view`),
  getStoryViewers: (id: string) => api.get<{ viewers: { id: string; name: string; avatarUrl: string | null; viewedAt: string }[]; total: number }>(`/community/stories/${id}/viewers`),
  deleteStory: (id: string) => api.delete(`/community/stories/${id}`),
  listFeed: async () => {
    const result = await api.get<any>('/community/feed?tab=for_you&page=1&limit=20');
    const raw = result?.posts ?? result ?? [];
    return (Array.isArray(raw) ? raw : []).map(normalizePost).filter(Boolean);
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
