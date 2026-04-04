import AsyncStorage from '@react-native-async-storage/async-storage';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

type MockUser = {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'veterinarian' | 'admin' | 'shelter';
  token?: string;
  isVerified?: boolean;
  clinic_name?: string;
  specialty?: string;
  bio?: string;
  city?: string;
  phone?: string;
  memberSince?: string;
  petCount?: number;
  rating?: number | string;
  yearsExp?: number | string;
  avatar_url?: string;
};

type MockPet = {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  gender: string;
  birth_date?: string | null;
  microchip_id?: string;
  avatar_url?: string;
  healthStatus?: string;
  healthScore?: string;
  nextVisit?: string;
  city?: string;
  isAdoptionOpen?: boolean;
  isFosterOpen?: boolean;
};

type MockVital = {
  id: string;
  petId: string;
  type: string;
  value: string;
  unit: string;
  timestamp: string;
};

type MockVaccine = {
  id: string;
  petId: string;
  name: string;
  status: string;
  lastVaccinationDate?: string;
  nextDueDate?: string;
};

type MockRecord = {
  id: string;
  petId: string;
  title: string;
  clinic_name: string;
  veterinarian_name?: string;
  notes?: string;
  date: string;
};

type MockMedication = {
  id: string;
  petId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  isActive?: boolean;
};

type MockReminder = {
  id: string;
  userId: string;
  petId?: string | null;
  title: string;
  notes?: string;
  time: string;
  date?: string | null;
  recurrence?: string;
  type: string;
  isDone: boolean;
};

type MockAppointment = {
  id: string;
  petId: string;
  ownerId: string;
  veterinarianId: string;
  date: string;
  time: string;
  reason: string;
  status: string;
};

type MockPost = {
  id: string;
  authorId: string;
  content: string;
  category: string;
  createdAt: string;
  imageUrl?: string;
  likes: Array<{ userId: string }>;
  comments: Array<{ id: string }>;
};

type MockEvent = {
  id: string;
  title: string;
  location: string;
  date: string;
  imageUrl?: string;
  attendees?: string;
  category?: string;
};

type MockDb = {
  users: MockUser[];
  pets: MockPet[];
  vitals: MockVital[];
  vaccines: MockVaccine[];
  records: MockRecord[];
  medications: MockMedication[];
  reminders: MockReminder[];
  appointments: MockAppointment[];
  posts: MockPost[];
  events: MockEvent[];
};

type AuthResponse = MockUser & {
  token: string;
  avatar?: string;
};

const STORAGE_KEY = 'mock_api_db_v1';
const MOCK_DELAY_MS = 120;

let mockDb: MockDb | null = null;

const daysFromNow = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString();
};

const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const createToken = (userId: string) => `mock-token:${userId}`;

