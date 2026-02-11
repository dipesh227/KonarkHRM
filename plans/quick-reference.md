# Konark HRM - Quick Reference Guide

## 📋 At a Glance

This document provides quick-reference information for deploying the database schema and integrating authentication.

---

## 🚀 Quick Start (5 Steps)

### 1. Backup Database
```sql
-- Run in Supabase SQL Editor
CREATE TABLE backup_20260211_companies AS SELECT * FROM public.companies;
CREATE TABLE backup_20260211_sites AS SELECT * FROM public.sites;
CREATE TABLE backup_20260211_employees AS SELECT * FROM public.employees;
CREATE TABLE backup_20260211_salary_records AS SELECT * FROM public.salary_records;
```

### 2. Apply Schema
1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy entire contents of [`database/schema.sql`](../database/schema.sql)
3. Paste and click **Run**
4. Wait for "Success" message

### 3. Verify Deployment
```sql
-- Should return 7 tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Should return 1 user
SELECT email FROM users WHERE email = 'admin@konark.com';
```

### 4. Update Application Code

**Create:** `services/auth.ts`
```typescript
import { supabase } from './supabase';
import { User, UserRole } from '../types';

export const authenticateHR = async (email: string, password: string) => {
  const { data, error } = await supabase.rpc('hr_login', {
    p_email: email,
    p_password: password,
    p_client_ip: null
  });

  if (error || !data || data.length === 0) {
    return { success: false, error: 'Invalid credentials' };
  }

  const user: User = {
    id: data[0].id,
    name: data[0].name,
    email: data[0].email,
    role: data[0].role as UserRole
  };

  return { success: true, user };
};
```

**Update:** `context/AuthContext.tsx` (line 41-57)
```typescript
const loginHR = async (email: string, password: string) => {
  setLoading(true);
  try {
    const result = await authenticateHR(email, password);
    
    if (result.success && result.user) {
      setUser(result.user);
      localStorage.setItem('konark_uid', result.user.id);
      return true;
    }
    return false;
  } catch (e) {
    console.error(e);
    return false;
  } finally {
    setLoading(false);
  }
};
```

### 5. Test Login
1. Start app: `npm run dev`
2. Login with: `admin@konark.com` / `admin123`
3. Verify redirect to dashboard

---

## 🔑 Default Credentials

| Type | Email | Password | UAN |
|------|-------|----------|-----|
| HR Admin | admin@konark.com | admin123 | - |
| Employee (test) | - | - | *Create via UI* |

---

## 📊 Database Schema Summary

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| [`users`](../database/schema.sql:23) | HR Admin accounts | email, password_hash, role |
| [`employees`](../database/schema.sql:42) | Worker records | uan, name, site_id, status |
| [`sites`](../database/schema.sql:31) | Work locations | code, name, employee_count |
| [`salary_records`](../database/schema.sql:56) | Payroll data | employee_id, month, net_payable |
| [`companies`](../database/schema.sql:68) | Company branding | name, logo_url, stamp_url |
| [`hr_sessions`](../database/schema.sql:87) | Session tokens | user_id, expires_at |
| [`audit_logs`](../database/schema.sql:79) | Audit trail | action, table_name, payload |

### Key Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| [`hr_login()`](../database/schema.sql:106) | Authenticate HR admin | email, password, client_ip |
| [`upsert_employee()`](../database/schema.sql:143) | Create/update employee | uan, name, mobile, site_id, etc. |
| [`upsert_salary()`](../database/schema.sql:168) | Create/update salary | employee_id, month, basic, hra, etc. |

### Automatic Triggers

- **updated_at**: Auto-updates timestamp on all table modifications
- **employee_count**: Auto-recalculates site employee count when employee added/removed/moved
- **audit_log**: Records all create/update/delete operations

---

## 🔍 Verification Queries

### Check Schema Health
```sql
-- Tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Functions exist
SELECT proname FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace;

-- Triggers active
SELECT event_object_table, trigger_name 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

### Check Data Integrity
```sql
-- Verify admin user
SELECT name, email, role FROM users;

-- Check employee counts match
SELECT s.name, s.employee_count,
       (SELECT COUNT(*) FROM employees e 
        WHERE e.site_id = s.id AND e.status != 'INACTIVE') as actual_count
FROM sites s;

-- Recent audit trail
SELECT action, table_name, created_at 
FROM audit_logs 
ORDER BY created_at DESC LIMIT 10;
```

### Check Authentication
```sql
-- Active sessions
SELECT u.name, u.email, s.issued_at, s.expires_at
FROM hr_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.revoked_at IS NULL
ORDER BY s.issued_at DESC;

