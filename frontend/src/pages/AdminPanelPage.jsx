import React, { useState, useEffect } from 'react';
import { 
  Shield, CreditCard, Users, CheckCircle, XCircle, 
  AlertTriangle, Eye, EyeOff, Search, Filter, RefreshCw, 
  Settings as SettingsIcon, FileText, DollarSign, Flag, Lock, 
  Unlock, ExternalLink, AlertCircle, Ban, Check 
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export function AdminPanelPage({ onSelectPost }) {
  const { user, refreshMe } = useAuth();
  const [activeTab, setActiveTab] = useState('deposits'); // deposits, creators, payouts, reports, users, logs, settings
  const [stats, setStats] = useState(null);
  
  // Deposits state
  const [deposits, setDeposits] = useState([]);
  const [depositFilterStatus, setDepositFilterStatus] = useState('pending');
  const [depositFilterCard, setDepositFilterCard] = useState('all');
  const [depositSearch, setDepositSearch] = useState('');
  const [revealedCodes, setRevealedCodes] = useState({}); // { [depositId]: plainCode }
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Approval modal state
  const [approvingDeposit, setApprovingDeposit] = useState(null);
  const [adjustedAmount, setAdjustedAmount] = useState('');

  // Rejection modal state
  const [rejectingDeposit, setRejectingDeposit] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Invalid e-code sequence');

  // Other queues state
  const [creators, setCreators] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [reports, setReports] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState(null);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStats = async () => {
    try {
      const data = await api.admin.getStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCurrentTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'deposits') {
        const data = await api.admin.getDeposits({
          status: depositFilterStatus,
          cardType: depositFilterCard,
          search: depositSearch
        });
        setDeposits(data.deposits || []);
      } else if (activeTab === 'creators') {
        const data = await api.admin.getCreators();
        setCreators(data.creators || []);
      } else if (activeTab === 'payouts') {
        const data = await api.admin.getPayouts();
        setPayouts(data.payouts || []);
      } else if (activeTab === 'reports') {
        const data = await api.admin.getReports();
        setReports(data.reports || []);
      } else if (activeTab === 'users') {
        const data = await api.admin.getUsers();
        setAllUsers(data.users || []);
      } else if (activeTab === 'logs') {
        const data = await api.admin.getAuditLogs();
        setAuditLogs(data.logs || []);
      } else if (activeTab === 'settings') {
        const data = await api.admin.getSettings();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load admin tab:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadCurrentTabData();
  }, [activeTab, depositFilterStatus, depositFilterCard]);

  // Reveal E-Code
  const handleRevealCode = async (depositId) => {
    try {
      const res = await api.admin.revealCode(depositId);
      setRevealedCodes(prev => ({ ...prev, [depositId]: res.code }));
      loadStats(); // refresh audit counts
    } catch (err) {
      alert('Failed to reveal code: ' + err.message);
    }
  };

  // Approve Deposit
  const handleApproveDeposit = async () => {
    if (!approvingDeposit) return;
    setActionLoading(true);
    try {
      await api.admin.approveDeposit(approvingDeposit.id, adjustedAmount || approvingDeposit.claimed_amount);
      setApprovingDeposit(null);
      await refreshMe();
      await loadStats();
      await loadCurrentTabData();
    } catch (err) {
      alert('Approval failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Deposit
  const handleRejectDeposit = async () => {
    if (!rejectingDeposit) return;
    setActionLoading(true);
    try {
      await api.admin.rejectDeposit(rejectingDeposit.id, rejectionReason);
      setRejectingDeposit(null);
      await loadStats();
      await loadCurrentTabData();
    } catch (err) {
      alert('Rejection failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Creator Approve/Reject
  const handleCreatorStatus = async (id, approve, reason = '') => {
    setActionLoading(true);
    try {
      if (approve) {
        await api.admin.approveCreator(id);
      } else {
        await api.admin.rejectCreator(id, reason || 'Document unverified');
      }
      await loadCurrentTabData();
      await loadStats();
    } catch (err) {
      alert('Action failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Payout Disburse
  const handlePayoutPaid = async (id) => {
    if (!window.confirm('Confirm that funds have been sent to this creator?')) return;
    setActionLoading(true);
    try {
      await api.admin.markPayoutPaid(id, 'Funds dispatched manually by admin');
      await loadCurrentTabData();
      await loadStats();
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Report action
  const handleReportAction = async (id, action) => {
    setActionLoading(true);
    try {
      await api.admin.takeReportAction(id, action);
      await loadCurrentTabData();
      await loadStats();
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Ban/Unban user
  const handleBanToggle = async (targetUser) => {
    const isBanning = !targetUser.is_banned;
    let reason = '';
    if (isBanning) {
      reason = prompt('Enter reason for banning this user:') || 'Terms violation';
    }
    setActionLoading(true);
    try {
      await api.admin.banUser(targetUser.id, isBanning, reason);
      await loadCurrentTabData();
    } catch (err) {
      alert('Failed to update ban status: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Update Settings
  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.admin.updateSettings(settings);
      alert('Platform settings updated successfully.');
    } catch (err) {
      alert('Failed to update settings: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isOwner = user?.admin_role === 'owner';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
      
      {/* Header with Admin Role Pill */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Admin & Owner Console</h1>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1 text-amber-400" />
              {isOwner ? 'Platform Owner (Full Access)' : 'Deposit Reviewer'}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Manual deposit verification queue, creator compliance, payout disbursement, and audit logs.
          </p>
        </div>

        {/* Global Stats Overview */}
        <div className="flex items-center space-x-3">
          <div className="bg-surface-card border border-surface-border px-3.5 py-2 rounded-2xl text-right">
            <div className="text-[10px] uppercase font-bold text-gray-400">Net Platform Revenue</div>
            <div className="text-base font-black text-emerald-400">
              ${stats ? stats.platformNetCommission.toFixed(2) : '0.00'} USD
            </div>
          </div>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center space-x-2 border-b border-surface-border pb-3 mb-8 overflow-x-auto scrollbar-none">
        {[
          { id: 'deposits', label: 'Deposit Review Queue', badge: stats?.pendingDepositsCount, icon: CreditCard },
          { id: 'creators', label: 'Creator Verification', badge: stats?.pendingCreatorsCount, icon: Users },
          { id: 'payouts', label: 'Payout Requests', badge: stats?.pendingPayoutsCount, icon: DollarSign },
          { id: 'reports', label: 'Content Reports', badge: stats?.pendingReportsCount, icon: Flag },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'logs', label: 'Security Audit Log', icon: FileText },
          ...(isOwner ? [{ id: 'settings', label: 'Platform Settings', icon: SettingsIcon }] : [])
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-surface-hover'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DEPOSIT REVIEW QUEUE */}
      {activeTab === 'deposits' && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="bg-surface-card border border-surface-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 overflow-x-auto">
              <span className="text-xs font-bold text-gray-400 uppercase">Status:</span>
              {['pending', 'approved', 'rejected', 'all'].map(st => (
                <button
                  key={st}
                  onClick={() => setDepositFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    depositFilterStatus === st
                      ? 'bg-primary-500 text-black font-bold'
                      : 'bg-surface hover:bg-surface-hover text-gray-300 border border-surface-border'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={depositFilterCard}
                onChange={(e) => setDepositFilterCard(e.target.value)}
                className="bg-surface border border-surface-border text-xs text-white rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="all">All Card Brands</option>
                <option value="razer_gold">Razer Gold Only</option>
                <option value="apple">Apple Gift Card Only</option>
              </select>

              <button
                onClick={loadCurrentTabData}
                className="p-2 bg-surface hover:bg-surface-hover rounded-xl text-gray-400 hover:text-white"
                title="Refresh Queue"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Deposit Review Queue Table */}
          <div className="bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-card-elevated">
            {loading ? (
              <div className="p-12 text-center text-xs text-gray-400">Loading deposits...</div>
            ) : deposits.length === 0 ? (
              <div className="p-16 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-400/50" />
                <h4 className="font-bold text-white text-sm">Deposit Queue Clean</h4>
                <p className="text-xs text-gray-400 mt-1">No deposits match the selected filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border text-gray-400 uppercase tracking-wider text-[10px] bg-surface/50">
                      <th className="py-3.5 px-4">User Details</th>
                      <th className="py-3.5 px-4">Brand</th>
                      <th className="py-3.5 px-4">Claimed (USD)</th>
                      <th className="py-3.5 px-4">E-Code (AES-256 Vault)</th>
                      <th className="py-3.5 px-4">Receipt</th>
                      <th className="py-3.5 px-4">Status & Flags</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {deposits.map(dep => {
                      const isRevealed = !!revealedCodes[dep.id];
                      return (
                        <tr key={dep.id} className="hover:bg-surface/40 transition-colors">
                          
                          {/* User Details */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{dep.display_name}</div>
                            <div className="text-xs text-gray-400">{dep.email}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              History: <strong className="text-emerald-400">{dep.user_approved_count} approved</strong> • <strong className="text-red-400">{dep.user_rejected_count} rejected</strong>
                            </div>
                          </td>

                          {/* Brand */}
                          <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                            {dep.card_type === 'razer_gold' ? 'Razer Gold' : 'Apple Gift Card'}
                            <span className="block text-[10px] text-gray-400">
                              {new Date(dep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          {/* Claimed Amount */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-sm font-black text-white">${dep.claimed_amount.toFixed(2)}</span>
                            {dep.verified_amount && (
                              <span className="block text-[10px] text-emerald-400 font-bold">
                                Credited: ${dep.verified_amount.toFixed(2)}
                              </span>
                            )}
                          </td>

                          {/* E-Code & Reveal Action */}
                          <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                            {isRevealed ? (
                              <div className="flex items-center space-x-1.5">
                                <span className="px-2 py-1 rounded bg-black/60 border border-primary-500/50 text-primary-400 font-bold text-xs">
                                  {revealedCodes[dep.id]}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400">{dep.masked_code}</span>
                                <button
                                  onClick={() => handleRevealCode(dep.id)}
                                  className="px-2 py-0.5 rounded bg-surface-hover hover:bg-surface-accent border border-surface-border text-[10px] text-primary-400 font-bold flex items-center space-x-1"
                                  title="Reveal code and log audit entry"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Reveal</span>
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Receipt */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {dep.receipt_url ? (
                              <button
                                onClick={() => setSelectedReceipt(dep.receipt_url)}
                                className="px-2 py-1 rounded-lg bg-surface hover:bg-surface-hover border border-surface-border text-primary-400 text-[10px] font-bold flex items-center space-x-1"
                              >
                                <span>View Receipt</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-500 italic">No receipt</span>
                            )}
                          </td>

                          {/* Status & Security Flags */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {dep.status === 'pending' && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                                  Pending Review
                                </span>
                              )}
                              {dep.status === 'approved' && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                  Approved
                                </span>
                              )}
                              {dep.status === 'rejected' && (
                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                                  Rejected
                                </span>
                              )}

                              {dep.is_flagged_high_value === 1 && (
                                <span className="block text-[9px] font-bold text-amber-400">
                                  ⚠️ High Value Deposit (≥$100)
                                </span>
                              )}
                              {dep.is_flagged_first_time === 1 && (
                                <span className="block text-[9px] font-bold text-cyan-400">
                                  ★ First-Time Deposit User
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {dep.status === 'pending' ? (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setApprovingDeposit(dep);
                                    setAdjustedAmount(String(dep.claimed_amount.toFixed(2)));
                                  }}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-glow-emerald flex items-center space-x-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>

                                <button
                                  onClick={() => setRejectingDeposit(dep)}
                                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs rounded-xl flex items-center space-x-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-500">Completed</span>
                            )}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CREATOR VERIFICATION */}
      {activeTab === 'creators' && (
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
          <h2 className="text-lg font-black text-white mb-1">Creator ID Verification Queue</h2>
          <p className="text-xs text-gray-400 mb-6">
            Review submitted government IDs and photo selfies before granting content publishing rights.
          </p>

          {creators.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500">No creator applications awaiting review.</div>
          ) : (
            <div className="space-y-4">
              {creators.map(c => (
                <div key={c.id} className="p-4 rounded-2xl bg-surface border border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={c.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={c.display_name}
                      className="w-12 h-12 rounded-2xl object-cover border border-surface-border"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">{c.display_name} ({c.username})</h4>
                      <div className="text-xs text-gray-400">{c.email} • Category: <strong className="text-primary-400">{c.category}</strong></div>
                      <div className="mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.creator_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          Status: {c.creator_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {c.creator_id_doc_url ? (
                      <button
                        onClick={() => setSelectedReceipt(c.creator_id_doc_url)}
                        className="px-3 py-1.5 rounded-xl bg-surface-hover border border-surface-border text-xs text-gray-300 flex items-center space-x-1"
                      >
                        <span>View ID Doc</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-500">No document attached</span>
                    )}

                    {c.creator_status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCreatorStatus(c.id, true)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-bold"
                        >
                          Approve ID
                        </button>
                        <button
                          onClick={() => {
                            const r = prompt('Enter rejection reason:') || 'ID document unreadable';
                            handleCreatorStatus(c.id, false, r);
                          }}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYOUT REQUESTS */}
      {activeTab === 'payouts' && (
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
          <h2 className="text-lg font-black text-white mb-1">Creator Withdrawal Requests</h2>
          <p className="text-xs text-gray-400 mb-6">
            Audit creator payout balances and confirm manual remittance via PayPal, Wire, or USDT.
          </p>

          {payouts.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500">No pending payout requests.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Creator</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3">Account Details</th>
                    <th className="py-3 px-3">Amount USD</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {payouts.map(p => (
                    <tr key={p.id} className="hover:bg-surface/50">
                      <td className="py-3 px-3 text-gray-300 font-mono">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {p.display_name}
                      </td>
                      <td className="py-3 px-3 uppercase text-primary-400 font-semibold">
                        {p.payout_method}
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-300 max-w-xs truncate">
                        {p.payout_details}
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-400">
                        ${p.amount.toFixed(2)} USD
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {p.status === 'pending' && (
                          <button
                            onClick={() => handlePayoutPaid(p.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black font-bold text-xs"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CONTENT MODERATION */}
      {activeTab === 'reports' && (
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
          <h2 className="text-lg font-black text-white mb-1">Content Moderation & DMCA Takedown Queue</h2>
          <p className="text-xs text-gray-400 mb-6">
            Review reported posts flagged for copyright infringement, age rating, or platform guidelines.
          </p>

          {reports.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500">No content reports pending.</div>
          ) : (
            <div className="space-y-4">
              {reports.map(r => (
                <div key={r.id} className="p-4 rounded-2xl bg-surface border border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold uppercase">
                      Reason: {r.reason}
                    </span>
                    <h4 className="font-bold text-sm text-white mt-1">Post: "{r.post_title}"</h4>
                    <div className="text-xs text-gray-400">Creator: {r.creator_name} ({r.creator_email})</div>
                    <div className="text-xs text-gray-400">Reported by: {r.reporter_name}</div>
                    {r.details && (
                      <p className="text-xs text-gray-300 mt-2 bg-surface-card p-2 rounded-lg italic">
                        "{r.details}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onSelectPost(r.post_id)}
                      className="px-3 py-1.5 rounded-xl bg-surface-hover border border-surface-border text-xs text-gray-300"
                    >
                      View Post
                    </button>
                    {r.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReportAction(r.id, 'hide_post')}
                          className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold"
                        >
                          Hide Post
                        </button>
                        <button
                          onClick={() => handleReportAction(r.id, 'dismiss')}
                          className="px-3 py-1.5 rounded-xl bg-surface-hover text-gray-400 text-xs"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
          <h2 className="text-lg font-black text-white mb-4">Platform Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Balance USD</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {allUsers.map(u => (
                  <tr key={u.id} className="hover:bg-surface/50">
                    <td className="py-3 px-3 font-semibold text-white">
                      <div>{u.display_name}</div>
                      <div className="text-[11px] text-gray-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-3 uppercase text-primary-400 font-bold">
                      {u.role} {u.admin_role ? `(${u.admin_role})` : ''}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      ${u.wallet_balance.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      {u.is_banned ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleBanToggle(u)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                            u.is_banned ? 'bg-emerald-500 text-black' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {u.is_banned ? 'Unban User' : 'Ban User'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SECURITY AUDIT LOG */}
      {activeTab === 'logs' && (
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-white">Security & Administrative Audit Log</h2>
              <p className="text-xs text-gray-400">
                Immutable record of every plaintext code reveal, deposit approval/rejection, user ban, and setting update.
              </p>
            </div>
            <button
              onClick={loadCurrentTabData}
              className="p-2 bg-surface hover:bg-surface-hover rounded-xl text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-surface-border text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Admin</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Details</th>
                  <th className="py-3 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-gray-300">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-surface/50">
                    <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-amber-300 whitespace-nowrap">
                      {log.admin_name}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-surface border border-surface-border text-[10px] text-primary-400 uppercase font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-white max-w-md truncate">
                      {log.details}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                      {log.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: PLATFORM SETTINGS (Owner Only) */}
      {activeTab === 'settings' && isOwner && (
        <div className="max-w-2xl bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
          <h2 className="text-lg font-black text-white mb-1">Global Platform Settings</h2>
          <p className="text-xs text-gray-400 mb-6">
            Configure system-wide commission cuts, payout thresholds, and deposit limits.
          </p>

          {settings && (
            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Platform Commission Cut (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={settings.platform_commission_percent}
                  onChange={(e) => setSettings({ ...settings, platform_commission_percent: e.target.value })}
                  className="w-full px-4 py-2 bg-surface border border-surface-border rounded-xl text-xs font-bold text-white"
                  required
                />
                <div className="text-[10px] text-gray-400 mt-1">
                  Default: 20%. Creator receives 80% on each unlock and subscription.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Minimum Creator Payout Threshold (USD $)
                </label>
                <input
                  type="number"
                  step="5"
                  min="10"
                  max="500"
                  value={settings.min_payout_amount}
                  onChange={(e) => setSettings({ ...settings, min_payout_amount: e.target.value })}
                  className="w-full px-4 py-2 bg-surface border border-surface-border rounded-xl text-xs font-bold text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  High-Value Deposit Review Threshold (USD $)
                </label>
                <input
                  type="number"
                  step="10"
                  min="50"
                  max="1000"
                  value={settings.high_value_deposit_threshold}
                  onChange={(e) => setSettings({ ...settings, high_value_deposit_threshold: e.target.value })}
                  className="w-full px-4 py-2 bg-surface border border-surface-border rounded-xl text-xs font-bold text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Max Deposit Submissions per User per Hour
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.max_deposits_per_hour}
                  onChange={(e) => setSettings({ ...settings, max_deposits_per_hour: e.target.value })}
                  className="w-full px-4 py-2 bg-surface border border-surface-border rounded-xl text-xs font-bold text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-glow-gold"
              >
                Save Global Settings
              </button>
            </form>
          )}
        </div>
      )}

      {/* APPROVE DEPOSIT MODAL */}
      {approvingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-black text-white">Approve Deposit #{approvingDeposit.id}</h3>
            <p className="text-xs text-gray-400 mt-1">
              Confirm or adjust the verified redeemed face value for {approvingDeposit.display_name}.
            </p>

            <div className="bg-surface p-4 rounded-2xl border border-surface-border my-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Card Brand:</span>
                <span className="font-bold text-white">{approvingDeposit.card_type}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>User Claimed Amount:</span>
                <span className="font-bold text-white">${approvingDeposit.claimed_amount.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Verified Amount to Credit to Wallet (USD $)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.50"
                value={adjustedAmount}
                onChange={(e) => setAdjustedAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-surface-border rounded-xl text-sm font-bold text-emerald-400 focus:outline-none focus:border-primary-500"
                required
              />
              <div className="text-[10px] text-gray-400 mt-1">
                Editable in case voucher code denomination differs from claimed value.
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovingDeposit(null)}
                className="flex-1 py-2.5 rounded-xl border border-surface-border text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveDeposit}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs"
              >
                {actionLoading ? 'Processing...' : 'Confirm Approval & Credit Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT DEPOSIT MODAL */}
      {rejectingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-black text-white">Reject Deposit #{rejectingDeposit.id}</h3>
            <p className="text-xs text-gray-400 mt-1">
              Select or provide a rejection explanation for {rejectingDeposit.display_name}.
            </p>

            <div className="my-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Rejection Reason
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="Invalid e-code sequence or checksum">Invalid e-code sequence or checksum</option>
                  <option value="E-code has already been redeemed / zero balance">E-code has already been redeemed / zero balance</option>
                  <option value="Incorrect currency (must be USD only)">Incorrect currency (must be USD only)</option>
                  <option value="Unreadable receipt or voucher image">Unreadable receipt or voucher image</option>
                  <option value="Fraudulent or deactivated card PIN">Fraudulent or deactivated card PIN</option>
                  <option value="custom">Other / Custom explanation</option>
                </select>
              </div>

              {rejectionReason === 'custom' && (
                <textarea
                  placeholder="Enter specific rejection reason..."
                  rows={2}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white resize-none"
                />
              )}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingDeposit(null)}
                className="flex-1 py-2.5 rounded-xl border border-surface-border text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectDeposit}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT LIGHTBOX MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-surface-card border border-surface-border rounded-3xl p-4 shadow-2xl">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 text-white hover:bg-black"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h4 className="font-bold text-sm text-white mb-3">Uploaded Receipt Document</h4>
            <div className="max-h-[75vh] overflow-auto rounded-2xl bg-black">
              <img
                src={selectedReceipt}
                alt="Receipt Inspection"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
