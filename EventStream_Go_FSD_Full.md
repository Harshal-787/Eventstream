# EventStream Go — FSD (Feature / System Design)

## 1. Project Overview
**EventStream Go** is a scalable backend service built in **Golang** for ingesting, processing, storing, and analyzing high-volume IoT sensor events from smart buildings.

The platform is designed to handle events such as:
- Temperature
- Humidity
- Motion
- Smoke
- Water leak
- Door access
- Power consumption

It provides:
- Real-time event ingestion
- Alert generation
- Device monitoring
- Event history and analytics
- Admin dashboard APIs
- Simulated sensor event support for MVP development

---

## 2. Right-Sized MVP Scope
For the MVP, the project will use a **simulated event stream** rather than real sensors or literal millions of events.  
This means the system will be built to reflect a realistic IoT event pipeline, but the initial implementation will use a manageable volume of generated events for development, testing, and demos.

### MVP Goals
- Manage buildings, floors, rooms, and devices
- Ingest simulated sensor events into the backend
- Store sensor event history
- Maintain latest device state
- Generate alerts from abnormal readings
- Provide dashboard and analytics APIs
- Expose an admin UI for monitoring and management

---

## 3. High-Level System Architecture
The EventStream Go project is divided into **three main clients/services**:

```bash
eventstream/
├── admin-web/        # Admin dashboard client
├── backend/          # Golang backend API + event processing service
└── simulator/        # Simulated sensor event generator
```

---

## 4. Client / Service Breakdown

## 4.1 Admin Web Client
### Purpose
The **Admin Web Client** is the frontend dashboard used by administrators and operators to monitor smart building activity, view live sensor data, manage devices, review alerts, and analyze event trends.

### Responsibilities
- User login / authentication
- Dashboard overview of buildings, devices, alerts, and event counts
- Building / floor / room management
- Device listing and monitoring
- Sensor event history viewing
- Alert monitoring and alert actions
- Alert rule management
- Analytics and trend visualization
- Optional simulator controls

### Key Screens / Modules
- Login
- Dashboard
- Buildings
- Floors / Rooms
- Devices
- Alerts
- Sensor Events
- Alert Rules
- Analytics

### Suggested Tech Stack
- React.js
- TypeScript
- React Axios
- Chart library for analytics
- Tailwind

---

## 4.2 Backend API Service
### Purpose
The **Backend Service** is the core of EventStream Go.  
It receives sensor events from the simulator, validates and stores them, updates device state, evaluates alert rules, and exposes APIs for the Admin Web dashboard.

### Responsibilities
- Authentication and authorization
- Building / floor / room / device management APIs
- Sensor event ingestion APIs
- Batch event ingestion support
- Device heartbeat tracking
- Latest device state management
- Alert rule evaluation
- Alert creation, acknowledgement, and resolution
- Dashboard summary APIs
- Event analytics APIs
- Optional real-time event broadcasting via WebSocket / SSE

### Core Modules
- Auth
- Buildings
- Floors
- Rooms
- Devices
- Sensor Event Ingestion
- Device Heartbeats
- Latest Device State
- Alert Rules
- Alerts
- Dashboard
- Analytics
- Simulator Control APIs (optional)

### Suggested Tech Stack
- Golang
- Gin / Fiber / Echo
- PostgreSQL
- Redis (optional, later stage)
- WebSocket / SSE for live dashboard updates

---

## 4.3 Sensor Simulator Client
### Purpose
The **Sensor Simulator Client** replaces physical IoT devices during the MVP phase.  
It generates simulated events such as temperature, humidity, smoke, motion, water leak, door access, and power consumption, then sends them to backend ingestion APIs.

### Responsibilities
- Simulate virtual devices
- Generate fake sensor readings at fixed intervals
- Produce both normal and abnormal values
- Send events to backend ingestion APIs
- Simulate heartbeat/online status updates
- Trigger test alert scenarios
- Populate the dashboard with live demo data

### Simulated Event Types
- Temperature
- Humidity
- Motion detection
- Smoke detection
- Water leak detection
- Door access / forced open
- Power consumption

### Suggested Tech Stack
- Golang
- HTTP client for calling ingestion APIs
- Configurable event generation intervals
- Optional scenario-based generation (normal / alert / offline)

---

## 5. End-to-End Data Flow

### High-Level Flow
1. **Simulator** generates virtual sensor events and heartbeats.
2. **Backend** receives the events through ingestion APIs.
3. **Backend** validates and stores the events in the database.
4. **Backend** updates latest device state and device last-seen status.
5. **Backend** evaluates alert rules and creates alerts if thresholds are crossed.
6. **Admin Web** fetches dashboard, device, alert, and analytics data from backend APIs.

### Simple Flow Diagram
```text
[Simulator Client]
      |
      |  Sensor Events / Heartbeats
      v
[Backend API / Event Processing Service]
      |
      |  Validate -> Store -> Update Device State -> Evaluate Alerts
      v
[PostgreSQL Database]

[Admin Web Client]
      |
      |  Fetch dashboard / device / alert / analytics APIs
      v
[Backend API / Event Processing Service]
```

