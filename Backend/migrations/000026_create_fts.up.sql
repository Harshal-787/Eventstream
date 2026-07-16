-- Buildings FTS
ALTER TABLE buildings ADD COLUMN search_vector tsvector;
UPDATE buildings SET search_vector = 
    setweight(to_tsvector('english', coalesce(name, '')), 'A') || 
    setweight(to_tsvector('english', coalesce(address, '')), 'B') || 
    setweight(to_tsvector('english', coalesce(city, '')), 'B');
CREATE INDEX idx_buildings_search ON buildings USING GIN(search_vector);

-- Create trigger to automatically update search_vector for buildings
CREATE OR REPLACE FUNCTION buildings_search_trigger() RETURNS trigger AS $$
begin
  new.search_vector :=
     setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
     setweight(to_tsvector('english', coalesce(new.address, '')), 'B') ||
     setweight(to_tsvector('english', coalesce(new.city, '')), 'B');
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON buildings FOR EACH ROW EXECUTE PROCEDURE buildings_search_trigger();

-- Devices FTS
ALTER TABLE devices ADD COLUMN search_vector tsvector;
UPDATE devices SET search_vector = 
    setweight(to_tsvector('english', coalesce(name, '')), 'A') || 
    setweight(to_tsvector('english', coalesce(type, '')), 'B') || 
    setweight(to_tsvector('english', coalesce(hardware_id, '')), 'A');
CREATE INDEX idx_devices_search ON devices USING GIN(search_vector);

CREATE OR REPLACE FUNCTION devices_search_trigger() RETURNS trigger AS $$
begin
  new.search_vector :=
     setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
     setweight(to_tsvector('english', coalesce(new.type, '')), 'B') ||
     setweight(to_tsvector('english', coalesce(new.hardware_id, '')), 'A');
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON devices FOR EACH ROW EXECUTE PROCEDURE devices_search_trigger();

-- Users FTS
ALTER TABLE users ADD COLUMN search_vector tsvector;
UPDATE users SET search_vector = 
    setweight(to_tsvector('english', coalesce(name, '')), 'A') || 
    setweight(to_tsvector('english', coalesce(email, '')), 'A');
CREATE INDEX idx_users_search ON users USING GIN(search_vector);

CREATE OR REPLACE FUNCTION users_search_trigger() RETURNS trigger AS $$
begin
  new.search_vector :=
     setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
     setweight(to_tsvector('english', coalesce(new.email, '')), 'A');
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON users FOR EACH ROW EXECUTE PROCEDURE users_search_trigger();
