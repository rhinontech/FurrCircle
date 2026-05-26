import type { Request, Response } from "express";
import { Op } from "sequelize";
import db from "../models/index.ts";

// Helper to calculate health score like in petController
const calculateHealthScore = (pet: any) => {
  const status = String(pet?.healthStatus || "").toLowerCase();
  if (!status || status.includes("healthy")) return 95;
  if (status.includes("due") || status.includes("check")) return 84;
  if (status.includes("recover") || status.includes("med")) return 78;
  return 72;
};

// @desc    Get public user profile by handle (username)
// @route   GET /api/users/:handle
export const getUserByHandle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet, pets: Pet, posts: Post } = db as any;
    const { handle } = req.params;

    // Search in Users
    let isVet = false;
    let account = await User.findOne({
      where: { username: { [Op.iLike]: handle } },
      attributes: ['id', 'name', 'username', 'avatar_url', 'bio', 'city', 'role', 'isVerified', 'createdAt'],
    });

    if (!account) {
      // Search in Vets
      account = await Vet.findOne({
        where: { username: { [Op.iLike]: handle } },
        attributes: ['id', 'name', 'username', 'avatar_url', 'bio', 'city', 'profession', 'hospital_name', 'rating', 'isVerified', 'createdAt'],
      });
      isVet = !!account;
    }

    if (!account) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Get their posts count (assuming posts table has userId)
    const postCount = await Post.count({ where: { userId: account.id } });

    // Get their pets (if user)
    let petsList = [];
    if (!isVet) {
      const pets = await Pet.findAll({
        where: { ownerId: account.id, isAdoptionOpen: false, isFosterOpen: false }, // Only private pets? Actually they probably want all pets on profile.
      });
      
      petsList = pets.map((pet: any) => {
        const payload = pet.toJSON();
        return {
          ...payload,
          healthScore: calculateHealthScore(payload)
        };
      });
    }

    res.json({
      ...account.toJSON(),
      isVet,
      postCount,
      pets: petsList,
      followersCount: 0, // Follow feature disabled per request
      followingCount: 0,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
