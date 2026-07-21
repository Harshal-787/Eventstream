DROP TABLE IF EXISTS feature_flags;

ALTER TABLE alert_rules DROP COLUMN IF EXISTS escalation_policy_id;
ALTER TABLE alert_rules DROP COLUMN IF EXISTS suppression_window_minutes;
ALTER TABLE alert_rules DROP COLUMN IF EXISTS time_windows;
ALTER TABLE alert_rules DROP COLUMN IF EXISTS conditions;

DROP TABLE IF EXISTS ai_configurations;

ALTER TABLE buildings DROP COLUMN IF EXISTS is_maintenance;
ALTER TABLE devices DROP COLUMN IF EXISTS battery_level;
ALTER TABLE devices DROP COLUMN IF EXISTS is_maintenance;

DROP TABLE IF EXISTS device_group_members;
DROP TABLE IF EXISTS device_groups;
