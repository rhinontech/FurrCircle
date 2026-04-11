import { api } from '../api';
import { normalizeAllergy, normalizeMedicalRecord, normalizeMedication, normalizeVaccine, normalizeVitals } from '../shared/normalizers';

export const userHealthApi = {
  listVitals: async (petId: string) => normalizeVitals(await api.get<any[]>(`/health/vitals/${petId}`)),
  addVital: async (petId: string, payload: Record<string, unknown>) => {
    const created = await api.post<any>(`/health/vitals/${petId}`, payload);
    return normalizeVitals([created])[0] || created;
  },
  listVaccines: async (petId: string) => {
    const vaccines = await api.get<any[]>(`/health/vaccines/${petId}`);
    return (vaccines || []).map(normalizeVaccine).filter(Boolean);
  },
  addVaccine: async (petId: string, payload: Record<string, unknown>) => normalizeVaccine(await api.post<any>(`/health/vaccines/${petId}`, payload)),
  listMedications: async (petId: string) => {
    const medications = await api.get<any[]>(`/health/meds/${petId}`);
    return (medications || []).map(normalizeMedication).filter(Boolean);
  },
  addMedication: async (petId: string, payload: Record<string, unknown>) => normalizeMedication(await api.post<any>(`/health/meds/${petId}`, payload)),
  listRecords: async (petId: string) => {
    const records = await api.get<any[]>(`/health/records/${petId}`);
    return (records || []).map(normalizeMedicalRecord).filter(Boolean);
  },
  addRecord: async (petId: string, payload: Record<string, unknown>) => normalizeMedicalRecord(await api.post<any>(`/health/records/${petId}`, payload)),
  listAllergies: async (petId: string) => {
    const allergies = await api.get<any[]>(`/health/allergies/${petId}`);
    return (allergies || []).map(normalizeAllergy).filter(Boolean);
  },
  addAllergy: async (petId: string, payload: Record<string, unknown>) => normalizeAllergy(await api.post<any>(`/health/allergies/${petId}`, payload)),
  getRecordsData: async (petId: string) => {
    const [records, allergies] = await Promise.all([
      userHealthApi.listRecords(petId),
      userHealthApi.listAllergies(petId),
    ]);

    return {
      records: records || [],
      allergies: allergies || [],
    };
  },
};
