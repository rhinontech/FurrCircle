import type { Response } from "express";
import { Op } from "sequelize";
import db from "../models/index.ts";

const toPlain = (value: any) => (value && typeof value.toJSON === "function" ? value.toJSON() : value);

const createProfileResolver = () => {
  const cache = new Map<string, any>();

  return async (id?: string | null, type?: "user" | "vet") => {
    if (!id) {
      return null;
    }

    const cacheKey = `${type || "any"}:${id}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const { users: User, vets: Vet } = db as any;

    let record = null;
    let resolvedType = type;

    if (type === "user") {
      record = await User.findByPk(id, { attributes: { exclude: ["password"] } });
    } else if (type === "vet") {
      record = await Vet.findByPk(id, { attributes: { exclude: ["password"] } });
    } else {
      record = await User.findByPk(id, { attributes: { exclude: ["password"] } });
      if (record) {
        resolvedType = "user";
      } else {
        record = await Vet.findByPk(id, { attributes: { exclude: ["password"] } });
        resolvedType = record ? "vet" : undefined;
      }
    }

    if (!record) {
      cache.set(cacheKey, null);
      return null;
    }

    const payload = toPlain(record);
    const profile = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: resolvedType === "vet" ? "veterinarian" : payload.role || "owner",
      avatar_url: payload.avatar_url,
      isVerified: payload.isVerified,
      clinic_name: payload.clinic_name || payload.hospital_name,
      specialty: payload.specialty || payload.profession,
      yearsExp: payload.yearsExp || payload.experience,
      bio: payload.bio,
      city: payload.city,
      phone: payload.phone,
      rating: payload.rating,
    };

    cache.set(cacheKey, profile);
    cache.set(`${resolvedType || "any"}:${id}`, profile);
    cache.set(`any:${id}`, profile);
    return profile;
  };
};

const serializeComment = async (comment: any, resolveProfile: ReturnType<typeof createProfileResolver>) => {
  const payload = toPlain(comment);

  return {
    ...payload,
    author: await resolveProfile(payload.userId),
  };
};

const serializeMessage = async (message: any, resolveProfile: ReturnType<typeof createProfileResolver>) => {
  const payload = toPlain(message);

  return {
    ...payload,
    sender: await resolveProfile(payload.senderId, payload.senderType === "vet" ? "vet" : "user"),
  };
};

const serializePost = async (
  post: any,
  resolveProfile: ReturnType<typeof createProfileResolver>
) => {
  const payload = toPlain(post);
  const comments = await Promise.all(
    (payload.comments || [])
      .slice()
      .sort((a: any, b: any) => `${a.createdAt || ""}`.localeCompare(`${b.createdAt || ""}`))
      .map((comment: any) => serializeComment(comment, resolveProfile))
  );

  return {
    ...payload,
    author: await resolveProfile(payload.userId),
    comments,
    likes: (payload.likes || []).map((like: any) => ({ userId: like.userId })),
    savedBy: (payload.savedPosts || []).map((entry: any) => entry.userId),
    shareCount: payload.shareCount || 0,
  };
};

const serializeEvent = async (
  event: any,
  currentUserId: string,
  currentUserType: string,
  resolveProfile: ReturnType<typeof createProfileResolver>
) => {
  const payload = toPlain(event);
  const bookings = (payload.bookings || []).map((booking: any) => toPlain(booking));
  const host = await resolveProfile(payload.organizerId);

  return {
    ...payload,
    host,
    venue: payload.venue || payload.location,
    address: payload.address || payload.location,
    bookings,
    attendeeCount: bookings.length || payload.attendeeCount || 0,
    attendees: payload.capacity ? `${bookings.length || 0}/${payload.capacity} booked` : payload.attendees,
    contactEmail: payload.contactEmail || host?.email || null,
    isBooked: bookings.some((booking: any) => booking.userId === currentUserId && booking.userType === currentUserType),
  };
};

const serializeConversation = async (
  conversation: any,
  currentUserId: string,
  resolveProfile: ReturnType<typeof createProfileResolver>
) => {
  const payload = toPlain(conversation);
  const participants = (
    await Promise.all([
      resolveProfile(payload.initiatorId, payload.initiatorType === "vet" ? "vet" : "user"),
      resolveProfile(payload.recipientId, payload.recipientType === "vet" ? "vet" : "user"),
    ])
  ).filter(Boolean);
  const otherParticipants = participants.filter((participant: any) => participant.id !== currentUserId);
  const messages = await Promise.all(
    (payload.messages || [])
      .slice()
      .sort((a: any, b: any) => `${a.createdAt || ""}`.localeCompare(`${b.createdAt || ""}`))
      .map((message: any) => serializeMessage(message, resolveProfile))
  );
  const lastMessage = messages[messages.length - 1] || null;

  return {
    ...payload,
    title: payload.title || otherParticipants[0]?.clinic_name || otherParticipants[0]?.name || payload.pet?.name || "Conversation",
    participants,
    otherParticipants,
    pet: payload.pet ? toPlain(payload.pet) : null,
    messages,
    lastMessage,
  };
};

const isConversationParticipant = (conversation: any, req: any) => {
  return (
    (conversation.initiatorId === req.user.id && conversation.initiatorType === req.userType) ||
    (conversation.recipientId === req.user.id && conversation.recipientType === req.userType)
  );
};

const fetchConversation = async (conversationId: string) => {
  const { conversations: Conversation, messages: Message, pets: Pet } = db as any;

  return Conversation.findByPk(conversationId, {
    include: [
      { model: Message, as: "messages" },
      { model: Pet, as: "pet", attributes: ["id", "name", "species", "breed", "city", "avatar_url"] },
    ],
  });
};

const seedEventsIfNeeded = async (req: any) => {
  const { events: Event, users: User, vets: Vet } = db as any;
  let events = await Event.findAll({ order: [["date", "ASC"], ["time", "ASC"]] });

  if (events.length > 0) {
    return events;
  }

  const organizer =
    (await User.findOne({ where: { role: "admin" } })) ||
    (await User.findOne({ where: { role: "owner" } })) ||
    (await Vet.findOne()) ||
    req.user;

  await Event.bulkCreate([
    {
      organizerId: organizer?.id || null,
      title: "Puppy Social Mixer",
      description: "An afternoon meet-up for playful pups and their humans to socialize and swap care tips.",
      date: "2026-04-15",
      time: "14:00",
      location: "Central Park Pavilion",
      category: "Social",
      imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
    },
    {
      organizerId: organizer?.id || null,
      title: "Vaccination Drive",
      description: "Community vaccination day with quick wellness checks and preventive care guidance.",
      date: "2026-04-20",
      time: "09:00",
      location: "Downtown Pet Wellness Center",
      category: "Health",
      imageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
    },
  ]);

  events = await Event.findAll({ order: [["date", "ASC"], ["time", "ASC"]] });
  return events;
};

// @desc    Submit a new post for moderation
// @route   POST /api/community/posts
export const createCommunityPost = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post } = db as any;
    const { content, category, imageUrl } = req.body;

    if (!String(content || "").trim()) {
      res.status(400).json({ message: "Post content is required" });
      return;
    }

    const post = await Post.create({
      userId: req.user.id,
      content: String(content).trim(),
      category,
      imageUrl,
      status: "pending",
    });

    const resolveProfile = createProfileResolver();
    res.status(201).json({
      message: "Post submitted for verification",
      post: await serializePost(post, resolveProfile),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get approved posts for feed
// @route   GET /api/community/feed
export const getCommunityFeed = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post, comments: Comment, likes: Like, saved_posts: SavedPost } = db as any;
    const posts = await Post.findAll({
      where: { status: "approved" },
      include: [
        { model: Comment, as: "comments" },
        { model: Like, as: "likes", attributes: ["userId"] },
        { model: SavedPost, as: "savedPosts", attributes: ["userId", "userType"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const resolveProfile = createProfileResolver();
    const serialized = await Promise.all(posts.map((post: any) => serializePost(post, resolveProfile)));
    res.json(serialized);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single post by ID
// @route   GET /api/community/posts/:id
export const getPostById = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post, comments: Comment, likes: Like, saved_posts: SavedPost } = db as any;
    const post = await Post.findOne({
      where: { id: req.params.id, status: "approved" },
      include: [
        { model: Comment, as: "comments" },
        { model: Like, as: "likes", attributes: ["userId"] },
        { model: SavedPost, as: "savedPosts", attributes: ["userId", "userType"] },
      ],
    });

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const resolveProfile = createProfileResolver();
    res.json(await serializePost(post, resolveProfile));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle like on a post
// @route   POST /api/community/posts/:id/like
export const toggleLike = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post, likes: Like } = db as any;
    const post = await Post.findOne({ where: { id: req.params.id, status: "approved" } });
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
      return;
    }

    await Like.create({ postId: req.params.id, userId: req.user.id });
    res.json({ liked: true, message: "Post liked" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle save on a post
// @route   POST /api/community/posts/:id/save
export const toggleSave = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post, saved_posts: SavedPost } = db as any;
    const post = await Post.findOne({ where: { id: req.params.id, status: "approved" } });

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const where = {
      postId: req.params.id,
      userId: req.user.id,
      userType: req.userType || "user",
    };

    const existingSave = await SavedPost.findOne({ where });
    if (existingSave) {
      await existingSave.destroy();
      res.json({ saved: false });
      return;
    }

    await SavedPost.create(where);
    res.json({ saved: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Increment share count on a post
// @route   POST /api/community/posts/:id/share
export const sharePost = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post } = db as any;
    const post = await Post.findOne({ where: { id: req.params.id, status: "approved" } });

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    post.shareCount = Number(post.shareCount || 0) + 1;
    await post.save();

    res.json({ shareCount: post.shareCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a comment to a post
// @route   POST /api/community/posts/:id/comment
export const addComment = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post, comments: Comment } = db as any;
    const { text } = req.body;

    if (!String(text || "").trim()) {
      res.status(400).json({ message: "Comment text is required" });
      return;
    }

    const post = await Post.findOne({ where: { id: req.params.id, status: "approved" } });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const comment = await Comment.create({
      postId: req.params.id,
      userId: req.user.id,
      text: String(text).trim(),
    });

    const resolveProfile = createProfileResolver();
    res.status(201).json({ comment: await serializeComment(comment, resolveProfile) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a comment
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

// @desc    Get upcoming events
// @route   GET /api/community/events
export const getEvents = async (req: any, res: Response): Promise<void> => {
  try {
    const { event_bookings: EventBooking } = db as any;
    const events = await seedEventsIfNeeded(req);

    const eventsWithBookings = await Promise.all(
      events.map(async (event: any) => ({
        ...toPlain(event),
        bookings: await EventBooking.findAll({ where: { eventId: event.id } }),
      }))
    );

    const resolveProfile = createProfileResolver();
    const serialized = await Promise.all(
      eventsWithBookings.map((event: any) => serializeEvent(event, req.user.id, req.userType || "user", resolveProfile))
    );

    res.json(serialized);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get event details
// @route   GET /api/community/events/:id
export const getEventById = async (req: any, res: Response): Promise<void> => {
  try {
    const { events: Event, event_bookings: EventBooking } = db as any;
    await seedEventsIfNeeded(req);

    const event = await Event.findByPk(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const eventPayload = {
      ...toPlain(event),
      bookings: await EventBooking.findAll({ where: { eventId: req.params.id } }),
    };

    const resolveProfile = createProfileResolver();
    res.json(await serializeEvent(eventPayload, req.user.id, req.userType || "user", resolveProfile));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Book an event
// @route   POST /api/community/events/:id/book
export const bookEvent = async (req: any, res: Response): Promise<void> => {
  try {
    const { events: Event, event_bookings: EventBooking } = db as any;
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const where = {
      eventId: req.params.id,
      userId: req.user.id,
      userType: req.userType || "user",
    };

    let booking = await EventBooking.findOne({ where });
    if (!booking) {
      booking = await EventBooking.create({
        ...where,
        note: req.body?.note || "",
        status: "booked",
      });
    }

    const eventPayload = {
      ...toPlain(event),
      bookings: await EventBooking.findAll({ where: { eventId: req.params.id } }),
    };

    const resolveProfile = createProfileResolver();
    res.json({
      booking: { ...toPlain(booking), user: await resolveProfile(req.user.id, req.userType || "user") },
      event: await serializeEvent(eventPayload, req.user.id, req.userType || "user", resolveProfile),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get community chats
// @route   GET /api/community/chats
export const getChats = async (req: any, res: Response): Promise<void> => {
  try {
    const { conversations: Conversation, messages: Message, pets: Pet } = db as any;
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { initiatorId: req.user.id, initiatorType: req.userType || "user" },
          { recipientId: req.user.id, recipientType: req.userType || "user" },
        ],
      },
      include: [
        { model: Message, as: "messages" },
        { model: Pet, as: "pet", attributes: ["id", "name", "species", "breed", "city", "avatar_url"] },
      ],
      order: [["updatedAt", "DESC"]],
    });

    const resolveProfile = createProfileResolver();
    const serialized = await Promise.all(
      conversations.map((conversation: any) => serializeConversation(conversation, req.user.id, resolveProfile))
    );

    serialized.sort((a: any, b: any) => {
      const aDate = a.lastMessage?.createdAt || a.updatedAt || a.createdAt;
      const bDate = b.lastMessage?.createdAt || b.updatedAt || b.createdAt;
      return `${bDate || ""}`.localeCompare(`${aDate || ""}`);
    });

    res.json(serialized);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single community chat
// @route   GET /api/community/chats/:id
export const getChatById = async (req: any, res: Response): Promise<void> => {
  try {
    const conversation = await fetchConversation(req.params.id);

    if (!conversation || !isConversationParticipant(conversation, req)) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    const resolveProfile = createProfileResolver();
    res.json(await serializeConversation(conversation, req.user.id, resolveProfile));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message in a chat
// @route   POST /api/community/chats/:id/messages
export const sendMessage = async (req: any, res: Response): Promise<void> => {
  try {
    const { messages: Message } = db as any;
    const conversation = await fetchConversation(req.params.id);

    if (!conversation || !isConversationParticipant(conversation, req)) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    const text = String(req.body?.text || "").trim();
    if (!text) {
      res.status(400).json({ message: "Message cannot be empty" });
      return;
    }

    const message = await Message.create({
      conversationId: conversation.id,
      senderId: req.user.id,
      senderType: req.userType || "user",
      text,
      petId: req.body?.petId || conversation.petId || null,
    });

    await conversation.update({ updatedAt: new Date() } as any);

    const refreshedConversation = await fetchConversation(conversation.id);
    const resolveProfile = createProfileResolver();
    res.status(201).json({
      message: await serializeMessage(message, resolveProfile),
      conversation: await serializeConversation(refreshedConversation, req.user.id, resolveProfile),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Start or reuse a chat
// @route   POST /api/community/chats/start
export const startChat = async (req: any, res: Response): Promise<void> => {
  try {
    const { conversations: Conversation, messages: Message } = db as any;
    const recipientId = String(req.body?.recipientId || "").trim();
    const petId = req.body?.petId ? String(req.body.petId) : null;
    const firstMessage = String(req.body?.message || req.body?.text || "").trim();
    const resolveProfile = createProfileResolver();

    if (!recipientId) {
      res.status(400).json({ message: "Recipient is required" });
      return;
    }

    const recipient = await resolveProfile(recipientId, req.body?.recipientType === "vet" ? "vet" : undefined);
    if (!recipient) {
      res.status(404).json({ message: "Recipient not found" });
      return;
    }

    if (recipient.id === req.user.id) {
      res.status(400).json({ message: "Cannot start a chat with yourself" });
      return;
    }

    const recipientType = recipient.role === "veterinarian" ? "vet" : "user";

    const where: any = {
      [Op.or]: [
        {
          initiatorId: req.user.id,
          initiatorType: req.userType || "user",
          recipientId,
          recipientType,
        },
        {
          initiatorId: recipientId,
          initiatorType: recipientType,
          recipientId: req.user.id,
          recipientType: req.userType || "user",
        },
      ],
    };

    if (petId) {
      where.petId = petId;
    }

    let conversation = await Conversation.findOne({ where });
    if (!conversation) {
      conversation = await Conversation.create({
        initiatorId: req.user.id,
        initiatorType: req.userType || "user",
        recipientId,
        recipientType,
        petId,
        title: req.body?.title || null,
      });
    }

    if (firstMessage) {
      await Message.create({
        conversationId: conversation.id,
        senderId: req.user.id,
        senderType: req.userType || "user",
        text: firstMessage,
        petId,
      });
      await conversation.update({ updatedAt: new Date() } as any);
    }

    const refreshedConversation = await fetchConversation(conversation.id);
    res.status(201).json(await serializeConversation(refreshedConversation, req.user.id, resolveProfile));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
