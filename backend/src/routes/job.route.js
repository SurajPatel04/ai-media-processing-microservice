import { Router } from "express";
import { uploadJob } from "../controllers/job.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/upload", authenticate, upload.single("image"), uploadJob);

export default router;
