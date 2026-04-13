import type { Request, Response } from "express";
import db from "../models/index.ts";
import { Op } from "sequelize";
import { createNotification } from "../services/notificationService.ts";

const parseFeedbackPayload = (body: any) => {
  const rating = Number(body?.rating);
  const tags = Array.isArray(body?.tags)
    ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean).slice(0, 8)
    : [];
  const comment = String(body?.comment || "").trim();

  return { rating, tags, comment };
};

const buildReviewText = (tags: string[], comment: string) => {
  const parts = [];
  if (tags.length > 0) parts.push(tags.join(", "));
  if (comment) parts.push(comment);
  return parts.join("\n\n");
};

const recalculateVetRating = async (vetId: string) => {
  const { vet_reviews: VetReview, vets: Vet } = db as any;
  const [vet, allReviews] = await Promise.all([
    Vet.findByPk(vetId),
    VetReview.findAll({ where: { vetId } }),
  ]);

  if (!vet) return;

  vet.rating =
    allReviews.length > 0
      ? Math.round(
          (allReviews.reduce((sum: number, item: any) => sum + Number(item.rating || 0), 0) /
            allReviews.length) *
            10
        ) / 10
      : 0;
  await vet.save();
};

const parseReschedulePayload = (body: any) => {
  const date = String(body?.date || "").trim();
  const time = String(body?.time || "").trim();
  const reason = String(body?.reason || "").trim();
  return { date, time, reason };
};

