import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";

export const authenticate = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        throw new ApiError(401, "No access token provided")
    };

    const decoded = jwt.verify(token, env.accessTokenSecret.secret);
    const userId = decoded._id ?? decoded.userId ?? decoded.id;

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(401, "Invalid token. User no longer exists.");
    }

    req.user = user

    next();
})