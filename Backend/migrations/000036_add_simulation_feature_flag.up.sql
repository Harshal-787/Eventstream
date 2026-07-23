DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM feature_flags WHERE feature_key = 'simulation_active' AND organization_id IS NULL) THEN
        INSERT INTO feature_flags (organization_id, feature_key, is_enabled) VALUES (NULL, 'simulation_active', true);
    END IF;
END $$;
