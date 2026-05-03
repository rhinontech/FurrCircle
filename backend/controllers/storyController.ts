import type { Response } from "express";
import { Op } from "sequelize";
import db from "../models/index.ts";

const toPlain = (value: any) => (value && typeof value.toJSON === "function" ? value.toJSON() : value);

const serializeStory = (story: any, viewerIds: Set<string>) => {
    const payload = toPlain(story);
    return {
        id: payload.id,
        mediaUrl: payload.mediaUrl,
        mediaType: payload.mediaType,
        viewCount: payload.viewCount || 0,
        viewedByMe: viewerIds.has(payload.id),
        createdAt: payload.createdAt,
        expiresAt: payload.expiresAt,
    };
};

// @desc    Get all active stories for the user's city
// @route   GET /api/community/stories
export const getStoriesForCity = async (req: any, res: Response): Promise<void> => {
    try {
        const { stories: Story, story_views: StoryView, users: User } = db as any;
        const userCity = (req.user?.city || "").trim().toLowerCase();
        const now = new Date();

        const whereClause: any = { expiresAt: { [Op.gt]: now } };
        if (userCity) {
            whereClause.city = userCity;
        }

        const allStories = await Story.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: "author",
                    attributes: ["id", "name", "avatar_url"],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        // Get the current user's viewed story IDs
        const storyIds = allStories.map((s: any) => s.id);
        const myViews = storyIds.length
            ? await StoryView.findAll({
                  where: { storyId: { [Op.in]: storyIds }, viewerId: req.user.id },
                  attributes: ["storyId"],
              })
            : [];
        const viewedIds = new Set<string>(myViews.map((v: any) => v.storyId));

        // Group by userId
        const groups: Record<string, any> = {};
        for (const story of allStories) {
            const payload = toPlain(story);
            const uid = payload.userId;
            if (!groups[uid]) {
                groups[uid] = {
                    userId: uid,
                    author: payload.author
                        ? {
                              id: payload.author.id,
                              name: payload.author.name,
                              avatar_url: payload.author.avatar_url || null,
                          }
                        : null,
                    stories: [],
                };
            }
            groups[uid].stories.push(serializeStory(story, viewedIds));
        }

        // Sort each group: unviewed groups first
        const result = Object.values(groups).sort((a: any, b: any) => {
            const aHasUnviewed = a.stories.some((s: any) => !s.viewedByMe);
            const bHasUnviewed = b.stories.some((s: any) => !s.viewedByMe);
            if (aHasUnviewed && !bHasUnviewed) return -1;
            if (!aHasUnviewed && bHasUnviewed) return 1;
            return 0;
        });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's own stories
// @route   GET /api/community/stories/me
export const getMyStory = async (req: any, res: Response): Promise<void> => {
    try {
        const { stories: Story, story_views: StoryView } = db as any;
        const now = new Date();

        const myStories = await Story.findAll({
            where: { userId: req.user.id, expiresAt: { [Op.gt]: now } },
            include: [{ model: StoryView, as: "views", attributes: ["id"] }],
            order: [["createdAt", "ASC"]],
        });

        const serialized = myStories.map((story: any) => {
            const payload = toPlain(story);
            return {
                id: payload.id,
                mediaUrl: payload.mediaUrl,
                mediaType: payload.mediaType,
                viewCount: payload.viewCount || 0,
                viewedByMe: true,
                createdAt: payload.createdAt,
                expiresAt: payload.expiresAt,
            };
        });

        const totalViews = serialized.reduce((sum: number, s: any) => sum + (s.viewCount || 0), 0);

        res.json({ stories: serialized, totalViews });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a story
// @route   POST /api/community/stories
export const createStory = async (req: any, res: Response): Promise<void> => {
    try {
        const { stories: Story } = db as any;
        const { mediaUrl, mediaType } = req.body;

        if (!mediaUrl) {
            res.status(400).json({ message: "mediaUrl is required" });
            return;
        }

        const type = mediaType === "video" ? "video" : "image";

        const story = await Story.create({
            userId: req.user.id,
            userType: req.userType || "user",
            mediaUrl,
            mediaType: type,
            city: (req.user?.city || "").trim().toLowerCase() || null,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        res.status(201).json({ story: toPlain(story) });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark a story as viewed
// @route   POST /api/community/stories/:id/view
export const viewStory = async (req: any, res: Response): Promise<void> => {
    try {
        const { stories: Story, story_views: StoryView } = db as any;
        const storyId = req.params.id;

        const story = await Story.findByPk(storyId);
        if (!story) {
            res.status(404).json({ message: "Story not found" });
            return;
        }

        const [, created] = await StoryView.findOrCreate({
            where: { storyId, viewerId: req.user.id, viewerType: req.userType || "user" },
        });

        if (created) {
            await Story.increment("viewCount", { where: { id: storyId } });
            await story.reload();
        }

        res.json({ viewCount: story.viewCount });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete own story
// @route   DELETE /api/community/stories/:id
export const deleteStory = async (req: any, res: Response): Promise<void> => {
    try {
        const { stories: Story } = db as any;
        const story = await Story.findOne({
            where: { id: req.params.id, userId: req.user.id },
        });

        if (!story) {
            res.status(404).json({ message: "Story not found or not yours" });
            return;
        }

        await story.destroy();
        res.json({ message: "Story deleted" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
