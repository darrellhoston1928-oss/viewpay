import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Wallet, Shield, Bell, Compass, LayoutDashboard, 
  Upload, User, LogOut, ChevronDown, CheckCircle, 
  AlertCircle, Sparkles, Menu, X, CreditCard, Lock
} from 'lucide-react';

export function Navbar({ activePage, setActivePage }) {
  const { user, walletBalance, unreadCount, pendingDepositsCount, logout, switchDemoAccount } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleDemoSwitch = async (persona) => {
    try {
      await switchDemoAccount(persona);
      setDemoDropdownOpen(false);
      setMobileMenuOpen(false);
    } catch (err) {
      alert('Failed to switch demo account: ' + err.message);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-nav border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setActivePage('landing')} 
              className="flex items-center space-x-3 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 via-primary-500 to-amber-600 flex items-center justify-center shadow-glow-gold group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-black font-extrabold" />
              </div>
              <div>
                <div className="text-xl font-black tracking-tight flex items-center text-white">
                  VIEW<span className="text-primary-400">PAY</span>
                </div>
                <div className="text-[10px] tracking-wider text-gray-400 font-semibold uppercase -mt-1">
                  E-Code Vault & Creator Pay
                </div>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setActivePage('explore')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  activePage === 'explore' 
                    ? 'bg-surface-accent text-primary-400 border border-primary-500/30' 
                    : 'text-gray-300 hover:text-white hover:bg-surface-hover'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Explore Creators</span>
              </button>

              {user && (
                <button
                  onClick={() => setActivePage('library')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    activePage === 'library' 
                      ? 'bg-surface-accent text-primary-400 border border-primary-500/30' 
                      : 'text-gray-300 hover:text-white hover:bg-surface-hover'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>My Library</span>
                </button>
              )}

              {user && (user.role === 'creator' || user.role === 'admin') && (
                <button
                  onClick={() => setActivePage('creator-dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    activePage === 'creator-dashboard' || activePage === 'upload' 
                      ? 'bg-surface-accent text-primary-400 border border-primary-500/30' 
                      : 'text-gray-300 hover:text-white hover:bg-surface-hover'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Creator Studio</span>
                </button>
              )}

              {user && user.role === 'admin' && (
                <button
                  onClick={() => setActivePage('admin-panel')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 relative ${
                    activePage === 'admin-panel' 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                      : 'text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Panel</span>
                  {pendingDepositsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[11px] font-bold rounded-full animate-pulse">
                      {pendingDepositsCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right Section: Persona Switcher, Wallet, Notifications, Profile */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Demo Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                className="px-2.5 py-1.5 bg-surface-card hover:bg-surface-hover border border-surface-border rounded-lg text-xs font-semibold text-gray-300 flex items-center space-x-1.5 transition-all"
                title="Switch demo persona to test different roles"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary-400 animate-spin-slow" />
                <span className="hidden sm:inline">Demo Persona</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {demoDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-surface-card border border-surface-border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setDemoDropdownOpen(false)}
                >
                  <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-surface-border mb-1">
                    Select Test Account
                  </div>
                  
                  <div className="space-y-0.5">
                    <button
                      onClick={() => handleDemoSwitch('admin')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-hover text-xs flex items-center justify-between text-amber-300"
                    >
                      <div>
                        <div className="font-bold flex items-center">
                          <Shield className="w-3 h-3 mr-1 text-amber-400" />
                          Alexander Pierce (Owner Admin)
                        </div>
                        <div className="text-[10px] text-gray-400">admin@viewpay.com • Full Control</div>
                      </div>
                      {user?.email === 'admin@viewpay.com' && <CheckCircle className="w-3.5 h-3.5 text-primary-400" />}
                    </button>

                    <button
                      onClick={() => handleDemoSwitch('reviewer')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-hover text-xs flex items-center justify-between text-yellow-300"
                    >
                      <div>
                        <div className="font-bold flex items-center">
                          <CreditCard className="w-3 h-3 mr-1 text-yellow-400" />
                          Sarah Lin (Deposit Reviewer)
                        </div>
                        <div className="text-[10px] text-gray-400">reviewer@viewpay.com • Verifications</div>
                      </div>
                      {user?.email === 'reviewer@viewpay.com' && <CheckCircle className="w-3.5 h-3.5 text-primary-400" />}
                    </button>

                    <button
                      onClick={() => handleDemoSwitch('elena')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-hover text-xs flex items-center justify-between text-pink-300"
                    >
                      <div>
                        <div className="font-bold flex items-center">
                          <User className="w-3 h-3 mr-1 text-pink-400" />
                          Elena Thorne (Creator)
                        </div>
                        <div className="text-[10px] text-gray-400">elena@viewpay.com • Cosplay & Art ($14.99)</div>
                      </div>
                      {user?.email === 'elena@viewpay.com' && <CheckCircle className="w-3.5 h-3.5 text-pink-400" />}
                    </button>

                    <button
                      onClick={() => handleDemoSwitch('marcus')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-hover text-xs flex items-center justify-between text-cyan-300"
                    >
                      <div>
                        <div className="font-bold flex items-center">
                          <User className="w-3 h-3 mr-1 text-cyan-400" />
                          Marcus Vance (Creator)
                        </div>
                        <div className="text-[10px] text-gray-400">marcus@viewpay.com • Fitness ($19.99)</div>
                      </div>
                      {user?.email === 'marcus@viewpay.com' && <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>

                    <button
                      onClick={() => handleDemoSwitch('viewer')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-hover text-xs flex items-center justify-between text-emerald-300"
                    >
                      <div>
                        <div className="font-bold flex items-center">
                          <Wallet className="w-3 h-3 mr-1 text-emerald-400" />
                          John Davis (Viewer w/ Balance)
                        </div>
                        <div className="text-[10px] text-gray-400">viewer@viewpay.com • Balance: $85.00</div>
                      </div>
                      {user?.email === 'viewer@viewpay.com' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>

                    <button
                      onClick={() => handleDemoSwitch('newbie')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-hover text-xs flex items-center justify-between text-gray-300"
                    >
                      <div>
                        <div className="font-bold flex items-center">
                          <User className="w-3 h-3 mr-1 text-gray-400" />
                          Maya Sterling (New User)
                        </div>
                        <div className="text-[10px] text-gray-400">newbie@viewpay.com • $0 Balance (Test Deposit)</div>
                      </div>
                      {user?.email === 'newbie@viewpay.com' && <CheckCircle className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Wallet Balance Pill */}
            {user ? (
              <div className="flex items-center bg-surface-card border border-surface-border rounded-xl p-1 shadow-inner">
                <button
                  onClick={() => setActivePage('wallet')}
                  className="flex items-center space-x-1.5 px-2.5 py-1 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="View Wallet and Deposit Funds"
                >
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>${walletBalance.toFixed(2)}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400">USD</span>
                </button>

                <button
                  onClick={() => setActivePage('wallet')}
                  className="px-2 py-1 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-400 hover:to-amber-400 text-black font-extrabold text-xs rounded-lg transition-transform active:scale-95 flex items-center space-x-1 shadow-glow-gold"
                  title="Deposit funds using Razer Gold or Apple e-Codes"
                >
                  <span>+</span>
                  <span className="hidden sm:inline">Deposit</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActivePage('auth')}
                className="px-4 py-2 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-400 hover:to-amber-400 text-black font-bold text-sm rounded-xl shadow-glow-gold transition-all"
              >
                Log In / Join
              </button>
            )}

            {/* Notifications Bell */}
            {user && (
              <button
                onClick={() => setActivePage('notifications')}
                className={`p-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-gray-300 hover:text-white transition-colors relative ${
                  activePage === 'notifications' ? 'border-primary-500/50 text-primary-400' : ''
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile Menu Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-1 rounded-xl hover:bg-surface-hover transition-colors focus:outline-none"
                >
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={user.display_name}
                    className="w-8 h-8 rounded-lg object-cover border border-surface-border"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-surface-card border border-surface-border rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in"
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-surface-border mb-1">
                      <div className="font-bold text-sm text-white truncate">{user.display_name}</div>
                      <div className="text-xs text-gray-400 truncate">{user.email}</div>
                      <div className="mt-1 flex items-center space-x-1">
                        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-surface-accent text-primary-400 border border-primary-500/30">
                          {user.role} {user.admin_role ? `(${user.admin_role})` : ''}
                        </span>
                        {user.is_age_verified === 1 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            18+
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => { setActivePage('settings'); setProfileDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-surface-hover rounded-xl flex items-center space-x-2"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      onClick={() => { setActivePage('wallet'); setProfileDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-surface-hover rounded-xl flex items-center space-x-2"
                    >
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span>Wallet & Deposit History</span>
                    </button>

                    {(user.role === 'creator' || user.role === 'admin') && (
                      <button
                        onClick={() => { setActivePage('creator-dashboard'); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-surface-hover rounded-xl flex items-center space-x-2"
                      >
                        <LayoutDashboard className="w-4 h-4 text-primary-400" />
                        <span>Creator Dashboard</span>
                      </button>
                    )}

                    {user.role === 'admin' && (
                      <button
                        onClick={() => { setActivePage('admin-panel'); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-amber-300 hover:bg-amber-500/10 rounded-xl flex items-center space-x-2"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>Admin Console</span>
                      </button>
                    )}

                    <div className="border-t border-surface-border mt-1 pt-1">
                      <button
                        onClick={() => { logout(); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-surface-card text-gray-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-surface-border px-4 pt-2 pb-6 space-y-2">
          <button
            onClick={() => { setActivePage('explore'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-200 hover:bg-surface-hover flex items-center space-x-3"
          >
            <Compass className="w-4 h-4 text-primary-400" />
            <span>Explore Creators</span>
          </button>

          {user && (
            <button
              onClick={() => { setActivePage('library'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-200 hover:bg-surface-hover flex items-center space-x-3"
            >
              <Lock className="w-4 h-4 text-primary-400" />
              <span>My Library</span>
            </button>
          )}

          {user && (user.role === 'creator' || user.role === 'admin') && (
            <button
              onClick={() => { setActivePage('creator-dashboard'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-200 hover:bg-surface-hover flex items-center space-x-3"
            >
              <LayoutDashboard className="w-4 h-4 text-primary-400" />
              <span>Creator Dashboard</span>
            </button>
          )}

          {user && user.role === 'admin' && (
            <button
              onClick={() => { setActivePage('admin-panel'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-300 hover:bg-amber-500/10 flex items-center space-x-3"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Admin Panel ({pendingDepositsCount} pending)</span>
            </button>
          )}

          <button
            onClick={() => { setActivePage('wallet'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-400 hover:bg-surface-hover flex items-center space-x-3"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Deposit E-Codes (Razer Gold / Apple)</span>
          </button>

          <button
            onClick={() => { setActivePage('terms'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-400 hover:bg-surface-hover"
          >
            Terms & 18+ Compliance
          </button>
        </div>
      )}
    </nav>
  );
}
