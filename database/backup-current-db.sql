-- =========================================================
-- Konark HRM - Database Backup Script
-- =========================================================
-- PURPOSE: Create backup tables of all current data before applying new schema
-- RUN THIS: In Supabase SQL Editor BEFORE running database/schema.sql
-- DATE: 2026-02-11
-- =========================================================

-- Create timestamped backup tables
-- These tables will preserve all current data in case rollback is needed

CREATE TABLE IF NOT EXISTS backup_20260211_companies AS 
SELECT * FROM public.companies;

CREATE TABLE IF NOT EXISTS backup_20260211_sites AS 
SELECT * FROM public.sites;

CREATE TABLE IF NOT EXISTS backup_20260211_employees AS 
SELECT * FROM public.employees;

CREATE TABLE IF NOT EXISTS backup_20260211_salary_records AS 
SELECT * FROM public.salary_records;

-- Verify backups created successfully
SELECT 
  'companies' as table_name, 
  COUNT(*) as row_count,
  'backup_20260211_companies' as backup_table
FROM backup_20260211_companies
UNION ALL
SELECT 
  'sites', 
  COUNT(*),
  'backup_20260211_sites'
FROM backup_20260211_sites
UNION ALL
SELECT 
  'employees', 
  COUNT(*),
  'backup_20260211_employees'
FROM backup_20260211_employees
UNION ALL
SELECT 
  'salary_records', 
  COUNT(*),
  'backup_20260211_salary_records'
FROM backup_20260211_salary_records;

-- =========================================================
-- ROLLBACK PROCEDURE (if needed)
-- =========================================================
-- If you need to restore from these backups, run:
-- 
-- DROP TABLE IF EXISTS companies CASCADE;
-- DROP TABLE IF EXISTS sites CASCADE;
-- DROP TABLE IF EXISTS employees CASCADE;
-- DROP TABLE IF EXISTS salary_records CASCADE;
--
-- CREATE TABLE companies AS SELECT * FROM backup_20260211_companies;
-- CREATE TABLE sites AS SELECT * FROM backup_20260211_sites;
-- CREATE TABLE employees AS SELECT * FROM backup_20260211_employees;
-- CREATE TABLE salary_records AS SELECT * FROM backup_20260211_salary_records;
--
-- Then recreate constraints and indexes as needed
-- =========================================================
