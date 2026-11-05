import React, { useState, useEffect } from 'react';
import { 
  Wallet, DollarSign, Clock, CheckCircle, XCircle, 
  ArrowLeft, RefreshCw, AlertCircle, Building2, CreditCard, Shield 
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export function PayoutsPage({ onBack }) {
  const { user, refreshMe } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form
  const [amount, setAmount] = useState('100.00');
  const [payoutMethod, setPayoutMethod] = useState('paypal');
  const [payoutDetails, setPayoutDetails] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, histRes] = await Promise.all([
        api.payouts.getStats(),
        api.payouts.getHistory()
      ]);
      setStats(statsRes);
      setHistory(histRes.history || []);
    } catch (err) {
      console.error('Failed to load payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!payoutDetails.trim()) {
      setError('Please provide destination payment account details.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.payouts.request({
        amount,
        payoutMethod,
        payoutDetails: payoutDetails.trim()
      });
      setSuccess(res.message || 'Payout request submitted successfully.');
      setPayoutDetails('');
      await refreshMe();
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Creator Studio</span>
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Creator Earnings & Payouts</h1>
        <p className="text-sm text-gray-400 mt-1">
          Withdraw accumulated net revenue. Platform payouts are manually audited and disbursed in USD.
        </p>
      </div>

      {/* Balance & Commission Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Available to Withdraw</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2">
            ${stats ? stats.availableBalance.toFixed(2) : '0.00'} <span className="text-sm text-gray-400">USD</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Minimum threshold: ${stats ? stats.minPayoutAmount.toFixed(2) : '50.00'} USD
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>In Review / Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2">
            ${stats ? stats.pendingWithdrawal.toFixed(2) : '0.00'} <span className="text-sm text-gray-400">USD</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Awaiting administrative transfer
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Platform Commission</span>
            <Shield className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-3xl font-black text-primary-400 mt-2">
            {stats ? stats.platformCommissionPercent : 20}% <span className="text-sm text-gray-400">Cut</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
            You keep {stats ? 100 - stats.platformCommissionPercent : 80}% on every unlock & sub
          </div>
        </div>
      </div>

      {/* Payout Request Form */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated mb-10">
        <h3 className="text-lg font-black text-white mb-1">Request New Payout</h3>
        <p className="text-xs text-gray-400 mb-6">
          Funds are sent within 24-48 business hours after review by platform managers.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRequestPayout} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Withdrawal Amount (USD $)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="50.00"
                  max={stats?.availableBalance || 10000}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-surface border border-surface-border rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Payout Method
              </label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
              >
                <option value="paypal">PayPal (USD)</option>
                <option value="bank_wire">Bank Wire / ACH Transfer</option>
                <option value="usdt">USDT Crypto (TRC-20 / ERC-20)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Account Destination Details
            </label>
            <input
              type="text"
              value={payoutDetails}
              onChange={(e) => setPayoutDetails(e.target.value)}
              placeholder={
                payoutMethod === 'paypal' 
                  ? 'Your PayPal email address (e.g. creator@example.com)' 
                  : payoutMethod === 'bank_wire' 
                  ? 'Bank Name, Account Number, Routing/IBAN/SWIFT code' 
                  : 'Your USDT Wallet Address (TRC-20 preferred)'
              }
              className="w-full px-4 py-2.5 bg-surface border border-surface-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || (stats && stats.availableBalance < 50)}
            className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-400 hover:to-amber-400 text-black font-extrabold text-xs rounded-xl shadow-glow-gold flex items-center justify-center space-x-2 transition-transform active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                <span>Submit Withdrawal Request</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Payout History Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
        <h3 className="text-lg font-black text-white mb-4">Payout History</h3>

        {history.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-500">
            No withdrawal requests on record.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Destination</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Admin Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {history.map(req => (
                  <tr key={req.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-3 text-gray-300 font-mono whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 uppercase font-semibold text-white whitespace-nowrap">
                      {req.payout_method}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-400 max-w-xs truncate">
                      {req.payout_details}
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-400 whitespace-nowrap">
                      ${req.amount.toFixed(2)} USD
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {req.status === 'pending' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          Pending
                        </span>
                      )}
                      {req.status === 'paid' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          Disbursed
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold">
                          Declined
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-400">
                      {req.admin_notes || '—'}
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
