import { Router } from "express";
import { generateMatrixHandler, getPresetsHandler } from "../services/handlers";

const router = Router();

router.post("/generate", generateMatrixHandler);
router.get("/presets", getPresetsHandler);

export default router;
