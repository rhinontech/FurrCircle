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
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('image', {
        uri,
        name: filename,
        type,
    } as any);

    const response = await PrivateAxios.post(`/upload/${folder}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
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
};
