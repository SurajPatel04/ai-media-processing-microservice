import logger from "../utils/logger.utils.js";
import Job from "../models/job.model.js";

export async function sendFlaggedNotification(userId, jobId, categories) {
    logger.warn("FLAGGED_CONTENT_ALERT", {
        jobId,
        userId,
        flaggedCategories: categories,
        severity: categories.includes("adult") || categories.includes("violence") ? "HIGH" : "MEDIUM",
        action: "review_required",
    });

    await Job.findByIdAndUpdate(jobId, {
        flaggedNotifiedAt: new Date(),
    }).catch((err) => {
        logger.error("Failed to persist flaggedNotifiedAt timestamp", {
            jobId,
            error: err.message,
        });
    });
}
