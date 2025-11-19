#!/bin/bash

# Clear all data from database for manual testing

echo "🗑️  Clearing Database..."
echo "========================"

PGPASSWORD=postgres psql -h localhost -U nivetharamdev -d lavoro_dev << EOF
-- Disable triggers temporarily for faster deletion
SET session_replication_role = 'replica';

-- Clear all tables in correct order (respecting foreign keys)
TRUNCATE TABLE company_locations CASCADE;
TRUNCATE TABLE user_companies CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE companies CASCADE;
TRUNCATE TABLE users CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Reset sequences for auto-increment IDs if any
-- (Not needed for this schema as we use custom ID generation)

-- Verify tables are empty
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'user_companies', COUNT(*) FROM user_companies
UNION ALL
SELECT 'company_locations', COUNT(*) FROM company_locations
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions;

EOF

echo ""
echo "✅ Database cleared successfully!"
echo ""
echo "You can now manually test:"
echo "1. Register a new user"
echo "2. Create a company"
echo "3. Select/switch company"
echo ""
