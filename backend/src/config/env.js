import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ["MONGODB_URL", "DB_NAME", "ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];

for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        console.error(`Warning: Environment variable ${varName} is not set.`);
        process.exit(1);
    }
}
const accessTokenTTL = process.env.ACCESS_TOKEN_TTL || "15m";
const refreshTokenTTL = process.env.REFRESH_TOKEN_TTL || "7d";

export const env = {
    port: Number(process.env.PORT) || 8000,
    nodeEnv: process.env.NODE_ENV,

    dbUrl: process.env.MONGODB_URL,
    dbName: process.env.DB_NAME,

    accessTokenSecret: {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: accessTokenTTL || "15m"
    },
    refreshTokenSecret: {
        secret: process.env.REFRESH_TOKEN_SECRET || 'default_refresh_token_secret',
        expiresIn: refreshTokenTTL || '7d'
    }


}