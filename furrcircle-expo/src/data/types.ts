import type { Ionicons } from "@expo/vector-icons";

export type Role = "owner" | "vet" | "shelter";
export type Species = "dog" | "cat" | "rabbit" | "bird" | "other";

export type Pet = {
  id: string;
  name: string;
  species: Species;
  breed: string;
  sex: "male" | "female";
  dob: string;
  weightKg: number;
  photo?: string;
  microchipId?: string;
  sterilized: boolean;
  allergies: string[];
  conditions: string[];
  emergencyContact: string;
};

export type CareTaskKind = "medication" | "meal" | "activity" | "grooming" | "appointment" | "record";

export type CareTask = {
  id: string;
  petId: string;
  kind: CareTaskKind;
  title: string;
  detail: string;
  dueAt: string;
  done: boolean;
};

export type Medication = {
  id: string;
  petId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  instructions: string;
  prescribedBy?: string;
  timesPerDay: string[];
  adherence: number;
};

export type Vaccine = {
  id: string;
  petId: string;
  name: string;
  givenOn?: string;
  dueOn: string;
  clinic?: string;
  batch?: string;
  status: "up-to-date" | "due-soon" | "overdue" | "scheduled";
};

export type RecordCategory =
  | "consultation"
  | "lab"
  | "prescription"
  | "vaccination"
  | "surgery"
  | "imaging"
  | "insurance"
  | "other";

export type MedicalRecord = {
  id: string;
  petId: string;
  title: string;
  category: RecordCategory;
  date: string;
  clinic: string;
  fileType: "pdf" | "image";
  sharedWith: string[];
  note?: string;
};

export type TimelineEntry = {
  id: string;
  petId: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: "primary" | "success" | "warning" | "danger" | "verified" | "community" | "neutral";
  title: string;
  detail: string;
  at: string;
  source: "owner" | "clinic";
};

export type AppointmentStatus =
  | "requested"
  | "accepted"
  | "scheduled"
  | "ready"
  | "in-consultation"
  | "completed"
  | "declined"
  | "reschedule-proposed"
  | "cancelled"
  | "no-show";

export type ConsultType = "in-clinic" | "voice" | "video";

export type Appointment = {
  id: string;
  petId: string;
  vetId: string;
  clinicId: string;
  type: ConsultType;
  reason: string;
  status: AppointmentStatus;
  startsAt: string;
  durationMin: number;
  fee: number;
  sharedRecordIds: string[];
  ownerName?: string;
  note?: string;
};

export type Vet = {
  id: string;
  name: string;
  photo?: string;
  speciality: string;
  qualifications: string;
  clinicId: string;
  yearsExperience: number;
  languages: string[];
  species: Species[];
  verified: boolean;
  rating: number;
  reviews: number;
  feeFrom: number;
  consultTypes: ConsultType[];
  availableNow: boolean;
  distanceKm: number;
  nextSlot: string;
  bio: string;
};

export type Clinic = {
  id: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  emergency: boolean;
  facilities: string[];
  distanceKm: number;
};

export type Circle = {
  id: string;
  name: string;
  kind: "city" | "breed" | "rescue" | "health" | "behavior" | "stage";
  members: number;
  joined: boolean;
  blurb: string;
};

export type Question = {
  id: string;
  author: string;
  authorPhoto?: string;
  petLine: string;
  title: string;
  body: string;
  topic: "health" | "local" | "adoption" | "general";
  answers: number;
  vetAnswered: boolean;
  ago: string;
  topAnswer?: { by: string; verified: boolean; text: string };
};

export type LocalItem = {
  id: string;
  kind: "event" | "playdate" | "lost" | "found" | "rescue" | "help";
  title: string;
  detail: string;
  when: string;
  distanceKm: number;
  photo?: string;
  urgent?: boolean;
};

export type Adoptable = {
  id: string;
  name: string;
  species: Species;
  breed: string;
  ageLabel: string;
  shelter: string;
  distanceKm: number;
  photo?: string;
  vaccinated: boolean;
  sterilized: boolean;
};

export type Prescription = {
  id: string;
  petId: string;
  vetId: string;
  issuedOn: string;
  items: { name: string; dosage: string; duration: string }[];
  status: "active" | "completed";
};

export type MessageThread = {
  id: string;
  petId: string;
  vetId: string;
  clinicId: string;
  lastMessage: string;
  ago: string;
  unread: number;
  windowClosesIn?: string;
  resolved: boolean;
};

export type ConsultRequest = {
  id: string;
  ownerName: string;
  petName: string;
  species: Species;
  category: string;
  urgency: "routine" | "soon" | "urgent";
  waitingMin: number;
  photo?: string;
};
