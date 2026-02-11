# 🎯 Konark HRM - Database Schema Application (Visual Guide)

## 🚀 3-Step Deployment Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  STEP 1: BACKUP (5 min)     STEP 2: DEPLOY (2 min)    STEP 3: TEST  │
│  ───────────────────        ────────────────────       ──────────    │
│                                                                       │
│  📋 Open Supabase           📋 Open Supabase          🖥️  Open App   │
│  📝 SQL Editor              📝 SQL Editor              🔑 Login       │
│  📂 backup-current-db.sql   📂 schema.sql             ✅ Verify       │
│  ▶️  Run                     ▶️  Run                                  │
│  ✅ Verify row counts        ✅ No errors                             │
│                             📝 verify-schema.sql                      │
│                             ▶️  Run                                   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 STEP 1: Create Database Backup

### Open Supabase Dashboard

```
1. Go to: https://supabase.com
2. Click your project: aqfcbijhvdbwlqrvmrxa
3. Left sidebar → SQL Editor
4. Click "+ New Query"
```

### Run Backup Script

```
┌─────────────────────────────────────────────────────────┐
│ Supabase SQL Editor                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Open: database/backup-current-db.sql                │
│  2. Copy ENTIRE file contents                           │
│  3. Paste into SQL Editor                               │
│  4. Click [RUN] button (bottom right)                   │
│                                                         │
│  Expected Output:                                       │
│  ┌───────────────────────────────────────────┐         │
│  │ table_name     | row_count | backup_table │         │
│  ├───────────────────────────────────────────┤         │
│  │ companies      | 1         | backup_...   │         │
│  │ sites          | N         | backup_...   │         │
│  │ employees      | N         | backup_...   │         │
│  │ salary_records | N         | backup_...   │         │
│  └───────────────────────────────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘

✅ If you see row counts → Backups successful! Proceed to Step 2
❌ If errors → Check table names, try again
```

---

## 🚀 STEP 2: Deploy Database Schema

### Apply New Schema

```
┌─────────────────────────────────────────────────────────┐
│ Supabase SQL Editor - New Query                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Click "+ New Query" (fresh tab)                     │
│  2. Open: database/schema.sql                           │
│  3. Copy ENTIRE file (all 221 lines)                    │
│  4. Paste into SQL Editor                               │
│  5. Verify it starts with:                              │
│     -- Konark HR & Salary Management System...         │
│     create extension if not exists "pgcrypto";         │
│  6. Click [RUN] button                                  │
│  7. Wait 30-60 seconds                                  │
│                                                         │
│  Expected Output:                                       │
│  ┌───────────────────────────────────────────┐         │
│  │ ✅ Success. No rows returned.             │         │
│  │                                           │         │
│  │ (or multiple CREATE TABLE success msgs)  │         │
│  └───────────────────────────────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘

✅ If "Success" with no red errors → Schema deployed! Continue to verify
❌ If red ERROR messages → STOP! Screenshot error, check docs
```

### Verify Deployment

```
┌─────────────────────────────────────────────────────────┐
│ Supabase SQL Editor - Verification                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Click "+ New Query" again                           │
│  2. Open: database/verify-schema.sql                    │
│  3. Copy ENTIRE file                                    │
│  4. Paste and Run                                       │
│                                                         │
│  Check Results:                                         │
│  ┌───────────────────────────────────────────┐         │
│  │ Section 1: Tables (should show 7)        │         │
│  │  • audit_logs                             │         │
│  │  • companies                              │         │
│  │  • employees                              │         │
│  │  • hr_sessions                            │         │
│  │  • salary_records                         │         │
│  │  • sites                                  │         │
│  │  • users                                  │         │
│  │                                           │         │
│  │ Section 8: Seed Data                     │         │
│  │  ✅ 1 user: admin@konark.com             │         │
│  │  ✅ 1 company record                     │         │
│  │                                           │         │
│  │ Section 9: Test Login                    │         │
│  │  ✅ Returns user data                    │         │
│  │                                           │         │
│  │ Section 10: Password Hash                │         │
│  │  ✅ Valid bcrypt hash ($2a$...)         │         │
│  └───────────────────────────────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘

✅ All checks pass → Database ready! Proceed to Step 3
⚠️  Some checks fail → Review errors, may need rollback
```

---

## 🖥️ STEP 3: Test Application

### Start Development Server

```bash
# In your terminal/command prompt
cd d:/website/hrm/KonarkHRM
npm install  # Only if not done already
npm run dev
```

### Test HR Admin Login

```
┌─────────────────────────────────────────────────────────┐
│ Browser: http://localhost:5173                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────┐           │
│  │          Konark HRM PORTAL              │           │
│  │                                         │           │
│  │  ┌─────────────┬─────────────┐          │           │
│  │  │  HR ADMIN   │ STAFF/SITE  │  ← Click │           │
│  │  └─────────────┴─────────────┘          │           │
│  │                                         │           │
│  │  Email:    admin@konark.com ────────┐   │           │
│  │  Password: admin123 ────────────────┤   │           │
│  │                                     │   │           │
│  │  [Login as Admin] ──────────────────┘   │           │
│  │                                         │           │
│  └─────────────────────────────────────────┘           │
│                                                         │
│  After Login:                                           │
│  ──────────────                                         │
│  ✅ Redirects to /hr/dashboard                         │
│  ✅ Shows statistics cards                             │
│  ✅ No console errors                                  │
│  ✅ Local Storage has 'konark_uid'                     │
│                                                         │
└─────────────────────────────────────────────────────────┘

✅ Login successful and dashboard loads → Implementation complete!
❌ Login fails → Check troubleshooting section below
```

