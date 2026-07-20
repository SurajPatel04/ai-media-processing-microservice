import { describe, test, expect, vi, beforeEach } from "vitest";
import { processImageJob } from "../processors/image.processor.js";
import { getJob, markProcessing, markFailed, markCompleted, markPendingRetry } from "../services/job.service.js";
import { storageService } from "../services/storage.service.js";
import { generateCaption } from "../services/caption.service.js";
import googleVisionService from "../services/googleVision.service.js";
import { sendFlaggedNotification } from "../services/notification.service.js";
import { UnrecoverableError } from "bullmq";
import { ExternalServiceError, PermanentProcessingError } from "../utils/errors.utils.js";

// ── Mock all external dependencies to isolate business logic ──
vi.mock("../services/job.service.js", () => ({
    getJob: vi.fn(),
    markProcessing: vi.fn(),
    markFailed: vi.fn(),
    markCompleted: vi.fn(),
    markPendingRetry: vi.fn(),
}));

vi.mock("../services/storage.service.js", () => ({
    storageService: { getSignedUrl: vi.fn() },
}));

vi.mock("../services/caption.service.js", () => ({
    generateCaption: vi.fn(),
}));

vi.mock("../services/googleVision.service.js", () => ({
    default: { analyze: vi.fn() },
}));

vi.mock("../services/notification.service.js", () => ({
    sendFlaggedNotification: vi.fn(),
}));

