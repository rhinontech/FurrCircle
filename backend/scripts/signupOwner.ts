import "dotenv/config";
import bcrypt from "bcryptjs";
import db from "../models/index.ts";
import { Op } from "sequelize";
// import { sendEmail } from "../services/emailService.ts";

const { users: User, vets: Vet } = db as any;

const args = process.argv.slice(2);

const readArg = (flag: string) => {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
};

const email = readArg("--email") || "varun@rhinon.tech";
const name = readArg("--name") || "Varun Mathiyalagan";
const password = readArg("--password") || "Dot@12345";
const phone = readArg("--phone") || "+91 98765 43210";
const city = readArg("--city") || "Coimbatore";
const address = readArg("--address") || "Rhinon Tech HQ";

if (!email || !password) {
  console.error("Usage: npm run signup-owner -- --email <email> --password <password> [--name <name>] [--phone <phone>] [--city <city>] [--address <address>]");
  process.exit(1);
}

const signupOwner = async () => {
  const normalizedEmail = email.trim().toLowerCase();

  // Check if account already exists
  const [userExists, vetExists] = await Promise.all([
    User.findOne({ where: { email: { [Op.iLike]: normalizedEmail } } }),
    Vet.findOne({ where: { email: { [Op.iLike]: normalizedEmail } } }),
  ]);

  if (userExists || vetExists) {
    console.error(`An account with email ${email} already exists.`);
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: "owner",
    isVerified: true,
    hasCompletedOnboarding: true,
    phone,
    city,
    address,
  });

  // await sendEmail(user.email, "Welcome to FurrCircle!", "welcome", { name: user.name });

  console.log(JSON.stringify({
    message: "Owner account created successfully",
    id: user.id,
    email: user.email,
    role: user.role,
  }, null, 2));
};

try {
  await signupOwner();
} catch (error: any) {
  console.error("Error creating owner account:", error?.message || error);
  process.exitCode = 1;
} finally {
  await db.sequelize.close();
}
