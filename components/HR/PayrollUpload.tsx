import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';

type UploadStatus = 'pending' | 'success' | 'error';

type ParsedPayrollRow = {
  excelRow: number;
  uan: string;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  paidDays: number;
};

type PayrollReportRow = ParsedPayrollRow & {
  status: UploadStatus;
  message: string;
  employeeId?: string;
};

type SiteOption = {
  id: string;
  name: string;
};

const REQUIRED_COLUMNS = ['uan', 'basic', 'hra', 'allowances', 'deductions', 'paid_days'] as const;

const normalizeHeader = (header: string): string => {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const normalizeUan = (value: unknown): string => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length >= 12 ? digits.slice(-12) : digits.padStart(12, '0');
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : NaN;
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 8 }, (_, idx) => currentYear - idx);

const monthOptions = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const PayrollUpload = () => {
  const { showToast } = useToast();
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [siteId, setSiteId] = useState('');
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(currentYear));
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [reportRows, setReportRows] = useState<PayrollReportRow[]>([]);

  useEffect(() => {
    const fetchSites = async () => {
      const { data, error } = await supabase.from('sites').select('id, name').order('name');
      if (error) {
        showToast('Unable to load site list.', 'error');
        return;
      }
      setSites((data ?? []) as SiteOption[]);
      if (data?.length) {
        setSiteId((prev) => prev || data[0].id);
      }
    };

    fetchSites();
  }, [showToast]);

  const totals = useMemo(() => {
    const success = reportRows.filter((row) => row.status === 'success').length;
    const failed = reportRows.filter((row) => row.status === 'error').length;
    return { total: reportRows.length, success, failed };
  }, [reportRows]);

  const parseWorkbook = async (file: File): Promise<ParsedPayrollRow[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error('Workbook is empty.');
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false,
    });

    if (!rawRows.length) {
      throw new Error('No rows found in uploaded sheet.');
    }

    const firstRowHeaders = Object.keys(rawRows[0]).map(normalizeHeader);
    const missing = REQUIRED_COLUMNS.filter((column) => !firstRowHeaders.includes(column));
    if (missing.length > 0) {
      throw new Error(`Missing required column(s): ${missing.join(', ')}`);
    }

    const parsed: ParsedPayrollRow[] = [];

    rawRows.forEach((rawRow, idx) => {
      const normalizedRow = Object.entries(rawRow).reduce<Record<string, unknown>>((acc, [key, value]) => {
        acc[normalizeHeader(key)] = value;
        return acc;
      }, {});

      const excelRow = idx + 2;
      const uan = normalizeUan(normalizedRow.uan);
      const basic = toNumber(normalizedRow.basic);
      const hra = toNumber(normalizedRow.hra);
      const allowances = toNumber(normalizedRow.allowances);
      const deductions = toNumber(normalizedRow.deductions);
      const paidDays = toNumber(normalizedRow.paid_days);

      const hasValidNumbers = [basic, hra, allowances, deductions, paidDays].every(
        (value) => Number.isFinite(value) && value >= 0,
      );

      if (!uan || uan.length !== 12 || !hasValidNumbers) {
        return;
      }

      parsed.push({
        excelRow,
        uan,
        basic,
        hra,
        allowances,
        deductions,
        paidDays,
      });
    });

    return parsed;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!siteId) {
      showToast('Please select a site before uploading payroll.', 'info');
      return;
    }

    setIsUploading(true);
    setFileName(file.name);
    setReportRows([]);

    try {
      const parsedRows = await parseWorkbook(file);
      if (!parsedRows.length) {
        showToast('No valid payroll rows found. Check UAN and numeric values.', 'error');
        return;
      }

      const uans = [...new Set(parsedRows.map((row) => row.uan))];
      const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('id, uan')
        .in('uan', uans);

      if (employeeError) {
        throw new Error(employeeError.message);
      }

      const employeeByUan = new Map(
        (employees ?? []).map((employee: { id: string; uan: string }) => [normalizeUan(employee.uan), employee.id]),
      );

      const initialReport: PayrollReportRow[] = parsedRows.map((row) => {
        const employeeId = employeeByUan.get(row.uan);
        if (!employeeId) {
          return {
            ...row,
            status: 'error',
            message: 'Employee not found for UAN.',
          };
        }

        return {
          ...row,
          employeeId,
          status: 'pending',
          message: 'Ready to import',
        };
      });

      const report = [...initialReport];
      const rowsToUpload = report.filter((row) => row.status === 'pending' && row.employeeId);

      const BATCH_SIZE = 50;
      for (let i = 0; i < rowsToUpload.length; i += BATCH_SIZE) {
        const batch = rowsToUpload.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (row) => {
            const payload = {
              employee_id: row.employeeId,
              site_id: siteId,
              month,
              year: Number(year),
              uan: row.uan,
              basic: row.basic,
              hra: row.hra,
              allowances: row.allowances,
              deductions: row.deductions,
              paid_days: row.paidDays,
              net_payable: row.basic + row.hra + row.allowances - row.deductions,
            };

            const { error } = await supabase.rpc('upsert_salary', payload);
            return {
              excelRow: row.excelRow,
              success: !error,
              errorMessage: error?.message,
            };
          }),
        );

        batchResults.forEach((result) => {
          const index = report.findIndex((row) => row.excelRow === result.excelRow);
          if (index === -1) return;

          report[index] = {
            ...report[index],
            status: result.success ? 'success' : 'error',
            message: result.success ? 'Imported successfully.' : result.errorMessage || 'RPC failed.',
          };
        });
      }

      setReportRows(report);
      showToast(`Payroll import processed: ${report.length} rows.`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error during payroll import.';
      showToast(message, 'error');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Payroll Import</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Upload monthly payroll workbook and sync salaries using UAN mapping.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Site</label>
            <select
              value={siteId}
              onChange={(event) => setSiteId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white px-3 py-2"
            >
              <option value="">Select site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Month</label>
            <select
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white px-3 py-2"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Year</label>
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white px-3 py-2"
            >
              {years.map((yearOption) => (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl px-6 py-8 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
          {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
          <span className="font-medium">{isUploading ? 'Processing workbook...' : 'Upload .xlsx payroll file'}</span>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            disabled={isUploading}
            onChange={handleFileUpload}
          />
        </label>

        {fileName && (
          <div className="mt-4 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <FileSpreadsheet size={16} />
            <span>{fileName}</span>
          </div>
        )}
      </div>

      {reportRows.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <p className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">Total Rows</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{totals.total}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 rounded-xl p-4">
              <p className="text-xs uppercase font-semibold text-green-700 dark:text-green-300">Successful</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{totals.success}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl p-4">
              <p className="text-xs uppercase font-semibold text-red-700 dark:text-red-300">Failed</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{totals.failed}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <AlertTriangle size={16} /> Row-Level Import Report
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Sheet Row</th>
                    <th className="px-4 py-3 text-left">UAN</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {reportRows.map((row) => (
                    <tr key={`${row.excelRow}-${row.uan}`}>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{row.excelRow}</td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">{row.uan}</td>
                      <td className="px-4 py-3">
                        {row.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 size={14} /> Success
                          </span>
                        ) : row.status === 'error' ? (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                            <XCircle size={14} /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <Loader2 size={14} className="animate-spin" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
