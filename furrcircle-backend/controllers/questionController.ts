import type { Response } from "express";
import db from "../models/index.ts";

const toPlain = (v: any) => (v && typeof v.toJSON === "function" ? v.toJSON() : v);

const resolveUser = async (userId: string) => {
    const { users: User } = db as any;
    const user = await User.findByPk(userId, { attributes: ["id", "name", "username", "avatar_url", "city"] });
    return user ? toPlain(user) : null;
};

// ─── GET /api/questions ───────────────────────────────────────────────────────
// ?circleId=<id>  → filter by circle
// ?q=<search>     → text search in title/body/tags
export const getQuestions = async (req: any, res: Response): Promise<void> => {
    try {
        const { questions: Question, question_answers: QuestionAnswer } = db as any;
        const { circleId, q } = req.query;
        const where: any = {};

        if (circleId) where.circleId = circleId;
        if (q) {
            const { Op } = await import("sequelize");
            const term = `%${String(q).toLowerCase()}%`;
            where[Op.or] = [
                { title: { [Op.iLike]: term } },
                { body: { [Op.iLike]: term } },
            ];
        }

        const questions = await Question.findAll({
            where,
            include: [{ model: QuestionAnswer, as: "answers", attributes: ["id"] }],
            order: [["upvotes", "DESC"], ["createdAt", "DESC"]],
        });

        const result = await Promise.all(
            questions.map(async (q: any) => {
                const payload = toPlain(q);
                const author = await resolveUser(payload.userId);
                return { ...payload, answerCount: (payload.answers || []).length, author };
            })
        );
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── POST /api/questions ──────────────────────────────────────────────────────
export const createQuestion = async (req: any, res: Response): Promise<void> => {
    try {
        const { questions: Question } = db as any;
        const { title, body, tags, circleId } = req.body;
        if (!String(title || "").trim()) { res.status(400).json({ message: "Title is required" }); return; }

        const question = await Question.create({
            userId: req.user.id,
            circleId: circleId || null,
            title: String(title).trim(),
            body: body ? String(body).trim() : null,
            tags: Array.isArray(tags) ? tags : [],
            upvotes: 0,
            answerCount: 0,
        });

        const author = await resolveUser(req.user.id);
        res.status(201).json({ ...toPlain(question), author });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── POST /api/questions/:id/vote ─────────────────────────────────────────────
export const upvoteQuestion = async (req: any, res: Response): Promise<void> => {
    try {
        const { questions: Question } = db as any;
        const question = await Question.findByPk(req.params.id);
        if (!question) { res.status(404).json({ message: "Question not found" }); return; }
        question.upvotes = (question.upvotes || 0) + 1;
        await question.save();
        res.json({ upvotes: question.upvotes });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── POST /api/questions/:id/answers ─────────────────────────────────────────
export const addAnswer = async (req: any, res: Response): Promise<void> => {
    try {
        const { questions: Question, question_answers: QuestionAnswer } = db as any;
        const { text } = req.body;
        if (!String(text || "").trim()) { res.status(400).json({ message: "Answer text is required" }); return; }

        const question = await Question.findByPk(req.params.id);
        if (!question) { res.status(404).json({ message: "Question not found" }); return; }

        const answer = await QuestionAnswer.create({
            questionId: req.params.id,
            userId: req.user.id,
            text: String(text).trim(),
        });

        // Increment answer count
        await Question.increment("answerCount", { where: { id: req.params.id } });

        const author = await resolveUser(req.user.id);
        res.status(201).json({ ...toPlain(answer), author });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── GET /api/questions/:id/answers ──────────────────────────────────────────
export const getAnswers = async (req: any, res: Response): Promise<void> => {
    try {
        const { question_answers: QuestionAnswer } = db as any;
        const answers = await QuestionAnswer.findAll({
            where: { questionId: req.params.id },
            order: [["isAccepted", "DESC"], ["upvotes", "DESC"], ["createdAt", "ASC"]],
        });

        const result = await Promise.all(
            answers.map(async (a: any) => {
                const payload = toPlain(a);
                return { ...payload, author: await resolveUser(payload.userId) };
            })
        );
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};
