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
        res.json({ ...toPlain(circle), isJoined: !!membership, isAdmin: circle.createdBy === req.user.id });
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

// ─── PATCH /api/circles/:id ───────────────────────────────────────────────────
// Only the circle creator (admin) can edit it.
export const updateCircle = async (req: any, res: Response): Promise<void> => {
    try {
        const { circles: Circle, circle_members: CircleMember } = db as any;
        const circle = await Circle.findByPk(req.params.id);
        if (!circle) { res.status(404).json({ message: "Circle not found" }); return; }
        if (circle.createdBy !== req.user.id) {
            res.status(403).json({ message: "Only the circle creator can edit this circle" });
            return;
        }

        const { name, description, category, coverImage } = req.body;
        if (name !== undefined) {
            if (!String(name || "").trim()) { res.status(400).json({ message: "Circle name is required" }); return; }
            circle.name = String(name).trim();
        }
        if (description !== undefined) circle.description = description ? String(description).trim() : null;
        if (category !== undefined) circle.category = category || "general";
        if (coverImage !== undefined) circle.coverImage = coverImage || null;
        await circle.save();

        const membership = await CircleMember.findOne({ where: { circleId: circle.id, userId: req.user.id } });
        res.json({ ...toPlain(circle), isJoined: !!membership, isAdmin: true });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── DELETE /api/circles/:id ──────────────────────────────────────────────────
// Only the circle creator (admin) can delete it.
export const deleteCircle = async (req: any, res: Response): Promise<void> => {
    try {
        const { Op } = await import("sequelize");
        const {
            circles: Circle,
            circle_members: CircleMember,
            questions: Question,
            question_answers: QuestionAnswer,
            question_votes: QuestionVote,
        } = db as any;
        const circle = await Circle.findByPk(req.params.id);
        if (!circle) { res.status(404).json({ message: "Circle not found" }); return; }
        if (circle.createdBy !== req.user.id) {
            res.status(403).json({ message: "Only the circle creator can delete this circle" });
            return;
        }

        // Clean up discussions (answers + votes first to satisfy FK constraints),
        // then memberships, then the circle itself.
        if (Question) {
            const circleQuestions = await Question.findAll({ where: { circleId: req.params.id }, attributes: ["id"] });
            const questionIds = circleQuestions.map((q: any) => q.id);
            if (questionIds.length > 0) {
                if (QuestionAnswer) await QuestionAnswer.destroy({ where: { questionId: { [Op.in]: questionIds } } });
                if (QuestionVote) await QuestionVote.destroy({ where: { questionId: { [Op.in]: questionIds } } });
                await Question.destroy({ where: { id: { [Op.in]: questionIds } } });
            }
        }
        await CircleMember.destroy({ where: { circleId: req.params.id } });
        await circle.destroy();
        res.json({ message: "Circle deleted" });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── GET /api/circles/trending ────────────────────────────────────────────────
// Top circles by memberCount
export const getTrending = async (req: any, res: Response): Promise<void> => {
    try {
        const { circles: Circle, circle_members: CircleMember } = db as any;
        const circles = await Circle.findAll({
            order: [
                ["memberCount", "DESC"],
                ["createdAt", "DESC"]
            ],
            limit: 5,
        });

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
