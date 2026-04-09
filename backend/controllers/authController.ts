import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models/index.ts";

const SELF_SERVICE_USER_ROLES = new Set(["owner", "shelter"]);

// userType is embedded in the JWT so middleware knows which table to query
const generateToken = (id: string, userType: 'user' | 'vet') => {
  return jwt.sign({ id, userType }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: "30d",
  });
};

// @desc    Register a new user (owner/shelter/admin) OR veterinarian
// @route   POST /api/auth/register
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { name, email, password, role } = req.body;

    // Vets register into the Vet table
    if (role === 'veterinarian') {
      const vetExists = await Vet.findOne({ where: { email } });
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

      res.status(201).json({
        id: vet.id,
        name: vet.name,
        email: vet.email,
        role: 'veterinarian',
        isVerified: vet.isVerified,
        token: generateToken(vet.id, 'vet'),
      });
      return;
    }

    // Owners, shelters, admins register into the User table
    const requestedRole = role || 'owner';
    if (!SELF_SERVICE_USER_ROLES.has(requestedRole)) {
      res.status(403).json({ message: "This role cannot be created through public registration" });
      return;
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      res.status(400).json({ message: "User already exists" });
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

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user.id, 'user'),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login — checks User table first, then Vet table
// @route   POST /api/auth/login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { email, password } = req.body;

    // Try User table first
    const user = await User.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar_url: user.avatar_url,
        token: generateToken(user.id, 'user'),
      });
      return;
    }

    // Try Vet table
    const vet = await Vet.findOne({ where: { email } });
    if (vet && (await bcrypt.compare(password, vet.password))) {
      res.json({
        id: vet.id,
        name: vet.name,
        email: vet.email,
        role: 'veterinarian',
        isVerified: vet.isVerified,
        avatar_url: vet.avatar_url,
        hospital_name: vet.hospital_name,
        profession: vet.profession,
        experience: vet.experience,
        working_hours: vet.working_hours,
        address: vet.address,
        city: vet.city,
        bio: vet.bio,
        phone: vet.phone,
        rating: vet.rating,
        token: generateToken(vet.id, 'vet'),
      });
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
    res.json(req.user);
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

      const vetFields = ['name', 'email', 'avatar_url', 'phone', 'bio', 'city', 'hospital_name', 'profession', 'experience', 'working_hours', 'address'];
      vetFields.forEach(field => {
        if (req.body[field] !== undefined) vet[field] = req.body[field];
      });

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        vet.password = await bcrypt.hash(req.body.password, salt);
      }

      await vet.save();
      res.json({
        id: vet.id,
        name: vet.name,
        email: vet.email,
        role: 'veterinarian',
        isVerified: vet.isVerified,
        avatar_url: vet.avatar_url,
        hospital_name: vet.hospital_name,
        profession: vet.profession,
        experience: vet.experience,
        working_hours: vet.working_hours,
        address: vet.address,
        city: vet.city,
        bio: vet.bio,
        phone: vet.phone,
        rating: vet.rating,
        token: generateToken(vet.id, 'vet'),
      });
      return;
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const userFields = ['name', 'email', 'avatar_url', 'phone', 'bio', 'city', 'address'];
    userFields.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    await user.save();
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      avatar_url: user.avatar_url,
      token: generateToken(user.id, 'user'),
    });
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
    const { email } = req.body;

    const user = await User.findOne({ where: { email } }) || await Vet.findOne({ where: { email } });
    if (user) {
      res.json({ message: "Password reset link sent to your email" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
