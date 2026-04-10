import type { Request, Response } from "express";
import { Op } from "sequelize";
import db from "../models/index.ts";

const today = () => new Date().toISOString().slice(0, 10);

const toPlain = (value: any) => (value && typeof value.toJSON === "function" ? value.toJSON() : value);

const calculateHealthScore = (pet: any) => {
  const status = String(pet?.healthStatus || "").toLowerCase();

  if (!status || status.includes("healthy")) {
    return 95;
  }

  if (status.includes("due") || status.includes("check")) {
    return 84;
  }

  if (status.includes("recover") || status.includes("med")) {
    return 78;
  }

  return 72;
};

const sortByDateTimeAsc = (a: any, b: any) => `${a?.date || ""} ${a?.time || ""}`.localeCompare(`${b?.date || ""} ${b?.time || ""}`);
const sortByDateDesc = (field: string) => (a: any, b: any) => `${b?.[field] || ""}`.localeCompare(`${a?.[field] || ""}`);

const serializeAppointment = (appointment: any) => {
  const payload = toPlain(appointment);

  return {
    ...payload,
    appointment_date: payload?.appointment_date || payload?.date,
    appointment_time: payload?.appointment_time || payload?.time,
  };
};

const normalizePetPayload = (pet: any) => {
  const payload = toPlain(pet);
  const appointments = Array.isArray(payload?.Appointments)
    ? payload.Appointments.slice().sort(sortByDateTimeAsc).map(serializeAppointment)
    : [];

  return {
    ...payload,
    age: payload?.age != null ? String(payload.age) : payload?.age,
    Vaccines: Array.isArray(payload?.Vaccines) ? payload.Vaccines.slice().sort(sortByDateDesc("dateAdministered")) : [],
    Medications: Array.isArray(payload?.Medications) ? payload.Medications.slice().sort(sortByDateDesc("startDate")) : [],
    Allergies: Array.isArray(payload?.Allergies) ? payload.Allergies.slice().sort(sortByDateDesc("diagnosedAt")) : [],
    Appointments: appointments,
  };
};

const canViewPet = async (petId: string, req: any) => {
  const { pets: Pet, appointments: Appointment } = db as any;

  if (req.userType === "vet") {
    const appointment = await Appointment.findOne({ where: { petId, vetId: req.user.id } });
    return !!appointment;
  }

  const pet = await Pet.findOne({ where: { id: petId, ownerId: req.user.id } });
  return !!pet;
};

