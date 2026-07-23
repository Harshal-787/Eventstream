DELETE FROM feature_flags WHERE feature_key = 'simulation_active' AND organization_id IS NULL;
