export enum UserRole {
  HR_ADMIN = "HR_ADMIN",
  SITE_INCHARGE = "SITE_INCHARGE",
  EMPLOYEE = "EMPLOYEE",
}

export enum EmployeeStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface User {
  id: string;
  email?: string;
  uan?: string;
  name: string;
  role: UserRole;
  siteId?: string; // If linked to a specific site
}

export interface Site {
  id: string;
  name: string;
  code: string;
  address: string;
  inchargeId?: string;
  employeeCount: number;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  logoUrl?: string;
  faviconUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
}

export interface Employee {
  id: string; // internal ID
  uan: string; // 12 digit
  name: string;
  mobile: string;
  role: string; // Job Role (e.g., Helper, Supervisor)
  siteId: string;
  status: EmployeeStatus;
  joinedDate: string;

  // Financial
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  basicSalary?: number;

  // Personal Details (Enhanced)
  emergencyContact?: string;
  emergencyContactName?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  address?: string;
  aadhaar?: string;
  pan?: string;

  // Documents (Base64 placeholders)
  photoUrl?: string;
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  uan: string;
  month: string; // "MM-YYYY"
  year: number;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  netPayable: number;
  paidDays: number;
}

export interface JobRole {
  id: string;
  title: string;
  description?: string;
  isSystemDefault: boolean;
  createdAt?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | "HOLIDAY";
  hoursWorked?: number;
  overtimeHours?: number;
  locationLat?: number;
  locationLong?: number;
  notes?: string;
}

export interface LeaveType {
  id: string;
  name: string;
  description?: string;
  daysPerYear: number;
  isPaid: boolean;
  carryForward: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  daysCount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
}

export interface ActivityLog {
  id: string;
  activityType: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalEmployees: number;
  pendingApprovals: number;
  activeSites: number;
  totalPayroll: number;
  todayAttendance?: number;
  pendingLeaves?: number;
  activeEmployeesThisMonth?: number;
  avgHoursWorked?: number;
}

export interface SitePerformance {
  siteId: string;
  siteName: string;
  employeeCount: number;
  avgAttendanceRate: number;
  totalPayroll: number;
  pendingApprovals: number;
}
