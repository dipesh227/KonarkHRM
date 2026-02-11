# Konark HR & Salary Management System

**Standard Edition v1.2** - A comprehensive workforce management platform with multi-site operations, automated payroll processing, and role-based access control.

## 🎯 Features

- **Role-Based Access Control**: HR Admin, Site In-charge, and Employee roles
- **Digital Onboarding**: Mobile-optimized employee registration with KYC documents
- **Approval Workflow**: Pending → Approved → Active employee lifecycle
- **Bulk Payroll**: Excel-based salary upload with automatic calculations
- **PDF Salary Slips**: On-demand generation with company branding
- **Site Management**: Multi-location employee tracking with auto-count sync
- **Audit Trail**: Complete logging of all database operations
- **Session Management**: Token-based authentication with automatic expiry
- **Account Security**: Failed login tracking with automatic 15-minute lockout

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Supabase account and project

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   - Copy [`.env.local`](.env.local) and verify Supabase credentials
   - Default configuration already included for your project

3. **Deploy database schema** (First time only):
   - See detailed instructions in [`DEPLOYMENT.md`](DEPLOYMENT.md)
   - Quick steps:
     1. Run [`database/backup-current-db.sql`](database/backup-current-db.sql) (if upgrading)
     2. Run [`database/schema.sql`](database/schema.sql) in Supabase SQL Editor
     3. Run [`database/verify-schema.sql`](database/verify-schema.sql) to verify

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Login**:
   - Email: `admin@konark.com`
   - Password: `admin123`

## 📊 Database Architecture

### Core Tables
- [`users`](database/schema.sql:23) - HR Admin accounts with bcrypt password hashing
- [`employees`](database/schema.sql:42) - Worker records with 12-digit UAN
- [`sites`](database/schema.sql:31) - Work locations with auto-updating employee counts
- [`salary_records`](database/schema.sql:56) - Monthly payroll with automatic net calculation
- [`companies`](database/schema.sql:68) - Company branding (logo, stamp, signature)
- [`hr_sessions`](database/schema.sql:87) - Session tokens with 8-hour expiry
- [`audit_logs`](database/schema.sql:79) - Complete audit trail

### Key Features
- **Automatic Triggers**: Employee counts sync, timestamp updates
- **RPC Functions**: [`hr_login()`](database/schema.sql:106), [`upsert_employee()`](database/schema.sql:143), [`upsert_salary()`](database/schema.sql:168)
- **Row Level Security**: Development policies active (tighten for production)

## 🔒 Authentication

### HR Admin Login
- Email + password authentication
- Bcrypt password hashing
- Session tokens with 8-hour expiry
- Failed attempt tracking (locks after 5 attempts for 15 minutes)

### Employee Login
- 12-digit UAN (Universal Account Number)
- No password required
- Only APPROVED employees can login

## 📁 Project Structure

```
KonarkHRM/
├── components/           # React components
│   ├── Auth/            # Login interface
│   ├── HR/              # HR admin modules
│   ├── Site/            # Site in-charge modules
│   ├── Employee/        # Employee self-service
│   └── Layout/          # App layout
├── context/             # React Context providers
│   ├── AuthContext.tsx  # Authentication state
│   ├── CompanyContext.tsx
│   └── ThemeContext.tsx
├── services/            # API services
│   ├── auth.ts         # Database authentication
│   ├── supabase.ts     # Supabase client
│   └── mockDb.ts       # Data access layer
├── database/            # Database scripts
│   ├── schema.sql      # Main schema (v1.2)
│   ├── backup-current-db.sql
│   └── verify-schema.sql
├── plans/              # Deployment documentation
│   ├── database-deployment-plan.md
│   ├── implementation-checklist.md
│   └── quick-reference.md
├── DEPLOYMENT.md       # Step-by-step deployment guide
└── types.ts           # TypeScript interfaces
```

## 🔧 Configuration

