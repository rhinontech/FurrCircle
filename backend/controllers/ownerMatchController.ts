import type { Response } from "express";
import { Op } from "sequelize";
import db from "../models/index.ts";
import { createNotification } from "../services/notificationService.ts";

// GET /api/owner-match/cards?lat=<>&lng=<>&radius=<km>
export const getOwnerCards = async (req: any, res: Response): Promise<void> => {
  try {
    const { users: User, pets: Pet, owner_likes: OwnerLike } = db as any;
    const { sequelize } = db as any;

    const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;

    // Exclude already-swiped users
    const alreadySwiped = await OwnerLike.findAll({
      where: { likerId: req.user.id },
      attributes: ['targetId'],
    });
    const excludedIds = alreadySwiped.map((s: any) => s.targetId);
    excludedIds.push(req.user.id); // exclude self

    const where: any = {
      id: { [Op.notIn]: excludedIds },
      role: { [Op.in]: ['owner', 'shelter'] },
      hasCompletedOnboarding: true,
    };

    let attributes: any = { exclude: ['password', 'otpCode', 'otpExpiry', 'resetToken', 'resetTokenExpiry'] };
    let order: any[] = [['createdAt', 'DESC']];

    if (lat && lng) {
      where[Op.and] = [
        sequelize.literal(`
          latitude IS NOT NULL AND longitude IS NOT NULL AND (
            6371 * acos(
              cos(radians(${lat})) *
              cos(radians(latitude)) *
              cos(radians(longitude) - radians(${lng})) +
              sin(radians(${lat})) *
              sin(radians(latitude))
            )
          ) <= 50
        `)
      ];
      attributes = {
        exclude: ['password', 'otpCode', 'otpExpiry', 'resetToken', 'resetTokenExpiry'],
        include: [
          [
            sequelize.literal(`
              6371 * acos(
                cos(radians(${lat})) *
                cos(radians(latitude)) *
                cos(radians(longitude) - radians(${lng})) +
                sin(radians(${lat})) *
                sin(radians(latitude))
              )
            `),
            'distance',
          ],
        ],
      };
      order = [[sequelize.literal('distance ASC')]];
    }

    const owners = await User.findAll({
      where,
      attributes,
      include: [
        {
          model: Pet,
          as: 'pets',
          attributes: ['id', 'name', 'species', 'breed', 'avatar_url'],
          limit: 3,
        },
      ],
      order,
      limit: 30,
    });

    const result = owners.map((o: any) => {
      const data = o.toJSON();
      if (data.distance !== undefined && data.distance !== null) {
        data.distanceLabel = `${parseFloat(data.distance).toFixed(1)} km away`;
      } else if (data.city) {
        data.distanceLabel = data.city;
      }
      return data;
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/owner-match/swipe
export const swipeOwner = async (req: any, res: Response): Promise<void> => {
  try {
    const { users: User, owner_likes: OwnerLike, conversations: Conversation, messages: Message } = db as any;

    const { targetId, direction } = req.body;

    if (!targetId || !direction) {
      res.status(400).json({ message: "targetId and direction are required" });
      return;
    }

    if (!['like', 'pass'].includes(direction)) {
      res.status(400).json({ message: "direction must be 'like' or 'pass'" });
      return;
    }

    await OwnerLike.upsert({
      likerId: req.user.id,
      targetId,
      direction,
      matchedAt: null,
      conversationId: null,
    });

    if (direction === 'pass') {
      res.json({ matched: false });
      return;
    }

    // Check for mutual like
    const mutualLike = await OwnerLike.findOne({
      where: { likerId: targetId, targetId: req.user.id, direction: 'like' },
    });

    if (!mutualLike) {
      res.json({ matched: false });
      return;
    }

    // MATCH — find or create conversation
    const targetUser = await User.findByPk(targetId, { attributes: ['id', 'name', 'avatar_url'] });

    const existingConv = await Conversation.findOne({
      where: {
        [Op.or]: [
          { initiatorId: req.user.id, recipientId: targetId },
          { initiatorId: targetId, recipientId: req.user.id },
        ],
      },
    });

    let conversation = existingConv;
    if (!conversation) {
      conversation = await Conversation.create({
        initiatorId: req.user.id,
        initiatorType: 'user',
        recipientId: targetId,
        recipientType: 'user',
        title: null,
      });

      await Message.create({
        conversationId: conversation.id,
        senderId: req.user.id,
        senderType: 'user',
        text: `🐾 You matched! Start a conversation with a fellow pet parent.`,
      });
    }

    const now = new Date();

    await OwnerLike.update(
      { matchedAt: now, conversationId: conversation.id },
      {
        where: {
          [Op.or]: [
            { likerId: req.user.id, targetId },
            { likerId: targetId, targetId: req.user.id },
          ],
        },
      }
    );

    // Notify target user
    createNotification(
      targetId,
      'user',
      'match',
      "It's a Match! 🐾",
      `You and ${req.user.name?.split(' ')[0] || 'someone'} matched! Say hello.`,
      conversation.id,
      'chat',
      'chat_thread',
      { conversationId: conversation.id },
    ).catch(() => {});

    res.json({ matched: true, conversationId: conversation.id });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