-- Failed login attempts
SELECT email, failed_login_attempts, locked_until
FROM users
WHERE failed_login_attempts > 0;
```

---

## 🧪 Testing Scenarios

### Test 1: HR Login Flow
```
1. Navigate to login
2. Email: admin@konark.com, Password: admin123
3. Expected: Redirect to /hr/dashboard
4. Verify: Session token in database
```

### Test 2: Account Lockout
```
1. Try wrong password 5 times
2. Expected: "Account locked" message
3. Verify database: locked_until is set
4. Reset: UPDATE users SET locked_until = NULL WHERE email = 'admin@konark.com';
```

### Test 3: Employee Creation
```
1. Login as HR → Navigate to Employees
2. Click "Add Employee"
3. Fill form with UAN: 100000000001
4. Submit
5. Verify: SELECT * FROM employees WHERE uan = '100000000001';
6. Expected: status = 'PENDING'
```

### Test 4: Employee Count Trigger
```
1. Note current count: SELECT employee_count FROM sites WHERE id = '<SITE_ID>';
2. Approve employee: UPDATE employees SET status = 'APPROVED' WHERE uan = '100000000001';
3. Check count again: SELECT employee_count FROM sites WHERE id = '<SITE_ID>';
4. Expected: Count increased by 1
```

---

## 🚨 Troubleshooting

### Login Fails with Correct Password
```sql
-- Check password hash exists
SELECT email, length(password_hash) FROM users;

-- Reset if needed
UPDATE users 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE email = 'admin@konark.com';
```

### Connection Error
```typescript
// Check services/supabase.ts has correct credentials
const SUPABASE_URL = 'https://aqfcbijhvdbwlqrvmrxa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uYPotcTGMSAcM4BgDPN_HQ_KyE-fFYg';
```

### Function Not Found
```sql
-- Verify function exists
SELECT proname FROM pg_proc 
WHERE proname = 'hr_login' 
  AND pronamespace = 'public'::regnamespace;

-- Re-run schema if missing
```

### Site Employee Count Wrong
```sql
-- Manual refresh
SELECT refresh_site_employee_count(id) 
FROM sites 
WHERE status = 'ACTIVE';
```

---

## 🔄 Rollback Procedures

### Emergency Rollback (Complete)
```sql
-- DANGER: Drops all new tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restore from backups
CREATE TABLE companies AS SELECT * FROM backup_20260211_companies;
CREATE TABLE sites AS SELECT * FROM backup_20260211_sites;
CREATE TABLE employees AS SELECT * FROM backup_20260211_employees;
CREATE TABLE salary_records AS SELECT * FROM backup_20260211_salary_records;
```

### Reset Admin Credentials Only
```sql
UPDATE users 
SET password_hash = crypt('admin123', gen_salt('bf')),
    failed_login_attempts = 0,
    locked_until = NULL
WHERE email = 'admin@konark.com';
```

---

## 📁 File Changes Summary

### New Files to Create
- `services/auth.ts` - Authentication service
- `.env.local` - Environment variables (optional)

### Files to Modify
- `context/AuthContext.tsx` - Update loginHR function (line ~41)
- `services/mockDb.ts` - Update loginUAN to check APPROVED status (line ~77)

### Files to Review (No Changes)
- `services/supabase.ts` - Already correct
- `types.ts` - Already matches schema
- All components - No changes needed

---

## 📚 Additional Resources

- **Full Plan**: [`plans/database-deployment-plan.md`](./database-deployment-plan.md)
- **Detailed Checklist**: [`plans/implementation-checklist.md`](./implementation-checklist.md)
- **Schema File**: [`database/schema.sql`](../database/schema.sql)
- **Supabase Docs**: https://supabase.com/docs/guides/database
- **PostgreSQL Functions**: https://www.postgresql.org/docs/current/plpgsql.html

---

## ✅ Success Checklist

- [ ] Backups created
- [ ] Schema deployed without errors
- [ ] 7 tables created (users, employees, sites, salary_records, companies, hr_sessions, audit_logs)
- [ ] 7 functions created
- [ ] 6 triggers active
- [ ] Seed data inserted (1 user, 1 company)
- [ ] `services/auth.ts` created
- [ ] `context/AuthContext.tsx` updated
- [ ] HR admin login works
- [ ] Employee login with UAN works
- [ ] Dashboard loads correctly
- [ ] Audit logs capturing actions

---

**Document Version**: 1.0  
**Created**: 2026-02-11  
**For**: Konark HR & Salary Management System v1.2
