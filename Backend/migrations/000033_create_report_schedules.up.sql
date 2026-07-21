CREATE TABLE IF NOT EXISTS report_schedules (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_type VARCHAR(100) NOT NULL,
    format VARCHAR(20) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    recipients JSONB NOT NULL DEFAULT '[]',
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_org ON report_schedules(organization_id);
