import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Share2, Trash2, Edit3, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

const MyResources = () => {
  const { token, user, showToast } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'available', 'borrowed', 'unavailable'

  const fetchMyResources = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/resources', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setListings(data.filter(r => r.ownerId === user.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyResources();
  }, [token]);

  const handleToggleAvailability = async (item) => {
    const nextAvailability = item.availability === 'available' ? 'unavailable' : 'available';

    // Prevent making unavailable if currently borrowed
    if (item.availability === 'borrowed') {
      showToast('Cannot modify status of a currently borrowed item.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/resources/${item.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ availability: nextAvailability })
      });

      if (res.ok) {
        showToast(`Resource marked as ${nextAvailability}!`);
        fetchMyResources();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteListing = async (item) => {
    const confirm = window.confirm(`Are you sure you want to delete "${item.name}"?`);
    if (!confirm) return;

    try {
      const res = await fetch(`/api/resources/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Listing deleted.');
        fetchMyResources();
      } else {
        showToast(data.message || 'Delete failed.', 'error');
      }
    } catch (err) {
      showToast('Connection error.', 'error');
    }
  };

  // Filter listings based on tab selection
  const filtered = listings.filter(item => {
    if (activeTab === 'available') return item.availability === 'available';
    if (activeTab === 'borrowed') return item.availability === 'borrowed';
    if (activeTab === 'unavailable') return item.availability === 'unavailable';
    return true;
  });

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">My Shared Listings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review the equipment and manuals you have listed on CampusShare.</p>
        </div>
        <button
          onClick={() => navigate('/share-resource')}
          className="px-5 py-3 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/10 rounded-2xl cursor-pointer"
        >
          Add New Listing
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        {['all', 'available', 'borrowed', 'unavailable'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-sm font-semibold border-b-2 uppercase tracking-wide transition-all ${
              activeTab === tab
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab} ({listings.filter(i => tab === 'all' ? true : i.availability === tab).length})
          </button>
        ))}
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 shadow-sm">
          No listed items in this category.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs flex-shrink-0">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate max-w-xs">{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{item.category} • {item.type}</p>
                </div>
              </div>

              {/* Status & Options */}
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  item.availability === 'available' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                  item.availability === 'borrowed' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                  'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {item.availability}
                </span>

                <div className="flex items-center gap-2">
                  {item.type === 'Physical Item' && (
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className="p-2 rounded-xl text-slate-500 hover:text-brand-500 hover:bg-brand-500/10 transition-all"
                      title={item.availability === 'available' ? 'Mark Unavailable' : 'Mark Available'}
                      disabled={item.availability === 'borrowed'}
                    >
                      <RefreshCw className={`w-4 h-4 ${item.availability === 'borrowed' ? 'opacity-30' : ''}`} />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/resources/${item.id}`)}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteListing(item)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyResources;