const delay = async () => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const getInitialDb = (): MockDb => ({
  users: [
    {
      id: 'user_owner_1',
      name: 'Alex Carter',
      email: 'alex@pawshub.app',
      role: 'owner',
      isVerified: true,
      memberSince: '2024',
      petCount: 2,
      city: 'San Francisco',
      phone: '+1 555-0147',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'user_vet_1',
      name: 'Dr. Maya Singh',
      email: 'maya.vet@pawshub.app',
      role: 'veterinarian',
      isVerified: true,
      clinic_name: 'PawCare Clinic',
      specialty: 'Small Animal Medicine',
      bio: 'Compassionate vet focused on preventive care and long-term wellness.',
      city: 'San Francisco',
      phone: '+1 555-0201',
      rating: 4.9,
      yearsExp: 8,
      avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'user_vet_2',
      name: 'Dr. Ethan Brooks',
      email: 'ethan.vet@pawshub.app',
      role: 'veterinarian',
      isVerified: true,
      clinic_name: 'Happy Tails Hospital',
      specialty: 'Surgery and Diagnostics',
      bio: 'Helping anxious pets feel safe while delivering thorough care.',
      city: 'Oakland',
      phone: '+1 555-0202',
      rating: 4.7,
      yearsExp: 11,
      avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'user_shelter_1',
      name: 'Bay Rescue Home',
      email: 'hello@bayrescue.org',
      role: 'shelter',
      isVerified: true,
      bio: 'Community shelter focused on rescue, rehab, and happy adoptions.',
      city: 'San Jose',
      phone: '+1 555-0301',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    },
  ],
  pets: [
    {
      id: 'pet_1',
      ownerId: 'user_owner_1',
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      age: '3 yrs',
      weight: '28 kg',
      gender: 'Male',
      birth_date: '2022-02-15',
      microchip_id: '985112345678',
      avatar_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80',
      healthStatus: 'Healthy',
      healthScore: '92',
      nextVisit: 'Apr 12',
      city: 'San Francisco',
      isAdoptionOpen: false,
      isFosterOpen: false,
    },
    {
      id: 'pet_2',
      ownerId: 'user_owner_1',
      name: 'Milo',
      species: 'Cat',
      breed: 'Tabby',
      age: '2 yrs',
      weight: '5 kg',
      gender: 'Male',
      birth_date: '2023-01-08',
      microchip_id: '985112349999',
      avatar_url: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=800&q=80',
      healthStatus: 'Vaccine Due',
      healthScore: '84',
      nextVisit: 'Apr 10',
      city: 'San Francisco',
      isAdoptionOpen: false,
      isFosterOpen: true,
    },
    {
      id: 'pet_3',
      ownerId: 'user_shelter_1',
      name: 'Luna',
      species: 'Cat',
      breed: 'Domestic Short Hair',
      age: '1 yr',
      weight: '4 kg',
      gender: 'Female',
      avatar_url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80',
      healthStatus: 'Healthy',
      healthScore: '90',
      city: 'San Jose',
      isAdoptionOpen: true,
      isFosterOpen: true,
    },
    {
      id: 'pet_4',
      ownerId: 'user_shelter_1',
      name: 'Coco',
      species: 'Dog',
      breed: 'Mixed Breed',
      age: '4 yrs',
      weight: '18 kg',
      gender: 'Female',
      avatar_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80',
      healthStatus: 'Healthy',
      healthScore: '88',
      city: 'Oakland',
      isAdoptionOpen: true,
      isFosterOpen: false,
    },
  ],
  vitals: [
    { id: 'vital_1', petId: 'pet_1', type: 'weight', value: '28', unit: 'kg', timestamp: daysFromNow(-2) },
    { id: 'vital_2', petId: 'pet_1', type: 'heart rate', value: '92', unit: 'bpm', timestamp: daysFromNow(-3) },
    { id: 'vital_3', petId: 'pet_1', type: 'temperature', value: '101.2', unit: 'F', timestamp: daysFromNow(-6) },
    { id: 'vital_4', petId: 'pet_2', type: 'weight', value: '5', unit: 'kg', timestamp: daysFromNow(-5) },
  ],
  vaccines: [
    { id: 'vac_1', petId: 'pet_1', name: 'Rabies', status: 'done', lastVaccinationDate: daysFromNow(-30), nextDueDate: daysFromNow(335) },
    { id: 'vac_2', petId: 'pet_2', name: 'FVRCP', status: 'due', lastVaccinationDate: daysFromNow(-370), nextDueDate: daysFromNow(4) },
  ],
  records: [
    { id: 'rec_1', petId: 'pet_1', title: 'Annual Checkup', clinic_name: 'PawCare Clinic', veterinarian_name: 'Dr. Maya Singh', notes: 'Overall healthy.', date: daysFromNow(-14) },
    { id: 'rec_2', petId: 'pet_2', title: 'Dental Evaluation', clinic_name: 'Happy Tails Hospital', veterinarian_name: 'Dr. Ethan Brooks', notes: 'Mild tartar noted.', date: daysFromNow(-45) },
  ],
  medications: [
    { id: 'med_1', petId: 'pet_1', name: 'Heartgard', dosage: '1 chew', frequency: 'Monthly', startDate: daysFromNow(-60), endDate: daysFromNow(300), isActive: true },
    { id: 'med_2', petId: 'pet_2', name: 'Omega Supplement', dosage: '5 ml', frequency: 'Daily', startDate: daysFromNow(-20), isActive: true },
  ],
  reminders: [
    { id: 'rem_1', userId: 'user_owner_1', petId: 'pet_1', title: 'Buddy monthly meds', time: '08:00 AM', date: daysFromNow(2), recurrence: 'monthly', type: 'medication', isDone: false },
    { id: 'rem_2', userId: 'user_owner_1', petId: 'pet_2', title: 'Milo vaccine booster', time: '11:00 AM', date: daysFromNow(4), recurrence: 'none', type: 'vaccine', isDone: false },
    { id: 'rem_3', userId: 'user_owner_1', petId: 'pet_1', title: 'Vet follow-up call', time: '03:30 PM', date: daysFromNow(-1), recurrence: 'none', type: 'appointment', isDone: true },
  ],
  appointments: [
    { id: 'appt_1', petId: 'pet_1', ownerId: 'user_owner_1', veterinarianId: 'user_vet_1', date: daysFromNow(1).slice(0, 10), time: '09:00 AM', reason: 'Annual wellness visit', status: 'confirmed' },
    { id: 'appt_2', petId: 'pet_2', ownerId: 'user_owner_1', veterinarianId: 'user_vet_2', date: daysFromNow(3).slice(0, 10), time: '02:30 PM', reason: 'Booster consultation', status: 'pending' },
    { id: 'appt_3', petId: 'pet_1', ownerId: 'user_owner_1', veterinarianId: 'user_vet_1', date: daysFromNow(-7).slice(0, 10), time: '10:00 AM', reason: 'Weight follow-up', status: 'completed' },
  ],
  posts: [
    { id: 'post_1', authorId: 'user_owner_1', content: 'Buddy crushed his training session today and finally nailed stay at the park.', category: 'Training', createdAt: daysFromNow(-1), likes: [{ userId: 'user_vet_1' }], comments: [{ id: 'comment_1' }] },
    { id: 'post_2', authorId: 'user_vet_1', content: 'Reminder for spring: check flea and tick prevention before travel season starts.', category: 'Health', createdAt: daysFromNow(-2), likes: [{ userId: 'user_owner_1' }, { userId: 'user_shelter_1' }], comments: [] },
    { id: 'post_3', authorId: 'user_shelter_1', content: 'Luna is looking for a calm foster home this month. She loves sunny windows and gentle company.', category: 'Adoption', createdAt: daysFromNow(-3), imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80', likes: [], comments: [{ id: 'comment_2' }, { id: 'comment_3' }] },
  ],
  events: [
    { id: 'event_1', title: 'Pup Social in the Park', location: 'Mission Dolores Park', date: daysFromNow(5), attendees: '42 going', category: 'Community', imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80' },
    { id: 'event_2', title: 'Low-Cost Vaccine Day', location: 'PawCare Clinic', date: daysFromNow(9), attendees: '18 spots left', category: 'Health', imageUrl: 'https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&w=800&q=80' },
  ],
});

const ensureDb = async (): Promise<MockDb> => {
  if (mockDb) {
    return mockDb;
  }

  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored) {
    mockDb = JSON.parse(stored) as MockDb;
  } else {
    mockDb = getInitialDb();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockDb));
  }
  return mockDb;
};

