-- =========================================================
-- Konark HRM - Schema Verification Script
-- =========================================================
-- PURPOSE: Verify that database schema was applied correctly
-- RUN THIS: In Supabase SQL Editor AFTER running database/schema.sql
-- DATE: 2026-02-11
-- =========================================================

-- ========================================
-- 1. CHECK TABLES
-- ========================================
-- Should return 7 tables: audit_logs, companies, employees, hr_sessions, salary_records, sites, users
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ========================================
-- 2. CHECK ENUMS
-- ========================================
-- Should return 3 enums: user_role, employee_status, record_status
SELECT 
  typname as enum_name,
  array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typnamespace = 'public'::regnamespace
GROUP BY typname
ORDER BY typname;

-- ========================================
-- 3. CHECK FUNCTIONS
-- ========================================
-- Should return 7+ functions including hr_login, upsert_employee, upsert_salary
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
  AND prokind = 'f'
ORDER BY proname;

-- ========================================
-- 4. CHECK TRIGGERS
-- ========================================
-- Should show triggers on multiple tables for touch_updated_at and sync_site_counts
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ========================================
-- 5. CHECK ROW LEVEL SECURITY
-- ========================================
-- All main tables should have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========================================
-- 6. CHECK RLS POLICIES
-- ========================================
-- Each table should have at least one policy (currently *_dev_all policies)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 7. CHECK INDEXES
-- ========================================
-- Verify performance indexes exist
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'  -- Exclude primary keys
ORDER BY tablename, indexname;

-- ========================================
-- 8. CHECK SEED DATA
-- ========================================
-- Should return 1 HR admin user
SELECT 
  id,
  name,
  email,
  role,
  is_active,
  created_at
FROM users 
WHERE email = 'admin@konark.com';

-- Should return 1 company record
SELECT 
  id,
  name,
  address,
  created_at
FROM companies 
LIMIT 1;

-- ========================================
-- 9. TEST hr_login FUNCTION
-- ========================================
-- Test successful login (should return user data)
SELECT * FROM hr_login('admin@konark.com', 'admin123', '127.0.0.1');

-- Verify session was created
SELECT 
  user_id,
  issued_at,
  expires_at,
  expires_at > now() as is_valid
FROM hr_sessions 
ORDER BY issued_at DESC 
LIMIT 1;

-- Check audit log for login event
SELECT 
  action,
  table_name,
  payload,
  created_at
FROM audit_logs 
WHERE action LIKE '%LOGIN%'
ORDER BY created_at DESC 
LIMIT 3;

-- ========================================
-- 10. PASSWORD HASH VERIFICATION
-- ========================================
-- Verify password is properly hashed with bcrypt
SELECT 
  email,
  length(password_hash) as hash_length,
  substring(password_hash, 1, 4) as hash_prefix,
  CASE 
    WHEN substring(password_hash, 1, 4) IN ('$2a$', '$2b$', '$2y$') 
    THEN '✓ Valid bcrypt hash'
    ELSE '✗ Invalid hash format'
  END as hash_status
FROM users
WHERE email = 'admin@konark.com';

-- ========================================
-- SUMMARY
-- ========================================
-- If all checks pass, you should see:
-- ✓ 7 tables created
-- ✓ 3 enums defined
-- ✓ 7+ functions created
-- ✓ 6+ triggers active
-- ✓ RLS enabled on all tables
-- ✓ Policies defined for each table
-- ✓ Indexes created for performance
-- ✓ 1 admin user with email admin@konark.com
-- ✓ 1 company record
-- ✓ hr_login function returns user data
-- ✓ Session token created
-- ✓ Login event in audit_logs
-- ✓ Password hashed with bcrypt
-- ========================================
