import type { Response } from "express";
import { Op } from "sequelize";
import db from "../models/index.ts";
import { createNotification } from "../services/notificationService.ts";

// Haversine distance formula (reused from appointmentController pattern)
const haversineSQL = (lat: number, lng: number) => `
  6371 * acos(
    cos(radians(${lat})) *
    cos(radians(latitude)) *
    cos(radians(longitude) - radians(${lng})) +
    sin(radians(${lat})) *
    sin(radians(latitude))
  )
`;

// GET /api/playdate/cards?petId=<id>&lat=<>&lng=<>&radius=<km>
export const getPlaydateCards = async (req: any, res: Response): Promise<void> => {
  try {
    const { pets: Pet, users: User, playdate_likes: PlaydateLike } = db as any;
    const { sequelize } = db as any;

    const petId = req.query.petId as string;
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 25;

    if (!petId) {
      res.status(400).json({ message: "petId is required" });
      return;
    }

    // Get pets this user has already swiped on (for this type)
    const alreadySwiped = await PlaydateLike.findAll({
      where: { swiperId: req.user.id, type: 'playdate' },
      attributes: ['targetPetId'],
    });
    const excludedPetIds = alreadySwiped.map((s: any) => s.targetPetId);

    const where: any = {
      id: { [Op.notIn]: excludedPetIds.length ? excludedPetIds : ['00000000-0000-0000-0000-000000000000'] },
      ownerId: { [Op.ne]: req.user.id },
    };

    let attributes: any = { exclude: [] };
    let order: any[] = [['createdAt', 'DESC']];

    if (lat && lng) {
      where[Op.and] = [
        sequelize.literal(`(
          SELECT ${haversineSQL(lat, lng)}
          FROM users
          WHERE users.id = pets.owner_id
        ) <= ${radius}`)
      ];
      attributes = {
        include: [
          [
            sequelize.literal(`(
              SELECT ${haversineSQL(lat, lng)}
              FROM users
              WHERE users.id = pets.owner_id
              AND users.latitude IS NOT NULL AND users.longitude IS NOT NULL
            )`),
            'distance',
          ],
        ],
      };
      order = [[sequelize.literal('distance'), 'ASC']];
    }

    const pets = await Pet.findAll({
      where,
      attributes,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'avatar_url', 'city', 'latitude', 'longitude'],
        },
      ],
      order,
      limit: 30,
    });

    // Format distance
    const result = pets.map((p: any) => {
      const data = p.toJSON();
      if (data.distance !== undefined && data.distance !== null) {
        data.distanceLabel = `${parseFloat(data.distance).toFixed(1)} km away`;
      } else if (data.owner?.city) {
        data.distanceLabel = data.owner.city;
      }
      return data;
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/playdate/swipe
export const swipePlaydate = async (req: any, res: Response): Promise<void> => {
  try {
    const { pets: Pet, users: User, playdate_likes: PlaydateLike, conversations: Conversation, messages: Message } = db as any;

    const { targetPetId, swiperPetId, direction } = req.body;

    if (!targetPetId || !swiperPetId || !direction) {
      res.status(400).json({ message: "targetPetId, swiperPetId, and direction are required" });
      return;
    }

    if (!['like', 'pass'].includes(direction)) {
      res.status(400).json({ message: "direction must be 'like' or 'pass'" });
      return;
    }

    // Upsert the swipe record
    const [swipeRecord] = await PlaydateLike.upsert({
      swiperId: req.user.id,
      swiperPetId,
      targetPetId,
      type: 'playdate',
      direction,
      matchedAt: null,
      conversationId: null,
    }, { returning: true });

    if (direction === 'pass') {
      res.json({ matched: false });
      return;
    }

    // Check for mutual like: has the target pet's owner liked swiperPetId?
    const targetPet = await Pet.findByPk(targetPetId, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatar_url'] }],
    });
    if (!targetPet) {
      res.status(404).json({ message: "Target pet not found" });
      return;
    }

    const swiperPet = await Pet.findByPk(swiperPetId, {
      attributes: ['id', 'name', 'avatar_url'],
    });

    const mutualLike = await PlaydateLike.findOne({
      where: {
        swiperId: targetPet.ownerId,
        swiperPetId: targetPetId,
        targetPetId: swiperPetId,
        type: 'playdate',
        direction: 'like',
      },
    });

    if (!mutualLike) {
      res.json({ matched: false });
      return;
    }

    // MATCH — find or create a conversation
    const existingConv = await Conversation.findOne({
      where: {
        [Op.or]: [
          { initiatorId: req.user.id, recipientId: targetPet.ownerId },
          { initiatorId: targetPet.ownerId, recipientId: req.user.id },
        ],
      },
    });

    let conversation = existingConv;
    if (!conversation) {
      conversation = await Conversation.create({
        initiatorId: req.user.id,
        initiatorType: 'user',
        recipientId: targetPet.ownerId,
        recipientType: 'user',
        petId: swiperPetId,
        title: `${swiperPet?.name || 'Your pet'} & ${targetPet.name} matched!`,
      });

      // Seed first message
      await Message.create({
        conversationId: conversation.id,
        senderId: req.user.id,
        senderType: 'user',
        text: `🐾 It's a match! ${swiperPet?.name || 'Your pet'} and ${targetPet.name} want to play together!`,
        petId: swiperPetId,
      });
    }

    const now = new Date();

    // Mark both swipe records as matched
    await PlaydateLike.update(
      { matchedAt: now, conversationId: conversation.id },
      {
        where: {
          [Op.or]: [
            { swiperId: req.user.id, targetPetId, type: 'playdate' },
            { swiperId: targetPet.ownerId, targetPetId: swiperPetId, type: 'playdate' },
          ],
        },
      }
    );

    // Notify target pet's owner
    createNotification(
      targetPet.ownerId,
      'user',
      'match',
      "It's a Playdate Match! 🐾",
      `${swiperPet?.name || 'A pet'} and ${targetPet.name} matched for a playdate!`,
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
