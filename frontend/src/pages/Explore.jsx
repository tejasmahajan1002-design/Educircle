import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle,
  HelpCircle,
  Clock
} from 'lucide-react';

const Explore = () => {
  const { token, user, showToast } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [availability, setAvailability] = useState(searchParams.get('availability') || '');
  const [department, setDepartment] = useState(searchParams.get('department') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const categories = ['Study Materials', 'Books', 'Electronics & IoT', 'Tools', 'Student Equipment', 'Other'];
  const conditions = ['New', 'Good', 'Used', 'Fair'];
  const departments = ['Computer Science', 'Electronics & Comm', 'Mechanical Eng', 'Civil Eng', 'Electrical Eng'];

  const fetchResources = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchQuery) query.append('search', searchQuery);
      if (category) query.append('category', category);
      if (type) query.append('type', type);
      if (condition) query.append('condition', condition);
      if (availability) query.append('availability', availability);
      if (department) query.append('department', department);
      if (sortBy) query.append('sortBy', sortBy);

      const res = await fetch(`/api/resources?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    // Sync query params in URL
    const nextParams = {};
    if (searchQuery) nextParams.search = searchQuery;
    if (category) nextParams.category = category;
    if (type) nextParams.type = type;
    if (condition) nextParams.condition = condition;
    if (availability) nextParams.availability = availability;
    if (department) nextParams.department = department;
    if (sortBy) nextParams.sortBy = sortBy;
    setSearchParams(nextParams);
  }, [category, type, condition, availability, department, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategory('');
    setType('');
    setCondition('');
    setAvailability('');
    setDepartment('');
    setSortBy('newest');
    setSearchParams({});
  };

  // Immediate Borrow request trigger (checks constraints before details)
  const handleQuickBorrow = (item) => {
    if (item.ownerId === user.id) {
      showToast("You cannot borrow your own resource!", "error");
      return;
    }
    navigate(`/resources/${item.id}?action=borrow`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Explore Resources</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Discover, borrow and exchange study assets and lab components.</p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Arduino, calculators, books, notes..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-6 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/10 rounded-2xl cursor-pointer"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="sm:hidden p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar (Desktop) */}
        <div className={`hidden sm:block p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 text-left shadow-sm self-start`}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-500" />
              Filters
            </h3>
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Clear All
            </button>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-brand-500"
            >
              <option value="newest">Newest Added</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Resource Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Resource Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType(type === 'Physical Item' ? '' : 'Physical Item')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border ${
                  type === 'Physical Item'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Physical
              </button>
              <button
                type="button"
                onClick={() => setType(type === 'Digital Resource' ? '' : 'Digital Resource')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border ${
                  type === 'Digital Resource'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Digital
              </button>
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Item Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Any Condition</option>
              {conditions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Availability</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
            >
              <option value="">Any Status</option>
              <option value="available">Available Now</option>
              <option value="borrowed">Borrowed</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Owner Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
            >
              <option value="">Any Department</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Mobile Filters Overlay */}
        {showFiltersMobile && (
          <div className="fixed inset-0 z-50 flex sm:hidden">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowFiltersMobile(false)} />
            <div className="relative w-80 max-w-sm bg-white dark:bg-slate-900 p-6 flex flex-col justify-between overflow-y-auto z-50 text-left border-r border-slate-200 dark:border-slate-800">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="font-bold">Filters</h3>
                  <button onClick={handleClearFilters} className="text-xs text-brand-600 font-semibold">Clear All</button>
                </div>
                {/* Same dropdowns for mobile */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400 block">Sort By</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-xs">
                    <option value="newest">Newest Added</option>
                    <option value="rating">Highest Rated</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400 block">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-xs">
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400 block">Condition</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-xs">
                    <option value="">Any Condition</option>
                    {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={() => setShowFiltersMobile(false)}
                className="w-full mt-6 py-3 bg-brand-600 text-white font-bold rounded-2xl"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Resources Grid List */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : resources.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 shadow-sm">
              <SlidersHorizontal className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">No Resources Found</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                We couldn't find any resources matching your parameters. Try modifying your filters or search keywords.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-6 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {resources.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover-lift overflow-hidden flex flex-col justify-between shadow-sm text-left relative"
                >
                  <div>
                    {/* Image Header */}
                    <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative">
                      <span className="absolute top-3 left-3 px-2 py-1 rounded-lg text-[9px] font-bold tracking-wide uppercase bg-slate-900/80 text-white backdrop-blur-sm">
                        {item.type}
                      </span>
                      <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.availability === 'available' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        item.availability === 'borrowed' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                        'bg-slate-500/10 text-slate-500'
                      }`}>
                        {item.availability}
                      </span>
                      {/* Name initials text placeholder */}
                      <div className="text-slate-400 dark:text-slate-600 text-xs font-bold text-center p-4">
                        {item.name}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                        {item.category}
                      </span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-1 truncate group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed h-8">
                        {item.description}
                      </p>

                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                        <div>
                          <span className="block text-slate-400">Condition:</span>
                          <strong className="text-slate-700 dark:text-slate-300 font-semibold">{item.condition}</strong>
                        </div>
                        <div>
                          <span className="block text-slate-400">Max Duration:</span>
                          <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                            {item.type === 'Digital Resource' ? 'Unlimited' : `${item.lendingDuration} Days`}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-5 pt-0 border-t border-slate-50 dark:border-slate-800/40 mt-auto flex gap-3">
                    <button
                      onClick={() => navigate(`/resources/${item.id}`)}
                      className="flex-1 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl transition-all text-center cursor-pointer"
                    >
                      View Details
                    </button>
                    {item.availability === 'available' && item.type !== 'Digital Resource' ? (
                      <button
                        onClick={() => handleQuickBorrow(item)}
                        className="flex-1 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/10 rounded-xl transition-all cursor-pointer"
                      >
                        Request
                      </button>
                    ) : item.type === 'Digital Resource' ? (
                      <a
                        href={item.fileUrl || '#'}
                        download
                        className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 text-center rounded-xl transition-all cursor-pointer block"
                        onClick={(e) => {
                          if (item.ownerId === user.id) return;
                          showToast("Downloading digital material...");
                        }}
                      >
                        Download
                      </a>
                    ) : (
                      <button
                        disabled
                        className="flex-1 py-2.5 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800/20 rounded-xl cursor-not-allowed"
                      >
                        Lent Out
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;
