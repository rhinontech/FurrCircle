import { PrivateAxios } from '../../helpers/PrivateAxios';

export interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string | null;
  viewCount: number;
  viewedByMe: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface StoryGroup {
  userId: string;
  username?: string; // mapping field
  avatar?: any; // mapping field
  author: { id: string; name: string; avatar_url: string | null } | null;
  stories: StoryItem[];
}

export interface MyStoryResponse {
  stories: StoryItem[];
  totalViews: number;
}

export const getStories = async (): Promise<StoryGroup[]> => {
  try {
    const response = await PrivateAxios.get('/community/stories');
    return response.data;
  } catch (error: any) {
    console.error('getStories Error:', error?.response?.data || error.message);
    throw error;
  }
};

export const getMyStory = async (): Promise<MyStoryResponse> => {
  try {
    const response = await PrivateAxios.get('/community/stories/me');
    return response.data;
  } catch (error: any) {
    console.error('getMyStory Error:', error?.response?.data || error.message);
    throw error;
  }
};

export const createStory = async (payload: { mediaUrl: string; mediaType: 'image' | 'video'; caption?: string }) => {
  try {
    const response = await PrivateAxios.post('/community/stories', payload);
    return response.data;
  } catch (error: any) {
    console.error('createStory Error:', error?.response?.data || error.message);
    throw error;
  }
};

export const viewStory = async (storyId: string) => {
  try {
    const response = await PrivateAxios.post(`/community/stories/${storyId}/view`);
    return response.data;
  } catch (error: any) {
    console.error('viewStory Error:', error?.response?.data || error.message);
    throw error;
  }
};

export const getStoryViewers = async (storyId: string) => {
  try {
    const response = await PrivateAxios.get(`/community/stories/${storyId}/viewers`);
    return response.data;
  } catch (error: any) {
    console.error('getStoryViewers Error:', error?.response?.data || error.message);
    throw error;
  }
};

export const deleteStory = async (storyId: string) => {
  try {
    const response = await PrivateAxios.delete(`/community/stories/${storyId}`);
    return response.data;
  } catch (error: any) {
    console.error('deleteStory Error:', error?.response?.data || error.message);
    throw error;
  }
};

export const storyApi = {
  getStories,
  getMyStory,
  createStory,
  viewStory,
  getStoryViewers,
  deleteStory,
};
