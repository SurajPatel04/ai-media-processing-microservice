import logger from "./logger.utils.js";

export const logError = (err, req, extra = {}) => {
    logger.error(extra.context || err.message || "Internal Server Error", {
        stack: err.stack,
        statusCode: err.statusCode,
        method: req?.method,
        path: req?.originalUrl,
        userId: req?.user?._id,
        requestId: req?.id,
        ip: req?.ip,
        ...extra,
    });
};

export const logWarn = (message, req, extra = {}) => {
    logger.warn(extra.context || message, {
        method: req?.method,
        path: req?.originalUrl,
        userId: req?.user?._id,
        requestId: req?.id,
        ip: req?.ip,
        ...extra,
    });
};

export const logInfo = (message, req, extra = {}) => {
    logger.info(extra.context || message, {
        method: req?.method,
        path: req?.originalUrl,
        userId: req?.user?._id,
        requestId: req?.id,
        ip: req?.ip,
        ...extra,
    });
};