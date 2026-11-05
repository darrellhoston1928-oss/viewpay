import React, { useState, useEffect } from 'react';
import { 
  Bell, Mail, CheckCircle, Clock, XCircle, 
  DollarSign, Sparkles, RefreshCw, CheckCheck, Eye 
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export function NotificationsPage() {
  const { refreshMe } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' or 'emails'
  const [notifications, setNotifications] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notifRes, emailRes] = await Promise.all([
        api.notifications.getAll(),
        api.notifications.getEmailLogs()
      ]);
      setNotifications(notifRes.notifications || []);
      setEmailLogs(emailRes.emails || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
      refreshMe();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      refreshMe();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Notifications & Outbox</h1>
          <p className="text-sm text-gray-400 mt-1">
            Live in-app activity alerts and simulated transactional emails dispatched to your inbox.
          </p>
        </div>

        {activeTab === 'notifications' && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-xs text-gray-300 font-semibold flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-primary-400" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-3 border-b border-surface-border pb-3 mb-6">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'notifications'
              ? 'bg-primary-500 text-black shadow-glow-gold'
              : 'bg-surface-card hover:bg-surface-hover text-gray-300 border border-surface-border'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>In-App Alerts</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
            {notifications.filter(n => !n.is_read).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'emails'
              ? 'bg-primary-500 text-black shadow-glow-gold'
              : 'bg-surface-card hover:bg-surface-hover text-gray-300 border border-surface-border'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Simulated Outbound Emails</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
            {emailLogs.length}
          </span>
        </button>
      </div>

      {/* Tab 1: In-App Notifications */}
      {activeTab === 'notifications' ? (
        loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="h-20 bg-surface-card rounded-2xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-surface-card/40 rounded-3xl border border-surface-border text-gray-500">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <h4 className="font-bold text-white text-sm">No notifications yet</h4>
            <p className="text-xs text-gray-400 mt-1">Alerts regarding your deposits and subscriptions appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleMarkOneRead(n.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 ${
                  n.is_read 
                    ? 'bg-surface-card border-surface-border opacity-70' 
                    : 'bg-surface-card border-primary-500/40 shadow-glow-gold'
                }`}
              >
                <div className="p-2 rounded-xl bg-surface border border-surface-border flex-shrink-0">
                  {n.type === 'deposit_approved' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {n.type === 'deposit_rejected' && <XCircle className="w-4 h-4 text-red-400" />}
                  {n.type === 'purchase_success' && <DollarSign className="w-4 h-4 text-primary-400" />}
                  {n.type === 'new_subscriber' && <Sparkles className="w-4 h-4 text-cyan-400" />}
                  {!['deposit_approved', 'deposit_rejected', 'purchase_success', 'new_subscriber'].includes(n.type) && (
                    <Bell className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs sm:text-sm text-white">{n.title}</h4>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Tab 2: Outbound Transactional Emails */
        loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="h-24 bg-surface-card rounded-2xl" />)}
          </div>
        ) : emailLogs.length === 0 ? (
          <div className="text-center py-16 bg-surface-card/40 rounded-3xl border border-surface-border text-gray-500">
            <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <h4 className="font-bold text-white text-sm">No emails recorded yet</h4>
            <p className="text-xs text-gray-400 mt-1">Transactional emails dispatched by the platform will be logged here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {emailLogs.map(em => (
              <div
                key={em.id}
                className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-2 shadow-card-elevated"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                      Delivered
                    </span>
                    <span className="font-bold text-white text-sm">{em.subject}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(em.sent_at).toLocaleString()}
                  </span>
                </div>

                <div className="text-[11px] text-gray-400">
                  To: <span className="text-gray-300 font-mono">{em.to_email}</span> • Template: <span className="text-primary-400 font-mono">{em.template}</span>
                </div>

                <div className="bg-surface p-3 rounded-xl border border-surface-border text-xs text-gray-300 leading-relaxed font-sans">
                  {em.body_preview}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
