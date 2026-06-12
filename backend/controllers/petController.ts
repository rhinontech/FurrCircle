import type { Request, Response } from "express";
import { Op } from "sequelize";
import db from "../models/index.ts";
import { createRichNotification } from "../services/notificationService.ts";

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
    personality: Array.isArray(payload?.personality) ? payload.personality : [],
  };
};

const canViewPrivatePet = async (petId: string, req: any) => {
  const { pets: Pet, appointments: Appointment } = db as any;

  if (req.userType === "vet") {
    const appointment = await Appointment.findOne({ where: { petId, vetId: req.user.id } });
    return !!appointment;
  }

  const pet = await Pet.findOne({ where: { id: petId, ownerId: req.user.id } });
  return !!pet;
};

const toPublicPetPayload = (pet: any, viewerId?: string) => {
  const payload = normalizePetPayload(pet);
  const viewerOwnsPet = viewerId && payload.ownerId === viewerId;

  return {
    id: payload.id,
    ownerId: payload.ownerId,
    name: payload.name,
    avatar_url: payload.avatar_url,
    species: payload.species,
    breed: payload.breed,
    gender: payload.gender,
    age: payload.age,
    city: payload.city,
    description: payload.description,
    history: payload.history,
    healthStatus: payload.healthStatus,
    personality: payload.personality,
    isAdoptionOpen: payload.isAdoptionOpen,
    isFosterOpen: payload.isFosterOpen,
    fosterProvides: payload.fosterProvides ?? [],
    owner: payload.owner,
    isViewerOwner: !!viewerOwnsPet,
    canManage: !!viewerOwnsPet,
    healthScore: calculateHealthScore(payload),
    reminderCount: 0,
    nextVisit: "--",
    Vaccines: [],
    Medications: [],
    Allergies: [],
    Appointments: [],
  };
};

