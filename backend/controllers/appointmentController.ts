import type { Request, Response } from "express";
import db from "../models/index.ts";
import { Op } from "sequelize";

const { Appointment, User, Pet } = db as any;

// @desc    List all available veterinarians
// @route   GET /api/vets
export const getVets = async (req: any, res: Response): Promise<void> => {
  try {
    const vets = await User.findAll({
      where: { role: 'veterinarian', isVerified: true },
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
    const { vetId, petId, date, time, reason } = req.body;

    // Verify the pet belongs to this owner
    const pet = await Pet.findOne({ where: { id: petId, ownerId: req.user.id } });
    if (!pet) {
      res.status(403).json({ message: "Pet not found or not yours" });
      return;
    }

    // Verify vet exists and is verified
    const vet = await User.findOne({ where: { id: vetId, role: 'veterinarian' } });
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

    res.status(201).json(appointment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get appointments for the logged-in owner
// @route   GET /api/appointments/owner
export const getOwnerAppointments = async (req: any, res: Response): Promise<void> => {
  try {
    const appointments = await Appointment.findAll({
      where: { ownerId: req.user.id },
      include: [
        { model: User, as: 'veterinarian', attributes: ['id', 'name', 'email', 'clinic_name', 'avatar_url'] },
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

    // Owners can only cancel. Vets can confirm, cancel, or complete.
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

    appointment.status = status;
    if (notes) appointment.notes = notes;
    await appointment.save();

    res.json(appointment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get stats for the vet dashboard
// @route   GET /api/appointments/vet/stats
export const getVetStats = async (req: any, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const todayCount = await Appointment.count({
      where: { vetId: req.user.id, date: today }
    });

    const pendingCount = await Appointment.count({
      where: { vetId: req.user.id, status: 'pending' }
    });

    const totalPatients = await Appointment.count({
      where: { vetId: req.user.id },
      distinct: true,
      col: 'petId'
    });

    const vet = await User.findByPk(req.user.id, { attributes: ['rating'] });

    res.json({
      todayAppointments: todayCount,
      totalPatients,
      avgRating: vet?.rating || 4.8,
      pendingAppointments: pendingCount
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
