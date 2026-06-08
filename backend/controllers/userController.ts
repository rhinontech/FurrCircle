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
    const { users: User, vets: Vet, pets: Pet, posts: Post, user_blocks: UserBlock } = db as any;
    const { handle } = req.params;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(handle);

    // Search in Users
    let isVet = false;
    let account = await User.findOne({
      where: { username: { [Op.iLike]: handle } },
      attributes: ['id', 'name', 'username', 'avatar_url', 'bio', 'city', 'role', 'isVerified', 'createdAt', 'isPrivate'],
    });

    if (!account && isUUID) {
      account = await User.findByPk(handle, {
        attributes: ['id', 'name', 'username', 'avatar_url', 'bio', 'city', 'role', 'isVerified', 'createdAt', 'isPrivate'],
      });
    }

    if (!account) {
      // Search in Vets
      account = await Vet.findOne({
        where: { username: { [Op.iLike]: handle } },
        attributes: ['id', 'name', 'username', 'avatar_url', 'bio', 'city', 'profession', 'hospital_name', 'rating', 'isVerified', 'createdAt'],
      });
      isVet = !!account;

      if (!account && isUUID) {
        account = await Vet.findByPk(handle, {
          attributes: ['id', 'name', 'username', 'avatar_url', 'bio', 'city', 'profession', 'hospital_name', 'rating', 'isVerified', 'createdAt'],
        });
        isVet = !!account;
      }
    }

    if (!account) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if either party has blocked the other
    if (req.user && req.user.id !== account.id && !isVet) {
      const block = await UserBlock.findOne({
        where: {
          [Op.or]: [
            { blockerId: req.user.id, blockedId: account.id },
            { blockerId: account.id, blockedId: req.user.id },
          ],
        },
      });
      if (block) {
        const iBlockedThem = block.blockerId === req.user.id;
        // Return minimal response — don't reveal who blocked whom beyond iBlockedThem
        res.status(200).json({
          id: account.id,
          name: account.name,
          username: account.username,
          avatar_url: null,
          isBlocked: true,
          iBlockedThem,
          canViewContent: false,
          followStatus: 'none',
        });
        return;
      }
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
        where: { ownerId: account.id }, 
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
      isBlocked: false,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const { users: User } = db as any;
    const userId = req.user.id;
    const { isPrivate, name, username, city, address, bio, avatar_url, latitude, longitude, twoFactorEnabled } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (username && username.toLowerCase() !== user.username?.toLowerCase()) {
      const existing = await User.findOne({ where: { username: { [Op.iLike]: username } } });
      if (existing) {
        res.status(400).json({ message: "Username is already taken" });
        return;
      }
      user.username = username;
    }

    if (isPrivate !== undefined) user.isPrivate = isPrivate;
    if (name !== undefined) user.name = name;
    if (city !== undefined) user.city = city;
    if (address !== undefined) user.address = address;
    if (bio !== undefined) user.bio = bio;
    if (avatar_url !== undefined) user.avatar_url = avatar_url;
    if (latitude !== undefined) user.latitude = latitude;
    if (longitude !== undefined) user.longitude = longitude;
    if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;

    await user.save();
    res.json({ success: true, user: user.toJSON() });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const searchUsers = async (req: any, res: Response): Promise<void> => {
  try {
    const { users: User } = db as any;
    const q = String(req.query.q || "").trim();
    if (!q) { res.json([]); return; }

    const { follows: Follow } = db as any;
    const currentUserId = req.user.id;

    // Find all accepted follow relationships involving req.user.id
    const followRecords = await Follow.findAll({
      where: {
        [Op.or]: [
          { followerId: currentUserId },
          { followingId: currentUserId }
        ],
        status: 'accepted'
      },
      attributes: ['followerId', 'followingId']
    });

    const relatedUserIds = Array.from(new Set(
      followRecords.flatMap((f: any) => [f.followerId, f.followingId])
    )).filter(id => id !== currentUserId);

    if (relatedUserIds.length === 0) {
      res.json([]);
      return;
    }

    const users = await User.findAll({
      where: {
        id: { [Op.in]: relatedUserIds },
        isVerified: true,
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { username: { [Op.iLike]: `%${q}%` } },
        ],
      },
      attributes: ['id', 'name', 'username', 'avatar_url', 'city', 'bio'],
      limit: 20,
    });

    const results = await Promise.all(users.map(async (u: any) => {
      const data = u.toJSON();
      let followStatus = 'none';
      if (req.user && req.user.id !== data.id) {
        const follow = await Follow.findOne({ where: { followerId: req.user.id, followingId: data.id } });
        if (follow) followStatus = follow.status;
      } else if (req.user && req.user.id === data.id) {
        followStatus = 'self';
      }
      const followersCount = await Follow.count({ where: { followingId: data.id, status: 'accepted' } });
      return { ...data, followStatus, followersCount };
    }));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search ALL active users (for Circle / community discover — no follow restriction)
// @route   GET /api/users/all-search?q=...
export const searchAllUsers = async (req: any, res: Response): Promise<void> => {
  try {
    const { users: User, follows: Follow } = db as any;
    const q = String(req.query.q || "").trim();
    const currentUserId = req.user.id;

    const whereClause: Record<string, any> = {
      id: { [Op.ne]: currentUserId }, // exclude self
      isVerified: true,
    };

    if (q) {
      whereClause[Op.or as any] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { username: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'username', 'avatar_url', 'city', 'bio'],
      limit: 30,
      order: [['name', 'ASC']],
    });

    const results = await Promise.all(users.map(async (u: any) => {
      const data = u.toJSON();
      let followStatus = 'none';
      const follow = await Follow.findOne({ where: { followerId: currentUserId, followingId: data.id } });
      if (follow) followStatus = follow.status;
      const followersCount = await Follow.count({ where: { followingId: data.id, status: 'accepted' } });
      return { ...data, followStatus, followersCount };
    }));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search only among users who follow the current user (for Share To / New Chat)
// @route   GET /api/users/followers-search?q=...
export const searchFollowers = async (req: any, res: Response): Promise<void> => {
  try {
    const { users: User, follows: Follow } = db as any;
    const q = String(req.query.q || "").trim();
    const currentUserId = req.user.id;

    // Get all accepted follows involving the current user (either follower or following)
    const followRows = await Follow.findAll({
      where: {
        [Op.or]: [
          { followingId: currentUserId, status: 'accepted' },
          { followerId: currentUserId, status: 'accepted' }
        ]
      },
      attributes: ['followerId', 'followingId'],
    });

    const followerIds: string[] = Array.from(new Set(
      followRows.map((r: any) => r.followerId === currentUserId ? r.followingId : r.followerId)
    ));

    if (followerIds.length === 0) {
      res.json([]);
      return;
    }

    const whereClause: Record<string, any> = {
      id: { [Op.in]: followerIds },
      isVerified: true,
    };

    if (q) {
      whereClause[Op.or as any] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { username: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'username', 'avatar_url', 'city', 'bio'],
      limit: 50,
    });

    res.json(users.map((u: any) => u.toJSON()));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
