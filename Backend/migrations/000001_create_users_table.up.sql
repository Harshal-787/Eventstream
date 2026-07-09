CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100)        NOT NULL,
    email         VARCHAR(255)        NOT NULL UNIQUE,
    password_hash VARCHAR(255)        NOT NULL,
    role          VARCHAR(50)         NOT NULL DEFAULT 'user',
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed a default admin user
-- Password: admin123 (bcrypt hash)
INSERT INTO users (name, email, password_hash, role)
VALUES (
    'Admin User',
    'admin@eventstream.com',
    '$2a$10$fm/kTuqQ2G1Hlg4jqV1wwexkn7cMaErJffZszc3ASRIdKf2OSiTiq',
    'admin'
) ON CONFLICT (email) DO NOTHING;
