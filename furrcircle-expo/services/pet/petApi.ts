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
        const response = await PrivateAxios.get('/pets/discover');
        return response.data;
    } catch (error: any) {
        console.error("discoverPets Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const updatePet = async (id: string, payload: any) => {
    try {
        const response = await PrivateAxios.put(`/pets/${id}`, payload);
        return response.data;
    } catch (error: any) {
        console.error("updatePet Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const updateListing = async (id: string, payload: any) => {
    try {
        const response = await PrivateAxios.patch(`/pets/${id}/listing`, payload);
        return response.data;
    } catch (error: any) {
        console.error("updateListing Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const getPetMemories = async (id: string) => {
    try {
        const response = await PrivateAxios.get(`/pets/${id}/memories`);
        return response.data;
    } catch (error: any) {
        console.error("getPetMemories Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const addPetMemory = async (id: string, payload: any) => {
    try {
        const response = await PrivateAxios.post(`/pets/${id}/memories`, payload);
        return response.data;
    } catch (error: any) {
        console.error("addPetMemory Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const deletePet = async (id: string) => {
    try {
        const response = await PrivateAxios.delete(`/pets/${id}`);
        return response.data;
    } catch (error: any) {
        console.error("deletePet Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const petApi = {
    getMyPets,
    createPet,
    getPetById,
    discoverPets,
    updatePet,
    updateListing,
    getPetMemories,
    addPetMemory,
    deletePet,
};
