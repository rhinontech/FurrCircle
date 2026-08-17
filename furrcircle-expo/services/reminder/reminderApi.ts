import { PrivateAxios } from '../../helpers/PrivateAxios';

export const getMyReminders = async () => {
    const response = await PrivateAxios.get('/reminders');
    return response.data;
};

export const createReminder = async (payload: any) => {
    const response = await PrivateAxios.post('/reminders', payload);
    return response.data;
};

export const updateReminder = async (id: string, payload: any) => {
    const response = await PrivateAxios.put(`/reminders/${id}`, payload);
    return response.data;
};

export const toggleReminder = async (id: string) => {
    const response = await PrivateAxios.patch(`/reminders/${id}/toggle`);
    return response.data;
};

export const deleteReminder = async (id: string) => {
    const response = await PrivateAxios.delete(`/reminders/${id}`);
    return response.data;
};

export const reminderApi = {
    getMyReminders,
    createReminder,
    updateReminder,
    toggleReminder,
    deleteReminder,
};
