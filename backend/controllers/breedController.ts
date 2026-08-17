import type { Response } from "express";
import { Op } from "sequelize";
import db from "../models/index.ts";
import { createNotification } from "../services/notificationService.ts";

// GET /api/breed/cards?petId=<id>
export const getBreedCards = async (req: any, res: Response): Promise<void> => {
  try {
    const { pets: Pet, users: User, playdate_likes: PlaydateLike } = db as any;

    const petId = req.query.petId as string;
    if (!petId) {
      res.status(400).json({ message: "petId is required" });
      return;
    }

    const myPet = await Pet.findByPk(petId);
    if (!myPet || myPet.ownerId !== req.user.id) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    // Only show for pets where breeding is enabled
    if (!myPet.isBreedingOpen) {
      res.status(400).json({ message: "Enable breeding mode on this pet's profile first" });
      return;
    }

    // Exclude already-swiped pets (breed type)
    const alreadySwiped = await PlaydateLike.findAll({
      where: { swiperId: req.user.id, type: 'breed' },
      attributes: ['targetPetId'],
    });
    const excludedPetIds = alreadySwiped.map((s: any) => s.targetPetId);
    excludedPetIds.push(petId); // exclude self

    const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;
    const { sequelize } = db as any;

    const where: any = {
      id: { [Op.notIn]: excludedPetIds.length ? excludedPetIds : ['00000000-0000-0000-0000-000000000000'] },
      ownerId: { [Op.ne]: req.user.id },
      isBreedingOpen: true,
      species: myPet.species, // same species only
    };

    let attributes: any = { exclude: [] };
    let order: any[] = [['createdAt', 'DESC']];

    if (lat && lng) {
      where[Op.and] = [
        sequelize.literal(`(
          SELECT 6371 * acos(
            cos(radians(${lat})) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lng})) +
            sin(radians(${lat})) *
            sin(radians(latitude))
          )
          FROM users
          WHERE users.id = pets.owner_id
        ) <= 100`)
      ];
      attributes = {
        include: [
          [
            sequelize.literal(`(
              SELECT 6371 * acos(
                cos(radians(${lat})) *
                cos(radians(latitude)) *
                cos(radians(longitude) - radians(${lng})) +
                sin(radians(${lat})) *
                sin(radians(latitude))
              )
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

// POST /api/breed/swipe
export const swipeBreed = async (req: any, res: Response): Promise<void> => {
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

    await PlaydateLike.upsert({
      swiperId: req.user.id,
      swiperPetId,
      targetPetId,
      type: 'breed',
      direction,
      matchedAt: null,
      conversationId: null,
    });

    if (direction === 'pass') {
      res.json({ matched: false });
      return;
    }

    // Check mutual like
    const targetPet = await Pet.findByPk(targetPetId, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatar_url'] }],
    });
    if (!targetPet) {
      res.status(404).json({ message: "Target pet not found" });
      return;
    }

    const swiperPet = await Pet.findByPk(swiperPetId, { attributes: ['id', 'name', 'avatar_url'] });

    const mutualLike = await PlaydateLike.findOne({
      where: {
        swiperId: targetPet.ownerId,
        swiperPetId: targetPetId,
        targetPetId: swiperPetId,
        type: 'breed',
        direction: 'like',
      },
    });

    if (!mutualLike) {
      res.json({ matched: false });
      return;
    }

    // MATCH
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
        title: `${swiperPet?.name || 'Your pet'} & ${targetPet.name} — Breed Match`,
      });

      await Message.create({
        conversationId: conversation.id,
        senderId: req.user.id,
        senderType: 'user',
        text: `🐾 It's a breed match! ${swiperPet?.name || 'Your pet'} and ${targetPet.name} are compatible.`,
        petId: swiperPetId,
      });
    }

    const now = new Date();

    await PlaydateLike.update(
      { matchedAt: now, conversationId: conversation.id },
      {
        where: {
          [Op.or]: [
            { swiperId: req.user.id, targetPetId, type: 'breed' },
            { swiperId: targetPet.ownerId, targetPetId: swiperPetId, type: 'breed' },
          ],
        },
      }
    );

    createNotification(
      targetPet.ownerId,
      'user',
      'match',
      "It's a Breed Match! 🐾",
      `${swiperPet?.name || 'A pet'} and ${targetPet.name} are a breeding match!`,
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

// GET /api/breed/matches — the current user's matched breed requests
export const getBreedMatches = async (req: any, res: Response): Promise<void> => {
  try {
    const { playdate_likes: PlaydateLike, pets: Pet, users: User } = db as any;

    const matches = await PlaydateLike.findAll({
      where: {
        swiperId: req.user.id,
        type: 'breed',
        matchedAt: { [Op.ne]: null },
        conversationId: { [Op.ne]: null },
      },
      include: [
        {
          model: Pet,
          as: 'targetPet',
          attributes: ['id', 'name', 'species', 'breed', 'city', 'avatar_url', 'ownerId'],
          include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatar_url', 'city'] }],
        },
        { model: Pet, as: 'swiperPet', attributes: ['id', 'name', 'avatar_url'] },
      ],
      order: [['matchedAt', 'DESC']],
    });

    const result = matches
      .map((m: any) => m.toJSON())
      .filter((m: any) => m.targetPet) // skip any orphaned records
      .map((m: any) => ({
        id: m.id,
        conversationId: m.conversationId,
        matchedAt: m.matchedAt,
        pet: m.targetPet,
        myPet: m.swiperPet || null,
        owner: m.targetPet?.owner || null,
      }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
