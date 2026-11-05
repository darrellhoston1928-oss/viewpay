import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Lock, Unlock, Sparkles, Heart, Bookmark, 
  Share2, Flag, Eye, CheckCircle, Calendar, Shield 
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { MediaViewer } from '../components/MediaViewer';
import { InsufficientBalanceModal } from '../components/InsufficientBalanceModal';
import { ReportModal } from '../components/ReportModal';

export function PostViewPage({ postId, onBack, onSelectCreator, onGoToDeposit }) {
  const { user, walletBalance, refreshMe } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Modals
  const [insufficientModalOpen, setInsufficientModalOpen] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const data = await api.posts.get(postId);
      setPost(data.post);
      setSaved(data.post.isSaved || false);
    } catch (err) {
      setError(err.message || 'Post not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const handleUnlock = async () => {
    if (!user) {
      alert('Please log in to unlock content.');
      return;
    }

    if (walletBalance < post.price) {
      setRequiredAmount(post.price);
      setInsufficientModalOpen(true);
      return;
    }

    setUnlocking(true);
    try {
      await api.posts.unlock(post.id);
      await refreshMe();
      await fetchPost();
    } catch (err) {
      if (err.data && err.data.insufficientBalance) {
        setRequiredAmount(post.price);
        setInsufficientModalOpen(true);
      } else {
        alert(err.message || 'Failed to unlock post');
      }
    } finally {
      setUnlocking(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      alert('Please log in to subscribe.');
      return;
    }

    const price = post.creator.subscriptionPrice || 9.99;
    if (walletBalance < price) {
      setRequiredAmount(price);
      setInsufficientModalOpen(true);
      return;
    }

    setSubscribing(true);
    try {
      await api.creators.subscribe(post.creator.id);
      await refreshMe();
      await fetchPost();
    } catch (err) {
      if (err.data && err.data.insufficientBalance) {
        setRequiredAmount(price);
        setInsufficientModalOpen(true);
      } else {
        alert(err.message || 'Subscription failed');
      }
    } finally {
      setSubscribing(false);
    }
  };

  const handleSaveToggle = async () => {
    if (!user) {
      alert('Please log in to bookmark content.');
      return;
    }
    try {
      const res = await api.posts.save(post.id);
      setSaved(res.saved);
    } catch (err) {
      alert('Failed to update bookmarks');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-96 bg-surface-card rounded-3xl mb-6" />
        <div className="h-20 bg-surface-card rounded-2xl" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h3 className="text-lg font-bold text-white mb-2">{error || 'Post unavailable'}</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-surface-card border border-surface-border text-xs rounded-xl text-primary-400 font-semibold"
        >
          ← Return
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSaveToggle}
            className={`p-2 rounded-xl border border-surface-border transition-colors ${
              saved ? 'bg-primary-500/20 text-primary-400 border-primary-500/40' : 'bg-surface-card text-gray-400 hover:text-white'
            }`}
            title={saved ? 'Bookmarked' : 'Save to Library'}
          >
            <Bookmark className="w-4 h-4" />
          </button>

          <button
            onClick={() => setReportModalOpen(true)}
            className="p-2 rounded-xl bg-surface-card border border-surface-border text-gray-400 hover:text-red-400 transition-colors"
            title="Report this post"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Media Player / Locked Viewer */}
      <div className="mb-6">
        <MediaViewer
          mediaUrl={post.media_url}
          previewUrl={post.preview_url}
          mediaType={post.media_type}
          isLocked={!post.isUnlocked && post.is_locked}
          price={post.price}
          title={post.title}
          onUnlockClick={handleUnlock}
        />
      </div>

      {/* Post Title & Metadata */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-surface-accent border border-surface-border text-[10px] font-bold text-primary-400 uppercase">
                {post.category || 'Lifestyle'}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-400 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white">{post.title}</h1>
          </div>

          {/* Pricing Status Badge */}
          <div>
            {post.isUnlocked ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center shadow-glow-emerald">
                <Unlock className="w-4 h-4 mr-1.5" />
                Unlocked & Available
              </span>
            ) : post.price > 0 ? (
              <div className="text-right">
                <span className="text-xl font-black text-primary-400">${post.price.toFixed(2)}</span>
                <span className="text-[10px] text-gray-400 block font-semibold">One-time Unlock</span>
              </div>
            ) : (
              <span className="px-3 py-1 rounded-xl bg-gray-800 text-xs font-bold text-gray-300">
                Free Post
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mt-4 text-sm text-gray-300 whitespace-pre-line leading-relaxed">
          {post.description || 'Exclusive content uploaded by ' + post.creator.name}
        </p>

        {/* Creator Mini-Card */}
        <div className="mt-6 pt-4 border-t border-surface-border flex items-center justify-between">
          <div 
            onClick={() => onSelectCreator(post.creator.username)}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <img
              src={post.creator.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={post.creator.name}
              className="w-12 h-12 rounded-2xl object-cover border border-surface-border"
            />
            <div>
              <div className="font-bold text-sm text-white group-hover:text-primary-400 flex items-center">
                {post.creator.name}
                <CheckCircle className="w-3.5 h-3.5 ml-1 text-primary-400" />
              </div>
              <div className="text-xs text-gray-400">@{post.creator.username}</div>
            </div>
          </div>

          <button
            onClick={() => onSelectCreator(post.creator.username)}
            className="px-4 py-2 bg-surface hover:bg-surface-hover border border-surface-border rounded-xl text-xs font-semibold text-primary-400 transition-colors"
          >
            View Profile →
          </button>
        </div>
      </div>

      {/* Paywall Options Box (if locked) */}
      {!post.isUnlocked && post.is_locked && (
        <div className="bg-gradient-to-br from-surface-card to-surface-card/60 border border-primary-500/30 rounded-3xl p-6 shadow-glow-gold">
          <h3 className="text-lg font-black text-white flex items-center">
            <Lock className="w-5 h-5 mr-2 text-primary-400" />
            Unlock This Exclusive Content
          </h3>
          <p className="text-xs text-gray-400 mt-1 mb-5">
            Choose how you'd like to access this high-resolution post:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option A: Pay-per-post */}
            <div className="bg-surface p-5 rounded-2xl border border-surface-border flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-primary-400 tracking-wider">
                  Option A
                </span>
                <h4 className="font-bold text-base text-white mt-1">Pay-Per-Post</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Permanent access to this post forever in your library.
                </p>
              </div>
              <div className="mt-4">
                <div className="text-lg font-black text-white mb-2">
                  ${post.price.toFixed(2)} <span className="text-xs font-normal text-gray-400">USD</span>
                </div>
                <button
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="w-full py-2.5 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-400 hover:to-amber-400 text-black font-extrabold text-xs rounded-xl shadow-glow-gold transition-transform active:scale-95"
                >
                  {unlocking ? 'Processing...' : `Unlock for $${post.price.toFixed(2)}`}
                </button>
              </div>
            </div>

            {/* Option B: Monthly Subscription */}
            {post.creator.allowSubscriptions && (
              <div className="bg-surface p-5 rounded-2xl border border-surface-border flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                    Option B (Best Value)
                  </span>
                  <h4 className="font-bold text-base text-white mt-1">Monthly VIP Pass</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Instant access to ALL current and future posts by {post.creator.name}.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="text-lg font-black text-emerald-400 mb-2">
                    ${post.creator.subscriptionPrice?.toFixed(2)} <span className="text-xs font-normal text-gray-400">/ month</span>
                  </div>
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-glow-emerald transition-transform active:scale-95"
                  >
                    {subscribing ? 'Subscribing...' : 'Subscribe to Creator'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insufficient Balance Modal */}
      <InsufficientBalanceModal
        isOpen={insufficientModalOpen}
        onClose={() => setInsufficientModalOpen(false)}
        currentBalance={walletBalance}
        requiredAmount={requiredAmount}
        onGoToDeposit={onGoToDeposit}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        postId={post.id}
        postTitle={post.title}
      />
    </div>
  );
}
