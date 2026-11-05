import React, { useState } from 'react';
import { 
  Upload, Image as ImageIcon, Video, Lock, Unlock, 
  ArrowLeft, CheckCircle, AlertCircle, Sparkles, RefreshCw, Eye 
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Art & Cosplay', 'Fitness', 'Fashion', 'Photography', 'Gaming', 'Lifestyle', 'Music'];

export function UploadPostPage({ onBack, onPostCreated }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Art & Cosplay');
  const [price, setPrice] = useState('10.00');
  const [isLocked, setIsLocked] = useState(true);
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mediaType, setMediaType] = useState('photo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      const ext = file.name.split('.').pop().toLowerCase();
      setMediaType(['mp4', 'mov'].includes(ext) ? 'video' : 'photo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a post title.');
      return;
    }

    if (!mediaFile) {
      setError('Please choose a photo or video to upload.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('price', isLocked ? price : '0.00');
      formData.append('isLocked', isLocked ? 'true' : 'false');
      formData.append('media', mediaFile);

      const res = await api.posts.create(formData);
      alert('Post created successfully!');
      onPostCreated(res.postId);
    } catch (err) {
      setError(err.message || 'Failed to upload post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Create New Post</h1>
        <p className="text-xs text-gray-400 mt-1">
          Publish premium photo sets or videos with optional paywall locks.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Form (7 cols) */}
        <div className="md:col-span-7 space-y-5">
          <form onSubmit={handleSubmit} className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated space-y-4">
            
            {/* File Dropzone */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Media File (Photo / Video)
              </label>
              <div className="border-2 border-dashed border-surface-border hover:border-primary-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-surface/50 relative">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {previewUrl ? (
                  <div className="space-y-2">
                    {mediaType === 'video' ? (
                      <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400 mx-auto">
                        <Video className="w-8 h-8" />
                      </div>
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-24 h-24 rounded-2xl object-cover mx-auto border border-surface-border"
                      />
                    )}
                    <div className="text-xs font-bold text-white truncate max-w-xs mx-auto">
                      {mediaFile?.name}
                    </div>
                    <div className="text-[10px] text-emerald-400">File attached • Click to replace</div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                    <div className="text-xs font-bold text-white">Choose a high-res photo or video</div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      JPG, PNG, WebP (up to 20MB) or MP4, MOV (up to 100MB)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Post Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Valkyrie of the Frozen Peak - 4K Set"
                className="w-full px-4 py-2.5 bg-surface border border-surface-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Description / Teaser
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details on what fans will unlock..."
                rows={3}
                className="w-full px-4 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Locked / Free Toggle */}
            <div className="pt-2 border-t border-surface-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center">
                    <Lock className="w-3.5 h-3.5 mr-1 text-primary-400" />
                    Lock Behind Paywall
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Require fans to pay or subscribe to view full media
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary-500 cursor-pointer"
                />
              </div>

              {isLocked && (
                <div className="mt-3 bg-surface p-3 rounded-2xl border border-surface-border">
                  <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                    Pay-Per-Post Price (USD $)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1.00"
                      max="150.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-surface-card border border-surface-border rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 flex justify-between">
                    <span>Platform cut (20%): ${(parseFloat(price || 0) * 0.20).toFixed(2)}</span>
                    <span className="text-emerald-400 font-bold">Your Net (80%): ${(parseFloat(price || 0) * 0.80).toFixed(2)} USD</span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-400 hover:to-amber-400 text-black font-extrabold text-xs rounded-xl shadow-glow-gold flex items-center justify-center space-x-2 transition-transform active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing & Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Publish to Fans</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Right Column: Live Teaser Simulator (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center">
            <Eye className="w-4 h-4 mr-1.5 text-primary-400" />
            Live Fan Preview Simulator
          </div>

          <div className="bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-card-elevated">
            <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className={`w-full h-full object-cover ${isLocked ? 'locked-blur scale-110 filter blur-xl' : ''}`}
                />
              ) : (
                <div className="text-center p-6 text-gray-500">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <div className="text-xs">Select file to view live card preview</div>
                </div>
              )}

              {isLocked && previewUrl && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4">
                  <div className="w-10 h-10 rounded-xl bg-black/80 border border-primary-500/40 flex items-center justify-center text-primary-400 mb-1 shadow-glow-gold">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-white drop-shadow">
                    Locked for ${parseFloat(price || 0).toFixed(2)} USD
                  </span>
                </div>
              )}

              <div className="absolute top-2.5 right-2.5">
                {isLocked ? (
                  <span className="px-2 py-0.5 rounded-full bg-primary-500 text-[10px] font-extrabold text-black shadow-glow-gold">
                    ${parseFloat(price || 0).toFixed(2)}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-black">
                    Free
                  </span>
                )}
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-bold text-xs text-white truncate">
                {title || 'Your Post Title Here'}
              </h4>
              <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                {description || 'Description will appear here for browsing fans.'}
              </p>
              <div className="mt-3 pt-2 border-t border-surface-border flex items-center justify-between text-[10px] text-gray-400">
                <span>By @{user?.username}</span>
                <span className="text-primary-400 font-semibold">{category}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
