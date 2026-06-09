import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Op } from "sequelize";
import db from "../models/index.ts";
import { sendEmail } from "../services/emailService.ts";
import { sendSmsOtp } from "../services/smsService.ts";


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
    username: subject.username,
    email: subject.email,
    role: isVet ? 'veterinarian' : subject.role,
    isVerified: subject.isVerified,
    hasCompletedOnboarding: subject.hasCompletedOnboarding,
    avatar_url: subject.avatar_url,
    phone: subject.phone,
    bio: subject.bio,
    city: subject.city,
    address: subject.address,
    isPrivate: subject.isPrivate,
    twoFactorEnabled: subject.twoFactorEnabled,
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

// Helper to generate a 6-digit OTP
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Check username availability and format (Instagram style)
// @route   GET /api/auth/check-username
export const checkUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const username = String(req.query.username || "").trim().toLowerCase();

    if (!username) {
      res.status(400).json({ available: false, message: "Username is required" });
      return;
    }

    if (username.length < 3 || username.length > 30) {
      res.status(400).json({ available: false, message: "Username must be between 3 and 30 characters" });
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(username)) {
      res.status(400).json({ available: false, message: "Only letters, numbers, underscores, and periods are allowed" });
      return;
    }

    const [userExists, vetExists] = await Promise.all([
      User.findOne({ where: { username } }),
      Vet.findOne({ where: { username } }),
    ]);

    if (userExists || vetExists) {
      res.json({ available: false, message: "Username is already taken" });
      return;
    }

    res.json({ available: true, message: "Username is available" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new user (owner/shelter/admin) OR veterinarian
// @route   POST /api/auth/register
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { name, password, role } = req.body;
    const username = req.body.username?.trim().toLowerCase();
    const emailOrPhone = req.body.emailOrPhone?.trim();

    if (!username || (!emailOrPhone && !req.body.email && !req.body.phone) || !password) {
      res.status(400).json({ message: "Username, email/phone, and password are required" });
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(username)) {
      res.status(400).json({ message: "Invalid username format" });
      return;
    }

    // Check username duplicates
    const [userByUsername, vetByUsername] = await Promise.all([
      User.findOne({ where: { username } }),
      Vet.findOne({ where: { username } }),
    ]);

    if (userByUsername || vetByUsername) {
      res.status(400).json({ message: "Username is already taken" });
      return;
    }

    // Parse emailOrPhone or read email/phone directly
    const isEmail = emailOrPhone ? emailOrPhone.includes("@") : !!req.body.email;
    let email = req.body.email?.trim().toLowerCase() || null;
    let phone = req.body.phone?.trim() || null;

    if (!email && !phone && emailOrPhone) {
      email = isEmail ? emailOrPhone.toLowerCase() : null;
      phone = isEmail ? null : emailOrPhone;
    }

    // Check email/phone duplicates
    if (email) {
      const [userByEmail, vetByEmail] = await Promise.all([
        User.findOne({ where: { email: { [Op.iLike]: email } } }),
        Vet.findOne({ where: { email: { [Op.iLike]: email } } }),
      ]);
      if (userByEmail || vetByEmail) {
        res.status(400).json({ message: "An account with this email already exists" });
        return;
      }
    }
    if (phone) {
      const [userByPhone, vetByPhone] = await Promise.all([
        User.findOne({ where: { phone } }),
        Vet.findOne({ where: { phone } }),
      ]);
      if (userByPhone || vetByPhone) {
        res.status(400).json({ message: "An account with this phone number already exists" });
        return;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const useBackendOtp = req.body.useBackendOtp === true;
    const isVet = role === 'veterinarian';

    if (isVet) {
      const { hospital_name, profession, city, address } = req.body;

      const vet = await Vet.create({
        username,
        name,
        email,
        phone,
        password: hashedPassword,
        isVerified: true,
        hospital_name,
        profession,
        city,
        address,
        isPrivate: false,
      });

      const token = generateToken(vet.id, 'vet');
      res.status(201).json(await buildAuthPayload(vet, 'vet', token));
      sendEmail(vet.email || '', "Welcome to FurrCircle!", "welcome", { name: vet.name });
      return;
    }

    // Owner or Shelter
    const requestedRole = role || 'owner';
    if (!SELF_SERVICE_USER_ROLES.has(requestedRole)) {
      res.status(403).json({ message: "This role cannot be created through public registration" });
      return;
    }

    const { city, address } = req.body;

    const user = await User.create({
      username,
      name,
      email,
      phone,
      password: hashedPassword,
      role: requestedRole,
      isVerified: true,
      city,
      address,
      isPrivate: false,
    });

    const token = generateToken(user.id, 'user');
    res.status(201).json(await buildAuthPayload(user, 'user', token));
    sendEmail(user.email || '', "Welcome to FurrCircle!", "welcome", { name: user.name });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login via OTP (Phone number already verified on frontend)
// @route   POST /api/auth/login-otp
export const loginOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({ message: "Phone number is required" });
      return;
    }

    // Try User table first
    const user = await User.findOne({ where: { phone } });
    if (user) {
      const token = generateToken(user.id, 'user');
      res.json(await buildAuthPayload(user, 'user', token));
      return;
    }

    // Try Vet table
    const vet = await Vet.findOne({ where: { phone } });
    if (vet) {
      const token = generateToken(vet.id, 'vet');
      res.json(await buildAuthPayload(vet, 'vet', token));
      return;
    }

    res.status(404).json({ message: "No account found with this phone number. Please sign up." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login — checks User table first, then Vet table (username, email, or phone)
// @route   POST /api/auth/login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    // Accept both `identifier` (mobile/regular flow) and `email` (admin panel flow)
    const identifier = (req.body.identifier || req.body.email)?.trim().toLowerCase();
    const { password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ message: "Username/email/phone and password are required" });
      return;
    }

    const isEmail = identifier.includes("@");
    const whereClause: Record<string, any> = {};

    if (isEmail) {
      whereClause.email = { [Op.iLike]: identifier };
    } else {
      const isPhone = /^[+0-9]+$/.test(identifier);
      if (isPhone) {
        whereClause.phone = identifier;
      } else {
        whereClause.username = identifier;
      }
    }

    // Try User table first
    const user = await User.findOne({ where: whereClause });
    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isVerified) {
        // Generate and send new OTP
        const otpCode = generateOtp();
        user.otpCode = otpCode;
        user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        if (user.email) {
          await sendEmail(user.email, "Verify Your FurrCircle Account", "email-otp", { name: user.name, otp: otpCode });
        } else if (user.phone) {
          await sendSmsOtp(user.phone, otpCode);
        }
        res.status(403).json({
          success: false,
          isVerified: false,
          userId: user.id,
          emailOrPhone: user.email || user.phone,
          message: user.email 
            ? "Account is not verified. A verification code has been sent to your email."
            : "Account is not verified. A verification code has been sent to your phone."
        });
        return;
      }

      // Check 2FA
      if (user.twoFactorEnabled) {
        const otpCode = generateOtp();
        user.otpCode = otpCode;
        user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        if (user.email) {
          await sendEmail(user.email, "Verify Your FurrCircle Account", "email-otp", { name: user.name, otp: otpCode });
        } else if (user.phone) {
          await sendSmsOtp(user.phone, otpCode);
        }

        res.json({
          success: true,
          twoFactorRequired: true,
          userId: user.id,
          emailOrPhone: user.email || user.phone,
          message: user.email 
            ? "Two-factor authentication is enabled. A verification code has been sent to your email."
            : "Two-factor authentication is enabled. A verification code has been sent to your phone."
        });
        return;
      }

      const token = generateToken(user.id, 'user');
      res.json(await buildAuthPayload(user, 'user', token));
      return;
    }

    // Try Vet table
    const vet = await Vet.findOne({ where: whereClause });
    if (vet && (await bcrypt.compare(password, vet.password))) {
      if (!vet.isVerified) {
        // Generate and send new OTP
        const otpCode = generateOtp();
        vet.otpCode = otpCode;
        vet.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await vet.save();

        if (vet.email) {
          await sendEmail(vet.email, "Verify Your FurrCircle Account", "email-otp", { name: vet.name, otp: otpCode });
        } else if (vet.phone) {
          await sendSmsOtp(vet.phone, otpCode);
        }
        res.status(403).json({
          success: false,
          isVerified: false,
          userId: vet.id,
          emailOrPhone: vet.email || vet.phone,
          message: vet.email 
            ? "Account is not verified. A verification code has been sent to your email."
            : "Account is not verified. A verification code has been sent to your phone."
        });
        return;
      }

      // Check 2FA
      if (vet.twoFactorEnabled) {
        const otpCode = generateOtp();
        vet.otpCode = otpCode;
        vet.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await vet.save();

        if (vet.email) {
          await sendEmail(vet.email, "Verify Your FurrCircle Account", "email-otp", { name: vet.name, otp: otpCode });
        } else if (vet.phone) {
          await sendSmsOtp(vet.phone, otpCode);
        }

        res.json({
          success: true,
          twoFactorRequired: true,
          userId: vet.id,
          emailOrPhone: vet.email || vet.phone,
          message: vet.email 
            ? "Two-factor authentication is enabled. A verification code has been sent to your email."
            : "Two-factor authentication is enabled. A verification code has been sent to your phone."
        });
        return;
      }

      const token = generateToken(vet.id, 'vet');
      res.json(await buildAuthPayload(vet, 'vet', token));
      return;
    }

    res.status(401).json({ message: "Invalid username/email/phone or password" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send/Resend email OTP
// @route   POST /api/auth/send-email-otp
export const sendEmailOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const account =
      await User.findByPk(userId) ||
      await Vet.findByPk(userId);

    if (!account) {
      res.status(404).json({ message: "Account not found" });
      return;
    }

    if (!account.email) {
      res.status(400).json({ message: "This account does not have a registered email address" });
      return;
    }

    const otpCode = generateOtp();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    account.otpCode = otpCode;
    account.otpExpiry = otpExpiry;
    await account.save();

    await sendEmail(account.email, "Verify Your FurrCircle Account", "email-otp", { name: account.name, otp: otpCode });
    res.json({ success: true, message: "Verification OTP sent to your email" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate and send a phone OTP (for passwordless login / verification fallback)
// @route   POST /api/auth/send-phone-otp
export const sendPhoneOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({ message: "Phone number is required" });
      return;
    }

    const account =
      await User.findOne({ where: { phone } }) ||
      await Vet.findOne({ where: { phone } });

    if (!account) {
      res.status(404).json({ message: "No account found with this phone number" });
      return;
    }

    const otpCode = generateOtp();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    account.otpCode = otpCode;
    account.otpExpiry = otpExpiry;
    await account.save();

    await sendSmsOtp(account.phone, otpCode);
    res.json({ success: true, userId: account.id, message: "Verification OTP sent to your phone" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Verify email OTP
// @route   POST /api/auth/verify-email-otp
export const verifyEmailOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      res.status(400).json({ message: "User ID and OTP are required" });
      return;
    }

    const user = await User.findByPk(userId);
    if (user) {
      if (user.otpCode !== otp || new Date() > new Date(user.otpExpiry)) {
        res.status(400).json({ message: "Invalid or expired OTP code" });
        return;
      }
      user.isVerified = true;
      user.otpCode = null;
      user.otpExpiry = null;
      await user.save();

      const token = generateToken(user.id, 'user');
      res.json(await buildAuthPayload(user, 'user', token));
      return;
    }

    const vet = await Vet.findByPk(userId);
    if (vet) {
      if (vet.otpCode !== otp || new Date() > new Date(vet.otpExpiry)) {
        res.status(400).json({ message: "Invalid or expired OTP code" });
        return;
      }
      vet.isVerified = true;
      vet.otpCode = null;
      vet.otpExpiry = null;
      await vet.save();

      const token = generateToken(vet.id, 'vet');
      res.json(await buildAuthPayload(vet, 'vet', token));
      return;
    }

    res.status(404).json({ message: "Account not found" });
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
  console.log("update body->", req.body);
  try {
    const { users: User, vets: Vet } = db as any;
    const isVet = req.userType === 'vet';

    if (isVet) {
      const vet = await Vet.findByPk(req.user.id);
      if (!vet) {
        res.status(404).json({ message: "Veterinarian not found" });
        return;
      }

      const vetFields = [...PROFILE_IMAGE_FIELDS, 'name', 'email', 'hospital_name', 'profession', 'experience', 'working_hours', 'clinicStampUrl', 'licenseNumber', 'username', 'twoFactorEnabled'];
      vetFields.forEach(field => {
        if (req.body[field] !== undefined) vet[field] = req.body[field];
      });

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

    const userFields = [...PROFILE_IMAGE_FIELDS, 'name', 'email', 'username', 'twoFactorEnabled'];
    userFields.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

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
        attributes: ['id', 'name', 'email', 'username', 'hospital_name', 'profession', 'city', 'avatar_url', 'rating', 'bio', 'phone', 'working_hours', 'isVerified'],
        order: [["rating", "DESC"], ["name", "ASC"]],
      });
      return res.json(vets) as any;
    }

    const users = await User.findAll({
      where: { role },
      attributes: ['id', 'name', 'email', 'username', 'role', 'avatar_url', 'city', 'bio', 'isVerified'],
    });

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request a password reset OTP (email or phone)
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const identifier = req.body.identifier?.trim().toLowerCase();

    if (!identifier) {
      res.status(400).json({ message: "Identifier (username/email/phone) is required" });
      return;
    }

    const isEmail = identifier.includes("@");
    const whereClause: Record<string, any> = {};

    if (isEmail) {
      whereClause.email = { [Op.iLike]: identifier };
    } else {
      const isPhone = /^[+0-9]+$/.test(identifier);
      if (isPhone) {
        whereClause.phone = identifier;
      } else {
        whereClause.username = identifier;
      }
    }

    const account =
      await User.findOne({ where: whereClause }) ||
      await Vet.findOne({ where: whereClause });

    if (!account) {
      res.status(404).json({ success: false, message: "No account found with this identifier." });
      return;
    }

    const useBackendOtp = req.body.useBackendOtp === true;

    // Check if account has an email
    if (account.email) {
      const otpCode = generateOtp();
      const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      account.otpCode = otpCode;
      account.otpExpiry = otpExpiry;
      await account.save();

      await sendEmail(account.email, "FurrCircle Password Reset OTP", "email-otp", { name: account.name, otp: otpCode });
      res.json({ success: true, method: "email", userId: account.id, emailOrPhone: account.email, message: "A password reset code has been sent to your email." });
    } else if (account.phone) {
      if (useBackendOtp) {
        const otpCode = generateOtp();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        account.otpCode = otpCode;
        account.otpExpiry = otpExpiry;
        await account.save();

        await sendSmsOtp(account.phone, otpCode);
        res.json({ success: true, method: "phone", useBackendOtp: true, userId: account.id, emailOrPhone: account.phone, message: "A password reset code has been sent to your phone." });
      } else {
        // If it only has a phone, let the frontend trigger Firebase SMS OTP to verify the phone.
        res.json({ success: true, method: "phone", useBackendOtp: false, userId: account.id, emailOrPhone: account.phone, message: "Please verify via phone OTP." });
      }
    } else {
      res.status(400).json({ message: "No contact info available on this account for verification." });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password using email/phone directly (after client-side Firebase verification)
// @route   POST /api/auth/reset-password-direct
export const resetPasswordByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { emailOrPhone, newPassword } = req.body;

    if (!emailOrPhone || !newPassword) {
      res.status(400).json({ message: "Identifier and new password are required" });
      return;
    }

    if (String(newPassword).length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    const isEmail = emailOrPhone.includes("@");
    const whereClause: Record<string, any> = isEmail
      ? { email: { [Op.iLike]: emailOrPhone.trim().toLowerCase() } }
      : { phone: emailOrPhone.trim() };

    const account =
      await User.findOne({ where: whereClause }) ||
      await Vet.findOne({ where: whereClause });

    if (!account) {
      res.status(404).json({ message: "Account not found" });
      return;
    }

    account.password = await bcrypt.hash(String(newPassword), 10);
    account.otpCode = null;
    account.otpExpiry = null;
    await account.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password using a valid email OTP
// @route   POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { userId, otp, newPassword } = req.body;

    if (!userId || !otp || !newPassword) {
      res.status(400).json({ message: "User ID, OTP, and new password are required" });
      return;
    }

    if (String(newPassword).length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    const account =
      await User.findByPk(userId) ||
      await Vet.findByPk(userId);

    if (!account) {
      res.status(404).json({ message: "Account not found" });
      return;
    }

    if (account.otpCode !== otp || new Date() > new Date(account.otpExpiry)) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    account.password = await bcrypt.hash(String(newPassword), 10);
    account.otpCode = null;
    account.otpExpiry = null;
    await account.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password (authenticated)
// @route   POST /api/auth/change-password
export const changePassword = async (req: any, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { currentPassword, newPassword } = req.body;
    const isVet = req.userType === 'vet';
    const Model = isVet ? Vet : User;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "Current and new password are required" });
      return;
    }

    const actor = await Model.findByPk(req.user.id);
    if (!actor) {
      res.status(404).json({ message: "Account not found" });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, actor.password);
    if (!isMatch) {
      res.status(400).json({ message: "Incorrect current password" });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: "New password must be at least 6 characters" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    actor.password = await bcrypt.hash(newPassword, salt);
    await actor.save();

    res.json({ message: "Password changed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel an in-progress registration — deletes the account ONLY if still unverified
// @route   DELETE /api/auth/cancel-registration/:userId
// This is called when the user backs out of OTP screen without verifying.
// Safe: a verified account can never be deleted through this endpoint.
export const cancelRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { users: User, vets: Vet } = db as any;
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Try user table first
    const user = await User.findByPk(userId);
    if (user) {
      if (user.isVerified) {
        res.status(403).json({ message: "Cannot cancel a verified account" });
        return;
      }
      await user.destroy();
      res.json({ success: true, message: "Registration cancelled" });
      return;
    }

    // Try vet table
    const vet = await Vet.findByPk(userId);
    if (vet) {
      if (vet.isVerified) {
        res.status(403).json({ message: "Cannot cancel a verified account" });
        return;
      }
      await vet.destroy();
      res.json({ success: true, message: "Registration cancelled" });
      return;
    }

    // Not found — treat as success (idempotent)
    res.json({ success: true, message: "Registration cancelled" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete own user or vet account
// @route   DELETE /api/auth/profile
export const deleteAccount = async (req: any, res: Response): Promise<void> => {
  const {
    users: User,
    vets: Vet,
    follows: Follow,
    posts: Post,
    comments: Comment,
    likes: Like,
    saved_posts: SavedPost,
    events: Event,
    event_bookings: EventBooking,
    reminders: Reminder,
    saved_vets: SavedVet,
    adoption_applications: AdoptionApplication,
    stories: Story,
    lost_pets: LostPet,
    circle_members: CircleMember,
    questions: Question,
    question_answers: QuestionAnswer,
    playdate_likes: PlaydateLike,
    owner_likes: OwnerLike,
    reports: Report,
    user_blocks: UserBlock,
    notifications: Notification,
    notification_preferences: NotificationPreference,
    notification_devices: NotificationDevice,
    pets: Pet,
    vaccines: Vaccine,
    medical_records: MedicalRecord,
    medications: Medication,
    allergies: Allergy,
    appointments: Appointment,
    vitals: Vital,
    memories: Memory,
    sequelize
  } = db as any;

  const isVet = req.userType === 'vet';
  const Model = isVet ? Vet : User;

  const t = await sequelize.transaction();

  try {
    const account = await Model.findByPk(req.user.id, { transaction: t });
    if (!account) {
      await t.rollback();
      res.status(404).json({ message: isVet ? "Veterinarian not found" : "User not found" });
      return;
    }

    // 1. Delete follow relationships where this user is follower or following
    await Follow.destroy({
      where: {
        [Op.or]: [
          { followerId: req.user.id },
          { followingId: req.user.id }
        ]
      },
      transaction: t
    });

    // 2. Delete blocks where this user is blocker or blocked
    await UserBlock.destroy({
      where: {
        [Op.or]: [
          { blockerId: req.user.id },
          { blockedId: req.user.id }
        ]
      },
      transaction: t
    });

    // 3. Delete reports where this user is reporter or reported
    await Report.destroy({
      where: {
        [Op.or]: [
          { reporterId: req.user.id },
          { reportedId: req.user.id }
        ]
      },
      transaction: t
    });

    // 4. Delete owner likes where this user is liker or target
    await OwnerLike.destroy({
      where: {
        [Op.or]: [
          { likerId: req.user.id },
          { targetId: req.user.id }
        ]
      },
      transaction: t
    });

    // 5. Delete notification-related items
    const actorType = isVet ? 'vet' : 'user';
    await Notification.destroy({
      where: { userId: req.user.id, userType: actorType },
      transaction: t
    });
    await NotificationPreference.destroy({
      where: { actorId: req.user.id, actorType },
      transaction: t
    });
    await NotificationDevice.destroy({
      where: { actorId: req.user.id, actorType },
      transaction: t
    });

    // 6. Delete posts, comments, likes, saved posts, stories, events, event bookings, questions, answers, reminders, saved vets, circle membership, lost pets (for both user and vet)
    await Comment.destroy({ where: { userId: req.user.id }, transaction: t });
    await Like.destroy({ where: { userId: req.user.id }, transaction: t });
    await SavedPost.destroy({ where: { userId: req.user.id }, transaction: t });
    await Post.destroy({ where: { userId: req.user.id }, transaction: t });
    await Story.destroy({ where: { userId: req.user.id }, transaction: t });
    await EventBooking.destroy({ where: { userId: req.user.id }, transaction: t });
    await Event.destroy({ where: { organizerId: req.user.id }, transaction: t });
    await QuestionAnswer.destroy({ where: { userId: req.user.id }, transaction: t });
    await Question.destroy({ where: { userId: req.user.id }, transaction: t });
    await Reminder.destroy({ where: { userId: req.user.id }, transaction: t });
    await SavedVet.destroy({ where: { userId: req.user.id }, transaction: t });
    await CircleMember.destroy({ where: { userId: req.user.id }, transaction: t });
    await LostPet.destroy({ where: { userId: req.user.id }, transaction: t });

    // 7. Pet and adoption specific cleanups (for regular users)
    if (!isVet) {
      // Get all pets
      const userPets = await Pet.findAll({ where: { ownerId: req.user.id }, transaction: t });
      const petIds = userPets.map((p: any) => p.id);
      if (petIds.length > 0) {
        await Vaccine.destroy({ where: { petId: petIds }, transaction: t });
        await MedicalRecord.destroy({ where: { petId: petIds }, transaction: t });
        await Medication.destroy({ where: { petId: petIds }, transaction: t });
        await Allergy.destroy({ where: { petId: petIds }, transaction: t });
        await Appointment.destroy({ where: { petId: petIds }, transaction: t });
        await Reminder.destroy({ where: { petId: petIds }, transaction: t });
        await Vital.destroy({ where: { petId: petIds }, transaction: t });
        await AdoptionApplication.destroy({ where: { petId: petIds }, transaction: t });
        await Memory.destroy({ where: { petId: petIds }, transaction: t });
        await PlaydateLike.destroy({
          where: {
            [Op.or]: [
              { swiperPetId: petIds },
              { targetPetId: petIds }
            ]
          },
          transaction: t
        });
        await Pet.destroy({ where: { id: petIds }, transaction: t });
      }

      await AdoptionApplication.destroy({
        where: {
          [Op.or]: [
            { applicantId: req.user.id },
            { ownerId: req.user.id }
          ]
        },
        transaction: t
      });
    }

    await account.destroy({ transaction: t });
    await t.commit();
    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    await t.rollback();
    res.status(500).json({ message: error.message });
  }
};
