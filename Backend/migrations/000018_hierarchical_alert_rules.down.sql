ALTER TABLE alert_rules
DROP COLUMN IF EXISTS target_type,
DROP COLUMN IF EXISTS target_id,
ADD COLUMN target_device_id INT NULL;
