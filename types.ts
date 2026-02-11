export enum UserRole {
  HR_ADMIN = 'HR_ADMIN',
  SITE_INCHARGE = 'SITE_INCHARGE',
  EMPLOYEE = 'EMPLOYEE'
}

export enum EmployeeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
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