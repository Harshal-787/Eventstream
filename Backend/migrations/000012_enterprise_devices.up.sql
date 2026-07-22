CREATE TABLE IF NOT EXISTS floors (
    id          SERIAL PRIMARY KEY,
    building_id INT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    level       INT NOT NULL,
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
    id          SERIAL PRIMARY KEY,
    floor_id    INT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(50),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_models (
    id                 SERIAL PRIMARY KEY,
    brand              VARCHAR(100) NOT NULL,
    model_name         VARCHAR(100) NOT NULL,
    sensor_type        VARCHAR(50) NOT NULL,
    heartbeat_interval INT DEFAULT 300,
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensor_requests (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    building_id     INT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_id        INT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    room_id         INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    sensor_type     VARCHAR(50) NOT NULL,
    reason          TEXT,
    status          VARCHAR(20) DEFAULT 'pending', -- pending, fulfilled, rejected
    fulfilled_by    INT REFERENCES users(id) ON DELETE SET NULL,
    fulfilled_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add new columns to devices
ALTER TABLE devices ADD COLUMN IF NOT EXISTS hardware_id VARCHAR(100) UNIQUE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS model_id INT REFERENCES device_models(id) ON DELETE SET NULL;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS floor_id INT REFERENCES floors(id) ON DELETE SET NULL;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS room_id INT REFERENCES rooms(id) ON DELETE SET NULL;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS battery_pct INT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS signal_strength VARCHAR(20);

-- Migrate old data strings to new schema (basic fallback if needed, but we can just drop the columns)
-- We will just drop them to enforce the new schema.
ALTER TABLE devices DROP COLUMN IF EXISTS floor;
ALTER TABLE devices DROP COLUMN IF EXISTS room;

-- Seed some device models
INSERT INTO device_models (brand, model_name, sensor_type, heartbeat_interval) VALUES
    ('Honeywell', 'T9 Smart Thermostat', 'temperature', 300),
    ('Aqara', 'Motion P1', 'motion', 3600),
    ('Nest', 'Protect Smoke', 'smoke', 86400),
    ('Eve', 'Water Guard', 'water_leak', 86400),
    ('Wyze', 'Sense Contact', 'door', 3600),
    ('Sense', 'Energy Monitor', 'power', 60)
ON CONFLICT DO NOTHING;
