import { Router } from "express";
import { followUser, unfollowUser, acceptRequest, rejectRequest, getPendingRequests, getFollowers, getFollowing } from "../controllers/followController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = Router();

router.use(protect);

router.get("/requests", getPendingRequests);
router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);
router.post("/:id", followUser);
router.delete("/:id", unfollowUser);
router.patch("/requests/:followerId/accept", acceptRequest);
router.patch("/requests/:followerId/reject", rejectRequest);

export default router;
