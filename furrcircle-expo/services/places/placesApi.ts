import { PrivateAxios } from '../../helpers/PrivateAxios';

export const getVetsByCity = async (city: string, lat?: number | null, lng?: number | null) => {
    try {
        let response = await PrivateAxios.get(`/places-vets?city=${encodeURIComponent(city)}`);
        
        if (!response.data?.items || response.data.items.length === 0) {
            response = await PrivateAxios.post('/places-vets/refresh', {
                city,
                latitude: lat ?? undefined,
                longitude: lng ?? undefined,
            });
        }
        
        return response.data;
    } catch (error: any) {
        console.error("getVetsByCity Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const getPlaceDetails = async (placeId: string) => {
    try {
        const response = await PrivateAxios.get(`/places/${encodeURIComponent(placeId)}`);
        return response.data;
    } catch (error: any) {
        console.error("getPlaceDetails Error:", error?.response?.data || error.message);
        throw error;
    }
};

export const placesApi = {
    getVetsByCity,
    getPlaceDetails,
};
