FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (fallback to install if no lockfile)
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Start the worker with node directly so SIGTERM works for graceful shutdown
CMD ["node", "index.js"]
