ALTER TABLE telemetry DROP COLUMN organization_id;
ALTER TABLE alerts DROP COLUMN organization_id;
ALTER TABLE alert_rules DROP COLUMN organization_id;
ALTER TABLE devices DROP COLUMN organization_id;
ALTER TABLE buildings DROP COLUMN organization_id;
ALTER TABLE users DROP COLUMN organization_id;

DROP TABLE IF EXISTS organizations;
