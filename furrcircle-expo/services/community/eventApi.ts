import { PrivateAxios } from '../../helpers/PrivateAxios';

export const getEvents = async () => {
    try {
        const response = await PrivateAxios.get('/community/events');
        return response.data;
    } catch (error: any) {
        console.error('getEvents Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const getEventById = async (id: string) => {
    try {
        const response = await PrivateAxios.get(`/community/events/${id}`);
        return response.data;
    } catch (error: any) {
        console.error('getEventById Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const bookEvent = async (id: string, note?: string) => {
    try {
        const response = await PrivateAxios.post(`/community/events/${id}/book`, { note });
        return response.data;
    } catch (error: any) {
        console.error('bookEvent Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const eventApi = {
    getEvents,
    getEventById,
    bookEvent,
};
