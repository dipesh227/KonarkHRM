# Konark HRM - Database Schema Deployment Checklist

## Pre-Deployment Phase

### ☐ 1. Backup Current Database
```sql
-- Execute in Supabase SQL Editor
-- Create timestamped backup tables
CREATE TABLE IF NOT EXISTS backup_20260211_companies AS SELECT * FROM public.companies;
CREATE TABLE IF NOT EXISTS backup_20260211_sites AS SELECT * FROM public.sites;
CREATE TABLE IF NOT EXISTS backup_20260211_employees AS SELECT * FROM public.employees;
CREATE TABLE IF NOT EXISTS backup_20260211_salary_records AS SELECT * FROM public.salary_records;

-- Verify backups
SELECT 'companies' as table_name, COUNT(*) as row_count FROM backup_20260211_companies
UNION ALL
SELECT 'sites', COUNT(*) FROM backup_20260211_sites
UNION ALL
SELECT 'employees', COUNT(*) FROM backup_20260211_employees
UNION ALL
SELECT 'salary_records', COUNT(*) FROM backup_20260211_salary_records;
```

### ☐ 2. Export Current Data (Optional)
- Navigate to Supabase Dashboard → Table Editor
- Export each table as CSV for additional backup
- Store exports in `/database/backups/` folder

### ☐ 3. Verify Supabase Connection
```bash
# Test from application
npm run dev
# Check console for connection status
```

## Deployment Phase

### ☐ 4. Apply Database Schema

**Method A: Via Supabase Dashboard (Recommended)**
1. Open Supabase Dashboard at https://supabase.com
2. Navigate to your project: `aqfcbijhvdbwlqrvmrxa`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open `database/schema.sql` in your editor
6. Copy the **entire file contents**
7. Paste into Supabase SQL Editor
8. Click **Run** button (bottom right)
9. Wait for completion message
10. Check for any errors in the results panel

**Method B: Via Supabase CLI**
```bash
# If you have Supabase CLI installed
npx supabase db push
```

### ☐ 5. Verify Schema Deployment

**Check 1: Tables Created**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```
**Expected Output:**
- audit_logs
- companies
- employees
- hr_sessions
- salary_records
- sites
- users

**Check 2: Enums Created**
```sql
SELECT typname, typtype 
FROM pg_type 
WHERE typtype = 'e' 
  AND typnamespace = 'public'::regnamespace;
```
**Expected Output:**
- user_role
- employee_status
- record_status

**Check 3: Functions Exist**
```sql
SELECT proname 
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
  AND prokind = 'f'
ORDER BY proname;
```
**Expected Output:**
- hr_login
- refresh_site_employee_count
- sync_site_counts_from_employee_change
- touch_updated_at
- upsert_employee
- upsert_salary
- write_audit_log

**Check 4: Triggers Exist**
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```
**Expected Triggers:**
- trg_employees_touch_updated_at on employees
- trg_salary_records_touch_updated_at on salary_records
- trg_sites_touch_updated_at on sites
- trg_sync_site_counts_from_employee_change on employees
- trg_touch_company_updated_at on companies
- trg_users_touch_updated_at on users

**Check 5: RLS Policies Enabled**
```sql
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```
**Expected:** Each table should have a `*_dev_all` policy

**Check 6: Seed Data Inserted**
```sql
-- Check default HR admin
SELECT id, name, email, role 
FROM users 
WHERE email = 'admin@konark.com';

-- Check default company
SELECT id, name, address 
FROM companies 
LIMIT 1;
```
**Expected:** 1 user row, 1 company row

### ☐ 6. Test Database Functions

**Test hr_login() Function**
```sql
-- Test successful login
SELECT * FROM hr_login('admin@konark.com', 'admin123', '127.0.0.1');
-- Should return: id, name, email, role

-- Test failed login
SELECT * FROM hr_login('admin@konark.com', 'wrongpassword', '127.0.0.1');
-- Should return: empty (no rows)

-- Verify session created
SELECT user_id, issued_at, expires_at 
FROM hr_sessions 
ORDER BY issued_at DESC 
LIMIT 1;
```

