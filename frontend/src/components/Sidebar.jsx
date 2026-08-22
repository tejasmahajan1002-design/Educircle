import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Compass,
  FileText,
  PlusCircle,
  FolderHeart,
  TrendingUp,
  MessageSquare,
  Bell,
  HelpCircle,
  Award,
  User,
  ShieldAlert,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, darkMode, toggleDarkMode, unreadNotificationsCount } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Explore Items', path: '/explore', icon: Compass },
    { name: 'Study Materials', path: '/study-materials', icon: FileText },
    { name: 'Share Resource', path: '/share-resource', icon: PlusCircle },
    { name: 'My Listings', path: '/my-listings', icon: FolderHeart },
    { name: 'My Borrowings', path: '/my-borrowings', icon: TrendingUp },
    { name: 'Requests', path: '/requests', icon: HelpCircle },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
    { name: 'Lost & Found', path: '/lost-found', icon: ShieldAlert },
    { name: 'Leaderboard', path: '/leaderboard', icon: Award },
    { name: 'Profile', path: `/profile/${user.id}`, icon: User }
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-lg shadow-md shadow-brand-500/20">
          C
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
          CampusShare
        </span>
      </div>

      {/* Profile summary */}
      <div className="p-4 mx-4 my-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center font-bold text-brand-600 dark:text-brand-400">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{user.name}</h4>
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">{user.department}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
          <span>Trust Score:</span>
          <span className={`px-2 py-0.5 rounded-full ${
            user.trustScore >= 80 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
            user.trustScore >= 50 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
            'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}>
            {user.trustScore}/100
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span>{link.name}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Admin Navigation */}
        {user.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all mt-4 border border-rose-500/20 dark:border-rose-500/10 ${
                isActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
              }`
            }
          >
            <ShieldAlert className="w-5 h-5 mr-3" />
            <span>Admin Dashboard</span>
          </NavLink>
        )}
      </nav>

      {/* Footer controls */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button
          onClick={toggleDarkMode}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex items-center gap-3">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            Theme
          </span>
          <span className="text-xs text-slate-400">{darkMode ? 'Dark' : 'Light'}</span>
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