### Environment Variables
Create [`.env.local`](.env.local) (already included):
```env
VITE_SUPABASE_URL=https://aqfcbijhvdbwlqrvmrxa.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_uYPotcTGMSAcM4BgDPN_HQ_KyE-fFYg
```

### Supabase Project
- URL: `https://aqfcbijhvdbwlqrvmrxa.supabase.co`
- Region: Configured in your Supabase dashboard
- RLS: Currently in development mode (permissive policies)

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide with step-by-step instructions
- **[plans/database-deployment-plan.md](plans/database-deployment-plan.md)** - Comprehensive technical plan
- **[plans/implementation-checklist.md](plans/implementation-checklist.md)** - 22-step deployment checklist
- **[plans/quick-reference.md](plans/quick-reference.md)** - Quick reference for common tasks

## 🧪 Testing

### Local Testing
```bash
npm run dev
```

### Database Verification
Run [`database/verify-schema.sql`](database/verify-schema.sql) in Supabase SQL Editor to verify:
- All tables created
- Functions and triggers active
- Seed data inserted
- Password hashing working

### Test Credentials
- **HR Admin**: `admin@konark.com` / `admin123`
- **Test Employee**: Create via "Add Employee" form in dashboard

## 🚨 Troubleshooting

### Login Fails with Correct Password
```sql
-- Reset password hash
UPDATE users
SET password_hash = crypt('admin123', gen_salt('bf')),
    failed_login_attempts = 0,
    locked_until = NULL
WHERE email = 'admin@konark.com';
```

### Account Locked
Wait 15 minutes or manually unlock:
```sql
UPDATE users
SET locked_until = NULL, failed_login_attempts = 0
WHERE email = 'admin@konark.com';
```

### Connection Error
- Verify Supabase URL and key in [`.env.local`](.env.local)
- Check Supabase project status
- Ensure RLS policies are enabled

## 🔄 Database Updates

### Backup Before Changes
Always backup before schema updates:
```sql
-- Run database/backup-current-db.sql first
```

### Apply Schema Updates
```bash
# In Supabase SQL Editor, run:
# 1. database/backup-current-db.sql
# 2. database/schema.sql
# 3. database/verify-schema.sql
```

## 📊 Monitoring

### Check Active Sessions
```sql
SELECT u.name, s.issued_at, s.expires_at
FROM hr_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.revoked_at IS NULL AND s.expires_at > now();
```

### View Audit Trail
```sql
SELECT action, table_name, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;
```

## 🎨 Customization

### Company Branding
1. Login as HR Admin
2. Navigate to "Company Profile"
3. Upload:
   - Company logo (appears on login, salary slips)
   - Digital stamp (overlaid on payslips)
   - Signature (authorized signatory)

## 🔐 Security

### Current State (Development)
- RLS policies are permissive (`*_dev_all`)
- All authenticated users have full access

### Production Recommendations
- Tighten RLS policies per role
- Implement proper JWT authentication
- Enable Supabase Auth (optional)
- Set up automated backups
- Monitor failed login attempts
- Review audit logs regularly

See [`plans/database-deployment-plan.md`](plans/database-deployment-plan.md) for production security hardening steps.

## 📦 Deployment

### Production Build
```bash
npm run build
```

### Deploy to Hosting
```bash
npm run preview  # Test production build locally
# Then deploy dist/ folder to your hosting platform
```

### Environment Variables
Set these in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly (especially database operations)
4. Update documentation
5. Submit pull request

## 📄 License

Proprietary - Konark HRM Standard Edition v1.2

## 🆘 Support

- **Database Issues**: Check [`DEPLOYMENT.md`](DEPLOYMENT.md) troubleshooting section
- **Schema Questions**: Review [`plans/database-deployment-plan.md`](plans/database-deployment-plan.md)
- **Quick Fixes**: See [`plans/quick-reference.md`](plans/quick-reference.md)

---

**Version**: 1.2
**Last Updated**: 2026-02-11
**Database Schema Version**: v1.2
**Status**: Production Ready
