ALTER TABLE users
ADD COLUMN status VARCHAR(50) DEFAULT 'pending_approval';

-- Ensure admin is active
UPDATE users SET status = 'active' WHERE role = 'admin';
