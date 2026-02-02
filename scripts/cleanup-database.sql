-- ========================================================
-- SAFE DATABASE CLEANUP SCRIPT FOR SUPABASE
-- ========================================================
-- This script safely deletes all data while respecting
-- foreign key constraints. Run in order from top to bottom.
-- 
-- ⚠️  WARNING: This will DELETE ALL DATA permanently!
-- ⚠️  Make sure to backup first if needed.
-- ========================================================

-- Step 1: Create a backup point (optional - copy data first)
-- You can export data via Supabase Dashboard > Table Editor > Export

-- ========================================================
-- STEP 2: Delete dependent/child tables first (leaf nodes)
-- ========================================================

-- Session and audit data
TRUNCATE TABLE sessions CASCADE;

-- GDPR and consent data
TRUNCATE TABLE "UserConsent" CASCADE;
TRUNCATE TABLE "AuditLog" CASCADE;

-- Quality-related child tables
TRUNCATE TABLE defect_comments CASCADE;
TRUNCATE TABLE quality_metrics CASCADE;
TRUNCATE TABLE quality_defects CASCADE;
TRUNCATE TABLE quality_checkpoints CASCADE;
TRUNCATE TABLE quality_inspections CASCADE;
TRUNCATE TABLE inspection_metrics CASCADE;
TRUNCATE TABLE inspection_templates CASCADE;

-- Stock and inventory child tables
TRUNCATE TABLE stock_movements CASCADE;
TRUNCATE TABLE stock_reservations CASCADE;
TRUNCATE TABLE stock_alerts CASCADE;
TRUNCATE TABLE stock_adjustments CASCADE;
TRUNCATE TABLE location_inventory CASCADE;

-- Machine-related child tables
TRUNCATE TABLE breakdown_reports CASCADE;
TRUNCATE TABLE maintenance_records CASCADE;
TRUNCATE TABLE maintenance_schedules CASCADE;
TRUNCATE TABLE machine_status_history CASCADE;
TRUNCATE TABLE machine_assignments CASCADE;

-- Order and financial child tables
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE invoice_items CASCADE;
TRUNCATE TABLE bill_items CASCADE;
TRUNCATE TABLE purchase_order_items CASCADE;
TRUNCATE TABLE payment_transactions CASCADE;
TRUNCATE TABLE financial_documents CASCADE;

-- Product-related child tables
TRUNCATE TABLE product_pricing CASCADE;

-- ========================================================
-- STEP 3: Delete mid-level tables
-- ========================================================

-- Orders and documents
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE bills CASCADE;
TRUNCATE TABLE purchase_orders CASCADE;

-- Manufacturing tables
TRUNCATE TABLE yarn_manufacturing CASCADE;
TRUNCATE TABLE fabric_production CASCADE;
TRUNCATE TABLE dyeing_finishing CASCADE;
TRUNCATE TABLE garment_manufacturing CASCADE;
TRUNCATE TABLE design_patterns CASCADE;

-- Compliance
TRUNCATE TABLE compliance_reports CASCADE;

-- Machines
TRUNCATE TABLE machines CASCADE;

-- Customers and suppliers
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE suppliers CASCADE;

-- Products and categories
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE product_categories CASCADE;

-- ========================================================
-- STEP 4: Delete company-level tables
-- ========================================================

-- Locations (must be before companies)
TRUNCATE TABLE company_locations CASCADE;

-- Subscriptions
TRUNCATE TABLE subscriptions CASCADE;
TRUNCATE TABLE subscription_plans CASCADE;

-- User-company relationships
TRUNCATE TABLE user_invitations CASCADE;
TRUNCATE TABLE user_companies CASCADE;

-- ========================================================
-- STEP 5: Delete top-level tables
-- ========================================================

-- Companies (this will cascade to most related data)
TRUNCATE TABLE companies CASCADE;

-- Users (keep this last - you may want to keep the admin user)
-- TRUNCATE TABLE users CASCADE;  -- UNCOMMENT IF YOU WANT TO DELETE ALL USERS

-- ========================================================
-- ALTERNATIVE: Keep one admin user for testing
-- ========================================================
-- If you want to keep your test user (nivi@gm.com), run this instead:

-- Delete all users EXCEPT the test user
-- DELETE FROM users WHERE email != 'nivi@gm.com';

-- ========================================================
-- VERIFICATION QUERIES
-- ========================================================

-- Check remaining row counts
SELECT 'companies' as table_name, COUNT(*) as row_count FROM companies
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices;
