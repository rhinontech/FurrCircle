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

    const pets = await Pet.findAll({
      where: {
        id: { [Op.notIn]: excludedPetIds.length ? excludedPetIds : ['00000000-0000-0000-0000-000000000000'] },
        ownerId: { [Op.ne]: req.user.id },
        isBreedingOpen: true,
        species: myPet.species, // same species only
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'avatar_url', 'city'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 30,
    });

    res.json(pets);
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