const saveDb = async (): Promise<void> => {
  if (mockDb) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockDb));
  }
};

const getUserFromToken = (db: MockDb, token: string | null): MockUser | null => {
  if (!token?.startsWith('mock-token:')) {
    return null;
  }

  const userId = token.replace('mock-token:', '');
  return db.users.find((user) => user.id === userId) || null;
};

const getFallbackUser = (db: MockDb): MockUser => {
  const fallbackUser = db.users.find((user) => user.role === 'owner') || db.users[0];
  if (!fallbackUser) {
    throw new Error('Mock database has no users');
  }
  return fallbackUser;
};

const getCurrentUser = async (db: MockDb): Promise<MockUser> => {
  const token = await AsyncStorage.getItem('user_token');
  return getUserFromToken(db, token) || getFallbackUser(db);
};

const requireCurrentUser = async (db: MockDb): Promise<MockUser> => getCurrentUser(db);

const enrichPet = (db: MockDb, pet: MockPet) => {
  const owner = db.users.find((user) => user.id === pet.ownerId) || null;
  const reminders = db.reminders.filter((reminder) => reminder.petId === pet.id && !reminder.isDone);
  const appointments = db.appointments.filter((appointment) => appointment.petId === pet.id);

  return {
    ...pet,
    owner,
    reminderCount: reminders.length,
    Vaccines: db.vaccines.filter((item) => item.petId === pet.id),
    Medications: db.medications.filter((item) => item.petId === pet.id),
    Appointments: appointments.map((appointment) => ({
      ...appointment,
      appointment_date: appointment.date,
      appointment_time: appointment.time,
    })),
  };
};

