import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { CompanyProvider } from './context/CompanyContext';
import { Layout } from './components/Layout/Layout';
import { Login } from './components/Auth/Login';
import { HRDashboard } from './components/HR/HRDashboard';
import { EmployeeDirectory } from './components/HR/EmployeeDirectory';
import { CompanyProfile } from './components/HR/CompanyProfile';
import { SiteManagement } from './components/HR/SiteManagement';
import { PayrollUpload } from './components/HR/PayrollUpload';
import { NewEmployeeForm } from './components/Site/NewEmployeeForm';
import { SalarySlip } from './components/Employee/SalarySlip';
import { checkConnection } from './services/supabase';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center dark:text-slate-300">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route path="/hr/dashboard" element={<ProtectedRoute><HRDashboard /></ProtectedRoute>} />
      <Route path="/hr/employees" element={<ProtectedRoute><EmployeeDirectory /></ProtectedRoute>} />
      <Route path="/hr/approvals" element={<ProtectedRoute><EmployeeDirectory /></ProtectedRoute>} />
      <Route path="/hr/sites" element={<ProtectedRoute><SiteManagement /></ProtectedRoute>} />
      <Route path="/hr/payroll-import" element={<ProtectedRoute><PayrollUpload /></ProtectedRoute>} />
      <Route path="/hr/company-profile" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />

      <Route path="/site/onboard" element={<ProtectedRoute><NewEmployeeForm /></ProtectedRoute>} />
      <Route path="/site/roster" element={<ProtectedRoute><EmployeeDirectory /></ProtectedRoute>} />

      <Route path="/emp/profile" element={<ProtectedRoute><div className="p-8 font-bold text-2xl dark:text-white">Welcome to Employee Portal</div></ProtectedRoute>} />
      <Route path="/emp/salary" element={<ProtectedRoute><SalarySlip /></ProtectedRoute>} />
    </Routes>
  );
};

export default function App() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    checkConnection().then((isConnected) => {
      setDbStatus(isConnected ? 'connected' : 'error');
    });
  }, []);

  if (dbStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue"></div>
           <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Connecting to Server...</p>
        </div>
      </div>
    );
  }

  if (dbStatus === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 font-sans">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center max-w-sm w-full border border-red-100 dark:border-red-900/30">
           <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <AlertTriangle size={32} />
           </div>
           <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Connection Error</h2>
           <p className="text-slate-500 dark:text-slate-400 mb-6">Database not connected.</p>
           <button 
             onClick={() => window.location.reload()} 
             className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
           >
             <RefreshCw size={18} /> Retry Connection
           </button>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <CompanyProvider>
          <AuthProvider>
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </AuthProvider>
        </CompanyProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