### Verify Authentication Features

```
Test Failed Login Lockout:
──────────────────────────
1. Logout
2. Try wrong password 5 times
3. After 5th attempt: "Account locked" message
4. Unlock: Run SQL to reset (see troubleshooting)

Test Session Management:
────────────────────────
In Supabase SQL Editor:
  SELECT * FROM hr_sessions ORDER BY issued_at DESC LIMIT 1;
  
Expected: 1 row with your login session, expires_at = 8 hours from now

Test Audit Logging:
───────────────────
In Supabase SQL Editor:
  SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;
  
Expected: LOGIN_SUCCESS entry for your login
```

---

## 🎉 SUCCESS CRITERIA

All these should work after deployment:

```
✅ Database Schema Applied
   └─ 7 tables created
   └─ 7 functions created
   └─ 6 triggers active
   └─ RLS policies enabled

✅ Authentication Working
   └─ HR admin can login
   └─ Session token created
   └─ Password hashed with bcrypt
   └─ Failed attempts tracked

✅ Application Functional
   └─ Dashboard loads
   └─ Employee creation works
   └─ Site management works
   └─ No console errors

✅ Security Features Active
   └─ Account lockout works
   └─ Audit logs capturing events
   └─ Sessions expire correctly
```

---

## 🚨 TROUBLESHOOTING

### Issue: Login Fails with Correct Password

```sql
-- In Supabase SQL Editor, run:
UPDATE users 
SET password_hash = crypt('admin123', gen_salt('bf')),
    failed_login_attempts = 0,
    locked_until = NULL
WHERE email = 'admin@konark.com';

-- Then try login again
```

### Issue: Account Locked After Testing

```sql
-- Reset lockout:
UPDATE users 
SET locked_until = NULL, 
    failed_login_attempts = 0 
WHERE email = 'admin@konark.com';
```

### Issue: Function hr_login Not Found

```sql
-- Verify function exists:
SELECT proname FROM pg_proc 
WHERE proname = 'hr_login' 
  AND pronamespace = 'public'::regnamespace;

-- If not found, re-run database/schema.sql
```

### Issue: Application Shows Connection Error

```
1. Check .env.local exists with correct credentials
2. Verify Supabase URL: https://aqfcbijhvdbwlqrvmrxa.supabase.co
3. Check Supabase project is active (not paused)
4. Restart dev server: npm run dev
```

---

## 🔄 ROLLBACK (Emergency Only)

If deployment completely fails and you need to restore:

```sql
-- ⚠️  DANGER: Use only if deployment failed completely

-- 1. Drop new schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 2. Restore from backups
CREATE TABLE companies AS SELECT * FROM backup_20260211_companies;
CREATE TABLE sites AS SELECT * FROM backup_20260211_sites;
CREATE TABLE employees AS SELECT * FROM backup_20260211_employees;
CREATE TABLE salary_records AS SELECT * FROM backup_20260211_salary_records;

-- 3. Recreate basic constraints (may need to add more)
-- Check old schema for constraint definitions
```

---

## 📁 Files Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Complete deployment guide | **Read first** for full details |
| [`database/backup-current-db.sql`](database/backup-current-db.sql) | Backup script | **Run before schema** |
| [`database/schema.sql`](database/schema.sql) | Main schema | **Deploy to database** |
| [`database/verify-schema.sql`](database/verify-schema.sql) | Verification | **Run after schema** |
| [`IMPLEMENTATION-SUMMARY.md`](IMPLEMENTATION-SUMMARY.md) | What was done | Review changes made |
| [`README.md`](README.md) | Project overview | Share with team |

---

## 📞 Need Help?

- **Detailed Steps**: [`DEPLOYMENT.md`](DEPLOYMENT.md)
- **Technical Details**: [`plans/database-deployment-plan.md`](plans/database-deployment-plan.md)
- **Quick Commands**: [`plans/quick-reference.md`](plans/quick-reference.md)
- **Checklist**: [`plans/implementation-checklist.md`](plans/implementation-checklist.md)

---

## ⏱️ Estimated Timeline

```
┌────────────────────────────────────────────┐
│                                            │
│  📋 Backup Database:      5 minutes        │
│  🚀 Apply Schema:         2 minutes        │
│  ✅ Verify Deployment:    3 minutes        │
│  🖥️  Test Application:     5 minutes        │
│  ────────────────────────────────────      │
│  📊 TOTAL:               ~15 minutes       │
│                                            │
└────────────────────────────────────────────┘
```

---

**Version**: 1.2  
**Status**: Ready for Deployment  
**Last Updated**: 2026-02-11

🎯 **Start Here**: [`DEPLOYMENT.md`](DEPLOYMENT.md) → Follow Step 1
