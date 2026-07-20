import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        index: true,
        validate: {
            validator: (v) => validator.isEmail(v),
            message: "Invalid email format",
        }
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

const SALT_ROUNDS = 10;

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return;
    };
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

export const User = mongoose.model("User", userSchema);