import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  ShieldCheck,
  FolderHeart,
  TrendingUp,
  AlertTriangle,
  FileText,
  Search,
  Bell,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const AdminDashboard = () => {
  const { token, showToast } = useAuth();

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalResources: 0,
    activeBorrowings: 0,
    successfulReturns: 0,
    overdueResources: 0,
    pendingReports: 0
  });

  const [usersList, setUsersList] = useState([]);
  const [resourcesList, setResourcesList] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters states
  const [searchUser, setSearchUser] = useState('');
  const [searchResource, setSearchResource] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('stats'); // 'stats', 'users', 'resources', 'overdue', 'reports'

  // Resolve modal state
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [actionTakenText, setActionTakenText] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Stats
      const resStats = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resStats.ok) {
        const statsData = await resStats.json();
        setStats(statsData);
      }

      // 2. Users
      const resUsers = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resUsers.ok) {
        const usersData = await resUsers.json();
        setUsersList(usersData);
      }

      // 3. Resources
      const resResources = await fetch('/api/resources', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resResources.ok) {
        const resourcesData = await resResources.json();
        setResourcesList(resourcesData);
      }

      // 4. Overdue
      const resOverdue = await fetch('/api/admin/overdue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resOverdue.ok) {
        const overdueData = await resOverdue.json();
        setOverdueList(overdueData);
      }

      // 5. Reports
      const resReports = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resReports.ok) {
        const reportsData = await resReports.json();
        setReportsList(reportsData);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  // Block/Unblock Student
  const handleToggleBlock = async (userObj) => {
    const confirm = window.confirm(`Are you sure you want to ${userObj.status === 'blocked' ? 'UNBLOCK' : 'BLOCK'} account for ${userObj.name}?`);
    if (!confirm) return;

    try {
      const res = await fetch(`/api/admin/users/${userObj.id}/toggle-block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(`User successfully ${userObj.status === 'blocked' ? 'unblocked' : 'blocked'}.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Remove Listing
  const handleRemoveResource = async (resObj) => {
    const confirm = window.confirm(`Are you sure you want to permanently delete/remove reported resource listing "${resObj.name}"?`);
    if (!confirm) return;

    try {
      const res = await fetch(`/api/resources/${resObj.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Resource removed successfully.');
        fetchAdminData();
      } else {
        const data = await res.json();
        showToast(data.message || 'Removal failed.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Warning Alerts Overdue
  const handleSendOverdueWarning = async (txId) => {
    try {
      const res = await fetch(`/api/admin/transactions/${txId}/warn`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Overdue warning alert sent to borrower.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Resolve Report Dialog
  const openResolveModal = (reportId) => {
    setSelectedReportId(reportId);
    setActionTakenText('');
    setIsResolveOpen(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!actionTakenText.trim()) return;

    try {
      const res = await fetch(`/api/admin/reports/${selectedReportId}/resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actionTaken: actionTakenText })
      });
      if (res.ok) {
        showToast('Report marked as resolved.');
        setIsResolveOpen(false);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = usersList.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.rollNumber.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredResources = resourcesList.filter(r =>
    r.name.toLowerCase().includes(searchResource.toLowerCase()) ||
    (r.ownerName && r.ownerName.toLowerCase().includes(searchResource.toLowerCase()))
  );

  const statCards = [
    { name: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
    { name: 'Total Resources', value: stats.totalResources, icon: FolderHeart, color: 'text-emerald-500 bg-emerald-500/10' },
    { name: 'Active Borrowings', value: stats.activeBorrowings, icon: TrendingUp, color: 'text-indigo-500 bg-indigo-500/10' },
    { name: 'Successful Returns', value: stats.successfulReturns, icon: CheckCircle, color: 'text-teal-500 bg-teal-500/10' },
    { name: 'Overdue Items', value: stats.overdueResources, icon: Clock, color: stats.overdueResources > 0 ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : 'text-slate-500 bg-slate-500/10' },
    { name: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle, color: stats.pendingReports > 0 ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 'text-slate-500 bg-slate-500/10' }
  ];

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">Admin Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Platform moderation control, user verification, listings logs, and statistics.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto">
        {[
          { key: 'stats', label: 'Overview' },
          { key: 'users', label: `Users (${usersList.length})` },
          { key: 'resources', label: `Resources (${resourcesList.length})` },
          { key: 'overdue', label: `Overdue Items (${overdueList.length})` },
          { key: 'reports', label: `Reports (${reportsList.filter(r => r.status === 'pending').length} Pending)` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`py-3 text-sm font-semibold border-b-2 uppercase tracking-wide transition-all whitespace-nowrap ${
              activeSubTab === tab.key
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* 1. Stats view */}
          {activeSubTab === 'stats' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.name}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{stat.name}</span>
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
          )}

          {/* 2. Users Table view */}
          {activeSubTab === 'users' && (
            <div className="space-y-4">
              {/* User search bar */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <Search className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Search students by name, email, roll number..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none"
                />
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Email & Roll</th>
                        <th className="pb-3">Department</th>
                        <th className="pb-3 text-center">Trust</th>
                        <th className="pb-3 text-center">Borrows</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredUsers.map((userObj) => (
                        <tr key={userObj.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="py-4">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{userObj.name}</span>
                            <span className="text-[10px] text-slate-400 capitalize">{userObj.role}</span>
                          </td>
                          <td className="py-4">
                            <span className="block text-slate-700 dark:text-slate-300">{userObj.email}</span>
                            <span className="text-[10px] font-mono text-slate-400">{userObj.rollNumber}</span>
                          </td>
                          <td className="py-4 text-slate-500">{userObj.department}</td>
                          <td className="py-4 text-center font-bold">{userObj.trustScore}</td>
                          <td className="py-4 text-center text-slate-500">
                            Active: {userObj.activeBorrows} | Overdue: {userObj.overdueBorrows}
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              userObj.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                              {userObj.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            {userObj.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleBlock(userObj)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold ${
                                  userObj.status === 'blocked' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                }`}
                              >
                                {userObj.status === 'blocked' ? 'Unblock' : 'Block'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. Resources control list */}
          {activeSubTab === 'resources' && (
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <Search className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  value={searchResource}
                  onChange={(e) => setSearchResource(e.target.value)}
                  placeholder="Search resources by name, owner..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none"
                />
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Resource</th>
                        <th className="pb-3">Owner</th>
                        <th className="pb-3">Type & Category</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredResources.map((resObj) => (
                        <tr key={resObj.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="py-4">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{resObj.name}</span>
                          </td>
                          <td className="py-4 text-slate-600 dark:text-slate-300">{resObj.ownerName}</td>
                          <td className="py-4 text-slate-500">
                            {resObj.type} • {resObj.category}
                          </td>
                          <td className="py-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {resObj.availability}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleRemoveResource(resObj)}
                              className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. Overdue resources tracking view */}
          {activeSubTab === 'overdue' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {overdueList.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No resources are currently overdue. Everything is returned on time!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Resource</th>
                        <th className="pb-3">Borrower Details</th>
                        <th className="pb-3">Lender</th>
                        <th className="pb-3 text-center">Due Date</th>
                        <th className="pb-3 text-center">Overdue Days</th>
                        <th className="pb-3 text-right">Alert Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {overdueList.map((ov) => (
                        <tr key={ov.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="py-4 font-bold text-slate-800 dark:text-slate-200">{ov.resourceName}</td>
                          <td className="py-4">
                            <span className="font-bold block text-slate-800 dark:text-slate-200">{ov.borrowerName}</span>
                            <span className="text-[10px] text-slate-400">{ov.borrowerEmail}</span>
                          </td>
                          <td className="py-4 text-slate-600 dark:text-slate-300">{ov.ownerName}</td>
                          <td className="py-4 text-center text-slate-500">{new Date(ov.dueDate).toLocaleDateString()}</td>
                          <td className="py-4 text-center font-extrabold text-rose-600 dark:text-rose-400">{ov.overdueDays} Days</td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleSendOverdueWarning(ov.id)}
                              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-[10px] cursor-pointer flex items-center gap-1.5 justify-end ml-auto"
                            >
                              <Bell className="w-3.5 h-3.5" />
                              Warn User
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 5. Reports resolving table */}
          {activeSubTab === 'reports' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {reportsList.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No flagged reports.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Reporter</th>
                        <th className="pb-3">Target Flagged</th>
                        <th className="pb-3">Reason</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right">Resolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {reportsList.map((rep) => (
                        <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="py-4 font-bold text-slate-800 dark:text-slate-200">{rep.reporterName}</td>
                          <td className="py-4">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">{rep.targetName}</span>
                            <span className="text-[10px] text-slate-400 capitalize">Type: {rep.targetType}</span>
                          </td>
                          <td className="py-4 text-slate-500 max-w-xs truncate" title={rep.reason}>
                            {rep.reason}
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rep.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                            }`}>
                              {rep.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            {rep.status === 'pending' ? (
                              <button
                                onClick={() => openResolveModal(rep.id)}
                                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-[10px] cursor-pointer"
                              >
                                Resolve
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic block max-w-xs truncate" title={rep.actionTaken}>
                                Resolved: {rep.actionTaken}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Resolve Report Dialogue Modal */}
      {isResolveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsResolveOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 text-left">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Resolve Flags</h3>
            <p className="text-slate-400 text-xs mb-6">Describe the moderation action taken before marking the report as resolved.</p>

            <form onSubmit={handleResolveSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Action Taken Details *</label>
                <textarea
                  required
                  rows="3"
                  value={actionTakenText}
                  onChange={(e) => setActionTakenText(e.target.value)}
                  placeholder="e.g. Warning sent to borrower / Removed inappropriate listing / Spoke with student."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResolveOpen(false)}
                  className="flex-1 py-3 text-sm font-semibold rounded-2xl border border-slate-200 dark:border-slate-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all cursor-pointer"
                >
                  Resolve Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
