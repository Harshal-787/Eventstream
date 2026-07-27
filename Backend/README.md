# EventStream Go — Backend API

The backend for **EventStream** is an enterprise-grade REST API built with **Golang** and **Gin**, persisting data securely to **PostgreSQL**. It operates as the core nervous system for the IoT platform, handling massive telemetry ingestion, device twin management, multi-tenant organizations, alerting, and autonomous AI integrations.

---

## 🚀 Key Capabilities

- **Real-Time Telemetry & WebSockets (SSE)**: Streams live sensor data directly to connected clients via Server-Sent Events (`/api/v1/stream`), bypassing the need for aggressive HTTP polling.
- **Enterprise Multi-Tenancy**: Data is fully isolated across Organizations. Role-Based Access Control (RBAC) securely gates actions between system `admin` users and standard `user` accounts.
- **Hardware Digital Twins**: Synchronizes physical IoT states using Azure IoT-style device twins (Desired vs. Reported states).
- **Automated Alerting & Escalation**: An integrated Alert Engine evaluates telemetry against complex Alert Rules. Unresolved critical alerts are automatically processed by an Escalation Background Worker.
- **AI Diagnostics**: Integrates with LLMs to automatically diagnose system anomalies, generate executive health reports, and explain hardware failures.
- **Automated Reporting**: A background scheduler generates and emails PDF/CSV reports based on configurable crons.
- **Full Text Search**: Employs PostgreSQL's native `tsvector` features to provide lightning-fast global search across devices, buildings, and users.
- **Auto-Migrations**: The system manages 36+ database schemas seamlessly at startup utilizing `golang-migrate`.

---

## 🛠️ Prerequisites

| Tool | Version | Documentation |
|---|---|---|
| Go | 1.21+ | [Install Go](https://go.dev/dl) |
| PostgreSQL | 14+ | [Install Postgres](https://www.postgresql.org/download) |
| swag CLI | latest | `go install github.com/swaggo/swag/cmd/swag@latest` |

---

## 🔧 Getting Started

### 1. Database Setup

Ensure PostgreSQL is running. Create the database:

```bash
psql -U postgres -c "CREATE DATABASE eventstream_db;"
```

> **Note:** Do not run SQL schema scripts manually. The Go application executes all necessary `up.sql` migrations automatically on boot.

### 2. Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Ensure your `.env` contains the correct database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_postgres_password
DB_NAME=eventstream_db
DB_SSLMODE=disable

JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRY_HOURS=24
SERVER_PORT=8080
```

### 3. Run the Server

```bash
go mod tidy
go run cmd/server/main.go
```

On startup, the server automatically:
1. Connects to the PostgreSQL instance.
2. Applies any pending database migrations.
3. Seeds essential default data (Admin, Buildings, Devices, Alert Rules).
4. Spins up background workers (Heartbeat Monitor, Escalation Engine, Report Scheduler, MQTT Ingest).
5. Serves HTTP requests on port `8080`.

---

## 📡 API Documentation (Swagger)

The API is fully documented using Swagger UI.

1. Ensure the server is running.
2. Navigate to: [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)

**Testing Secured Endpoints in Swagger:**
1. Call `POST /api/v1/auth/login` using the default admin credentials (`admin@eventstream.com` / `admin123`).
2. Copy the resulting token.
3. Click the green **Authorize** button at the top right of the Swagger interface.
4. Enter `Bearer <your_token>` and save.

If you modify any Go handler comments, regenerate the Swagger docs via:
```bash
swag init -g cmd/server/main.go -o docs
```

---

## 🧪 Built-In IoT Simulator

To facilitate testing without physical hardware, the backend includes a robust **Simulator Engine**.

When the simulation feature flag is globally enabled via the frontend settings panel, the backend will artificially generate randomized temperature, humidity, and status telemetry for all registered devices on a ticker loop. This allows you to immediately test SSE streaming, alert thresholds, and dashboard visualizations.

---

## 📁 Architecture Overview

```
Backend/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── docs/                        # Auto-generated Swagger documentation
├── internal/
│   ├── config/                  # Environment variables and setups
│   ├── database/                # DB connectivity and migration engine
│   ├── events/                  # Server-Sent Events (SSE) hub
│   ├── handlers/                # HTTP route controllers (Gin)
│   ├── middleware/              # Auth, Logging, Rate Limiting
│   ├── models/                  # Domain entity structs
│   ├── repository/              # PostgreSQL data access layer
│   ├── services/                # Core business logic & AI orchestration
│   ├── simulator/               # IoT telemetry mocking engine
│   └── workers/                 # Background chron-jobs (MQTT, Escalation)
├── migrations/                  # Versioned up/down SQL schema definitions
├── .env                         # Local configuration
└── go.mod                       # Go module dependencies
```
