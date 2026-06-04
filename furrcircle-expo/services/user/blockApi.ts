import { PrivateAxios } from '../../helpers/PrivateAxios';

export const blockUser = async (userId: string) => {
    const response = await PrivateAxios.post(`/blocks/${userId}`);
    return response.data;
};

export const unblockUser = async (userId: string) => {
    const response = await PrivateAxios.delete(`/blocks/${userId}`);
    return response.data;
};

export const getBlockedUsers = async () => {
    const response = await PrivateAxios.get('/blocks');
    return response.data;
};

export const blockApi = {
    blockUser,
    unblockUser,
    getBlockedUsers,
};
