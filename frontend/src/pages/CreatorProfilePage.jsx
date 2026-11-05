import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Users, Image as ImageIcon, Video, 
  Lock, Unlock, Sparkles, Heart, Eye, ArrowLeft, 
  Share2, Shield, AlertCircle, Calendar 
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { InsufficientBalanceModal } from '../components/InsufficientBalanceModal';

export function CreatorProfilePage({ username, onBack, onSelectPost, onGoToDeposit }) {
  const { user, walletBalance, refreshMe } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, photo, video, locked, unlocked
  
  // Modals & action states
  const [insufficientModalOpen, setInsufficientModalOpen] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState(0);
  const [subscribing, setSubscribing] = useState(false);
  const [unlockingPostId, setUnlockingPostId] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.creators.getProfile(username);
      setProfile(data.creator);
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message || 'Creator not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const handleSubscribe = async () => {
    if (!user) {
      alert('Please log in or register to subscribe to creators.');
      return;
    }

    const price = profile.subscription_price || 9.99;
    if (walletBalance < price) {
      setRequiredAmount(price);
      setInsufficientModalOpen(true);
      return;
    }

    if (!window.confirm(`Confirm monthly subscription to ${profile.display_name} for $${price.toFixed(2)} USD? This will be deducted from your wallet balance.`)) {
      return;
    }

    setSubscribing(true);
    try {
      await api.creators.subscribe(profile.id);
      await refreshMe();
      await fetchProfile();
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

  const handleUnsubscribe = async () => {
    if (!window.confirm(`Are you sure you want to cancel your monthly subscription to ${profile.display_name}?`)) {
      return;
    }
    try {
      await api.creators.unsubscribe(profile.id);
      await fetchProfile();
    } catch (err) {
      alert(err.message || 'Failed to cancel subscription');
    }
  };

  const handleUnlockPost = async (post) => {
    if (!user) {
      alert('Please log in to unlock content.');
      return;
    }

    if (walletBalance < post.price) {
      setRequiredAmount(post.price);
      setInsufficientModalOpen(true);
      return;
    }

    setUnlockingPostId(post.id);
    try {
      await api.posts.unlock(post.id);
      await refreshMe();
      await fetchProfile();
    } catch (err) {
      if (err.data && err.data.insufficientBalance) {
        setRequiredAmount(post.price);
        setInsufficientModalOpen(true);
      } else {
        alert(err.message || 'Failed to unlock post');
      }
    } finally {
      setUnlockingPostId(null);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter(p => {
    if (activeTab === 'photo') return p.media_type === 'photo';
    if (activeTab === 'video') return p.media_type === 'video';
    if (activeTab === 'locked') return p.is_locked && !p.isUnlocked;
    if (activeTab === 'unlocked') return p.isUnlocked || !p.is_locked;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-60 bg-surface-card rounded-3xl mb-6" />
        <div className="h-28 bg-surface-card rounded-2xl mb-8" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">{error || 'Profile unavailable'}</h3>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-surface-card border border-surface-border text-xs rounded-xl text-primary-400 font-semibold"
        >
          ← Return to Explore
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      {/* Top Back Nav */}
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Explore</span>
      </button>

      {/* Creator Profile Header Card */}
      <div className="bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-card-elevated mb-8">
        {/* Cover Banner */}
        <div className="relative h-56 sm:h-72 w-full bg-surface">
          <img
            src={profile.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'}
            alt={profile.display_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/40 to-transparent" />
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-6 relative -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            
            {/* Avatar & Identifiers */}
            <div className="flex items-end space-x-4">
              <img
                src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                alt={profile.display_name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-surface-card shadow-2xl bg-surface"
              />
              <div className="pb-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white">{profile.display_name}</h1>
                  <CheckCircle className="w-5 h-5 text-primary-400 flex-shrink-0" title="Verified Creator" />
                </div>
                <div className="text-xs text-gray-400">@{profile.username}</div>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-surface-accent border border-surface-border text-[10px] font-bold text-primary-400 uppercase">
                  {profile.category || 'Creator'}
                </span>
              </div>
            </div>

            {/* Subscribe / Action Buttons */}
            <div className="flex items-center space-x-3 self-start sm:self-end pt-2 sm:pt-0">
              {profile.allow_subscriptions && (
                profile.isSubscribed ? (
                  <div className="flex items-center space-x-2">
                    <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>Subscribed</span>
                    </div>
                    <button
                      onClick={handleUnsubscribe}
                      className="px-3 py-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-[11px] text-gray-400 hover:text-red-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-400 hover:to-amber-400 text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-glow-gold flex items-center space-x-2 transition-transform active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Subscribe for ${profile.subscription_price?.toFixed(2)}/mo</span>
                  </button>
                )
              )}
            </div>

          </div>

          {/* Bio */}
          <p className="mt-5 text-sm text-gray-300 max-w-2xl leading-relaxed">
            {profile.bio || 'Welcome to my official Viewpay page. Unlock single sets or subscribe for full VIP access.'}
          </p>

          {/* Stats Bar */}
          <div className="mt-6 pt-4 border-t border-surface-border flex items-center space-x-6 text-xs text-gray-400">
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-primary-400" />
              <strong className="text-white mr-1">{profile.subscriber_count || 0}</strong> Subscribers
            </span>
            <span className="flex items-center">
              <ImageIcon className="w-4 h-4 mr-1.5 text-gray-400" />
              <strong className="text-white mr-1">{profile.post_count || 0}</strong> Posts
            </span>
            <span className="flex items-center">
              <Shield className="w-4 h-4 mr-1.5 text-emerald-400" />
              18+ ID Verified
            </span>
          </div>

        </div>
      </div>

      {/* Post Tabs */}
      <div className="flex items-center space-x-2 border-b border-surface-border pb-3 mb-6 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'All Content', icon: Sparkles },
          { id: 'photo', label: 'Photos', icon: ImageIcon },
          { id: 'video', label: 'Videos', icon: Video },
          { id: 'locked', label: 'Locked Paywall', icon: Lock },
          { id: 'unlocked', label: 'Unlocked / Free', icon: Unlock },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-surface-accent text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-surface-hover'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-surface-card/40 rounded-3xl border border-surface-border">
          <ImageIcon className="w-10 h-10 text-gray-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white">No posts in this category</h4>
          <p className="text-xs text-gray-400 mt-1">Check back later or view all content.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <div
              key={post.id}
              className="bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-card-elevated flex flex-col justify-between transition-transform hover:-translate-y-1"
            >
              {/* Media Thumbnail */}
              <div 
                onClick={() => onSelectPost(post.id)}
                className="relative aspect-[4/3] bg-black overflow-hidden cursor-pointer group"
              >
                <img
                  src={post.preview_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'}
                  alt={post.title}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                    !post.isUnlocked && post.is_locked ? 'locked-blur scale-110 filter blur-xl' : ''
                  }`}
                />

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-bold text-gray-200 uppercase flex items-center">
                    {post.media_type === 'video' ? <Video className="w-3 h-3 mr-1 text-primary-400" /> : <ImageIcon className="w-3 h-3 mr-1 text-primary-400" />}
                    {post.media_type}
                  </span>
                </div>

                {/* Lock Overlay or Price Tag */}
                <div className="absolute top-3 right-3">
                  {post.isUnlocked ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur text-[10px] font-bold text-white flex items-center shadow-glow-emerald">
                      <Unlock className="w-3 h-3 mr-1" /> Unlocked
                    </span>
                  ) : post.price > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-primary-500 text-[11px] font-extrabold text-black shadow-glow-gold flex items-center">
                      <Lock className="w-3 h-3 mr-1 text-black" />
                      ${post.price.toFixed(2)}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-gray-800 text-[10px] font-bold text-gray-300">
                      Free
                    </span>
                  )}
                </div>

                {/* Locked Center Badge */}
                {!post.isUnlocked && post.is_locked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40">
                    <div className="w-12 h-12 rounded-2xl bg-black/70 border border-primary-500/40 flex items-center justify-center text-primary-400 mb-2 shadow-glow-gold">
                      <Lock className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow">Click to View Details</span>
                  </div>
                )}
              </div>

              {/* Post Details & Action */}
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <h3 
                    onClick={() => onSelectPost(post.id)}
                    className="font-bold text-sm text-white line-clamp-1 hover:text-primary-400 cursor-pointer"
                  >
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {post.description || 'Exclusive content from ' + profile.display_name}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs text-gray-400">
                    <span className="flex items-center"><Eye className="w-3.5 h-3.5 mr-1" /> {post.views_count}</span>
                    <span className="flex items-center"><Heart className="w-3.5 h-3.5 mr-1" /> {post.likes_count}</span>
                  </div>

                  {!post.isUnlocked && post.is_locked ? (
                    <button
                      onClick={() => handleUnlockPost(post)}
                      disabled={unlockingPostId === post.id}
                      className="px-3 py-1.5 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-400 hover:to-amber-400 text-black text-xs font-extrabold rounded-lg shadow-glow-gold transition-transform active:scale-95"
                    >
                      {unlockingPostId === post.id ? 'Unlocking...' : `Unlock $${post.price.toFixed(2)}`}
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectPost(post.id)}
                      className="text-xs font-semibold text-primary-400 hover:underline"
                    >
                      View Set →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
    </div>
  );
}
