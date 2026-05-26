import { PublicAxios } from '../../helpers/PrivateAxios';

export const getUserProfile = async (handle: string) => {
    try {
        const response = await PublicAxios.get(`/users/${handle}`);
        return response.data;
    } catch (error: any) {
        console.error("getUserProfile Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const userApi = {
    getUserProfile,
};
