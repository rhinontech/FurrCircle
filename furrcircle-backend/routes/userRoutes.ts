import express from "express";
import { getUserByHandle, updateProfile } from "../controllers/userController.ts";
import { optionalAuth, protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.patch("/profile", protect, updateProfile);
router.get("/:handle", optionalAuth, getUserByHandle);

export default router;