const enrichReminder = (db: MockDb, reminder: MockReminder) => ({
  ...reminder,
  pet: reminder.petId ? db.pets.find((pet) => pet.id === reminder.petId) || null : null,
});

const enrichAppointment = (db: MockDb, appointment: MockAppointment) => ({
  ...appointment,
  pet: db.pets.find((pet) => pet.id === appointment.petId) || null,
  owner: db.users.find((user) => user.id === appointment.ownerId) || null,
  veterinarian: db.users.find((user) => user.id === appointment.veterinarianId) || null,
});

const enrichPost = (db: MockDb, post: MockPost) => ({
  ...post,
  author: db.users.find((user) => user.id === post.authorId) || null,
});

const sanitizeAuthUser = (user: MockUser): AuthResponse => ({
  ...user,
  token: createToken(user.id),
  avatar: user.avatar_url,
});

const handleAuth = async (db: MockDb, endpoint: string, method: HttpMethod, body: unknown) => {
  if (method === 'GET' && endpoint === '/auth/me') {
    const token = await AsyncStorage.getItem('user_token');
    const user = getUserFromToken(db, token);
    if (!user) {
      throw new Error('No saved mock session');
    }
    return sanitizeAuthUser(user);
  }

  if (method === 'POST' && endpoint === '/auth/login') {
    const payload = (body ?? {}) as { email?: string };
    const email = String(payload.email || '').toLowerCase();
    const requestedUser =
      db.users.find((user) => user.email.toLowerCase() === email) ||
      db.users.find((user) => (email.includes('vet') ? user.role === 'veterinarian' : user.role === 'owner')) ||
      getFallbackUser(db);

    return sanitizeAuthUser(requestedUser);
  }

  if (method === 'POST' && endpoint === '/auth/register') {
    const newUser: MockUser = {
      id: createId('user'),
      name: ((body as { name?: string } | null)?.name) || 'New Member',
      email: ((body as { email?: string } | null)?.email) || `user${Date.now()}@pawshub.app`,
      role: (((body as { role?: MockUser['role'] } | null)?.role) || 'owner') as MockUser['role'],
      isVerified: ((body as { role?: MockUser['role'] } | null)?.role) === 'veterinarian' ? false : true,
      clinic_name: ((body as { role?: MockUser['role']; name?: string } | null)?.role) === 'veterinarian' ? `${((body as { name?: string } | null)?.name) || 'New'} Pet Clinic` : undefined,
      specialty: ((body as { role?: MockUser['role'] } | null)?.role) === 'veterinarian' ? 'General Practice' : undefined,
      city: 'San Francisco',
      phone: '+1 555-9999',
      memberSince: String(new Date().getFullYear()),
    };
    db.users.unshift(newUser);
    await saveDb();
    return sanitizeAuthUser(newUser);
  }

  if (method === 'PUT' && endpoint === '/auth/profile') {
    const currentUser = await requireCurrentUser(db);
    Object.assign(currentUser, (body ?? {}) as Partial<MockUser>);
    await saveDb();
    return sanitizeAuthUser(currentUser);
  }

  if (method === 'GET' && endpoint === '/auth/users/shelter') {
    return db.users.filter((user) => user.role === 'shelter');
  }

  return null;
};

