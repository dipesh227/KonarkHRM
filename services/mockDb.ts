import { supabase } from "./supabase";
import {
  Company,
  Employee,
  EmployeeStatus,
  SalaryRecord,
  Site,
  User,
  UserRole,
  JobRole,
  AttendanceRecord,
  LeaveType,
  LeaveRequest,
  ActivityLog,
  Notification,
  DashboardStats,
  SitePerformance,
} from "../types";

// Helper to map DB columns (snake_case) to App types (camelCase)
const mapEmployee = (data: any): Employee => ({
  id: data.id,
  uan: data.uan,
  name: data.name,
  mobile: data.mobile,
  role: data.role,
  siteId: data.site_id,
  status: data.status as EmployeeStatus,
  joinedDate: data.joined_date,
  bankName: data.bank_name,
  accountNumber: data.account_number,
  ifsc: data.ifsc,
  basicSalary: data.basic_salary,
  photoUrl: data.photo_url,
});

const mapSite = (data: any): Site => ({
  id: data.id,
  name: data.name,
  code: data.code,
  address: data.address,
  inchargeId: data.incharge_id,
  employeeCount: data.employee_count,
});

const mapSalary = (data: any): SalaryRecord => ({
  id: data.id,
  employeeId: data.employee_id,
  employeeName: data.employee_name || "Unknown",
  uan: data.uan,
  month: data.month,
  year: data.year,
  basic: data.basic,
  hra: data.hra,
  allowances: data.allowances,
  deductions: data.deductions,
  netPayable: data.net_payable,
  paidDays: data.paid_days,
});

const mapCompany = (data: any): Company => ({
  id: data.id,
  name: data.name, // Ensure this is mapped directly as string
  address: data.address, // Ensure this is mapped directly as string
  logoUrl: data.logo_url,
  faviconUrl: data.favicon_url,
  stampUrl: data.stamp_url,
  signatureUrl: data.signature_url,
});

