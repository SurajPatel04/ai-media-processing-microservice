# Camarin AI - Frontend

This is the React + Vite frontend for the Camarin AI ImageInsight platform. It provides a clean, brutalist-inspired dashboard to upload images, view processing status in real-time, and download generated PDF reports.

## Architecture & Stack
- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router
- **State/Requests:** Axios & custom React hooks
- **Animations:** Framer Motion
- **Icons:** Tabler Icons

## Local Development

```bash
# Install dependencies
npm install

# Create environment file
cp .env-sample .env

# Start development server
npm run dev
```

## Docker & NGINX
In production (via `docker-compose`), this frontend is built into a static bundle and served via an NGINX reverse proxy. The NGINX configuration (`nginx.conf`) handles serving the static assets and seamlessly proxying `/api` requests to the backend service.
