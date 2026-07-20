import { getJob, markProcessing, markFailed, markCompleted, markPendingRetry } from "../services/job.service.js";
import { storageService } from "../services/storage.service.js";
import { generateCaption } from "../services/caption.service.js";
import googleVisionService from "../services/googleVision.service.js";
import { env } from "../config/env.config.js";
import logger from "../utils/logger.utils.js";
import { PermanentProcessingError, ExternalServiceError } from "../utils/errors.utils.js";
import { sendFlaggedNotification } from "../services/notification.service.js";
import { UnrecoverableError } from "bullmq";
import { withTimeout } from "../utils/timeout.js";

const FLAG_THRESHOLD = ["LIKELY", "VERY_LIKELY"];
const FLAG_CATEGORIES = ["adult", "violence", "racy", "medical", "spoof"];

export async function processImageJob(job) {
    const startedAt = Date.now();
    const jobId = job.data.jobId;
    let currentStep = "initialization";

    try {
        const jobRecord = await getJob(jobId);
        if (!jobRecord) {
            throw new PermanentProcessingError(`Job not found in database: ${jobId}`);
        }

        if (jobRecord.status === "completed") {
            logger.warn("Job already completed", { jobId });
            return;
        }

        await markProcessing(jobId);
        logger.info("Job marked as processing", { jobId });

        const signedUrl = await storageService.getSignedUrl(
            jobRecord.storageKey,
            env.supabaseBucket
        );

        currentStep = "ai-analysis";

        const [captionData, visionData] = await Promise.all([
            withTimeout(generateCaption(signedUrl), 30000, "Gemini timeout"),
            withTimeout(googleVisionService.analyze(signedUrl), 15000, "Google Vision timeout")
        ]);

        const { labels, labelDetails, safeSearch, detectedObjects } = visionData;

        currentStep = "evaluation";
        const flaggedCategories = [];

        for (const category of FLAG_CATEGORIES) {
            if (FLAG_THRESHOLD.includes(safeSearch?.[category])) {
                flaggedCategories.push(category);
            }
        }

        const flagged = flaggedCategories.length > 0;

        if (flagged) {
            await sendFlaggedNotification(jobRecord.userId, jobId, flaggedCategories);
        }

        const processingTimeMs = Date.now() - startedAt;

        currentStep = "completion";
        await markCompleted(jobId, {
            caption: captionData.caption,
            scene: captionData.scene,
            dominantObjects: captionData.dominantObjects,
            peopleCount: captionData.peopleCount,
            isIndoor: captionData.isIndoor,
            confidence: captionData.confidence,
            labels,
            labelDetails,
            detectedObjects,
            safeSearch,
            flagged,
            flaggedCategories,
            metadata: {
                processingTimeMs,
                captionModel: env.captionModel,
                visionProvider: "google-cloud-vision",
                processedAt: new Date(),
            }
        });

        logger.info("Image processed", {
            jobId,
            queueJobId: job.id,
            filename: jobRecord.filename,
            userId: jobRecord.userId,
            workerPid: process.pid,
            captionLength: captionData?.caption?.length || 0,
            labelsCount: labels?.length || 0,
            flagged,
            durationMs: processingTimeMs,
        });

    } catch (error) {
        const durationMs = Date.now() - startedAt;

        logger.error(`Failed to process image`, {
            jobId,
            step: currentStep,
            error: error.message,
            durationMs
        });

        const isPermanent = error instanceof PermanentProcessingError;
        const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

        if (error instanceof ExternalServiceError && !isFinalAttempt) {
            await markPendingRetry(jobId, error.message, currentStep);
            throw error;
        }

        await markFailed(jobId, error.message, currentStep, job.attemptsMade + 1);
        throw new UnrecoverableError(error.message);
    }
}
