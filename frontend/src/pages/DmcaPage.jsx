import React, { useState } from 'react';
import { Flag, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export function DmcaPage() {
  const [submitted, setSubmitted] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [workUrl, setWorkUrl] = useState('');
  const [statement, setStatement] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28">
      <div className="mb-8 pb-4 border-b border-surface-border">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold mb-3">
          <Flag className="w-3.5 h-3.5" />
          <span>Copyright Compliance</span>
        </div>
        <h1 className="text-3xl font-black text-white">DMCA & Copyright Takedown Notice</h1>
        <p className="text-xs text-gray-400 mt-1">Designated DMCA Agent & Safe Harbor Policy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-6 space-y-4 text-xs text-gray-300 leading-relaxed font-sans">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-2">Notice and Takedown Policy</h2>
            <p>
              Viewpay respects the intellectual property rights of creators and copyright owners. In accordance with the Digital Millennium Copyright Act (17 U.S.C. § 512), Viewpay expeditiously removes or disables access to content that is claimed to be infringing upon receipt of a valid statutory takedown notice.
            </p>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-2">Repeat Infringer Policy</h2>
            <p>
              Users or creators identified as having repeatedly infringed copyrights on Viewpay will face permanent suspension and termination of their accounts and forfeiture of content publishing privileges.
            </p>
          </div>
        </div>

        {/* Takedown Form */}
        <div className="md:col-span-6 bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-elevated">
          <h3 className="text-base font-bold text-white mb-1">Submit DMCA Notice</h3>
          <p className="text-xs text-gray-400 mb-4">File an official claim directly to our legal compliance agent.</p>

          {submitted ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-sm text-white">Takedown Claim Dispatched</h4>
              <p className="text-xs text-gray-400">Our legal counsel will review your complaint within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-300 uppercase text-[10px] mb-1">
                  Copyright Owner / Representative Full Name
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase text-[10px] mb-1">
                  Contact Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase text-[10px] mb-1">
                  URL / Identification of Infringing Material on Viewpay
                </label>
                <input
                  type="text"
                  value={workUrl}
                  onChange={(e) => setWorkUrl(e.target.value)}
                  placeholder="https://viewpay.com/post/..."
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 uppercase text-[10px] mb-1">
                  Statement Under Penalty of Perjury
                </label>
                <textarea
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  rows={2}
                  placeholder="I have a good faith belief that the disputed use of the material is not authorized..."
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-white resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                Transmit DMCA Notice
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
