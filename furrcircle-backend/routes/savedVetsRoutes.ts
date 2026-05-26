import express from "express";
import { listSavedVets, saveVet, unsaveVet, getSaveStatus, getSavedVetsCount } from "../controllers/savedVetsController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/", protect, listSavedVets);
router.get("/count", protect, getSavedVetsCount);
router.get("/:vetId/status", protect, getSaveStatus);
router.post("/:vetId", protect, saveVet);
router.delete("/:vetId", protect, unsaveVet);

export default router;
