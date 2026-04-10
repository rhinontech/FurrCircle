import type { Response } from "express";
import db from "../models/index.ts";

const canAccessPet = async (petId: string, userId: string, userType: "user" | "vet"): Promise<boolean> => {
  const { pets: Pet, appointments: Appointment } = db as any;

  if (userType === "vet") {
    const appointment = await Appointment.findOne({ where: { petId, vetId: userId } });
    return !!appointment;
  }

  const pet = await Pet.findOne({ where: { id: petId, ownerId: userId } });
  return !!pet;
};

const parseVitalPayload = (body: Record<string, unknown>) => {
  if (body.type && body.value !== undefined) {
    const type = String(body.type).toLowerCase();
    const value = String(body.value);
    const numericValue = Number(value);
    const payload: Record<string, unknown> = {
      notes: body.notes ? String(body.notes) : undefined,
    };

    if (type.includes("weight")) {
      payload.weight = Number.isNaN(numericValue) ? null : numericValue;
    } else if (type.includes("heart")) {
      payload.heartRate = Number.isNaN(numericValue) ? null : numericValue;
    } else if (type.includes("temp")) {
      payload.temperature = Number.isNaN(numericValue) ? null : numericValue;
    } else if (type.includes("blood")) {
      payload.bloodPressure = value;
    }

    return payload;
  }

  return body;
};

const parseMedicalRecordPayload = (body: Record<string, unknown>) => ({
  type: body.type ?? body.title ?? "Medical Visit",
  description: body.description ?? body.clinic_name ?? "",
  veterinarian: body.veterinarian ?? body.veterinarian_name ?? "",
  notes: body.notes ?? "",
  date: body.date ?? new Date().toISOString().slice(0, 10),
});

// --- Vitals ---
export const getVitals = async (req: any, res: Response): Promise<void> => {
  try {
    const { vitals: Vital } = db as any;
    if (!(await canAccessPet(req.params.petId, req.user.id, req.userType || "user"))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const vitals = await Vital.findAll({ where: { petId: req.params.petId }, order: [["timestamp", "DESC"]] });
    res.json(vitals);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addVital = async (req: any, res: Response): Promise<void> => {
  try {
    const { vitals: Vital } = db as any;
    if (!(await canAccessPet(req.params.petId, req.user.id, req.userType || "user"))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }

    const vital = await Vital.create({ ...parseVitalPayload(req.body || {}), petId: req.params.petId });
    res.status(201).json(vital);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- Vaccines ---
export const getVaccines = async (req: any, res: Response): Promise<void> => {
  try {
    const { vaccines: Vaccine } = db as any;
    if (!(await canAccessPet(req.params.petId, req.user.id, req.userType || "user"))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const vaccines = await Vaccine.findAll({ where: { petId: req.params.petId }, order: [["dateAdministered", "DESC"]] });
    res.json(vaccines);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addVaccine = async (req: any, res: Response): Promise<void> => {
  try {
    const { vaccines: Vaccine } = db as any;
    if (!(await canAccessPet(req.params.petId, req.user.id, req.userType || "user"))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }

    const vaccine = await Vaccine.create({
      ...req.body,
      status: req.body?.status || "done",
      petId: req.params.petId,
    });
    res.status(201).json(vaccine);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- Medications ---
export const getMedications = async (req: any, res: Response): Promise<void> => {
  try {
    const { medications: Medication } = db as any;
    if (!(await canAccessPet(req.params.petId, req.user.id, req.userType || "user"))) {
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
    if (!(await canAccessPet(req.params.petId, req.user.id, req.userType || "user"))) {
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
    if (!(await canAccessPet(req.params.petId, req.user.id, req.userType || "user"))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const records = await MedicalRecord.findAll({ where: { petId: req.params.petId }, order: [["date", "DESC"]] });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addMedicalRecord = async (req: any, res: Response): Promise<void> => {
  try {
    const { medical_records: MedicalRecord } = db as any;
    if (!(await canAccessPet(req.params.petId, req.user.id, req.userType || "user"))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const record = await MedicalRecord.create({ ...parseMedicalRecordPayload(req.body || {}), petId: req.params.petId });
    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- Allergies ---
export const getAllergies = async (req: any, res: Response): Promise<void> => {
  try {
    const { allergies: Allergy } = db as any;
    if (!(await canAccessPet(req.params.petId, req.user.id, req.userType || "user"))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const allergies = await Allergy.findAll({ where: { petId: req.params.petId }, order: [["diagnosedAt", "DESC"]] });
    res.json(allergies);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addAllergy = async (req: any, res: Response): Promise<void> => {
  try {
    const { allergies: Allergy } = db as any;
    if (!(await canAccessPet(req.params.petId, req.user.id, req.userType || "user"))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }

    const allergy = await Allergy.create({
      petId: req.params.petId,
      allergen: req.body?.allergen,
      severity: req.body?.severity || "moderate",
      reaction: req.body?.reaction || "",
      notes: req.body?.notes || "",
      diagnosedAt: req.body?.diagnosedAt || new Date().toISOString().slice(0, 10),
    });

    res.status(201).json(allergy);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
