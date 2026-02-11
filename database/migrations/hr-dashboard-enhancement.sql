-- HR Dashboard Enhancement - SQL Schema Updates
-- Version: 2.0
-- Created: 2026-02-11
-- Purpose: Add tables and functions for enhanced HR Dashboard features

-- =====================================================
-- 1. CREATE JOB ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS job_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default job roles
INSERT INTO job_roles (title, description, is_system_default) VALUES
  ('Helper', 'General assistance and support work', TRUE),
  ('Driver', 'Vehicle operation and transportation', TRUE),
  ('Supervisor', 'Team management and oversight', TRUE),
  ('Electrician', 'Electrical installation and maintenance', TRUE),
  ('Plumber', 'Plumbing installation and repairs', TRUE),
  ('Mason', 'Construction and masonry work', TRUE),
  ('Security Guard', 'Security and surveillance', TRUE),
  ('Housekeeping', 'Cleaning and maintenance', TRUE),
  ('Cook', 'Food preparation and cooking', TRUE),
  ('Nurse', 'Healthcare and patient care', TRUE)
ON CONFLICT (title) DO NOTHING;

-- =====================================================
-- 2. CREATE DASHBOARD ANALYTICS TABLES
-- =====================================================

-- Activity Log Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type VARCHAR(50) NOT NULL, -- 'employee_added', 'salary_processed', 'approval_granted', etc.
  entity_type VARCHAR(50), -- 'employee', 'salary', 'site'
  entity_id UUID,
  user_id UUID REFERENCES users(id),
  description TEXT,
  metadata JSONB, -- Additional data like old_value, new_value, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);

-- Dashboard Metrics Cache Table (for performance)
CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL UNIQUE,
  metric_value JSONB NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. ADD ENHANCED EMPLOYEE FIELDS
-- =====================================================

-- Add additional employee tracking fields if not exists
DO $$ 
BEGIN
  -- Add emergency contact
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employees' AND column_name = 'emergency_contact') THEN
    ALTER TABLE employees ADD COLUMN emergency_contact VARCHAR(10);
  END IF;

  -- Add emergency contact name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employees' AND column_name = 'emergency_contact_name') THEN
    ALTER TABLE employees ADD COLUMN emergency_contact_name VARCHAR(100);
  END IF;

  -- Add blood group
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employees' AND column_name = 'blood_group') THEN
    ALTER TABLE employees ADD COLUMN blood_group VARCHAR(5);
  END IF;

  -- Add date of birth
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employees' AND column_name = 'date_of_birth') THEN
    ALTER TABLE employees ADD COLUMN date_of_birth DATE;
  END IF;

  -- Add address
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employees' AND column_name = 'address') THEN
    ALTER TABLE employees ADD COLUMN address TEXT;
  END IF;

  -- Add aadhaar number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employees' AND column_name = 'aadhaar') THEN
    ALTER TABLE employees ADD COLUMN aadhaar VARCHAR(12);
  END IF;

  -- Add PAN number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employees' AND column_name = 'pan') THEN
    ALTER TABLE employees ADD COLUMN pan VARCHAR(10);
  END IF;
END $$;

-- =====================================================
-- 4. CREATE ATTENDANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMP,
  check_out TIMESTAMP,
  status VARCHAR(20) DEFAULT 'PRESENT', -- PRESENT, ABSENT, HALF_DAY, LEAVE, HOLIDAY
  hours_worked DECIMAL(4,2),
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  location_lat DECIMAL(10,8),
  location_long DECIMAL(11,8),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

CREATE INDEX idx_attendance_employee ON attendance_records(employee_id);
CREATE INDEX idx_attendance_date ON attendance_records(date DESC);
CREATE INDEX idx_attendance_status ON attendance_records(status);

-- =====================================================
-- 5. CREATE LEAVE MANAGEMENT TABLES
-- =====================================================

-- Leave Types
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  days_per_year INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT TRUE,
  carry_forward BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default leave types
INSERT INTO leave_types (name, description, days_per_year, is_paid, carry_forward) VALUES
  ('Casual Leave', 'Short-term casual absences', 12, TRUE, FALSE),
  ('Sick Leave', 'Medical and health-related absences', 7, TRUE, FALSE),
  ('Earned Leave', 'Accumulated earned leave', 15, TRUE, TRUE),
  ('Loss of Pay', 'Unpaid leave', 0, FALSE, FALSE)
ON CONFLICT (name) DO NOTHING;

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days_count DECIMAL(3,1) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(from_date, to_date);

-- =====================================================
-- 6. CREATE NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- NULL for broadcast notifications
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- =====================================================
-- 7. ENHANCED RPC FUNCTIONS
-- =====================================================

