CREATE TABLE IF NOT EXISTS buildings (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    address    TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO buildings (name, address) VALUES
    ('HQ Tower',       '123 Main St'),
    ('Warehouse A',    '456 Industrial Rd'),
    ('Warehouse B',    '457 Industrial Rd'),
    ('Research Block', '789 Science Ave'),
    ('Data Center',    '321 Server Ln')
ON CONFLICT DO NOTHING;
