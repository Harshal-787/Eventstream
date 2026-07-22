ALTER TABLE device_models
ADD COLUMN connectivity_protocol VARCHAR(100),
ADD COLUMN power_source VARCHAR(100),
ADD COLUMN expected_battery_life_months INT,
ADD COLUMN payload_decoder VARCHAR(100),
ADD COLUMN ip_rating VARCHAR(50),
ADD COLUMN min_operating_temp INT,
ADD COLUMN max_operating_temp INT,
ADD COLUMN documentation_url VARCHAR(500),
ADD COLUMN image_url VARCHAR(500);
