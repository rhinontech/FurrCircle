import { PrivateAxios } from '../../helpers/PrivateAxios';

export const getChats = async () => {
    try {
        const response = await PrivateAxios.get('/community/chats');
        return response.data;
    } catch (error: any) {
        console.error('getChats Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const getChatById = async (chatId: string) => {
    try {
        const response = await PrivateAxios.get(`/community/chats/${chatId}`);
        return response.data;
    } catch (error: any) {
        console.error('getChatById Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const sendMessage = async (chatId: string, text: string) => {
    try {
        const response = await PrivateAxios.post(`/community/chats/${chatId}/messages`, { text });
        return response.data;
    } catch (error: any) {
        console.error('sendMessage Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const startChat = async (recipientId: string, message?: string) => {
    try {
        const response = await PrivateAxios.post('/community/chats/start', { recipientId, message });
        return response.data;
    } catch (error: any) {
        console.error('startChat Error:', error?.response?.data || error.message);
        throw error;
    }
};

export const chatApi = {
    getChats,
    getChatById,
    sendMessage,
    startChat,
};
