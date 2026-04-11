import { api } from "../api";

export interface AdoptionApplication {
  id: string;
  petId: string;
  ownerId: string;
  applicantId: string;
  applicantType: string;
  type: "adoption" | "foster";
  status: "pending" | "approved" | "rejected";
  message?: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  applicantCity?: string;
  ownerNotes?: string;
  createdAt: string;
  pet?: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    avatar_url?: string;
    city?: string;
  };
}

export interface SubmitApplicationPayload {
  petId: string;
  type: "adoption" | "foster";
  message?: string;
  phone?: string;
  city?: string;
}

export const userAdoptionsApi = {
  submit: (payload: SubmitApplicationPayload) =>
    api.post<AdoptionApplication>("/adoptions/apply", payload),

  listMyApplications: () =>
    api.get<AdoptionApplication[]>("/adoptions/my-applications"),

  listReceivedApplications: () =>
    api.get<AdoptionApplication[]>("/adoptions/received"),

  reviewApplication: (id: string, status: "approved" | "rejected", ownerNotes?: string) =>
    api.patch<AdoptionApplication>(`/adoptions/${id}/review`, { status, ownerNotes }),
};
