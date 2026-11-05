import React from 'react';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28">
      <div className="mb-8 pb-4 border-b border-surface-border">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Strictly 18+ Certified Platform</span>
        </div>
        <h1 className="text-3xl font-black text-white">Terms of Service</h1>
        <p className="text-xs text-gray-400 mt-1">Last Updated: November 2026</p>
      </div>

      <div className="space-y-6 text-xs text-gray-300 leading-relaxed font-sans">
        <section className="bg-surface-card border border-surface-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-primary-400" />
            1. Age Eligibility & Mandatory 18+ Confirmation
          </h2>
          <p>
            You must be at least eighteen (18) years of age, or the age of legal majority in your jurisdiction of residence, to create an account, browse content, or submit transactions on Viewpay. By accessing this platform, you explicitly affirm under penalty of perjury that you are 18 years or older.
          </p>
        </section>

        <section className="bg-surface-card border border-surface-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-primary-400" />
            2. Wallet Deposits via E-Code
          </h2>
          <p>
            Wallet balances are funded via third-party digital voucher e-codes (including Razer Gold and Apple Gift Cards). Viewpay is an independent platform and is not sponsored, endorsed, or affiliated with Razer Inc. or Apple Inc. All deposited codes are subjected to manual administrative verification prior to wallet crediting. All e-code submissions are strictly non-refundable once redeemed. Submitting counterfeit, duplicate, or stolen e-codes will lead to permanent account termination and reporting to appropriate cyber-fraud authorities.
          </p>
        </section>

        <section className="bg-surface-card border border-surface-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-primary-400" />
            3. Content Creator Verification & Platform Commission
          </h2>
          <p>
            Creators must complete government identity verification before publishing paywalled media. The platform retains a standard twenty percent (20%) commission on content sales and monthly subscriptions to cover infrastructure, administrative verification, and server security. Payouts are remitted in USD via manual administrator review.
          </p>
        </section>

        <section className="bg-surface-card border border-surface-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-primary-400" />
            4. Digital Rights Management & Anti-Piracy
          </h2>
          <p>
            Content unlocked on Viewpay is licensed solely for personal, non-commercial viewing. Downloading, screen-recording, ripping, re-distributing, or publicly sharing paywalled media is strictly prohibited and constitutes a copyright violation punishable by civil and criminal statutory damages.
          </p>
        </section>
      </div>
    </div>
  );
}
