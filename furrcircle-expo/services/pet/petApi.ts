import { PrivateAxios } from '../../helpers/PrivateAxios';
import { PublicAxios } from '../../helpers/PrivateAxios';

export const getMyPets = async () => {
    try {
        const response = await PrivateAxios.get('/pets');
        return response.data;
    } catch (error: any) {
        console.error("getMyPets Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const createPet = async (payload: any) => {
    try {
        const response = await PrivateAxios.post('/pets', payload);
        return response.data;
    } catch (error: any) {
        console.error("createPet Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const getPetById = async (id: string) => {
    try {
        const response = await PrivateAxios.get(`/pets/${id}`);
        return response.data;
    } catch (error: any) {
        console.error("getPetById Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const discoverPets = async () => {
    try {
        const response = await PublicAxios.get('/pets/discover');
        return response.data;
    } catch (error: any) {
        console.error("discoverPets Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const petApi = {
    getMyPets,
    createPet,
    getPetById,
    discoverPets,
};
