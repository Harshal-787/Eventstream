CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default organization to avoid breaking existing data
INSERT INTO organizations (name, domain) VALUES ('Default Organization', 'default.com');

-- Users
ALTER TABLE users ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
UPDATE users SET organization_id = (SELECT id FROM organizations LIMIT 1);
ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;

-- Buildings
ALTER TABLE buildings ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
UPDATE buildings SET organization_id = (SELECT id FROM organizations LIMIT 1);
ALTER TABLE buildings ALTER COLUMN organization_id SET NOT NULL;

-- Devices
ALTER TABLE devices ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
UPDATE devices SET organization_id = (SELECT id FROM organizations LIMIT 1);
ALTER TABLE devices ALTER COLUMN organization_id SET NOT NULL;

-- Alert Rules
ALTER TABLE alert_rules ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
UPDATE alert_rules SET organization_id = (SELECT id FROM organizations LIMIT 1);
ALTER TABLE alert_rules ALTER COLUMN organization_id SET NOT NULL;

-- Alerts
ALTER TABLE alerts ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
UPDATE alerts SET organization_id = (SELECT id FROM organizations LIMIT 1);
ALTER TABLE alerts ALTER COLUMN organization_id SET NOT NULL;

-- Telemetry
ALTER TABLE telemetry ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
UPDATE telemetry SET organization_id = (SELECT id FROM organizations LIMIT 1);
ALTER TABLE telemetry ALTER COLUMN organization_id SET NOT NULL;
