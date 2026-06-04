import express from "express";
import { blockUser, unblockUser, getBlockedUsers } from "../controllers/blockController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/", protect, getBlockedUsers);
router.post("/:userId", protect, blockUser);
router.delete("/:userId", protect, unblockUser);

export default router;