---

## 6. Core Functional Modules

### 6.1 Auth Module
Handles user authentication and access control.
- Login
- JWT/session handling
- Current user profile

### 6.2 Building Management Module
Manages the smart building structure.
- Buildings
- Floors
- Rooms / zones

### 6.3 Device Management Module
Stores and manages IoT devices mapped to rooms/buildings.
- Register device
- Update device metadata
- Device listing and filtering
- Online/offline tracking
- Device details and history

### 6.4 Event Ingestion Module
Receives sensor events from the simulator or devices.
- Single event ingestion
- Batch event ingestion
- Event validation
- Event persistence
- Latest device state updates

### 6.5 Heartbeat Module
Tracks whether a device is online and when it last checked in.
- Receive heartbeats
- Update last seen time
- Maintain online/offline state

### 6.6 Alert Rules Module
Defines conditions for generating alerts.
- Threshold-based rules
- Boolean event rules
- Device or building-level rules

### 6.7 Alerts Module
Creates and manages alert lifecycle.
- Alert generation
- Alert list/detail
- Acknowledge alert
- Resolve alert
- Alert activity log

### 6.8 Dashboard Module
Provides summary and monitoring APIs for the admin UI.
- Total devices
- Online/offline devices
- Open alerts
- Recent alerts
- Recent events
- Device status summary

### 6.9 Analytics Module
Provides trend and historical analysis APIs.
- Event trends
- Temperature/humidity trends
- Power usage trends
- Alert summaries

### 6.10 Simulator Control Module (Optional)
Used to start/stop simulator runs or inspect simulator status from the UI/backend.

---

## 7. MVP Database Domains
The backend database should cover the following main domains:

- **Users**
- **Buildings**
- **Floors**
- **Rooms**
- **Devices**
- **Device Heartbeats**
- **Sensor Events**
- **Latest Device State**
- **Alert Rules**
- **Alerts**
- **Alert Activity Logs**

These domains are sufficient to support the EventStream Go MVP.

---

## 8. Initial API Scope

### Auth APIs
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Building Structure APIs
- `POST /api/v1/buildings`
- `GET /api/v1/buildings`
- `GET /api/v1/buildings/:id`
- `PATCH /api/v1/buildings/:id`

- `POST /api/v1/floors`
- `GET /api/v1/buildings/:id/floors`

- `POST /api/v1/rooms`
- `GET /api/v1/rooms`

### Device APIs
- `POST /api/v1/devices`
- `GET /api/v1/devices`
- `GET /api/v1/devices/:id`
- `PATCH /api/v1/devices/:id`
- `GET /api/v1/devices/:id/events`
- `GET /api/v1/devices/:id/heartbeats`

### Ingestion APIs
- `POST /api/v1/ingest/events`
- `POST /api/v1/ingest/events/batch`
- `POST /api/v1/ingest/heartbeat`

### Alert Rule APIs
- `POST /api/v1/alert-rules`
- `GET /api/v1/alert-rules`
- `PATCH /api/v1/alert-rules/:id`

### Alert APIs
- `GET /api/v1/alerts`
- `GET /api/v1/alerts/:id`
- `POST /api/v1/alerts/:id/acknowledge`
- `POST /api/v1/alerts/:id/resolve`

### Dashboard / Analytics APIs
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/recent-events`
- `GET /api/v1/dashboard/recent-alerts`
- `GET /api/v1/dashboard/device-status`
- `GET /api/v1/dashboard/event-trends`

---

## 9. Suggested Build Phases

### Phase 1 — Foundation
- Auth
- Buildings
- Floors
- Rooms
- Devices

### Phase 2 — Event Pipeline
- Sensor event ingestion
- Batch ingestion
- Device latest state
- Device heartbeat tracking

### Phase 3 — Alerting
- Alert rules
- Alert creation
- Alert acknowledgement / resolution

### Phase 4 — Dashboard & Analytics
- Dashboard summary
- Recent events / recent alerts
- Device monitoring
- Event trend APIs

### Phase 5 — Simulator
- Seed virtual devices
- Generate periodic fake events
- Inject abnormal readings for alert testing

---

## 10. Recommended Tech Stack Summary

### Backend
- Golang
- Gin / Fiber / Echo
- PostgreSQL
- Redis (optional)
- WebSocket / SSE (optional)

### Frontend
- React.js
- TypeScript
- Axios / React Query
- Chart library

### Simulator
- Golang
- HTTP client
- Config-driven event generator

---

## 11. Summary
EventStream Go is a **three-part IoT monitoring MVP** made up of:
1. **Admin Web Client** — for monitoring, management, alerts, and analytics
2. **Backend API Service** — for event ingestion, processing, alerting, and data APIs
3. **Sensor Simulator Client** — for generating virtual sensor events during MVP development

This structure allows the team to build and demo the full event pipeline without waiting for physical sensors, while still keeping the architecture aligned with a real smart-building IoT platform.
