import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
    "MONGODB_URL", 
    "DB_NAME", 
    "ACCESS_TOKEN_SECRET", 
    "REFRESH_TOKEN_SECRET", 
    "REDIS_HOST",
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "SUPABASE_BUCKET"
];

for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        throw new Error(`CRITICAL: Required environment variable ${varName} is missing. The server cannot start.`);
    }
}
const accessTokenTTL = process.env.ACCESS_TOKEN_TTL || "15m";
const refreshTokenTTL = process.env.REFRESH_TOKEN_TTL || "7d";

export const env = {
    port: Number(process.env.PORT) || 8000,
    nodeEnv: process.env.NODE_ENV,

    dbUrl: process.env.MONGODB_URL,
    dbName: process.env.DB_NAME,
    redisHost: process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT || 6379,

    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
    supabaseBucket: process.env.SUPABASE_BUCKET,

    accessTokenSecret: {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: accessTokenTTL || "15m"
    },
    refreshTokenSecret: {
        secret: process.env.REFRESH_TOKEN_SECRET || 'default_refresh_token_secret',
        expiresIn: refreshTokenTTL || '7d'
    }


}