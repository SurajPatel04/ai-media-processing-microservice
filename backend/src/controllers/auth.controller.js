import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.utils.js"
import { ApiError } from "../utils/apiError.utils.js"
import { ApiResponse } from "../utils/apiResponse.utils.js"
import { generateAuthTokens } from "../services/auth.service.js"
import { RefreshToken } from "../models/refreshToken.model.js"
import { hashToken } from "../utils/hash.utils.js"
import { env } from "../config/env.config.js"
import ms from "ms"
import { logInfo, logWarn } from "../utils/logHelper.utils.js"

export const registerUser = asyncHandler(
    async (req, res) => {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            throw new ApiError(400, "All fields are required")
        }
        const normalizedEmail = email.toLowerCase().trim()

        const existingUser = await User.findOne({ email: normalizedEmail })


        if (existingUser) {
            logWarn("Registration failed: User already exists", req, { email });
            throw new ApiError(409, "Email is already registered");
        }

        const user = await User.create({
            fullName: fullName,
            email: normalizedEmail,
            password: password
        })
        const createdUser = await User.findById(user._id)
            .select("-password");


        if (!createdUser) {
            throw new ApiError(500, "User creation failed")
        }

        logInfo("User registered successfully", req, { userId: createdUser._id, email: createdUser.email });

        return res.status(201).json(
            new ApiResponse(201, { user: createdUser }, "User registered successfully")
        );
    }
)

export const loginUser = asyncHandler(
    async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new ApiError(400, "Email and Password is required.");
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail }).select("+password");

        if (!user) {
            logWarn("Login failed: User not found", req, { email: normalizedEmail });
            throw new ApiError(404, "User not found. Please create an account first.");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            logWarn("Login failed: Invalid password", req, { email: normalizedEmail });
            throw new ApiError(401, "Invalid credentials.");
        }

        const { accessToken, refreshToken } = await generateAuthTokens(user, req);

        const loggedInUser = await User.findById(user._id)
            .select("-password");


        const cookieOptions = {
            httpOnly: true,
            secure: env.nodeEnv === "production",
            sameSite: "lax",
        };

        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: ms(env.accessTokenSecret.expiresIn),
        });
        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            path: "/api/v1/auth",
            maxAge: ms(env.refreshTokenSecret.expiresIn),
        });

        logInfo("User logged in successfully", req, { userId: user._id });

        return res.status(200).json(
            new ApiResponse(200, { user: loggedInUser }, "Login successful")
        );
    }
)

export const logoutUserFromAllDevices = asyncHandler(
    async (req, res) => {
        const userId = req.user?._id;

        if (!userId) {
            throw new ApiError(401, "Authentication required.");
        }

        const result = await RefreshToken.updateMany(
            { userId, isRevoked: false },
            { $set: { isRevoked: true } }
        );

        const cookieOptions = {
            httpOnly: true,
            secure: env.nodeEnv === "production",
            sameSite: "lax",
        };

        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", {
            ...cookieOptions,
            path: "/api/v1/auth",
        });

        logInfo("User logged out from all devices", req, { userId, revokedCount: result.modifiedCount });

        return res.status(200).json(
            new ApiResponse(200, {}, `Logged out from all devices. ${result.modifiedCount} session(s) revoked.`)
        );
    }
)

export const refreshAccessToken = asyncHandler(
    async (req, res) => {
        const rawToken = req.cookies?.refreshToken;

        if (!rawToken) {
            throw new ApiError(400, "Refresh token is required.");
        }

        const hashedToken = hashToken(rawToken);

        const existingToken = await RefreshToken.findOne({
            token: hashedToken,
            isRevoked: false,
            expireAt: { $gt: new Date() },
        });

        if (!existingToken) {
            logWarn("Token refresh failed: Invalid or expired refresh token", req, { tokenProvided: !!rawToken });
            throw new ApiError(401, "Invalid or expired refresh token.");
        }

        await RefreshToken.updateOne(
            { _id: existingToken._id },
            { $set: { isRevoked: true } }
        );

        const user = await User.findById(existingToken.userId).select("-password");

        if (!user) {
            logWarn("Token refresh failed: User not found", req, { userId: existingToken.userId });
            throw new ApiError(404, "User not found.");
        }

        if (!user.isActive) {
            logWarn("Token refresh failed: User account is disabled", req, { userId: existingToken.userId });
            throw new ApiError(403, "User account is disabled.");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAuthTokens(user, req);

        const cookieOptions = {
            httpOnly: true,
            secure: env.nodeEnv === "production",
            sameSite: "lax",
        };

        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: ms(env.accessTokenSecret.expiresIn),
        });
        res.cookie("refreshToken", newRefreshToken, {
            ...cookieOptions,
            path: "/api/v1/auth",
            maxAge: ms(env.refreshTokenSecret.expiresIn),
        });

        logInfo("Access token refreshed successfully", req, { userId: user._id });

        return res.status(200).json(
            new ApiResponse(200, {}, "Access token refreshed successfully")
        );
    }
)

