import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { storageService } from "../services/storage.service.js";
import { createJob } from "../services/job.service.js";
import { enqueueImageJob } from "../services/queue.service.js";
import fs from "fs";
import { fileTypeFromFile } from "file-type";
import { logInfo, logWarn } from "../utils/logHelper.utils.js";
import { env } from "../config/env.config.js";
import { JOB_STATUS } from "../constants/job.constants.js";

export const uploadJob = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Image file is required");
    }

    try {
        const meta = await fileTypeFromFile(req.file.path);
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!meta || !allowedTypes.includes(meta.mime)) {
            throw new ApiError(400, "Invalid file content. Only authentic JPG, PNG, and WEBP files are allowed.");
        }

        const { storageKey } = await storageService.uploadImage(req.file.path, env.supabaseBucket, meta.mime);

        const sanitizedFilename = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');

        let job;
        try {
            job = await createJob({
                userId: req.user._id,
                filename: sanitizedFilename,
                storageKey: storageKey,
                status: JOB_STATUS.PENDING
            });

            const bullJob = await enqueueImageJob(job._id);

            job.queueJobId = bullJob.id;
            await job.save();

            logInfo("Job created and enqueued successfully", req, { 
                jobId: job._id,
                userId: req.user._id,
                filename: sanitizedFilename,
                queueJobId: bullJob.id
            });

            return res.status(202).json(
                new ApiResponse(202, { jobId: job._id, status: job.status }, "Image uploaded and processing started")
            );
        } catch (queueError) {
            // Compensation logic: if we created the job but failed to enqueue, mark it as failed
            if (job && job._id) {
                job.status = JOB_STATUS.FAILED;
                job.error = "System failed to enqueue the background processing job.";
                await job.save().catch(console.error);
            }
            throw queueError; // Re-throw to be caught by the outer catch
        }
    } catch (error) {
        logWarn("Job upload failed", req, { 
            userId: req.user?._id,
            filename: req.file?.originalname,
            error: error.message 
        });

        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(500, "Failed to process image upload");
    } finally {
        if (req.file && fs.existsSync(req.file.path)) {
            await fs.promises.unlink(req.file.path).catch(console.error);
        }
    }
});
