import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  AlertTriangle,
  QrCode,
  Star,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

const MyBorrowings = () => {
  const { token, user, showToast } = useAuth();

  const [borrowings, setBorrowings] = useState([]);
  const [lendings, setLendings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('borrowings'); // 'borrowings', 'lendings'

  // QR Modal Simulation
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrTitle, setQrTitle] = useState('');

  // Rating Modal
  const [isRateOpen, setIsRateOpen] = useState(false);
  const [rateTxId, setRateTxId] = useState('');
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/borrow/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBorrowings(data.borrowings);
        setLendings(data.lendings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  // Borrower requests return confirmation
  const handleRequestReturn = async (txId) => {
    try {
      const res = await fetch(`/api/borrow/transactions/${txId}/return-request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        showToast('Return confirmation request sent to owner!');
        fetchTransactions();
      } else {
        const data = await res.json();
        showToast(data.message || 'Request failed.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Owner confirms return
  const handleConfirmReturn = async (txId) => {
    try {
      const res = await fetch(`/api/borrow/transactions/${txId}/confirm-return`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        showToast('Return confirmed. Resource released.');
        fetchTransactions();
      } else {
        const data = await res.json();
        showToast(data.message || 'Confirmation failed.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dispute transaction
  const handleDispute = async (txId) => {
    const confirm = window.confirm('Are you sure you want to raise a formal dispute? This will report the issue to administrators.');
    if (!confirm) return;

    try {
      const res = await fetch(`/api/borrow/transactions/${txId}/dispute`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        showToast('Dispute reported to administrators.');
        fetchTransactions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Rating Modal
  const openRatingModal = (txId) => {
    setRateTxId(txId);
    setRating(5);
    setReview('');
    setIsRateOpen(true);
  };

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;

    try {
      const res = await fetch(`/api/borrow/transactions/${rateTxId}/rate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, review })
      });

      if (res.ok) {
        showToast('Rating submitted successfully!');
        setIsRateOpen(false);
        fetchTransactions();
      } else {
        const data = await res.json();
        showToast(data.message || 'Rating submission failed.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulator QR codes
  const showQrToken = (tx) => {
    setQrToken(tx.qrToken || 'qr_mock_1234');
    setQrTitle(tx.resourceName);
    setIsQrOpen(true);
  };

  const activeList = activeTab === 'borrowings' ? borrowings : lendings;

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Borrowings & Lendings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track active loans, request return validations, and view QR tokens.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('borrowings')}
          className={`py-3 text-sm font-semibold border-b-2 uppercase tracking-wide transition-all ${
            activeTab === 'borrowings'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Borrowed Items ({borrowings.length})
        </button>
        <button
          onClick={() => setActiveTab('lendings')}
          className={`py-3 text-sm font-semibold border-b-2 uppercase tracking-wide transition-all ${
            activeTab === 'lendings'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Lent Items ({lendings.length})
        </button>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeList.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 shadow-sm">
          No transactions recorded.
        </div>
      ) : (
        <div className="space-y-4">
          {activeList.map((tx) => (
            <div
              key={tx.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              {/* Info Column */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs flex-shrink-0">
                  {tx.resourceName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate max-w-[200px] md:max-w-md">
                    {tx.resourceName}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeTab === 'borrowings' ? `Lender: ${tx.ownerName}` : `Borrower: ${tx.borrowerName}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Due: {new Date(tx.expectedReturnDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Badges & Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                {/* Status badges */}
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    tx.status === 'overdue' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse' :
                    tx.status === 'returned' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    tx.status === 'disputed' ? 'bg-rose-500/10 text-rose-500' :
                    'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {tx.status}
                  </span>
                  {tx.returnConfirmationRequested && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase">
                      Return Requested
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* QR Token Button (simulation) */}
                  {tx.status !== 'returned' && (
                    <button
                      onClick={() => showQrToken(tx)}
                      className="p-2 rounded-xl text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Show Verification QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  )}

                  {/* Actions for Borrower */}
                  {activeTab === 'borrowings' && tx.status !== 'returned' && (
                    <button
                      onClick={() => handleRequestReturn(tx.id)}
                      disabled={tx.returnConfirmationRequested}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl text-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      {tx.returnConfirmationRequested ? 'Awaiting Confirmation' : 'Request Return'}
                    </button>
                  )}

                  {/* Actions for Lender */}
                  {activeTab === 'lendings' && tx.status !== 'returned' && (
                    <button
                      onClick={() => handleConfirmReturn(tx.id)}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700"
                    >
                      Confirm Return
                    </button>
                  )}

                  {/* Rating trigger */}
                  {tx.status === 'returned' && (
                    <button
                      onClick={() => openRatingModal(tx.id)}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-700"
                    >
                      Rate User
                    </button>
                  )}

                  {/* Dispute Action */}
                  {tx.status !== 'returned' && tx.status !== 'disputed' && (
                    <button
                      onClick={() => handleDispute(tx.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                      title="Dispute item condition/return"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Simulation Modal */}
      {isQrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsQrOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 text-center flex flex-col items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">QR Handover Token</h3>
            <p className="text-slate-400 text-xs mt-1 mb-6">{qrTitle}</p>

            {/* Mock QR drawing */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center mb-6">
              {/* Simulated QR block layout */}
              <div className="w-40 h-40 bg-slate-100 flex flex-wrap p-2 border-2 border-slate-900 relative">
                {/* 4 corner alignment targets */}
                <div className="absolute top-2 left-2 w-8 h-8 border-4 border-slate-950 bg-white" />
                <div className="absolute top-2 right-2 w-8 h-8 border-4 border-slate-950 bg-white" />
                <div className="absolute bottom-2 left-2 w-8 h-8 border-4 border-slate-950 bg-white" />
                <div className="absolute bottom-2 right-2 w-8 h-8 border-2 border-dashed border-slate-950 bg-slate-300 flex items-center justify-center font-bold text-[8px]">QR</div>
                <div className="w-full h-full flex flex-col justify-center items-center gap-1.5 opacity-60">
                  <div className="w-24 h-1 bg-slate-950" />
                  <div className="w-20 h-1 bg-slate-950" />
                  <div className="w-28 h-1 bg-slate-950" />
                  <div className="w-24 h-1 bg-slate-950" />
                  <div className="w-16 h-1 bg-slate-950" />
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-4 block">{qrToken}</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Show this code to the lender/borrower during handover or return to quickly scan and record the transaction.
            </p>

            <button
              onClick={() => setIsQrOpen(false)}
              className="w-full py-3 bg-brand-600 text-white font-bold rounded-2xl"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* User Rating Modal */}
      {isRateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRateOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 text-left">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Rate Transaction</h3>
            <p className="text-slate-400 text-xs mb-6">Leave rating feedback to reward helpful students and shape our trust score.</p>

            <form onSubmit={handleRateSubmit} className="space-y-5">
              {/* Star selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">Stars rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 rounded text-amber-400 hover:scale-125 transition-transform"
                    >
                      <Star className={`w-8 h-8 ${rating >= star ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Short Review Comment</label>
                <textarea
                  rows="3"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="e.g. Friendly student, returned the ESP32 on time and in perfect condition!"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRateOpen(false)}
                  className="flex-1 py-3 text-sm font-semibold rounded-2xl border border-slate-200 dark:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-2xl transition-all cursor-pointer"
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBorrowings;
