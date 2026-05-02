import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, FileText, CheckCircle, GraduationCap } from 'lucide-react';

const SIDEBAR_CONFIG = {
  ADMIN: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'User Management', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Exam Management', path: '/admin/exams', icon: <BookOpen size={20} /> },
    { name: 'School Setup', path: '/admin/school', icon: <GraduationCap size={20} /> },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: <FileText size={20} /> },
  ],
  TEACHER: [
    { name: 'My Quizzes', path: '/teacher/quizzes', icon: <BookOpen size={20} /> },
    { name: 'Blacklist', path: '/teacher/blacklist', icon: <Settings size={20} /> },
  ],
  STUDENT: [
    { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Results', path: '/student/results', icon: <CheckCircle size={20} /> },
  ],
};

export const RoleLayout = ({ allowedRoles }: { allowedRoles: Array<'ADMIN' | 'TEACHER' | 'STUDENT'> }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their respective home
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher/quizzes" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  const links = SIDEBAR_CONFIG[user.role] || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-primary/20">
      {/* Sidebar - Glassmorphism Premium */}
      <aside className="w-full md:w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-shrink-0 relative z-20">
        <div className="h-20 flex items-center px-8 border-b border-slate-100/80">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-800 shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-6 h-6 relative z-10 drop-shadow-md">
                <path d="M32 12 L18 22 L18 38 L32 48 L46 38 L46 22 Z" fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
                <path d="M32 18 L22 25 L22 35 L32 42 L42 35 L42 25 Z" fill="#F97316" />
              </svg>
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-slate-700 tracking-tight">WBES</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Menu</p>
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${
                  isActive 
                    ? 'text-primary shadow-sm bg-white border border-slate-100' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-full" />
                )}
                <span className={`transition-transform duration-300 ${isActive ? 'text-accent scale-110' : 'group-hover:scale-110'}`}>
                  {link.icon}
                </span>
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4 px-4 py-3 mb-4 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-orange-400 text-white flex items-center justify-center font-bold text-lg shadow-inner ring-2 ring-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-xs font-medium text-slate-500 truncate tracking-wide">{user.role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-center text-slate-500 font-semibold hover:text-red-600 hover:bg-red-50 rounded-xl h-11 transition-all" 
            onClick={logout}
          >
            <LogOut size={18} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        {/* Subtle animated background gradient blob */}
        <div className="absolute top-0 left-0 w-full h-[30rem] bg-gradient-to-b from-blue-50/80 to-transparent -z-10 pointer-events-none" />
        
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 sticky top-0 z-10 lg:hidden shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <span className="font-bold text-lg">E</span>
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">WBES</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500 hover:text-slate-800">Sign Out</Button>
        </header>
        
        <div className="p-6 md:p-10 flex-1 animate-fade-in max-w-7xl mx-auto w-full z-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
