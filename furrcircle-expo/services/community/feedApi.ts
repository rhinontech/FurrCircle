import { PrivateAxios } from '../../helpers/PrivateAxios';

export const getFeed = async (tab: 'for_you' | 'trending' | 'nearby' = 'for_you', page = 1, limit = 20) => {
    try {
        const response = await PrivateAxios.get('/community/feed', { params: { tab, page, limit } });
        return response.data;
    } catch (error: any) {
        console.error('getFeed Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const createPost = async (payload: { content: string; imageUrl?: string; category?: string }) => {
    try {
        const response = await PrivateAxios.post('/community/posts', payload);
        return response.data;
    } catch (error: any) {
        console.error('createPost Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const likePost = async (postId: string) => {
    try {
        const response = await PrivateAxios.post(`/community/posts/${postId}/like`);
        return response.data;
    } catch (error: any) {
        console.error('likePost Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const savePost = async (postId: string) => {
    try {
        const response = await PrivateAxios.post(`/community/posts/${postId}/save`);
        return response.data;
    } catch (error: any) {
        console.error('savePost Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const commentOnPost = async (postId: string, text: string) => {
    try {
        const response = await PrivateAxios.post(`/community/posts/${postId}/comment`, { text });
        return response.data;
    } catch (error: any) {
        console.error('commentOnPost Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const deletePost = async (postId: string) => {
    try {
        const response = await PrivateAxios.delete(`/community/posts/me/${postId}`);
        return response.data;
    } catch (error: any) {
        console.error('deletePost Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const getMyPosts = async () => {
    try {
        const response = await PrivateAxios.get('/community/posts/me');
        return response.data;
    } catch (error: any) {
        console.error('getMyPosts Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const getSavedPosts = async () => {
    try {
        const response = await PrivateAxios.get('/community/posts/saved');
        return response.data;
    } catch (error: any) {
        console.error('getSavedPosts Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const getPostById = async (postId: string) => {
    try {
        const response = await PrivateAxios.get(`/community/posts/${postId}`);
        return response.data;
    } catch (error: any) {
        console.error('getPostById Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const getUserPosts = async (username: string) => {
    try {
        const response = await PrivateAxios.get(`/community/posts/user/${username}`);
        return response.data;
    } catch (error: any) {
        console.error('getUserPosts Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const feedApi = {
    getFeed,
    createPost,
    likePost,
    savePost,
    commentOnPost,
    deletePost,
    getMyPosts,
    getSavedPosts,
    getPostById,
    getUserPosts,
};
