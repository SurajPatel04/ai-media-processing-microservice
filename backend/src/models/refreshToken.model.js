import mongoose, { Schema } from "mongoose";
import { User } from "./user.model.js"
import { hashToken } from "../utils/hash.utils.js"

const refreshTokenSchema = new Schema({
    token: {
        type: String,
        required: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: User,
        index: true,
        required: true,
    },
    deviceInfo: {
        type: String,
        default: null,
    },
    ipAddress: {
        type: String,
        default: null
    },
    expireAt: {
        type: Date,
        required: true
    },
    isRevoked: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });


refreshTokenSchema.pre("save", async function (next) {
    if (!this.isModified("token")) {
        return;
    }
    this.token = hashToken(this.token);
})

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);