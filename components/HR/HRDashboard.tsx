import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UsersRound, Clock, MapPin, IndianRupee, UserPlus, X, Save, Building2, CheckCircle, XCircle, Activity, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4 hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-full ${color} text-white`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase">{title}</p>
      <h3 className="text-3xl font-bold font-display text-slate-800 dark:text-white">{value}</h3>
    </div>
  </div>
);

export const HRDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    uan: '',
    mobile: '',
    role: 'Helper',
    siteId: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const [statsData, siteData, sitesData, pendingData, activitiesData] = await Promise.all([
        db.getStats(),
        db.getSiteDistribution(),
        db.getSites(),
        db.getPendingApprovals(),
        db.getRecentActivities()
      ]);
      setStats(statsData);
      setChartData(siteData);
      setSites(sitesData);
      setPendingApprovals(pendingData);
      setRecentActivities(activitiesData);
      if (sitesData.length > 0) {
        setFormData(prev => ({ ...prev, siteId: sitesData[0].id }));
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await db.addEmployee(formData);
      showToast('Employee added successfully! Pending approval.', 'success');
      setShowAddModal(false);
      setFormData({
        name: '',
        uan: '',
        mobile: '',
        role: 'Helper',
        siteId: sites[0]?.id || '',
        bankName: '',
        accountNumber: '',
        ifsc: '',
      });
      // Refresh stats and data
      const [statsData, pendingData, activitiesData] = await Promise.all([
        db.getStats(),
        db.getPendingApprovals(),
        db.getRecentActivities()
      ]);
      setStats(statsData);
      setPendingApprovals(pendingData);
      setRecentActivities(activitiesData);
    } catch (error) {
      showToast('Failed to add employee. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!stats) return <div className="p-8 text-center dark:text-slate-300">Loading Dashboard...</div>;

  const pieData = [
    { name: 'Active', value: stats.totalEmployees - stats.pendingApprovals },
    { name: 'Pending', value: stats.pendingApprovals },
  ];

  const COLORS = ['#1e3a8a', '#facc15', '#dc2626'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-800 dark:text-white">Executive Overview</h2>
          <p className="text-slate-500 dark:text-slate-400">Real-time workforce metrics and alerts.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg font-semibold hover:bg-blue-900 transition-colors shadow-md"
          >
            <UserPlus size={20} />
            Add Employee
          </button>
          <button
            onClick={() => navigate('/hr/employees')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <UsersRound size={20} />
            View All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Workforce" value={stats.totalEmployees} icon={UsersRound} color="bg-brand-blue" />
        <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={Clock} color="bg-brand-yellow" />
        <StatCard title="Active Sites" value={stats.activeSites} icon={MapPin} color="bg-purple-600" />
        <StatCard title="Total Payroll (INR)" value={`₹${(stats.totalPayroll / 100000).toFixed(2)}L`} icon={IndianRupee} color="bg-brand-red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 min-w-0">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-6">Site Distribution</h3>
          <div className="h-64 w-full min-w-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#475569" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="employees" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No Data Available</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 min-w-0">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-6">Compliance Status</h3>
          <div className="h-64 w-full min-w-0">
            {stats.totalEmployees > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No Data Available</div>
            )}
          </div>
          <div className="flex justify-center gap-4 text-xs font-medium mt-4 dark:text-slate-300">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-brand-blue"></div> Active</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-brand-yellow"></div> Pending</div>
          </div>
        </div>
      </div>

      {/* Pending Approvals & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <AlertCircle size={20} className="text-brand-yellow" />
              Pending Approvals
            </h3>
            <button
              onClick={() => navigate('/hr/approvals')}
              className="text-sm text-brand-blue hover:underline font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {pendingApprovals.length > 0 ? (
              pendingApprovals.slice(0, 5).map((emp) => (
                <div
                  key={emp.id}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/hr/approvals')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 dark:text-white">{emp.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        UAN: {emp.uan} • {emp.role}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {emp.siteName}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          db.updateEmployeeStatus(emp.id, 'APPROVED').then(() => {
                            showToast('Employee approved!', 'success');
                            db.getPendingApprovals().then(setPendingApprovals);
                            db.getStats().then(setStats);
                          });
                        }}
                        className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          db.updateEmployeeStatus(emp.id, 'REJECTED').then(() => {
                            showToast('Employee rejected', 'error');
                            db.getPendingApprovals().then(setPendingApprovals);
                            db.getStats().then(setStats);
                          });
                        }}
                        className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        title="Reject"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                <p>No pending approvals</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Activity size={20} className="text-purple-600" />
              Recent Activities
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">Last 7 days</span>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const isApproved = activity.status === 'APPROVED';
                const isPending = activity.status === 'PENDING';
                const statusColor = isApproved
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                  : isPending
                    ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800';

                return (
                  <div
                    key={activity.id}
                    className="p-3 border-l-4 border-slate-200 dark:border-slate-700 pl-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                          {activity.name}
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${statusColor}`}>
                            {activity.status}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {activity.role} • {activity.siteName}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(activity.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                <Activity size={32} className="mx-auto mb-2 opacity-50" />
                <p>No recent activities</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UserPlus size={24} className="text-brand-blue" />
                Quick Add Employee
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleQuickAdd} className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <UsersRound size={18} />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      required
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      pattern="[0-9]{10}"
                      maxLength={10}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      placeholder="10 digit mobile"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      UAN (12 Digits) *
                    </label>
                    <input
                      required
                      name="uan"
                      value={formData.uan}
                      onChange={handleChange}
                      maxLength={12}
                      pattern="[0-9]{12}"
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent font-mono"
                      placeholder="000000000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Job Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    >
                      <option>Helper</option>
                      <option>Driver</option>
                      <option>Supervisor</option>
                      <option>Electrician</option>
                      <option>Plumber</option>
                      <option>Mason</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Site Assignment */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Building2 size={18} />
                  Site Assignment
                </h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Assign to Site *
                  </label>
                  <select
                    name="siteId"
                    value={formData.siteId}
                    onChange={handleChange}
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
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <IndianRupee size={18} />
                  Bank Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Bank Name *
                    </label>
                    <input
                      required
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      placeholder="e.g., SBI"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Account Number *
                    </label>
                    <input
                      required
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent font-mono"
                      placeholder="Account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      IFSC Code *
                    </label>
                    <input
                      required
                      name="ifsc"
                      value={formData.ifsc}
                      onChange={handleChange}
                      maxLength={11}
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent font-mono uppercase"
                      placeholder="IFSC CODE"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg bg-brand-red text-white font-semibold shadow-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Add Employee
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