import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { Employee, EmployeeStatus } from '../../types';
import { Search, Filter, Check, X, Eye, FileSpreadsheet, Ban } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const fetchEmployees = async () => {
    const data = await db.getEmployees();
    setEmployees(data);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleStatusChange = async (id: string, status: EmployeeStatus) => {
    if (confirm(`Are you sure you want to ${status} this employee?`)) {
      try {
        const success = await db.updateEmployeeStatus(id, status);
        if (success) {
          showToast(`Employee has been marked as ${status}.`, 'success');
          fetchEmployees();
        } else {
          showToast("Unable to update employee status.", 'error');
        }
      } catch (error) {
        showToast("An unexpected system error occurred.", 'error');
      }
    }
  };

  const handleDelete = async (id: string) => {
     if (confirm('Are you sure you want to deactivate (soft delete) this employee record?')) {
        const success = await db.deleteEmployee(id);
        if (success) {
            showToast('Employee deactivated successfully.', 'success');
            fetchEmployees();
        } else {
            showToast('Failed to deactivate employee.', 'error');
        }
     }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesFilter = filter === 'ALL' || emp.status === filter;
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || emp.uan.includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Staff Directory</h2>
           <p className="text-slate-500 dark:text-slate-400 text-sm">Manage employee records and approvals.</p>
        </div>
        
        <div className="flex gap-2">
           <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <FileSpreadsheet size={16} />
              <span>Export Excel</span>
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Name or UAN..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue dark:text-white"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
            <Filter size={20} className="text-slate-400" />
            <select 
              className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value={EmployeeStatus.PENDING}>Pending Approval</option>
              <option value={EmployeeStatus.APPROVED}>Active / Approved</option>
              <option value={EmployeeStatus.REJECTED}>Rejected</option>
            </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300 uppercase">UAN / Name</th>
                <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300 uppercase">Role / Site</th>
                <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300 uppercase">Status</th>
                <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300 uppercase">Joined</th>
                <th className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-brand-blue dark:text-blue-400 font-mono tracking-wide">{emp.uan}</p>
                    <p className="text-slate-700 dark:text-slate-200">{emp.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-bold mb-1">{emp.role}</span>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{emp.siteId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      emp.status === EmployeeStatus.APPROVED ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      emp.status === EmployeeStatus.PENDING ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{emp.joinedDate}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {emp.status === EmployeeStatus.PENDING && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(emp.id, EmployeeStatus.APPROVED)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium text-xs border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button 
                           onClick={() => handleStatusChange(emp.id, EmployeeStatus.REJECTED)}
                           className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-xs border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <X size={14} /> Reject
                        </button>
                      </>
                    )}
                    {emp.status === EmployeeStatus.APPROVED && (
                        <>
                         <button className="text-brand-blue hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs inline-flex items-center gap-1 p-1 hover:bg-blue-50 dark:hover:bg-slate-700 rounded" title="View Profile">
                           <Eye size={16} />
                         </button>
                         <button 
                            onClick={() => handleDelete(emp.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-xs inline-flex items-center gap-1 p-1 hover:bg-red-50 dark:hover:bg-slate-700 rounded" title="Deactivate">
                           <Ban size={16} />
                         </button>
                        </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                    No employees found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};