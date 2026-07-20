import Job from "../models/job.model.js";

export async function getJob(jobId) {
    return Job.findById(jobId);
}

export async function updateJob(jobId, update) {
    return Job.findByIdAndUpdate(
        jobId,
        update,
        {
            new: true,
            runValidators: true,
        }
    );
}

export async function updateFields(jobId, fields) {
    return updateJob(jobId, fields);
}

export async function markProcessing(jobId) {
    const job = await Job.findOneAndUpdate(
        { _id: jobId, status: "pending" },
        {
            status: "processing",
            error: null,
            failedStep: null,
        },
        { new: true, runValidators: true }
    );

    if (!job) {
        throw new Error(`Job ${jobId} not found or not in pending state.`);
    }

    return job;
}

export async function markCompleted(jobId, data) {
    return updateJob(jobId, {
        status: "completed",
        completedAt: new Date(),
        ...data,
    });
}

export async function markFailed(jobId, error, failedStep, retryCount) {
    const updatePayload = {
        status: "failed",
        error,
        failedStep,
    };
    if (retryCount !== undefined) {
        updatePayload.retryCount = retryCount;
    }
    return updateJob(jobId, updatePayload);
}

export async function markPendingRetry(jobId, error, failedStep) {
    return updateJob(jobId, {
        status: "pending",
        error,
        failedStep
    });
}
