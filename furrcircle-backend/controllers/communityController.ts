import type { Response } from "express";
import { Op } from "sequelize";
import db from "../models/index.ts";
import { createNotification, createRichNotification } from "../services/notificationService.ts";
import { sendEmail } from "../services/emailService.ts";
import { emitToActor, isUserOnline } from "../services/realtimeService.ts";

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
      username: payload.username,
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
  const authorType = payload.userType === "vet" ? "vet" : "user";

  return {
    ...payload,
    author: await resolveProfile(payload.userId, authorType),
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

  const postAuthorType = payload.userType === "vet" ? "vet" : "user";

  return {
    ...payload,
    author: await resolveProfile(payload.userId, postAuthorType),
    comments,
    likes: (payload.likes || []).map((like: any) => ({ userId: like.userId, userType: like.userType })),
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

// @desc    Get the community spotlight post for the home screen
// @route   GET /api/community/spotlight
export const getSpotlightPost = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post, comments: Comment, likes: Like, saved_posts: SavedPost } = db as any;
    const userCity = (req.user?.city || "").trim().toLowerCase();

    const posts = await Post.findAll({
      where: { status: "approved" },
      include: [
        { model: Comment, as: "comments" },
        { model: Like, as: "likes", attributes: ["userId", "userType"] },
        { model: SavedPost, as: "savedPosts", attributes: ["userId"] },
      ],
    });

    if (posts.length === 0) {
      res.json(null);
      return;
    }

    const resolveProfile = createProfileResolver();

    const scored = await Promise.all(
      posts.map(async (post: any) => {
        const payload = toPlain(post);
        const likesCount = (payload.likes || []).length;
        const commentsCount = (payload.comments || []).length;
        const sharesCount = payload.shareCount || 0;
        const engagementScore = likesCount + commentsCount * 2 + sharesCount * 3;
        const authorType = payload.userType === "vet" ? "vet" : "user";
        const author = await resolveProfile(payload.userId, authorType);
        const authorCity = (author?.city || "").trim().toLowerCase();
        return { post, engagementScore, authorCity };
      })
    );

    // Filter by city when possible, fall back to global pool
    let pool = userCity ? scored.filter((item) => item.authorCity === userCity) : scored;
    if (pool.length === 0) pool = scored;

    // Sort by engagement score descending
    pool.sort((a, b) => b.engagementScore - a.engagementScore);

    // Deterministic daily rotation: day 0 = today (feature launch), advances at midnight UTC
    // 20571 = days since Unix epoch for Apr 28, 2026 (the launch day)
    const SPOTLIGHT_LAUNCH_DAY = 20571;
    const dayOffset = Math.max(0, Math.floor(Date.now() / 86400000) - SPOTLIGHT_LAUNCH_DAY);
    const pick = pool[dayOffset % pool.length];

    const serialized = await serializePost(pick.post, resolveProfile);
    res.json({ ...serialized, engagementScore: pick.engagementScore });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
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
      userType: req.userType || "user",
      content: String(content).trim(),
      category,
      imageUrl,
      city: (req.user?.city || "").trim().toLowerCase() || null,
      status: "approved",
    });

    const resolveProfile = createProfileResolver();
    res.status(201).json({
      message: "Post published",
      post: await serializePost(post, resolveProfile),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's own posts (all statuses)
// @route   GET /api/community/posts/me
export const getMyPosts = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post, comments: Comment, likes: Like, saved_posts: SavedPost } = db as any;
    const posts = await Post.findAll({
      where: { userId: req.user.id, userType: req.userType || "user" },
      include: [
        { model: Comment, as: "comments" },
        { model: Like, as: "likes", attributes: ["userId", "userType"] },
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

// @desc    Get user's posts by username
// @route   GET /api/community/posts/user/:username
export const getUserPosts = async (req: any, res: Response): Promise<void> => {
  try {
    const { users: User, posts: Post, comments: Comment, likes: Like, saved_posts: SavedPost } = db as any;
    const { username } = req.params;

    const targetUser = await User.findOne({ where: { username: { [Op.iLike]: username } } });
    if (!targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const posts = await Post.findAll({
      where: { userId: targetUser.id, status: "approved" },
      include: [
        { model: Comment, as: "comments" },
        { model: Like, as: "likes", attributes: ["userId", "userType"] },
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

export const getSavedPosts = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post, comments: Comment, likes: Like, saved_posts: SavedPost } = db as any;

    // Find all savedPost records for this user
    const savedRecords = await SavedPost.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    const postIds = savedRecords.map((r: any) => r.postId);

    if (postIds.length === 0) {
      res.json([]);
      return;
    }

    const { Op } = await import("sequelize");
    const posts = await Post.findAll({
      where: { id: { [Op.in]: postIds }, status: "approved" },
      include: [
        { model: Comment, as: "comments" },
        { model: Like, as: "likes", attributes: ["userId", "userType"] },
        { model: SavedPost, as: "savedPosts", attributes: ["userId", "userType"] },
      ],
    });

    // Preserve the saved order
    const postMap: Record<string, any> = {};
    posts.forEach((p: any) => { postMap[p.id] = p; });
    const ordered = postIds.map((id: string) => postMap[id]).filter(Boolean);

    const resolveProfile = createProfileResolver();
    const serialized = await Promise.all(ordered.map((post: any) => serializePost(post, resolveProfile)));
    res.json(serialized);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};




export const deleteMyPost = async (req: any, res: Response): Promise<void> => {
  const transaction = await db.sequelize.transaction();
  try {
    const { posts: Post, comments: Comment, likes: Like, saved_posts: SavedPost } = db as any;
    const { id } = req.params;

    const post = await Post.findOne({
      where: { id, userId: req.user.id },
      transaction,
    });

    if (!post) {
      await transaction.rollback();
      res.status(404).json({ message: "Post not found or not yours" });
      return;
    }

    // Delete related data
    await Comment.destroy({ where: { postId: id }, transaction });
    await Like.destroy({ where: { postId: id }, transaction });
    await SavedPost.destroy({ where: { postId: id }, transaction });

    // Delete the post
    await post.destroy({ transaction });

    await transaction.commit();
    res.json({ message: "Post and all related data deleted successfully" });
  } catch (error: any) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};


const recomputeEngagementScore = async (postId: string) => {
  const { posts: Post, likes: Like, comments: Comment } = db as any;
  const post = await Post.findByPk(postId, {
    include: [
      { model: Like, as: "likes", attributes: ["id"] },
      { model: Comment, as: "comments", attributes: ["id"] },
    ],
  });
  if (!post) return;
  const payload = toPlain(post);
  const score =
    (payload.likes || []).length +
    (payload.comments || []).length * 2 +
    (payload.shareCount || 0) * 3;
  await Post.update({ engagementScore: score }, { where: { id: postId } });
};

// @desc    Get approved posts for feed (with tab + pagination support)
// @route   GET /api/community/feed?tab=for_you|trending|nearby&page=1&limit=20
export const getCommunityFeed = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post, comments: Comment, likes: Like, saved_posts: SavedPost } = db as any;

    const tab = (req.query.tab as string) || "for_you";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;

    const postIncludes = [
      { model: Comment, as: "comments" },
      { model: Like, as: "likes", attributes: ["userId", "userType"] },
      { model: SavedPost, as: "savedPosts", attributes: ["userId", "userType"] },
    ];

    let allPosts: any[];

    if (tab === "trending") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      allPosts = await Post.findAll({
        where: { status: "approved", createdAt: { [Op.gte]: sevenDaysAgo } },
        include: postIncludes,
        order: [["engagementScore", "DESC"], ["createdAt", "DESC"]],
      });
    } else if (tab === "nearby") {
      const userCity = (req.user?.city || "").trim().toLowerCase();
      if (!userCity) {
        res.json({
          posts: [],
          pagination: { page, limit, total: 0, hasMore: false },
          hint: "Set your city in Profile to see Nearby posts",
        });
        return;
      }
      allPosts = await Post.findAll({
        where: { status: "approved", city: userCity },
        include: postIncludes,
        order: [["createdAt", "DESC"]],
      });
    } else {
      // ═══════════════════════════════════════════════════════════════════════
      // FOR YOU — Two-tier feed algorithm
      //
      // Tier 1 – Following feed (top slots, chronological newest-first):
      //   • Posts from users the current user follows (accepted status only)
      //   • Max age: 72 hours (3 days) — keeps the following feed fresh
      //   • Sorted purely by createdAt DESC (latest follower post at very top)
      //
      // Tier 2 – Discovery feed (shown after following posts):
      //   • All other approved posts, max age: 7 days
      //   • Scored: engagementScore + topicBonus(30) + cityBonus(20) + recencyDecay
      //   • recencyDecay = max(0, 100 − hoursOld × 1.5)  → 0 after ~67 hours
      //   • Posts already in Tier 1 are excluded (deduplicated by post id)
      //   • Followed-user posts older than 72 h get a +40 followBonus so they
      //     still rank above random strangers even after leaving Tier 1
      // ═══════════════════════════════════════════════════════════════════════

      const currentUserId = req.user?.id;
      const userCity = (req.user?.city || "").trim().toLowerCase();
      const userTopics: string[] = req.user?.topicInterests || [];

      // ── Step 1: Resolve the current user's followed user IDs ─────────────
      const followedUserIds: Set<string> = new Set();
      if (currentUserId) {
        const { follows: Follow } = db as any;
        const myFollows = await Follow.findAll({
          where: { followerId: currentUserId, status: "accepted" },
          attributes: ["followingId"],
        });
        myFollows.forEach((f: any) => followedUserIds.add(f.followingId));
      }

      // ── Step 2: Tier 1 — Following posts (≤ 72 h, newest-first) ─────────
      const tier1Cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);

      let tier1Posts: any[] = [];
      if (followedUserIds.size > 0) {
        tier1Posts = await Post.findAll({
          where: {
            status: "approved",
            userId: { [Op.in]: Array.from(followedUserIds) },
            createdAt: { [Op.gte]: tier1Cutoff },
          },
          include: postIncludes,
          order: [["createdAt", "DESC"]],
        });
      }

      // Build a Set of IDs already in Tier 1 to prevent duplicates in Tier 2
      const tier1Ids = new Set(tier1Posts.map((p: any) => p.id));

      // ── Step 3: Tier 2 — Discovery posts (≤ 7 days, excluding Tier 1) ───
      const tier2Cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const discoveryWhere: any = {
        status: "approved",
        createdAt: { [Op.gte]: tier2Cutoff },
      };
      if (tier1Ids.size > 0) {
        discoveryWhere.id = { [Op.notIn]: Array.from(tier1Ids) };
      }

      const discoveryPosts = await Post.findAll({
        where: discoveryWhere,
        include: postIncludes,
        order: [["createdAt", "DESC"]],
      });

      // Score each discovery post
      const scoredDiscovery = discoveryPosts
        .map((post: any) => {
          const payload = toPlain(post);
          const hoursOld =
            (Date.now() - new Date(payload.createdAt).getTime()) / 3600000;

          // Steep recency decay: 0 h → +100, 24 h → +64, 48 h → +28, 67 h → 0
          const recencyDecay = Math.max(0, 100 - hoursOld * 1.5);

          // Followed users' older posts still rank above strangers
          const followBonus = followedUserIds.has(payload.userId) ? 40 : 0;

          const topicBonus =
            userTopics.length > 0 && userTopics.includes(payload.category) ? 30 : 0;
          const cityBonus =
            userCity && (payload.city || "").trim().toLowerCase() === userCity ? 20 : 0;

          const score =
            (payload.engagementScore || 0) +
            topicBonus +
            cityBonus +
            recencyDecay +
            followBonus;

          return { post, score };
        })
        .sort((a: any, b: any) => b.score - a.score)
        .map((item: any) => item.post);

      // ── Step 4: Merge — Tier 1 (following, newest-first) + Tier 2 ───────
      allPosts = [...tier1Posts, ...scoredDiscovery];
    }

    const total = allPosts.length;
    const pagePosts = allPosts.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    const resolveProfile = createProfileResolver();
    const serialized = await Promise.all(pagePosts.map((post: any) => serializePost(post, resolveProfile)));

    res.json({
      posts: serialized,
      pagination: { page, limit, total, hasMore },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user's feed interests
// @route   PATCH /api/community/interests
export const updateInterests = async (req: any, res: Response): Promise<void> => {
  try {
    const { users: User } = db as any;
    const validPetTypes = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Other"];
    const validTopics = ["Health", "Adoption", "Training", "Nutrition", "Lost & Found"];

    const petTypeInterests = (req.body.petTypeInterests || []).filter((v: string) => validPetTypes.includes(v));
    const topicInterests = (req.body.topicInterests || []).filter((v: string) => validTopics.includes(v));

    await User.update(
      { petTypeInterests, topicInterests },
      { where: { id: req.user.id } }
    );

    res.json({ petTypeInterests, topicInterests });
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
        { model: Like, as: "likes", attributes: ["userId", "userType"] },
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

export const getPublicPostById = async (req: any, res: Response): Promise<void> => {
  try {
    const { posts: Post } = db as any;
    const post = await Post.findOne({ where: { id: req.params.id, status: "approved" } });
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    res.json(toPlain(post));
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
      where: { postId: req.params.id, userId: req.user.id, userType: req.userType || "user" },
    });

    if (existingLike) {
      await existingLike.destroy();
      res.json({ liked: false, message: "Post unliked" });
      recomputeEngagementScore(req.params.id).catch(() => {});
      return;
    }

    await Like.create({ postId: req.params.id, userId: req.user.id, userType: req.userType || "user" });
    res.json({ liked: true, message: "Post liked" });

    recomputeEngagementScore(req.params.id).catch(() => {});

    // Notify post author (fire and forget, skip self-likes)
    if (post.userId !== req.user.id || post.userType !== (req.userType || "user")) {
      createRichNotification({
        actorId: post.userId,
        actorType: post.userType === "vet" ? "vet" : "user",
        type: "like",
        category: "activity",
        title: `${req?.user?.name?.split(' ')[0] || 'Someone'} liked your post`,
        actionType:"like",
        actionPayload:{
          postId:post.id,
        },
        message: post.content ? String(post.content).slice(0, 80) : "Your post got a like",
        relatedId: post.id,
        sendPush: true,
      }).catch(() => {});
    }
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

    recomputeEngagementScore(req.params.id).catch(() => {});
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
      userType: req.userType || "user",
      text: String(text).trim(),
    });

    const resolveProfile = createProfileResolver();
    res.status(201).json({ comment: await serializeComment(comment, resolveProfile) });

    recomputeEngagementScore(req.params.id).catch(() => {});

    // Notify post author (fire and forget, skip self-comments)
    if (post.userId !== req.user.id || post.userType !== (req.userType || "user")) {
      createRichNotification({
        actorId: post.userId,
        actorType: post.userType === "vet" ? "vet" : "user",
        type: "comment",
        category: "activity",
        title: "New comment on your post",
        actionType:"comment",
        actionPayload:{
          postId:post.id,
          commentId:comment.id,
        },
        message: String(text).trim().slice(0, 80),
        relatedId: post.id,
        sendPush: true,
      }).catch(() => {});
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/community/comments/:id
export const deleteComment = async (req: any, res: Response): Promise<void> => {
  try {
    const { comments: Comment } = db as any;
    const comment = await Comment.findOne({ where: { id: req.params.id, userId: req.user.id, userType: req.userType || "user" } });
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
    const { events: Event, event_bookings: EventBooking } = db as any;
    const events = await Event.findAll({ order: [["date", "ASC"], ["time", "ASC"]] });

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

export const getPublicEventById = async (req: any, res: Response): Promise<void> => {
  try {
    const { events: Event } = db as any;
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }
    res.json(toPlain(event));
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

    const allBookings = await EventBooking.findAll({ where: { eventId: req.params.id } });
    const eventPayload = { ...toPlain(event), bookings: allBookings };

    const resolveProfile = createProfileResolver();
    const serializedEvent = await serializeEvent(eventPayload, req.user.id, req.userType || "user", resolveProfile);

    // Notify organizer about the new booking (if booker is not the organizer)
    if (event.organizerId && event.organizerId !== req.user.id) {
      await createNotification(
        event.organizerId,
        "user",
        "event",
        "New Event Booking",
        `Someone has booked a spot for "${event.title}".`,
        event.id,
        "event"
      );
    }
    // Send booking confirmation email to the booker
    if (req.user.email) {
      sendEmail(req.user.email, `You're booked for ${event.title}!`, "event-booking-confirmation", {
        name: req.user.name || "there",
        eventTitle: event.title,
        eventDate: event.date || event.startDate || "",
      });
    }

    res.json({
      booking: { ...toPlain(booking), user: await resolveProfile(req.user.id, req.userType || "user") },
      event: serializedEvent,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Increment share count on an event
// @route   POST /api/community/events/:id/share
export const shareEvent = async (req: any, res: Response): Promise<void> => {
  try {
    const { events: Event } = db as any;
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    event.shareCount = Number(event.shareCount || 0) + 1;
    await event.save();

    res.json({ shareCount: event.shareCount });
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

    // Deduplicate conversations so we only show one thread per user pair (the newest one)
    const seenUsers = new Set();
    const deduplicated = serialized.filter((conv: any) => {
      const otherUser = conv.otherParticipants?.[0];
      if (!otherUser) return false;
      if (seenUsers.has(otherUser.id)) return false;
      seenUsers.add(otherUser.id);
      return true;
    });

    res.json(deduplicated);
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

    const recipientId = conversation.initiatorId === req.user.id ? conversation.recipientId : conversation.initiatorId;
    const recipientType = conversation.initiatorId === req.user.id ? conversation.recipientType : conversation.initiatorType;

    const refreshedConversation = await fetchConversation(conversation.id);
    const resolveProfile = createProfileResolver();
    const serializedMessage = await serializeMessage(message, resolveProfile);
    const serializedConversation = await serializeConversation(refreshedConversation, req.user.id, resolveProfile);

    // Emit real-time event to recipient
    if (recipientId) {
      emitToActor(recipientId, recipientType, "chat:message", {
        conversationId: conversation.id,
        message: serializedMessage,
      });
    }

    // Emit real-time event to sender (for multi-device sync)
    emitToActor(req.user.id, req.userType || "user", "chat:message", {
      conversationId: conversation.id,
      message: serializedMessage,
    });

    // Notify the other participant about the new message via push (smart push: skip if online)
    if (recipientId && !isUserOnline(recipientId)) {
      await createNotification(
        recipientId,
        recipientType,
        "chat",
        `New message from ${req.user.name || "Someone"}`,
        text.length > 80 ? text.substring(0, 80) + "…" : text,
        conversation.id,
        "chat"
      );
    }

    res.status(201).json({
      message: serializedMessage,
      conversation: serializedConversation,
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

    // We removed petId from the 'where' clause so that 1-on-1 chats 
    // are ALWAYS reused, preventing duplicate conversation threads.
    
    let conversation = await Conversation.findOne({ where });
    if (conversation && petId && conversation.petId !== petId) {
      // Optionally update the petId if a new one is provided and we are reusing a chat
      await conversation.update({ petId } as any);
    }
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
      const message = await Message.create({
        conversationId: conversation.id,
        senderId: req.user.id,
        senderType: req.userType || "user",
        text: firstMessage,
        petId,
      });
      await conversation.update({ updatedAt: new Date() } as any);

      const serializedMessage = await serializeMessage(message, resolveProfile);

      // Emit real-time event to recipient
      emitToActor(recipientId, recipientType, "chat:message", {
        conversationId: conversation.id,
        message: serializedMessage,
      });

      // Emit real-time event to sender
      emitToActor(req.user.id, req.userType || "user", "chat:message", {
        conversationId: conversation.id,
        message: serializedMessage,
      });

      // Notify recipient via push (smart push)
      if (!isUserOnline(recipientId)) {
        await createNotification(
          recipientId,
          recipientType,
          "chat",
          `New message from ${req.user.name || "Someone"}`,
          firstMessage.length > 80 ? firstMessage.substring(0, 80) + "…" : firstMessage,
          conversation.id,
          "chat"
        );
      }
    }

    const refreshedConversation = await fetchConversation(conversation.id);
    res.status(201).json(await serializeConversation(refreshedConversation, req.user.id, resolveProfile));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
