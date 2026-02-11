import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { Employee, EmployeeStatus } from '../../types';
import { Search, Filter, Check, X, Eye, FileSpreadsheet, Ban, Edit2, Save, Building2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchEmployees = async () => {
    const data = await db.getEmployees();
    setEmployees(data);
  };

  const fetchSites = async () => {
    const data = await db.getSites();
    setSites(data);
  };

  useEffect(() => {
    fetchEmployees();
    fetchSites();
  }, []);

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setLoading(true);
    try {
      const success = await db.updateEmployee(editingEmployee.id, editingEmployee);
      if (success) {
        showToast('Employee details updated successfully!', 'success');
        setEditingEmployee(null);
        fetchEmployees();
      } else {
        showToast('Failed to update employee.', 'error');
      }
    } catch (error) {
      showToast('An error occurred while updating.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field: keyof Employee, value: any) => {
    if (editingEmployee) {
      setEditingEmployee({ ...editingEmployee, [field]: value });
    }
  };

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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.status === EmployeeStatus.APPROVED ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
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
                        <button
                          onClick={() => handleEdit(emp)}
                          className="text-brand-blue hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs inline-flex items-center gap-1 p-1 hover:bg-blue-50 dark:hover:bg-slate-700 rounded"
                          title="Edit Employee"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-xs inline-flex items-center gap-1 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded" title="View Profile">
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

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit2 size={24} className="text-brand-blue" />
                Edit Employee Details
              </h3>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 border-b dark:border-slate-700 pb-2">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      UAN (Read Only)
                    </label>
                    <input
                      type="text"
                      value={editingEmployee.uan}
                      disabled
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-slate-400 rounded-lg font-mono cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={editingEmployee.name}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      required
                      type="text"
                      value={editingEmployee.mobile}
                      onChange={(e) => handleEditChange('mobile', e.target.value)}
                      pattern="[0-9]{10}"
                      maxLength={10}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Job Role *
                    </label>
                    <select
                      value={editingEmployee.role}
                      onChange={(e) => handleEditChange('role', e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    >
                      <option>Helper</option>
                      <option>Driver</option>
                      <option>Supervisor</option>
                      <option>Electrician</option>
                      <option>Plumber</option>
                      <option>Mason</option>
                      <option>Carpenter</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Site Assignment */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b dark:border-slate-700 pb-2">
                  <Building2 size={18} />
                  Site Assignment
                </h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Site *
                  </label>
                  <select
                    value={editingEmployee.siteId}
                    onChange={(e) => handleEditChange('siteId', e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  >
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} - {site.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 border-b dark:border-slate-700 pb-2">
                  Bank Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={editingEmployee.bankName || ''}
                      onChange={(e) => handleEditChange('bankName', e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={editingEmployee.accountNumber || ''}
                      onChange={(e) => handleEditChange('accountNumber', e.target.value)}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={editingEmployee.ifsc || ''}
                      onChange={(e) => handleEditChange('ifsc', e.target.value.toUpperCase())}
                      maxLength={11}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Salary Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 border-b dark:border-slate-700 pb-2">
                  Salary Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Basic Salary (₹)
                    </label>
                    <input
                      type="number"
                      value={editingEmployee.basicSalary || ''}
                      onChange={(e) => handleEditChange('basicSalary', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="100"
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <input
                      type="text"
                      value={editingEmployee.status}
                      disabled
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-slate-400 rounded-lg cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg bg-brand-blue text-white font-semibold shadow-md hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};