**Test upsert_employee() Function**
```sql
-- First, create a test site
INSERT INTO sites (name, code, address, status)
VALUES ('Test Site', 'TS001', '123 Test St', 'ACTIVE')
RETURNING id;

-- Use the returned site ID in the next query
-- Replace '<SITE_ID>' with actual UUID from above
SELECT * FROM upsert_employee(
  '100000000001'::varchar,  -- UAN
  'Test Employee',           -- name
  '9876543210'::varchar,     -- mobile
  'Helper',                  -- role
  '<SITE_ID>'::uuid,        -- site_id (replace with actual)
  'Test Bank',               -- bank_name
  '12345678',                -- account_number
  'TEST0001234',             -- ifsc
  NULL,                      -- photo_url
  NULL                       -- actor_id
);

-- Verify employee created
SELECT uan, name, status, site_id FROM employees WHERE uan = '100000000001';
-- Should show: status = 'PENDING'
```

## Application Integration Phase

### ☐ 7. Create Environment Configuration

Create `.env.local` file:
```bash
# Copy from .env.example if it exists, or create new
VITE_SUPABASE_URL=https://aqfcbijhvdbwlqrvmrxa.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_uYPotcTGMSAcM4BgDPN_HQ_KyE-fFYg
```

### ☐ 8. Update Supabase Service

Update `services/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://aqfcbijhvdbwlqrvmrxa.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_uYPotcTGMSAcM4BgDPN_HQ_KyE-fFYg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('sites').select('count', { count: 'exact', head: true });
    if (error) {
      console.error("Supabase Connection Error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected Connection Error:", err);
    return false;
  }
};
```

### ☐ 9. Create Session Management Service

Create new file `services/auth.ts`:
```typescript
import { supabase } from './supabase';
import { User, UserRole } from '../types';

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export const authenticateHR = async (
  email: string, 
  password: string
): Promise<LoginResponse> => {
  try {
    // Call the hr_login RPC function
    const { data, error } = await supabase.rpc('hr_login', {
      p_email: email,
      p_password: password,
      p_client_ip: null // Could get from window.location or API
    });

    if (error) {
      console.error('Login RPC error:', error);
      return { success: false, error: 'Database error occurred' };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Invalid credentials or account locked' };
    }

    const userRecord = data[0];
    const user: User = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role as UserRole
    };

    return { success: true, user };
  } catch (err) {
    console.error('Login exception:', err);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

export const validateSession = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('hr_sessions')
      .select('expires_at, revoked_at')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .order('issued_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return false;
    
    const expiresAt = new Date(data.expires_at);
    return expiresAt > new Date();
  } catch {
    return false;
  }
};

export const revokeAllSessions = async (userId: string): Promise<void> => {
  await supabase
    .from('hr_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('revoked_at', null);
};
```

### ☐ 10. Update AuthContext

Update `context/AuthContext.tsx`:
```typescript
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/mockDb';
import { authenticateHR } from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginHR: (email: string, pass: string) => Promise<boolean>;
  loginStaff: (uan: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session via ID lookup
  useEffect(() => {
    const initSession = async () => {
      const storedUid = localStorage.getItem('konark_uid');
      if (storedUid) {
        try {
          const fetchedUser = await db.getUserById(storedUid);
          if (fetchedUser) {
            setUser(fetchedUser);
          } else {
            localStorage.removeItem('konark_uid');
          }
        } catch (e) {
          console.error("Session restore failed", e);
        }
      }
      setLoading(false);
    };
    initSession();
  }, []);

  const loginHR = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Use the new authentication service
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

  const loginStaff = async (uan: string) => {
    setLoading(true);
    try {
      const user = await db.loginUAN(uan);
      if (user) {
        setUser(user);
        localStorage.setItem('konark_uid', user.id);
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('konark_uid');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginHR, loginStaff, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### ☐ 11. Update mockDb Service

Update `services/mockDb.ts` - modify the `loginHR` function:
```typescript
// Remove this function as it's now handled by services/auth.ts
// OR keep it for backward compatibility but mark as deprecated

