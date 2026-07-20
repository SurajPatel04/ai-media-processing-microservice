import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { QUEUE_NAMES } from "../constants/queue.constants.js";
import { processImageJob } from "../processors/image.processor.js";
import logger from "../utils/logger.utils.js";

export const imageWorker = new Worker(
    QUEUE_NAMES.IMAGE_PROCESSING,
    processImageJob,
    {
        connection: redisConnection,
        concurrency: 2,
    }
);

imageWorker.on("ready", () => {
    logger.info("Image worker is ready");
});

imageWorker.on("error", (error) => {
    logger.error("Worker error", error);
});
