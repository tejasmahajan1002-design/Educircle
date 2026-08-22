import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Share2,
  TrendingUp,
  Inbox,
  Clock,
  AlertTriangle,
  Award,
  PlusCircle,
  Search,
  Bell,
  ArrowRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    sharedCount: 0,
    borrowedCount: 0,
    pendingRequestsCount: 0,
    dueSoonCount: 0,
    overdueCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [borrowings, setBorrowings] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Resources
        const resListings = await fetch('/api/resources', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const listings = await resListings.json();
        const myShared = listings.filter(r => r.ownerId === user.id);

        // 2. Fetch Requests
        const resRequests = await fetch('/api/borrow/requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const requests = await resRequests.json();
        const totalPendingRequests =
          requests.sent.filter(r => r.status === 'requested').length +
          requests.received.filter(r => r.status === 'requested').length;

        // 3. Fetch Transactions
        const resTransactions = await fetch('/api/borrow/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const txs = await resTransactions.json();
        
        // Active Borrowings
        const activeBorrows = txs.borrowings.filter(t => t.status === 'borrowed' || t.status === 'overdue');
        const overdueBorrows = txs.borrowings.filter(t => t.status === 'overdue');

        // Due soon borrowings (due in 3 days or less)
        const dueSoonBorrows = txs.borrowings.filter(t => {
          if (t.status !== 'borrowed') return false;
          const due = new Date(t.expectedReturnDate);
          const now = new Date();
          const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 3;
        });

        // 4. Fetch Notifications
        const resNotifs = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const notifs = await resNotifs.json();

        setStats({
          sharedCount: myShared.length,
          borrowedCount: activeBorrows.length,
          pendingRequestsCount: totalPendingRequests,
          dueSoonCount: dueSoonBorrows.length,
          overdueCount: overdueBorrows.length
        });
        setBorrowings(activeBorrows.slice(0, 3));
        setRecentNotifications(notifs.slice(0, 4));
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate Trust Score Color
  const getTrustScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 50) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  const statCards = [
    { name: 'Resources Shared', value: stats.sharedCount, icon: Share2, color: 'text-blue-500 bg-blue-500/10' },
    { name: 'Items Borrowed', value: stats.borrowedCount, icon: TrendingUp, color: 'text-indigo-500 bg-indigo-500/10' },
    { name: 'Pending Requests', value: stats.pendingRequestsCount, icon: Inbox, color: 'text-purple-500 bg-purple-500/10' },
    { name: 'Due Soon', value: stats.dueSoonCount, icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
    { name: 'Overdue Items', value: stats.overdueCount, icon: AlertTriangle, color: stats.overdueCount > 0 ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : 'text-slate-500 bg-slate-500/10' }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-900 dark:to-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Student Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your active transactions, trust rating, and notifications.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate('/share-resource')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Add Resource
          </button>
          <button
            onClick={() => navigate('/explore')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            Find Items
          </button>
        </div>
      </div>

      {/* Stats and Trust Score grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stat Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-6">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between shadow-sm transition-all hover:scale-105 ${
                  i === 4 && stats.overdueCount > 0 ? 'ring-2 ring-rose-500 animate-pulse' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {stat.name}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{stat.value}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Score Radial Dial */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 self-start mb-6">
            Community Trust Score
          </h3>
          <div className="relative flex items-center justify-center w-36 h-36">
            {/* SVG Circle Gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="38"
                cx="50"
                cy="50"
              />
              {/* Progress circle */}
              <circle
                className={`transition-all duration-1000 ease-out ${getTrustScoreColor(user.trustScore)}`}
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={((100 - user.trustScore) / 100) * (2 * Math.PI * 38)}
                strokeLinecap="round"
                fill="transparent"
                r="38"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{user.trustScore}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">/ 100</span>
            </div>
          </div>
          <div className="mt-6 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              {user.trustScore >= 80 ? 'Excellent Contributor' : user.trustScore >= 60 ? 'Good Standing' : 'Needs Attention'}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 max-w-[240px]">
              Keep returning items on time and listing useful resources to increase your trust score.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts for Overdue items */}
      {stats.overdueCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-start gap-3 text-left">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Borrowing Restricted</h4>
            <p className="text-xs mt-1 leading-relaxed">
              You currently have an overdue resource. Please complete the previous return before borrowing another item.
            </p>
          </div>
        </div>
      )}

      {/* Main Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Borrowings */}
        <div className="lg:col-span-2 space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Borrowings</h3>
            <button
              onClick={() => navigate('/my-borrowings')}
              className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Manage Borrowings
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {borrowings.length === 0 ? (
              <div className="p-12 text-center text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-slate-500">
                You are not borrowing any resources currently.
              </div>
            ) : (
              borrowings.map((tx) => (
                <div
                  key={tx.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500">
                      {tx.resourceName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate max-w-[200px] sm:max-w-sm">
                        {tx.resourceName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {new Date(tx.expectedReturnDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    tx.status === 'overdue' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse' :
                    tx.status === 'borrowed' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                    'bg-slate-500/10 text-slate-500'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications list summary */}
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Updates</h3>
            <button
              onClick={() => navigate('/dashboard')} // notifications are in navbar bell
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Bell Icon
              <Bell className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
            {recentNotifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No recent notifications.
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <div key={notif.id} className="py-3.5 first:pt-0 last:pb-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {notif.content}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
