import Job from "../models/job.model.js";
import mongoose from "mongoose";

export const createJob = async (jobData) => {
    return Job.create(jobData);
};

export const updateJobStatus = async (jobId, status, additionalData = {}) => {
    return Job.findByIdAndUpdate(jobId, { status, ...additionalData }, { new: true });
};

export const getJobsByUserId = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    return Job.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
};

export const countJobsByUserId = async (userId) => {
    return Job.countDocuments({ userId });
};

export const getJobStatsByUserId = async (userId) => {
    const stats = await Job.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                processing: { $sum: { $cond: [{ $in: ["$status", ["pending", "processing"]] }, 1, 0] } },
                flagged: { $sum: { $cond: [{ $eq: ["$flagged", true] }, 1, 0] } }
            }
        }
    ]);
    return stats[0] || { total: 0, completed: 0, processing: 0, flagged: 0 };
};

export const getJobById = async (jobId, userId) => {
    return Job.findOne({ _id: jobId, userId });
};
