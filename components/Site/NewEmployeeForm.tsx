import React, { useState } from 'react';
import { db } from '../../services/mockDb';
import { useNavigate } from 'react-router-dom';
import { Upload, Save, User, Landmark, FileText } from 'lucide-react';

export const NewEmployeeForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    uan: '',
    mobile: '',
    role: 'Helper',
    bankName: '',
    accountNumber: '',
    ifsc: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate upload delay
    await new Promise(r => setTimeout(r, 1000));
    
    await db.addEmployee({
      ...formData,
      siteId: 's1' // Hardcoded for demo, normally from logged in user context
    });
    
    setLoading(false);
    navigate('/site/roster');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Digital Onboarding</h2>
        <p className="text-slate-500 dark:text-slate-400">Register new field worker.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <h3 className="flex items-center gap-2 text-lg font-bold text-brand-blue dark:text-blue-400 mb-4 border-b dark:border-slate-700 pb-2">
             <User size={20} /> Personal Information
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input required name="name" onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:ring-2 focus:ring-brand-blue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                <input required name="mobile" onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:ring-2 focus:ring-brand-blue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Role</label>
                <select name="role" onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:ring-2 focus:ring-brand-blue">
                   <option>Helper</option>
                   <option>Driver</option>
                   <option>Supervisor</option>
                   <option>Electrician</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UAN (12 Digit)</label>
                <input required name="uan" maxLength={12} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:ring-2 focus:ring-brand-blue font-mono" placeholder="0000 0000 0000" />
              </div>
           </div>
        </div>

        {/* Bank Info */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <h3 className="flex items-center gap-2 text-lg font-bold text-brand-blue dark:text-blue-400 mb-4 border-b dark:border-slate-700 pb-2">
             <Landmark size={20} /> Bank Details
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
                <input required name="bankName" onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:ring-2 focus:ring-brand-blue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
                <input required name="accountNumber" onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:ring-2 focus:ring-brand-blue font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">IFSC Code</label>
                <input required name="ifsc" onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:ring-2 focus:ring-brand-blue font-mono uppercase" />
              </div>
           </div>
        </div>

        {/* Doc Uploads */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <h3 className="flex items-center gap-2 text-lg font-bold text-brand-blue dark:text-blue-400 mb-4 border-b dark:border-slate-700 pb-2">
             <FileText size={20} /> Documents (KYC)
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Aadhaar Front', 'Aadhaar Back', 'PAN Card', 'Bank Passbook'].map((doc) => (
                <div key={doc} className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer h-32">
                  <Upload size={24} className="mb-2" />
                  <span className="text-xs text-center">{doc}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold">Cancel</button>
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-brand-red text-white font-bold shadow-lg hover:bg-red-700 flex items-center gap-2"
          >
            {loading ? 'Submitting...' : <><Save size={20} /> Register Employee</>}
          </button>
        </div>
      </form>
    </div>
  );
};