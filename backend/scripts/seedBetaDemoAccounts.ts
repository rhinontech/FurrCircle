import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import db from "../models/index.ts";
import { uploadFileToS3 } from "../services/s3Service.ts";

const { users: User, pets: Pet, posts: Post } = db as any;

const DEMO_PASSWORD = "Beta@1234";
const IMAGES_DIR = path.join(process.cwd(), "pets_images");

const readImage = (filename: string) => fs.readFileSync(path.join(IMAGES_DIR, filename));

const accounts = [
  {
    user: {
      name: "Ananya Sharma",
      email: "ananya.sharma@furrcircle.app",
      username: "ananya_sharma",
      bio: "Dog mom & hedgehog enthusiast. Weekend trail runs with Bruno 🐾",
      city: "hyderabad",
      address: "Banjara Hills, Hyderabad",
      phone: "+91 98765 43210",
      latitude: 17.4126,
      longitude: 78.4071,
      petTypeInterests: ["Dog", "Other"],
      topicInterests: ["Health", "Training"],
      avatar_url: "https://i.pravatar.cc/500?img=47",
    },
    pets: [
      {
        name: "Bruno",
        image: "australian-shepherd-dog.png",
        species: "Dog",
        breed: "Australian Shepherd",
        gender: "Male",
        birth_date: "2022-03-15",
        weight: "24 kg",
        age: "3 years",
        description:
          "Bruno is a heterochromatic Aussie with one blue eye and one amber eye. Loves fetch, hiking, and belly rubs.",
        history: "Adopted from a breeder in 2022. Fully vaccinated and microchipped.",
        microchip_id: "IN-BLR-BRUNO-2022",
        personality: ["Playful", "Energetic", "Affectionate"],
      },
      {
        name: "Quill",
        image: "hedgehog.png",
        species: "Hedgehog",
        breed: "African Pygmy Hedgehog",
        gender: "Female",
        birth_date: "2024-06-01",
        weight: "350 g",
        age: "1 year",
        description:
          "Quill is a shy but curious African Pygmy Hedgehog who loves mealworms and midnight walks in her ball.",
        history: "Purchased from a licensed exotic pet breeder in 2024.",
        microchip_id: null,
        personality: ["Shy", "Curious", "Independent"],
      },
    ],
    post: {
      content:
        "Bruno's morning trail run through Cubbon Park 🌳🐾 Those mismatched eyes never fail to stop people in their tracks!",
      category: "General",
      petImageIndex: 0,
    },
  },
  {
    user: {
      name: "Rohan Mehta",
      email: "rohan.mehta@furrcircle.app",
      username: "rohan_mehta",
      bio: "Foster dad to a litter of rescued kittens 🐱",
      city: "hyderabad",
      address: "Gachibowli, Hyderabad",
      phone: "+91 98220 11223",
      latitude: 17.4401,
      longitude: 78.3489,
      petTypeInterests: ["Cat"],
      topicInterests: ["Adoption", "Health"],
      avatar_url: "https://i.pravatar.cc/500?img=13",
    },
    pets: [
      {
        name: "Mochi",
        image: "orange-tabby-kittens.png",
        species: "Cat",
        breed: "Domestic Shorthair (Orange Tabby)",
        gender: "Female",
        birth_date: "2025-05-01",
        weight: "1.2 kg",
        age: "3 months",
        description:
          "Mochi is one of four rescued kittens found near Rohan's building. Bottle-fed and now a healthy, playful kitten.",
        history: "Rescued as a newborn along with 3 littermates. Hand-reared by Rohan.",
        microchip_id: null,
        personality: ["Playful", "Vocal", "Affectionate"],
        isFosterOpen: true,
      },
    ],
    post: {
      content:
        "Meet Mochi — one of the four rescue kittens we've been fostering since they were days old. She's finally ready for adoption inquiries! 🐈",
      category: "Adoption",
      petImageIndex: 0,
    },
  },
  {
    user: {
      name: "Priya Nair",
      email: "priya.nair@furrcircle.app",
      username: "priya_nair",
      bio: "Chinchilla parent 🐹 Exotic pet lover",
      city: "hyderabad",
      address: "Jubilee Hills, Hyderabad",
      phone: "+91 90031 55678",
      latitude: 17.431,
      longitude: 78.4076,
      petTypeInterests: ["Other"],
      topicInterests: ["Health", "Nutrition"],
      avatar_url: "https://i.pravatar.cc/500?img=25",
    },
    pets: [
      {
        name: "Ziggy",
        image: "chinchilla.png",
        species: "Chinchilla",
        breed: "Standard Grey Chinchilla",
        gender: "Male",
        birth_date: "2023-11-20",
        weight: "550 g",
        age: "2 years",
        description:
          "Ziggy loves dust baths and late-night zoomies around his cage. Very food-motivated.",
        history: "Adopted from a chinchilla rescue in 2023.",
        microchip_id: null,
        personality: ["Energetic", "Nocturnal", "Food-motivated"],
      },
    ],
    post: {
      content: "Ziggy enjoying his evening dust bath ✨ Chinchillas really know how to live.",
      category: "General",
      petImageIndex: 0,
    },
  },
];

const seed = async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, salt);

  for (const account of accounts) {
    const existing = await User.findOne({ where: { email: account.user.email } });
    if (existing) {
      console.log(`[skip] ${account.user.email} already exists — not touching pets/posts`);
      continue;
    }

    const user = await User.create({
      ...account.user,
      password: hashedPassword,
      isVerified: true,
      hasCompletedOnboarding: true,
      role: "owner",
    });
    console.log(`[created] user   → ${user.email} (${user.id})`);

    const petImageUrls: string[] = [];
    for (const petDef of account.pets) {
      const buffer = readImage(petDef.image);
      const imageUrl = await uploadFileToS3(buffer, "image/png", "pets");
      petImageUrls.push(imageUrl);

      const { image, ...petFields } = petDef;
      const pet = await Pet.create({
        ...petFields,
        ownerId: user.id,
        avatar_url: imageUrl,
        city: account.user.city,
        healthStatus: "Healthy",
      });
      console.log(`  [created] pet  → ${pet.name} (${pet.id})`);
    }

    const post = await Post.create({
      userId: user.id,
      userType: "user",
      content: account.post.content,
      category: account.post.category,
      imageUrl: petImageUrls[account.post.petImageIndex],
      status: "approved",
      city: account.user.city,
    });
    console.log(`  [created] post → ${post.id}`);
  }

  console.log(`\nAll accounts share password: ${DEMO_PASSWORD}`);
};

try {
  await seed();
} catch (error: any) {
  console.error(error?.message || error);
  process.exitCode = 1;
} finally {
  await db.sequelize.close();
}
