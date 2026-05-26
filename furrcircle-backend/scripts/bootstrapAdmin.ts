import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import db from "../models/index.ts";

const { users: User } = db as any;

const args = process.argv.slice(2);

const readArg = (flag: string) => {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
};

const email = readArg("--email") || process.env.ADMIN_EMAIL || "alex@rhinonlabs.com";
const name = readArg("--name") || process.env.ADMIN_NAME || "Alex";
const password = readArg("--password") || process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString("base64url");

if (!email) {
  console.error("Missing admin email. Pass --email or set ADMIN_EMAIL.");
  process.exit(1);
}

const bootstrapAdmin = async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    existingUser.name = name || existingUser.name;
    existingUser.password = hashedPassword;
    existingUser.role = "admin";
    existingUser.isVerified = true;
    await existingUser.save();

    console.log(JSON.stringify({
      action: "updated",
      email,
      role: existingUser.role,
      password,
    }));
    return;
  }

  const admin = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
    isVerified: true,
  });

  console.log(JSON.stringify({
    action: "created",
    id: admin.id,
    email,
    role: admin.role,
    password,
  }));
};

try {
  await bootstrapAdmin();
} catch (error: any) {
  console.error(error?.message || error);
  process.exitCode = 1;
} finally {
  await db.sequelize.close();
}
