# Camarin AI - Media Processing Worker

A highly scalable, production-grade background worker built with **Node.js** and **BullMQ**. This is the background worker service; see the root `README.md` for the API, frontend, and full `docker-compose` setup of the Camarin AI platform.

## 🚀 Features

* **Distributed Queueing:** Leverages **BullMQ** and **Redis** for robust, multi-process concurrency, allowing you to scale horizontally.
* **Rich Image Understanding:** We actively chose **Gemini 2.5 Flash via LangChain** over Hugging Face BLIP to achieve richer, multi-field metadata (scene, confidence, objects) in a single structured JSON output.
* **Automated Content Moderation:** Integrates with **Google Cloud Vision** to evaluate SafeSearch criteria (adult, violence, racy content) and automatically flags inappropriate uploads. Notification of flagged content is implemented via structured logging and a persistent `flaggedNotifiedAt` audit timestamp (with an easy upgrade path to Slack/Email).
* **Atomic State Management:** Minimizes race conditions via strict database locking (using Mongoose `findOneAndUpdate`) to handle state rollbacks cleanly.
* **Resilient Error Handling:** Distinguishes between transient errors (network timeouts, API limits) which are automatically retried, and permanent errors (corrupt files) which fail immediately.
* **Unit Tested:** Business logic and edge cases are thoroughly validated using **Vitest** with fully mocked external dependencies.

## 🏗️ Architecture Stack

* **Runtime:** Node.js (ES Modules)
* **Job Queue:** BullMQ & Redis
* **Database:** MongoDB (Mongoose)
* **AI & Vision:** LangChain (Google GenAI provider), Google Cloud Vision API
* **Storage:** Supabase Storage
* **Testing:** Vitest

## ⚙️ Environment Configuration

Copy the `.env-sample` file to `.env` and fill in the required keys. The worker validates the presence of these keys at startup and will fail fast at startup if critical configuration is missing.

```bash
cp .env-sample .env
```

**Key Variables:**
* `MONGODB_URL`: Connection string for MongoDB.
* `REDIS_HOST`: Hostname for the Redis server.
* `SUPABASE_URL` / `SUPABASE_KEY` / `SUPABASE_BUCKET`: Supabase configurations for retrieving signed image URLs.
* `GEMINI_API_KEY`: API Key for Google Generative AI (automatically routed to LangChain).
* `GOOGLE_APPLICATION_CREDENTIALS`: Path to your Google Cloud Service Account JSON (required for Cloud Vision in production).

## 🛠️ Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Authenticate with Google Cloud:**
   If you are testing locally and don't have a service account JSON file, authenticate via the gcloud CLI:
   ```bash
   gcloud auth application-default login
   ```

3. **Start the Worker:**
   ```bash
   npm run dev
   ```

## 🐳 Docker Deployment

The worker is designed to be scaled horizontally without database collisions.

**Important:** Before running Docker, you must place your Google Cloud Service Account JSON file in the `worker/` directory and name it `gcp-key.json`. The `docker-compose` setup mounts this file directly into the container so the worker can authenticate.

> [!NOTE]
> The `docker-compose.yml` file uses hardcoded `environment:` blocks to override your `.env` values for `REDIS_HOST` and `MONGODB_URL` so that they automatically point to the bundled Docker containers. **If you want to use managed external providers (like MongoDB Atlas or Upstash Redis), you must remove these `environment` overrides from the compose file.**

```bash
# Start the full stack (API, Worker, Redis, MongoDB)
docker-compose up --build
```

You can dynamically scale the workers on the fly under heavy load:
```bash
docker-compose up --scale ai-worker=5
```

## 🧪 Testing

The worker's core processor logic is rigorously isolated and tested using Vitest to ensure robust state management and error handling.

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

## ⚠️ Known Limitations

1. **Duplicate-Delivery Collisions:** While BullMQ guarantees "at least once" delivery, in rare network failure events, a job might be delivered twice. While our atomic `markProcessing` lock mitigates the vast majority of these race conditions, highly concurrent identical deliveries could theoretically bypass the check depending on Redis latency.
2. **Notification Strategy:** Currently, flagged content triggers a structured log alert (`logger.warn`) and persists an audit timestamp (`flaggedNotifiedAt`) to the database. It does not actively push to a user-facing channel (like Slack or Email), though the architecture is explicitly designed to support that upgrade path by replacing the log command in `notification.service.js`.

## 📂 Project Structure

```text
worker/
├── config/             # Environment, Database, and Redis initialization
├── constants/          # Queue names, Job statuses
├── models/             # Mongoose schemas (Job tracking)
├── processors/         # Core business logic for handling jobs
├── queues/             # BullMQ Worker instantiations
├── schemas/            # Zod schemas for structured LLM outputs
├── services/           # External API wrappers (Gemini, Vision, Supabase)
├── utils/              # Custom errors, structured logging, and timeouts
├── __tests__/          # Vitest unit test suites
└── index.js            # Application entry point
```