export const db = {
  // --- AUTH METHODS ---
  getUserById: async (id: string): Promise<User | null> => {
    // 1. Try Users Table (HR)
    const { data: uData } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (uData)
      return {
        id: uData.id,
        name: uData.name,
        email: uData.email,
        role: UserRole.HR_ADMIN,
      };

    // 2. Try Employees Table (Staff)
    const { data: eData } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();
    if (eData) {
      const role = eData.role.toLowerCase().includes("supervisor")
        ? UserRole.SITE_INCHARGE
        : UserRole.EMPLOYEE;
      return {
        id: eData.id,
        name: eData.name,
        uan: eData.uan,
        role,
        siteId: eData.site_id,
      };
    }
    return null;
  },

  loginHR: async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("role", "HR_ADMIN")
      .single();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: UserRole.HR_ADMIN,
    };
  },

  loginUAN: async (uan: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("uan", uan)
      .eq("status", "APPROVED")
      .single();
    if (error || !data) return null;
    const role = data.role.toLowerCase().includes("supervisor")
      ? UserRole.SITE_INCHARGE
      : UserRole.EMPLOYEE;
    return {
      id: data.id,
      name: data.name,
      uan: data.uan,
      role,
      siteId: data.site_id,
    };
  },

  // --- DASHBOARD METHODS ---
  getStats: async () => {
    const [empRes, pendingRes, sitesRes, salaryRes] = await Promise.all([
      supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .neq("status", "INACTIVE"),
      supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("status", "PENDING"),
      supabase
        .from("sites")
        .select("id", { count: "exact", head: true })
        .eq("status", "ACTIVE"),
      supabase.from("salary_records").select("net_payable"),
    ]);
    const totalPayroll =
      salaryRes.data?.reduce((acc, curr) => acc + (curr.net_payable || 0), 0) ||
      0;
    return {
      totalEmployees: empRes.count || 0,
      pendingApprovals: pendingRes.count || 0,
      activeSites: sitesRes.count || 0,
      totalPayroll: totalPayroll,
    };
  },

  getSiteDistribution: async () => {
    const { data, error } = await supabase
      .from("sites")
      .select("name, employee_count")
      .eq("status", "ACTIVE");
    if (error) return [];
    return data.map((s) => ({
      name: s.name || "Unknown",
      employees: s.employee_count || 0,
    }));
  },

  // Get pending employee approvals
  getPendingApprovals: async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*, sites!inner(name)")
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) return [];
    return data.map((emp: any) => ({
      id: emp.id,
      name: emp.name,
      uan: emp.uan,
      role: emp.role,
      mobile: emp.mobile,
      siteId: emp.site_id,
      siteName: emp.sites?.name || "Unknown Site",
      createdAt: emp.created_at,
    }));
  },

  // Get recent activities (employees added/approved in last 7 days)
  getRecentActivities: async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("employees")
      .select("*, sites!inner(name)")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(15);

    if (error) return [];

    return data.map((emp: any) => ({
      id: emp.id,
      name: emp.name,
      uan: emp.uan,
      role: emp.role,
      status: emp.status,
      siteName: emp.sites?.name || "Unknown Site",
      createdAt: emp.created_at,
      updatedAt: emp.updated_at,
      action:
        emp.status === "APPROVED"
          ? "Approved"
          : emp.status === "PENDING"
            ? "Added"
            : "Updated",
    }));
  },

  // --- EMPLOYEE METHODS ---
  getEmployees: async (siteId?: string) => {
    let query = supabase
      .from("employees")
      .select("*")
      .neq("status", "INACTIVE");
    if (siteId) query = query.eq("site_id", siteId);
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
    return data.map(mapEmployee);
  },

  addEmployee: async (data: Partial<Employee>) => {
    const dbPayload = {
      uan: data.uan,
      name: data.name,
      mobile: data.mobile,
      role: data.role,
      site_id: data.siteId,
      status: "PENDING",
      joined_date: new Date().toISOString().split("T")[0],
      bank_name: data.bankName,
      account_number: data.accountNumber,
      ifsc: data.ifsc,
    };
    const { data: res, error } = await supabase
      .from("employees")
      .insert([dbPayload])
      .select()
      .single();
    if (error) throw error;
    return mapEmployee(res);
  },

  updateEmployee: async (id: string, data: Partial<Employee>) => {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.mobile !== undefined) updates.mobile = data.mobile;
    if (data.role !== undefined) updates.role = data.role;
    if (data.siteId !== undefined) updates.site_id = data.siteId;
    if (data.bankName !== undefined) updates.bank_name = data.bankName;
    if (data.accountNumber !== undefined)
      updates.account_number = data.accountNumber;
    if (data.ifsc !== undefined) updates.ifsc = data.ifsc;
    if (data.basicSalary !== undefined) updates.basic_salary = data.basicSalary;

    const { error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id);
    return !error;
  },

  updateEmployeeStatus: async (id: string, status: EmployeeStatus) => {
    const { error } = await supabase
      .from("employees")
      .update({ status: status })
      .eq("id", id);
    return !error;
  },

  // Soft Delete Employee
  deleteEmployee: async (id: string) => {
    const { error } = await supabase
      .from("employees")
      .update({ status: "INACTIVE" })
      .eq("id", id);
    return !error;
  },

  // --- SITE METHODS ---
  getSites: async () => {
    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .eq("status", "ACTIVE");
    if (error) return [];
    return data.map(mapSite);
  },

  addSite: async (site: Partial<Site>) => {
    const { error } = await supabase.from("sites").insert([
      {
        name: site.name,
        code: site.code,
        address: site.address,
        incharge_id: site.inchargeId,
        status: "ACTIVE",
        employee_count: 0,
      },
    ]);
    return !error;
  },

  updateSite: async (id: string, site: Partial<Site>) => {
    // Dynamically construct update payload to only include defined fields
    const updates: any = {};
    if (site.name !== undefined) updates.name = site.name;
    if (site.code !== undefined) updates.code = site.code;
    if (site.address !== undefined) updates.address = site.address;
    if (site.inchargeId !== undefined) updates.incharge_id = site.inchargeId;

    const { error } = await supabase.from("sites").update(updates).eq("id", id);
    return !error;
  },

  // Soft Delete Site
  deleteSite: async (id: string) => {
    const { error } = await supabase
      .from("sites")
      .update({ status: "INACTIVE" })
      .eq("id", id);
    return !error;
  },

  // --- SALARY & COMPANY ---
  getSalarySlip: async (uan: string, monthStr: string) => {
    const { data, error } = await supabase
      .from("salary_records")
      .select("*")
      .eq("uan", uan)
      .eq("month", monthStr)
      .single();
    if (error || !data) return undefined;
    return mapSalary(data);
  },

  getCompanyProfile: async (): Promise<Company | null> => {
    // Plain text fetch - No decryption
    const { data } = await supabase
      .from("companies")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!data)
      return {
        id: "new_entry",
        name: "HRM Portal",
        address: "",
        logoUrl: "",
        faviconUrl: "",
        stampUrl: "",
        signatureUrl: "",
      };
    return mapCompany(data);
  },

  updateCompanyProfile: async (id: string, updates: Partial<Company>) => {
    // Plain text update - No encryption
    const dbPayload: any = {
      name: updates.name,
      address: updates.address,
      logo_url: updates.logoUrl,
      favicon_url: updates.faviconUrl,
      stamp_url: updates.stampUrl,
      signature_url: updates.signatureUrl,
    };

    if (id === "new_entry") {
      const { error } = await supabase.from("companies").insert([dbPayload]);
      return !error;
    }
    const { error } = await supabase
      .from("companies")
      .update(dbPayload)
      .eq("id", id);
    return !error;
  },

  // ===== JOB ROLES =====
  getJobRoles: async (): Promise<JobRole[]> => {
    const { data, error } = await supabase
      .from("job_roles")
      .select("*")
      .order("title");

    if (error) {
      console.error("Error fetching job roles:", error);
      return [];
    }

    return data.map((role: any) => ({
      id: role.id,
      title: role.title,
      description: role.description,
      isSystemDefault: role.is_system_default,
      createdAt: role.created_at,
    }));
  },

  addJobRole: async (title: string, description?: string): Promise<boolean> => {
    const { error } = await supabase
      .from("job_roles")
      .insert([{ title, description, is_system_default: false }]);

    if (error) {
      console.error("Error adding job role:", error);
      throw new Error(error.message);
    }
    return true;
  },

  deleteJobRole: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from("job_roles")
      .delete()
      .eq("id", id)
      .eq("is_system_default", false); // Only delete non-system roles

    if (error) {
      console.error("Error deleting job role:", error);
      throw new Error(error.message);
    }
    return true;
  },

  // ===== ATTENDANCE =====
  markAttendance: async (
    employeeId: string,
    date: string,
    checkIn: string,
    lat?: number,
    long?: number,
  ): Promise<boolean> => {
    const { data, error } = await supabase.rpc("mark_attendance", {
      emp_id: employeeId,
      attendance_date: date,
      check_in_time: checkIn,
      lat: lat,
      long: long,
    });

    if (error) {
      console.error("Error marking attendance:", error);
      return false;
    }
    return true;
  },

  getAttendanceRecords: async (
    employeeId?: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<AttendanceRecord[]> => {
    let query = supabase.from("attendance_records").select("*");

    if (employeeId) query = query.eq("employee_id", employeeId);
    if (fromDate) query = query.gte("date", fromDate);
    if (toDate) query = query.lte("date", toDate);

    const { data, error } = await query.order("date", { ascending: false });

    if (error) {
      console.error("Error fetching attendance:", error);
      return [];
    }

    return data.map((record: any) => ({
      id: record.id,
      employeeId: record.employee_id,
      date: record.date,
      checkIn: record.check_in,
      checkOut: record.check_out,
      status: record.status,
      hoursWorked: record.hours_worked,
      overtimeHours: record.overtime_hours,
      locationLat: record.location_lat,
      locationLong: record.location_long,
      notes: record.notes,
    }));
  },

  getTodayAttendance: async (): Promise<number> => {
    const today = new Date().toISOString().split("T")[0];
    const { count, error } = await supabase
      .from("attendance_records")
      .select("*", { count: "exact", head: true })
      .eq("date", today)
      .eq("status", "PRESENT");

    if (error) return 0;
    return count || 0;
  },

  // ===== LEAVE MANAGEMENT =====
  getLeaveTypes: async (): Promise<LeaveType[]> => {
    const { data, error } = await supabase
      .from("leave_types")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching leave types:", error);
      return [];
    }

    return data.map((type: any) => ({
      id: type.id,
      name: type.name,
      description: type.description,
      daysPerYear: type.days_per_year,
      isPaid: type.is_paid,
      carryForward: type.carry_forward,
    }));
  },

  getLeaveRequests: async (
    status?: string,
    employeeId?: string,
  ): Promise<any[]> => {
    let query = supabase
      .from("leave_requests")
      .select("*, employees(name, uan), leave_types(name)");

    if (status) query = query.eq("status", status);
    if (employeeId) query = query.eq("employee_id", employeeId);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching leave requests:", error);
      return [];
    }

    return data;
  },

  submitLeaveRequest: async (
    employeeId: string,
    leaveTypeId: string,
    fromDate: string,
    toDate: string,
    reason: string,
  ): Promise<boolean> => {
    // Calculate days
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const days =
      Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const { error } = await supabase.from("leave_requests").insert([
      {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        from_date: fromDate,
        to_date: toDate,
        days_count: days,
        reason: reason,
        status: "PENDING",
      },
    ]);

    if (error) {
      console.error("Error submitting leave request:", error);
      return false;
    }
    return true;
  },

  approveLeaveRequest: async (
    requestId: string,
    userId: string,
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: "APPROVED",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      console.error("Error approving leave:", error);
      return false;
    }
    return true;
  },

  rejectLeaveRequest: async (
    requestId: string,
    userId: string,
    reason: string,
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: "REJECTED",
        approved_by: userId,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq("id", requestId);

    if (error) {
      console.error("Error rejecting leave:", error);
      return false;
    }
    return true;
  },

  getLeaveBalance: async (
    employeeId: string,
    leaveTypeId: string,
  ): Promise<any> => {
    const { data, error } = await supabase.rpc("get_leave_balance", {
      emp_id: employeeId,
      leave_type_id_param: leaveTypeId,
    });

    if (error) {
      console.error("Error getting leave balance:", error);
      return { totalDays: 0, usedDays: 0, remainingDays: 0 };
    }
    return data;
  },

  // ===== ENHANCED DASHBOARD =====
  getEnhancedStats: async (): Promise<DashboardStats> => {
    const { data, error } = await supabase.rpc("get_dashboard_stats_v2");

    if (error) {
      console.error("Error fetching enhanced stats:", error);
      // Fallback to basic stats
      return db.getStats();
    }

    return data;
  },

  getSitePerformance: async (): Promise<SitePerformance[]> => {
    const { data, error } = await supabase.rpc("get_site_performance");

    if (error) {
      console.error("Error fetching site performance:", error);
      return [];
    }

    return data.map((site: any) => ({
      siteId: site.site_id,
      siteName: site.site_name,
      employeeCount: site.employee_count,
      avgAttendanceRate: parseFloat(site.avg_attendance_rate || 0),
      totalPayroll: parseFloat(site.total_payroll || 0),
      pendingApprovals: site.pending_approvals,
    }));
  },

  getActivityLogs: async (limit: number = 20): Promise<ActivityLog[]> => {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching activity logs:", error);
      return [];
    }

    return data.map((log: any) => ({
      id: log.id,
      activityType: log.activity_type,
      entityType: log.entity_type,
      entityId: log.entity_id,
      userId: log.user_id,
      description: log.description,
      metadata: log.metadata,
      createdAt: log.created_at,
    }));
  },

  // ===== NOTIFICATIONS =====
  getNotifications: async (userId?: string): Promise<Notification[]> => {
    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    return data.map((notif: any) => ({
      id: notif.id,
      userId: notif.user_id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      link: notif.link,
      isRead: notif.is_read,
      createdAt: notif.created_at,
    }));
  },

  markNotificationAsRead: async (notificationId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
    return true;
  },

  createNotification: async (
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
    userId?: string,
    link?: string,
  ): Promise<boolean> => {
    const { error } = await supabase.from("notifications").insert([
      {
        user_id: userId,
        title,
        message,
        type,
        link,
      },
    ]);

    if (error) {
      console.error("Error creating notification:", error);
      return false;
    }
    return true;
  },
};

// Export individual service for convenience
export const dbService = db;
