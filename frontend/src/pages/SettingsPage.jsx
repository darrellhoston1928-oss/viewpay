import React, { useState } from 'react';
import { 
  User, Shield, Lock, Trash2, CheckCircle, 
  AlertCircle, Upload, DollarSign, Sparkles, RefreshCw 
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export function SettingsPage() {
  const { user, refreshMe, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // profile, creator, security, danger

  // Profile Form
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(user?.cover_url || '');
  const [category, setCategory] = useState(user?.category || 'Lifestyle');

  // Creator Form
  const [subscriptionPrice, setSubscriptionPrice] = useState(String(user?.subscription_price || '9.99'));
  const [allowSubscriptions, setAllowSubscriptions] = useState(user?.allow_subscriptions !== 0);
  const [idDocFile, setIdDocFile] = useState(null);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.auth.updateProfile({
        displayName,
        bio,
        avatarUrl,
        coverUrl,
        category,
        subscriptionPrice: parseFloat(subscriptionPrice),
        allowSubscriptions
      });
      setMessage('Profile updated successfully.');
      await refreshMe();
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCreatorVerification = async (e) => {
    e.preventDefault();
    if (!idDocFile) {
      setError('Please choose an ID document file or photo to upload.');
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const formData = new FormData();
      formData.append('creator_id_doc', idDocFile);
      formData.append('category', category);
      formData.append('bio', bio);
      await api.creators.applyVerification(formData);
      setMessage('Creator verification submitted for review by administrators.');
      await refreshMe();
    } catch (err) {
      setError(err.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete your account? This action is permanent.')) {
      return;
    }
    try {
      await api.auth.deleteAccount();
      alert('Your account has been deleted.');
      logout();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Account Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your public profile, creator subscription rate, identity verification, and security.
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-surface-border pb-3 mb-8 overflow-x-auto scrollbar-none">
        {[
          { id: 'profile', label: 'Profile Information', icon: User },
          { id: 'creator', label: 'Creator & Identity Verification', icon: Sparkles },
          { id: 'security', label: 'Security & Password', icon: Lock },
          { id: 'danger', label: 'Danger Zone', icon: Trash2 },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMessage(''); setError(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-black shadow-glow-gold'
                  : 'bg-surface-card hover:bg-surface-hover text-gray-300 border border-surface-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile Information */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-surface-border rounded-xl text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Primary Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface border border-surface-border rounded-xl text-xs text-white"
              >
                {['Art & Cosplay', 'Fitness', 'Fashion', 'Photography', 'Gaming', 'Lifestyle', 'Music'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Bio / Tagline
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Cover Banner URL
              </label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary-500 to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-glow-gold"
          >
            {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      )}

      {/* Tab 2: Creator & Identity Verification */}
      {activeTab === 'creator' && (
        <div className="space-y-6">
          
          {/* Identity Verification Status Card */}
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
            <h3 className="text-base font-black text-white mb-2">18+ Identity Verification</h3>
            <p className="text-xs text-gray-400 mb-4">
              All content creators must submit a government-issued photo ID to publish locked sets and receive payouts.
            </p>

            <div className="p-4 rounded-2xl bg-surface border border-surface-border flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400">Current Creator Status:</span>
                <div className="font-bold text-sm text-white capitalize mt-0.5">
                  {user?.creator_status === 'approved' ? (
                    <span className="text-emerald-400 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" /> Approved & Verified
                    </span>
                  ) : user?.creator_status === 'pending' ? (
                    <span className="text-amber-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" /> Application Under Review
                    </span>
                  ) : (
                    <span className="text-gray-400">Not Verified</span>
                  )}
                </div>
              </div>

              {user?.creator_status !== 'approved' && (
                <div className="text-right">
                  <span className="text-[10px] text-gray-400">Estimated Review Time: 24h</span>
                </div>
              )}
            </div>

            {user?.creator_status !== 'approved' && (
              <form onSubmit={handleApplyCreatorVerification} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Upload ID or Verification Document
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setIdDocFile(e.target.files[0])}
                    className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-500 file:text-black hover:file:bg-primary-400 cursor-pointer"
                    required
                  />
                  <div className="text-[10px] text-gray-500 mt-1">
                    Drivers License, Passport, or National ID. Stored securely and only reviewed by platform owners.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary-500 text-black font-extrabold text-xs rounded-xl shadow-glow-gold"
                >
                  {loading ? 'Uploading...' : 'Submit Verification Document'}
                </button>
              </form>
            )}
          </div>

          {/* Subscription Pricing Setting */}
          <form onSubmit={handleUpdateProfile} className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated space-y-4">
            <h3 className="text-base font-black text-white">Subscription Tier Settings</h3>
            <p className="text-xs text-gray-400">
              Set the monthly rate fans pay for unlimited access to all your published content.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Monthly VIP Pass Rate (USD $)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="2.99"
                  max="199.99"
                  value={subscriptionPrice}
                  onChange={(e) => setSubscriptionPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-surface border border-surface-border rounded-xl text-xs font-bold text-emerald-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowSubs"
                checked={allowSubscriptions}
                onChange={(e) => setAllowSubscriptions(e.target.checked)}
                className="w-4 h-4 accent-primary-500 rounded"
              />
              <label htmlFor="allowSubs" className="text-xs text-gray-300 font-medium cursor-pointer">
                Allow fans to purchase monthly recurring subscriptions
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-surface hover:bg-surface-hover border border-surface-border text-primary-400 font-bold text-xs rounded-xl"
            >
              Update Subscription Pricing
            </button>
          </form>

        </div>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated space-y-4">
          <h3 className="text-base font-black text-white mb-2">Change Password</h3>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white"
                minLength={8}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary-500 to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-glow-gold"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}

      {/* Tab 4: Danger Zone */}
      {activeTab === 'danger' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6">
          <h3 className="text-base font-black text-red-400 mb-1">Danger Zone: Delete Account</h3>
          <p className="text-xs text-gray-300 mb-4 leading-relaxed">
            Permanently deactivate your account. Any remaining wallet balance will be forfeited. Historical financial ledger entries will be anonymized in compliance with tax regulations.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Permanently Delete My Viewpay Account
          </button>
        </div>
      )}

    </div>
  );
}
