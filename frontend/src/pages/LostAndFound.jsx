import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, PlusCircle, Search, Calendar, MapPin, MessageSquare, Trash2 } from 'lucide-react';

const LostAndFound = () => {
  const { token, user, showToast } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // '', 'lost', 'found'
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    type: 'lost',
    generalLocation: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lostfound', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, type, generalLocation, date } = newPost;

    if (!title || !description || !generalLocation || !date) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/lostfound', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
      });

      if (res.ok) {
        showToast('Bulletin post published successfully!');
        setIsModalOpen(false);
        setNewPost({
          title: '',
          description: '',
          type: 'lost',
          generalLocation: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (id) => {
    const confirm = window.confirm('Are you sure you want to remove this bulletin post?');
    if (!confirm) return;

    try {
      const res = await fetch(`/api/lostfound/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Bulletin post removed.');
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleContact = async (post) => {
    if (post.posterId === user.id) {
      showToast('This is your own bulletin post!', 'error');
      return;
    }
    // Initiate Chat
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: post.posterId,
          content: `Hi ${post.posterName}, I am contacting you regarding your Lost & Found post: "${post.title}".`
        })
      });
    } catch (err) {}
    navigate(`/messages?chatWith=${post.posterId}`);
  };

  const filtered = posts.filter(post => {
    const matchSearch = post.title.toLowerCase().includes(search.toLowerCase()) || post.description.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? post.type === typeFilter : true;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-900 dark:to-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div>
          <h1 className="text-2xl font-bold">Lost & Found Bulletin</h1>
          <p className="text-slate-400 text-sm mt-1">Help fellow students recover lost IDs, wallets, keys or calculators.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Create Post
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items, tags, descriptions..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['', 'lost', 'found'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-semibold uppercase tracking-wider border capitalize transition-all ${
                typeFilter === type
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900'
              }`}
            >
              {type || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid bulletin posts */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500">
          No bulletin items listed.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover-lift relative"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    post.type === 'lost' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {post.type}
                  </span>
                  {post.posterId === user.id && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {post.description}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5" />
                    {post.generalLocation}
                  </span>
                </div>
              </div>

              {post.posterId !== user.id && (
                <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-805 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    Posted by: <strong>{post.posterName}</strong>
                  </span>
                  <button
                    onClick={() => handleContact(post)}
                    className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-500/15 cursor-pointer transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Contact
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Bulletin Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-50">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Create Bulletin Post</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Post Title</label>
                <input
                  type="text"
                  required
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Lost Casio Calculator in Library"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Bulletin Type</label>
                <select
                  value={newPost.type}
                  onChange={(e) => setNewPost(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm"
                >
                  <option value="lost">I Lost Something</option>
                  <option value="found">I Found Something</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Item Description</label>
                <textarea
                  required
                  rows="3"
                  value={newPost.description}
                  onChange={(e) => setNewPost(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide key details like tags, color, serials (avoid sensitive details)..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Approx Date</label>
                  <input
                    type="date"
                    required
                    value={newPost.date}
                    onChange={(e) => setNewPost(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">General Location</label>
                  <input
                    type="text"
                    required
                    value={newPost.generalLocation}
                    onChange={(e) => setNewPost(prev => ({ ...prev, generalLocation: e.target.value }))}
                    placeholder="e.g. library staircase"
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-sm font-semibold rounded-2xl border border-slate-200 dark:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-2xl transition-all"
                >
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostAndFound;
