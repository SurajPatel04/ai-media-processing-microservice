import { imageQueue } from "../queues/image.queue.js";
import { JOB_NAMES } from "../queues/queue.constants.js";

export async function enqueueImageJob(jobId) {
    return imageQueue.add(JOB_NAMES.PROCESS_IMAGE, {
        jobId,
    }, {
        jobId: jobId.toString()
    });
}