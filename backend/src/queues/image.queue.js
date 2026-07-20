import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { QUEUE_NAMES } from "./queue.constants.js";

export const imageQueue = new Queue(
    QUEUE_NAMES.IMAGE_PROCESSING,
    {
        connection: redisConnection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000,
            },
            removeOnComplete: 100,
            removeOnFail: 50,
        },
    }
);