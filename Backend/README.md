# EventStream Go — Backend Setup Guide

## Overview

The backend is a **Golang** REST API built with **Gin**, connected to **PostgreSQL**. It handles authentication, alert management, device monitoring, and exposes a Swagger UI for API exploration.

---

## Prerequisites

Make sure the following are installed on your machine:

| Tool | Version | Install |
|---|---|---|
| Go | 1.21+ | https://go.dev/dl |
| PostgreSQL | 14+ | https://www.postgresql.org/download |
| swag CLI | latest | `go install github.com/swaggo/swag/cmd/swag@latest` |

---

## Project Structure

```
Backend/
├── cmd/
│   └── server/
│       └── main.go              # Entry point
├── docs/                        # Auto-generated Swagger docs
├── internal/
│   ├── config/
│   │   └── config.go            # Env config loader
│   ├── database/
│   │   └── db.go                # DB connection + auto migration runner
│   ├── handlers/
│   │   ├── auth_handler.go      # Login, Register, Me
│   │   └── alert_handler.go     # List, Get, Acknowledge, Resolve
│   ├── middleware/
│   │   └── auth_middleware.go   # JWT generation + validation
│   ├── models/
│   │   ├── user.go              # User model
│   │   └── alert.go             # Alert, AlertRule, Device, Building models
│   ├── repository/
│   │   ├── user_repo.go         # User DB queries
│   │   └── alert_repo.go        # Alert DB queries
│   └── services/                # (reserved for future business logic)
├── migrations/
│   ├── 000001_create_users_table.up.sql
│   ├── 000002_create_buildings_table.up.sql
│   ├── 000003_create_devices_table.up.sql
│   ├── 000004_create_alert_rules_table.up.sql
│   └── 000005_create_alerts_table.up.sql
├── .env
├── .env.example
├── go.mod
└── go.sum
```

---

## 1. Database Setup

### Create the database

```bash
psql -U postgres
```

```sql
CREATE DATABASE eventstream_db;
\q
```

> Migrations run **automatically** when the server starts. No manual SQL execution needed.

---

## 2. Environment Configuration

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_postgres_password
DB_NAME=eventstream_db
DB_SSLMODE=disable

JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY_HOURS=24

SERVER_PORT=8080
```

> **Never commit `.env` to version control.**

---

## 3. Install Dependencies

```bash
go mod tidy
```

---

## 4. Run the Server

```bash
go run cmd/server/main.go
```

On first run, the server will:
1. Connect to PostgreSQL
2. Auto-run all pending migrations
3. Seed default data (admin user, buildings, devices, alert rules, dummy alerts)
4. Start the HTTP server on port `8080`

Expected output:
```
connected to database
migrations applied successfully
[GIN-debug] Listening and serving HTTP on :8080
```

---

## 5. Default Seed Data

### Admin User

| Field | Value |
|---|---|
| Email | `admin@eventstream.com` |
| Password | `admin123` |
| Role | `admin` |

> Users registered via `POST /api/v1/auth/register` are automatically assigned the `user` role.

### Seeded Records

| Table | Count |
|---|---|
| Buildings | 5 |
| Devices | 10 |
| Alert Rules | 8 |
| Alerts | 10 (mix of open / acknowledged / resolved) |
| Activity Logs | 8 |

---

## 6. API Endpoints

### Base URL
```
http://localhost:8080/api/v1
```

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Register a new user (role: user) |
| `POST` | `/auth/login` | No | Login and receive JWT token |
| `GET` | `/auth/me` | Yes | Get current user profile |

### Alerts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/alerts` | Yes | List all alerts (optional `?status=open\|acknowledged\|resolved`) |
| `GET` | `/alerts/:id` | Yes | Get alert detail + activity log |
| `POST` | `/alerts/:id/acknowledge` | Yes | Acknowledge an open alert |
| `POST` | `/alerts/:id/resolve` | Yes | Resolve an alert |

### Other

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Health check |

---

## 7. Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

**Login example:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@eventstream.com", "password": "admin123"}'
```

**Response:**
```json
{
  "token": "<jwt_token>",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@eventstream.com",
    "role": "admin"
  }
}
```

---

## 8. Swagger UI

Swagger is available at:

```
http://localhost:8080/swagger/index.html
```

### To test protected endpoints in Swagger:
1. Call `POST /auth/login` and copy the token
2. Click the **Authorize** button (top right)
3. Enter `Bearer <your_token>`
4. All secured endpoints will use it automatically

### Regenerate Swagger docs after adding new endpoints:

```bash
swag init -g cmd/server/main.go -o docs
```

---

## 9. Migrations

Migrations are managed using `golang-migrate` and run automatically on server startup.

Migration files are located in `migrations/` and follow the naming convention:

```
000001_create_users_table.up.sql
000001_create_users_table.down.sql
```

### To rollback manually (if needed):

```bash
# Install migrate CLI
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Rollback last migration
migrate -path migrations -database "postgres://postgres:password@localhost:5432/eventstream_db?sslmode=disable" down 1
```

---

## 10. Build for Production

```bash
go build -o eventstream-server cmd/server/main.go
./eventstream-server
```

---

## Roles

| Role | How assigned | Access |
|---|---|---|
| `admin` | Seeded manually | Full access |
| `user` | Via `/auth/register` | Standard access |

> Role-based access control (RBAC) on specific routes will be enforced as the project grows.
