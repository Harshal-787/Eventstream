import os, re

repo_files = ['building_repo.go', 'device_repo.go', 'user_repo.go', 'alert_rule_repo.go', 'telemetry_repo.go', 'alert_repo.go']
handler_files = ['building_handler.go', 'device_handler.go', 'auth_handler.go', 'alert_handler.go', 'telemetry_handler.go', 'audit_handler.go']

# We will just write a few targeted sed commands.
