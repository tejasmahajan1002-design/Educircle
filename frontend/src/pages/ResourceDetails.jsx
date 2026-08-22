import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Award,
  BookOpen,
  User,
  CheckCircle,
  FileText,
  Clock,
  ArrowRightLeft
} from 'lucide-react';

const ResourceDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { token, user, showToast } = useAuth();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  // Borrow Modal State
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(searchParams.get('action') === 'borrow');
  const [borrowForm, setBorrowForm] = useState({
    borrowDate: new Date().toISOString().split('T')[0],
    returnDate: '',
    purpose: '',
    agreementAccepted: false
  });

  // Exchange Modal State
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [exchangeForm, setExchangeForm] = useState({
    requesterResourceId: '',
    durationDays: '7'
  });
  const [myResources, setMyResources] = useState([]);

  const fetchResourceDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resources/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResource(data.resource);
        setOwner(data.owner);
      } else {
        showToast('Resource not found.', 'error');
        navigate('/explore');
      }
    } catch (err) {
      console.error('Error fetching resource details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyResourcesForSwap = async () => {
    try {
      const res = await fetch('/api/resources', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // filter my available physical resources
        const mine = data.filter(r => r.ownerId === user.id && r.type === 'Physical Item' && r.availability === 'available');
        setMyResources(mine);
        if (mine.length > 0) {
          setExchangeForm(prev => ({ ...prev, requesterResourceId: mine[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchResourceDetails();
  }, [id, token]);

  useEffect(() => {
    if (isExchangeModalOpen) {
      fetchMyResourcesForSwap();
    }
  }, [isExchangeModalOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Messaging Trigger
  const handleStartChat = async () => {
    if (owner.id === user.id) {
      showToast("This is your own listing!", "error");
      return;
    }
    // Seed initial message to start conversation easily
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: owner.id,
          content: `Hi ${owner.name}, I am interested in borrowing/exchanging your resource: "${resource.name}". Is it available?`,
          resourceId: resource.id
        })
      });
      if (res.ok) {
        navigate(`/messages?chatWith=${owner.id}`);
      }
    } catch (err) {
      navigate(`/messages?chatWith=${owner.id}`);
    }
  };

  // Submit Borrow Request
  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    const { borrowDate, returnDate, purpose, agreementAccepted } = borrowForm;

    if (!borrowDate || !returnDate || !purpose || !agreementAccepted) {
      showToast('Please fill all fields and accept the return agreement.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/borrow/request', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resourceId: resource.id,
          borrowDate,
          returnDate,
          purpose,
          agreementAccepted
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Borrow request sent successfully to the owner!');
        setIsBorrowModalOpen(false);
        navigate('/requests');
      } else {
        showToast(data.message || 'Request failed.', 'error');
      }
    } catch (err) {
      showToast('Connection error, try again.', 'error');
    }
  };

  // Submit Exchange Swap Proposal
  const handleExchangeSubmit = async (e) => {
    e.preventDefault();
    const { requesterResourceId, durationDays } = exchangeForm;

    if (!requesterResourceId || !durationDays) {
      showToast('You must select a item to propose in swap.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/exchange/propose', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ownerId: owner.id,
          requesterResourceId,
          ownerResourceId: resource.id,
          durationDays
        })
      });

      if (res.ok) {
        showToast('Exchange swap proposal sent successfully!');
        setIsExchangeModalOpen(false);
        navigate('/requests');
      } else {
        const data = await res.json();
        showToast(data.message || 'Swap proposal failed.', 'error');
      }
    } catch (err) {
      showToast('Network error, try again.', 'error');
    }
  };

  // Report Resource listing
  const handleReportListing = async () => {
    const reason = window.prompt(`Why are you reporting "${resource.name}"?`);
    if (!reason) return;

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetId: resource.id,
          targetType: 'resource',
          reason
        })
      });

      if (res.ok) {
        showToast('Listing reported. Admin dashboard updated.');
      } else {
        showToast('Failed to report listing.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Back Link */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to explore
      </button>

      {/* Main Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle: Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Header properties */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400">
                {resource.category}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                resource.availability === 'available' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {resource.availability}
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{resource.name}</h1>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                <span>Type: <strong>{resource.type}</strong></span>
                <span>•</span>
                <span>Condition: <strong>{resource.condition}</strong></span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Listing Description</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {resource.description}
              </p>
            </div>

            {/* Location & specs */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Handover Point</span>
                <strong>{resource.location}</strong>
              </div>
              <div>
                <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Maximum Borrow Days</span>
                <strong>{resource.type === 'Digital Resource' ? 'Unlimited' : `${resource.lendingDuration} Days`}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Owner Profile Card & Actions */}
        <div className="space-y-6">
          {/* Owner details */}
          {owner && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Lender Information</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-white text-lg">
                  {owner.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{owner.name}</h4>
                  <p className="text-xs text-slate-400">{owner.department} • {owner.year}</p>
                </div>
              </div>

              {/* Owner Stats */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Trust Score</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold block mt-1">{owner.trustScore}/100</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Rating</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold block mt-1">★ {owner.ratingAverage || 'New'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
            {owner?.id !== user?.id ? (
              <>
                {resource.availability === 'available' && resource.type === 'Physical Item' && (
                  <button
                    onClick={() => setIsBorrowModalOpen(true)}
                    className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-white gradient-bg hover:shadow-lg hover:shadow-brand-500/25 rounded-2xl transition-all cursor-pointer"
                  >
                    <Calendar className="w-4.5 h-4.5" />
                    Request to Borrow
                  </button>
                )}

                {resource.availability === 'available' && resource.type === 'Physical Item' && (
                  <button
                    onClick={() => setIsExchangeModalOpen(true)}
                    className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4.5 h-4.5" />
                    Request Exchange
                  </button>
                )}

                {resource.type === 'Digital Resource' && (
                  <a
                    href={resource.fileUrl}
                    download
                    className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 text-center rounded-2xl shadow-md shadow-emerald-500/15 transition-all cursor-pointer block"
                  >
                    Download Resource
                  </a>
                )}

                <button
                  onClick={handleStartChat}
                  className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-2xl transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                  Message Owner
                </button>

                <button
                  onClick={handleReportListing}
                  className="w-full py-3.5 flex items-center justify-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Report Listing
                </button>
              </>
            ) : (
              <div className="text-center p-4 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                This is your resource listing. You can edit or delete this item from your "My Listings" tab.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Borrowing Request Modal */}
      {isBorrowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsBorrowModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Request to Borrow</h3>
            <p className="text-slate-400 text-xs mb-6">Lending rules enforce timely return to maintain campus Trust rating.</p>

            <form onSubmit={handleBorrowSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Borrow Date</label>
                  <input
                    type="date"
                    required
                    value={borrowForm.borrowDate}
                    onChange={(e) => setBorrowForm(prev => ({ ...prev, borrowDate: e.target.value }))}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Return Date</label>
                  <input
                    type="date"
                    required
                    value={borrowForm.returnDate}
                    onChange={(e) => setBorrowForm(prev => ({ ...prev, returnDate: e.target.value }))}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Purpose of Request</label>
                <textarea
                  required
                  rows="3"
                  value={borrowForm.purpose}
                  onChange={(e) => setBorrowForm(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Tell the lender what you need it for (lab test, exams, personal project)..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Agreement text */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">CampusShare Agreement</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  "I agree to take responsibility for this resource and return it by the agreed return date in approximately the same condition in which I received it."
                </p>
                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    type="checkbox"
                    id="acceptAgreement"
                    checked={borrowForm.agreementAccepted}
                    onChange={(e) => setBorrowForm(prev => ({ ...prev, agreementAccepted: e.target.checked }))}
                    className="w-4 h-4 text-brand-600 border-slate-355 rounded"
                  />
                  <label htmlFor="acceptAgreement" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    I Agree *
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBorrowModalOpen(false)}
                  className="flex-1 py-3.5 text-sm font-semibold rounded-2xl border border-slate-200 dark:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-2xl transition-all cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exchange Proposal Modal */}
      {isExchangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsExchangeModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Propose Exchange Swap</h3>
            <p className="text-slate-400 text-xs mb-6">Select one of your available physical resources to propose swapping with this item.</p>

            {myResources.length === 0 ? (
              <div className="text-center p-8 space-y-4">
                <p className="text-sm text-slate-500">
                  You don't have any available physical resources listed. You must upload a resource and mark it "available" to swap items.
                </p>
                <button
                  onClick={() => navigate('/share-resource')}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl"
                >
                  Upload a Resource
                </button>
              </div>
            ) : (
              <form onSubmit={handleExchangeSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">My Swap Item</label>
                  <select
                    value={exchangeForm.requesterResourceId}
                    onChange={(e) => setExchangeForm(prev => ({ ...prev, requesterResourceId: e.target.value }))}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm"
                  >
                    {myResources.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.condition})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Proposed Swap Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="60"
                    value={exchangeForm.durationDays}
                    onChange={(e) => setExchangeForm(prev => ({ ...prev, durationDays: e.target.value }))}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsExchangeModalOpen(false)}
                    className="flex-1 py-3.5 text-sm font-semibold rounded-2xl border border-slate-200 dark:border-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-2xl transition-all cursor-pointer"
                  >
                    Propose Swap
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceDetails;
