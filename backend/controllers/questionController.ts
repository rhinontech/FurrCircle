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
        const { questions: Question, question_answers: QuestionAnswer, question_votes: QuestionVote } = db as any;
        const { circleId, q } = req.query;
        const currentUserId = req.user?.id;
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
                let hasVoted = false;
                if (currentUserId && QuestionVote) {
                    const vote = await QuestionVote.findOne({ where: { questionId: payload.id, userId: currentUserId } });
                    hasVoted = !!vote;
                }
                return { ...payload, answerCount: (payload.answers || []).length, author, hasVoted };
            })
        );
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── GET /api/questions/:id ───────────────────────────────────────────────────
export const getQuestionById = async (req: any, res: Response): Promise<void> => {
    try {
        const { questions: Question, question_answers: QuestionAnswer } = db as any;
        const q = await Question.findByPk(req.params.id, {
            include: [{ model: QuestionAnswer, as: "answers", attributes: ["id"] }],
        });
        if (!q) { res.status(404).json({ message: "Question not found" }); return; }
        const payload = toPlain(q);
        const author = await resolveUser(payload.userId);
        res.json({ ...payload, answerCount: (payload.answers || []).length, author });
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
// Toggles the current user's upvote: first call adds a vote, second call removes it.
export const upvoteQuestion = async (req: any, res: Response): Promise<void> => {
    try {
        const { questions: Question, question_votes: QuestionVote } = db as any;
        const currentUserId = req.user.id;
        const questionId = req.params.id;

        const question = await Question.findByPk(questionId);
        if (!question) { res.status(404).json({ message: "Question not found" }); return; }

        // Check if this user has already voted
        const existingVote = await QuestionVote.findOne({ where: { questionId, userId: currentUserId } });

        if (existingVote) {
            // Toggle OFF — remove vote
            await existingVote.destroy();
            question.upvotes = Math.max(0, (question.upvotes || 1) - 1);
            await question.save();
            res.json({ upvotes: question.upvotes, voted: false });
        } else {
            // Toggle ON — add vote
            await QuestionVote.create({ questionId, userId: currentUserId });
            question.upvotes = (question.upvotes || 0) + 1;
            await question.save();

            // Notify the question author (skip self-votes)
            if (question.userId !== currentUserId) {
                const { createRichNotification } = await import("../services/notificationService.ts");
                createRichNotification({
                    actorId: question.userId,
                    actorType: "user",
                    type: "question_upvote",
                    category: "activity",
                    title: "Question Upvoted",
                    message: `${req.user.name || "Someone"} upvoted your question: "${question.title}"`,
                    relatedId: question.id,
                    relatedType: "question",
                    actionType: "question_detail",
                    actionPayload: { questionId: question.id },
                    sendPush: true,
                }).catch(console.error);
            }

            res.json({ upvotes: question.upvotes, voted: true });
        }
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

        // Notify the question author (skip self-answers)
        if (question.userId !== req.user.id) {
            const { createRichNotification } = await import("../services/notificationService.ts");
            createRichNotification({
                actorId: question.userId,
                actorType: "user",
                type: "question_answer",
                category: "activity",
                title: "New answer to your question",
                message: String(text).trim().slice(0, 80),
                relatedId: question.id,
                relatedType: "question",
                actionType: "question_detail",
                actionPayload: { questionId: question.id },
                sendPush: true,
            }).catch(console.error);
        }

        const author = await resolveUser(req.user.id);
        res.status(201).json({ ...toPlain(answer), author });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ─── DELETE /api/questions/:id ────────────────────────────────────────────────
export const deleteQuestion = async (req: any, res: Response): Promise<void> => {
    try {
        const { questions: Question, question_answers: QuestionAnswer } = db as any;
        const question = await Question.findByPk(req.params.id);
        if (!question) { res.status(404).json({ message: "Question not found" }); return; }
        if (question.userId !== req.user.id && req.user.role !== 'admin') {
            res.status(403).json({ message: "Not authorized to delete this question" }); return;
        }
        await QuestionAnswer.destroy({ where: { questionId: req.params.id } });
        await question.destroy();
        res.json({ success: true });
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

// ─── GET /api/questions/:id ───────────────────────────────────────────────────
export const getQuestionById = async (req: any, res: Response): Promise<void> => {
    try {
        const { questions: Question, question_answers: QuestionAnswer, question_votes: QuestionVote } = db as any;
        const currentUserId = req.user?.id;
        const questionId = req.params.id;

        const question = await Question.findByPk(questionId, {
            include: [{ model: QuestionAnswer, as: "answers", attributes: ["id"] }],
        });

        if (!question) {
            res.status(404).json({ message: "Question not found" });
            return;
        }

        const payload = toPlain(question);
        const author = await resolveUser(payload.userId);
        let hasVoted = false;
        if (currentUserId && QuestionVote) {
            const vote = await QuestionVote.findOne({ where: { questionId, userId: currentUserId } });
            hasVoted = !!vote;
        }

        res.json({ ...payload, answerCount: (payload.answers || []).length, author, hasVoted });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};
