import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Compass, Wallet, Lock, LayoutDashboard, User, Shield } from 'lucide-react';

export function MobileBottomNav({ activePage, setActivePage }) {
  const { user, pendingDepositsCount } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-surface-border px-3 py-2 flex items-center justify-around">
      <button
        onClick={() => setActivePage('explore')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs font-medium transition-colors ${
          activePage === 'explore' ? 'text-primary-400 font-bold' : 'text-gray-400'
        }`}
      >
        <Compass className="w-5 h-5 mb-0.5" />
        <span>Explore</span>
      </button>

      <button
        onClick={() => setActivePage('wallet')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs font-medium transition-colors ${
          activePage === 'wallet' ? 'text-emerald-400 font-bold' : 'text-gray-400'
        }`}
      >
        <Wallet className="w-5 h-5 mb-0.5 text-emerald-400" />
        <span>Wallet</span>
      </button>

      {user && (
        <button
          onClick={() => setActivePage('library')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs font-medium transition-colors ${
            activePage === 'library' ? 'text-primary-400 font-bold' : 'text-gray-400'
          }`}
        >
          <Lock className="w-5 h-5 mb-0.5" />
          <span>Library</span>
        </button>
      )}

      {user && (user.role === 'creator' || user.role === 'admin') && (
        <button
          onClick={() => setActivePage('creator-dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs font-medium transition-colors ${
            activePage === 'creator-dashboard' || activePage === 'upload' ? 'text-primary-400 font-bold' : 'text-gray-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Studio</span>
        </button>
      )}

      {user && user.role === 'admin' ? (
        <button
          onClick={() => setActivePage('admin-panel')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs font-medium transition-colors relative ${
            activePage === 'admin-panel' ? 'text-amber-400 font-bold' : 'text-gray-400'
          }`}
        >
          <Shield className="w-5 h-5 mb-0.5 text-amber-400" />
          <span>Admin</span>
          {pendingDepositsCount > 0 && (
            <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
          )}
        </button>
      ) : (
        <button
          onClick={() => setActivePage(user ? 'settings' : 'auth')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs font-medium transition-colors ${
            activePage === 'settings' || activePage === 'auth' ? 'text-primary-400 font-bold' : 'text-gray-400'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>{user ? 'Account' : 'Sign In'}</span>
        </button>
      )}
    </div>
  );
}
