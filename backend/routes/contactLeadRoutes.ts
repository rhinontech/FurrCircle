import express from "express";
import { submitContactLead } from "../controllers/contactLeadController.ts";

const router = express.Router();

router.post("/", submitContactLead);

export default router;