// Keep loginUAN as is - it doesn't use passwords
loginUAN: async (uan: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('uan', uan)
    .eq('status', 'APPROVED') // Important: only approved employees can login
    .single();
    
  if (error || !data) return null;
  
  const role = data.role.toLowerCase().includes('supervisor') 
    ? UserRole.SITE_INCHARGE 
    : UserRole.EMPLOYEE;
    
  return { 
    id: data.id, 
    name: data.name, 
    uan: data.uan, 
    role, 
    siteId: data.site_id 
  };
},
```

## Testing Phase

### ☐ 12. Test HR Admin Login

**Test Steps:**
1. Start development server: `npm run dev`
2. Navigate to login page
3. Switch to "HR Admin" tab
4. Enter credentials:
   - Email: `admin@konark.com`
   - Password: `admin123`
5. Click "Login as Admin"
6. **Expected:** Redirect to `/hr/dashboard`
7. **Verify:** Check browser console for no errors
8. **Verify:** Check Application → Local Storage → `konark_uid` exists

**Database Verification:**
```sql
-- Check session was created
SELECT s.id, s.issued_at, s.expires_at, u.email 
FROM hr_sessions s
JOIN users u ON s.user_id = u.id
ORDER BY s.issued_at DESC
LIMIT 1;

-- Check audit log
SELECT action, table_name, payload 
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

### ☐ 13. Test Failed Login & Account Lockout

**Test Steps:**
1. Try login with wrong password 5 times
2. **Expected:** After 5th attempt, see "Account locked" message
3. Check database:

```sql
SELECT email, failed_login_attempts, locked_until 
FROM users 
WHERE email = 'admin@konark.com';
```

4. **Verify:** `locked_until` is set to ~15 minutes in future
5. **Verify:** `failed_login_attempts` = 5

**To Reset:**
```sql
UPDATE users 
SET failed_login_attempts = 0, locked_until = NULL 
WHERE email = 'admin@konark.com';
```

### ☐ 14. Test Employee/Staff Login

**Setup: Create Test Employee**
```sql
-- Get a site ID first
SELECT id, name FROM sites LIMIT 1;

-- Create approved employee
INSERT INTO employees (
  uan, name, mobile, role, site_id, status
) VALUES (
  '100000000099', 
  'Test Worker', 
  '9999999999', 
  'Helper', 
  '<SITE_ID>'::uuid,  -- Replace with actual site ID
  'APPROVED'
) RETURNING id, uan, name, status;
```

**Test Steps:**
1. Switch to "Staff / Site" tab
2. Enter UAN: `100000000099`
3. Click "Login as Staff"
4. **Expected:** Redirect to `/emp/profile`
5. **Verify:** Dashboard shows employee name
6. **Verify:** Only employee-specific menu items visible

**Test Pending Employee (Should Fail):**
```sql
-- Create pending employee
INSERT INTO employees (
  uan, name, mobile, role, site_id, status
) VALUES (
  '100000000098', 
  'Pending Worker', 
  '8888888888', 
  'Helper', 
  '<SITE_ID>'::uuid,
  'PENDING'  -- Not approved
);
```

Try login with UAN `100000000098` → Should fail with "not approved" message

### ☐ 15. Test Data Operations

**Create Employee via Form:**
1. Login as HR Admin
2. Navigate to "Employee Directory" or "Sites"
3. Click "Add Employee"
4. Fill form with:
   - UAN: `100000000097`
   - Name: Test Employee 2
   - Mobile: 7777777777
   - Select a site
   - Add bank details
5. Submit
6. **Verify in database:**

```sql
SELECT uan, name, status, site_id 
FROM employees 
WHERE uan = '100000000097';
-- Should show status = 'PENDING'

-- Check audit log
SELECT action, table_name, payload 
FROM audit_logs 
WHERE table_name = 'employees' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Test Site Employee Count Trigger:**
```sql
-- Check current count
SELECT id, name, employee_count 
FROM sites 
WHERE status = 'ACTIVE';

-- Note the count, then approve the pending employee
UPDATE employees 
SET status = 'APPROVED' 
WHERE uan = '100000000097';

