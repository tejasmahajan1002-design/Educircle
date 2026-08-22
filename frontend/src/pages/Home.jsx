import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  PlusCircle,
  Cpu,
  BookOpen,
  FileText,
  Wrench,
  Calculator,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    // Fetch a few recently added items
    const fetchRecents = async () => {
      try {
        const res = await fetch('/api/resources?sortBy=newest');
        if (res.ok) {
          const data = await res.json();
          setRecentItems(data.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load recent items:', err);
      }
    };
    fetchRecents();
  }, []);

  const categories = [
    { name: 'Study Materials', desc: 'Notes, previous papers, PPTs', icon: FileText, color: 'from-blue-500 to-indigo-500' },
    { name: 'Books', desc: 'Textbooks, GATE prep guides, manuals', icon: BookOpen, color: 'from-emerald-500 to-teal-500' },
    { name: 'Electronics & IoT', desc: 'Arduino, ESP32, sensors, Pi', icon: Cpu, color: 'from-purple-500 to-pink-500' },
    { name: 'Tools', desc: 'Multimeters, soldering irons', icon: Wrench, color: 'from-amber-500 to-orange-500' },
    { name: 'Student Equipment', desc: 'Scientific calculators, drafters', icon: Calculator, color: 'from-rose-500 to-red-500' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none opacity-20 dark:opacity-30">
          <div className="absolute top-[-10%] left-[10%] w-[350px] h-[350px] rounded-full bg-brand-500 blur-[100px]" />
          <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-indigo-500 blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-6">
            <TrendingUp className="w-3.5 h-3.5" />
            Empowering Campus Sharing
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Share More. Spend Less.<br />
            <span className="gradient-text font-black">Learn Together.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400 mb-10">
            Borrow, lend, exchange, and share resources with students from your campus. Save money, reduce electronic waste, and grow your community.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/explore')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white gradient-bg rounded-2xl shadow-xl shadow-brand-500/20 hover:scale-105 hover:shadow-brand-500/30 transition-all cursor-pointer"
            >
              <Compass className="w-5 h-5" />
              Explore Resources
            </button>
            <button
              onClick={() => navigate(user ? '/share-resource' : '/login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-brand-500" />
              Share a Resource
            </button>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Resource Categories</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Find exactly what you need for your courses and projects</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.name}
                  onClick={() => navigate(`/explore?category=${encodeURIComponent(cat.name)}`)}
                  className="group cursor-pointer p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover-lift text-left"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-tr ${cat.color} text-white shadow-md shadow-brand-500/10 mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recently Added Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Recently Added</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Lately uploaded study materials & campus gadgets</p>
            </div>
            <Link
              to="/explore"
              className="flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              See all listings
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentItems.length === 0 ? (
            <div className="text-center p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
              No shared resources yet. Be the first to upload!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/resources/${item.id}`)}
                  className="cursor-pointer group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover-lift overflow-hidden flex flex-col"
                >
                  <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative">
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase bg-slate-900/80 text-white backdrop-blur-sm">
                      {item.type}
                    </span>
                    <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      item.availability === 'available' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      item.availability === 'borrowed' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {item.availability}
                    </span>
                    {/* Placeholder image */}
                    <div className="text-slate-400 dark:text-slate-600 text-xs font-bold text-center p-4">
                      {item.name}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between text-left">
                    <div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider block">
                        {item.category}
                      </span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-1 truncate group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span>Owner: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{item.ownerName || 'Student'}</strong></span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        ★ {item.ratingAverage || 'New'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
