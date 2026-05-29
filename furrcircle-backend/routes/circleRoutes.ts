import express from "express";
import { protect } from "../middleware/authMiddleware.ts";
import {
    getAllCircles,
    getMyCircles,
    getCircleById,
    createCircle,
    joinCircle,
    leaveCircle,
    getTrending,
} from "../controllers/circleController.ts";

const router = express.Router();
router.use(protect);

// Must come before /:id
router.get("/trending", getTrending);
router.get("/me", getMyCircles);

router.get("/", getAllCircles);
router.post("/", createCircle);
router.get("/:id", getCircleById);
router.post("/:id/join", joinCircle);
router.post("/:id/leave", leaveCircle);

export default router;
