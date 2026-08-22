import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Search,
  Download,
  PlusCircle,
  Bookmark,
  Share2,
  AlertTriangle,
  ArrowRight,
  BookmarkCheck
} from 'lucide-react';

const StudyMaterials = () => {
  const { token, user, showToast } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState(JSON.parse(localStorage.getItem('bookmarks') || '[]'));

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    subCategory: 'Notes',
    description: '',
    fileUrl: '',
    agreePermission: false
  });

  const subCategories = ['Notes', 'PDFs', 'PPTs', 'Assignments', 'Previous Year Papers', 'Lab Manuals'];

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      // Get only digital items
      const res = await fetch(`/api/resources?type=Digital+Resource`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (err) {
      console.error('Error fetching digital materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [token]);

  const handleToggleBookmark = (id) => {
    let nextBookmarks;
    if (bookmarks.includes(id)) {
      nextBookmarks = bookmarks.filter(b => b !== id);
      showToast("Removed from bookmarks");
    } else {
      nextBookmarks = [...bookmarks, id];
      showToast("Added to bookmarks!");
    }
    setBookmarks(nextBookmarks);
    localStorage.setItem('bookmarks', JSON.stringify(nextBookmarks));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const { name, description, subCategory: sub, fileUrl, agreePermission } = newMaterial;

    if (!name || !description || !agreePermission) {
      showToast('Please fill all fields and agree to sharing permissions.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          category: 'Study Materials',
          subCategory: sub,
          description,
          type: 'Digital Resource',
          condition: 'New',
          fileUrl: fileUrl || `/files/mock_${name.toLowerCase().replace(/[^a-z]/g, '_')}.pdf`,
          availability: 'available'
        })
      });

      if (res.ok) {
        showToast('Digital resource uploaded successfully!');
        setIsModalOpen(false);
        setNewMaterial({
          name: '',
          subCategory: 'Notes',
          description: '',
          fileUrl: '',
          agreePermission: false
        });
        fetchMaterials();
      } else {
        const data = await res.json();
        showToast(data.message || 'Upload failed.', 'error');
      }
    } catch (err) {
      showToast('Server connection error.', 'error');
    }
  };

  const handleReport = async (item) => {
    const reason = window.prompt(`Why are you reporting "${item.name}"? (e.g. copyright issues, incorrect files, inappropriate material)`);
    if (!reason) return;

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetId: item.id,
          targetType: 'resource',
          reason
        })
      });

      if (res.ok) {
        showToast('Report submitted. Admin will review this shortly.');
      } else {
        showToast('Failed to submit report.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter logic
  const filtered = materials.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    const matchSub = subCategory ? item.subCategory === subCategory : true;
    return matchSearch && matchSub;
  });

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-900 dark:to-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div>
          <h1 className="text-2xl font-bold">Study Materials Hub</h1>
          <p className="text-slate-400 text-sm mt-1">Upload and download reference notes, PPTs, assignments and PYQs.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Upload Material
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, assignments, subjects..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
          />
        </div>
        <select
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300"
        >
          <option value="">All Categories</option>
          {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 shadow-sm">
          No files match your query. Try adding one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover-lift relative"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleBookmark(item.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {bookmarks.includes(item.id) ? (
                        <BookmarkCheck className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleReport(item)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Report Inappropriate Content"
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                  {item.subCategory || 'Document'}
                </span>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mt-2 truncate leading-snug">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
                  Uploaded by: <strong>{item.ownerName}</strong>
                </span>
                <a
                  href={item.fileUrl}
                  download
                  onClick={() => {
                    if (item.ownerId === user.id) return;
                    showToast("Resource download initiated.");
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-500/15 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Upload Study Material</h3>
            <form onSubmit={handleUploadSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Resource Name</label>
                <input
                  type="text"
                  required
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Computer Networks Semester Notes"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Category Type</label>
                <select
                  value={newMaterial.subCategory}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, subCategory: e.target.value }))}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm"
                >
                  {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Short Description</label>
                <textarea
                  required
                  rows="3"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Summarize content (units covered, topic outline)..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Document URL / Mock path (Optional)</label>
                <input
                  type="text"
                  value={newMaterial.fileUrl}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, fileUrl: e.target.value }))}
                  placeholder="e.g. /files/lecture_notes_cn.pdf"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-start gap-3 py-2">
                <input
                  type="checkbox"
                  id="agreePermission"
                  checked={newMaterial.agreePermission}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, agreePermission: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                />
                <label htmlFor="agreePermission" className="text-xs text-slate-500 leading-normal">
                  I agree that I have permissions or copyrights to share this study resource with the campus community, and confirm it is free of inappropriate or private contents.
                </label>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-sm font-semibold rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-all"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterials;
