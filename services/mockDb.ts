import { supabase } from './supabase';
import { Company, Employee, EmployeeStatus, SalaryRecord, Site, User, UserRole } from '../types';

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
  photoUrl: data.photo_url
});

const mapSite = (data: any): Site => ({
  id: data.id,
  name: data.name,
  code: data.code,
  address: data.address,
  inchargeId: data.incharge_id,
  employeeCount: data.employee_count
});

const mapSalary = (data: any): SalaryRecord => ({
  id: data.id,
  employeeId: data.employee_id,
  employeeName: data.employee_name || 'Unknown',
  uan: data.uan,
  month: data.month,
  year: data.year,
  basic: data.basic,
  hra: data.hra,
  allowances: data.allowances,
  deductions: data.deductions,
  netPayable: data.net_payable,
  paidDays: data.paid_days
});

const mapCompany = (data: any): Company => ({
  id: data.id,
  name: data.name,
  address: data.address,
  logoUrl: data.logo_url,
  faviconUrl: data.favicon_url,
  stampUrl: data.stamp_url,
  signatureUrl: data.signature_url
});

export const db = {
  // --- AUTH METHODS ---
  getUserById: async (id: string): Promise<User | null> => {
    // 1. Try Users Table (HR)
    const { data: uData } = await supabase.from('users').select('*').eq('id', id).single();
    if (uData) return { id: uData.id, name: uData.name, email: uData.email, role: UserRole.HR_ADMIN };

    // 2. Try Employees Table (Staff)
    const { data: eData } = await supabase.from('employees').select('*').eq('id', id).single();
    if (eData) {
      const role = eData.role.toLowerCase().includes('supervisor') || eData.role.toLowerCase().includes('safety officer')
        ? UserRole.SITE_INCHARGE
        : UserRole.EMPLOYEE;
      return { id: eData.id, name: eData.name, uan: eData.uan, role, siteId: eData.site_id };
    }
    return null;
  },

  loginHR: async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.rpc('hr_login', {
      p_email: email,
      p_password: password,
      p_client_ip: 'web-client'
    });

    if (!error && data) {
      const userRow = Array.isArray(data) ? data[0] : data;
      if (userRow) {
    // Normalize RPC result: handle both array and object shapes.
    const row = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);

    // If RPC succeeded and returned a row, use it.
    if (!error && row) {
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: UserRole.HR_ADMIN
      };
    }

    // If RPC succeeded but returned no rows, credentials are invalid.
    if (!error && !row) {
      return null;
    }

    // Fallback for old schema without RPC (e.g., function missing).
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'HR_ADMIN')
      .single();

    if (fallbackError || !fallbackData) return null;

    return {
      id: fallbackData.id,
      name: fallbackData.name,
      email: fallbackData.email,
      role: UserRole.HR_ADMIN
    };
  },

  loginUAN: async (uan: string): Promise<User | null> => {
    const { data, error } = await supabase.from('employees').select('*').eq('uan', uan).eq('status', 'APPROVED').single();
    if (error || !data) return null;
    const role = data.role.toLowerCase().includes('supervisor') || data.role.toLowerCase().includes('safety officer')
      ? UserRole.SITE_INCHARGE
      : UserRole.EMPLOYEE;
    return { id: data.id, name: data.name, uan: data.uan, role, siteId: data.site_id };
  },

  // --- DASHBOARD METHODS ---
  getStats: async () => {
    const [empRes, pendingRes, sitesRes, salaryRes] = await Promise.all([
      supabase.from('employees').select('id', { count: 'exact', head: true }).neq('status', 'INACTIVE'),
      supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('sites').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('salary_records').select('net_payable')
    ]);
    const totalPayroll = salaryRes.data?.reduce((acc, curr) => acc + (curr.net_payable || 0), 0) || 0;
    return {
      totalEmployees: empRes.count || 0,
      pendingApprovals: pendingRes.count || 0,
      activeSites: sitesRes.count || 0,
      totalPayroll: totalPayroll
    };
  },

  getSiteDistribution: async () => {
    const { data, error } = await supabase.from('sites').select('name, employee_count').eq('status', 'ACTIVE');
    if (error) return [];
    return data.map(s => ({ name: s.name || 'Unknown', employees: s.employee_count || 0 }));
  },

  // --- EMPLOYEE METHODS ---
  getEmployees: async (siteId?: string) => {
    let query = supabase.from('employees').select('*').neq('status', 'INACTIVE');
    if (siteId) query = query.eq('site_id', siteId);
    const { data, error } = await query;
    if (error) { console.error('Error fetching employees:', error); return []; }
    return data.map(mapEmployee);
  },

  addEmployee: async (data: Partial<Employee>) => {
    const { data: res, error } = await supabase.rpc('upsert_employee', {
      p_uan: data.uan,
      p_name: data.name,
      p_mobile: data.mobile,
      p_role: data.role,
      p_site_id: data.siteId,
      p_bank_name: data.bankName,
      p_account_number: data.accountNumber,
      p_ifsc: data.ifsc,
      p_photo_url: data.photoUrl,
      p_actor_id: null
    });

    if (!error && res) {
      const row = Array.isArray(res) ? res[0] : res;
      return mapEmployee(row);
    }

    const dbPayload = {
      uan: data.uan,
      name: data.name,
      mobile: data.mobile,
      role: data.role,
      site_id: data.siteId,
      status: 'PENDING',
      joined_date: new Date().toISOString().split('T')[0],
      bank_name: data.bankName,
      account_number: data.accountNumber,
      ifsc: data.ifsc
    };
    const { data: fallbackRes, error: fallbackError } = await supabase.from('employees').insert([dbPayload]).select().single();
    if (fallbackError) throw fallbackError;
    return mapEmployee(fallbackRes);
  },

  updateEmployeeStatus: async (id: string, status: EmployeeStatus) => {
    const { error } = await supabase.from('employees').update({ status }).eq('id', id);
    return !error;
  },

  // Soft Delete Employee
  deleteEmployee: async (id: string) => {
    const { error } = await supabase.from('employees').update({ status: 'INACTIVE' }).eq('id', id);
    return !error;
  },

  // --- SITE METHODS ---
  getSites: async () => {
    const { data, error } = await supabase.from('sites').select('*').eq('status', 'ACTIVE');
    if (error) return [];
    return data.map(mapSite);
  },

  addSite: async (site: Partial<Site>) => {
    const { error } = await supabase.from('sites').insert([{
      name: site.name,
      code: site.code,
      address: site.address,
      incharge_id: site.inchargeId,
      status: 'ACTIVE',
      employee_count: 0
    }]);
    return !error;
  },

  updateSite: async (id: string, site: Partial<Site>) => {
    const updates: any = {};
    if (site.name !== undefined) updates.name = site.name;
    if (site.code !== undefined) updates.code = site.code;
    if (site.address !== undefined) updates.address = site.address;
    if (site.inchargeId !== undefined) updates.incharge_id = site.inchargeId;

    const { error } = await supabase.from('sites').update(updates).eq('id', id);
    return !error;
  },

  deleteSite: async (id: string) => {
    const { error } = await supabase.from('sites').update({ status: 'INACTIVE' }).eq('id', id);
    return !error;
  },

  // --- SALARY & COMPANY ---
  getSalarySlip: async (uan: string, monthStr: string) => {
    const { data, error } = await supabase.from('salary_records').select('*').eq('uan', uan).eq('month', monthStr).single();
    if (error || !data) return undefined;
    return mapSalary(data);
  },

  getCompanyProfile: async (): Promise<Company | null> => {
    const { data } = await supabase.from('companies').select('*').limit(1).maybeSingle();

    if (!data) return { id: 'new_entry', name: 'HRM Portal', address: '', logoUrl: '', faviconUrl: '', stampUrl: '', signatureUrl: '' };
    return mapCompany(data);
  },

  updateCompanyProfile: async (id: string, updates: Partial<Company>) => {
    const dbPayload: any = {
      name: updates.name,
      address: updates.address,
      logo_url: updates.logoUrl,
      favicon_url: updates.faviconUrl,
      stamp_url: updates.stampUrl,
      signature_url: updates.signatureUrl
    };

    if (id === 'new_entry') {
      const { error } = await supabase.from('companies').insert([dbPayload]);
      return !error;
    }
    const { error } = await supabase.from('companies').update(dbPayload).eq('id', id);
    return !error;
  }
};
