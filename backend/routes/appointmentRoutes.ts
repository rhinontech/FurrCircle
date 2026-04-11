import express from "express";
import {
  getVets,
  createAppointment,
  getOwnerAppointments,
  getVetAppointments,
  updateAppointmentStatus,
  getVetStats,
} from "../controllers/appointmentController.ts";
import { protect, userAccountOnly, verifiedVetOnly } from "../middleware/authMiddleware.ts";

const router = express.Router();

// List verified vets - any logged in user can browse
router.get("/vets", protect, getVets);

// Appointment CRUD
router.get("/vet/stats", protect, verifiedVetOnly, getVetStats);
router.post("/", protect, userAccountOnly, createAppointment);
router.get("/owner", protect, userAccountOnly, getOwnerAppointments);
router.get("/vet", protect, verifiedVetOnly, getVetAppointments);
router.patch("/:id/status", protect, updateAppointmentStatus);

export default router;
