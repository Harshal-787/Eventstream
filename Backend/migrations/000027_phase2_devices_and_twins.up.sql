CREATE TABLE IF NOT EXISTS device_groups (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add groups, firmware, and provisioning tokens to devices
ALTER TABLE devices 
    ADD COLUMN IF NOT EXISTS device_group_id INT REFERENCES device_groups(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS firmware_version VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_communication_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS activation_status VARCHAR(50) DEFAULT 'pending', -- pending, active, inactive, disabled
    ADD COLUMN IF NOT EXISTS provisioning_token VARCHAR(255);

CREATE TABLE IF NOT EXISTS device_twins (
    device_id INT PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
    desired_state JSONB DEFAULT '{}',
    reported_state JSONB DEFAULT '{}',
    configuration JSONB DEFAULT '{}',
    health_score INT DEFAULT 100,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
