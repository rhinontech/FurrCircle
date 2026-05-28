import { PrivateAxios } from '../../helpers/PrivateAxios';

export const listVitals = async (petId: string) => {
    const response = await PrivateAxios.get(`/health/vitals/${petId}`);
    return response.data;
};

export const addVital = async (petId: string, payload: Record<string, unknown>) => {
    const response = await PrivateAxios.post(`/health/vitals/${petId}`, payload);
    return response.data;
};

export const listVaccines = async (petId: string) => {
    const response = await PrivateAxios.get(`/health/vaccines/${petId}`);
    return response.data;
};

export const addVaccine = async (petId: string, payload: Record<string, unknown>) => {
    const response = await PrivateAxios.post(`/health/vaccines/${petId}`, payload);
    return response.data;
};

export const generateVaccineCertificate = async (petId: string, vaccineId: string) => {
    const response = await PrivateAxios.post(`/health/vaccines/${petId}/${vaccineId}/certificate`, {});
    return response.data;
};

export const listMedications = async (petId: string) => {
    const response = await PrivateAxios.get(`/health/meds/${petId}`);
    return response.data;
};

export const addMedication = async (petId: string, payload: Record<string, unknown>) => {
    const response = await PrivateAxios.post(`/health/meds/${petId}`, payload);
    return response.data;
};

export const deleteMedication = async (petId: string, medId: string) => {
    const response = await PrivateAxios.delete(`/health/meds/${petId}/${medId}`);
    return response.data;
};

export const listRecords = async (petId: string) => {
    const response = await PrivateAxios.get(`/health/records/${petId}`);
    return response.data;
};

export const addRecord = async (petId: string, payload: Record<string, unknown>) => {
    const response = await PrivateAxios.post(`/health/records/${petId}`, payload);
    return response.data;
};

export const listAllergies = async (petId: string) => {
    const response = await PrivateAxios.get(`/health/allergies/${petId}`);
    return response.data;
};

export const addAllergy = async (petId: string, payload: Record<string, unknown>) => {
    const response = await PrivateAxios.post(`/health/allergies/${petId}`, payload);
    return response.data;
};

export const getRecordsData = async (petId: string) => {
    const [records, allergies, vaccines, meds, vitals] = await Promise.all([
        listRecords(petId),
        listAllergies(petId),
        listVaccines(petId),
        listMedications(petId),
        listVitals(petId),
    ]);
    return {
        records: records || [],
        allergies: allergies || [],
        vaccines: vaccines || [],
        meds: meds || [],
        vitals: vitals || [],
    };
};

export const healthApi = {
    listVitals,
    addVital,
    listVaccines,
    addVaccine,
    generateVaccineCertificate,
    listMedications,
    addMedication,
    deleteMedication,
    listRecords,
    addRecord,
    listAllergies,
    addAllergy,
    getRecordsData,
};
