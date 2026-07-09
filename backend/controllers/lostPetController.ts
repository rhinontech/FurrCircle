import type { Response } from "express";
import db from "../models/index.ts";
import { Op } from "sequelize";

// @desc    Get all lost and found pets
// @route   GET /api/lost-pets
export const getLostPets = async (req: any, res: Response): Promise<void> => {
  try {
    const { lost_pets: LostPet, users: User } = db as any;
    const { sequelize } = db as any;

    const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;

    const where: any = {};
    let attributes: any = { exclude: [] };
    let order: any[] = [['createdAt', 'DESC']];

    if (lat && lng) {
      const distanceSql = `(
        SELECT 6371 * acos(
          cos(radians(${lat})) *
          cos(radians(COALESCE(lost_pets.latitude, users.latitude))) *
          cos(radians(COALESCE(lost_pets.longitude, users.longitude)) - radians(${lng})) +
          sin(radians(${lat})) *
          sin(radians(COALESCE(lost_pets.latitude, users.latitude)))
        )
        FROM users
        WHERE users.id = lost_pets."userId"
      )`;

      where[Op.and] = [
        sequelize.literal(`${distanceSql} <= 150`)
      ];
      attributes = {
        include: [
          [
            sequelize.literal(distanceSql),
            'distance',
          ],
        ],
      };
      order = [[sequelize.literal('distance'), 'ASC']];
    }

    const list = await LostPet.findAll({
      where,
      attributes,
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'username', 'avatar_url', 'city'] }],
      order,
    });

    const enrichedList = list.map((item: any) => {
      const payload = item.toJSON ? item.toJSON() : item;
      const data: any = { ...payload };
      if (item.getDataValue('distance') !== undefined && item.getDataValue('distance') !== null) {
        data.distance = parseFloat(item.getDataValue('distance'));
        data.distanceLabel = `${data.distance.toFixed(1)} km away`;
      } else if (payload.author?.city) {
        data.distanceLabel = payload.author.city;
      }
      return data;
    });

    res.json(enrichedList);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new lost and found pet post
// @route   POST /api/lost-pets
export const createLostPet = async (req: any, res: Response): Promise<void> => {
  try {
    const { lost_pets: LostPet } = db as any;
    const { imageUrl, name, address, description, status, latitude, longitude, images } = req.body;

    const finalImages = Array.isArray(images) ? images : [];
    let finalImageUrl = imageUrl;
    if (finalImages.length > 0 && !finalImageUrl) {
      finalImageUrl = finalImages[0];
    }

    if (!finalImageUrl || !address || !status) {
      res.status(400).json({ message: "Image, address and status are required fields" });
      return;
    }

    if (status !== 'lost' && status !== 'spotted') {
      res.status(400).json({ message: "Status must be either 'lost' or 'spotted'" });
      return;
    }

    const post = await LostPet.create({
      userId: req.user.id,
      imageUrl: finalImageUrl,
      name: name || null,
      address,
      description: description || null,
      status,
      latitude: latitude != null ? parseFloat(latitude) : null,
      longitude: longitude != null ? parseFloat(longitude) : null,
      images: finalImages,
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

    const updatableFields = ['imageUrl', 'name', 'address', 'description', 'status', 'latitude', 'longitude', 'images'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'latitude' || field === 'longitude') {
          post[field] = req.body[field] != null ? parseFloat(req.body[field]) : null;
        } else {
          post[field] = req.body[field];
        }
      }
    });

    // Keep legacy imageUrl field in sync if images array is modified
    if (req.body.images !== undefined && Array.isArray(req.body.images)) {
      if (req.body.images.length > 0) {
        post.imageUrl = req.body.images[0];
      }
    }

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
