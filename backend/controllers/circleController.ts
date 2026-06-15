import type { Response } from "express";
import { Op } from "sequelize";
import db from "../models/index.ts";

const toPlain = (v: any) => (v && typeof v.toJSON === "function" ? v.toJSON() : v);

const resolveUser = async (userId: string) => {
    const { users: User } = db as any;
    const user = await User.findByPk(userId, { attributes: ["id", "name", "username", "avatar_url", "city"] });
    return user ? toPlain(user) : null;
};

// ─── GET /api/circles ─────────────────────────────────────────────────────────
// Returns all public circles, with joined status for the current user
export const getAllCircles = async (req: any, res: Response): Promise<void> => {
    try {
        const { circles: Circle, circle_members: CircleMember } = db as any;
        const circles = await Circle.findAll({ order: [["memberCount", "DESC"], ["createdAt", "DESC"]] });
        const myMemberships = await CircleMember.findAll({ where: { userId: req.user.id } });
        const joinedIds = new Set(myMemberships.map((m: any) => m.circleId));

        const result = circles.map((c: any) => ({
            ...toPlain(c),
            isJoined: joinedIds.has(c.id),
        }));
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── GET /api/circles/me ──────────────────────────────────────────────────────
export const getMyCircles = async (req: any, res: Response): Promise<void> => {
    try {
        const { circles: Circle, circle_members: CircleMember } = db as any;
        const memberships = await CircleMember.findAll({ where: { userId: req.user.id } });
        const circleIds = memberships.map((m: any) => m.circleId);
        if (circleIds.length === 0) { res.json([]); return; }
        const circles = await Circle.findAll({ where: { id: circleIds }, order: [["createdAt", "DESC"]] });
        res.json(circles.map((c: any) => ({ ...toPlain(c), isJoined: true })));
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── GET /api/circles/:id ─────────────────────────────────────────────────────
export const getCircleById = async (req: any, res: Response): Promise<void> => {
    try {
        const { circles: Circle, circle_members: CircleMember } = db as any;
        const circle = await Circle.findByPk(req.params.id);
        if (!circle) { res.status(404).json({ message: "Circle not found" }); return; }
        const membership = await CircleMember.findOne({ where: { circleId: req.params.id, userId: req.user.id } });
        res.json({ ...toPlain(circle), isJoined: !!membership });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── POST /api/circles ────────────────────────────────────────────────────────
export const createCircle = async (req: any, res: Response): Promise<void> => {
    try {
        const { circles: Circle, circle_members: CircleMember } = db as any;
        const { name, description, category, coverImage } = req.body;
        if (!String(name || "").trim()) { res.status(400).json({ message: "Circle name is required" }); return; }

        const circle = await Circle.create({
            name: String(name).trim(),
            description: description ? String(description).trim() : null,
            category: category || "general",
            coverImage: coverImage || null,
            createdBy: req.user.id,
            memberCount: 1,
            isPublic: true,
        });

        // Auto-join creator as admin
        await CircleMember.create({ circleId: circle.id, userId: req.user.id, role: "admin" });

        res.status(201).json({ ...toPlain(circle), isJoined: true });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── POST /api/circles/:id/join ───────────────────────────────────────────────
export const joinCircle = async (req: any, res: Response): Promise<void> => {
    try {
        const { circles: Circle, circle_members: CircleMember } = db as any;
        const circle = await Circle.findByPk(req.params.id);
        if (!circle) { res.status(404).json({ message: "Circle not found" }); return; }

        const existing = await CircleMember.findOne({ where: { circleId: req.params.id, userId: req.user.id } });
        if (existing) { res.json({ message: "Already a member", isJoined: true }); return; }

        await CircleMember.create({ circleId: req.params.id, userId: req.user.id, role: "member" });
        await Circle.increment("memberCount", { where: { id: req.params.id } });
        res.json({ message: "Joined circle", isJoined: true });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── POST /api/circles/:id/leave ──────────────────────────────────────────────
export const leaveCircle = async (req: any, res: Response): Promise<void> => {
    try {
        const { circles: Circle, circle_members: CircleMember } = db as any;
        const membership = await CircleMember.findOne({ where: { circleId: req.params.id, userId: req.user.id } });
        if (!membership) { res.json({ message: "Not a member", isJoined: false }); return; }
        await membership.destroy();
        await Circle.decrement("memberCount", { where: { id: req.params.id } });
        res.json({ message: "Left circle", isJoined: false });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── GET /api/circles/trending ────────────────────────────────────────────────
// Top questions by (upvotes + answerCount * 2) in the last 14 days
export const getTrending = async (req: any, res: Response): Promise<void> => {
    try {
        const { questions: Question } = db as any;
        const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const questions = await Question.findAll({
            where: { createdAt: { [Op.gte]: since } },
            order: [
                [db.sequelize.literal('"upvotes" + ("answerCount" * 2)'), "DESC"],
                ["createdAt", "DESC"]
            ],
            limit: 5,
        });

        const result = await Promise.all(
            questions.map(async (q: any) => {
                const payload = toPlain(q);
                const author = await resolveUser(payload.userId);
                return { ...payload, author };
            })
        );
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};
