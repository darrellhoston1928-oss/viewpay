import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Users, TrendingUp, Plus, Image as ImageIcon, 
  Video, Eye, Heart, Trash2, Edit, AlertCircle, CheckCircle, 
  ArrowRight, ShieldCheck, Wallet 
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export function CreatorDashboardPage({ setActivePage, onSelectPost }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [payoutStats, profileData] = await Promise.all([
        api.payouts.getStats(),
        api.creators.getProfile(user.username)
      ]);
      setStats(payoutStats);
      setPosts(profileData.posts || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This cannot be undone.')) {
      return;
    }
    try {
      await api.posts.delete(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      alert('Failed to delete post: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Creator Studio</h1>
            {user?.creator_status === 'approved' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approved Creator
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Verification Pending
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Manage your content catalog, monitor net subscriber revenue, and request earnings withdrawals.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActivePage('payouts')}
            className="px-4 py-2.5 bg-surface-card hover:bg-surface-hover border border-surface-border text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-colors"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Withdrawals & Payouts</span>
          </button>

          <button
            onClick={() => setActivePage('upload')}
            className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-400 hover:to-amber-400 text-black text-xs font-extrabold rounded-xl shadow-glow-gold flex items-center space-x-2 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Post</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Available Balance */}
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-card-elevated">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Available Balance</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            ${stats ? stats.availableBalance.toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            After 20% platform commission cut
          </div>
        </div>

        {/* Lifetime Earnings */}
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-card-elevated">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Lifetime Content Sales</span>
            <TrendingUp className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ${stats ? stats.lifetimeEarned.toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Pay-per-post direct unlocks
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-card-elevated">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Active VIP Subscribers</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {stats ? stats.activeSubscribers : 0}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Monthly recurring patrons
          </div>
        </div>

        {/* Monthly Recurring Revenue */}
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-card-elevated">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Est. Monthly MRR</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-primary-400">
            ${stats ? stats.estimatedMRR.toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Projected net subscription revenue
          </div>
        </div>
      </div>

      {/* Content Catalog Management */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-6">
          <div>
            <h2 className="text-lg font-black text-white">Published Posts</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Review and manage your locked and public media items.
            </p>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            Total Posts: <strong className="text-white">{posts.length}</strong>
          </span>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-16 bg-surface rounded-2xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-10 h-10 text-gray-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">No posts published yet</h4>
            <p className="text-xs text-gray-400 mt-1 mb-4">Upload your first set to start earning.</p>
            <button
              onClick={() => setActivePage('upload')}
              className="px-4 py-2 bg-primary-500 text-black font-bold text-xs rounded-xl"
            >
              Upload Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Thumbnail</th>
                  <th className="py-3 px-3">Title & Category</th>
                  <th className="py-3 px-3">Format</th>
                  <th className="py-3 px-3">Price USD</th>
                  <th className="py-3 px-3">Views / Likes</th>
                  <th className="py-3 px-3">Published</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {posts.map(post => (
                  <tr key={post.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-3">
                      <img
                        src={post.preview_url}
                        alt={post.title}
                        className="w-12 h-12 rounded-xl object-cover border border-surface-border"
                      />
                    </td>
                    <td className="py-3 px-3 font-semibold text-white max-w-xs truncate">
                      <div>{post.title}</div>
                      <span className="text-[10px] text-gray-400 uppercase font-mono">{post.category}</span>
                    </td>
                    <td className="py-3 px-3 uppercase text-gray-300">
                      {post.media_type}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      {post.price > 0 ? `$${post.price.toFixed(2)}` : 'Free'}
                    </td>
                    <td className="py-3 px-3 text-gray-400">
                      {post.views_count} views • {post.likes_count} likes
                    </td>
                    <td className="py-3 px-3 text-gray-400 whitespace-nowrap">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onSelectPost(post.id)}
                          className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover text-gray-300 hover:text-white"
                          title="View post"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
