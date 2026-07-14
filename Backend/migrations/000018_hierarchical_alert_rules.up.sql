ALTER TABLE alert_rules
DROP COLUMN IF EXISTS target_device_id,
ADD COLUMN target_type VARCHAR(50) DEFAULT 'global',
ADD COLUMN target_id INT NULL;
