import express from "express";
import { protect } from "../middleware/authMiddleware.ts";
import {
    getQuestions,
    getQuestionById,
    createQuestion,
    upvoteQuestion,
    addAnswer,
    getAnswers,
    deleteQuestion,
    getTrendingQuestions,
} from "../controllers/questionController.ts";

const router = express.Router();
router.use(protect);

router.get("/trending", getTrendingQuestions); // Must come before /:id
router.get("/", getQuestions);
router.get("/:id", getQuestionById);
router.post("/", createQuestion);
router.post("/:id/vote", upvoteQuestion);
router.post("/:id/answers", addAnswer);
router.get("/:id/answers", getAnswers);
router.delete("/:id", deleteQuestion);

export default router;
