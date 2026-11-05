import React from 'react';
import { Shield, Lock, EyeOff } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28">
      <div className="mb-8 pb-4 border-b border-surface-border">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>AES-256 Vault Cryptography</span>
        </div>
        <h1 className="text-3xl font-black text-white">Privacy & Data Protection Policy</h1>
        <p className="text-xs text-gray-400 mt-1">Last Updated: November 2026</p>
      </div>

      <div className="space-y-6 text-xs text-gray-300 leading-relaxed font-sans">
        <section className="bg-surface-card border border-surface-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center">
            <EyeOff className="w-4 h-4 mr-2 text-cyan-400" />
            1. E-Code Cryptographic Vaulting
          </h2>
          <p>
            When you submit a Razer Gold or Apple Gift Card e-code, the plaintext string is immediately encrypted with military-grade AES-256-GCM cipher before writing to our persistent database. Only designated platform administrators can reveal plaintext codes, and every single reveal event is permanently recorded in our tamper-proof security audit log.
          </p>
        </section>

        <section className="bg-surface-card border border-surface-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center">
            <Lock className="w-4 h-4 mr-2 text-cyan-400" />
            2. Secure Session & Account Integrity
          </h2>
          <p>
            User credentials and passwords are irreversibly salted and hashed using bcrypt (cost factor 10). Authentication tokens are securely verified on each API request. We do not sell, rent, or trade your personal information or contact details to third-party ad networks.
          </p>
        </section>

        <section className="bg-surface-card border border-surface-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-cyan-400" />
            3. Creator Identity Verification Retention
          </h2>
          <p>
            Government-issued identification documents uploaded for creator verification are stored in restricted access folders accessible only to platform risk and compliance officers. ID files are purged or anonymized following statutory verification windows.
          </p>
        </section>
      </div>
    </div>
  );
}
