import type { Request, Response } from "express";
import db from "../models/index.ts";

// @desc    List saved vets for current user
// @route   GET /api/saved-vets
export const listSavedVets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { saved_vets: SavedVet, vets: Vet } = db as any;
    const userId = (req as any).user?.id;

    const rows = await SavedVet.findAll({
      where: { userId },
      include: [{ model: Vet, as: "vet", attributes: ["id", "name", "hospital_name", "profession", "avatar_url", "phone", "city", "rating", "bio", "working_hours", "isVerified"] }],
      order: [["createdAt", "DESC"]],
    });

    const vets = rows
      .filter((r: any) => r.vet)
      .map((r: any) => ({
        savedVetId: r.id,
        ...r.vet.toJSON(),
      }));

    res.json(vets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save a vet
// @route   POST /api/saved-vets/:vetId
export const saveVet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { saved_vets: SavedVet, vets: Vet } = db as any;
    const userId = (req as any).user?.id;
    const userType = (req as any).userType || "user";
    const { vetId } = req.params;

    const vet = await Vet.findByPk(vetId);
    if (!vet) {
      res.status(404).json({ message: "Vet not found" });
      return;
    }

    const [row, created] = await SavedVet.findOrCreate({
      where: { userId, vetId },
      defaults: { userId, userType, vetId },
    });

    res.status(created ? 201 : 200).json({ saved: true, savedVetId: row.id });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unsave a vet
// @route   DELETE /api/saved-vets/:vetId
export const unsaveVet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { saved_vets: SavedVet } = db as any;
    const userId = (req as any).user?.id;
    const { vetId } = req.params;

    await SavedVet.destroy({ where: { userId, vetId } });
    res.json({ saved: false });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check if a vet is saved
// @route   GET /api/saved-vets/:vetId/status
export const getSaveStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { saved_vets: SavedVet } = db as any;
    const userId = (req as any).user?.id;
    const { vetId } = req.params;

    const row = await SavedVet.findOne({ where: { userId, vetId } });
    res.json({ saved: !!row });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get saved vets count
// @route   GET /api/saved-vets/count
export const getSavedVetsCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { saved_vets: SavedVet } = db as any;
    const userId = (req as any).user?.id;
    const count = await SavedVet.count({ where: { userId } });
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
