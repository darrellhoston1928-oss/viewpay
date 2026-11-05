import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, Bookmark, Users, Sparkles, 
  Image as ImageIcon, Video, Calendar, ArrowRight, Play 
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export function LibraryPage({ onSelectPost, onSelectCreator }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('unlocked'); // unlocked, subscriptions, saved
  const [unlockedPosts, setUnlockedPosts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      if (activeTab === 'unlocked') {
        const res = await api.library.getUnlocked();
        setUnlockedPosts(res.posts || []);
      } else if (activeTab === 'subscriptions') {
        const res = await api.library.getSubscriptions();
        setSubscriptions(res.subscriptions || []);
      } else {
        const res = await api.library.getSaved();
        setSavedPosts(res.posts || []);
      }
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
      
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">My Library</h1>
        <p className="text-sm text-gray-400 mt-1">
          Access your permanently unlocked content, active VIP creator passes, and bookmarked sets.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-3 border-b border-surface-border pb-4 mb-8">
        <button
          onClick={() => setActiveTab('unlocked')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'unlocked'
              ? 'bg-primary-500 text-black shadow-glow-gold'
              : 'bg-surface-card hover:bg-surface-hover text-gray-300 border border-surface-border'
          }`}
        >
          <Unlock className="w-4 h-4" />
          <span>Unlocked Media</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
            {unlockedPosts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'subscriptions'
              ? 'bg-primary-500 text-black shadow-glow-gold'
              : 'bg-surface-card hover:bg-surface-hover text-gray-300 border border-surface-border'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active Passes</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
            {subscriptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'saved'
              ? 'bg-primary-500 text-black shadow-glow-gold'
              : 'bg-surface-card hover:bg-surface-hover text-gray-300 border border-surface-border'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Bookmarks</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
            {savedPosts.length}
          </span>
        </button>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-64 bg-surface-card rounded-3xl" />
          ))}
        </div>
      ) : activeTab === 'unlocked' ? (
        unlockedPosts.length === 0 ? (
          <div className="text-center py-20 bg-surface-card/40 rounded-3xl border border-surface-border">
            <Unlock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No unlocked posts yet</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Browse creator profiles and unlock exclusive photo sets or videos using your Viewpay wallet balance.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {unlockedPosts.map(post => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post.id)}
                className="group cursor-pointer bg-surface-card border border-surface-border hover:border-primary-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-card-elevated"
              >
                <div className="relative aspect-[4/3] bg-black overflow-hidden">
                  <img
                    src={post.media_url || post.preview_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-bold text-gray-200 uppercase flex items-center">
                    {post.media_type === 'video' ? <Video className="w-3 h-3 mr-1 text-primary-400" /> : <ImageIcon className="w-3 h-3 mr-1 text-primary-400" />}
                    {post.media_type}
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur text-[10px] font-bold text-white flex items-center shadow-glow-emerald">
                    <Unlock className="w-3 h-3 mr-1" /> Unlocked
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-primary-400">
                    {post.title}
                  </h3>
                  <div className="text-xs text-gray-400 mt-1 flex items-center justify-between">
                    <span>By {post.creator_name}</span>
                    <span className="text-[10px] text-primary-400 font-semibold uppercase">{post.unlock_type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'subscriptions' ? (
        subscriptions.length === 0 ? (
          <div className="text-center py-20 bg-surface-card/40 rounded-3xl border border-surface-border">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No active subscriptions</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Subscribe to your favorite creators to enjoy unlimited access to all their content.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map(sub => (
              <div
                key={sub.id}
                className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-card-elevated flex flex-col justify-between"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={sub.creator_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={sub.creator_name}
                    className="w-12 h-12 rounded-2xl object-cover border border-surface-border"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-white">{sub.creator_name}</h4>
                    <div className="text-xs text-gray-400">@{sub.creator_username}</div>
                  </div>
                </div>

                <div className="bg-surface p-3 rounded-2xl border border-surface-border text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between text-gray-400">
                    <span>Status:</span>
                    <span className="font-bold text-emerald-400 capitalize">{sub.status}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Monthly Rate:</span>
                    <span className="font-semibold text-white">${sub.amount.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Next Renewal:</span>
                    <span className="font-medium text-gray-300">{new Date(sub.renew_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectCreator(sub.creator_username)}
                  className="w-full py-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-xs font-semibold text-primary-400 flex items-center justify-center space-x-1"
                >
                  <span>Go to Creator Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        savedPosts.length === 0 ? (
          <div className="text-center py-20 bg-surface-card/40 rounded-3xl border border-surface-border">
            <Bookmark className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No bookmarked posts</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Save posts by clicking the bookmark icon on any post details view.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedPosts.map(post => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post.id)}
                className="group cursor-pointer bg-surface-card border border-surface-border hover:border-primary-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-card-elevated"
              >
                <div className="relative aspect-[4/3] bg-black overflow-hidden">
                  <img
                    src={post.preview_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 text-[10px] font-bold">
                    {post.is_locked ? `$${post.price.toFixed(2)}` : 'Free'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm text-white line-clamp-1">{post.title}</h3>
                  <div className="text-xs text-gray-400 mt-1">By {post.creator_name}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
}
