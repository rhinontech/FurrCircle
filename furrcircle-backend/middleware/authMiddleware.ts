import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import db from "../models/index.ts";

export interface AuthRequest extends Request {
  user?: any;
  userType?: 'user' | 'vet';
}

// Decodes JWT, determines if the caller is a User or Vet, attaches to req
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer")) {
    res.status(401).json({ message: "Not authorized, no token" });
    return;
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ message: "Server configuration error: JWT_SECRET not set" });
      return;
    }
    const decoded = jwt.verify(token, secret) as any;

    // Access models lazily inside the function — avoids ESM module-load ordering issues
    const { users: User, vets: Vet } = db as any;

    req.userType = decoded.userType || 'user';

    if (req.userType === 'vet') {
      req.user = await Vet.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      // Attach a virtual role so guards work uniformly
      if (req.user) req.user.role = 'veterinarian';
    } else {
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
    }

    if (!req.user) {
      res.status(401).json({ message: "Not authorized, user not found" });
      return;
    }

    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error.message);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
      res.status(401).json({ message: "Not authorized, token failed" });
    } else {
      res.status(500).json({ message: "Server error during authentication", detail: error.message });
    }
  }
};

export const adminAndVetOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'veterinarian')) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin or vet" });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

export const vetOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.userType === 'vet') {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as a veterinarian" });
  }
};

export const verifiedVetOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.userType === 'vet' && req.user?.isVerified) {
    next();
  } else if (req.userType === 'vet' && !req.user?.isVerified) {
    res.status(403).json({ message: "Your veterinarian account is pending verification. Please wait for admin approval." });
  } else {
    res.status(403).json({ message: "Not authorized as a verified veterinarian" });
  }
};

export const userAccountOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.userType === 'user' && req.user) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as a pet owner" });
  }
};

export const ownerOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as a pet owner" });
  }
};
