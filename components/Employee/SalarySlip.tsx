import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../services/mockDb';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { SalaryRecord } from '../../types';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);

const numberToWords = (value: number): string => {
  const rupees = Math.floor(value);
  const paise = Math.round(value * 100) % 100;
  
  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (n: number): string => {
    if (n < 20) return units[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${units[n % 10]}` : ''}`;
  };

  const threeDigits = (n: number): string => {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return `${hundred ? `${units[hundred]} Hundred${rest ? ' ' : ''}` : ''}${rest ? twoDigits(rest) : ''}`.trim();
  };

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundredPart = rupees % 1000;

  const parts = [
    crore ? `${threeDigits(crore)} Crore` : '',
    lakh ? `${threeDigits(lakh)} Lakh` : '',
    thousand ? `${threeDigits(thousand)} Thousand` : '',
    hundredPart ? threeDigits(hundredPart) : ''
  ].filter(Boolean);

  let result = rupees > 0 ? `${parts.join(' ')} Rupees` : '';
  
  if (paise > 0) {
    result += rupees > 0 ? ' and ' : '';
    result += `${twoDigits(paise)} Paise`;
  }
  
  return `${result} Only`;
};

export const SalarySlip = () => {
  const { user } = useAuth();
  const { company, loading: companyLoading } = useCompany();
  const [record, setRecord] = useState<SalaryRecord | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  });
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const start = new Date();
    start.setMonth(start.getMonth() - 11);

    for (let i = 11; i >= 0; i -= 1) {
      const date = new Date(start);
      date.setMonth(start.getMonth() + i);
      const value = `${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
      const label = date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }

    return options;
  }, []);

  useEffect(() => {
    const fetchSalary = async () => {
      if (user?.uan) {
        setLoadingSalary(true);
        const salaryData = await db.getSalarySlip(user.uan, month);
        setRecord(salaryData || null);
        setLoadingSalary(false);
      }
    };
    fetchSalary();
  }, [user, month]);

  const handleDownload = async () => {
    const element = document.getElementById('payslip-container');
    if (!element || !record) return;

    setGeneratingPdf(true);
    await new Promise(r => setTimeout(r, 350));

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${month}_${user?.uan}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (companyLoading || loadingSalary) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p>Loading salary records...</p>
      </div>
    );
  }

  if (!company) {
    return <div className="p-8 text-center">System Configuration Error. Please contact HR.</div>;
  }

  if (!record) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="p-2 border rounded focus:ring-brand-blue bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600"
          >
            {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="bg-white dark:bg-slate-800 p-12 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Salary Record Found</h3>
          <p className="text-slate-500 dark:text-slate-400">Slip generation is pending for {month}.</p>
        </div>
      </div>
    );
  }

  const gross = record.basic + record.hra + record.allowances;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="p-2 border rounded focus:ring-brand-blue bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600 outline-none"
        >
          {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <button
          onClick={handleDownload}
          disabled={generatingPdf}
          className="flex items-center gap-2 bg-brand-blue text-white px-6 py-2 rounded shadow hover:bg-blue-800 disabled:opacity-70 transition-colors"
        >
          {generatingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          <span>{generatingPdf ? 'Generating PDF...' : 'Download A4 PDF'}</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xl">
        <div id="payslip-container" className="bg-white text-slate-900 p-10 relative w-[210mm] min-h-[297mm] mx-auto">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none overflow-hidden">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt="Watermark" className="w-[75%] grayscale object-contain" />
            ) : (
              <h1 className="text-8xl font-bold transform -rotate-45 whitespace-nowrap">{company.name}</h1>
            )}
          </div>

          <header className="relative z-10 border-b-2 border-brand-blue pb-6 mb-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-4">
                {company.logoUrl && <img src={company.logoUrl} alt="Logo" className="h-16 w-16 object-contain" />}
                <div>
                  <h1 className="text-3xl font-display font-bold uppercase tracking-wide">{company.name}</h1>
                  <p className="text-sm text-slate-600">{company.address}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-slate-500">Document</p>
                <p className="text-xl font-bold text-brand-blue">Salary Slip</p>
                <p className="text-sm text-slate-600">Period: {month}</p>
              </div>
            </div>
          </header>

          <section className="relative z-10 grid grid-cols-2 gap-x-8 gap-y-4 mb-6 text-sm">
            <div><p className="text-slate-500">Employee Name</p><p className="font-semibold text-base">{record.employeeName}</p></div>
            <div><p className="text-slate-500">UAN</p><p className="font-semibold font-mono text-base">{record.uan}</p></div>
            <div><p className="text-slate-500">Year</p><p className="font-semibold">{record.year}</p></div>
            <div><p className="text-slate-500">Paid Days</p><p className="font-semibold">{record.paidDays}</p></div>
          </section>

          <table className="w-full text-sm mb-6 border border-slate-200 relative z-10">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left uppercase text-xs tracking-wider">Component</th>
                <th className="p-3 text-right uppercase text-xs tracking-wider">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t"><td className="p-3">Basic Salary</td><td className="p-3 text-right font-mono">{formatCurrency(record.basic)}</td></tr>
              <tr className="border-t"><td className="p-3">House Rent Allowance (HRA)</td><td className="p-3 text-right font-mono">{formatCurrency(record.hra)}</td></tr>
              <tr className="border-t"><td className="p-3">Other Allowances</td><td className="p-3 text-right font-mono">{formatCurrency(record.allowances)}</td></tr>
              <tr className="border-t bg-blue-50"><td className="p-3 font-semibold">Gross Earnings (A)</td><td className="p-3 text-right font-mono font-semibold">{formatCurrency(gross)}</td></tr>
              <tr className="border-t"><td className="p-3">PF + Tax Deductions</td><td className="p-3 text-right font-mono text-red-600">{formatCurrency(record.deductions)}</td></tr>
              <tr className="border-t bg-red-50"><td className="p-3 font-semibold">Total Deductions (B)</td><td className="p-3 text-right font-mono font-semibold text-red-700">{formatCurrency(record.deductions)}</td></tr>
            </tbody>
          </table>

          <section className="relative z-10 bg-brand-blue text-white rounded-xl p-5 mb-5 flex justify-between items-end">
            <div>
              <p className="text-xs uppercase tracking-widest text-blue-100">Net Payable (A - B)</p>
              <p className="text-4xl font-display font-bold">₹{formatCurrency(record.netPayable)}</p>
            </div>
            <p className="text-xs text-blue-100 max-w-xs text-right">Transferred to registered bank account as per payroll cycle.</p>
          </section>

          <section className="relative z-10 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-12">
            <p className="text-xs uppercase text-slate-500 tracking-wider">Amount in words</p>
            <p className="font-semibold text-slate-800">{numberToWords(record.netPayable)}</p>
          </section>

          <footer className="relative z-10 flex justify-between items-end border-t border-slate-200 pt-6">
            <div className="text-xs text-slate-500">
              <p className="font-semibold text-slate-700">System Generated Salary Statement</p>
              <p>Generated on: {new Date().toLocaleString('en-IN')}</p>
            </div>

            <div className="text-center">
              <div className="h-20 w-40 relative mb-2 flex items-center justify-center">
                {company.stampUrl && (
                  <img src={company.stampUrl} alt="Stamp" className="absolute h-20 w-20 object-contain opacity-75 rotate-[-12deg]" />
                )}
                {company.signatureUrl && (
                  <img src={company.signatureUrl} alt="Authorized Signature" className="h-14 w-28 object-contain relative z-10" />
                )}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest border-t border-slate-300 pt-2 px-6">Authorized Signatory</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
