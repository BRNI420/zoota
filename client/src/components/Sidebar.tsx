import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Dumbbell, Apple, MessageCircle,
  Users, Video, ClipboardList, LogOut, Zap, ChevronLeft,
  Newspaper, BookOpen
} from 'lucide-react';

const clientNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'דשבורד' },
  { to: '/workouts',  icon: Dumbbell,         label: 'אימונים' },
  { to: '/nutrition', icon: Apple,             label: 'תזונה' },
  { to: '/coach',     icon: MessageCircle,     label: 'מאמן AI' },
  { to: '/news',      icon: Newspaper,         label: 'חדשות כושר' },
  { to: '/learn',     icon: BookOpen,          label: 'סרטוני הדרכה' },
];

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'דשבורד' },
  { to: '/admin/clients', icon: Users, label: 'לקוחות' },
  { to: '/admin/videos', icon: Video, label: 'ספריית וידאו' },
  { to: '/admin/plans', icon: ClipboardList, label: 'עריכת תוכניות' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = user?.role === 'admin' ? adminNav : clientNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-card border-l border-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/30">
            <Zap className="w-6 h-6 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">ZOOTA</h1>
            <p className="text-xs text-gray-500">Fitness Platform</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface">
          <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role === 'admin' ? 'מנהל' : 'לקוח'}
            </p>
          </div>
          <ChevronLeft className="w-4 h-4 text-gray-500 flex-shrink-0" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin' || to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-400 hover:text-white hover:bg-surface'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">יציאה</span>
        </button>
      </div>
    </aside>
  );
}
