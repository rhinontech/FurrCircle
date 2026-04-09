import type { Request, Response } from "express";
import db from "../models/index.ts";

const verifyPetOwnership = async (petId: string, userId: string): Promise<boolean> => {
  const { pets: Pet } = db as any;
  const pet = await Pet.findOne({ where: { id: petId, ownerId: userId } });
  return !!pet;
};

// --- Vitals ---
export const getVitals = async (req: any, res: Response): Promise<void> => {
  try {
    const { vitals: Vital } = db as any;
    if (!(await verifyPetOwnership(req.params.petId, req.user.id))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const vitals = await Vital.findAll({ where: { petId: req.params.petId }, order: [['timestamp', 'DESC']] });
    res.json(vitals);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addVital = async (req: any, res: Response): Promise<void> => {
  try {
    const { vitals: Vital } = db as any;
    if (!(await verifyPetOwnership(req.params.petId, req.user.id))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const vital = await Vital.create({ ...req.body, petId: req.params.petId });
    res.status(201).json(vital);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- Vaccines ---
export const getVaccines = async (req: any, res: Response): Promise<void> => {
  try {
    const { vaccines: Vaccine } = db as any;
    if (!(await verifyPetOwnership(req.params.petId, req.user.id))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const vaccines = await Vaccine.findAll({ where: { petId: req.params.petId }, order: [['dateAdministered', 'DESC']] });
    res.json(vaccines);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addVaccine = async (req: any, res: Response): Promise<void> => {
  try {
    const { vaccines: Vaccine } = db as any;
    if (!(await verifyPetOwnership(req.params.petId, req.user.id))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const vaccine = await Vaccine.create({ ...req.body, petId: req.params.petId });
    res.status(201).json(vaccine);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- Medications ---
export const getMedications = async (req: any, res: Response): Promise<void> => {
  try {
    const { medications: Medication } = db as any;
    if (!(await verifyPetOwnership(req.params.petId, req.user.id))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const meds = await Medication.findAll({ where: { petId: req.params.petId } });
    res.json(meds);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addMedication = async (req: any, res: Response): Promise<void> => {
  try {
    const { medications: Medication } = db as any;
    if (!(await verifyPetOwnership(req.params.petId, req.user.id))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const med = await Medication.create({ ...req.body, petId: req.params.petId });
    res.status(201).json(med);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- Medical Records ---
export const getMedicalRecords = async (req: any, res: Response): Promise<void> => {
  try {
    const { medical_records: MedicalRecord } = db as any;
    if (!(await verifyPetOwnership(req.params.petId, req.user.id))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const records = await MedicalRecord.findAll({ where: { petId: req.params.petId }, order: [['date', 'DESC']] });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addMedicalRecord = async (req: any, res: Response): Promise<void> => {
  try {
    const { medical_records: MedicalRecord } = db as any;
    if (!(await verifyPetOwnership(req.params.petId, req.user.id))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const record = await MedicalRecord.create({ ...req.body, petId: req.params.petId });
    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
