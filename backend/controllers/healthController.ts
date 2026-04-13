import type { Response } from "express";
import db from "../models/index.ts";
import { createNotification } from "../services/notificationService.ts";
import { generateVaccineCertificate } from "../services/certificateService.ts";

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
  imageUrl: body.imageUrl ?? null,
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
    const { vaccines: Vaccine, vets: Vet } = db as any;
    if (!(await canAccessPet(req.params.petId, req.user.id, req.userType || "user"))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }
    const vaccines = await Vaccine.findAll({
      where: { petId: req.params.petId },
      order: [["dateAdministered", "DESC"]],
      include: [
        {
          model: Vet,
          as: 'vet',
          attributes: ['id', 'name', 'hospital_name', 'avatar_url', 'clinicStampUrl', 'licenseNumber', 'address'],
          required: false,
        }
      ]
    });
    res.json(vaccines);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addVaccine = async (req: any, res: Response): Promise<void> => {
  try {
    const { vaccines: Vaccine, pets: Pet, vets: Vet, appointments: Appointment } = db as any;
    const userType: "user" | "vet" = req.userType || "user";
    const isVet = userType === "vet";

    if (!(await canAccessPet(req.params.petId, req.user.id, userType))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }

    // hasCertificate: vet can pass true (default true for vets), owner always false
    const hasCertificate = isVet ? (req.body.hasCertificate !== false) : false;

    const vaccine = await Vaccine.create({
      name: req.body.name,
      dateAdministered: req.body.dateAdministered,
      nextDueDate: req.body.nextDueDate || null,
      status: req.body.status || "done",
      petId: req.params.petId,
      addedByRole: isVet ? "vet" : "owner",
      addedByVetId: isVet ? req.user.id : null,
      hasCertificate: false, // will update after cert generation
    });

    // Auto-generate certificate if vet opted in
    if (isVet && hasCertificate) {
      try {
        const [vet, pet] = await Promise.all([
          Vet.findByPk(req.user.id),
          Pet.findByPk(req.params.petId),
        ]);

        const certificateUrl = await generateVaccineCertificate({
          petName: pet?.name || "Pet",
          petSpecies: pet?.species,
          petBreed: pet?.breed,
          vaccineName: vaccine.name,
          dateAdministered: vaccine.dateAdministered || new Date().toISOString().slice(0, 10),
          nextDueDate: vaccine.nextDueDate,
          vetName: vet?.name || "Veterinarian",
          clinicName: vet?.hospital_name,
          clinicCity: vet?.city,
          licenseNumber: vet?.licenseNumber,
          clinicStampUrl: vet?.clinicStampUrl,
        });

        await vaccine.update({ certificateUrl, hasCertificate: true });
      } catch (certErr: any) {
        // Certificate generation failed — log but don't fail the whole request
        console.error("Certificate generation failed:", certErr.message);
      }
    }

    // If owner added vaccine, notify any vet who has an appointment for this pet
    if (!isVet) {
      try {
        const pet = await Pet.findByPk(req.params.petId);
        const appt = await Appointment.findOne({
          where: { petId: req.params.petId },
          order: [["createdAt", "DESC"]],
        });
        if (appt?.vetId) {
          await createNotification(
            appt.vetId,
            "vet",
            "vaccine_review",
            "Vaccine Record Added",
            `${pet?.name || "A pet"}'s owner added a vaccine record (${vaccine.name}). Review and approve a certificate if needed.`,
            vaccine.id,
            "vaccine"
          );
        }
      } catch {
        // Notification failure is non-fatal
      }
    }

    res.status(201).json(vaccine);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- Generate Certificate for existing vaccine (vet approving owner-added vaccine) ---
export const generateCertificate = async (req: any, res: Response): Promise<void> => {
  try {
    const { vaccines: Vaccine, pets: Pet, vets: Vet } = db as any;
    const userType: "user" | "vet" = req.userType || "user";
    if (userType !== "vet") {
      res.status(403).json({ message: "Only vets can generate certificates" });
      return;
    }

    const vaccine = await Vaccine.findOne({ where: { id: req.params.vaccineId, petId: req.params.petId } });
    if (!vaccine) {
      res.status(404).json({ message: "Vaccine not found" });
      return;
    }

    const [vet, pet] = await Promise.all([
      Vet.findByPk(req.user.id),
      Pet.findByPk(req.params.petId),
    ]);

    const certificateUrl = await generateVaccineCertificate({
      petName: pet?.name || "Pet",
      petSpecies: pet?.species,
      petBreed: pet?.breed,
      vaccineName: vaccine.name,
      dateAdministered: vaccine.dateAdministered || new Date().toISOString().slice(0, 10),
      nextDueDate: vaccine.nextDueDate,
      vetName: vet?.name || "Veterinarian",
      clinicName: vet?.hospital_name,
      clinicCity: vet?.city,
      licenseNumber: vet?.licenseNumber,
      clinicStampUrl: vet?.clinicStampUrl,
    });

    await vaccine.update({ certificateUrl, hasCertificate: true, addedByVetId: req.user.id });

    res.json({ certificateUrl });
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

export const deleteMedication = async (req: any, res: Response): Promise<void> => {
  try {
    const { medications: Medication } = db as any;
    if (!(await canAccessPet(req.params.petId, req.user.id, req.userType || "user"))) {
      res.status(403).json({ message: "Not authorized for this pet" });
      return;
    }

    const med = await Medication.findOne({ where: { id: req.params.medId, petId: req.params.petId } });
    if (!med) {
      res.status(404).json({ message: "Medication not found" });
      return;
    }

    await med.destroy();
    res.json({ message: "Medication deleted" });
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
