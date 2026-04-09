import "dotenv/config";
import bcrypt from "bcryptjs";
import db from "../models/index.ts";

const { users: User, vets: Vet } = db as any;

const DEMO_PASSWORD = "Demo1234";

const demoOwner = {
  name: "Demo Owner",
  email: "demo.owner@pawshub.app",
  role: "owner" as const,
};

const demoVet = {
  name: "Dr. Demo Vet",
  email: "demo.vet@pawshub.app",
  hospital_name: "PawsHub Clinic",
  profession: "General Veterinarian",
};

const seedDemoAccounts = async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, salt);

  // ── Demo Owner ───────────────────────────────────────────────────────────────
  const existingOwner = await User.findOne({ where: { email: demoOwner.email } });
  if (existingOwner) {
    existingOwner.password = hashedPassword;
    existingOwner.isVerified = true;
    await existingOwner.save();
    console.log(`[updated] owner  → ${demoOwner.email}`);
  } else {
    await User.create({ ...demoOwner, password: hashedPassword, isVerified: true });
    console.log(`[created] owner  → ${demoOwner.email}`);
  }

  // ── Demo Vet ─────────────────────────────────────────────────────────────────
  const existingVet = await Vet.findOne({ where: { email: demoVet.email } });
  if (existingVet) {
    existingVet.password = hashedPassword;
    existingVet.isVerified = true;
    await existingVet.save();
    console.log(`[updated] vet    → ${demoVet.email}`);
  } else {
    await Vet.create({ ...demoVet, password: hashedPassword, isVerified: true });
    console.log(`[created] vet    → ${demoVet.email}`);
  }

  console.log(`\nPassword for both accounts: ${DEMO_PASSWORD}`);
};

try {
  await seedDemoAccounts();
} catch (error: any) {
  console.error(error?.message || error);
  process.exitCode = 1;
} finally {
  await db.sequelize.close();
}
