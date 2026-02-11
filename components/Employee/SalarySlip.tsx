import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { SalaryRecord } from '../../types';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const SalarySlip = () => {
  const { user } = useAuth();
  const { company, loading: companyLoading } = useCompany();
  const [record, setRecord] = useState<SalaryRecord | null>(null);
  const [month, setMonth] = useState('10-2023');
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

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
    if (element) {
      setGeneratingPdf(true);
      // Small delay to ensure rendering is stable before capture
      await new Promise(r => setTimeout(r, 500));
      
      try {
        const canvas = await html2canvas(element, { 
          scale: 2, // High resolution
          useCORS: true, // Handle images properly
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Payslip_${month}_${user?.uan}.pdf`);
      } catch (error) {
        console.error("PDF Generation failed", error);
        alert("Failed to generate PDF. Please try again.");
      } finally {
        setGeneratingPdf(false);
      }
    }
  };

  if (companyLoading || loadingSalary) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p>Retrieving secure records...</p>
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
            value={month} onChange={e => setMonth(e.target.value)}
            className="p-2 border rounded focus:ring-brand-blue bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600"
          >
            <option value="10-2023">October 2023</option>
            <option value="09-2023">September 2023</option>
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <select 
          value={month} onChange={e => setMonth(e.target.value)}
          className="p-2 border rounded focus:ring-brand-blue bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600 outline-none"
        >
          <option value="10-2023">October 2023</option>
          <option value="09-2023">September 2023</option>
        </select>
        <button 
          onClick={handleDownload} 
          disabled={generatingPdf}
          className="flex items-center gap-2 bg-brand-blue text-white px-6 py-2 rounded shadow hover:bg-blue-800 disabled:opacity-70 transition-colors"
        >
          {generatingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          <span>{generatingPdf ? 'Generating...' : 'Download PDF'}</span>
        </button>
      </div>

      {/* Payslip Canvas - Light Mode Force for Printing */}
      <div className="overflow-x-auto">
        <div id="payslip-container" className="bg-white text-slate-900 p-8 shadow-2xl border border-slate-200 relative w-[210mm] min-h-[297mm] mx-auto">
          
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt="Watermark" className="w-[80%] grayscale object-contain" />
            ) : (
              <h1 className="text-9xl font-bold transform -rotate-45 whitespace-nowrap">{company.name}</h1>
            )}
          </div>

          {/* Header */}
          <div className="border-b-4 border-brand-blue pb-6 mb-8 flex justify-between items-start relative z-10">
            <div className="flex gap-6 items-center">
              {company.logoUrl && (
                <img src={company.logoUrl} alt="Logo" className="h-24 w-24 object-contain" />
              )}
              <div>
                <h1 className="text-4xl font-display font-bold text-brand-blue uppercase tracking-tight">{company.name}</h1>
                <p className="text-sm text-slate-600 max-w-sm mt-1 leading-relaxed">{company.address}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-widest">Payslip</h2>
              <div className="mt-2 inline-block bg-brand-red text-white px-4 py-1 font-bold text-lg rounded-sm shadow-sm">
                {month}
              </div>
            </div>
          </div>

          {/* Employee Details Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-12 text-sm mb-8 bg-slate-50 p-6 rounded-lg border border-slate-200 relative z-10">
            <div className="border-b border-slate-200 pb-2">
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Employee Name</p>
              <p className="font-bold text-lg text-slate-800">{record.employeeName}</p>
            </div>
            <div className="border-b border-slate-200 pb-2">
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">UAN Number</p>
              <p className="font-bold text-lg font-mono text-slate-800">{record.uan}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Designation</p>
              <p className="font-bold text-slate-800">Helper / Field Staff</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Paid Days</p>
              <p className="font-bold text-slate-800">{record.paidDays} Days</p>
            </div>
          </div>

          {/* Financial Table */}
          <table className="w-full text-sm mb-10 border-collapse relative z-10">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="p-4 text-left w-1/2 uppercase tracking-wider text-xs font-bold border-r border-slate-600">Earnings</th>
                <th className="p-4 text-right w-1/2 uppercase tracking-wider text-xs font-bold">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="border border-slate-300">
              <tr className="border-b border-slate-200">
                <td className="p-4 border-r border-slate-200 font-medium">Basic Salary</td>
                <td className="p-4 text-right font-mono">{record.basic.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-4 border-r border-slate-200 font-medium">House Rent Allowance (HRA)</td>
                <td className="p-4 text-right font-mono">{record.hra.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-4 border-r border-slate-200 font-medium">Other Allowances</td>
                <td className="p-4 text-right font-mono">{record.allowances.toFixed(2)}</td>
              </tr>
              <tr className="bg-slate-50 font-bold border-b border-slate-300">
                <td className="p-4 border-r border-slate-300">Gross Earnings (A)</td>
                <td className="p-4 text-right font-mono">{(record.basic + record.hra + record.allowances).toFixed(2)}</td>
              </tr>
              
              <tr className="bg-slate-800 text-white">
                <th className="p-4 text-left border-r border-slate-600 uppercase tracking-wider text-xs font-bold">Deductions</th>
                <th className="p-4 text-right uppercase tracking-wider text-xs font-bold">Amount (INR)</th>
              </tr>
              
              <tr className="border-b border-slate-200">
                <td className="p-4 border-r border-slate-200 font-medium">Provident Fund & Tax</td>
                <td className="p-4 text-right text-red-600 font-mono">{record.deductions.toFixed(2)}</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="p-4 border-r border-slate-300">Total Deductions (B)</td>
                <td className="p-4 text-right text-red-600 font-mono">{record.deductions.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Net Pay Card */}
          <div className="flex justify-end mb-16 relative z-10">
             <div className="bg-brand-blue text-white p-6 rounded-lg shadow-md w-1/2">
                <p className="text-blue-200 uppercase text-xs font-bold tracking-widest mb-1">Net Payable Amount</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl">₹</span>
                  <span className="text-4xl font-display font-bold">{record.netPayable.toFixed(2)}</span>
                </div>
                <p className="text-xs text-blue-200 mt-2 border-t border-blue-400/30 pt-2 italic">
                  * Transferred securely to bank account.
                </p>
             </div>
          </div>

          {/* Footer / Signatures */}
          <div className="flex justify-between items-end pt-8 border-t-2 border-slate-200 relative z-10 mt-auto">
            <div className="text-xs text-slate-500 max-w-xs">
              <p className="font-bold text-slate-700 mb-1">System Generated Document</p>
              <p>This is a computer-generated payslip and does not require a physical signature.</p>
              <p className="mt-1">Generated: {new Date().toLocaleString()}</p>
            </div>
            
            <div className="flex flex-col items-center relative">
              {/* Stamp and Signature Overlay */}
              <div className="h-24 w-40 relative mb-2 flex items-center justify-center">
                 {company.stampUrl && (
                   <img 
                      src={company.stampUrl} 
                      alt="Stamp" 
                      className="absolute h-24 w-24 object-contain opacity-80 mix-blend-multiply rotate-[-15deg] z-0" 
                   />
                 )}
                 {company.signatureUrl ? (
                   <img 
                      src={company.signatureUrl} 
                      alt="Authorized Signature" 
                      className="relative h-16 w-32 object-contain z-10" 
                   />
                 ) : (
                   <span className="font-handwriting text-xl text-blue-900 font-bold italic z-10">Authorized Sign</span>
                 )}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest border-t border-slate-400 pt-2 px-8 text-slate-600">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};