import type { Response } from "express";
import db from "../models/index.ts";

// @desc    Block a user
// @route   POST /api/blocks/:userId
export const blockUser = async (req: any, res: Response): Promise<void> => {
  try {
    const { user_blocks: UserBlock, follows: Follow } = db as any;
    const blockerId = req.user.id;
    const blockedId = req.params.userId;

    if (blockerId === blockedId) {
      res.status(400).json({ message: "You cannot block yourself" });
      return;
    }

    // Create block (ignore if already exists)
    await UserBlock.findOrCreate({
      where: { blockerId, blockedId },
      defaults: { blockerId, blockedId },
    });

    // Remove any follows between the two users (both directions)
    await Follow.destroy({
      where: {
        followerId: blockerId,
        followingId: blockedId,
      },
    });
    await Follow.destroy({
      where: {
        followerId: blockedId,
        followingId: blockerId,
      },
    });

    res.status(200).json({ success: true, message: "User blocked" });
  } catch (error: any) {
    console.error("blockUser error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unblock a user
// @route   DELETE /api/blocks/:userId
export const unblockUser = async (req: any, res: Response): Promise<void> => {
  try {
    const { user_blocks: UserBlock } = db as any;
    const blockerId = req.user.id;
    const blockedId = req.params.userId;

    await UserBlock.destroy({ where: { blockerId, blockedId } });

    res.status(200).json({ success: true, message: "User unblocked" });
  } catch (error: any) {
    console.error("unblockUser error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get list of users blocked by the current user
// @route   GET /api/blocks
export const getBlockedUsers = async (req: any, res: Response): Promise<void> => {
  try {
    const { user_blocks: UserBlock, users: User } = db as any;
    const blockerId = req.user.id;

    const blocks = await UserBlock.findAll({
      where: { blockerId },
      include: [
        {
          model: User,
          as: "blocked",
          attributes: ["id", "name", "username", "avatar_url"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const result = blocks.map((b: any) => ({
      id: b.id,
      blockedAt: b.createdAt,
      ...b.blocked?.toJSON(),
    }));

    res.status(200).json(result);
  } catch (error: any) {
    console.error("getBlockedUsers error:", error);
    res.status(500).json({ message: error.message });
  }
};
