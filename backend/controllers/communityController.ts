import type { Request, Response } from "express";
import db from "../models/index.ts";

// @desc    Submit a new post for moderation
// @route   POST /api/community/posts
export const createCommunityPost = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post } = db as any;
    const { content, category, imageUrl } = req.body;

    const post = await Post.create({
      userId: req.user.id,
      content,
      category,
      imageUrl,
      status: 'pending', // Always pending by default
    });

    res.status(201).json({ message: "Post submitted for verification", post });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get approved posts for feed (with author, like count, comments)
// @route   GET /api/community/feed
export const getCommunityFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { posts: Post, users: User, comments: Comment, likes: Like } = db as any;
    const posts = await Post.findAll({
      where: { status: 'approved' },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'role', 'avatar_url'] },
        {
          model: Comment,
          as: 'comments',
          include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar_url'] }],
          order: [['createdAt', 'ASC']],
        },
        { model: Like, as: 'likes', attributes: ['userId'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single post by ID (with comments and likes)
// @route   GET /api/community/posts/:id
export const getPostById = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post, users: User, comments: Comment, likes: Like } = db as any;
    const post = await Post.findOne({
      where: { id: req.params.id, status: 'approved' },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'role', 'avatar_url'] },
        {
          model: Comment,
          as: 'comments',
          include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar_url'] }],
        },
        { model: Like, as: 'likes', attributes: ['userId'] },
      ],
    });

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    res.json(post);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle like on a post (like if not liked, unlike if already liked)
// @route   POST /api/community/posts/:id/like
export const toggleLike = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post, likes: Like } = db as any;
    const post = await Post.findOne({ where: { id: req.params.id, status: 'approved' } });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const existingLike = await Like.findOne({
      where: { postId: req.params.id, userId: req.user.id },
    });

    if (existingLike) {
      await existingLike.destroy();
      res.json({ liked: false, message: "Post unliked" });
    } else {
      await Like.create({ postId: req.params.id, userId: req.user.id });
      res.json({ liked: true, message: "Post liked" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a comment to a post
// @route   POST /api/community/posts/:id/comment
export const addComment = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post, users: User, comments: Comment } = db as any;
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ message: "Comment text is required" });
      return;
    }

    const post = await Post.findOne({ where: { id: req.params.id, status: 'approved' } });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const comment = await Comment.create({
      postId: req.params.id,
      userId: req.user.id,
      text: text.trim(),
    });

    // Return the comment with its author details
    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar_url'] }],
    });

    res.status(201).json(commentWithAuthor);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a comment (author only)
// @route   DELETE /api/community/comments/:id
export const deleteComment = async (req: any, res: Response): Promise<void> => {
  try {
    const { comments: Comment } = db as any;
    const comment = await Comment.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!comment) {
      res.status(404).json({ message: "Comment not found or not yours" });
      return;
    }

    await comment.destroy();
    res.json({ message: "Comment deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get community chats (placeholder — returns empty list until chat feature is built)
// @route   GET /api/community/chats
export const getChats = async (_req: Request, res: Response): Promise<void> => {
  res.json([]);
};

// @desc    Get upcoming events
// @route   GET /api/community/events
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { events: Event, users: User, vets: Vet } = db as any;
    let events = await Event.findAll({
      order: [['date', 'ASC']]
    });

    if (events.length === 0) {
      // Seed some initial demo events
      const organizer =
        await User.findOne({ where: { role: 'admin' } }) ||
        await User.findOne({ where: { role: 'owner' } }) ||
        await Vet.findOne() ||
        (req as any).user;
      
      const seedEvents = [
        { organizerId: organizer?.id || null, title: "Puppy Social Mixer", date: "2026-04-15", time: "2:00 PM", location: "Central Park", category: "Social" },
        { organizerId: organizer?.id || null, title: "Vaccination Drive", date: "2026-04-20", time: "9:00 AM", location: "Downtown Center", category: "Health" }
      ];
      
      await Event.bulkCreate(seedEvents);
      events = await Event.findAll({ order: [['date', 'ASC']] });
    }

    res.json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
