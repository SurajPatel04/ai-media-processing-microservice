import mongoose from "mongoose";
import { JOB_STATUS } from "../constants/job.constants.js";

const safeSearchSchema = new mongoose.Schema(
    {
        adult: {
            type: String,
            enum: [
                "UNKNOWN",
                "VERY_UNLIKELY",
                "UNLIKELY",
                "POSSIBLE",
                "LIKELY",
                "VERY_LIKELY",
            ],
            default: "UNKNOWN",
        },
        violence: {
            type: String,
            enum: [
                "UNKNOWN",
                "VERY_UNLIKELY",
                "UNLIKELY",
                "POSSIBLE",
                "LIKELY",
                "VERY_LIKELY",
            ],
            default: "UNKNOWN",
        },
        medical: {
            type: String,
            enum: [
                "UNKNOWN",
                "VERY_UNLIKELY",
                "UNLIKELY",
                "POSSIBLE",
                "LIKELY",
                "VERY_LIKELY",
            ],
            default: "UNKNOWN",
        },
        racy: {
            type: String,
            enum: [
                "UNKNOWN",
                "VERY_UNLIKELY",
                "UNLIKELY",
                "POSSIBLE",
                "LIKELY",
                "VERY_LIKELY",
            ],
            default: "UNKNOWN",
        },
        spoof: {
            type: String,
            enum: [
                "UNKNOWN",
                "VERY_UNLIKELY",
                "UNLIKELY",
                "POSSIBLE",
                "LIKELY",
                "VERY_LIKELY",
            ],
            default: "UNKNOWN",
        },
    },
    { _id: false }
);

const jobSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        filename: {
            type: String,
            required: true,
        },

        storageKey: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: Object.values(JOB_STATUS),
            default: JOB_STATUS.PENDING,
        },

        caption: {
            type: String,
            default: null,
        },

        scene: {
            type: String,
            default: null,
        },

        dominantObjects: {
            type: [String],
            default: [],
        },

        peopleCount: {
            type: Number,
            default: 0,
        },

        isIndoor: {
            type: Boolean,
            default: null,
        },

        confidence: {
            type: Number,
            default: null,
        },

        labels: {
            type: [String],
            default: [],
        },

        labelDetails: {
            type: [{
                description: String,
                score: Number
            }],
            default: [],
        },

        detectedObjects: {
            type: [{
                name: String,
                count: Number,
                confidence: Number
            }],
            default: [],
        },

        safeSearch: {
            type: safeSearchSchema,
            default: {},
        },

        flagged: {
            type: Boolean,
            default: false,
        },

        flaggedCategories: {
            type: [String],
            default: [],
        },

        retryCount: {
            type: Number,
            default: 0,
        },

        error: {
            type: String,
            default: null,
        },

        failedStep: {
            type: String,
            default: null,
        },

        queueJobId: {
            type: String,
            default: null,
        },

        completedAt: Date,

        flaggedNotifiedAt: Date,

        metadata: {
            processingTimeMs: Number,
            captionModel: String,
            visionProvider: String,
            processedAt: Date,
        },
    },
    {
        timestamps: true,
    }
);

jobSchema.index({ userId: 1, createdAt: -1 });   // list my jobs, newest first
jobSchema.index({ userId: 1, flagged: 1 });       // my flagged jobs
jobSchema.index({ status: 1 });                    // worker/ops queries by status

export default mongoose.model("Job", jobSchema);