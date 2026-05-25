import AsyncStorage from "@react-native-async-storage/async-storage";

export type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: "male" | "female";
  ageYears: number;
  photo?: string;
  personality: string[];
  createdAt: string;
};

const KEY = "furr:pets";

export async function getPets(): Promise<Pet[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addPet(pet: Omit<Pet, "id" | "createdAt">): Promise<Pet> {
  const pets = await getPets();
  const newPet: Pet = {
    ...pet,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify([...pets, newPet]));
  return newPet;
}

export async function getPet(id: string): Promise<Pet | undefined> {
  const pets = await getPets();
  return pets.find((p) => p.id === id);
}
