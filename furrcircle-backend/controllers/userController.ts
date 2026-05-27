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
export const getUserByHandle = async (req: any, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet, pets: Pet, posts: Post } = db as any;
    const { handle } = req.params;

    // Search in Users
    let isVet = false;
    let account = await User.findOne({
      where: { username: { [Op.iLike]: handle } },
      attributes: ['id', 'name', 'username', 'avatar_url', 'bio', 'city', 'role', 'isVerified', 'createdAt', 'isPrivate'],
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
    let postCount = await Post.count({ where: { userId: account.id } });

    const { follows: Follow } = db as any;
    const followersCount = await Follow.count({ where: { followingId: account.id, status: 'accepted' } });
    const followingCount = await Follow.count({ where: { followerId: account.id, status: 'accepted' } });

    let followStatus = 'none';
    if (req.user && req.user.id !== account.id) {
      const follow = await Follow.findOne({
        where: { followerId: req.user.id, followingId: account.id }
      });
      if (follow) {
        followStatus = follow.status;
      }
    } else if (req.user && req.user.id === account.id) {
      followStatus = 'self';
    }

    const isPrivate = !isVet && account.isPrivate;
    const canViewContent = followStatus === 'accepted' || followStatus === 'self' || !isPrivate;

    let petsList = [];
    if (!isVet && canViewContent) {
      const pets = await Pet.findAll({
        where: { ownerId: account.id, isAdoptionOpen: false, isFosterOpen: false }, 
      });
      
      petsList = pets.map((pet: any) => {
        const payload = pet.toJSON();
        return {
          ...payload,
          healthScore: calculateHealthScore(payload)
        };
      });
    }

    if (!canViewContent) {
      postCount = 0; // Hide post count if private
    }

    res.json({
      ...account.toJSON(),
      isVet,
      postCount,
      pets: petsList,
      followersCount,
      followingCount,
      followStatus,
      isPrivate,
      canViewContent,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const { users: User } = db as any;
    const userId = req.user.id;
    const { isPrivate } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (isPrivate !== undefined) {
      user.isPrivate = isPrivate;
    }

    await user.save();
    res.json({ success: true, isPrivate: user.isPrivate });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
