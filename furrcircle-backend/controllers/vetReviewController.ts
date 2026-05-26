import type { Request, Response } from "express";
import db from "../models/index.ts";
import { createRichNotification } from "../services/notificationService.ts";

// @desc    Get all reviews for a vet
// @route   GET /api/vets/:vetId/reviews
export const getVetReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vet_reviews: VetReview, users: User } = db as any;

    const reviews = await VetReview.findAll({
      where: { vetId: req.params.vetId },
      include: [{ model: User, as: "user", attributes: ["id", "name", "avatar_url"] }],
      order: [["createdAt", "DESC"]],
    });

    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit or update a review for a vet (owner only)
// @route   POST /api/vets/:vetId/reviews
export const submitVetReview = async (req: any, res: Response): Promise<void> => {
  try {
    const { vet_reviews: VetReview, vets: Vet, appointments: Appointment } = db as any;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5" });
      return;
    }

    const vet = await Vet.findByPk(req.params.vetId);
    if (!vet) {
      res.status(404).json({ message: "Veterinarian not found" });
      return;
    }

    // Only owners who have had a completed appointment with this vet can review
    const hasAppointment = await Appointment.findOne({
      where: { vetId: req.params.vetId, ownerId: req.user.id, status: "completed" },
    });

    if (!hasAppointment) {
      res.status(403).json({
        message: "You can only review a vet after a completed appointment.",
      });
      return;
    }

    // Upsert: one review per user per vet
    const [vetReview, created] = await VetReview.findOrCreate({
      where: { vetId: req.params.vetId, userId: req.user.id },
      defaults: {
        vetId: req.params.vetId,
        userId: req.user.id,
        rating,
        review: review || "",
        date: new Date().toISOString().split("T")[0],
      },
    });

    if (!created) {
      vetReview.rating = rating;
      vetReview.review = review || "";
      vetReview.date = new Date().toISOString().split("T")[0];
      await vetReview.save();
    }

    // Recalculate and update vet's average rating
    const allReviews = await VetReview.findAll({ where: { vetId: req.params.vetId } });
    const avg =
      allReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / allReviews.length;
    vet.rating = Math.round(avg * 10) / 10;
    await vet.save();

    res.status(created ? 201 : 200).json(vetReview);

    // Notify the vet (fire and forget)
    createRichNotification({
      actorId: req.params.vetId,
      actorType: "vet",
      type: "review",
      category: "activity",
      title: created ? "You received a new review" : "A review was updated",
      message: review ? String(review).slice(0, 80) : `${rating} star rating`,
      relatedId: req.params.vetId,
      sendPush: true,
    }).catch(() => {});
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete own review
// @route   DELETE /api/vets/:vetId/reviews
export const deleteVetReview = async (req: any, res: Response): Promise<void> => {
  try {
    const { vet_reviews: VetReview, vets: Vet } = db as any;

    const vetReview = await VetReview.findOne({
      where: { vetId: req.params.vetId, userId: req.user.id },
    });

    if (!vetReview) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    await vetReview.destroy();

    // Recalculate vet rating
    const vet = await Vet.findByPk(req.params.vetId);
    if (vet) {
      const allReviews = await VetReview.findAll({ where: { vetId: req.params.vetId } });
      vet.rating =
        allReviews.length > 0
          ? Math.round(
              (allReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
                allReviews.length) *
                10
            ) / 10
          : 0;
      await vet.save();
    }

    res.json({ message: "Review deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
