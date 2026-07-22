ALTER TABLE notification_channels DROP COLUMN IF EXISTS config;
ALTER TABLE alerts DROP COLUMN IF EXISTS escalated;
DROP TABLE IF EXISTS escalation_policies;
