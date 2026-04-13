import express from "express";
import {
  getVets,
  createAppointment,
  getOwnerAppointments,
  getVetAppointments,
  updateAppointmentStatus,
  getVetStats,
  getPendingAppointmentFeedback,
  submitAppointmentFeedback,
  requestAppointmentReschedule,
  respondToAppointmentReschedule,
} from "../controllers/appointmentController.ts";
import { protect, userAccountOnly, verifiedVetOnly } from "../middleware/authMiddleware.ts";

const router = express.Router();

// List verified vets - any logged in user can browse
router.get("/vets", protect, getVets);

// Appointment CRUD
router.get("/vet/stats", protect, verifiedVetOnly, getVetStats);
router.get("/feedback/pending", protect, getPendingAppointmentFeedback);
router.post("/", protect, userAccountOnly, createAppointment);
router.get("/owner", protect, userAccountOnly, getOwnerAppointments);
router.get("/vet", protect, verifiedVetOnly, getVetAppointments);
router.patch("/:id/reschedule", protect, requestAppointmentReschedule);
router.patch("/:id/reschedule/respond", protect, respondToAppointmentReschedule);
router.post("/:id/feedback", protect, submitAppointmentFeedback);
router.patch("/:id/status", protect, updateAppointmentStatus);

export default router;
