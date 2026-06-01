import { PrivateAxios } from '../../helpers/PrivateAxios';

export const getLostPets = async () => {
    const response = await PrivateAxios.get('/lost-pets');
    return response.data;
};

export const createLostPet = async (payload: any) => {
    const response = await PrivateAxios.post('/lost-pets', payload);
    return response.data;
};

export const updateLostPet = async (id: string, payload: any) => {
    const response = await PrivateAxios.put(`/lost-pets/${id}`, payload);
    return response.data;
};

export const deleteLostPet = async (id: string) => {
    const response = await PrivateAxios.delete(`/lost-pets/${id}`);
    return response.data;
};

export const lostPetApi = {
    getLostPets,
    createLostPet,
    updateLostPet,
    deleteLostPet,
};
