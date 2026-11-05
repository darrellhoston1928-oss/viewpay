import React from 'react';
import { Wallet, AlertTriangle, ArrowRight, X } from 'lucide-react';

export function InsufficientBalanceModal({ isOpen, onClose, currentBalance, requiredAmount, onGoToDeposit }) {
  if (!isOpen) return null;

  const deficit = Math.max(0, requiredAmount - currentBalance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-black text-white tracking-tight">
          Insufficient Wallet Balance
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          You don't have enough USD in your Viewpay wallet to complete this purchase.
        </p>

        {/* Balance breakdown */}
        <div className="bg-surface p-4 rounded-2xl border border-surface-border my-5 space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Item Price:</span>
            <span className="font-semibold text-white">${requiredAmount.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Your Current Balance:</span>
            <span className="font-semibold text-emerald-400">${currentBalance.toFixed(2)} USD</span>
          </div>
          <div className="border-t border-surface-border pt-2 flex justify-between text-sm font-bold">
            <span className="text-amber-400">Required Deposit:</span>
            <span className="text-amber-400">+${deficit.toFixed(2)} USD</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              onGoToDeposit();
            }}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-400 hover:to-amber-400 text-black font-extrabold text-sm rounded-xl shadow-glow-gold flex items-center justify-center space-x-2 transition-transform active:scale-95"
          >
            <Wallet className="w-4 h-4" />
            <span>Deposit via Razer Gold or Apple E-Code</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-gray-400 hover:text-white font-semibold transition-colors"
          >
            Cancel & Return
          </button>
        </div>
      </div>
    </div>
  );
}
