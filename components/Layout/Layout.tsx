import React, { ReactNode, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCompany } from '../../context/CompanyContext';
import { UserRole } from '../../types';
import { 
  LayoutDashboard, 
  UsersRound, 
  MapPin, 
  FileText, 
  LogOut, 
  Menu,
  ClipboardCheck,
  UserPlus,
  Settings,
  Sun,
  Moon,
  IdCard,
  Building,
  WalletCards
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavItem = ({ icon: Icon, label, path, active, onClick }: any) => (
  <button 
    onClick={() => onClick(path)}
    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors ${
      active 
        ? 'bg-brand-red text-white shadow-md' 
        : 'text-slate-300 hover:bg-brand-blue/50 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span>{label}</span>
  </button>
);

export const Layout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { company, loading: companyLoading } = useCompany(); // Use real-time company data
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const getNavItems = () => {
    switch (user?.role) {
      case UserRole.HR_ADMIN:
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/hr/dashboard' },
          { icon: UsersRound, label: 'Employee Directory', path: '/hr/employees' },
          { icon: ClipboardCheck, label: 'Approvals', path: '/hr/approvals' },
          { icon: MapPin, label: 'Site Management', path: '/hr/sites' },
          { icon: WalletCards, label: 'Payroll Import', path: '/hr/payroll-import' },
          { icon: Settings, label: 'Company Profile', path: '/hr/company-profile' },
        ];
      case UserRole.SITE_INCHARGE:
        return [
          { icon: UserPlus, label: 'Onboard New Staff', path: '/site/onboard' },
          { icon: UsersRound, label: 'My Site Roster', path: '/site/roster' },
        ];
      case UserRole.EMPLOYEE:
        return [
          { icon: FileText, label: 'My Salary Slips', path: '/emp/salary' },
          { icon: IdCard, label: 'My Profile', path: '/emp/profile' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans transition-colors duration-200">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-blue dark:bg-slate-800 text-white shadow-xl fixed h-full z-10 transition-colors duration-200">
        <div className="p-6 border-b border-brand-blue/50 dark:border-slate-700 flex flex-col items-center text-center">
          {companyLoading ? (
            <div className="w-full flex flex-col items-center animate-pulse">
               <div className="h-20 w-20 bg-white/10 rounded-xl mb-4"></div>
               <div className="h-6 w-32 bg-white/10 rounded mb-2"></div>
               <div className="h-3 w-16 bg-white/10 rounded"></div>
            </div>
          ) : (
            <>
              {company?.logoUrl && (
                <div className="w-full flex justify-center mb-4">
                  <img 
                    src={company.logoUrl} 
                    alt="Company Logo" 
                    loading="lazy"
                    decoding="async"
                    className="h-24 w-auto max-w-[85%] object-contain bg-white/10 rounded-xl p-2 backdrop-blur-sm transition-all duration-300 shadow-sm" 
                  />
                </div>
              )}
              
              <h1 className="text-xl font-display font-bold text-white tracking-wide mb-1 leading-tight">
                {company?.name || (
                  <span>HRM <span className="text-brand-yellow">PORTAL</span></span>
                )}
              </h1>
              
              {company?.name && (
                 <p className="text-[10px] text-brand-yellow font-bold uppercase tracking-[0.2em] w-full border-t border-brand-blue/30 pt-2 mt-1">
                   HRM Portal
                 </p>
              )}
            </>
          )}
        </div>

        <div className="flex-1 py-6 space-y-1">
          {getNavItems().map((item) => (
            <NavItem 
              key={item.path} 
              {...item} 
              active={location.pathname === item.path}
              onClick={handleNav}
            />
          ))}
        </div>

        <div className="p-4 border-t border-brand-blue/50 dark:border-slate-700 space-y-4">
          
          {/* Theme Toggle Button (Desktop) */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 bg-brand-dark/20 dark:bg-slate-700/50 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-brand-dark/30 dark:hover:bg-slate-700 transition-all group"
          >
            <span className="flex items-center gap-3">
              {theme === 'light' ? (
                <Sun size={18} className="text-brand-yellow group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon size={18} className="text-blue-300 group-hover:-rotate-12 transition-transform" />
              )}
              <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
            </span>
          </button>

          <div className="flex items-center space-x-3 px-4 py-3 mb-2 bg-brand-dark/20 dark:bg-slate-700/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-brand-yellow text-brand-blue flex items-center justify-center font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-800 hover:bg-red-700 dark:bg-red-900/50 dark:hover:bg-red-800 text-white text-sm rounded transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-brand-blue dark:bg-slate-800 z-20 flex items-center justify-between p-4 shadow-md text-white transition-colors duration-200">
        <div className="flex items-center gap-3 overflow-hidden">
           {companyLoading ? (
             <div className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-white/20 rounded"></div>
                <div className="w-32 h-6 bg-white/20 rounded"></div>
             </div>
           ) : (
             <>
               {company?.logoUrl ? (
                 <img 
                   src={company.logoUrl} 
                   alt="Logo" 
                   loading="lazy"
                   decoding="async"
                   className="h-10 w-auto object-contain bg-white/10 rounded p-1 flex-shrink-0" 
                 />
               ) : (
                 <span className="p-1 bg-white/10 rounded"><Building size={20} /></span>
               )}
               <span className="font-display font-bold text-lg truncate">
                 {company?.name || 'HRM PORTAL'}
               </span>
             </>
           )}
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Theme Toggle Button (Mobile) */}
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Toggle Dark Mode"
          >
            {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1">
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-brand-blue dark:bg-slate-800 w-64 h-full shadow-xl p-4 flex flex-col transition-colors" onClick={e => e.stopPropagation()}>
            <div className="mb-8 mt-2 flex flex-col items-center text-center">
              {company?.logoUrl && (
                <img 
                  src={company.logoUrl} 
                  alt="Logo" 
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-auto object-contain bg-white/10 rounded-lg p-2 mb-3" 
                />
              )}
              <h1 className="text-xl font-display font-bold text-white">
                {company?.name || 'HRM PORTAL'}
              </h1>
              {company?.name && <p className="text-xs text-blue-200 mt-1 uppercase tracking-widest">HRM Portal</p>}
            </div>
            <div className="flex-1 space-y-2">
            {getNavItems().map((item) => (
                <NavItem 
                  key={item.path} 
                  {...item} 
                  active={location.pathname === item.path}
                  onClick={handleNav}
                />
              ))}
            </div>
            <button 
              onClick={logout}
              className="mt-auto flex items-center space-x-2 text-red-300 hover:text-white px-4 py-4"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 mt-16 md:mt-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