// @desc    Get logged in user's pets
// @route   GET /api/pets
export const getMyPets = async (req: any, res: Response): Promise<void> => {
  try {
    const { pets: Pet, appointments: Appointment, reminders: Reminder } = db as any;
    const pets = await Pet.findAll({
      where: { ownerId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    const enrichedPets = await Promise.all(
      pets.map(async (pet: any) => {
        const payload = normalizePetPayload(pet);

        const [nextAppointment, reminderCount] = await Promise.all([
          Appointment.findOne({
            where: {
              petId: payload.id,
              status: { [Op.in]: ["pending", "confirmed"] },
              date: { [Op.gte]: today() },
            },
            order: [["date", "ASC"], ["time", "ASC"]],
          }),
          Reminder.count({ where: { petId: payload.id, userId: req.user.id, isDone: false } }),
        ]);

        return {
          ...payload,
          nextVisit: nextAppointment ? nextAppointment.date : "--",
          reminderCount,
          healthScore: calculateHealthScore(payload),
        };
      })
    );

    res.json(enrichedPets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new pet
// @route   POST /api/pets
export const createPet = async (req: any, res: Response): Promise<void> => {
  try {
    const { pets: Pet } = db as any;
    const { name, species, breed, age, weight, city, birth_date, gender, microchip_id, avatar_url, healthStatus } = req.body;

    const pet = await Pet.create({
      ownerId: req.user.id,
      name,
      species,
      breed,
      age,
      weight,
      city,
      birth_date,
      gender,
      microchip_id,
      avatar_url,
      healthStatus: healthStatus || "Healthy",
    });

    res.status(201).json(normalizePetPayload(pet));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle adoption or foster status
// @route   PATCH /api/pets/:id/listing
export const updateListingStatus = async (req: any, res: Response): Promise<void> => {
  try {
    const { pets: Pet } = db as any;
    const { isAdoptionOpen, isFosterOpen } = req.body;

    const pet = await Pet.findOne({ where: { id: req.params.id, ownerId: req.user.id } });
    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    if (isAdoptionOpen !== undefined) pet.isAdoptionOpen = isAdoptionOpen;
    if (isFosterOpen !== undefined) pet.isFosterOpen = isFosterOpen;

    await pet.save();

    res.json(normalizePetPayload(pet));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed pet view
// @route   GET /api/pets/:id
export const getPetById = async (req: any, res: Response): Promise<void> => {
  try {
    const {
      pets: Pet,
      users: User,
      vaccines: Vaccine,
      medications: Medication,
      allergies: Allergy,
      appointments: Appointment,
      vets: Vet,
      reminders: Reminder,
    } = db as any;

    const allowed = await canViewPet(req.params.id, req);
    if (!allowed) {
      res.status(403).json({ message: "Not authorized to view this pet" });
      return;
    }

    const pet = await Pet.findByPk(req.params.id, {
      include: [
        { model: User, as: "owner", attributes: ["id", "name", "avatar_url", "role", "isVerified", "city", "phone"] },
        { model: Vaccine, as: "Vaccines" },
        { model: Medication, as: "Medications" },
        { model: Allergy, as: "Allergies" },
        {
          model: Appointment,
          as: "Appointments",
          include: [
            { model: Vet, as: "veterinarian", attributes: ["id", "name", "hospital_name", "profession", "avatar_url", "rating", "city"] },
            { model: User, as: "owner", attributes: ["id", "name", "avatar_url", "role"] },
          ],
        },
      ],
    });

    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    const payload = normalizePetPayload(pet);
    const reminderCount = await Reminder.count({ where: { petId: payload.id, isDone: false } });
    const nextVisit = payload.Appointments.find((appointment: any) => ["pending", "confirmed"].includes(String(appointment.status || "").toLowerCase()) && appointment.date >= today());

    res.json({
      ...payload,
      reminderCount,
      nextVisit: nextVisit ? nextVisit.date : payload.nextVisit || "--",
      healthScore: calculateHealthScore(payload),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update pet info
// @route   PUT /api/pets/:id
export const updatePet = async (req: any, res: Response): Promise<void> => {
  try {
    const { pets: Pet } = db as any;
    const pet = await Pet.findOne({ where: { id: req.params.id, ownerId: req.user.id } });

    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    const updatableFields = ["name", "species", "breed", "age", "weight", "city", "birth_date", "gender", "microchip_id", "avatar_url", "healthStatus"];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        pet[field] = req.body[field];
      }
    });

    await pet.save();
    res.json(normalizePetPayload(pet));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove pet
// @route   DELETE /api/pets/:id
export const deletePet = async (req: any, res: Response): Promise<void> => {
  try {
    const { pets: Pet } = db as any;
    const pet = await Pet.findOne({ where: { id: req.params.id, ownerId: req.user.id } });

    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    await pet.destroy();
    res.json({ success: true, message: "Pet removed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pets for adoption/foster (discover screen)
// @route   GET /api/pets/discover
export const discoverPets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { pets: Pet, users: User, vaccines: Vaccine, appointments: Appointment } = db as any;
    const pets = await Pet.findAll({
      where: {
        [Op.or]: [{ isAdoptionOpen: true }, { isFosterOpen: true }],
      },
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "avatar_url", "role", "isVerified", "city", "phone"],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    const enrichedPets = await Promise.all(
      pets.map(async (pet: any) => {
        const payload = normalizePetPayload(pet);
        const [vaccines, appointments] = await Promise.all([
          Vaccine.findAll({ where: { petId: payload.id }, attributes: ["id", "name", "dateAdministered", "nextDueDate", "status"] }),
          Appointment.findAll({ where: { petId: payload.id }, attributes: ["id", "date", "time", "status", "reason"] }),
        ]);

        return {
          ...payload,
          Vaccines: vaccines.map((item: any) => toPlain(item)),
          Appointments: appointments.map((item: any) => serializeAppointment(item)),
          healthScore: calculateHealthScore(payload),
        };
      })
    );

    res.json(enrichedPets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
