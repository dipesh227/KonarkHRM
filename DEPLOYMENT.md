# 🚀 Konark HRM - Schema Deployment Instructions

## ⚠️ IMPORTANT: Read Before Starting

This deployment will **DROP and RECREATE** all database tables. **Data loss will occur** if backups are not created first.

**Estimated Time**: 15-20 minutes  
**Database Downtime**: ~2 minutes during schema application

---

## 📋 Pre-Deployment Checklist

- [ ] All team members notified of deployment window
- [ ] Application temporarily taken offline (or maintenance mode enabled)
- [ ] Supabase dashboard access confirmed
- [ ] SQL Editor tested and working

---

## 🔧 Deployment Steps

### Step 1: Create Database Backup (MANDATORY)

1. Open **Supabase Dashboard**: https://supabase.com
2. Navigate to your project: `aqfcbijhvdbwlqrvmrxa`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open [`database/backup-current-db.sql`](database/backup-current-db.sql) in your code editor
6. **Copy the entire file** contents
7. **Paste** into Supabase SQL Editor
8. Click **Run** (bottom right)
9. Wait for completion
10. **Verify** the results show row counts for all backed-up tables

**Expected Output:**
```
table_name       | row_count | backup_table
-----------------|-----------|---------------------------
companies        | 1         | backup_20260211_companies
sites            | N         | backup_20260211_sites
employees        | N         | backup_20260211_employees
salary_records   | N         | backup_20260211_salary_records
```

✅ **Checkpoint**: Backups created successfully

---

### Step 2: Apply New Database Schema

1. Still in **Supabase SQL Editor**, click **New Query** (create a fresh query tab)
2. Open [`database/schema.sql`](database/schema.sql) in your code editor
3. **Copy the ENTIRE file** (all 221 lines)
4. **Paste** into Supabase SQL Editor
5. **Review** the first few lines to ensure it starts with:
   ```sql
   -- Konark HR & Salary Management System (Standard Edition v1.2)
   -- WARNING: This script DROPS existing app DB objects before recreating from scratch.
   
   create extension if not exists "pgcrypto";
   ```
6. Click **Run** button
7. Wait for completion (this will take 30-60 seconds)
8. Check for any **red error messages** in the results panel
9. If errors appear, **STOP** and report them immediately

**Expected Output:**
```
Success. No rows returned.
```
Or multiple success messages for each CREATE statement.

✅ **Checkpoint**: Schema applied without errors

---

### Step 3: Verify Database Deployment

1. Click **New Query** in SQL Editor
2. Open [`database/verify-schema.sql`](database/verify-schema.sql)
3. **Copy the entire file** contents
4. **Paste** into Supabase SQL Editor
5. Click **Run**
6. Review all results sections

**Expected Results:**

**Section 1 - Tables**: Should show 7 tables
```
audit_logs
companies
employees
hr_sessions
salary_records
sites
users
```

**Section 2 - Enums**: Should show 3 enums
```
employee_status: {PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE}
record_status: {ACTIVE, INACTIVE}
user_role: {HR_ADMIN, SITE_INCHARGE, EMPLOYEE}
```

**Section 3 - Functions**: Should show 7 functions including:
- `hr_login`
- `upsert_employee`
- `upsert_salary`
- `write_audit_log`
- `touch_updated_at`
- `refresh_site_employee_count`
- `sync_site_counts_from_employee_change`

**Section 8 - Seed Data**: Should show 1 user
```
name: HR Admin
email: admin@konark.com
role: HR_ADMIN
is_active: true
```

**Section 9 - Test Login**: Should return user data
```
id: <uuid>
name: HR Admin
email: admin@konark.com
role: HR_ADMIN
```

**Section 10 - Password Hash**: Should show
```
hash_length: 60
hash_prefix: $2a$ (or $2b$)
hash_status: ✓ Valid bcrypt hash
```

✅ **Checkpoint**: All verification checks passed

---

### Step 4: Update Application Code

**The following files have already been created/updated:**

1. ✅ [`services/auth.ts`](services/auth.ts) - New authentication service
2. ✅ [`context/AuthContext.tsx`](context/AuthContext.tsx) - Updated to use database auth
3. ✅ [`.env.local`](.env.local) - Environment configuration

**No additional code changes needed.**

---

### Step 5: Test Application Locally

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Test HR Admin Login**:
   - Open browser to http://localhost:5173
   - Select **"HR Admin"** tab
   - Enter credentials:
     - Email: `admin@konark.com`
     - Password: `admin123`
   - Click **"Login as Admin"**
   - **Expected**: Redirect to `/hr/dashboard`

4. **Verify Dashboard Loads**:
   - Check that statistics cards display
   - Verify no console errors
   - Check browser DevTools → Application → Local Storage → `konark_uid` exists

5. **Test Failed Login** (Account Lockout):
   - Logout
   - Try login with wrong password **5 times**
   - **Expected**: After 5th attempt, see "account locked" message
   - **Verify in database**:
     ```sql
     SELECT email, failed_login_attempts, locked_until 
     FROM users WHERE email = 'admin@konark.com';
     ```
   - **Reset if needed**:
     ```sql
     UPDATE users 
     SET failed_login_attempts = 0, locked_until = NULL 
     WHERE email = 'admin@konark.com';
     ```

✅ **Checkpoint**: Application authentication working correctly

---

### Step 6: Test Employee Creation & Data Operations

1. **Login as HR Admin**
2. Navigate to **"Employee Directory"** or **"Sites"**
3. Click **"Add Employee"** or similar button
4. Fill out form with test data:
   - UAN: `100000000001`
   - Name: Test Employee
   - Mobile: 9999999999
   - Select any site
   - Fill bank details (optional)