-- Function: Get Dashboard Statistics (Enhanced)
CREATE OR REPLACE FUNCTION get_dashboard_stats_v2()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalEmployees', (SELECT COUNT(*) FROM employees WHERE status IN ('APPROVED', 'ACTIVE')),
    'pendingApprovals', (SELECT COUNT(*) FROM employees WHERE status = 'PENDING'),
    'activeSites', (SELECT COUNT(*) FROM sites WHERE employee_count > 0),
    'totalPayroll', (SELECT COALESCE(SUM(net_payable), 0) FROM salary_records 
                     WHERE month = TO_CHAR(CURRENT_DATE, 'MM') 
                     AND year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
    'todayAttendance', (SELECT COUNT(*) FROM attendance_records 
                        WHERE date = CURRENT_DATE AND status = 'PRESENT'),
    'pendingLeaves', (SELECT COUNT(*) FROM leave_requests WHERE status = 'PENDING'),
    'activeEmployeesThisMonth', (SELECT COUNT(DISTINCT employee_id) FROM attendance_records 
                                  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)),
    'avgHoursWorked', (SELECT COALESCE(AVG(hours_worked), 0) FROM attendance_records 
                       WHERE date >= CURRENT_DATE - INTERVAL '30 days')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Recent Activities (Last 7 days)
