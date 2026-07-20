import { QueueEvents } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { QUEUE_NAMES } from "./queue.constants.js";
import logger from "../utils/logger.utils.js";

export const imageQueueEvents = new QueueEvents(QUEUE_NAMES.IMAGE_PROCESSING, {
    connection: redisConnection
});

imageQueueEvents.on('active', ({ jobId }) => {
    logger.info(`[BullMQ] Job ${jobId} started processing`);
});

imageQueueEvents.on('completed', ({ jobId }) => {
    logger.info(`[BullMQ] Job ${jobId} completed successfully`);
});

imageQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error(`[BullMQ] Job ${jobId} failed. Reason: ${failedReason}`);
});
