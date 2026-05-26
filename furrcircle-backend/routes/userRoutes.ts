import express from "express";
import { getUserByHandle } from "../controllers/userController.ts";

const router = express.Router();

router.get("/:handle", getUserByHandle);

export default router;
