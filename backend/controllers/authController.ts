import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Op } from "sequelize";
import db from "../models/index.ts";

const SELF_SERVICE_USER_ROLES = new Set(["owner", "shelter"]);
const PROFILE_IMAGE_FIELDS = ["avatar_url", "phone", "bio", "city", "address", "hasCompletedOnboarding"] as const;
const normalizeCity = (value: unknown) => String(value || "").trim();

// userType is embedded in the JWT so middleware knows which table to query
const generateToken = (id: string, userType: 'user' | 'vet') => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured. Set it in your environment.");
  }
  return jwt.sign({ id, userType }, secret, {
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
    hasCompletedOnboarding: subject.hasCompletedOnboarding,
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
    payload.clinicStampUrl = subject.clinicStampUrl;
    payload.licenseNumber = subject.licenseNumber;
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
      const { hospital_name, profession, phone, city, address } = req.body;

      const vet = await Vet.create({
        name,
        email,
        password: hashedPassword,
        isVerified: false, // requires admin approval
        ...(hospital_name && { hospital_name }),
        ...(profession && { profession }),
        ...(phone && { phone }),
        ...(city && { city }),
        ...(address && { address }),
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

    const { phone_number, city, address } = req.body;
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: requestedRole,
      isVerified: true,
      ...(phone_number && { phone_number }),
      ...(city && { city }),
      ...(address && { address }),
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

// @desc    Mark onboarding complete for the current account
// @route   POST /api/auth/onboarding-complete
export const completeOnboarding = async (req: any, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const isVet = req.userType === 'vet';
    const Model = isVet ? Vet : User;
    const actor = await Model.findByPk(req.user.id);

    if (!actor) {
      res.status(404).json({ message: isVet ? "Veterinarian not found" : "User not found" });
      return;
    }

    actor.hasCompletedOnboarding = true;
    await actor.save();

    res.json(await buildAuthPayload(actor, isVet ? 'vet' : 'user'));
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

      const vetFields = [...PROFILE_IMAGE_FIELDS, 'name', 'email', 'hospital_name', 'profession', 'experience', 'working_hours', 'clinicStampUrl', 'licenseNumber'];
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
      const requestedCity = normalizeCity((req.query as any)?.city);
      const where: Record<string, any> = { isVerified: true };
      if (requestedCity) {
        where.city = { [Op.iLike]: requestedCity };
      }

      const vets = await Vet.findAll({
        where,
        attributes: ['id', 'name', 'email', 'hospital_name', 'profession', 'city', 'avatar_url', 'rating', 'bio', 'phone', 'working_hours', 'isVerified'],
        order: [["rating", "DESC"], ["name", "ASC"]],
      });
      return res.json(vets) as any;
    }

    const users = await User.findAll({
      where: { role },
      attributes: ['id', 'name', 'email', 'role', 'avatar_url', 'city', 'bio', 'isVerified'],
    });

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request a password reset token (no email provider — token logged to console)
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    // Always return 200 to avoid user enumeration
    const account =
      await User.findOne({ where: { email: { [Op.iLike]: email } } }) ||
      await Vet.findOne({ where: { email: { [Op.iLike]: email } } });

    if (account) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      account.resetToken = hashedToken;
      account.resetTokenExpiry = expiry;
      await account.save();

      // No email provider — log token to console for development
      console.log(`[PASSWORD RESET] Token for ${email}: ${rawToken}`);
    }

    res.json({ message: "If an account with that email exists, a reset code has been sent." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password using a valid token
// @route   POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: "Token and new password are required" });
      return;
    }

    if (String(newPassword).length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    const hashedToken = crypto.createHash("sha256").update(String(token)).digest("hex");
    const now = new Date();

    const account =
      await User.findOne({ where: { resetToken: hashedToken, resetTokenExpiry: { [Op.gt]: now } } }) ||
      await Vet.findOne({ where: { resetToken: hashedToken, resetTokenExpiry: { [Op.gt]: now } } });

    if (!account) {
      res.status(400).json({ message: "Reset token is invalid or has expired" });
      return;
    }

    account.password = await bcrypt.hash(String(newPassword), 10);
    account.resetToken = null;
    account.resetTokenExpiry = null;
    await account.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
