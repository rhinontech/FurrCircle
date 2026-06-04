import express from "express";
import { createReport, getReports } from "../controllers/reportController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.post("/", protect, createReport);
router.get("/", protect, getReports);

export default router;
