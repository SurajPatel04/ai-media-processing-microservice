import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/apiError.utils.js";

export const authRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        const resetTime = req.rateLimit.resetTime;
        const secondsLeft = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
        next(new ApiError(429, `Too many requests from this IP, please try again in ${secondsLeft} seconds.`));
    },
});

export const uploadRateLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        const resetTime = req.rateLimit.resetTime;
        const secondsLeft = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
        next(new ApiError(429, `Upload limit reached. Please try again in ${secondsLeft} seconds.`));
    },
});
