import { Router } from "express";
import { uploadJob, getUserJobs, getJobDetails, retryJob } from "../controllers/job.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { uploadRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post("/upload", authenticate, uploadRateLimiter, upload.single("image"), uploadJob);
router.get("/", authenticate, getUserJobs);
router.get("/:id", authenticate, getJobDetails);
router.post("/:id/retry", authenticate, retryJob);

export default router;
