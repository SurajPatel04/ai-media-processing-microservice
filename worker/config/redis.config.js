import IORedis from "ioredis";
import { env } from "./env.config.js";
import logger from "../utils/logger.utils.js";

export const redisConnection = new IORedis({
    host: env.redisHost,
    port: env.redisPort,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

redisConnection.on("connect", () => {
    logger.info("Redis connected successfully");
});

redisConnection.on("error", (err) => {
    logger.error("Redis connection error:", { error: err.message, stack: err.stack });
});