// @desc    List all verified veterinarians
// @route   GET /api/vets
export const getVets = async (req: any, res: Response): Promise<void> => {
  try {
    const { vets: Vet } = db as any;
    const vets = await Vet.findAll({
      where: { isVerified: true },
      attributes: { exclude: ['password'] }
    });
    res.json(vets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Book an appointment (owner)
// @route   POST /api/appointments
export const createAppointment = async (req: any, res: Response): Promise<void> => {
  try {
    const { appointments: Appointment, pets: Pet, vets: Vet, reminders: Reminder } = db as any;
    const { vetId, petId, date, time, reason } = req.body;

    // Verify the pet belongs to this owner
    const pet = await Pet.findOne({ where: { id: petId, ownerId: req.user.id } });
    if (!pet) {
      res.status(403).json({ message: "Pet not found or not yours" });
      return;
    }

    // Verify vet exists and is verified
    const vet = await Vet.findOne({ where: { id: vetId, isVerified: true } });
    if (!vet) {
      res.status(404).json({ message: "Veterinarian not found" });
      return;
    }

    const appointment = await Appointment.create({
      ownerId: req.user.id,
      vetId,
      petId,
      date,
      time,
      reason,
      status: 'pending',
    });

    await Reminder.create({
      userId: req.user.id,
      petId,
      title: `Appointment request with ${vet.hospital_name || vet.name}`,
      notes: reason || '',
      time: time || '09:00',
      date: date || null,
      recurrence: 'none',
      type: 'appointment',
      isDone: false,
      appointmentId: appointment.id,
    });

    // Notify the vet about the new appointment request
    await createNotification(
      vetId,
      "vet",
      "appointment",
      "New Appointment Request",
      `${req.user.name || "A pet owner"} has requested an appointment on ${date} at ${time}.`,
      appointment.id,
      "appointment"
    );

    res.status(201).json(appointment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get appointments for the logged-in owner
// @route   GET /api/appointments/owner
export const getOwnerAppointments = async (req: any, res: Response): Promise<void> => {
  try {
    const { appointments: Appointment, pets: Pet, vets: Vet } = db as any;
    const appointments = await Appointment.findAll({
      where: { ownerId: req.user.id },
      include: [
        { model: Vet, as: 'veterinarian', attributes: ['id', 'name', 'email', 'hospital_name', 'avatar_url'] },
        { model: Pet, as: 'pet', attributes: ['id', 'name', 'species', 'breed', 'avatar_url'] },
      ],
      order: [['date', 'DESC'], ['time', 'DESC']],
    });
    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get appointments for the logged-in vet
// @route   GET /api/appointments/vet
export const getVetAppointments = async (req: any, res: Response): Promise<void> => {
  try {
    const { appointments: Appointment, users: User, pets: Pet } = db as any;
    const appointments = await Appointment.findAll({
      where: { vetId: req.user.id },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar_url'] },
        { model: Pet, as: 'pet', attributes: ['id', 'name', 'species', 'breed', 'avatar_url'] },
      ],
      order: [['date', 'ASC'], ['time', 'ASC']],
    });
    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status (vet confirms/cancels, or owner cancels)
// @route   PATCH /api/appointments/:id/status
export const updateAppointmentStatus = async (req: any, res: Response): Promise<void> => {
  try {
    const { appointments: Appointment, reminders: Reminder } = db as any;
    const { status, notes } = req.body;
    const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
      return;
    }

    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      res.status(404).json({ message: "Appointment not found" });
      return;
    }

    const isOwner = appointment.ownerId === req.user.id;
    const isVet = appointment.vetId === req.user.id;

    if (!isOwner && !isVet) {
      res.status(403).json({ message: "Not authorized to modify this appointment" });
      return;
    }

    if (isOwner && status !== 'cancelled') {
      res.status(403).json({ message: "Owners can only cancel appointments" });
      return;
    }

    if (isVet && status === 'cancelled' && !String(notes || "").trim()) {
      res.status(400).json({ message: "Please provide a reason for declining or cancelling this appointment" });
      return;
    }

    appointment.status = status;
    if (notes !== undefined) appointment.notes = String(notes).trim();
    await appointment.save();

    // Mark the linked appointment reminder as done when cancelled or completed
    if (status === 'cancelled' || status === 'completed') {
      await Reminder.update(
        { isDone: true },
        { where: { appointmentId: appointment.id } }
      );
    }

    // Notify the other party about the status change
    const statusLabels: Record<string, string> = {
      confirmed: "confirmed",
      cancelled: "cancelled",
      completed: "completed",
    };
    const label = statusLabels[status] || status;

    if (isVet) {
      const reasonText = status === "cancelled" && appointment.notes ? ` Reason: ${appointment.notes}` : "";
      // Vet changed status → notify owner
      await createNotification(
        appointment.ownerId,
        "user",
        "appointment",
        `Appointment ${label.charAt(0).toUpperCase() + label.slice(1)}`,
        `Your appointment has been ${label} by the veterinarian.${reasonText}`,
        appointment.id,
        "appointment"
      );
    } else if (isOwner) {
      // Owner cancelled → notify vet
      await createNotification(
        appointment.vetId,
        "vet",
        "appointment",
        "Appointment Cancelled",
        "An owner has cancelled their appointment.",
        appointment.id,
        "appointment"
      );
    }

    res.json(appointment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request a new appointment time
// @route   PATCH /api/appointments/:id/reschedule
export const requestAppointmentReschedule = async (req: any, res: Response): Promise<void> => {
  try {
    const { appointments: Appointment } = db as any;
    const { date, time, reason } = parseReschedulePayload(req.body);

    if (!date || !time) {
      res.status(400).json({ message: "Please provide a new date and time" });
      return;
    }

    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      res.status(404).json({ message: "Appointment not found" });
      return;
    }

    const isOwner = req.userType === "user" && appointment.ownerId === req.user.id;
    const isVet = req.userType === "vet" && appointment.vetId === req.user.id;

    if (!isOwner && !isVet) {
      res.status(403).json({ message: "Not authorized to reschedule this appointment" });
      return;
    }

    if (!["confirmed", "reschedule_requested"].includes(String(appointment.status || ""))) {
      res.status(400).json({ message: "Only confirmed appointments can be rescheduled" });
      return;
    }

    appointment.status = "reschedule_requested";
    appointment.proposedDate = date;
    appointment.proposedTime = time;
    appointment.rescheduleRequestedBy = isVet ? "vet" : "owner";
    appointment.rescheduleReason = reason;
    await appointment.save();

    if (isVet) {
      await createNotification(
        appointment.ownerId,
        "user",
        "appointment",
        "Appointment Reschedule Request",
        `Your vet requested a new appointment time: ${date} at ${time}. You can accept, suggest another time, or cancel.`,
        appointment.id,
        "appointment"
      );
    } else {
      await createNotification(
        appointment.vetId,
        "vet",
        "appointment",
        "Owner Suggested New Time",
        `The owner suggested a new appointment time: ${date} at ${time}.`,
        appointment.id,
        "appointment"
      );
    }

    res.json(appointment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept or counter a reschedule request
// @route   PATCH /api/appointments/:id/reschedule/respond
export const respondToAppointmentReschedule = async (req: any, res: Response): Promise<void> => {
  try {
    const { appointments: Appointment, reminders: Reminder } = db as any;
    const { action } = req.body;
    const { date, time, reason } = parseReschedulePayload(req.body);

    if (!["accept", "counter", "cancel"].includes(action)) {
      res.status(400).json({ message: "Action must be accept, counter, or cancel" });
      return;
    }

    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      res.status(404).json({ message: "Appointment not found" });
      return;
    }

    const isOwner = req.userType === "user" && appointment.ownerId === req.user.id;
    const isVet = req.userType === "vet" && appointment.vetId === req.user.id;

    if (!isOwner && !isVet) {
      res.status(403).json({ message: "Not authorized to respond to this appointment" });
      return;
    }

    if (appointment.status !== "reschedule_requested") {
      res.status(400).json({ message: "This appointment does not have a pending reschedule request" });
      return;
    }

    if (action === "accept") {
      if (!appointment.proposedDate || !appointment.proposedTime) {
        res.status(400).json({ message: "No proposed date or time found" });
        return;
      }

      appointment.date = appointment.proposedDate;
      appointment.time = appointment.proposedTime;
      appointment.status = "confirmed";
      appointment.proposedDate = null;
      appointment.proposedTime = null;
      appointment.rescheduleRequestedBy = null;
      appointment.rescheduleReason = null;
      await appointment.save();

      await Reminder.update(
        { date: appointment.date, time: appointment.time },
        { where: { appointmentId: appointment.id } }
      );

      await createNotification(
        isOwner ? appointment.vetId : appointment.ownerId,
        isOwner ? "vet" : "user",
        "appointment",
        "Appointment Reschedule Accepted",
        `The appointment has been rescheduled to ${appointment.date} at ${appointment.time}.`,
        appointment.id,
        "appointment"
      );

      res.json(appointment);
      return;
    }

    if (action === "cancel") {
      appointment.status = "cancelled";
      appointment.notes = reason || "Cancelled during reschedule";
      appointment.proposedDate = null;
      appointment.proposedTime = null;
      appointment.rescheduleRequestedBy = null;
      appointment.rescheduleReason = null;
      await appointment.save();

      await Reminder.update(
        { isDone: true },
        { where: { appointmentId: appointment.id } }
      );

      await createNotification(
        isOwner ? appointment.vetId : appointment.ownerId,
        isOwner ? "vet" : "user",
        "appointment",
        "Appointment Cancelled",
        "The appointment was cancelled during rescheduling.",
        appointment.id,
        "appointment"
      );

      res.json(appointment);
      return;
    }

    if (!date || !time) {
      res.status(400).json({ message: "Please provide a new date and time" });
      return;
    }

    appointment.proposedDate = date;
    appointment.proposedTime = time;
    appointment.rescheduleRequestedBy = isVet ? "vet" : "owner";
    appointment.rescheduleReason = reason;
    await appointment.save();

    await createNotification(
      isOwner ? appointment.vetId : appointment.ownerId,
      isOwner ? "vet" : "user",
      "appointment",
      "New Reschedule Suggestion",
      `${isOwner ? "The owner" : "The vet"} suggested a new appointment time: ${date} at ${time}.`,
      appointment.id,
      "appointment"
    );

    res.json(appointment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get the next completed appointment that needs feedback
// @route   GET /api/appointments/feedback/pending
export const getPendingAppointmentFeedback = async (req: any, res: Response): Promise<void> => {
  try {
    const { appointments: Appointment, pets: Pet, vets: Vet, users: User } = db as any;
    const isVet = req.userType === "vet";

    const appointment = await Appointment.findOne({
      where: isVet
        ? {
            vetId: req.user.id,
            status: "completed",
            vetFeedbackSubmittedAt: { [Op.is]: null },
          }
        : {
            ownerId: req.user.id,
            status: "completed",
            ownerFeedbackSubmittedAt: { [Op.is]: null },
          },
      include: [
        { model: Vet, as: "veterinarian", attributes: ["id", "name", "hospital_name", "avatar_url"] },
        { model: User, as: "owner", attributes: ["id", "name", "avatar_url"] },
        { model: Pet, as: "pet", attributes: ["id", "name", "species", "breed", "avatar_url"] },
      ],
      order: [["updatedAt", "ASC"]],
    });

    res.json({ appointment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit feedback after a completed appointment
// @route   POST /api/appointments/:id/feedback
export const submitAppointmentFeedback = async (req: any, res: Response): Promise<void> => {
  try {
    const { appointments: Appointment, vet_reviews: VetReview } = db as any;
    const { rating, tags, comment } = parseFeedbackPayload(req.body);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5" });
      return;
    }

    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      res.status(404).json({ message: "Appointment not found" });
      return;
    }

    if (appointment.status !== "completed") {
      res.status(400).json({ message: "Feedback is available only after the appointment is completed" });
      return;
    }

    const isOwner = req.userType === "user" && appointment.ownerId === req.user.id;
    const isVet = req.userType === "vet" && appointment.vetId === req.user.id;

    if (!isOwner && !isVet) {
      res.status(403).json({ message: "Not authorized to review this appointment" });
      return;
    }

    if (isOwner) {
      appointment.ownerFeedbackRating = rating;
      appointment.ownerFeedbackTags = tags;
      appointment.ownerFeedbackComment = comment;
      appointment.ownerFeedbackSubmittedAt = new Date();

      const [vetReview, created] = await VetReview.findOrCreate({
        where: { vetId: appointment.vetId, userId: appointment.ownerId },
        defaults: {
          vetId: appointment.vetId,
          userId: appointment.ownerId,
          rating,
          review: buildReviewText(tags, comment),
          date: new Date().toISOString().split("T")[0],
        },
      });

      if (!created) {
        vetReview.rating = rating;
        vetReview.review = buildReviewText(tags, comment);
        vetReview.date = new Date().toISOString().split("T")[0];
        await vetReview.save();
      }

      await appointment.save();
      await recalculateVetRating(appointment.vetId);
    } else {
      appointment.vetFeedbackRating = rating;
      appointment.vetFeedbackTags = tags;
      appointment.vetFeedbackComment = comment;
      appointment.vetFeedbackSubmittedAt = new Date();
      await appointment.save();
    }

    res.json({ appointment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stats for the vet dashboard
// @route   GET /api/appointments/vet/stats
export const getVetStats = async (req: any, res: Response): Promise<void> => {
  try {
    const { appointments: Appointment, vets: Vet } = db as any;
    const today = new Date().toISOString().split('T')[0];

    const [todayCount, pendingCount, totalPatients, vet] = await Promise.all([
      Appointment.count({ where: { vetId: req.user.id, date: today } }),
      Appointment.count({ where: { vetId: req.user.id, status: 'pending' } }),
      Appointment.count({ where: { vetId: req.user.id }, distinct: true, col: 'petId' }),
      Vet.findByPk(req.user.id, { attributes: ['rating'] }),
    ]);

    res.json({
      todayAppointments: todayCount,
      totalPatients,
      avgRating: vet?.rating || 0,
      pendingAppointments: pendingCount,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
