import React from 'react';
import { 
  Shield, Wallet, Sparkles, CheckCircle, Lock, 
  ArrowRight, Star, Heart, Play, Users, DollarSign, 
  CreditCard, EyeOff, ShieldCheck, Zap 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LandingPage({ setActivePage, onSelectCreator }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen pb-20">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-surface-card border border-surface-border text-xs text-gray-300 mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-primary-400">Strictly 18+ Certified</span>
            <span className="text-gray-500">•</span>
            <span>Manual Admin Verification</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-300">USD Currency Only ($)</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Monetize Premium Content with <span className="bg-gradient-to-r from-primary-400 via-amber-300 to-primary-500 bg-clip-text text-transparent">E-Code Wallet Security.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto font-normal leading-relaxed">
            The next-generation content creator hub where fans unlock exclusive photos & videos using 
            <strong className="text-white"> Razer Gold</strong> and <strong className="text-white">Apple Gift Card</strong> e-codes.
            Verified by dedicated administrators with AES-256 encrypted vault storage.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setActivePage('explore')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-400 hover:to-amber-400 text-black font-extrabold text-sm rounded-2xl shadow-glow-gold flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Explore Top Creators</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => setActivePage(user ? 'wallet' : 'auth')}
              className="w-full sm:w-auto px-8 py-4 bg-surface-card hover:bg-surface-hover border border-surface-border text-white font-bold text-sm rounded-2xl flex items-center justify-center space-x-2 transition-all"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Deposit with E-Code (USD)</span>
            </button>
          </div>

          {/* Key Metrics Banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-surface-card/60 border border-surface-border p-4 rounded-2xl backdrop-blur">
              <div className="text-2xl font-black text-primary-400">$0.00</div>
              <div className="text-xs text-gray-400 font-medium mt-1">Creator Setup Fees</div>
            </div>
            <div className="bg-surface-card/60 border border-surface-border p-4 rounded-2xl backdrop-blur">
              <div className="text-2xl font-black text-emerald-400">20%</div>
              <div className="text-xs text-gray-400 font-medium mt-1">Transparent Cut (80% to Creator)</div>
            </div>
            <div className="bg-surface-card/60 border border-surface-border p-4 rounded-2xl backdrop-blur">
              <div className="text-2xl font-black text-amber-400">100%</div>
              <div className="text-xs text-gray-400 font-medium mt-1">Manual Admin Verification</div>
            </div>
            <div className="bg-surface-card/60 border border-surface-border p-4 rounded-2xl backdrop-blur">
              <div className="text-2xl font-black text-cyan-400">AES-256</div>
              <div className="text-xs text-gray-400 font-medium mt-1">Encrypted E-Code Vault</div>
            </div>
          </div>

        </div>
      </section>

      {/* Featured Creators Carousel / Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">Trending Creators</h2>
            <p className="text-xs text-gray-400 mt-1">Explore verified creators publishing high-tier locked media</p>
          </div>
          <button
            onClick={() => setActivePage('explore')}
            className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Elena */}
          <div 
            onClick={() => onSelectCreator('elenacreates')}
            className="group cursor-pointer bg-surface-card border border-surface-border hover:border-primary-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-card-elevated"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"
                alt="Elena Cover"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/40 to-transparent" />
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur border border-white/10 text-[10px] font-bold text-primary-400 uppercase">
                Art & Cosplay
              </span>
            </div>

            <div className="px-6 pb-6 relative -mt-10">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80"
                alt="Elena Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-surface-border shadow-lg mb-3"
              />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white group-hover:text-primary-400 transition-colors flex items-center">
                    Elena Thorne
                    <CheckCircle className="w-4 h-4 ml-1.5 text-primary-400" />
                  </h3>
                  <div className="text-xs text-gray-400">@elenacreates</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400">$14.99</span>
                  <span className="text-[10px] text-gray-400 block">/ month</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3 line-clamp-2">
                Digital artist & cinematic cosplay designer. Bringing mythical worlds and high-fantasy characters to life.
              </p>

              <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1 text-primary-400" /> 1.4k Subs</span>
                <span className="text-primary-400 font-semibold group-hover:underline">View Profile →</span>
              </div>
            </div>
          </div>

          {/* Card 2: Marcus */}
          <div 
            onClick={() => onSelectCreator('marcus_vance')}
            className="group cursor-pointer bg-surface-card border border-surface-border hover:border-primary-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-card-elevated"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80"
                alt="Marcus Cover"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/40 to-transparent" />
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur border border-white/10 text-[10px] font-bold text-cyan-400 uppercase">
                Fitness
              </span>
            </div>

            <div className="px-6 pb-6 relative -mt-10">
              <img
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80"
                alt="Marcus Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-surface-border shadow-lg mb-3"
              />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white group-hover:text-primary-400 transition-colors flex items-center">
                    Marcus Vance
                    <CheckCircle className="w-4 h-4 ml-1.5 text-primary-400" />
                  </h3>
                  <div className="text-xs text-gray-400">@marcus_vance</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400">$19.99</span>
                  <span className="text-[10px] text-gray-400 block">/ month</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3 line-clamp-2">
                Elite athletic conditioning, high-intensity workouts, and raw nutrition breakdown.
              </p>

              <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1 text-primary-400" /> 890 Subs</span>
                <span className="text-primary-400 font-semibold group-hover:underline">View Profile →</span>
              </div>
            </div>
          </div>

          {/* Card 3: Chloe */}
          <div 
            onClick={() => onSelectCreator('chloerivera')}
            className="group cursor-pointer bg-surface-card border border-surface-border hover:border-primary-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-card-elevated"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80"
                alt="Chloe Cover"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/40 to-transparent" />
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur border border-white/10 text-[10px] font-bold text-pink-400 uppercase">
                Fashion
              </span>
            </div>

            <div className="px-6 pb-6 relative -mt-10">
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80"
                alt="Chloe Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-surface-border shadow-lg mb-3"
              />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white group-hover:text-primary-400 transition-colors flex items-center">
                    Chloe Rivera
                    <CheckCircle className="w-4 h-4 ml-1.5 text-primary-400" />
                  </h3>
                  <div className="text-xs text-gray-400">@chloerivera</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400">$9.99</span>
                  <span className="text-[10px] text-gray-400 block">/ month</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3 line-clamp-2">
                Fashion editorial photography, backstage runway coverage, and cinematic lookbooks.
              </p>

              <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1 text-primary-400" /> 620 Subs</span>
                <span className="text-primary-400 font-semibold group-hover:underline">View Profile →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* E-Code Deposit Workflow Explanation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-surface-border">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center text-primary-400 mx-auto mb-3 shadow-glow-gold">
            <CreditCard className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black text-white">How Wallet Deposits Work via E-Codes</h2>
          <p className="text-sm text-gray-400 mt-2">
            No credit card chargebacks. No banking bans. 100% manual administrator verification with AES-256 encrypted storage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface-card border border-surface-border p-6 rounded-3xl relative">
            <span className="w-8 h-8 rounded-xl bg-primary-500/20 text-primary-400 font-black text-sm flex items-center justify-center mb-4">
              1
            </span>
            <h3 className="text-base font-bold text-white mb-2">Purchase E-Code</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Buy a valid <strong>Razer Gold</strong> or <strong>Apple Gift Card</strong> e-code in USD from authorized digital retailers (Razer, Apple, Amazon, Best Buy).
            </p>
          </div>

          <div className="bg-surface-card border border-surface-border p-6 rounded-3xl relative">
            <span className="w-8 h-8 rounded-xl bg-primary-500/20 text-primary-400 font-black text-sm flex items-center justify-center mb-4">
              2
            </span>
            <h3 className="text-base font-bold text-white mb-2">Submit on Deposit Page</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Select card type, paste your unmasked e-code, specify the exact USD face value, and upload an optional receipt screenshot.
            </p>
          </div>

          <div className="bg-surface-card border border-surface-border p-6 rounded-3xl relative">
            <span className="w-8 h-8 rounded-xl bg-primary-500/20 text-primary-400 font-black text-sm flex items-center justify-center mb-4">
              3
            </span>
            <h3 className="text-base font-bold text-white mb-2">Manual Admin Audit</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Our compliance team verifies the code's validity and face value in the Admin Review Queue. Codes remain securely encrypted in our database.
            </p>
          </div>

          <div className="bg-surface-card border border-surface-border p-6 rounded-3xl relative">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center mb-4">
              4
            </span>
            <h3 className="text-base font-bold text-white mb-2">Instant Wallet Credit</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Once approved, funds are added to your wallet in USD. Receive instant in-app and email alerts and start unlocking creator media!
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setActivePage('wallet')}
            className="px-6 py-3 bg-surface-card hover:bg-surface-hover border border-surface-border text-xs font-bold text-primary-400 rounded-xl inline-flex items-center space-x-2"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Open Wallet & View Full Instructions →</span>
          </button>
        </div>
      </section>

      {/* Security & Content Protection Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-surface-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
              Enterprise Grade Safety
            </span>
            <h2 className="text-3xl font-black text-white mt-2 leading-tight">
              Anti-Piracy Streaming & Cryptographic Security
            </h2>
            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              Viewpay shields content creators and viewers alike with cutting-edge defenses and regulatory compliance.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-surface-card border border-surface-border text-primary-400 flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Signed Expiring URLs</h4>
                  <p className="text-xs text-gray-400">Locked media URLs expire automatically and require cryptographic HMAC signatures. Direct hotlinking is prohibited.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-surface-card border border-surface-border text-primary-400 flex-shrink-0 mt-0.5">
                  <EyeOff className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">AES-256 Vault & Audit Logs</h4>
                  <p className="text-xs text-gray-400">E-codes are encrypted at rest with AES-256-GCM. Every administrative code reveal is logged with IP, timestamp, and admin identity.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-surface-card border border-surface-border text-primary-400 flex-shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Right-Click & Download Protection</h4>
                  <p className="text-xs text-gray-400">Protected HTML5 canvas/video player layers disable right-click saving, dragging, and inspection.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-2xl relative">
            <div className="text-xs font-mono text-gray-400 mb-4 pb-2 border-b border-surface-border flex items-center justify-between">
              <span>SECURITY_AUDIT_LOG_PREVIEW.SYS</span>
              <span className="text-emerald-400">● LIVE_MONITOR</span>
            </div>
            <div className="space-y-3 font-mono text-[11px]">
              <div className="p-2.5 rounded-xl bg-surface border border-surface-border text-gray-300">
                <span className="text-primary-400">[AES-256]</span> E-Code APPL-••••-0044 cipher generated with IV tag
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-surface-border text-gray-300">
                <span className="text-emerald-400">[VERIFY]</span> Deposit #2 approved by Admin Sarah Lin (Credited: $150.00 USD)
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-surface-border text-gray-300">
                <span className="text-cyan-400">[STREAM]</span> Signed token generated for Post #1 (Expires: +7200s)
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-surface-border text-gray-300">
                <span className="text-amber-400">[RATE_LIMIT]</span> Duplicate code check executed via SHA-256 hash matching
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 18+ Age & DMCA Compliance Footer Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg flex-shrink-0">
              18+
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Age Verification & DMCA Safe Harbor</h4>
              <p className="text-xs text-gray-400 max-w-xl">
                Viewpay strictly enforces 18+ age confirmation at registration. Creators undergo identity verification before publishing. We comply fully with DMCA copyright takedown procedures.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              onClick={() => setActivePage('terms')}
              className="text-xs text-gray-400 hover:text-white underline font-semibold"
            >
              Terms of Service
            </button>
            <span className="text-gray-600">•</span>
            <button
              onClick={() => setActivePage('dmca')}
              className="text-xs text-gray-400 hover:text-white underline font-semibold"
            >
              DMCA Notice
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
