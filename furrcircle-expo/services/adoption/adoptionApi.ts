import { PrivateAxios } from '../../helpers/PrivateAxios';

export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type RequestType = 'adoption' | 'foster';

export interface AdoptionRequest {
  id: string;
  petId: string;
  ownerId: string;
  applicantId: string;
  type: RequestType;
  status: RequestStatus;
  message?: string;
  applicantName?: string;
  applicantCity?: string;
  ownerNotes?: string;
  conversationId?: string;
  createdAt: string;
  pet?: {
    id: string;
    name: string;
    species?: string;
    breed?: string;
    avatar_url?: string;
    city?: string;
    owner?: { id: string; name: string; avatar_url?: string };
  };
  applicant?: {
    id: string;
    name: string;
    avatar_url?: string;
    city?: string;
  };
}

export const getMyApplications = async (): Promise<AdoptionRequest[]> => {
  const res = await PrivateAxios.get('/adoptions/my-applications');
  return res.data;
};

export const getReceivedApplications = async (): Promise<AdoptionRequest[]> => {
  const res = await PrivateAxios.get('/adoptions/received');
  return res.data;
};

export const reviewApplication = async (
  id: string,
  status: 'approved' | 'rejected',
  ownerNotes?: string
): Promise<AdoptionRequest> => {
  const res = await PrivateAxios.patch(`/adoptions/${id}/review`, { status, ownerNotes });
  return res.data;
};

export const submitApplication = async (
  petId: string,
  type: RequestType,
  message?: string
): Promise<AdoptionRequest> => {
  const res = await PrivateAxios.post('/adoptions/apply', { petId, type, message });
  return res.data;
};

export const adoptionApi = {
  getMyApplications,
  getReceivedApplications,
  reviewApplication,
  submitApplication,
};
