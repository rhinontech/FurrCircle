import type { Response } from "express";
import db from "../models/index.ts";

// @desc    Get all lost and found pets
// @route   GET /api/lost-pets
export const getLostPets = async (req: any, res: Response): Promise<void> => {
  try {
    const { lost_pets: LostPet, users: User } = db as any;
    const list = await LostPet.findAll({
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'username', 'avatar_url'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new lost and found pet post
// @route   POST /api/lost-pets
export const createLostPet = async (req: any, res: Response): Promise<void> => {
  try {
    const { lost_pets: LostPet } = db as any;
    const { imageUrl, name, address, description, status } = req.body;

    if (!imageUrl || !address || !status) {
      res.status(400).json({ message: "Image, address and status are required fields" });
      return;
    }

    if (status !== 'lost' && status !== 'spotted') {
      res.status(400).json({ message: "Status must be either 'lost' or 'spotted'" });
      return;
    }

    const post = await LostPet.create({
      userId: req.user.id,
      imageUrl,
      name: name || null,
      address,
      description: description || null,
      status,
    });

    res.status(201).json(post);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an existing lost and found pet post
// @route   PUT /api/lost-pets/:id
export const updateLostPet = async (req: any, res: Response): Promise<void> => {
  try {
    const { lost_pets: LostPet } = db as any;
    const post = await LostPet.findOne({ where: { id: req.params.id, userId: req.user.id } });

    if (!post) {
      res.status(404).json({ message: "Post not found or unauthorized to update" });
      return;
    }

    const updatableFields = ['imageUrl', 'name', 'address', 'description', 'status'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field];
      }
    });

    await post.save();
    res.json(post);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a lost and found pet post
// @route   DELETE /api/lost-pets/:id
export const deleteLostPet = async (req: any, res: Response): Promise<void> => {
  try {
    const { lost_pets: LostPet } = db as any;
    const post = await LostPet.findOne({ where: { id: req.params.id, userId: req.user.id } });

    if (!post) {
      res.status(404).json({ message: "Post not found or unauthorized to delete" });
      return;
    }

    await post.destroy();
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