CREATE OR REPLACE FUNCTION get_recent_activities(days_limit INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  uan VARCHAR,
  role VARCHAR,
  status VARCHAR,
  site_name VARCHAR,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.uan,
    e.role,
    e.status::VARCHAR,
    s.name as site_name,
    e.created_at
  FROM employees e
  LEFT JOIN sites s ON e.site_id = s.id
  WHERE e.created_at >= CURRENT_DATE - (days_limit || ' days')::INTERVAL
  ORDER BY e.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Site Performance Metrics
CREATE OR REPLACE FUNCTION get_site_performance()
RETURNS TABLE (
  site_id UUID,
  site_name VARCHAR,
  employee_count INTEGER,
  avg_attendance_rate DECIMAL,
  total_payroll DECIMAL,
  pending_approvals INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as site_id,
    s.name as site_name,
    s.employee_count,
    COALESCE(
      (SELECT AVG(CASE WHEN status = 'PRESENT' THEN 100.0 ELSE 0.0 END)
       FROM attendance_records ar
       JOIN employees e ON ar.employee_id = e.id
       WHERE e.site_id = s.id 
       AND ar.date >= CURRENT_DATE - INTERVAL '30 days'), 
      0
    ) as avg_attendance_rate,
    COALESCE(
      (SELECT SUM(sr.net_payable)
       FROM salary_records sr
       WHERE sr.site_id = s.id
       AND sr.month = TO_CHAR(CURRENT_DATE, 'MM')
       AND sr.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
      0
    ) as total_payroll,
    (SELECT COUNT(*) FROM employees WHERE site_id = s.id AND status = 'PENDING') as pending_approvals
  FROM sites s
  ORDER BY s.employee_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log Activity
CREATE OR REPLACE FUNCTION log_activity(
  activity_type_param VARCHAR,
  entity_type_param VARCHAR,
  entity_id_param UUID,
  user_id_param UUID,
  description_param TEXT,
  metadata_param JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO activity_logs (activity_type, entity_type, entity_id, user_id, description, metadata)
  VALUES (activity_type_param, entity_type_param, entity_id_param, user_id_param, description_param, metadata_param)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark Attendance
CREATE OR REPLACE FUNCTION mark_attendance(
  emp_id UUID,
  attendance_date DATE,
  check_in_time TIMESTAMP,
  lat DECIMAL DEFAULT NULL,
  long DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  record_id UUID;
BEGIN
  INSERT INTO attendance_records (employee_id, date, check_in, location_lat, location_long, status)
  VALUES (emp_id, attendance_date, check_in_time, lat, long, 'PRESENT')
  ON CONFLICT (employee_id, date) 
  DO UPDATE SET check_in = check_in_time, location_lat = lat, location_long = long
  RETURNING id INTO record_id;
  
  RETURN record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate Leave Balance
CREATE OR REPLACE FUNCTION get_leave_balance(emp_id UUID, leave_type_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_days INTEGER;
  used_days DECIMAL;
BEGIN
  -- Get total days for leave type
  SELECT days_per_year INTO total_days FROM leave_types WHERE id = leave_type_id_param;
  
  -- Calculate used days for current year
  SELECT COALESCE(SUM(days_count), 0) INTO used_days
  FROM leave_requests
  WHERE employee_id = emp_id 
  AND leave_type_id = leave_type_id_param
  AND status = 'APPROVED'
  AND EXTRACT(YEAR FROM from_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT json_build_object(
    'totalDays', total_days,
    'usedDays', used_days,
    'remainingDays', total_days - used_days
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CREATE TRIGGERS FOR ACTIVITY LOGGING
-- =====================================================

-- Trigger function for employee creation
CREATE OR REPLACE FUNCTION log_employee_creation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_activity(
    'employee_added',
    'employee',
    NEW.id,
    NULL,
    'New employee added: ' || NEW.name,
    json_build_object('uan', NEW.uan, 'role', NEW.role, 'site_id', NEW.site_id)::JSONB
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_employee_creation ON employees;
CREATE TRIGGER trigger_log_employee_creation
  AFTER INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION log_employee_creation();

-- Trigger function for employee approval
CREATE OR REPLACE FUNCTION log_employee_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    PERFORM log_activity(
      'status_changed',
      'employee',
      NEW.id,
      NULL,
      'Employee status changed from ' || OLD.status || ' to ' || NEW.status,
      json_build_object('old_status', OLD.status, 'new_status', NEW.status, 'employee_name', NEW.name)::JSONB
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_employee_status_change ON employees;
CREATE TRIGGER trigger_log_employee_status_change
  AFTER UPDATE ON employees
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_employee_status_change();

-- =====================================================
-- 9. UPDATE RLS POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create development policies (replace with production policies later)
CREATE POLICY "job_roles_dev_all" ON job_roles FOR ALL USING (true);
CREATE POLICY "activity_logs_dev_all" ON activity_logs FOR ALL USING (true);
CREATE POLICY "attendance_dev_all" ON attendance_records FOR ALL USING (true);
CREATE POLICY "leave_types_dev_all" ON leave_types FOR ALL USING (true);
CREATE POLICY "leave_requests_dev_all" ON leave_requests FOR ALL USING (true);
CREATE POLICY "notifications_dev_all" ON notifications FOR ALL USING (true);

-- =====================================================
-- 10. CREATE VIEWS FOR REPORTING
-- =====================================================

-- View: Employee Overview with Site Details
CREATE OR REPLACE VIEW vw_employee_overview AS
SELECT 
  e.id,
  e.uan,
  e.name,
  e.mobile,
  e.role,
  e.status,
  e.joined_date,
  e.basic_salary,
  s.name as site_name,
  s.code as site_code,
  s.address as site_address,
  (SELECT COUNT(*) FROM attendance_records 
   WHERE employee_id = e.id 
   AND date >= CURRENT_DATE - INTERVAL '30 days'
   AND status = 'PRESENT') as attendance_last_30_days,
  (SELECT COUNT(*) FROM leave_requests 
   WHERE employee_id = e.id 
   AND status = 'PENDING') as pending_leave_requests
FROM employees e
LEFT JOIN sites s ON e.site_id = s.id;

-- View: Monthly Payroll Summary
CREATE OR REPLACE VIEW vw_monthly_payroll_summary AS
SELECT 
  s.name as site_name,
  TO_CHAR(MAKE_DATE(sr.year, CAST(sr.month AS INTEGER), 1), 'Month YYYY') as period,
  COUNT(*) as employee_count,
  SUM(sr.basic) as total_basic,
  SUM(sr.hra) as total_hra,
  SUM(sr.allowances) as total_allowances,
  SUM(sr.deductions) as total_deductions,
  SUM(sr.net_payable) as total_net_payable
FROM salary_records sr
LEFT JOIN sites s ON sr.site_id = s.id
GROUP BY s.name, sr.year, sr.month
ORDER BY sr.year DESC, sr.month DESC;

-- =====================================================
-- 11. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_employees_status_site ON employees(status, site_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_salary_records_month_year ON salary_records(month, year);
CREATE INDEX IF NOT EXISTS idx_salary_records_site ON salary_records(site_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the setup

-- 1. Check all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('job_roles', 'activity_logs', 'attendance_records', 'leave_types', 'leave_requests', 'notifications')
ORDER BY table_name;

-- 2. Check job roles
SELECT * FROM job_roles ORDER BY title;

-- 3. Test dashboard stats function
SELECT get_dashboard_stats_v2();

-- 4. Test site performance function
SELECT * FROM get_site_performance();

-- 5. Check recent activities
SELECT * FROM get_recent_activities(7);

COMMENT ON TABLE job_roles IS 'Stores job role definitions for employees';
COMMENT ON TABLE activity_logs IS 'Logs all system activities for audit trail';
COMMENT ON TABLE attendance_records IS 'Daily attendance tracking for employees';
COMMENT ON TABLE leave_types IS 'Defines different types of leaves available';
COMMENT ON TABLE leave_requests IS 'Employee leave requests and approval status';
COMMENT ON TABLE notifications IS 'System notifications for users';

-- Migration completed successfully!
SELECT 'HR Dashboard Enhancement Schema v2.0 Applied Successfully!' as status;
