import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { storageService } from "../services/storage.service.js";
import { createJob, getJobsByUserId, getJobById, countJobsByUserId, getJobStatsByUserId } from "../services/job.service.js";
import { enqueueImageJob } from "../services/queue.service.js";
import { imageQueue } from "../queues/image.queue.js";
import fs from "fs";
import { fileTypeFromFile } from "file-type";
import { logInfo, logWarn } from "../utils/logHelper.utils.js";
import { env } from "../config/env.config.js";
import { JOB_STATUS } from "../constants/job.constants.js";

export const uploadJob = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Image file is required");
    }

    let uploadedStorageKey = null;
    let job;

    try {
        const meta = await fileTypeFromFile(req.file.path);
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!meta || !allowedTypes.includes(meta.mime)) {
            throw new ApiError(400, "Invalid file content. Only authentic JPG, PNG, and WEBP files are allowed.");
        }

        const { storageKey } = await storageService.uploadImage(req.file.path, env.supabaseBucket, meta.mime);
        uploadedStorageKey = storageKey;

        const sanitizedFilename = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');

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

        if (uploadedStorageKey && !job) {
            await storageService.deleteImage(uploadedStorageKey, env.supabaseBucket).catch(console.error);
        }

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

export const getUserJobs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const [jobs, stats] = await Promise.all([
        getJobsByUserId(req.user._id, page, limit),
        getJobStatsByUserId(req.user._id)
    ]);

    const enrichedJobs = await Promise.all(jobs.map(async (job) => {
        const jobObj = job.toObject();
        try {
            jobObj.imageUrl = await storageService.getSignedUrl(job.storageKey, env.supabaseBucket);
        } catch (error) {
            logWarn("Failed to generate signed url", req, { storageKey: job.storageKey });
            jobObj.imageUrl = null;
        }
        return jobObj;
    }));

    return res.status(200).json(
        new ApiResponse(200, { items: enrichedJobs, total: stats.total, stats: stats }, "Jobs retrieved successfully")
    );
});

export const getJobDetails = asyncHandler(async (req, res) => {
    const job = await getJobById(req.params.id, req.user._id);

    if (!job) {
        throw new ApiError(404, "Job not found");
    }

    const jobObj = job.toObject();
    try {
        jobObj.imageUrl = await storageService.getSignedUrl(job.storageKey, env.supabaseBucket);
    } catch (error) {
        logWarn("Failed to generate signed url", req, { storageKey: job.storageKey });
        jobObj.imageUrl = null;
    }

    return res.status(200).json(
        new ApiResponse(200, jobObj, "Job details retrieved successfully")
    );
});

export const retryJob = asyncHandler(async (req, res) => {
    const job = await getJobById(req.params.id, req.user._id);

    if (!job) {
        throw new ApiError(404, "Job not found");
    }

    if (job.status !== JOB_STATUS.FAILED) {
        throw new ApiError(400, "Only failed jobs can be retried");
    }

    job.status = JOB_STATUS.PENDING;
    job.error = null;
    job.failedStep = null;
    job.retryCount = (job.retryCount || 0) + 1;

    try {
        // Remove the old BullMQ job first so the dedup jobId doesn't collide
        // with the retained failed job still sitting in Redis.
        const oldQueueJobId = job.queueJobId || job._id.toString();
        await imageQueue.remove(oldQueueJobId).catch(() => {
            // Swallow — job may have already been cleaned up by removeOnFail
        });

        const bullJob = await enqueueImageJob(job._id);
        job.queueJobId = bullJob.id;
        await job.save();

        logInfo("Job user-retry triggered successfully", req, {
            jobId: job._id,
            userId: req.user._id,
            retryCount: job.retryCount,
            queueJobId: bullJob.id
        });

        return res.status(202).json(
            new ApiResponse(202, { jobId: job._id, status: job.status, retryCount: job.retryCount }, "Job retry queued successfully")
        );
    } catch (error) {
        logWarn("Failed to re-enqueue job for retry", req, {
            jobId: job._id,
            userId: req.user._id,
            error: error.message
        });
        throw new ApiError(500, "Failed to re-enqueue the job");
    }
});
