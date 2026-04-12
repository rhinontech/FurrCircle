import fs from "fs";
import path from "path";
import { Sequelize, DataTypes } from "sequelize";
import type { Options } from "sequelize";
import configParams from "../config/config.js";

const basename = path.basename(import.meta.url);
const currentDir = import.meta.dirname;
const env = process.env.NODE_ENV || "development";
const config = (configParams as Record<string, any>)[env];
const db: any = {};
let sequelize: Sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable] as string, config as Options);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config as Options
  );
}

// Dynamically import every .ts model file in this directory
const filesInDir = fs.readdirSync(currentDir).filter((file) => {
  return (
    file.indexOf(".") !== 0 &&
    file !== basename &&
    file.slice(-3) === ".ts" &&
    file.indexOf(".test.ts") === -1
  );
});

for (const file of filesInDir) {
  const modelModule = await import(`./${file}`);
  const model = modelModule.default(sequelize, DataTypes);
  db[model.name] = model;
}

// ─── Associations ─────────────────────────────────────────────────────────────

// User <-> Pet
db.pets.belongsTo(db.users, { foreignKey: 'ownerId', as: 'owner' });
db.users.hasMany(db.pets, { foreignKey: 'ownerId', as: 'pets' });

// Vet <-> VetReview
db.vet_reviews.belongsTo(db.vets, { foreignKey: 'vetId', as: 'vet' });
db.vets.hasMany(db.vet_reviews, { foreignKey: 'vetId', as: 'reviews' });

// User <-> VetReview
db.vet_reviews.belongsTo(db.users, { foreignKey: 'userId', as: 'user' });
db.users.hasMany(db.vet_reviews, { foreignKey: 'userId', as: 'vetReviews' });

// Appointment relations
db.appointments.belongsTo(db.vets, { foreignKey: 'vetId', as: 'veterinarian' });
db.vets.hasMany(db.appointments, { foreignKey: 'vetId', as: 'appointments' });

db.appointments.belongsTo(db.users, { foreignKey: 'ownerId', as: 'owner' });
db.users.hasMany(db.appointments, { foreignKey: 'ownerId', as: 'ownerAppointments' });

db.appointments.belongsTo(db.pets, { foreignKey: 'petId', as: 'pet' });
db.pets.hasMany(db.appointments, { foreignKey: 'petId', as: 'Appointments' });

// Health: Pet <-> Vitals / Vaccines / Medications / MedicalRecords
db.vitals.belongsTo(db.pets, { foreignKey: 'petId', as: 'pet' });
db.pets.hasMany(db.vitals, { foreignKey: 'petId', as: 'vitals' });

db.vaccines.belongsTo(db.pets, { foreignKey: 'petId', as: 'pet' });
db.pets.hasMany(db.vaccines, { foreignKey: 'petId', as: 'Vaccines' });

db.medications.belongsTo(db.pets, { foreignKey: 'petId', as: 'pet' });
db.pets.hasMany(db.medications, { foreignKey: 'petId', as: 'Medications' });

db.medical_records.belongsTo(db.pets, { foreignKey: 'petId', as: 'pet' });
db.pets.hasMany(db.medical_records, { foreignKey: 'petId', as: 'medicalRecords' });

db.allergies.belongsTo(db.pets, { foreignKey: 'petId', as: 'pet' });
db.pets.hasMany(db.allergies, { foreignKey: 'petId', as: 'Allergies' });

// Community: Post <-> User / Comments / Likes
db.posts.belongsTo(db.users, { foreignKey: 'userId', as: 'author' });
db.users.hasMany(db.posts, { foreignKey: 'userId', as: 'posts' });

db.comments.belongsTo(db.posts, { foreignKey: 'postId' });
db.posts.hasMany(db.comments, { foreignKey: 'postId', as: 'comments' });

db.comments.belongsTo(db.users, { foreignKey: 'userId', as: 'author' });
db.users.hasMany(db.comments, { foreignKey: 'userId', as: 'comments' });

db.likes.belongsTo(db.posts, { foreignKey: 'postId' });
db.posts.hasMany(db.likes, { foreignKey: 'postId', as: 'likes' });

db.likes.belongsTo(db.users, { foreignKey: 'userId' });

db.saved_posts.belongsTo(db.posts, { foreignKey: 'postId' });
db.posts.hasMany(db.saved_posts, { foreignKey: 'postId', as: 'savedPosts' });

// Events
db.events.belongsTo(db.users, { foreignKey: 'organizerId', as: 'organizer' });
db.users.hasMany(db.events, { foreignKey: 'organizerId', as: 'events' });

db.event_bookings.belongsTo(db.events, { foreignKey: 'eventId', as: 'event' });
db.events.hasMany(db.event_bookings, { foreignKey: 'eventId', as: 'bookings' });

db.messages.belongsTo(db.conversations, { foreignKey: 'conversationId' });
db.conversations.hasMany(db.messages, { foreignKey: 'conversationId', as: 'messages' });

db.conversations.belongsTo(db.pets, { foreignKey: 'petId', as: 'pet' });

// Reminders
db.reminders.belongsTo(db.users, { foreignKey: 'userId', as: 'user' });
db.users.hasMany(db.reminders, { foreignKey: 'userId', as: 'reminders' });

db.reminders.belongsTo(db.pets, { foreignKey: 'petId', as: 'pet' });
db.pets.hasMany(db.reminders, { foreignKey: 'petId', as: 'reminders' });

// Saved Vets
db.saved_vets.belongsTo(db.users, { foreignKey: 'userId', as: 'user' });
db.users.hasMany(db.saved_vets, { foreignKey: 'userId', as: 'savedVets' });
db.saved_vets.belongsTo(db.vets, { foreignKey: 'vetId', as: 'vet' });

// Adoption Applications
db.adoption_applications.belongsTo(db.pets, { foreignKey: 'petId', as: 'pet' });
db.pets.hasMany(db.adoption_applications, { foreignKey: 'petId', as: 'adoptionApplications' });
db.adoption_applications.belongsTo(db.users, { foreignKey: 'applicantId', as: 'applicant' });
db.adoption_applications.belongsTo(db.users, { foreignKey: 'ownerId', as: 'petOwner' });

// ──────────────────────────────────────────────────────────────────────────────

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Named exports for direct destructuring imports
export const users = db.users;
export const vets = db.vets;
export const pets = db.pets;
export const vet_reviews = db.vet_reviews;
export const appointments = db.appointments;
export const vitals = db.vitals;
export const vaccines = db.vaccines;
export const medications = db.medications;
export const medical_records = db.medical_records;
export const allergies = db.allergies;
export const posts = db.posts;
export const comments = db.comments;
export const likes = db.likes;
export const saved_posts = db.saved_posts;
export const events = db.events;
export const event_bookings = db.event_bookings;
export const conversations = db.conversations;
export const messages = db.messages;
export const reminders = db.reminders;
export const saved_vets = db.saved_vets;
export const notifications = db.notifications;
export const adoption_applications = db.adoption_applications;

export { sequelize, Sequelize };
export default db;
