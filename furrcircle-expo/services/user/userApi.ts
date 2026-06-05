import { PublicAxios, PrivateAxios } from '../../helpers/PrivateAxios';

export const getUserProfile = async (handle: string) => {
    try {
        const response = await PrivateAxios.get(`/users/${handle}`);
        return response.data;
    } catch (error: any) {
        console.error("getUserProfile Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const followUser = async (id: string) => {
    const response = await PrivateAxios.post(`/follows/${id}`);
    return response.data;
};

export const unfollowUser = async (id: string) => {
    const response = await PrivateAxios.delete(`/follows/${id}`);
    return response.data;
};

export const acceptFollowRequest = async (followerId: string) => {
    const response = await PrivateAxios.patch(`/follows/requests/${followerId}/accept`);
    return response.data;
};

export const rejectFollowRequest = async (followerId: string) => {
    const response = await PrivateAxios.patch(`/follows/requests/${followerId}/reject`);
    return response.data;
};

export const getPendingFollowRequests = async () => {
    const response = await PrivateAxios.get(`/follows/requests`);
    return response.data;
};

export const updateProfile = async (data: any) => {
    const response = await PrivateAxios.patch(`/users/profile`, data);
    return response.data;
};

export const uploadImage = async (uri: string, folder: string = 'profiles') => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    
    const isVideo = ['mp4', 'm4v', 'mov', '3gp', 'avi'].includes(ext);
    const type = isVideo 
        ? `video/${ext === 'mov' ? 'quicktime' : ext}`
        : `image/${ext === 'png' ? 'png' : ext === 'gif' ? 'gif' : 'jpeg'}`;
    
    formData.append('image', {
        uri,
        name: filename,
        type,
    } as any);

    const endpoint = folder === 'stories' ? '/upload/stories' : `/upload/${folder}`;

    const response = await PrivateAxios.post(endpoint, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getFollowers = async (userId: string) => {
    try {
        const response = await PrivateAxios.get(`/follows/${userId}/followers`);
        return response.data;
    } catch (error: any) {
        console.error('getFollowers Error:', error?.response?.data || error.message);
        return [];
    }
};

export const getFollowing = async (userId: string) => {
    try {
        const response = await PrivateAxios.get(`/follows/${userId}/following`);
        return response.data;
    } catch (error: any) {
        console.error('getFollowing Error:', error?.response?.data || error.message);
        return [];
    }
};

export const searchUsers = async (q: string) => {
    try {
        const response = await PrivateAxios.get('/users/search', { params: { q } });
        return response.data;
    } catch (error: any) {
        console.error('searchUsers Error:', error?.response?.data || error.message);
        return [];
    }
};

// Search only among users who follow ME — used in Share To and New Chat
export const searchFollowers = async (q: string) => {
    try {
        const response = await PrivateAxios.get('/users/followers-search', { params: { q } });
        return response.data;
    } catch (error: any) {
        console.error('searchFollowers Error:', error?.response?.data || error.message);
        return [];
    }
};

export const userApi = {
    getUserProfile,
    followUser,
    unfollowUser,
    acceptFollowRequest,
    rejectFollowRequest,
    getPendingFollowRequests,
    updateProfile,
    uploadImage,
    getFollowers,
    getFollowing,
    searchUsers,
    searchFollowers,
};