-- Check count again (should have increased by 1)
SELECT id, name, employee_count 
FROM sites 
WHERE id = (SELECT site_id FROM employees WHERE uan = '100000000097');
```

### ☐ 16. Test Salary Operations

**Upload Test Salary Record:**
```sql
-- Use the upsert_salary function
SELECT * FROM upsert_salary(
  (SELECT id FROM employees WHERE uan = '100000000099'),  -- employee_id
  '02-2026'::varchar,   -- month
  2026,                 -- year
  15000.00,            -- basic
  6000.00,             -- hra
  2000.00,             -- allowances
  1000.00,             -- deductions
  26,                  -- paid_days
  NULL,                -- actor_id
  true                 -- is_locked
);

-- Verify record created
SELECT employee_name, month, year, basic, hra, allowances, deductions, net_payable
FROM salary_records
WHERE uan = '100000000099';
-- net_payable should be (15000 + 6000 + 2000) - 1000 = 22000
```

**Test Salary Slip Download (UI):**
1. Login as employee (UAN: 100000000099)
2. Navigate to "My Salary"
3. Select month: February 2026
4. Click "Download PDF"
5. **Verify:** PDF downloads with correct data

## Post-Deployment Verification

### ☐ 17. Performance Check

```sql
-- Check query performance
EXPLAIN ANALYZE 
SELECT * FROM employees WHERE site_id = '<ANY_SITE_ID>';

EXPLAIN ANALYZE 
SELECT * FROM salary_records WHERE uan = '100000000099' AND month = '02-2026';

-- Should use indexes efficiently
```

### ☐ 18. Security Audit

```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- All should have rowsecurity = true

-- Check password hashing
SELECT email, 
       length(password_hash) as hash_length,
       substring(password_hash, 1, 4) as hash_prefix
FROM users;
-- hash should be ~60 chars, start with $2a$ or $2b$ (bcrypt)
```

### ☐ 19. Cleanup Test Data (Optional)

```sql
-- Remove test employees
DELETE FROM employees WHERE uan IN ('100000000099', '100000000098', '100000000097');

-- Remove test salary records
DELETE FROM salary_records WHERE uan IN ('100000000099', '100000000098', '100000000097');

-- Remove test site if created
DELETE FROM sites WHERE code = 'TS001';
```

## Documentation Phase

### ☐ 20. Update README.md

Add section about:
- Database setup instructions
- Default credentials
- Environment variables
- Testing procedures

### ☐ 21. Create Migration Log

Document:
- Date of migration
- Version deployed
- Any issues encountered
- Rollback procedures used (if any)

### ☐ 22. Team Training

- Schedule walkthrough of new authentication flow
- Document password reset procedure (if not automated)
- Share backup/restore procedures with team

## Rollback Procedures

### If Complete Rollback Needed

```sql
-- DANGER: This will restore old schema, losing all data since backup
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restore from backups
CREATE TABLE companies AS SELECT * FROM backup_20260211_companies;
CREATE TABLE sites AS SELECT * FROM backup_20260211_sites;
CREATE TABLE employees AS SELECT * FROM backup_20260211_employees;
CREATE TABLE salary_records AS SELECT * FROM backup_20260211_salary_records;

-- Recreate basic constraints
ALTER TABLE companies ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid();
-- ... add other constraints as needed
```

### Partial Rollback (Reset Admin Password)

```sql
-- If HR admin locked out or password forgotten
UPDATE users 
SET password_hash = crypt('admin123', gen_salt('bf')),
    failed_login_attempts = 0,
    locked_until = NULL
WHERE email = 'admin@konark.com';
```

## Success Criteria

✅ All tables created without errors  
✅ All functions and triggers operational  
✅ Seed data inserted  
✅ HR admin can login with email/password  
✅ Failed login lockout works  
✅ Session tokens created and validated  
✅ Employee login with UAN works  
✅ Only APPROVED employees can login  
✅ Audit logs capture all actions  
✅ Employee count auto-updates via trigger  
✅ All existing app features still functional  

---

**Checklist Version:** 1.0  
**Last Updated:** 2026-02-11  
**Status:** Ready for Execution
