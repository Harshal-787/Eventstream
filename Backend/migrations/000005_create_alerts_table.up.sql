CREATE TABLE IF NOT EXISTS alerts (
    id             SERIAL PRIMARY KEY,
    device_id      INT         REFERENCES devices(id) ON DELETE SET NULL,
    alert_rule_id  INT         REFERENCES alert_rules(id) ON DELETE SET NULL,
    type           VARCHAR(100) NOT NULL,
    severity       VARCHAR(20)  NOT NULL DEFAULT 'medium',
    status         VARCHAR(20)  NOT NULL DEFAULT 'open', -- open, acknowledged, resolved
    message        TEXT,
    triggered_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at    TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS alert_activity_logs (
    id         SERIAL PRIMARY KEY,
    alert_id   INT         NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    user_id    INT         REFERENCES users(id) ON DELETE SET NULL,
    action     VARCHAR(50) NOT NULL, -- acknowledged, resolved
    note       TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed dummy alerts
INSERT INTO alerts (device_id, alert_rule_id, type, severity, status, message, triggered_at) VALUES
    (4, 6, 'Smoke Detected',    'critical', 'open',         'Smoke detected in Room B2, Floor 2',          NOW() - INTERVAL '2 minutes'),
    (1, 1, 'High Temperature',  'high',     'open',         'Temperature reached 38.4°C in Room A1',       NOW() - INTERVAL '11 minutes'),
    (6, 8, 'Door Forced Open',  'high',     'open',         'Door sensor triggered forced open in Room C3', NOW() - INTERVAL '28 minutes'),
    (5, 7, 'Water Leak',        'high',     'acknowledged', 'Water leak detected in Room D1',              NOW() - INTERVAL '1 hour'),
    (7, 4, 'High Power Usage',  'low',      'acknowledged', 'Power consumption at 4.7kW in Room A2',       NOW() - INTERVAL '2 hours'),
    (2, 3, 'High Humidity',     'medium',   'resolved',     'Humidity reached 82% in Room B1',             NOW() - INTERVAL '3 hours'),
    (8, 2, 'Critical Temperature','critical','resolved',    'Temperature reached 41.2°C in Room B3',       NOW() - INTERVAL '5 hours'),
    (9, 6, 'Smoke Detected',    'critical', 'resolved',     'Smoke detected in Room A1, Data Center',      NOW() - INTERVAL '6 hours'),
    (3, 3, 'High Humidity',     'medium',   'open',         'Humidity reached 79% in Room C2',             NOW() - INTERVAL '15 minutes'),
    (10, NULL, 'Motion Detected','low',     'open',         'Unusual motion detected after hours in Room D2', NOW() - INTERVAL '45 minutes');

-- Seed activity logs for acknowledged/resolved alerts
INSERT INTO alert_activity_logs (alert_id, user_id, action, note, created_at) VALUES
    (4, 1, 'acknowledged', 'Maintenance team dispatched', NOW() - INTERVAL '50 minutes'),
    (5, 1, 'acknowledged', 'Under investigation',         NOW() - INTERVAL '1 hour 50 minutes'),
    (6, 1, 'acknowledged', 'Checked humidity levels',     NOW() - INTERVAL '2 hours 50 minutes'),
    (6, 1, 'resolved',     'HVAC adjusted, humidity normalized', NOW() - INTERVAL '2 hours'),
    (7, 1, 'acknowledged', 'Sensor recalibrated',         NOW() - INTERVAL '4 hours 30 minutes'),
    (7, 1, 'resolved',     'Device replaced',             NOW() - INTERVAL '4 hours'),
    (8, 1, 'acknowledged', 'Fire team alerted',           NOW() - INTERVAL '5 hours 45 minutes'),
    (8, 1, 'resolved',     'False alarm, sensor cleaned', NOW() - INTERVAL '5 hours 30 minutes');
