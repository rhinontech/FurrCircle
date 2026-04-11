import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import db from "../models/index.ts";

const SELF_SERVICE_USER_ROLES = new Set(["owner", "shelter"]);
const PROFILE_IMAGE_FIELDS = ["avatar_url", "phone", "bio", "city", "address"] as const;

// userType is embedded in the JWT so middleware knows which table to query
const generateToken = (id: string, userType: 'user' | 'vet') => {
  return jwt.sign({ id, userType }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: "30d",
  });
};

const toMemberSince = (value?: Date | string | null) => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : String(parsed.getFullYear());
};

const buildAuthPayload = async (subject: any, userType: 'user' | 'vet', token?: string) => {
  const isVet = userType === 'vet';
  const payload: Record<string, any> = {
    id: subject.id,
    name: subject.name,
    email: subject.email,
    role: isVet ? 'veterinarian' : subject.role,
    isVerified: subject.isVerified,
    avatar_url: subject.avatar_url,
    phone: subject.phone,
    bio: subject.bio,
    city: subject.city,
    address: subject.address,
    memberSince: toMemberSince(subject.createdAt),
  };

  if (isVet) {
    payload.hospital_name = subject.hospital_name;
    payload.profession = subject.profession;
    payload.experience = subject.experience;
    payload.working_hours = subject.working_hours;
    payload.rating = subject.rating;
  } else {
    payload.petCount = await db.pets.count({ where: { ownerId: subject.id } });
  }

  if (token) {
    payload.token = token;
  }

  return payload;
};

// @desc    Register a new user (owner/shelter/admin) OR veterinarian
// @route   POST /api/auth/register
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { name, password, role } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    // Vets register into the Vet table
    if (role === 'veterinarian') {
      const vetExists = await Vet.findOne({ where: { email: { [Op.iLike]: email } } });
      if (vetExists) {
        res.status(400).json({ message: "Veterinarian already exists" });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const vet = await Vet.create({
        name,
        email,
        password: hashedPassword,
        isVerified: false, // requires admin approval
      });

      const token = generateToken(vet.id, 'vet');
      res.status(201).json(await buildAuthPayload(vet, 'vet', token));
      return;
    }

    // Owners, shelters, admins register into the User table
    const requestedRole = role || 'owner';
    if (!SELF_SERVICE_USER_ROLES.has(requestedRole)) {
      res.status(403).json({ message: "This role cannot be created through public registration" });
      return;
    }

    // Also check vets table so same email can't exist in both tables
    const [userExists, vetExists2] = await Promise.all([
      User.findOne({ where: { email: { [Op.iLike]: email } } }),
      Vet.findOne({ where: { email: { [Op.iLike]: email } } }),
    ]);
    if (userExists || vetExists2) {
      res.status(400).json({ message: "An account with this email already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: requestedRole,
      isVerified: true,
    });

    const token = generateToken(user.id, 'user');
    res.status(201).json(await buildAuthPayload(user, 'user', token));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login — checks User table first, then Vet table
// @route   POST /api/auth/login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    // Try User table first
    const user = await User.findOne({ where: { email: { [Op.iLike]: email } } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user.id, 'user');
      res.json(await buildAuthPayload(user, 'user', token));
      return;
    }

    // Try Vet table
    const vet = await Vet.findOne({ where: { email: { [Op.iLike]: email } } });
    if (vet && (await bcrypt.compare(password, vet.password))) {
      const token = generateToken(vet.id, 'vet');
      res.json(await buildAuthPayload(vet, 'vet', token));
      return;
    }

    res.status(401).json({ message: "Invalid email or password" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user/vet profile
// @route   GET /api/auth/me  or  GET /api/auth/profile
export const getUserProfile = async (req: any, res: Response): Promise<void> => {
  try {
    res.json(await buildAuthPayload(req.user, req.userType || 'user'));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update profile (user or vet)
// @route   PUT /api/auth/profile
export const updateUserProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const isVet = req.userType === 'vet';

    if (isVet) {
      const vet = await Vet.findByPk(req.user.id);
      if (!vet) {
        res.status(404).json({ message: "Veterinarian not found" });
        return;
      }

      const vetFields = [...PROFILE_IMAGE_FIELDS, 'name', 'email', 'hospital_name', 'profession', 'experience', 'working_hours'];
      vetFields.forEach(field => {
        if (req.body[field] !== undefined) vet[field] = req.body[field];
      });

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        vet.password = await bcrypt.hash(req.body.password, salt);
      }

      await vet.save();
      const token = generateToken(vet.id, 'vet');
      res.json(await buildAuthPayload(vet, 'vet', token));
      return;
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const userFields = [...PROFILE_IMAGE_FIELDS, 'name', 'email'];
    userFields.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    await user.save();
    const token = generateToken(user.id, 'user');
    res.json(await buildAuthPayload(user, 'user', token));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get users by role (for discover screen — vets, shelters)
// @route   GET /api/auth/users/:role
export const getUsersByRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { role } = req.params;

    // Vets come from the Vet table
    if (role === 'veterinarian') {
      const vets = await Vet.findAll({
        where: { isVerified: true },
        attributes: { exclude: ['password'] },
      });
      return res.json(vets) as any;
    }

    const users = await User.findAll({
      where: { role },
      attributes: { exclude: ['password'] },
    });

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Trigger password reset (placeholder)
// @route   POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const email = req.body.email?.trim().toLowerCase();

    const user = await User.findOne({ where: { email: { [Op.iLike]: email } } }) || await Vet.findOne({ where: { email: { [Op.iLike]: email } } });
    if (user) {
      res.json({ message: "Password reset link sent to your email" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