vi.mock("../utils/logger.utils.js", () => ({
    default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("../utils/timeout.js", () => ({
    withTimeout: (promise) => promise, // passthrough — no real timeout in tests
}));

vi.mock("../config/env.config.js", () => ({
    env: {
        supabaseBucket: "test-bucket",
        captionModel: "gemini-2.5-flash",
    },
}));

// ── Shared fixtures ──
const SAFE_VISION = {
    labels: ["Test Label"],
    labelDetails: [{ description: "Test Label", score: 0.99 }],
    detectedObjects: [{ name: "Test Object", count: 1, confidence: 0.99 }],
    safeSearch: {
        adult: "VERY_UNLIKELY",
        violence: "VERY_UNLIKELY",
        racy: "VERY_UNLIKELY",
        medical: "VERY_UNLIKELY",
        spoof: "VERY_UNLIKELY",
    },
};

const GOOD_CAPTION = {
    caption: "A test caption",
    scene: "Test scene",
    dominantObjects: ["test"],
    peopleCount: 1,
    isIndoor: true,
    confidence: 0.95,
};

function makeBullJob(overrides = {}) {
    return {
        id: "bull-job-123",
        data: { jobId: "db-job-123" },
        attemptsMade: 0,
        opts: { attempts: 3 },
        ...overrides,
    };
}

function seedHappyPath() {
    getJob.mockResolvedValue({
        _id: "db-job-123",
        status: "pending",
        userId: "user-1",
        filename: "test.jpg",
        storageKey: "test-key",
    });
    storageService.getSignedUrl.mockResolvedValue("https://signed-url.com/img");
    generateCaption.mockResolvedValue(GOOD_CAPTION);
    googleVisionService.analyze.mockResolvedValue(SAFE_VISION);
}

// ════════════════════════════════════════════════════════════
describe("Image Processor", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        seedHappyPath();
    });

    // ── Happy path ──
    test("successfully processes a clean image job", async () => {
        const job = makeBullJob();
        await processImageJob(job);

        expect(getJob).toHaveBeenCalledWith("db-job-123");
        expect(markProcessing).toHaveBeenCalledWith("db-job-123");
        expect(generateCaption).toHaveBeenCalled();
        expect(googleVisionService.analyze).toHaveBeenCalled();

        expect(markCompleted).toHaveBeenCalledWith(
            "db-job-123",
            expect.objectContaining({ caption: "A test caption", flagged: false })
        );
    });

    test("skips already-completed jobs without re-processing", async () => {
        getJob.mockResolvedValue({ _id: "db-job-123", status: "completed" });

        await processImageJob(makeBullJob());

        expect(markProcessing).not.toHaveBeenCalled();
        expect(markCompleted).not.toHaveBeenCalled();
    });

    // ── Flagging / moderation ──
    test("flags content and sends notification when safeSearch triggers", async () => {
        googleVisionService.analyze.mockResolvedValue({
            ...SAFE_VISION,
            safeSearch: {
                adult: "VERY_LIKELY",
                violence: "VERY_UNLIKELY",
                racy: "LIKELY",
                medical: "VERY_UNLIKELY",
                spoof: "VERY_UNLIKELY",
            },
        });

        await processImageJob(makeBullJob());

        expect(sendFlaggedNotification).toHaveBeenCalledWith(
            "user-1",
            "db-job-123",
            ["adult", "racy"]
        );
        expect(markCompleted).toHaveBeenCalledWith(
            "db-job-123",
            expect.objectContaining({
                flagged: true,
                flaggedCategories: ["adult", "racy"],
            })
        );
    });

    test("does NOT flag when all categories are below threshold", async () => {
        googleVisionService.analyze.mockResolvedValue({
            ...SAFE_VISION,
            safeSearch: {
                adult: "POSSIBLE",
                violence: "UNLIKELY",
                racy: "VERY_UNLIKELY",
                medical: "UNLIKELY",
                spoof: "POSSIBLE",
            },
        });

        await processImageJob(makeBullJob());

        expect(sendFlaggedNotification).not.toHaveBeenCalled();
        expect(markCompleted).toHaveBeenCalledWith(
            "db-job-123",
            expect.objectContaining({ flagged: false, flaggedCategories: [] })
        );
    });

    test("flags content when medical category is VERY_LIKELY", async () => {
        googleVisionService.analyze.mockResolvedValue({
            ...SAFE_VISION,
            safeSearch: {
                ...SAFE_VISION.safeSearch,
                medical: "VERY_LIKELY",
            },
        });

        await processImageJob(makeBullJob());

        expect(sendFlaggedNotification).toHaveBeenCalledWith("user-1", "db-job-123", ["medical"]);
        expect(markCompleted).toHaveBeenCalledWith(
            "db-job-123",
            expect.objectContaining({ flagged: true, flaggedCategories: ["medical"] })
        );
    });

    test("flags content when spoof category is VERY_LIKELY", async () => {
        googleVisionService.analyze.mockResolvedValue({
            ...SAFE_VISION,
            safeSearch: {
                ...SAFE_VISION.safeSearch,
                spoof: "VERY_LIKELY",
            },
        });

        await processImageJob(makeBullJob());

        expect(sendFlaggedNotification).toHaveBeenCalledWith("user-1", "db-job-123", ["spoof"]);
        expect(markCompleted).toHaveBeenCalledWith(
            "db-job-123",
            expect.objectContaining({ flagged: true, flaggedCategories: ["spoof"] })
        );
    });

    // ── Retry / error handling (the critical branches) ──
    test("retries on ExternalServiceError (non-final attempt) → reverts DB to pending", async () => {
        const extError = new ExternalServiceError("Network timeout");
        generateCaption.mockRejectedValue(extError);

        await expect(processImageJob(makeBullJob())).rejects.toThrow(ExternalServiceError);

        expect(markPendingRetry).toHaveBeenCalledWith("db-job-123", "Network timeout", "ai-analysis");
        expect(markFailed).not.toHaveBeenCalled();
    });

    test("final-attempt ExternalServiceError → marks failed, throws UnrecoverableError (NOT pendingRetry)", async () => {
        // attemptsMade=2 means this is the 3rd attempt of 3 → final
        const job = makeBullJob({ attemptsMade: 2 });
        const extError = new ExternalServiceError("Network timeout");
        generateCaption.mockRejectedValue(extError);

        await expect(processImageJob(job)).rejects.toThrow(UnrecoverableError);

        // CRITICAL: markFailed is called, markPendingRetry is NOT called
        expect(markFailed).toHaveBeenCalledWith("db-job-123", "Network timeout", "ai-analysis", 3);
        expect(markPendingRetry).not.toHaveBeenCalled();
    });

    test("PermanentProcessingError → marks failed immediately, throws UnrecoverableError", async () => {
        const permError = new PermanentProcessingError("Invalid file format");
        generateCaption.mockRejectedValue(permError);

        await expect(processImageJob(makeBullJob())).rejects.toThrow(UnrecoverableError);

        expect(markFailed).toHaveBeenCalledWith("db-job-123", "Invalid file format", "ai-analysis", 1);
        expect(markPendingRetry).not.toHaveBeenCalled();
    });

    test("unknown error on non-final attempt → marks failed, throws UnrecoverableError", async () => {
        // Unknown errors should not retry, even if attempts remain
        const unknownError = new Error("Something unexpected");
        generateCaption.mockRejectedValue(unknownError);

        await expect(processImageJob(makeBullJob())).rejects.toThrow(UnrecoverableError);

        expect(markFailed).toHaveBeenCalledWith("db-job-123", "Something unexpected", "ai-analysis", 1);
        expect(markPendingRetry).not.toHaveBeenCalled();
    });

    test("job not found in DB → throws UnrecoverableError (PermanentProcessingError)", async () => {
        getJob.mockResolvedValue(null);

        await expect(processImageJob(makeBullJob())).rejects.toThrow(UnrecoverableError);

        expect(markFailed).toHaveBeenCalledWith(
            "db-job-123",
            expect.stringContaining("Job not found"),
            "initialization",
            1
        );
    });
});
