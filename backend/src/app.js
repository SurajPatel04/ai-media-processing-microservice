import express from "express";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./config/env.config.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import jobRouter from "./routes/job.route.js";

const app = express();

app.set("trust proxy", 1);

app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    next();
});

// middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

const allowedOrigins = (() => {
    if (env.nodeEnv === "production") {
        if (!process.env.FRONTEND_URL) {
            throw new Error("CRITICAL: FRONTEND_URL must be set in production. CORS cannot use a placeholder origin.");
        }
        return [process.env.FRONTEND_URL];
    }
    return ["http://localhost:3000", "http://localhost:5173"];
})();
app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,         // required for HttpOnly cookies to work cross-origin
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// routes
// health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", uptime: process.uptime() });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/jobs", jobRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

app.use(errorHandler);

export default app;