import React, { useState } from 'react';
import { 
  Shield, Lock, Mail, User, Sparkles, CheckCircle, 
  AlertCircle, ArrowRight, Wallet, CreditCard 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export function AuthPages({ onSuccess }) {
  const { login, register, googleLogin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('viewer'); // 'viewer' or 'creator'
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);

  // Password reset modal
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!isAgeConfirmed) {
          throw new Error('You must confirm that you are at least 18 years old to join Viewpay.');
        }
        await register({
          email,
          password,
          displayName,
          role,
          isAgeConfirmed
        });
      }
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMock = async () => {
    setLoading(true);
    setError('');
    try {
      await googleLogin({
        email: 'google_member@gmail.com',
        displayName: 'Google Member',
        photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        role
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await api.auth.forgotPassword(forgotEmail);
      setResetMessage(res.message);
    } catch (err) {
      setResetMessage(err.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-amber-600 items-center justify-center shadow-glow-gold mb-3">
            <Shield className="w-6 h-6 text-black font-extrabold" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isLogin ? 'Welcome back to Viewpay' : 'Create your Viewpay Account'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isLogin 
              ? 'Access your balance, unlocked media, and creator studio.' 
              : 'Join the premier platform for creator monetization & e-code payments.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-8 shadow-card-elevated">
          
          {/* Tabs: Login vs Register */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface rounded-2xl mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                isLogin ? 'bg-primary-500 text-black shadow-glow-gold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                !isLogin ? 'bg-primary-500 text-black shadow-glow-gold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* If Register: Choose Role (Viewer or Creator) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Choose Account Type
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setRole('viewer')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      role === 'viewer'
                        ? 'bg-primary-500/10 border-primary-500 text-primary-400'
                        : 'bg-surface hover:bg-surface-hover border-surface-border text-gray-400'
                    }`}
                  >
                    <div>Viewer</div>
                    <div className="text-[10px] font-normal text-gray-400">Unlock & support</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('creator')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      role === 'creator'
                        ? 'bg-primary-500/10 border-primary-500 text-primary-400'
                        : 'bg-surface hover:bg-surface-hover border-surface-border text-gray-400'
                    }`}
                  >
                    <div>Creator</div>
                    <div className="text-[10px] font-normal text-gray-400">Upload & earn</div>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your public name"
                    className="w-full px-4 py-2.5 bg-surface border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
                  required
                />
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[10px] text-primary-400 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-primary-500"
                  required
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* If Register: 18+ Mandatory Confirmation */}
            {!isLogin && (
              <div className="pt-2">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAgeConfirmed}
                    onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-primary-500 rounded"
                    required
                  />
                  <span className="text-xs text-gray-300 leading-snug">
                    I confirm that I am <strong className="text-white">at least 18 years of age</strong> and agree to the Viewpay Terms of Service & Privacy Policy.
                  </span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-400 hover:to-amber-400 text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-glow-gold flex items-center justify-center space-x-2 transition-transform active:scale-95"
            >
              <span>{isLogin ? 'Log In to Viewpay' : 'Create 18+ Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-border" /></div>
            <span className="relative px-3 bg-surface-card text-[11px] uppercase font-semibold text-gray-500">
              Or Continue With
            </span>
          </div>

          {/* Google OAuth Mock */}
          <button
            onClick={handleGoogleMock}
            className="w-full py-2.5 px-4 bg-surface hover:bg-surface-hover border border-surface-border rounded-xl text-xs font-bold text-gray-200 flex items-center justify-center space-x-2.5 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google Account</span>
          </button>

        </div>

        {/* Forgot Password Modal */}
        {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm bg-surface-card border border-surface-border rounded-3xl p-6 shadow-2xl">
              <h3 className="font-bold text-base text-white">Reset Password</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Enter your email address to receive password reset instructions.
              </p>

              {resetMessage ? (
                <div className="p-3 bg-surface rounded-xl text-xs text-primary-400 mb-4">
                  {resetMessage}
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-primary-500 text-black text-xs font-bold rounded-xl"
                  >
                    Send Reset Link
                  </button>
                </form>
              )}

              <button
                onClick={() => { setShowForgot(false); setResetMessage(''); }}
                className="w-full mt-3 text-center text-xs text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
