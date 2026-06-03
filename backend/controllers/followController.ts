import type { Request, Response } from "express";
import { Op } from "sequelize";
import db from "../models/index.ts";
import { createRichNotification } from "../services/notificationService.ts";

export const followUser = async (req: any, res: Response): Promise<void> => {
  try {
    const { follows: Follow, users: User } = db as any;
    const followerId = req.user.id;
    const followingId = req.params.id;

    if (followerId === followingId) {
      res.status(400).json({ message: "You cannot follow yourself" });
      return;
    }

    const targetUser = await User.findByPk(followingId);
    if (!targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const existingFollow = await Follow.findOne({
      where: { followerId, followingId },
    });

    if (existingFollow) {
      res.status(400).json({ message: "Already following or requested" });
      return;
    }

    const status = targetUser.isPrivate ? 'pending' : 'accepted';

    const follow = await Follow.create({
      followerId,
      followingId,
      status,
    });

    if (status === 'accepted') {
      await createRichNotification({
        actorId: followingId,
        actorType: "user",
        category: "social",
        type: "follow",
        title: "New Follower",
        message: `${req.user.name || "Someone"} started following you`,
        relatedId: followerId,
        relatedType: "user",
        actionType: "profile",
        actionPayload: { id: followerId },
      });
    } else {
      await createRichNotification({
        actorId: followingId,
        actorType: "user",
        category: "social",
        type: "follow_request",
        title: "Follow Request",
        message: `${req.user.name || "Someone"} requested to follow you`,
        relatedId: followerId,
        relatedType: "user",
        actionType: "notifications",
        actionPayload: { followId: follow.id, followerId },
        sendPush: true,
      });
    }

    res.status(201).json({ follow, status });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const unfollowUser = async (req: any, res: Response): Promise<void> => {
  try {
    const { follows: Follow } = db as any;
    const followerId = req.user.id;
    const followingId = req.params.id;

    const follow = await Follow.findOne({
      where: { followerId, followingId },
    });

    if (!follow) {
      res.status(404).json({ message: "Not following" });
      return;
    }

    await follow.destroy();
    res.json({ success: true, message: "Unfollowed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptRequest = async (req: any, res: Response): Promise<void> => {
  try {
    const { follows: Follow, users: User } = db as any;
    const followingId = req.user.id;
    const followerId = req.params.followerId;

    const follow = await Follow.findOne({
      where: { followerId, followingId, status: 'pending' },
    });

    if (!follow) {
      res.status(404).json({ message: "Follow request not found" });
      return;
    }

    follow.status = 'accepted';
    await follow.save();

    await createRichNotification({
      actorId: followerId,
      actorType: "user",
      category: "social",
      type: "follow",
      title: "Follow Request Accepted",
      message: `${req.user.name || "Someone"} accepted your follow request`,
      relatedId: followingId,
      relatedType: "user",
      actionType: "profile",
      actionPayload: { id: followingId },
      sendPush: true,
    });

    res.json({ success: true, follow });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectRequest = async (req: any, res: Response): Promise<void> => {
  try {
    const { follows: Follow } = db as any;
    const followingId = req.user.id;
    const followerId = req.params.followerId;

    const follow = await Follow.findOne({
      where: { followerId, followingId, status: 'pending' },
    });

    if (!follow) {
      res.status(404).json({ message: "Follow request not found" });
      return;
    }

    await follow.destroy();

    // Notify the requester their request was declined
    await createRichNotification({
      actorId: followerId,
      actorType: "user",
      category: "social",
      type: "follow_request",
      title: "Follow Request",
      message: `${req.user.name || "Someone"} couldn't accept your follow request`,
      relatedId: followingId,
      relatedType: "user",
      actionType: "profile",
      actionPayload: { id: followingId },
      sendPush: false, // Quiet — no push for rejection, just in-app
    }).catch(() => {}); // fire and forget

    res.json({ success: true, message: "Follow request rejected" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFollowers = async (req: any, res: Response): Promise<void> => {
  try {
    const { follows: Follow, users: User } = db as any;
    const { userId } = req.params;

    const rows = await Follow.findAll({
      where: { followingId: userId, status: 'accepted' },
      include: [{ model: User, as: 'followerUser', attributes: ['id', 'name', 'username', 'profile_photo', 'city', 'verified'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json(rows.map((r: any) => ({
      ...r.followerUser?.toJSON(),
      avatar_url: r.followerUser?.profile_photo,
    })));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFollowing = async (req: any, res: Response): Promise<void> => {
  try {
    const { follows: Follow, users: User } = db as any;
    const { userId } = req.params;

    const rows = await Follow.findAll({
      where: { followerId: userId, status: 'accepted' },
      include: [{ model: User, as: 'followingUser', attributes: ['id', 'name', 'username', 'profile_photo', 'city', 'verified'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json(rows.map((r: any) => ({
      ...r.followingUser?.toJSON(),
      avatar_url: r.followingUser?.profile_photo,
    })));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingRequests = async (req: any, res: Response): Promise<void> => {
  try {
    const { follows: Follow, users: User } = db as any;
    const followingId = req.user.id;

    const requests = await Follow.findAll({
      where: { followingId, status: 'pending' },
      include: [{
        model: User,
        as: 'followerUser',
        attributes: ['id', 'name', 'username', 'avatar_url']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
