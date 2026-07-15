ALTER TABLE audit_logs ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
UPDATE audit_logs SET organization_id = (SELECT id FROM organizations LIMIT 1);
ALTER TABLE audit_logs ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN organization_id SET DEFAULT 1;

ALTER TABLE failed_events ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
UPDATE failed_events SET organization_id = (SELECT id FROM organizations LIMIT 1);
-- Usually failed events are associated with an org if device_id or token is known.
-- For now, allow NULL in failed_events if we can't map it to an org.
ALTER TABLE failed_events ALTER COLUMN organization_id SET DEFAULT 1;

-- Set defaults for the rest of the tables modified in 000023 so inserts don't fail without explicitly providing org_id
ALTER TABLE users ALTER COLUMN organization_id SET DEFAULT 1;
ALTER TABLE buildings ALTER COLUMN organization_id SET DEFAULT 1;
ALTER TABLE devices ALTER COLUMN organization_id SET DEFAULT 1;
ALTER TABLE alert_rules ALTER COLUMN organization_id SET DEFAULT 1;
ALTER TABLE alerts ALTER COLUMN organization_id SET DEFAULT 1;
ALTER TABLE telemetry ALTER COLUMN organization_id SET DEFAULT 1;
