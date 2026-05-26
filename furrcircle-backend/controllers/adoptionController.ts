import type { Request, Response } from "express";
import db from "../models/index.ts";
import { createNotification } from "../services/notificationService.ts";
import { sendEmail } from "../services/emailService.ts";

// @desc    Submit an adoption/foster application
// @route   POST /api/adoptions/apply
export const submitApplication = async (req: any, res: Response): Promise<void> => {
  try {
    const { adoption_applications: Application, pets: Pet, users: User } = db as any;
    const { petId, type, message, phone, city } = req.body;

    if (!petId || !type) {
      res.status(400).json({ message: "petId and type (adoption|foster) are required" });
      return;
    }

    if (!["adoption", "foster"].includes(type)) {
      res.status(400).json({ message: "type must be 'adoption' or 'foster'" });
      return;
    }

    const pet = await Pet.findByPk(petId, {
      include: [{ model: User, as: "owner", attributes: ["id", "name", "email"] }],
    });

    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    const isOpen = type === "adoption" ? pet.isAdoptionOpen : pet.isFosterOpen;
    if (!isOpen) {
      res.status(400).json({ message: `This pet is not currently open for ${type}` });
      return;
    }

    // Prevent self-application
    if (pet.ownerId === req.user.id) {
      res.status(400).json({ message: "You cannot apply to adopt/foster your own pet" });
      return;
    }

    // Check for duplicate pending application
    const existing = await Application.findOne({
      where: { petId, applicantId: req.user.id, type, status: "pending" },
    });
    if (existing) {
      res.status(409).json({ message: "You already have a pending application for this pet" });
      return;
    }

    const application = await Application.create({
      petId,
      ownerId: pet.ownerId,
      applicantId: req.user.id,
      applicantType: req.userType || "user",
      type,
      status: "pending",
      message: message || "",
      applicantName: req.user.name,
      applicantEmail: req.user.email,
      applicantPhone: phone || req.user.phone,
      applicantCity: city || req.user.city,
    });

    // Notify the pet owner
    await createNotification(
      pet.ownerId,
      "user",
      "adoption",
      `New ${type.charAt(0).toUpperCase() + type.slice(1)} Application`,
      `${req.user.name || "Someone"} has applied to ${type} ${pet.name}.`,
      application.id,
      "adoption_application"
    );
    if (pet.owner?.email) {
      sendEmail(pet.owner.email, `New ${type} application for ${pet.name}`, "adoption-application-received", {
        ownerName: pet.owner.name || "there",
        applicantName: req.user.name || "Someone",
        petName: pet.name,
        type: type.charAt(0).toUpperCase() + type.slice(1),
      });
    }

    res.status(201).json(application);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    List applications sent by the current user
// @route   GET /api/adoptions/my-applications
export const listMyApplications = async (req: any, res: Response): Promise<void> => {
  try {
    const { adoption_applications: Application, pets: Pet } = db as any;
    const applications = await Application.findAll({
      where: { applicantId: req.user.id },
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name", "species", "breed", "avatar_url", "city"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    List applications received by the current user (for their pets)
// @route   GET /api/adoptions/received
export const listReceivedApplications = async (req: any, res: Response): Promise<void> => {
  try {
    const { adoption_applications: Application, pets: Pet } = db as any;
    const applications = await Application.findAll({
      where: { ownerId: req.user.id },
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name", "species", "breed", "avatar_url"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Review an application (approve/reject) — pet owner only
// @route   PATCH /api/adoptions/:id/review
export const reviewApplication = async (req: any, res: Response): Promise<void> => {
  try {
    const { adoption_applications: Application } = db as any;
    const { status, ownerNotes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ message: "status must be 'approved' or 'rejected'" });
      return;
    }

    const application = await Application.findOne({
      where: { id: req.params.id, ownerId: req.user.id },
    });

    if (!application) {
      res.status(404).json({ message: "Application not found or not yours to review" });
      return;
    }

    application.status = status;
    if (ownerNotes) application.ownerNotes = ownerNotes;
    await application.save();

    // Notify the applicant
    await createNotification(
      application.applicantId,
      application.applicantType || "user",
      "adoption",
      `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `Your ${application.type} application has been ${status}.${ownerNotes ? ` Note: ${ownerNotes}` : ""}`,
      application.id,
      "adoption_application"
    );
    if (application.applicantEmail) {
      const statusColors: Record<string, string> = {
        approved: "#27ae60",
        rejected: "#e74c3c",
        pending: "#f39c12",
      };
      const color = statusColors[status] || "#333";
      const statusBlock = `<span style="display:inline-block;padding:6px 16px;border-radius:20px;font-weight:700;font-size:14px;background:${color};color:#fff;">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
      const notesBlock = ownerNotes ? `<div class="notes-box">${ownerNotes}</div>` : "";
      sendEmail(application.applicantEmail, `Your ${application.type} application update`, "adoption-application-status", {
        applicantName: application.applicantName || "there",
        petName: application.petId,
        type: application.type,
        statusBlock,
        notesBlock,
      });
    }

    res.json(application);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    List ALL applications (admin)
// @route   GET /api/adoptions/admin
export const adminListApplications = async (req: any, res: Response): Promise<void> => {
  try {
    const { adoption_applications: Application, pets: Pet } = db as any;
    const { status, type } = req.query;

    const where: Record<string, any> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const applications = await Application.findAll({
      where,
      include: [
        {
          model: Pet,
          as: "pet",
          attributes: ["id", "name", "species", "breed", "avatar_url", "city"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
