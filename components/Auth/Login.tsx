import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IdCard, UserCircle, Lock, Building2, Mail } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';

export const Login = () => {
  const [mode, setMode] = useState<'HR' | 'STAFF'>('HR');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [uan, setUan] = useState('');
  const [error, setError] = useState('');
  
  // Connect to Company Context for live branding
  const { company } = useCompany();
  
  const { loginHR, loginStaff, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    let success = false;

    if (mode === 'HR') {
      success = await loginHR(email, password);
      if (success) navigate('/hr/dashboard');
    } else {
      success = await loginStaff(uan);
      if (success) {
        navigate('/emp/profile');
      }
    }

    if (!success) {
      setError('Invalid credentials or account not approved.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Header Section */}
        <div className="bg-brand-blue dark:bg-slate-950 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex flex-col items-center">
            {company?.logoUrl && (
               <img 
                 src={company.logoUrl} 
                 alt="Company Logo" 
                 loading="lazy"
                 decoding="async"
                 className="h-40 w-auto object-contain mb-6 bg-white/10 p-4 rounded-xl backdrop-blur-sm shadow-lg transition-transform hover:scale-105" 
               />
            )}
            
            <h1 className="font-display font-bold text-white tracking-wide mb-2 uppercase flex flex-col items-center leading-tight">
               {company?.name && (
                 <span className="text-2xl md:text-3xl mb-1">{company.name}</span>
               )}
               <span className="text-xl md:text-2xl opacity-90 font-sans tracking-widest">
                 HRM <span className="text-brand-yellow">PORTAL</span>
               </span>
            </h1>
            
            <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mt-2 border-t border-blue-400/30 pt-2 w-full max-w-[200px]">
              Enterprise ERP System
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode('HR')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
              mode === 'HR' 
                ? 'text-brand-blue dark:text-blue-400 border-b-4 border-brand-blue dark:border-blue-400 bg-blue-50 dark:bg-slate-700/50' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 size={18} />
            HR Admin
          </button>
          <button
            onClick={() => setMode('STAFF')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
              mode === 'STAFF' 
                ? 'text-brand-red dark:text-red-400 border-b-4 border-brand-red dark:border-red-400 bg-red-50 dark:bg-slate-700/50' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <UserCircle size={18} />
            Staff / Site
          </button>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'HR' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Corporate Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all dark:text-white"
                      placeholder="admin@konark.com"
                    />
                    <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all dark:text-white"
                      placeholder="••••••••"
                    />
                    <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">12-Digit UAN Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={uan}
                    onChange={e => setUan(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all font-mono text-lg tracking-widest dark:text-white"
                    placeholder="1000 0000 0001"
                  />
                  <IdCard className="absolute left-3 top-3.5 text-slate-400" size={18} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  * Login is only available for employees with <span className="text-green-600 dark:text-green-400 font-bold">APPROVED</span> status.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-lg flex items-center">
                 <span className="font-bold mr-1">Error:</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 text-white font-bold uppercase tracking-wider rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 ${
                loading ? 'opacity-70 cursor-not-allowed' : mode === 'HR' ? 'bg-brand-blue hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600' : 'bg-brand-red hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
              }`}
            >
              {loading ? 'Authenticating...' : `Login as ${mode === 'HR' ? 'Admin' : 'Staff'}`}
            </button>
          </form>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900 p-4 text-center border-t border-slate-200 dark:border-slate-700">
           <p className="text-xs text-slate-400">© {new Date().getFullYear()} HRM Portal. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};