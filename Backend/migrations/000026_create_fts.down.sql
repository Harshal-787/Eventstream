DROP TRIGGER IF EXISTS tsvectorupdate ON buildings;
DROP FUNCTION IF EXISTS buildings_search_trigger;
ALTER TABLE buildings DROP COLUMN search_vector;

DROP TRIGGER IF EXISTS tsvectorupdate ON devices;
DROP FUNCTION IF EXISTS devices_search_trigger;
ALTER TABLE devices DROP COLUMN search_vector;

DROP TRIGGER IF EXISTS tsvectorupdate ON users;
DROP FUNCTION IF EXISTS users_search_trigger;
ALTER TABLE users DROP COLUMN search_vector;
