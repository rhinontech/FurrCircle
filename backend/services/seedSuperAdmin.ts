import bcrypt from "bcryptjs";
import db from "../models/index.ts";

export const seedSuperAdmin = async (): Promise<void> => {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    console.log("[SuperAdmin] ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping seed.");
    return;
  }

  const { users: User } = db as any;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ where: { email } });

  if (existing) {
    existing.password = hashedPassword;
    existing.role = "admin";
    existing.isVerified = true;
    await existing.save();
    console.log(`[SuperAdmin] Updated super admin: ${email}`);
    return;
  }

  const username = email.split("@")[0].replace(/[^a-zA-Z0-9._]/g, "").toLowerCase() || "superadmin";
  const uniqueUsername = `${username}_${Date.now()}`;

  await User.create({
    name: "Super Admin",
    email,
    username: uniqueUsername,
    password: hashedPassword,
    role: "admin",
    isVerified: true,
    hasCompletedOnboarding: true,
  });

  console.log(`[SuperAdmin] Created super admin: ${email}`);
};
