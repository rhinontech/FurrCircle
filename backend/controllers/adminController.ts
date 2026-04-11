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

// @desc    Delete (ban) a user
// @route   DELETE /api/admin/users/:userId
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User } = db as any;
    const user = await User.findByPk(req.params.userId);
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    await user.destroy();
    res.json({ message: "User removed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject / remove a vet
// @route   DELETE /api/admin/vets/:vetId
export const deleteVet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vets: Vet } = db as any;
    const vet = await Vet.findByPk(req.params.vetId);
    if (!vet) { res.status(404).json({ message: "Vet not found" }); return; }
    await vet.destroy();
    res.json({ message: "Vet removed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ALL community posts (approved + pending)
// @route   GET /api/admin/posts
export const getAllPosts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { posts: Post, users: User } = db as any;
    const posts = await Post.findAll({
      include: [{ model: User, as: 'author', attributes: ['name', 'role', 'avatar_url'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all events with booking counts and booker details
// @route   GET /api/admin/events
export const getAdminEvents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { events: Event, event_bookings: EventBooking, users: User, vets: Vet } = db as any;
    if (!Event) { res.json([]); return; }

    const events = await Event.findAll({ order: [['date', 'ASC']] });

    const enriched = await Promise.all(events.map(async (event: any) => {
      const bookings = await EventBooking.findAll({ where: { eventId: event.id } });

      // Fetch booker profile for each booking
      const bookers = await Promise.all(bookings.map(async (b: any) => {
        const table = b.userType === 'vet' ? Vet : User;
        const profile = await table.findByPk(b.userId, {
          attributes: ['id', 'name', 'email', 'phone'],
        });
        return profile ? {
          id: b.id,
          userId: b.userId,
          userType: b.userType,
          name: profile.name,
          email: profile.email,
          phone: profile.phone || null,
          note: b.note || null,
          bookedAt: b.createdAt,
        } : null;
      }));

      return {
        ...event.toJSON(),
        attendeeCount: bookings.length,
        bookers: bookers.filter(Boolean),
      };
    }));

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an event
// @route   POST /api/admin/events
export const createAdminEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { events: Event } = db as any;
    const { title, description, date, time, location, category, imageUrl } = req.body;
    const event = await Event.create({ title, description, date, time, location, category, imageUrl, organizerId: (req as any).user?.id });
    res.status(201).json(event);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an event
// @route   PATCH /api/admin/events/:eventId
export const updateAdminEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { events: Event } = db as any;
    const event = await Event.findByPk(req.params.eventId);
    if (!event) { res.status(404).json({ message: "Event not found" }); return; }
    const { title, description, date, time, location, category, imageUrl, status } = req.body;
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (time !== undefined) event.time = time;
    if (location !== undefined) event.location = location;
    if (category !== undefined) event.category = category;
    if (imageUrl !== undefined) event.imageUrl = imageUrl;
    if (status !== undefined) event.status = status;
    await event.save();
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/admin/events/:eventId
export const deleteAdminEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { events: Event } = db as any;
    const event = await Event.findByPk(req.params.eventId);
    if (!event) { res.status(404).json({ message: "Event not found" }); return; }
    await event.destroy();
    res.json({ message: "Event deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pets open for adoption
// @route   GET /api/admin/adoptions
export const getAdoptionPets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { pets: Pet, users: User } = db as any;
    const pets = await Pet.findAll({
      where: { isAdoptionOpen: true },
      include: [{ model: User, as: 'owner', attributes: ['name', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(pets);
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