const handlePets = async (db: MockDb, endpoint: string, method: HttpMethod, body: unknown) => {
  const currentUser = await requireCurrentUser(db);

  const payload = (body ?? {}) as Partial<MockPet>;

  if (method === 'GET' && endpoint === '/pets') {
    return db.pets.filter((pet) => pet.ownerId === currentUser.id).map((pet) => enrichPet(db, pet));
  }

  if (method === 'GET' && endpoint === '/pets/discover') {
    return db.pets
      .filter((pet) => pet.isAdoptionOpen || pet.isFosterOpen)
      .map((pet) => enrichPet(db, pet));
  }

  const petDetailMatch = endpoint.match(/^\/pets\/([^/]+)$/);
  if (method === 'GET' && petDetailMatch) {
    const pet = db.pets.find((item) => item.id === petDetailMatch[1]);
    return pet ? enrichPet(db, pet) : null;
  }

  if (method === 'POST' && endpoint === '/pets') {
    const newPet: MockPet = {
      id: createId('pet'),
      ownerId: currentUser.id,
      name: payload.name || 'New Pet',
      species: payload.species || 'Other',
      breed: payload.breed || 'Mixed Breed',
      age: payload.age || 'Unknown',
      weight: payload.weight || '--',
      gender: payload.gender || 'Unknown',
      birth_date: payload.birth_date || null,
      microchip_id: payload.microchip_id || '',
      avatar_url: payload.avatar_url,
      healthStatus: 'Healthy',
      healthScore: '88',
      nextVisit: 'TBD',
      city: 'San Francisco',
      isAdoptionOpen: false,
      isFosterOpen: false,
    };
    db.pets.unshift(newPet);
    await saveDb();
    return enrichPet(db, newPet);
  }

  if (method === 'PUT' && petDetailMatch) {
    const pet = db.pets.find((item) => item.id === petDetailMatch[1]);
    if (!pet) {
      throw new Error('Pet not found');
    }
    Object.assign(pet, payload);
    await saveDb();
    return enrichPet(db, pet);
  }

  if (method === 'DELETE' && petDetailMatch) {
    db.pets = db.pets.filter((item) => item.id !== petDetailMatch[1]);
    db.vitals = db.vitals.filter((item) => item.petId !== petDetailMatch[1]);
    db.vaccines = db.vaccines.filter((item) => item.petId !== petDetailMatch[1]);
    db.records = db.records.filter((item) => item.petId !== petDetailMatch[1]);
    db.medications = db.medications.filter((item) => item.petId !== petDetailMatch[1]);
    db.reminders = db.reminders.filter((item) => item.petId !== petDetailMatch[1]);
    db.appointments = db.appointments.filter((item) => item.petId !== petDetailMatch[1]);
    await saveDb();
    return { success: true };
  }

  const listingMatch = endpoint.match(/^\/pets\/([^/]+)\/listing$/);
  if (method === 'PATCH' && listingMatch) {
    const pet = db.pets.find((item) => item.id === listingMatch[1]);
    if (!pet) {
      throw new Error('Pet not found');
    }
    if (typeof payload.isAdoptionOpen === 'boolean') {
      pet.isAdoptionOpen = payload.isAdoptionOpen;
    }
    if (typeof payload.isFosterOpen === 'boolean') {
      pet.isFosterOpen = payload.isFosterOpen;
    }
    await saveDb();
    return enrichPet(db, pet);
  }

  return null;
};

