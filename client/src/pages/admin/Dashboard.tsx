import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Users, BookOpen, ShieldAlert, FileText, TrendingUp, Activity } from 'lucide-react';

export const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats');
      return data;
    },
  });

  const statCards = [
    {
      label: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: <Users className="h-6 w-6" />,
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      ring: 'ring-blue-200',
    },
    {
      label: 'Total Teachers',
      value: stats?.totalTeachers || 0,
      icon: <BookOpen className="h-6 w-6" />,
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      ring: 'ring-emerald-200',
    },
    {
      label: 'Active Exams',
      value: stats?.activeExams || 0,
      icon: <FileText className="h-6 w-6" />,
      gradient: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      ring: 'ring-violet-200',
    },
    {
      label: 'Blacklisted',
      value: stats?.blacklistedUsers || 0,
      icon: <ShieldAlert className="h-6 w-6" />,
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-50',
      text: 'text-red-700',
      ring: 'ring-red-200',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">Dashboard</h2>
          <p className="text-slate-500 font-medium mt-1">Overview of the examination system.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
              <div className="flex items-center justify-between mb-6">
                <div className="h-4 w-28 bg-slate-100 rounded-lg"></div>
                <div className="h-10 w-10 bg-slate-100 rounded-xl"></div>
              </div>
              <div className="h-10 w-20 bg-slate-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">Dashboard</h2>
          <p className="text-slate-500 font-medium mt-1">Overview of the examination system.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-400">
          <Activity className="h-4 w-4" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
          >
            {/* Decorative accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">{card.label}</span>
              <div className={`w-11 h-11 rounded-xl ${card.bg} ${card.text} flex items-center justify-center ring-1 ${card.ring} group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-slate-800">{card.value}</span>
              <TrendingUp className="h-4 w-4 text-emerald-500 mb-2" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="/admin/users" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">Manage Users</p>
              <p className="text-xs text-slate-500">Add, edit, or remove users</p>
            </div>
          </a>
          <a href="/admin/audit-logs" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-violet-50 border border-slate-100 hover:border-violet-200 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">Audit Logs</p>
              <p className="text-xs text-slate-500">Review system activity</p>
            </div>
          </a>
          <a href="/admin/users" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-100 hover:border-red-200 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">Blacklist</p>
              <p className="text-xs text-slate-500">Manage restricted users</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
