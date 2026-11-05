import React, { useState, useEffect } from 'react';
import { 
  Wallet, Shield, Clock, AlertCircle, CheckCircle, 
  Upload, ExternalLink, HelpCircle, ArrowRight, Lock, 
  FileText, Sparkles, RefreshCw, XCircle, Info 
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export function WalletDepositPage() {
  const { user, walletBalance, refreshMe } = useAuth();
  const [config, setConfig] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form inputs
  const [cardType, setCardType] = useState('razer_gold');
  const [code, setCode] = useState('');
  const [claimedAmount, setClaimedAmount] = useState('50.00');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cfg, hist] = await Promise.all([
        api.deposits.getConfig(),
        api.deposits.getHistory()
      ]);
      setConfig(cfg);
      setHistory(hist.deposits || []);
    } catch (err) {
      console.error('Error loading deposit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleFillDemoCode = (type) => {
    setCardType(type);
    const rand = Math.floor(1000 + Math.random() * 9000);
    if (type === 'razer_gold') {
      setCode(`RG-9982-4412-${rand}`);
      setClaimedAmount('50.00');
    } else {
      setCode(`APPL-8821-X992-${rand}`);
      setClaimedAmount('100.00');
    }
  };

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!code || !claimedAmount) {
      setErrorMessage('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('cardType', cardType);
      formData.append('code', code.trim().toUpperCase());
      formData.append('claimedAmount', claimedAmount);
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const res = await api.deposits.submitDeposit(formData);
      setSuccessMessage(res.message || 'Your deposit is awaiting verification by our team.');
      
      // Reset inputs
      setCode('');
      setReceiptFile(null);
      setReceiptPreview('');

      // Refresh balance and history
      await refreshMe();
      await loadData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit deposit.');
    } finally {
      setSubmitting(false);
    }
  };

  // Pending deposits tally
  const pendingTotal = history
    .filter(d => d.status === 'pending')
    .reduce((acc, curr) => acc + curr.claimed_amount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
      
      {/* Wallet Balance Hero Card */}
      <div className="bg-gradient-to-r from-surface-card via-surface-card to-surface-card/60 border border-surface-border rounded-3xl p-6 sm:p-8 shadow-card-elevated mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Available Wallet Balance</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                ${walletBalance.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-gray-400">USD</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              All transactions on Viewpay are processed strictly in US Dollars ($).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-surface/80 border border-surface-border px-4 py-3 rounded-2xl">
              <div className="text-[11px] font-semibold text-gray-400 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Pending Verification
              </div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">
                ${pendingTotal.toFixed(2)} USD
              </div>
            </div>

            <div className="bg-surface/80 border border-surface-border px-4 py-3 rounded-2xl">
              <div className="text-[11px] font-semibold text-gray-400 flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                Vault Security
              </div>
              <div className="text-xs font-bold text-cyan-400 mt-1">
                AES-256 Encrypted
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Deposit Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
            
            <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-6">
              <div>
                <h2 className="text-xl font-black text-white">Deposit with E-Code</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Redeem Razer Gold or Apple Gift Cards. Manually verified in 5-15 mins.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 uppercase">
                USD Only
              </span>
            </div>

            {/* Success Alert */}
            {successMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start space-x-3 animate-in fade-in">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-white">Submission Successful!</h4>
                  <p className="mt-0.5">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start space-x-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-white">Submission Error</h4>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitDeposit} className="space-y-5">
              
              {/* Card Type Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  1. Select E-Code Brand
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCardType('razer_gold')}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      cardType === 'razer_gold'
                        ? 'bg-primary-500/10 border-primary-500 shadow-glow-gold'
                        : 'bg-surface hover:bg-surface-hover border-surface-border'
                    }`}
                  >
                    <div className="font-black text-sm text-white flex items-center justify-between">
                      <span>Razer Gold</span>
                      {cardType === 'razer_gold' && <CheckCircle className="w-4 h-4 text-primary-400" />}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">Digital PIN / Voucher</div>
                    <div className="text-[10px] text-primary-400 font-bold mt-2">USD $5 - $1,000</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCardType('apple')}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      cardType === 'apple'
                        ? 'bg-primary-500/10 border-primary-500 shadow-glow-gold'
                        : 'bg-surface hover:bg-surface-hover border-surface-border'
                    }`}
                  >
                    <div className="font-black text-sm text-white flex items-center justify-between">
                      <span>Apple Gift Card</span>
                      {cardType === 'apple' && <CheckCircle className="w-4 h-4 text-primary-400" />}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">16-Digit US Code</div>
                    <div className="text-[10px] text-primary-400 font-bold mt-2">USD $10 - $1,000</div>
                  </button>
                </div>
              </div>

              {/* E-Code Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    2. Enter E-Code
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Encrypted with AES-256
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder={cardType === 'razer_gold' ? 'RG-XXXX-XXXX-XXXX' : 'APPL-XXXX-XXXX-XXXX'}
                    className="w-full px-4 py-3 bg-surface border border-surface-border rounded-xl text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 tracking-wider"
                    required
                  />
                  <Lock className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <div className="mt-1.5 flex items-center space-x-2 text-[11px] text-gray-400">
                  <span>Need sample test code?</span>
                  <button
                    type="button"
                    onClick={() => handleFillDemoCode(cardType)}
                    className="text-primary-400 hover:underline font-semibold"
                  >
                    Auto-Fill Demo {cardType === 'razer_gold' ? 'Razer Gold' : 'Apple'} Code
                  </button>
                </div>
              </div>

              {/* Face Value USD */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  3. Enter Card Face Value (USD $)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1.00"
                    max="1000.00"
                    value={claimedAmount}
                    onChange={(e) => setClaimedAmount(e.target.value)}
                    placeholder="50.00"
                    className="w-full pl-8 pr-4 py-3 bg-surface border border-surface-border rounded-xl text-sm font-bold text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    required
                  />
                </div>

                {/* Quick denomination chips */}
                <div className="flex items-center space-x-2 mt-2">
                  {['25.00', '50.00', '100.00', '200.00'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setClaimedAmount(val)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        claimedAmount === val
                          ? 'bg-primary-500 text-black border-primary-500'
                          : 'bg-surface hover:bg-surface-hover border-surface-border text-gray-300'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Receipt Screenshot Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  4. Upload Receipt or Card Screenshot (Recommended)
                </label>
                <div className="border-2 border-dashed border-surface-border hover:border-primary-500/50 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-surface/50 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {receiptPreview ? (
                    <div className="flex items-center justify-center space-x-3">
                      <img
                        src={receiptPreview}
                        alt="Receipt Preview"
                        className="w-16 h-16 rounded-xl object-cover border border-surface-border"
                      />
                      <div className="text-left text-xs text-gray-300">
                        <div className="font-bold text-white">{receiptFile?.name}</div>
                        <div className="text-emerald-400 font-semibold mt-0.5">Screenshot attached</div>
                        <div className="text-[10px] text-gray-400 mt-1">Click to replace</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                      <div className="text-xs font-semibold text-gray-300">
                        Click or drag receipt / voucher screenshot
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        JPG, PNG, WebP up to 10MB
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Final Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 leading-relaxed">
                <Info className="w-4 h-4 inline mr-1 -mt-0.5 text-amber-400" />
                <strong>Note on Manual Verification:</strong> Your wallet is credited after our administrators verify the e-code with the provider. Once submitted, deposits cannot be modified or canceled.
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-400 hover:to-amber-400 text-black font-extrabold text-sm rounded-2xl shadow-glow-gold flex items-center justify-center space-x-2 transition-transform active:scale-95"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting to Verification Queue...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Submit Deposit for Verification</span>
                  </>
                )}
              </button>

            </form>

          </div>
        </div>

        {/* Right Column: Instructions & Where to Buy (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* How to Buy Card */}
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
            <h3 className="text-base font-bold text-white mb-2 flex items-center">
              <HelpCircle className="w-4 h-4 mr-2 text-primary-400" />
              Where to Buy E-Codes
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              You can purchase Razer Gold or Apple Gift Cards instantly online with credit card, PayPal, or crypto at official sellers:
            </p>

            <div className="space-y-3">
              <a
                href="https://gold.razer.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-surface hover:bg-surface-hover border border-surface-border transition-colors group"
              >
                <div>
                  <div className="font-bold text-xs text-white group-hover:text-primary-400 flex items-center">
                    Razer Gold Official Portal
                    <ExternalLink className="w-3 h-3 ml-1 text-gray-500" />
                  </div>
                  <div className="text-[10px] text-gray-400">Buy USD PINs directly via Razer</div>
                </div>
                <span className="text-[10px] font-semibold text-primary-400">Visit →</span>
              </a>

              <a
                href="https://www.apple.com/shop/gift-cards"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-surface hover:bg-surface-hover border border-surface-border transition-colors group"
              >
                <div>
                  <div className="font-bold text-xs text-white group-hover:text-primary-400 flex items-center">
                    Apple Official Store
                    <ExternalLink className="w-3 h-3 ml-1 text-gray-500" />
                  </div>
                  <div className="text-[10px] text-gray-400">Email delivery Apple Gift Cards in USD</div>
                </div>
                <span className="text-[10px] font-semibold text-primary-400">Visit →</span>
              </a>

              <a
                href="https://www.amazon.com/dp/B08G9KG5CG"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-surface hover:bg-surface-hover border border-surface-border transition-colors group"
              >
                <div>
                  <div className="font-bold text-xs text-white group-hover:text-primary-400 flex items-center">
                    Amazon Digital Gift Cards
                    <ExternalLink className="w-3 h-3 ml-1 text-gray-500" />
                  </div>
                  <div className="text-[10px] text-gray-400">Instant digital code delivery</div>
                </div>
                <span className="text-[10px] font-semibold text-primary-400">Visit →</span>
              </a>
            </div>
          </div>

          {/* Verification Rules Card */}
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
            <h3 className="text-base font-bold text-white mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-primary-400" />
              Deposit Verification Policies
            </h3>

            <ul className="space-y-2.5 text-xs text-gray-300">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>USD Only:</strong> Codes must be in US Dollars. Foreign currencies will be rejected.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>5-15 Min Approval:</strong> Our team reviews and redemptions happen continuously.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Duplicate Protection:</strong> Resubmitting previously entered codes is automatically blocked.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Rate Limiting:</strong> Maximum of 5 submissions per hour per user account.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* Deposit History Table */}
      <div className="mt-12 bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-4">
          <div>
            <h3 className="text-lg font-black text-white">Deposit History</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Live status of your submitted Razer Gold and Apple Gift Card deposits.
            </p>
          </div>
          <button
            onClick={loadData}
            className="p-2 bg-surface hover:bg-surface-hover rounded-xl text-gray-400 hover:text-white transition-colors"
            title="Refresh history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-gray-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">No deposit records yet</h4>
            <p className="text-xs text-gray-400 mt-1">Submit your first e-code above to top up your balance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Card Type</th>
                  <th className="py-3 px-3">E-Code (Masked)</th>
                  <th className="py-3 px-3">Claimed USD</th>
                  <th className="py-3 px-3">Verified USD</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Notes / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {history.map(dep => {
                  return (
                    <tr key={dep.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 px-3 text-gray-300 font-mono whitespace-nowrap">
                        {new Date(dep.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                        {dep.card_type === 'razer_gold' ? 'Razer Gold' : 'Apple Gift Card'}
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-400 whitespace-nowrap">
                        {dep.masked_code}
                      </td>
                      <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                        ${dep.claimed_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-400 whitespace-nowrap">
                        {dep.verified_amount ? `$${dep.verified_amount.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {dep.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center w-fit">
                            <Clock className="w-3 h-3 mr-1 animate-spin" /> Pending Review
                          </span>
                        )}
                        {dep.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center w-fit">
                            <CheckCircle className="w-3 h-3 mr-1" /> Approved
                          </span>
                        )}
                        {dep.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold flex items-center w-fit">
                            <XCircle className="w-3 h-3 mr-1" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-400 max-w-xs truncate">
                        {dep.rejection_reason ? (
                          <span className="text-red-400 font-medium">{dep.rejection_reason}</span>
                        ) : dep.status === 'approved' ? (
                          <span className="text-emerald-400">Credited to wallet</span>
                        ) : (
                          <span className="text-gray-500 italic">In admin review queue</span>
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
  );
}
