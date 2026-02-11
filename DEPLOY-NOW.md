# 🚀 DEPLOY NOW - Quick Deployment Instructions

## ⚠️ CRITICAL: Database Deployment Required

The application code has been updated to use real database authentication, but the database schema has NOT been deployed yet. You must deploy the schema to Supabase before the application will work.

---

## 📋 STEP-BY-STEP DEPLOYMENT (Do This Now)

### 🔴 STEP 1: Backup Current Database (MANDATORY)

1. Open your browser and go to: **https://supabase.com**
2. Click on your project: **aqfcbijhvdbwlqrvmrxa**
3. In the left sidebar, click: **SQL Editor**
4. Click the **"+ New Query"** button
5. Open the file: **`database/backup-current-db.sql`** in VS Code
6. **Copy the ENTIRE file contents** (Ctrl+A, Ctrl+C)
7. **Paste** into the Supabase SQL Editor
8. Click the **"Run"** button (bottom right)
9. **Wait for completion** - should show row counts for backed up tables

**Expected Output:**
```
table_name     | row_count | backup_table
---------------|-----------|-------------------------
companies      | 1         | backup_20260211_companies
sites          | N         | backup_20260211_sites
employees      | N         | backup_20260211_employees
salary_records | N         | backup_20260211_salary_records
```

✅ **IF YOU SEE ROW COUNTS** → Backup successful! Continue to Step 2
❌ **IF YOU SEE ERRORS** → Check that tables exist, then try again

---

### 🔴 STEP 2: Apply New Database Schema

1. Still in Supabase SQL Editor, click **"+ New Query"** (new tab)
2. Open the file: **`database/schema.sql`** in VS Code
3. **Copy the ENTIRE file** (all 221 lines)
4. **Paste** into Supabase SQL Editor
5. **Verify** it starts with:
   ```sql
   -- Konark HR & Salary Management System (Standard Edition v1.2)
   -- WARNING: This script DROPS existing app DB objects before recreating from scratch.
   
   create extension if not exists "pgcrypto";
   ```
6. Click **"Run"** button
7. **Wait 30-60 seconds** for completion

**Expected Output:**
```
Success. No rows returned.
```
Or multiple "Success" messages for each CREATE statement.

✅ **IF "SUCCESS" WITH NO RED ERRORS** → Schema deployed! Continue to Step 3
❌ **IF RED ERROR MESSAGES** → **STOP!** Screenshot the error and share it

---

### 🔴 STEP 3: Verify Deployment

1. Click **"+ New Query"** again
2. Open the file: **`database/verify-schema.sql`** in VS Code
3. **Copy the ENTIRE file** contents
4. **Paste** and click **"Run"**
5. **Review the results**

**Critical Checks:**

**Section 1 - Tables**: Should list these 7 tables:
```
✅ audit_logs
✅ companies
✅ employees
✅ hr_sessions
✅ salary_records
✅ sites
✅ users
```

**Section 8 - Seed Data**: Should show 1 user:
```
name: HR Admin
email: admin@konark.com
is_active: true
```

**Section 9 - Test Login**: Should return user data:
```
id: <some-uuid>
name: HR Admin
email: admin@konark.com
role: HR_ADMIN
```

**Section 10 - Password Hash**: Should show:
```
hash_length: 60
hash_prefix: $2a$ (or $2b$)
hash_status: ✓ Valid bcrypt hash
```

✅ **IF ALL CHECKS PASS** → Database ready! Continue to Step 4
⚠️ **IF SOME FAIL** → Note which sections failed, may need troubleshooting

---

### 🔴 STEP 4: Test Application

1. **Wait for npm install to complete** (currently running)
2. After install completes, run:
   ```bash
   npm run dev
   ```
3. Open browser to: **http://localhost:5173**
4. You should see the Konark HRM login page
5. Click **"HR Admin"** tab
6. Enter credentials:
   - **Email**: `admin@konark.com`
   - **Password**: `admin123`
7. Click **"Login as Admin"**

**Expected Result:**
- ✅ Redirects to `/hr/dashboard`
- ✅ Shows statistics cards
- ✅ No console errors
- ✅ Local Storage has `konark_uid`

**If Login Fails:**
- Check browser console for errors (F12 → Console tab)
- Verify Supabase credentials in `.env.local`
- Check that hr_login function exists in database

---

## 🚨 Common Errors & Fixes

### Error: "Function hr_login does not exist"

**Cause**: Schema not deployed or partially deployed

**Fix**: Re-run `database/schema.sql` in Supabase SQL Editor

### Error: "Cannot find module 'services/auth'"

**Cause**: This is normal during npm install

**Fix**: Wait for npm install to complete

### Error: "Connection refused" or "Database not connected"

**Cause**: Supabase URL or key incorrect

**Fix**: 
1. Check `.env.local` has correct credentials
2. Verify Supabase project is active (not paused)
3. Check Supabase dashboard for any errors

### Error: "Invalid credentials" with correct password

**Cause**: Password hash not created properly

**Fix**: Run this in Supabase SQL Editor:
```sql
UPDATE users 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE email = 'admin@konark.com';
```

### Account Locked After Testing

**Fix**: Run in Supabase SQL Editor:
```sql
UPDATE users 
SET locked_until = NULL, 
    failed_login_attempts = 0 
WHERE email = 'admin@konark.com';
```

---

## 📞 Need Help?

### If Stuck on Database Deployment:
- Review: `VISUAL-DEPLOYMENT-GUIDE.md` (has diagrams)
- Detailed: `DEPLOYMENT.md` (complete guide)
- Quick ref: `plans/quick-reference.md`

### If Application Errors:
1. Check browser console (F12)
2. Check terminal for errors
3. Verify `services/auth.ts` was created
4. Verify `context/AuthContext.tsx` was updated

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Backup created in Supabase (backup_20260211_* tables exist)
- [ ] Schema deployed (7 tables created)
- [ ] Verification passed (all checks green)
- [ ] npm install completed successfully
- [ ] npm run dev starts without errors
- [ ] Login page loads at localhost:5173
- [ ] Can login with admin@konark.com / admin123
- [ ] Dashboard displays correctly
- [ ] No console errors

---

## 🎯 Current Status

✅ **Code Changes**: Complete
✅ **Documentation**: Complete
✅ **Package.json**: Fixed
⏳ **NPM Install**: Running...
🔴 **Database Schema**: **NOT DEPLOYED** - You must do this manually in Supabase
⏳ **Application Test**: Pending (waiting for npm install + schema)

---

## ⚡ Quick Reference

**Supabase Dashboard**: https://supabase.com  
**Project ID**: aqfcbijhvdbwlqrvmrxa  
**Default Login**: admin@konark.com / admin123  

**Files to run in Supabase SQL Editor (in order):**
1. `database/backup-current-db.sql`
2. `database/schema.sql`
3. `database/verify-schema.sql`

**After schema deployed, run locally:**
```bash
npm run dev
```

---

**⚠️ IMPORTANT**: The database schema MUST be deployed before testing the application. The application code now expects the new authentication functions to exist in the database.

**Next Action**: Go to Supabase dashboard and run the SQL scripts!
