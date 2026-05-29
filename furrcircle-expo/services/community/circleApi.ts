import { PrivateAxios } from '../../helpers/PrivateAxios';

export const getAllCircles = async () => {
    try {
        const response = await PrivateAxios.get('/circles');
        return response.data;
    } catch (error: any) {
        console.error('getAllCircles Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const getMyCircles = async () => {
    try {
        const response = await PrivateAxios.get('/circles/me');
        return response.data;
    } catch (error: any) {
        console.error('getMyCircles Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const getTrending = async () => {
    try {
        const response = await PrivateAxios.get('/circles/trending');
        return response.data;
    } catch (error: any) {
        console.error('getTrending Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const getCircleById = async (id: string) => {
    try {
        const response = await PrivateAxios.get(`/circles/${id}`);
        return response.data;
    } catch (error: any) {
        console.error('getCircleById Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const createCircle = async (payload: { name: string; description?: string; category?: string; coverImage?: string }) => {
    try {
        const response = await PrivateAxios.post('/circles', payload);
        return response.data;
    } catch (error: any) {
        console.error('createCircle Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const joinCircle = async (circleId: string) => {
    try {
        const response = await PrivateAxios.post(`/circles/${circleId}/join`);
        return response.data;
    } catch (error: any) {
        console.error('joinCircle Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const leaveCircle = async (circleId: string) => {
    try {
        const response = await PrivateAxios.post(`/circles/${circleId}/leave`);
        return response.data;
    } catch (error: any) {
        console.error('leaveCircle Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const circleApi = {
    getAllCircles,
    getMyCircles,
    getTrending,
    getCircleById,
    createCircle,
    joinCircle,
    leaveCircle,
};
