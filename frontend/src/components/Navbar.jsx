import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Menu,
  X,
  User,
  LogOut,
  Moon,
  Sun,
  ShieldAlert,
  LayoutDashboard,
  Compass,
  FileText,
  PlusCircle,
  FolderHeart,
  TrendingUp,
  HelpCircle,
  MessageSquare,
  Award
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, notifications, unreadNotificationsCount, markNotificationRead, markAllNotificationsRead, darkMode, toggleDarkMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!user) {
    return (
      <header className="fixed top-0 inset-x-0 h-16 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 h-full max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-lg shadow-md shadow-brand-500/20">
              C
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-950 to-slate-800 dark:from-white dark:to-slate-200">
              CampusShare
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/25 rounded-xl transition-all">
              Sign Up
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const mobileLinks = [
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
    <>
      <header className="fixed top-0 inset-x-0 lg:left-64 h-16 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 h-full">
          {/* Menu button & Title for Mobile */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-violet-400">
              CampusShare
            </span>
          </div>

          {/* Spacer on Desktop */}
          <div className="hidden lg:block text-sm font-medium text-slate-500 dark:text-slate-400">
            Welcome, <span className="font-semibold text-slate-800 dark:text-white">{user.name}</span>!
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-3">
            {/* Dark Mode toggle on Mobile/Desktop */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold border-2 border-white dark:border-slate-900 animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 max-h-[480px] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col z-50">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        All caught up! No notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.type.includes('request')) navigate('/requests');
                            if (n.type.includes('message')) navigate('/messages');
                            if (n.type.includes('overdue')) navigate('/my-borrowings');
                            setNotifDropdownOpen(false);
                          }}
                          className={`p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            !n.isRead ? 'bg-brand-50/50 dark:bg-brand-950/10' : ''
                          }`}
                        >
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {n.content}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                            {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-white text-sm">
                  {user.name.charAt(0)}
                </div>
              </button>

              {/* Profile Dropdown list */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                  <Link
                    to={`/profile/${user.id}`}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Menu for Mobile screens */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />
          {/* Drawer container */}
          <div className="relative w-80 max-w-sm bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50">
            <div className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-violet-400">
                CampusShare
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {mobileLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <Icon className="w-5 h-5 text-slate-500" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all mt-4 border border-rose-500/20"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
