# EventStream — Enterprise IoT & Smart Building Platform

EventStream is a comprehensive, real-time IoT monitoring platform designed for smart building management. It features a scalable multi-tenant architecture, live sensor telemetry ingestion via SSE, complex digital twin management, full-text search, and autonomous AI anomaly diagnostics.

The project is split into two primary components:

## 🌐 1. Frontend (React + Vite)
The client-facing application provides interactive dashboards, live indoor building maps, real-time telemetry graphs, and a configuration center for managing organizations and devices.

- **Stack**: React 19, Vite, Tailwind CSS v4, Zustand, React Router, Recharts, Leaflet.
- **Location**: [`./Frontend`](./Frontend)
- **Documentation**: Read the [Frontend Setup Guide](./Frontend/README.md)

## ⚙️ 2. Backend (Golang)
The high-performance API acts as the central nervous system. It processes incoming telemetry, evaluates alert rule thresholds, orchestrates escalation policies, generates automated PDF/CSV reports, and synchronizes with AI services.

- **Stack**: Go 1.21+, Gin Framework, PostgreSQL, golang-migrate, Swagger.
- **Location**: [`./Backend`](./Backend)
- **Documentation**: Read the [Backend API Guide](./Backend/README.md)

---

## 🚀 Quick Start

Ensure you have **Node.js**, **Go 1.21+**, and **PostgreSQL** installed.

1. **Start the Database**
   ```bash
   psql -U postgres -c "CREATE DATABASE eventstream_db;"
   ```

2. **Boot the Backend**
   ```bash
   cd Backend
   cp .env.example .env  # Edit with your DB credentials
   go run cmd/server/main.go
   # The server will automatically run migrations and seed data on port 8080.
   ```

3. **Boot the Frontend**
   ```bash
   cd Frontend
   npm install
   npm run dev
   # The application will be available on http://localhost:5173.
   ```

## 🔒 Default Credentials
After the initial seed, you can log in as the default organization admin:
- **Email**: `admin@eventstream.com`
- **Password**: `admin123`
