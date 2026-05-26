import express from "express";
import {
  getReminders,
  createReminder,
  updateReminder,
  toggleReminder,
  deleteReminder,
} from "../controllers/reminderController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.route("/")
  .get(protect, getReminders)
  .post(protect, createReminder);

router.route("/:id")
  .put(protect, updateReminder)
  .delete(protect, deleteReminder);

router.patch("/:id/toggle", protect, toggleReminder);

export default router;
