import connectDB from "./config/db.config.js";
import mongoose from "mongoose";
import { imageWorker } from "./queues/image.worker.js";
import { redisConnection } from "./config/redis.config.js";
import logger from "./utils/logger.utils.js";

await connectDB();

logger.info("Image worker started");

const shutdown = async () => {
    logger.info("Stopping worker gracefully...");
    try {
        await imageWorker.close();
        await mongoose.disconnect();
        await redisConnection.quit();
        logger.info("Worker stopped successfully.");
        process.exit(0);
    } catch (error) {
        logger.error("Error during graceful shutdown", { error: error.message });
        process.exit(1);
    }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
