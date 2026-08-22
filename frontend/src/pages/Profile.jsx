import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Star, Calendar, User, BookOpen, Clock } from 'lucide-react';

const Profile = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          showToast('Profile not found.', 'error');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-16 text-center text-slate-500">
        Profile data unavailable.
      </div>
    );
  }

  const { user: userProfile, ratings, resources, successfulTransactionsCount } = profile;

  return (
    <div className="space-y-8 pb-12 text-left">
      {/* Top Banner Profile summary */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-brand-500 flex items-center justify-center font-bold text-white text-3xl">
            {userProfile.name.charAt(0)}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{userProfile.name}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {userProfile.department} • {userProfile.year}
            </p>
            <p className="text-slate-400 text-xs mt-1">Roll Number: {userProfile.rollNumber}</p>
          </div>
        </div>

        {/* Global Statistics */}
        <div className="grid grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl text-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Trust Score</span>
            <strong className="text-slate-800 dark:text-slate-200 font-extrabold text-lg block mt-1">
              {userProfile.trustScore}/100
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Avg Rating</span>
            <strong className="text-slate-850 dark:text-slate-200 font-extrabold text-lg block mt-1 text-amber-500">
              ★ {userProfile.ratingAverage || 'New'}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Returns</span>
            <strong className="text-slate-805 dark:text-slate-200 font-extrabold text-lg block mt-1">
              {successfulTransactionsCount}
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle Column: Shared resources list */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Shared Resources ({resources.length})</h3>
          {resources.length === 0 ? (
            <div className="p-12 text-center text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-slate-500">
              This student has not shared any resources yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {resources.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/resources/${item.id}`)}
                  className="cursor-pointer group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover-lift overflow-hidden flex flex-col justify-between shadow-sm"
                >
                  <div className="p-5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-slate-850 dark:text-slate-200 mt-1 truncate group-hover:text-brand-500 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="p-5 pt-0 mt-auto flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 dark:border-slate-850/40">
                    <span>{item.type}</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{item.availability}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Ratings left by others */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">User Reviews ({ratings.length})</h3>
          <div className="space-y-4">
            {ratings.length === 0 ? (
              <div className="p-8 text-center text-xs border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl text-slate-500 bg-white dark:bg-slate-900">
                No feedback reviews left for this user yet.
              </div>
            ) : (
              ratings.map((rate) => (
                <div
                  key={rate.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{rate.raterName}</span>
                    <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                      ★ {rate.rating}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                    "{rate.review}"
                  </p>
                  <span className="text-[9px] text-slate-400 block mt-1 text-right">
                    {new Date(rate.createdAt).toLocaleDateString()}
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

export default Profile;
