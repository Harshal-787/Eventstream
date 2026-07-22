DROP TABLE IF EXISTS device_twins;

ALTER TABLE devices 
    DROP COLUMN IF EXISTS device_group_id,
    DROP COLUMN IF EXISTS firmware_version,
    DROP COLUMN IF EXISTS last_communication_at,
    DROP COLUMN IF EXISTS activation_status,
    DROP COLUMN IF EXISTS provisioning_token;

DROP TABLE IF EXISTS device_groups;
