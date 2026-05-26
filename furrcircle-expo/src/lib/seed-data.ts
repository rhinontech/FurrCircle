export type SeedUser = {
  id: string;
  name: string;
  handle: string;
  email: string;
  password: string;
  avatar: string;
  bio: string;
  location: string;
  followers: number;
  following: number;
  pets: SeedPet[];
};

export type SeedPet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: "male" | "female";
  ageYears: number;
  personality: string[];
  emoji: string;
};

export const SEED_USERS: SeedUser[] = [
  {
    id: "u1",
    name: "Priya Sharma",
    handle: "priya_pawmom",
    email: "priya@furr.com",
    password: "password123",
    avatar: "https://i.pravatar.cc/150?img=47",
    bio: "Golden retriever mom 🐕 | Dog trainer enthusiast | Mumbai",
    location: "Mumbai, India",
    followers: 1240,
    following: 382,
    pets: [
      {
        id: "p1",
        name: "Bruno",
        species: "Dog",
        breed: "Golden Retriever",
        gender: "male",
        ageYears: 3,
        personality: ["playful", "gentle", "loyal"],
        emoji: "🐕",
      },
      {
        id: "p2",
        name: "Coco",
        species: "Dog",
        breed: "Beagle",
        gender: "female",
        ageYears: 1,
        personality: ["curious", "energetic"],
        emoji: "🐶",
      },
    ],
  },
  {
    id: "u2",
    name: "Arjun Mehta",
    handle: "arjun_catdad",
    email: "arjun@furr.com",
    password: "password123",
    avatar: "https://i.pravatar.cc/150?img=12",
    bio: "Cat dad x2 🐱 | Work from home, never alone | Bangalore",
    location: "Bangalore, India",
    followers: 830,
    following: 210,
    pets: [
      {
        id: "p3",
        name: "Luna",
        species: "Cat",
        breed: "Persian",
        gender: "female",
        ageYears: 4,
        personality: ["calm", "affectionate", "royal"],
        emoji: "🐱",
      },
      {
        id: "p4",
        name: "Mochi",
        species: "Cat",
        breed: "Scottish Fold",
        gender: "male",
        ageYears: 2,
        personality: ["lazy", "cuddly"],
        emoji: "😺",
      },
    ],
  },
  {
    id: "u3",
    name: "Demo User",
    handle: "demo_furr",
    email: "demo@furr.com",
    password: "demo",
    avatar: "https://i.pravatar.cc/150?img=32",
    bio: "Testing FurrCircle 🐾",
    location: "Delhi, India",
    followers: 0,
    following: 0,
    pets: [],
  },
];

export function findUserByEmail(email: string): SeedUser | undefined {
  return SEED_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
