import express from "express";
import {
  getVets,
  createAppointment,
  getOwnerAppointments,
  getVetAppointments,
  updateAppointmentStatus,
  getVetStats,
} from "../controllers/appointmentController.ts";
import { protect, ownerOnly, vetOnly } from "../middleware/authMiddleware.ts";

const router = express.Router();

// List verified vets - any logged in user can browse
router.get("/vets", protect, getVets);

// Appointment CRUD
router.get("/vet/stats", protect, vetOnly, getVetStats);
router.post("/", protect, ownerOnly, createAppointment);
router.get("/owner", protect, ownerOnly, getOwnerAppointments);
router.get("/vet", protect, vetOnly, getVetAppointments);
router.patch("/:id/status", protect, updateAppointmentStatus);

export default router;
