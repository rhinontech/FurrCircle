import fs from "fs";
import path from "path";
import { Sequelize, DataTypes } from "sequelize";
import type { Options } from "sequelize";
import configParams from "../config/config.js";

// Because we are using ES Modules ("type": "module"), 
// we use import.meta.url and import.meta.dirname instead of __dirname.
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

// 1. Read all files in the current models directory
const filesInDir = fs.readdirSync(currentDir).filter((file) => {
  return (
    file.indexOf(".") !== 0 &&
    file !== basename &&
    file.slice(-3) === ".ts" &&
    file.indexOf(".test.ts") === -1
  );
});

// 2. Dynamically import each model file and initialize it
for (const file of filesInDir) {
  const modelModule = await import(`./${file}`);
  const model = modelModule.default(sequelize, DataTypes);
  db[model.name] = model;
}

// User <-> Pet (Owner)
db.pets.belongsTo(db.users, { foreignKey: 'owner_id', as: 'owner' });
db.users.hasMany(db.pets, { foreignKey: 'owner_id', as: 'pets' });

// Vet <-> VetReview
db.vet_reviews.belongsTo(db.vets, { foreignKey: 'vet_id', as: 'vet' });
db.vets.hasMany(db.vet_reviews, { foreignKey: 'vet_id', as: 'reviews' });

// User <-> VetReview
db.vet_reviews.belongsTo(db.users, { foreignKey: 'user_id', as: 'user' });
db.users.hasMany(db.vet_reviews, { foreignKey: 'user_id', as: 'vetReviews' });

// Vet <-> Appointment
db.appointments.belongsTo(db.vets, { foreignKey: 'vet_id', as: 'vet' });
db.vets.hasMany(db.appointments, { foreignKey: 'vet_id', as: 'appointments' });

// User <-> Appointment
db.appointments.belongsTo(db.users, { foreignKey: 'user_id', as: 'user' });
db.users.hasMany(db.appointments, { foreignKey: 'user_id', as: 'appointments' });

// Pet <-> Appointment
db.appointments.belongsTo(db.pets, { foreignKey: 'pet_id', as: 'pet' });
db.pets.hasMany(db.appointments, { foreignKey: 'pet_id', as: 'appointments' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Export individual models for destructuring imports
export const users = db.users;
export const vets = db.vets;
export const pets = db.pets;
export const vet_reviews = db.vet_reviews;
export const appointments = db.appointments;

export { sequelize, Sequelize };
export default db;