5. Submit form
6. **Verify in database**:
   ```sql
   SELECT uan, name, status, site_id 
   FROM employees 
   WHERE uan = '100000000001';
   ```
   **Expected**: status = 'PENDING'

7. **Test Approval**:
   - In the app, navigate to pending approvals
   - Click **"Approve"** on the test employee
   - **Verify in database**:
     ```sql
     SELECT uan, name, status FROM employees WHERE uan = '100000000001';
     ```
   **Expected**: status = 'APPROVED'

8. **Test Employee Count Trigger**:
   - Check the site's employee count before and after approval
   - **Verify** the count incremented automatically

✅ **Checkpoint**: Data operations working correctly

---

### Step 7: Test Audit Logging

**Verify audit trail is capturing actions:**

```sql
SELECT 
  action,
  table_name,
  payload->>'uan' as employee_uan,
  payload->>'name' as employee_name,
  created_at
FROM audit_logs 
WHERE table_name = 'employees'
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected**: See entries for employee creation and status updates

✅ **Checkpoint**: Audit logging functional

---

### Step 8: Clean Up Test Data (Optional)

If you created test employees during testing:

```sql
-- Remove test employee
DELETE FROM employees WHERE uan = '100000000001';

-- Verify removed
SELECT COUNT(*) FROM employees WHERE uan = '100000000001';
-- Should return 0
```

---

## 🎉 Deployment Complete

### Post-Deployment Checklist

- [ ] HR Admin can login with email/password
- [ ] Failed login attempts are tracked
- [ ] Account lockout works after 5 failed attempts
- [ ] Session tokens are created in hr_sessions table
- [ ] Employee creation works
- [ ] Employee approval/rejection works
- [ ] Site employee counts update automatically
- [ ] Audit logs are capturing all actions
- [ ] All existing app features still functional
- [ ] Application returned to normal operation

---

## 📊 Monitoring Queries (Run Daily)

### Check Recent Login Activity
```sql
SELECT 
  u.name,
  u.email,
  u.last_login_at,
  u.last_login_ip,
  u.failed_login_attempts
FROM users u
ORDER BY last_login_at DESC
LIMIT 10;
```

### Check Active Sessions
```sql
SELECT 
  u.name,
  u.email,
  s.issued_at,
  s.expires_at,
  CASE 
    WHEN s.expires_at > now() THEN '✓ Active'
    ELSE '✗ Expired'
  END as status
FROM hr_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.revoked_at IS NULL
ORDER BY s.issued_at DESC;
```

### Check Locked Accounts
```sql
SELECT 
  email,
  failed_login_attempts,
  locked_until,
  CASE 
    WHEN locked_until > now() THEN '🔒 Locked'
    ELSE '✓ Unlocked'
  END as status
FROM users
WHERE locked_until IS NOT NULL OR failed_login_attempts > 0;
```

### Review Recent Audit Events
```sql
SELECT 
  action,
  table_name,
  created_at,
  payload
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

---

## 🚨 Troubleshooting

### Issue: "Cannot find module 'pgcrypto'"

**Solution**: Enable extension in Supabase
1. Go to Supabase Dashboard → Database → Extensions
2. Search for "pgcrypto"
3. Click "Enable"
4. Re-run schema.sql

### Issue: "RPC function hr_login not found"

**Solution**: Verify function was created
```sql
SELECT proname FROM pg_proc 
WHERE proname = 'hr_login' 
  AND pronamespace = 'public'::regnamespace;
```
If not found, re-run schema.sql

### Issue: Login succeeds but no session token created

**Solution**: Check hr_sessions table
```sql
SELECT * FROM hr_sessions ORDER BY issued_at DESC LIMIT 5;
```
If empty, check audit_logs for errors

### Issue: Employee count not updating

**Solution**: Manually refresh
```sql
SELECT refresh_site_employee_count(id) 
FROM sites 
WHERE status = 'ACTIVE';
```

### Issue: Need to reset admin password

**Solution**: Run in SQL Editor
```sql
UPDATE users 
SET password_hash = crypt('admin123', gen_salt('bf')),
    failed_login_attempts = 0,
    locked_until = NULL
WHERE email = 'admin@konark.com';
```

---

## 🔄 Rollback Procedure (Emergency Only)

**⚠️ Only use if deployment fails completely**

```sql
-- DANGER: This will restore old schema and data
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restore from backups
CREATE TABLE companies AS SELECT * FROM backup_20260211_companies;
CREATE TABLE sites AS SELECT * FROM backup_20260211_sites;
CREATE TABLE employees AS SELECT * FROM backup_20260211_employees;
CREATE TABLE salary_records AS SELECT * FROM backup_20260211_salary_records;

-- You will need to recreate constraints and indexes manually
-- Or re-apply your previous schema
```

---

## 📞 Support Contacts

- **Database Issues**: Check Supabase status page
- **Application Issues**: Review browser console and network tab
- **Schema Questions**: Refer to [`plans/database-deployment-plan.md`](plans/database-deployment-plan.md)

---

## 📚 Additional Resources

- **Full Deployment Plan**: [`plans/database-deployment-plan.md`](plans/database-deployment-plan.md)
- **Implementation Checklist**: [`plans/implementation-checklist.md`](plans/implementation-checklist.md)
- **Quick Reference**: [`plans/quick-reference.md`](plans/quick-reference.md)
- **Schema File**: [`database/schema.sql`](database/schema.sql)
- **Backup Script**: [`database/backup-current-db.sql`](database/backup-current-db.sql)
- **Verification Script**: [`database/verify-schema.sql`](database/verify-schema.sql)

---

**Deployment Guide Version**: 1.0  
**Last Updated**: 2026-02-11  
**Schema Version**: v1.2  
**Status**: Ready for Production
