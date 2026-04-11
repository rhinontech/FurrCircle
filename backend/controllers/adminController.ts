import type { Request, Response } from "express";
import db from "../models/index.ts";

// @desc    Get all pending community posts
// @route   GET /api/admin/pending-posts
export const getPendingPosts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { posts: Post, users: User } = db as any;
    const posts = await Post.findAll({
      where: { status: 'pending' },
      include: [
        { model: User, as: 'author', attributes: ['name', 'role'] }
      ]
    });
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve or Reject a post
// @route   PATCH /api/admin/post-moderation/:postId
export const moderatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { posts: Post } = db as any;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'." });
      return;
    }

    const post = await Post.findByPk(req.params.postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    post.status = status;
    await post.save();

    res.json({ message: `Post ${status} successfully`, post });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unverified veterinarians (from Vet table)
// @route   GET /api/admin/vets/pending
export const getUnverifiedVets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { vets: Vet } = db as any;
    const vets = await Vet.findAll({
      where: { isVerified: false },
      attributes: { exclude: ['password'] }
    });
    res.json(vets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify a veterinarian
// @route   PATCH /api/admin/vets/:vetId/verify
export const verifyVet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vets: Vet } = db as any;
    const vet = await Vet.findByPk(req.params.vetId);
    if (!vet) {
      res.status(404).json({ message: "Veterinarian not found" });
      return;
    }

    vet.isVerified = true;
    await vet.save();

    res.json({ message: "Veterinarian verified successfully", vet });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pets across ecosystem
// @route   GET /api/admin/pets
export const getAllPets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { pets: Pet, users: User } = db as any;
    const pets = await Pet.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['name', 'email'] }
      ]
    });
    res.json(pets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users in the system
// @route   GET /api/admin/users
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { users: User } = db as any;
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all vets (verified and unverified)
// @route   GET /api/admin/vets
export const getAllVets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { vets: Vet } = db as any;
    const vets = await Vet.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(vets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get platform stats overview
// @route   GET /api/admin/stats
export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { posts: Post, users: User, pets: Pet, vets: Vet, appointments: Appointment } = db as any;
    const [totalUsers, totalVets, totalPets, totalPosts, pendingPosts, pendingVets, totalAppointments] = await Promise.all([
      User.count(),
      Vet.count(),
      Pet.count(),
      Post ? Post.count({ where: { status: 'approved' } }) : Promise.resolve(0),
      Post ? Post.count({ where: { status: 'pending' } }) : Promise.resolve(0),
      Vet.count({ where: { isVerified: false } }),
      Appointment ? Appointment.count() : Promise.resolve(0),
    ]);

    res.json({
      totalUsers,
      totalVets,
      totalPets,
      totalPosts,
      pendingPosts,
      pendingVets,
      totalAppointments,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
