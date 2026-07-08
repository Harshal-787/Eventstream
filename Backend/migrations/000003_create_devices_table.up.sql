CREATE TABLE IF NOT EXISTS devices (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(50)  NOT NULL, -- temperature, humidity, motion, smoke, water_leak, door, power
    building_id INT          REFERENCES buildings(id) ON DELETE SET NULL,
    floor       VARCHAR(20),
    room        VARCHAR(50),
    status      VARCHAR(20)  NOT NULL DEFAULT 'online', -- online, offline
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO devices (name, type, building_id, floor, room, status) VALUES
    ('Temp Sensor A1-12',     'temperature', 1, 'Floor 1', 'Room A1', 'online'),
    ('Humidity Sensor B1-03', 'humidity',    1, 'Floor 1', 'Room B1', 'online'),
    ('Motion Sensor C2-09',   'motion',      2, 'Floor 2', 'Room C2', 'online'),
    ('Smoke Sensor B2-04',    'smoke',       2, 'Floor 2', 'Room B2', 'online'),
    ('Leak Sensor D1-02',     'water_leak',  3, 'Floor 1', 'Room D1', 'offline'),
    ('Door Sensor C3-07',     'door',        3, 'Floor 3', 'Room C3', 'online'),
    ('Power Meter A2-01',     'power',       4, 'Floor 2', 'Room A2', 'online'),
    ('Temp Sensor B3-05',     'temperature', 4, 'Floor 3', 'Room B3', 'offline'),
    ('Smoke Sensor A1-01',    'smoke',       5, 'Floor 1', 'Room A1', 'online'),
    ('Motion Sensor D2-11',   'motion',      5, 'Floor 2', 'Room D2', 'online')
ON CONFLICT DO NOTHING;