const notifyNearbyAdoptionAudience = async (pet: any, ownerName?: string) => {
  const city = String(pet?.city || "").trim();
  if (!city) return;

  const { users: User } = db as any;
  const audience = await User.findAll({
    where: {
      id: { [Op.ne]: pet.ownerId },
      role: { [Op.in]: ["owner", "shelter"] },
      city: { [Op.iLike]: city },
    },
    attributes: ["id"],
  });

  const isAdoption = Boolean(pet.isAdoptionOpen);
  const isFoster = Boolean(pet.isFosterOpen);
  const listingLabel = isAdoption && isFoster
    ? "adoption or foster"
    : isAdoption
      ? "adoption"
      : "foster";

  await Promise.allSettled(
    audience.map((user: any) =>
      createRichNotification({
        actorId: user.id,
        actorType: "user",
        category: "activity",
        type: "adoption",
        title: `New ${listingLabel} pet nearby`,
        message: `${pet.name} is now available for ${listingLabel} in ${city}.${ownerName ? ` Posted by ${ownerName}.` : ""}`,
        actionType: "notifications",
        actionPayload: null,
      })
    )
  );
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
    const { name, species, breed, age, weight, city, birth_date, gender, microchip_id, avatar_url, healthStatus, description, personality } = req.body;

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
      description,
      personality: Array.isArray(personality) ? personality : [],
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
    const { isAdoptionOpen, isFosterOpen, fosterProvides } = req.body;

    const pet = await Pet.findOne({ where: { id: req.params.id, ownerId: req.user.id } });
    if (!pet) {
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    const wasPublic = Boolean(pet.isAdoptionOpen || pet.isFosterOpen);
    if (isAdoptionOpen !== undefined) pet.isAdoptionOpen = isAdoptionOpen;
    if (isFosterOpen !== undefined) pet.isFosterOpen = isFosterOpen;
    if (fosterProvides !== undefined) pet.fosterProvides = Array.isArray(fosterProvides) ? fosterProvides : [];

    await pet.save();

    const isPublic = Boolean(pet.isAdoptionOpen || pet.isFosterOpen);
    if (!wasPublic && isPublic) {
      await notifyNearbyAdoptionAudience(pet, req.user?.name);
    }

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

    const pet = await Pet.findByPk(req.params.id, {
      include: [
        { model: User, as: "owner", attributes: ["id", "name", "avatar_url", "role", "isVerified", "city", "phone", 'username'] },
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
    const isPublicListing = !!payload.isAdoptionOpen || !!payload.isFosterOpen;
    const isOwner = req.userType === "user" && payload.ownerId === req.user.id;
    const hasPrivateAccess = isOwner || await canViewPrivatePet(req.params.id, req);

    if (!hasPrivateAccess) {
      const { follows: Follow, users: User } = db as any;

      // Check if the pet owner has a public profile
      const owner = await User.findByPk(payload.ownerId, { attributes: ['isPrivate'] });
      const ownerIsPublic = !owner?.isPrivate;

      // Check if viewer follows the pet owner (accepted) — followers get extra health info
      const followRecord = await Follow.findOne({
        where: { followerId: req.user.id, followingId: payload.ownerId, status: 'accepted' },
      });
      const isFollower = !!followRecord;

      if (isPublicListing || ownerIsPublic || isFollower) {
        // Return public-safe profile
        const publicPayload = toPublicPetPayload(pet, req.user?.id);
        if (isFollower) {
          // Followers see a bit more detail
          publicPayload.Vaccines = payload.Vaccines;
          publicPayload.Allergies = payload.Allergies;
          publicPayload.personality = payload.personality;
        }
        res.json(publicPayload);
      } else {
        res.status(403).json({ message: "Not authorized to view this pet" });
      }
      return;
    }

    const reminderCount = await Reminder.count({ where: { petId: payload.id, isDone: false } });
    const nextVisit = payload.Appointments.find((appointment: any) => ["pending", "confirmed"].includes(String(appointment.status || "").toLowerCase()) && appointment.date >= today());

    res.json({
      ...payload,
      isViewerOwner: isOwner,
      canManage: isOwner,
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

    const updatableFields = ["name", "species", "breed", "age", "weight", "city", "birth_date", "gender", "microchip_id", "avatar_url", "healthStatus", "description", "personality"];

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
  const transaction = await db.sequelize.transaction();
  try {
    const {
      pets: Pet,
      vaccines: Vaccine,
      medical_records: MedicalRecord,
      medications: Medication,
      allergies: Allergy,
      appointments: Appointment,
      reminders: Reminder,
      vitals: Vital,
      adoption_applications: AdoptionApplication,
      conversations: Conversation,
      messages: Message,
      playdate_likes: PlaydateLike,
    } = db as any;

    const pet = await Pet.findOne({
      where: { id: req.params.id, ownerId: req.user.id },
      transaction,
    });

    if (!pet) {
      await transaction.rollback();
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    const petId = pet.id;

    // Delete all related records
    await Vaccine.destroy({ where: { petId }, transaction });
    await MedicalRecord.destroy({ where: { petId }, transaction });
    await Medication.destroy({ where: { petId }, transaction });
    await Allergy.destroy({ where: { petId }, transaction });
    await Appointment.destroy({ where: { petId }, transaction });
    await Reminder.destroy({ where: { petId }, transaction });
    await Vital.destroy({ where: { petId }, transaction });
    await AdoptionApplication.destroy({ where: { petId }, transaction });
    await Message.destroy({ where: { petId }, transaction });
    await Conversation.destroy({ where: { petId }, transaction });
    await PlaydateLike.destroy({
      where: {
        [Op.or]: [
          { swiperPetId: petId },
          { targetPetId: petId }
        ]
      },
      transaction
    });

    // Finally delete the pet
    await pet.destroy({ transaction });

    await transaction.commit();
    res.json({ success: true, message: "Pet and all related records removed successfully" });
  } catch (error: any) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pets for adoption/foster (discover screen)
// @route   GET /api/pets/discover
export const discoverPets = async (req: any, res: Response): Promise<void> => {
  try {
    const { pets: Pet, users: User, vaccines: Vaccine, appointments: Appointment } = db as any;
    const { sequelize } = db as any;

    const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;

    const where: any = {
      [Op.or]: [{ isAdoptionOpen: true }, { isFosterOpen: true }],
    };

    let attributes: any = { exclude: [] };
    let order: any[] = [["updatedAt", "DESC"]];

    if (lat && lng) {
      where[Op.and] = [
        sequelize.literal(`(
          SELECT 6371 * acos(
            cos(radians(${lat})) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lng})) +
            sin(radians(${lat})) *
            sin(radians(latitude))
          )
          FROM users
          WHERE users.id = pets.owner_id
        ) <= 150`)
      ];
      attributes = {
        include: [
          [
            sequelize.literal(`(
              SELECT 6371 * acos(
                cos(radians(${lat})) *
                cos(radians(latitude)) *
                cos(radians(longitude) - radians(${lng})) +
                sin(radians(${lat})) *
                sin(radians(latitude))
              )
              FROM users
              WHERE users.id = pets.owner_id
              AND users.latitude IS NOT NULL AND users.longitude IS NOT NULL
            )`),
            'distance',
          ],
        ],
      };
      order = [[sequelize.literal('distance'), 'ASC']];
    }

    const pets = await Pet.findAll({
      where,
      attributes,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "avatar_url", "role", "isVerified", "city", "phone", "latitude", "longitude"],
        },
      ],
      order,
    });

    const enrichedPets = await Promise.all(
      pets.map(async (pet: any) => {
        const payload = normalizePetPayload(pet);
        const [vaccines, appointments] = await Promise.all([
          Vaccine.findAll({ where: { petId: payload.id }, attributes: ["id", "name", "dateAdministered", "nextDueDate", "status"] }),
          Appointment.findAll({ where: { petId: payload.id }, attributes: ["id", "date", "time", "status", "reason"] }),
        ]);

        const data: any = {
          ...payload,
          Vaccines: vaccines.map((item: any) => toPlain(item)),
          Appointments: appointments.map((item: any) => serializeAppointment(item)),
          healthScore: calculateHealthScore(payload),
        };

        if (pet.getDataValue('distance') !== undefined && pet.getDataValue('distance') !== null) {
          data.distance = parseFloat(pet.getDataValue('distance'));
          data.distanceLabel = `${data.distance.toFixed(1)} km away`;
        } else if (payload.owner?.city) {
          data.distanceLabel = payload.owner.city;
        }

        return data;
      })
    );

    res.json(enrichedPets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a pet memory
// @route   POST /api/pets/:id/memories
export const addPetMemory = async (req: any, res: Response): Promise<void> => {
  try {
    const { pets: Pet, memories: Memory } = db as any;
    const petId = req.params.id;
    const { media_url, date, title } = req.body;

    const pet = await Pet.findOne({ where: { id: petId, ownerId: req.user.id } });
    if (!pet) {
      res.status(404).json({ message: "Pet not found or unauthorized" });
      return;
    }

    const memory = await Memory.create({
      petId,
      media_url,
      date: date || today(),
      title,
    });

    res.status(201).json(memory);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pet memories & aura
// @route   GET /api/pets/:id/memories
export const getPetMemories = async (req: any, res: Response): Promise<void> => {
  try {
    const { pets: Pet, memories: Memory } = db as any;
    const petId = req.params.id;

    // Allow owner always; allow others if the pet owner has a public profile
    const pet = await Pet.findByPk(petId);
    if (!pet) { res.status(404).json({ message: "Pet not found" }); return; }

    if (pet.ownerId !== req.user.id) {
      const { users: User, follows: Follow } = db as any;
      const owner = await User.findByPk(pet.ownerId, { attributes: ['isPrivate'] });
      const isListedPublicly = pet.isAdoptionOpen || pet.isFosterOpen;
      const ownerIsPublic = !owner?.isPrivate;

      if (!isListedPublicly && !ownerIsPublic) {
        // Private profile — only followers can view memories
        const followRecord = await Follow.findOne({
          where: { followerId: req.user.id, followingId: pet.ownerId, status: 'accepted' },
        });
        if (!followRecord) {
          res.status(403).json({ message: "Not authorized to view memories" });
          return;
        }
      }
    }

    const memories = await Memory.findAll({
      where: { petId },
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });

    // Compute Aura
    const traits = Array.isArray(pet.personality) && pet.personality.length > 0 
        ? pet.personality 
        : ["Loving", "Playful"];
        
    const mood = traits[0] || "Happy";

    let zodiac = "Unknown";
    if (pet.birth_date) {
        const d = new Date(pet.birth_date);
        const month = d.getUTCMonth() + 1; // 1-12
        const day = d.getUTCDate();
        if ((month == 1 && day <= 19) || (month == 12 && day >= 22)) zodiac = "Capricorn ♑";
        else if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) zodiac = "Aquarius ♒";
        else if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) zodiac = "Pisces ♓";
        else if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) zodiac = "Aries ♈";
        else if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) zodiac = "Taurus ♉";
        else if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) zodiac = "Gemini ♊";
        else if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) zodiac = "Cancer ♋";
        else if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) zodiac = "Leo ♌";
        else if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) zodiac = "Virgo ♍";
        else if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) zodiac = "Libra ♎";
        else if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) zodiac = "Scorpio ♏";
        else if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) zodiac = "Sagittarius ♐";
    }

    // Static random score based on pet id string length or char codes so it stays consistent
    let score = 92;
    if (pet.id) {
       const sum = pet.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
       score = 80 + (sum % 21); // 80 to 100
    }

    res.json({
      aura: {
        zodiac,
        mood,
        traits,
        score,
      },
      memories,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
