import type { Response } from "express";
import db from "../models/index.ts";

// @desc    Get all reminders for the logged-in user
// @route   GET /api/reminders
export const getReminders = async (req: any, res: Response): Promise<void> => {
  try {
    const { reminders: Reminder, pets: Pet } = db as any;
    const reminders = await Reminder.findAll({
      where: { userId: req.user.id },
      include: [{ model: Pet, as: 'pet', attributes: ['id', 'name', 'species', 'avatar_url'] }],
      order: [['date', 'ASC'], ['time', 'ASC']],
    });
    res.json(reminders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new reminder
// @route   POST /api/reminders
export const createReminder = async (req: any, res: Response): Promise<void> => {
  try {
    const { reminders: Reminder, pets: Pet } = db as any;
    const { petId, title, notes, time, date, recurrence, type } = req.body;

    if (!title || !time) {
      res.status(400).json({ message: "Title and time are required" });
      return;
    }

    // If petId provided, verify it belongs to this user
    if (petId) {
      const pet = await Pet.findOne({ where: { id: petId, ownerId: req.user.id } });
      if (!pet) {
        res.status(403).json({ message: "Pet not found or not yours" });
        return;
      }
    }

    const reminder = await Reminder.create({
      userId: req.user.id,
      petId: petId || null,
      title,
      notes,
      time,
      date: date || null,
      recurrence: recurrence || 'none',
      type: type || 'general',
      isDone: false,
    });

    res.status(201).json(reminder);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a reminder
// @route   PUT /api/reminders/:id
export const updateReminder = async (req: any, res: Response): Promise<void> => {
  try {
    const { reminders: Reminder } = db as any;
    const reminder = await Reminder.findOne({ where: { id: req.params.id, userId: req.user.id } });

    if (!reminder) {
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    const updatableFields = ['title', 'notes', 'time', 'date', 'recurrence', 'type', 'petId'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        reminder[field] = req.body[field];
      }
    });

    await reminder.save();
    res.json(reminder);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle reminder isDone status
// @route   PATCH /api/reminders/:id/toggle
export const toggleReminder = async (req: any, res: Response): Promise<void> => {
  try {
    const { reminders: Reminder } = db as any;
    const reminder = await Reminder.findOne({ where: { id: req.params.id, userId: req.user.id } });

    if (!reminder) {
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    reminder.isDone = !reminder.isDone;
    await reminder.save();

    res.json({ isDone: reminder.isDone, reminder });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
export const deleteReminder = async (req: any, res: Response): Promise<void> => {
  try {
    const { reminders: Reminder } = db as any;
    const reminder = await Reminder.findOne({ where: { id: req.params.id, userId: req.user.id } });

    if (!reminder) {
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    await reminder.destroy();
    res.json({ message: "Reminder deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
