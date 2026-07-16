-- 1. Device Groups
CREATE TABLE IF NOT EXISTS device_groups (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device_group_members (
    group_id INTEGER REFERENCES device_groups(id) ON DELETE CASCADE,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, device_id)
);

-- 2. Maintenance Mode & Battery Level
ALTER TABLE devices ADD COLUMN is_maintenance BOOLEAN DEFAULT false;
ALTER TABLE devices ADD COLUMN battery_level NUMERIC(5,2);
ALTER TABLE buildings ADD COLUMN is_maintenance BOOLEAN DEFAULT false;

-- 3. AI Configurations
CREATE TABLE IF NOT EXISTS ai_configurations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    provider_type VARCHAR(50) NOT NULL,
    api_key VARCHAR(500) NOT NULL,
    model_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Advanced Alert Rules
ALTER TABLE alert_rules ADD COLUMN conditions JSONB;
ALTER TABLE alert_rules ADD COLUMN time_windows JSONB;
ALTER TABLE alert_rules ADD COLUMN suppression_window_minutes INTEGER DEFAULT 0;
ALTER TABLE alert_rules ADD COLUMN escalation_policy_id INTEGER;

-- 5. Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, feature_key)
);
