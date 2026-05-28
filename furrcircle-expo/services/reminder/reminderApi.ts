import { PrivateAxios } from '../../helpers/PrivateAxios';

export const getMyReminders = async () => {
    try {
        const response = await PrivateAxios.get('/reminders');
        return response.data;
    } catch (error: any) {
        console.error("getMyReminders Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const createReminder = async (payload: any) => {
    try {
        const response = await PrivateAxios.post('/reminders', payload);
        return response.data;
    } catch (error: any) {
        console.error("createReminder Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const reminderApi = {
    getMyReminders,
    createReminder,
};
