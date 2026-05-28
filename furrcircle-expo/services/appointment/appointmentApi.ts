import { PrivateAxios } from '../../helpers/PrivateAxios';

export const createAppointment = async (payload: { vetId: string; petId: string; date: string; time: string; reason: string }) => {
    try {
        const response = await PrivateAxios.post('/appointments', payload);
        return response.data;
    } catch (error: any) {
        console.error("createAppointment Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const appointmentApi = {
    createAppointment,
};
