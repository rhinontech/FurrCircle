import type { Response } from "express";
import db from "../models/index.ts";

const today = () => new Date().toISOString().slice(0, 10);

// @desc    Get daily log for a pet on a specific date
// @route   GET /api/pets/:id/daily-log
// @access  Private (Owner only)
export const getDailyLog = async (req: any, res: Response): Promise<void> => {
  try {
    const { pets: Pet, daily_logs: DailyLog } = db as any;
    const petId = req.params.id;
    const date = req.query.date ? String(req.query.date) : today();

    // Verify pet ownership
    const pet = await Pet.findOne({ where: { id: petId, ownerId: req.user.id } });
    if (!pet) {
      res.status(404).json({ message: "Pet not found or unauthorized" });
      return;
    }

    const log = await DailyLog.findOne({ where: { petId, date } });
    if (!log) {
      res.status(200).json(null);
      return;
    }

    res.json(log);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update daily log for a pet
// @route   POST /api/pets/:id/daily-log
// @access  Private (Owner only)
export const upsertDailyLog = async (req: any, res: Response): Promise<void> => {
  try {
    const { pets: Pet, daily_logs: DailyLog } = db as any;
    const petId = req.params.id;
    const { appetite, waterIntake, mood } = req.body;
    const date = req.body.date ? String(req.body.date) : today();

    if (!appetite || !waterIntake || !mood) {
      res.status(400).json({ message: "Please provide appetite, waterIntake, and mood" });
      return;
    }

    // Verify pet ownership
    const pet = await Pet.findOne({ where: { id: petId, ownerId: req.user.id } });
    if (!pet) {
      res.status(404).json({ message: "Pet not found or unauthorized" });
      return;
    }

    // Find and update or create log
    let log = await DailyLog.findOne({ where: { petId, date } });
    if (log) {
      log.appetite = appetite;
      log.waterIntake = waterIntake;
      log.mood = mood;
      await log.save();
    } else {
      log = await DailyLog.create({
        petId,
        date,
        appetite,
        waterIntake,
        mood
      });
    }

    res.status(200).json(log);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
