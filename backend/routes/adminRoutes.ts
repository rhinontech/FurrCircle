import express from "express";
import {
  getPendingPosts, moderatePost, getAllPosts,
  getUnverifiedVets, verifyVet, deleteVet, getAllVets,
  getAllPets, getAllUsers, deleteUser, deletePet,
  getAdminStats,
  getAdminEvents, createAdminEvent, updateAdminEvent, deleteAdminEvent,
  getAdoptionPets, adminReviewApplication,
  getAllAppointments,
  getAllVetReviews, adminDeleteVetReview,
  getAllCircles, adminCreateCircle, adminDeleteCircle,
  getAllLostPets, adminUpdateLostPetStatus, adminDeleteLostPet,
  getAllQuestions, adminCreateQuestion, adminDeleteQuestion, adminGetAnswers, adminDeleteAnswer,
} from "../controllers/adminController.ts";
import {
  getAdminCampaigns,
  createAdminCampaign,
  updateAdminCampaign,
  publishAdminCampaign,
  cancelAdminCampaign,
  deleteAdminCampaign,
  resendAdminCampaign,
} from "../controllers/adminCampaignController.ts";
import {
  getAllContactLeads,
  updateContactLead,
} from "../controllers/contactLeadController.ts";
import { protect, adminOnly } from "../middleware/authMiddleware.ts";

const router = express.Router();

// Stats
router.get("/stats", protect, adminOnly, getAdminStats);

// Users
router.get("/users", protect, adminOnly, getAllUsers);
router.delete("/users/:userId", protect, adminOnly, deleteUser);

// Pets
router.get("/pets", protect, adminOnly, getAllPets);
router.delete("/pets/:petId", protect, adminOnly, deletePet);

// Adoptions
router.get("/adoptions", protect, adminOnly, getAdoptionPets);
router.patch("/adoptions/:id/status", protect, adminOnly, adminReviewApplication);

// Vet management
router.get("/vets", protect, adminOnly, getAllVets);
router.get("/vets/pending", protect, adminOnly, getUnverifiedVets);
router.patch("/vets/:vetId/verify", protect, adminOnly, verifyVet);
router.delete("/vets/:vetId", protect, adminOnly, deleteVet);

// Community posts
router.get("/pending-posts", protect, adminOnly, getPendingPosts);
router.get("/posts", protect, adminOnly, getAllPosts);
router.patch("/post-moderation/:postId", protect, adminOnly, moderatePost);

// Appointments
router.get("/appointments", protect, adminOnly, getAllAppointments);

// Contact leads
router.get("/contact-leads", protect, adminOnly, getAllContactLeads);
router.patch("/contact-leads/:leadId", protect, adminOnly, updateContactLead);

// Vet Reviews
router.get("/vet-reviews", protect, adminOnly, getAllVetReviews);
router.delete("/vet-reviews/:reviewId", protect, adminOnly, adminDeleteVetReview);

// Events
router.get("/events", protect, adminOnly, getAdminEvents);
router.post("/events", protect, adminOnly, createAdminEvent);
router.patch("/events/:eventId", protect, adminOnly, updateAdminEvent);
router.delete("/events/:eventId", protect, adminOnly, deleteAdminEvent);

// Campaigns
router.get("/campaigns", protect, adminOnly, getAdminCampaigns);
router.post("/campaigns", protect, adminOnly, createAdminCampaign);
router.patch("/campaigns/:id", protect, adminOnly, updateAdminCampaign);
router.post("/campaigns/:id/publish", protect, adminOnly, publishAdminCampaign);
router.post("/campaigns/:id/cancel", protect, adminOnly, cancelAdminCampaign);
router.post("/campaigns/:id/resend", protect, adminOnly, resendAdminCampaign);
router.delete("/campaigns/:id", protect, adminOnly, deleteAdminCampaign);

// Q&A
router.get("/questions", protect, adminOnly, getAllQuestions);
router.post("/questions", protect, adminOnly, adminCreateQuestion);
router.delete("/questions/:id", protect, adminOnly, adminDeleteQuestion);
router.get("/questions/:id/answers", protect, adminOnly, adminGetAnswers);
router.delete("/questions/:id/answers/:answerId", protect, adminOnly, adminDeleteAnswer);

// Circles
router.get("/circles", protect, adminOnly, getAllCircles);
router.post("/circles", protect, adminOnly, adminCreateCircle);
router.delete("/circles/:id", protect, adminOnly, adminDeleteCircle);

// Lost Pets
router.get("/lost-pets", protect, adminOnly, getAllLostPets);
router.patch("/lost-pets/:id/status", protect, adminOnly, adminUpdateLostPetStatus);
router.delete("/lost-pets/:id", protect, adminOnly, adminDeleteLostPet);

export default router;
