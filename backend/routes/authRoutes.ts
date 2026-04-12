import express from "express";
import { registerUser, loginUser, getUserProfile, updateUserProfile, forgotPassword, resetPassword, getUsersByRole } from "../controllers/authController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.get("/users/:role", protect, getUsersByRole);

// For backwards compatibility with original specification
router.get("/me", protect, getUserProfile);

export default router;
