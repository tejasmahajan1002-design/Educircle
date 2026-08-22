import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckCircle2, XCircle, Inbox, User, Clock } from 'lucide-react';

const Requests = () => {
  const { token, showToast } = useAuth();

  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received'); // 'received', 'sent'

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/borrow/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSentRequests(data.sent);
        setReceivedRequests(data.received);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  // Respond Accept/Reject
  const handleRespond = async (id, status) => {
    try {
      const res = await fetch(`/api/borrow/requests/${id}/respond`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Request successfully ${status}!`);
        fetchRequests();
      } else {
        const data = await res.json();
        showToast(data.message || 'Action failed.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const list = activeTab === 'received' ? receivedRequests : sentRequests;

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Requests Hub</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Lend products to other students or check statuses of items you asked to borrow.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('received')}
          className={`py-3 text-sm font-semibold border-b-2 uppercase tracking-wide transition-all ${
            activeTab === 'received'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Received Requests ({receivedRequests.filter(r => r.status === 'requested').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`py-3 text-sm font-semibold border-b-2 uppercase tracking-wide transition-all ${
            activeTab === 'sent'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Sent Requests ({sentRequests.length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 shadow-sm">
          No requests listed.
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((req) => (
            <div
              key={req.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              {/* Item detail column */}
              <div className="flex items-center gap-4 text-left">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs flex-shrink-0">
                  {req.resourceName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate max-w-[200px] md:max-w-md">
                    {req.resourceName}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {activeTab === 'received' ? (
                      <span>Requested by: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{req.requesterName}</strong> (Trust Score: {req.requesterTrustScore})</span>
                    ) : (
                      <span>Lender: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{req.ownerName}</strong></span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(req.borrowDate).toLocaleDateString()} to {new Date(req.returnDate).toLocaleDateString()}
                  </p>
                  {req.purpose && (
                    <p className="text-xs italic text-slate-500 mt-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900">
                      "{req.purpose}"
                    </p>
                  )}
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  req.status === 'requested' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                  req.status === 'approved' || req.status === 'returned' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                  'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}>
                  {req.status}
                </span>

                {activeTab === 'received' && req.status === 'requested' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(req.id, 'rejected')}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl text-rose-600 bg-rose-500/10 hover:bg-rose-500/20"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleRespond(req.id, 'approved')}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/15"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requests;
