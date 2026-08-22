import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, ShieldCheck, Star, Users, FolderHeart, Zap } from 'lucide-react';

const Leaderboard = () => {
  const { token } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await fetch('/api/users/leaderboard/rankings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRankings(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [token]);

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-900 dark:to-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            Top Campus Contributors
          </h1>
          <p className="text-slate-400 text-sm mt-1">Recognizing students helping others save money, learn together, and protect the environment.</p>
        </div>
      </div>

      {/* Leaderboard Rankings */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rankings.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500">
          No rankings compiled yet.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top 3 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
            {/* Rank 2 */}
            {rankings[1] && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center order-2 md:order-1 h-[260px] justify-center relative">
                <span className="absolute -top-3 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  2nd Place
                </span>
                <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-lg border-2 border-slate-300">
                  {rankings[1].name.charAt(0)}
                </div>
                <h3 className="font-extrabold text-slate-800 dark:text-white mt-3 text-sm">{rankings[1].name}</h3>
                <p className="text-slate-400 text-[10px]">{rankings[1].department}</p>
                <div className="mt-4 flex items-center gap-3 text-xs font-bold text-slate-500">
                  <span>Score: <strong className="text-brand-500">{rankings[1].score}</strong></span>
                  <span>•</span>
                  <span>Trust: {rankings[1].trustScore}</span>
                </div>
              </div>
            )}

            {/* Rank 1 (Tallest) */}
            {rankings[0] && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col items-center order-1 md:order-2 h-[290px] justify-center relative ring-2 ring-amber-500">
                <span className="absolute -top-4 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-lg">
                  1st Contributor
                </span>
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center font-bold text-amber-600 text-2xl border-4 border-amber-500">
                  {rankings[0].name.charAt(0)}
                </div>
                <h3 className="font-black text-slate-850 dark:text-white mt-3 text-base">{rankings[0].name}</h3>
                <p className="text-slate-400 text-xs">{rankings[0].department}</p>
                <div className="mt-4 flex items-center gap-3 text-xs font-bold text-slate-500">
                  <span>Score: <strong className="text-amber-500">{rankings[0].score}</strong></span>
                  <span>•</span>
                  <span>Trust: {rankings[0].trustScore}</span>
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {rankings[2] && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center order-3 h-[240px] justify-center relative">
                <span className="absolute -top-3 px-3 py-1 rounded-full text-xs font-bold bg-amber-700/10 text-amber-700 dark:text-amber-600">
                  3rd Place
                </span>
                <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-lg border-2 border-amber-700/40">
                  {rankings[2].name.charAt(0)}
                </div>
                <h3 className="font-extrabold text-slate-800 dark:text-white mt-3 text-sm">{rankings[2].name}</h3>
                <p className="text-slate-400 text-[10px]">{rankings[2].department}</p>
                <div className="mt-4 flex items-center gap-3 text-xs font-bold text-slate-500">
                  <span>Score: <strong className="text-brand-500">{rankings[2].score}</strong></span>
                  <span>•</span>
                  <span>Trust: {rankings[2].trustScore}</span>
                </div>
              </div>
            )}
          </div>

          {/* Table List of Remainder */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Rankings List</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 text-center w-12">Rank</th>
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3 text-center">Trust Rating</th>
                    <th className="pb-3 text-center">Shared count</th>
                    <th className="pb-3 text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {rankings.map((student, index) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-4 text-center font-bold text-slate-500">{index + 1}</td>
                      <td className="py-4 font-bold text-slate-800 dark:text-slate-200">{student.name}</td>
                      <td className="py-4 text-slate-500">{student.department}</td>
                      <td className="py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {student.trustScore}
                        </span>
                      </td>
                      <td className="py-4 text-center text-slate-500">{student.sharedCount} items</td>
                      <td className="py-4 text-center font-extrabold text-brand-600 dark:text-brand-400">{student.score} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
