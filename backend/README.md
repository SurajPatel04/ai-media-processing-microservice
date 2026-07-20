# Camarin AI - Backend Service

This is the API backend for the Camarin AI ImageInsight platform. It is a Node.js/Express service that handles user authentication, securely proxies file uploads to Supabase, and offloads image processing to a background worker using BullMQ.

## Architecture & Stack

- **Framework**: Express.js (Node.js)
- **Database**: MongoDB (Mongoose)
- **Queueing**: BullMQ (Redis-backed)
- **Storage**: Supabase Storage
- **Testing**: Vitest

## Features

1. **Authentication**: Stateless JWT access tokens with stateful, rotating refresh tokens (hashed, stored, and revocable in MongoDB).
2. **Job Queueing**: Decouples image uploading from AI processing for a highly resilient architecture.
3. **Security**: 
    - File validation: Magic-bytes verification rejecting spoofed files before hitting storage.
    - Rate Limiting: Distinct limiters for Auth (1-minute window) and Uploads (2-minute window).
    - CORS: Strictly limited to the authenticated `FRONTEND_URL`.

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy the `.env-sample` to `.env` and fill in the required variables:
```bash
cp .env-sample .env
```
Key requirements:
- `MONGODB_URL`: Connection string to MongoDB.
- `DB_NAME`: Database name to use in MongoDB.
- `REDIS_HOST`: Redis host address.
- `FRONTEND_URL`: Origin of the frontend application (Required for CORS and boot sequence).
- `SUPABASE_URL` / `SUPABASE_KEY` / `SUPABASE_BUCKET`: Storage credentials.
- `ACCESS_TOKEN_SECRET`: Secret key for JWT access tokens.
- `REFRESH_TOKEN_SECRET`: Secret key for JWT refresh tokens.

### 3. Run the Server
```bash
# Development mode with nodemon watch
npm run dev

# Production start
npm start
```

## Testing

The backend includes a comprehensive unit testing suite using **Vitest** testing the Auth, User, and Job controllers.

```bash
# Run tests
npm test
```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Authentication (`/api/v1/auth`)
- `POST /register`: Register a new user account.
- `POST /login`: Authenticate and receive `HttpOnly` cookies.
- `POST /refresh-token`: Renew short-lived access token using refresh token.
- `POST /logout`: Clear authentication cookies.

### User (`/api/v1/users`)
- `GET /me`: Returns the currently authenticated user profile.

### Jobs (`/api/v1/jobs`)
- `GET /`: Retrieve paginated list of the user's jobs and processing stats.
- `GET /:id`: Retrieve detailed information on a specific job.
- `POST /upload`: Upload an image (multipart/form-data) and queue it for processing.
- `POST /:id/retry`: Re-enqueue a failed job.
