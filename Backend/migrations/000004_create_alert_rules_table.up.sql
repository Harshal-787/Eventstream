CREATE TABLE IF NOT EXISTS alert_rules (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    device_type  VARCHAR(50)  NOT NULL,
    metric       VARCHAR(50)  NOT NULL,
    operator     VARCHAR(10)  NOT NULL, -- gt, lt, gte, lte, eq
    threshold    NUMERIC,
    bool_value   BOOLEAN,
    severity     VARCHAR(20)  NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO alert_rules (name, device_type, metric, operator, threshold, severity) VALUES
    ('High Temperature',    'temperature', 'value', 'gt',  35,   'high'),
    ('Critical Temperature','temperature', 'value', 'gt',  40,   'critical'),
    ('High Humidity',       'humidity',    'value', 'gt',  80,   'medium'),
    ('High Power Usage',    'power',       'value', 'gt',  5,    'low'),
    ('Critical Power Usage','power',       'value', 'gt',  10,   'high')
ON CONFLICT DO NOTHING;

INSERT INTO alert_rules (name, device_type, metric, operator, bool_value, severity) VALUES
    ('Smoke Detected',  'smoke',      'detected', 'eq', TRUE, 'critical'),
    ('Water Leak',      'water_leak', 'detected', 'eq', TRUE, 'high'),
    ('Door Forced Open','door',       'forced',   'eq', TRUE, 'high')
ON CONFLICT DO NOTHING;
