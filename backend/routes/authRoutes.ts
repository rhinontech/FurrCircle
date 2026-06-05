import express from "express";
import { registerUser, loginUser, loginOtp, getUserProfile, updateUserProfile, forgotPassword, resetPassword, resetPasswordByEmail, changePassword, getUsersByRole, completeOnboarding, checkUsername, sendEmailOtp, verifyEmailOtp, sendPhoneOtp, cancelRegistration } from "../controllers/authController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/check-username", checkUsername);
router.post("/send-email-otp", sendEmailOtp);
router.post("/send-phone-otp", sendPhoneOtp);
router.post("/verify-email-otp", verifyEmailOtp);

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/login-otp", loginOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/reset-password-direct", resetPasswordByEmail);
router.post("/change-password", protect, changePassword);
router.delete("/cancel-registration/:userId", cancelRegistration);

router.route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.post("/onboarding-complete", protect, completeOnboarding);

router.get("/users/:role", protect, getUsersByRole);

// For backwards compatibility with original specification
router.get("/me", protect, getUserProfile);

export default router;
