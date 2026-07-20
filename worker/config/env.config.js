import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
dotenv.config();

const requiredEnvVars = [
    "MONGODB_URL",
    "DB_NAME",
    "REDIS_HOST",
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "SUPABASE_BUCKET",
    "GEMINI_API_KEY",
];

for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        throw new Error(`CRITICAL: Required environment variable ${varName} is missing. The worker cannot start.`);
    }
}

// Google Cloud Vision auth supports two methods:
//   1. GOOGLE_APPLICATION_CREDENTIALS env var service account JSON (production)
//   2. gcloud auth application-default login ADC file (local dev)
const adcPath = join(homedir(), '.config', 'gcloud', 'application_default_credentials.json');
const hasGoogleAuth = process.env.GOOGLE_APPLICATION_CREDENTIALS || existsSync(adcPath);

if (!hasGoogleAuth) {
    throw new Error(
        'CRITICAL: No Google Cloud credentials found. Either set GOOGLE_APPLICATION_CREDENTIALS ' +
        'to a service account key path, or run "gcloud auth application-default login". ' +
        'The worker cannot start without Google Vision auth.'
    );
}

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
    geminiApiKey: process.env.GEMINI_API_KEY,
    captionModel: (process.env.CAPTION_MODEL && process.env.CAPTION_MODEL.includes('gemini')) ? process.env.CAPTION_MODEL : "gemini-2.5-flash",
};