import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UsersRound, Clock, MapPin, IndianRupee } from 'lucide-react';

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
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [statsData, siteData] = await Promise.all([
        db.getStats(),
        db.getSiteDistribution()
      ]);
      setStats(statsData);
      setChartData(siteData);
    };
    fetchData();
  }, []);

  if (!stats) return <div className="p-8 text-center dark:text-slate-300">Loading Dashboard...</div>;

  const pieData = [
    { name: 'Active', value: stats.totalEmployees - stats.pendingApprovals },
    { name: 'Pending', value: stats.pendingApprovals },
  ];

  const COLORS = ['#1e3a8a', '#facc15', '#dc2626'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold text-slate-800 dark:text-white">Executive Overview</h2>
        <p className="text-slate-500 dark:text-slate-400">Real-time workforce metrics and alerts.</p>
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
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <YAxis tick={{fill: '#94a3b8'}} />
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
    </div>
  );
};