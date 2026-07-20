import jwt from "jsonwebtoken"
import { RefreshToken } from "../models/refreshToken.model.js"
import ms from "ms";
import { env } from "../config/env.js";

export const generateAccessToken = (user) => {
    const secret = env.accessTokenSecret.secret
    const expiresIn = env.accessTokenSecret.expiresIn || "15m"

    if (!secret) {
        throw new Error("Access token secret is missing");
    }

    const payload = {
        _id: user._id,
        email: user.email,
        fullName: user.fullName
    }

    const options = {
        expiresIn: expiresIn,
    };

    return jwt.sign(payload, secret, options);

}

export const generateRefreshToken = (user) => {
    const secret = env.refreshTokenSecret.secret
    const expiresIn = env.refreshTokenSecret.expiresIn || "10d"

    if (!secret) {
        throw new Error("Refresh token secret is missing");
    }

    const payload = {
        _id: user._id
    }

    const options = {
        expiresIn: expiresIn
    }

    return jwt.sign(payload, secret, options)
}


export const generateAndRefreshToken = async (user, req) => {
    const refreshToken = generateRefreshToken(user);
    const expireAt = new Date(
        Date.now() + ms(env.refreshTokenSecret.expiresIn)
    );


    // Revoke existing refresh tokens only for the same device
    const deviceInfo = req.headers["user-agent"] || null;
    await RefreshToken.updateMany(
        { userId: user._id, deviceInfo, isRevoked: false },
        { $set: { isRevoked: true } }
    );

    await RefreshToken.create({
        token: refreshToken,
        userId: user._id,
        expireAt: expireAt,
        ...(req.headers["user-agent"] && { deviceInfo: req.headers["user-agent"] }),
        ...(req.ip && { ipAddress: req.ip }),
    });

    return refreshToken;
}



export const generateAuthTokens = async (
    user,
    req
) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateAndRefreshToken(user, req);

    return { accessToken, refreshToken };
};