const handleHealth = async (db: MockDb, endpoint: string, method: HttpMethod, body: unknown) => {
  const resourceMatch = endpoint.match(/^\/health\/(vitals|vaccines|records|meds)\/([^/]+)$/);
  if (!resourceMatch) {
    return null;
  }

  const [, resource, petId] = resourceMatch;
  const payload = body as Record<string, unknown> | null;

  if (resource === 'vitals') {
    if (method === 'GET') {
      return db.vitals.filter((item) => item.petId === petId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    if (method === 'POST') {
      const newVital: MockVital = {
        id: createId('vital'),
        petId,
        type: String(payload?.type || 'weight'),
        value: String(payload?.value || ''),
        unit: String(payload?.unit || ''),
        timestamp: new Date().toISOString(),
      };
      db.vitals.unshift(newVital);
      await saveDb();
      return newVital;
    }
  }

  if (resource === 'vaccines') {
    if (method === 'GET') {
      return db.vaccines.filter((item) => item.petId === petId);
    }
    if (method === 'POST') {
      const newVaccine: MockVaccine = {
        id: createId('vac'),
        petId,
        name: String(payload?.name || 'New Vaccine'),
        status: String(payload?.status || 'done'),
        lastVaccinationDate: String(payload?.dateAdministered || new Date().toISOString()),
        nextDueDate: payload?.nextDueDate as string | undefined,
      };
      db.vaccines.unshift(newVaccine);
      await saveDb();
      return newVaccine;
    }
  }

  if (resource === 'records') {
    if (method === 'GET') {
      return db.records.filter((item) => item.petId === petId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    if (method === 'POST') {
      const newRecord: MockRecord = {
        id: createId('rec'),
        petId,
        title: String(payload?.title || 'Medical Visit'),
        clinic_name: String(payload?.clinic_name || 'PawsHub Clinic'),
        veterinarian_name: String(payload?.veterinarian_name || ''),
        notes: String(payload?.notes || ''),
        date: String(payload?.date || new Date().toISOString()),
      };
      db.records.unshift(newRecord);
      await saveDb();
      return newRecord;
    }
  }

  if (resource === 'meds') {
    if (method === 'GET') {
      return db.medications.filter((item) => item.petId === petId);
    }
    if (method === 'POST') {
      const newMedication: MockMedication = {
        id: createId('med'),
        petId,
        name: String(payload?.name || 'New Medication'),
        dosage: String(payload?.dosage || ''),
        frequency: String(payload?.frequency || ''),
        startDate: String(payload?.startDate || new Date().toISOString()),
        endDate: payload?.endDate as string | undefined,
        isActive: true,
      };
      db.medications.unshift(newMedication);
      await saveDb();
      return newMedication;
    }
  }

  return null;
};

const handleAppointments = async (db: MockDb, endpoint: string, method: HttpMethod, body: unknown) => {
  const currentUser = await requireCurrentUser(db);
  const payload = body as Record<string, unknown> | null;

  if (method === 'GET' && endpoint === '/appointments/vets') {
    return db.users.filter((user) => user.role === 'veterinarian');
  }

  if (method === 'GET' && endpoint === '/appointments/vet') {
    const vetId = currentUser.role === 'veterinarian' ? currentUser.id : 'user_vet_1';
    return db.appointments
      .filter((appointment) => appointment.veterinarianId === vetId)
      .map((appointment) => enrichAppointment(db, appointment))
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }

  if (method === 'GET' && endpoint === '/appointments/vet/stats') {
    const vetId = currentUser.role === 'veterinarian' ? currentUser.id : 'user_vet_1';
    const appointments = db.appointments.filter((appointment) => appointment.veterinarianId === vetId);
    const today = new Date().toISOString().slice(0, 10);
    return {
      todayAppointments: appointments.filter((appointment) => appointment.date === today).length,
      totalPatients: new Set(appointments.map((appointment) => appointment.petId)).size,
      avgRating: currentUser.rating || 4.8,
      pendingAppointments: appointments.filter((appointment) => appointment.status === 'pending').length,
    };
  }

  if (method === 'GET' && endpoint === '/appointments/owner') {
    return db.appointments
      .filter((appointment) => appointment.ownerId === currentUser.id)
      .map((appointment) => enrichAppointment(db, appointment))
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }

  if (method === 'POST' && endpoint === '/appointments') {
    const vetId = String(payload?.vetId || 'user_vet_1');
    const newAppointment: MockAppointment = {
      id: createId('appt'),
      petId: String(payload?.petId || ''),
      ownerId: currentUser.id,
      veterinarianId: vetId,
      date: String(payload?.date || new Date().toISOString().slice(0, 10)),
      time: String(payload?.time || '09:00 AM'),
      reason: String(payload?.reason || 'Checkup'),
      status: 'pending',
    };
    db.appointments.unshift(newAppointment);
    db.reminders.unshift({
      id: createId('rem'),
      userId: currentUser.id,
      petId: newAppointment.petId,
      title: `Appointment with ${db.users.find((user) => user.id === vetId)?.clinic_name || 'vet'}`,
      time: newAppointment.time,
      date: newAppointment.date,
      recurrence: 'none',
      type: 'appointment',
      isDone: false,
    });
    await saveDb();
    return enrichAppointment(db, newAppointment);
  }

  const statusMatch = endpoint.match(/^\/appointments\/([^/]+)\/status$/);
  if (method === 'PATCH' && statusMatch) {
    const appointment = db.appointments.find((item) => item.id === statusMatch[1]);
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    appointment.status = String(payload?.status || appointment.status);
    await saveDb();
    return enrichAppointment(db, appointment);
  }

  return null;
};

const handleCommunity = async (db: MockDb, endpoint: string, method: HttpMethod, body: unknown) => {
  const currentUser = await requireCurrentUser(db);
  const payload = body as Record<string, unknown> | null;

  if (method === 'GET' && endpoint === '/community/feed') {
    return db.posts
      .map((post) => enrichPost(db, post))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (method === 'GET' && endpoint === '/community/events') {
    return db.events;
  }

  if (method === 'POST' && endpoint === '/community/posts') {
    const newPost: MockPost = {
      id: createId('post'),
      authorId: currentUser.id,
      content: String(payload?.content || ''),
      category: String(payload?.category || 'General'),
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
    };
    db.posts.unshift(newPost);
    await saveDb();
    return enrichPost(db, newPost);
  }

  const likeMatch = endpoint.match(/^\/community\/posts\/([^/]+)\/like$/);
  if (method === 'POST' && likeMatch) {
    const post = db.posts.find((item) => item.id === likeMatch[1]);
    if (!post) {
      throw new Error('Post not found');
    }
    const existingLike = post.likes.find((like) => like.userId === currentUser.id);
    if (existingLike) {
      post.likes = post.likes.filter((like) => like.userId !== currentUser.id);
      await saveDb();
      return { liked: false };
    }
    post.likes.push({ userId: currentUser.id });
    await saveDb();
    return { liked: true };
  }

  return null;
};

const handleReminders = async (db: MockDb, endpoint: string, method: HttpMethod) => {
  const currentUser = await requireCurrentUser(db);

  if (method === 'GET' && endpoint === '/reminders') {
    return db.reminders
      .filter((reminder) => reminder.userId === currentUser.id)
      .map((reminder) => enrichReminder(db, reminder))
      .sort((a, b) => `${a.date || ''} ${a.time}`.localeCompare(`${b.date || ''} ${b.time}`));
  }

  const toggleMatch = endpoint.match(/^\/reminders\/([^/]+)\/toggle$/);
  if (method === 'PATCH' && toggleMatch) {
    const reminder = db.reminders.find((item) => item.id === toggleMatch[1] && item.userId === currentUser.id);
    if (!reminder) {
      throw new Error('Reminder not found');
    }
    reminder.isDone = !reminder.isDone;
    await saveDb();
    return enrichReminder(db, reminder);
  }

  return null;
};

export const apiCall = async (endpoint: string, options: RequestOptions = {}) => {
  const { method = 'GET', body } = options;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const db = await ensureDb();

  await delay();

  const handlers = [handleAuth, handlePets, handleHealth, handleAppointments, handleCommunity, handleReminders];
  for (const handler of handlers) {
    const result = await handler(db, normalizedEndpoint, method, body);
    if (result !== null) {
      return clone(result);
    }
  }

  throw new Error(`Mock API route not implemented: ${method} ${normalizedEndpoint}`);
};

export const api = {
  get: (endpoint: string) => apiCall(endpoint, { method: 'GET' }),
  post: (endpoint: string, body?: unknown) => apiCall(endpoint, { method: 'POST', body }),
  put: (endpoint: string, body?: unknown) => apiCall(endpoint, { method: 'PUT', body }),
  patch: (endpoint: string, body?: unknown) => apiCall(endpoint, { method: 'PATCH', body }),
  delete: (endpoint: string) => apiCall(endpoint, { method: 'DELETE' }),
};
