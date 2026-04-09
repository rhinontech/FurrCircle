import type { Request, Response } from "express";
import db from "../models/index.ts";
import { Op } from "sequelize";

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
    const { appointments: Appointment, pets: Pet, vets: Vet } = db as any;
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
    const { appointments: Appointment } = db as any;
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
