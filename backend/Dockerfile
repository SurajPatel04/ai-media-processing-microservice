FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (fallback to install if no lockfile)
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Start the API with node directly
EXPOSE 8000
CMD ["node", "src/server.js"]
