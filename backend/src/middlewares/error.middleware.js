import { logError, logWarn } from "../utils/logHelper.utils.js";
import { env } from "../config/env.js";

export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if (err.code === 11000) {
        const field = err.keyValue ? Object.keys(err.keyValue)[0] : "field";
        logWarn("MongoDB Duplicate Key Error", req, {
            context: "MONGO_DUPLICATE_KEY",
            field: field,
        });

        return res.status(409).json({
            success: false,
            message: `Duplicate value entered for ${field}`,
            field: field,
        });
    }

    if (err.name === "CastError") {
        logWarn("MongoDB Cast Error", req, {
            context: "MONGO_CAST_ERROR",
            detail: err.message,
        });

        return res.status(404).json({
            success: false,
            message: `Resource not found. Invalid: ${err.path}`,
        });
    }

    if (err.name === "ValidationError") {
        logWarn("MongoDB Validation Error", req, {
            context: "MONGO_VALIDATION",
            detail: err.message,
        });

        const errors = Object.values(err.errors || {}).map((val) => val.message);
        
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: errors,
        });
    }

    // Final fallback
    if (statusCode >= 500) {
        logError(err, req, {
            context: "INTERNAL_SERVER_ERROR",
        });
    } else {
        logWarn("Handled API Error", req, {
            context: "API_ERROR",
            errorMessage: err.message,
        });
    }

    return res.status(statusCode).json({
        success: false,
        message: message,
        ...(err.errors && { errors: err.errors }),
        ...(env.nodeEnv !== "production" && { stack: err.stack }),
    });
};