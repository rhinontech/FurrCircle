import express from "express";
import { registerUser, loginUser, getUserProfile, updateUserProfile, forgotPassword, resetPassword, resetPasswordByEmail, changePassword, getUsersByRole, completeOnboarding, connectInstagram, toggleInstagramSync } from "../controllers/authController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/reset-password-direct", resetPasswordByEmail);
router.post("/change-password", protect, changePassword);

router.route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.post("/onboarding-complete", protect, completeOnboarding);

router.get("/users/:role", protect, getUsersByRole);
router.post("/instagram/connect", protect, connectInstagram);
router.post("/instagram/toggle-sync", protect, toggleInstagramSync);

// For backwards compatibility with original specification
router.get("/me", protect, getUserProfile);

export default router;
