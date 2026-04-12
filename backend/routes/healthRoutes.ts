import express from "express";
import {
  getVitals,
  addVital,
  getVaccines,
  addVaccine,
  generateCertificate,
  getMedications,
  addMedication,
  getMedicalRecords,
  addMedicalRecord,
  getAllergies,
  addAllergy,
} from "../controllers/healthController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.route("/vitals/:petId").get(protect, getVitals).post(protect, addVital);
router.route("/vaccines/:petId").get(protect, getVaccines).post(protect, addVaccine);
router.post("/vaccines/:petId/:vaccineId/certificate", protect, generateCertificate);
router.route("/meds/:petId").get(protect, getMedications).post(protect, addMedication);
router.route("/records/:petId").get(protect, getMedicalRecords).post(protect, addMedicalRecord);
router.route("/allergies/:petId").get(protect, getAllergies).post(protect, addAllergy);

export default router;
