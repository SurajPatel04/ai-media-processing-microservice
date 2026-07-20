import winston from "winston";
import { env } from "../config/env.config.js";

const isProd = process.env.NODE_ENV === "production";

const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (stack) log += `\n${stack}`;
        if (Object.keys(meta).length) log += ` ${JSON.stringify(meta)}`;
        return log;
    })
);

const transports = [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
];

const logger = winston.createLogger({
    level: "info",
    format: isProd ? jsonFormat : devFormat,
    transports,
});

export default logger;