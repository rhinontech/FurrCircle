import type { Request, Response } from "express";
import db from "../models/index.ts";
import { Op } from "sequelize";

const { Pet } = db as any;

// @desc    Get logged in user's pets
// @route   GET /api/pets
export const getMyPets = async (req: any, res: Response): Promise<void> => {
  try {
    const { Appointment } = db as any;
    const pets = await Pet.findAll({
      where: { ownerId: req.user.id }
    });

    const enrichedPets = await Promise.all(pets.map(async (pet: any) => {
      const p = pet.toJSON();
      
      // Calculate next visit based on upcoming appointments
      const nextAppt = await Appointment.findOne({
        where: { petId: p.id, status: { [Op.in]: ['pending', 'confirmed'] }, date: { [Op.gte]: new Date().toISOString().split('T')[0] } },
        order: [['date', 'ASC']]
      });

      p.nextVisit = nextAppt ? nextAppt.date : '--';
      
      // Calculate a pseudo health score for now based on profile completion minus age factor (dummy)
      p.healthScore = p.healthStatus === 'Healthy' ? 95 : 75;

      return p;
    }));

    res.json(enrichedPets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new pet
// @route   POST /api/pets
export const createPet = async (req: any, res: Response): Promise<void> => {
  try {
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
      healthStatus: healthStatus || 'Healthy'
    });

    res.status(201).json(pet);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle adoption or foster status
// @route   PATCH /api/pets/:id/listing
export const updateListingStatus = async (req: any, res: Response): Promise<void> => {
  try {
    const { isAdoptionOpen, isFosterOpen } = req.body;
    
    const pet = await Pet.findOne({ where: { id: req.params.id, ownerId: req.user.id } });
    if (!pet) {
      res.status(404).json({ message: 'Pet not found' });
      return;
    }

    if (isAdoptionOpen !== undefined) pet.isAdoptionOpen = isAdoptionOpen;
    if (isFosterOpen !== undefined) pet.isFosterOpen = isFosterOpen;

    await pet.save();
    
    res.json(pet);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed pet view
// @route   GET /api/pets/:id
export const getPetById = async (req: any, res: Response): Promise<void> => {
  try {
    const { Pet, Vaccine, Medication, Appointment } = db as any;
    
    // Only owner or vet can view detailed records, but for now we enforce owner
    const pet = await Pet.findOne({ 
      where: { id: req.params.id, ownerId: req.user.id },
      include: [
        { model: Vaccine, as: 'Vaccines' },
        { model: Medication, as: 'Medications' },
        { model: Appointment, as: 'Appointments' }
      ]
    });

    if (!pet) {
      res.status(404).json({ message: 'Pet not found' });
      return;
    }
    res.json(pet);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update pet info
// @route   PUT /api/pets/:id
export const updatePet = async (req: any, res: Response): Promise<void> => {
  try {
    const pet = await Pet.findOne({ where: { id: req.params.id, ownerId: req.user.id } });
    
    if (!pet) {
      res.status(404).json({ message: 'Pet not found' });
      return;
    }

    const updatableFields = ['name', 'species', 'breed', 'age', 'weight', 'city', 'birth_date', 'gender', 'microchip_id', 'avatar_url', 'healthStatus'];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        pet[field] = req.body[field];
      }
    });

    await pet.save();
    res.json(pet);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove pet
// @route   DELETE /api/pets/:id
export const deletePet = async (req: any, res: Response): Promise<void> => {
  try {
    const pet = await Pet.findOne({ where: { id: req.params.id, ownerId: req.user.id } });
    
    if (!pet) {
      res.status(404).json({ message: 'Pet not found' });
      return;
    }

    await pet.destroy();
    res.json({ message: 'Pet removed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get pets for adoption/foster (discover screen)
// @route   GET /api/pets/discover
export const discoverPets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { Pet, User } = db as any;
    const pets = await Pet.findAll({
      where: {
        [Op.or]: [
          { isAdoptionOpen: true },
          { isFosterOpen: true }
        ]
      },
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatar_url', 'role'] }]
    });
    res.json(pets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
