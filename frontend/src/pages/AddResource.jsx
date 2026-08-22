import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Cpu, FileText, ArrowLeft, Image as ImageIcon } from 'lucide-react';

const AddResource = () => {
  const { token, showToast } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Electronics & IoT',
    description: '',
    type: 'Physical Item',
    condition: 'Good',
    lendingDuration: '7',
    location: '',
    fileUrl: '',
    imagesInput: ''
  });

  const [loading, setLoading] = useState(false);

  const categories = ['Study Materials', 'Books', 'Electronics & IoT', 'Tools', 'Student Equipment', 'Other'];
  const conditions = ['New', 'Good', 'Used', 'Fair'];
  const types = ['Physical Item', 'Digital Resource'];

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, category, description, type, condition, lendingDuration, location, fileUrl, imagesInput } = formData;

    if (!name || !category || !description || !type || !condition) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      const parsedImages = imagesInput
        ? imagesInput.split(',').map(img => img.trim()).filter(Boolean)
        : [];

      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          category,
          description,
          type,
          condition,
          lendingDuration: type === 'Digital Resource' ? 0 : parseInt(lendingDuration) || 7,
          location: type === 'Digital Resource' ? 'Online' : (location || 'Hostel Lobby'),
          fileUrl: type === 'Digital Resource' ? (fileUrl || '/files/sample_notes.pdf') : null,
          images: parsedImages,
          availability: 'available'
        })
      });

      if (res.ok) {
        showToast('Resource listed successfully!');
        navigate('/explore');
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to add resource.', 'error');
      }
    } catch (err) {
      showToast('Network error, try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 text-left">
      {/* Back Link */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Share a Resource</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Lend a device or share files to make tools easily accessible.</p>
      </div>

      {/* Form Card */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resource Name */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Resource Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Arduino Uno Board or Casio fx-991EX"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Resource Type */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Resource Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm"
              >
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Item Condition */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Condition *</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm"
              >
                {conditions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Location (only physical items) */}
            {formData.type === 'Physical Item' && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Meeting Point / Location *</label>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Hostel C Lobby or library desk"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}

            {/* Lending Duration (only physical items) */}
            {formData.type === 'Physical Item' && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Lending Duration (Max Days) *</label>
                <input
                  type="number"
                  name="lendingDuration"
                  required
                  min="1"
                  max="90"
                  value={formData.lendingDuration}
                  onChange={handleChange}
                  placeholder="7"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}

            {/* Digital Resource PDF path (only digital items) */}
            {formData.type === 'Digital Resource' && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Digital File Link / Mock URL</label>
                <input
                  type="text"
                  name="fileUrl"
                  value={formData.fileUrl}
                  onChange={handleChange}
                  placeholder="e.g. /files/sample.pdf"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Detailed Description *</label>
            <textarea
              name="description"
              required
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="State key configurations, attachments included, or specific expectations..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Image URLs input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Image URLs (comma separated, Optional)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <ImageIcon className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                name="imagesInput"
                value={formData.imagesInput}
                onChange={handleChange}
                placeholder="e.g. https://domain.com/img1.jpg, https://domain.com/img2.png"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Submission and loading */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold text-white gradient-bg hover:shadow-lg hover:shadow-brand-500/25 rounded-2xl disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <span>Listing your item...</span>
              ) : (
                <>
                  <PlusCircle className="w-4.5 h-4.5" />
                  List Resource
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddResource;
