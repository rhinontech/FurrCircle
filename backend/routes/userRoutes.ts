import express from "express";
import { getUserByHandle, updateProfile, searchUsers, searchFollowers } from "../controllers/userController.ts";
import { optionalAuth, protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.patch("/profile", protect, updateProfile);
router.get("/search", protect, searchUsers);
router.get("/followers-search", protect, searchFollowers);
router.get("/:handle", optionalAuth, getUserByHandle);

export default router;
