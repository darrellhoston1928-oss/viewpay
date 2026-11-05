import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ExplorePage } from './pages/ExplorePage';
import { CreatorProfilePage } from './pages/CreatorProfilePage';
import { PostViewPage } from './pages/PostViewPage';
import { WalletDepositPage } from './pages/WalletDepositPage';
import { LibraryPage } from './pages/LibraryPage';
import { CreatorDashboardPage } from './pages/CreatorDashboardPage';
import { UploadPostPage } from './pages/UploadPostPage';
import { PayoutsPage } from './pages/PayoutsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { AuthPages } from './pages/AuthPages';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { DmcaPage } from './pages/DmcaPage';
import { Shield, Lock, CreditCard } from 'lucide-react';

function MainApp() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('landing');
  const [selectedCreatorUsername, setSelectedCreatorUsername] = useState('elenacreates');
  const [selectedPostId, setSelectedPostId] = useState(1);

  const handleSelectCreator = (username) => {
    setSelectedCreatorUsername(username);
    setActivePage('creator-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPost = (postId) => {
    setSelectedPostId(postId);
    setActivePage('post-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToDeposit = () => {
    setActivePage('wallet');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-gray-100 font-sans selection:bg-primary-500 selection:text-black">
      
      {/* Top Navbar */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Page Body */}
      <main className="flex-1">
        {activePage === 'landing' && (
          <LandingPage
            setActivePage={setActivePage}
            onSelectCreator={handleSelectCreator}
          />
        )}

        {activePage === 'explore' && (
          <ExplorePage onSelectCreator={handleSelectCreator} />
        )}

        {activePage === 'creator-profile' && (
          <CreatorProfilePage
            username={selectedCreatorUsername}
            onBack={() => setActivePage('explore')}
            onSelectPost={handleSelectPost}
            onGoToDeposit={handleGoToDeposit}
          />
        )}

        {activePage === 'post-view' && (
          <PostViewPage
            postId={selectedPostId}
            onBack={() => setActivePage('creator-profile')}
            onSelectCreator={handleSelectCreator}
            onGoToDeposit={handleGoToDeposit}
          />
        )}

        {activePage === 'wallet' && (
          <WalletDepositPage />
        )}

        {activePage === 'library' && (
          <LibraryPage
            onSelectPost={handleSelectPost}
            onSelectCreator={handleSelectCreator}
          />
        )}

        {activePage === 'creator-dashboard' && (
          <CreatorDashboardPage
            setActivePage={setActivePage}
            onSelectPost={handleSelectPost}
          />
        )}

        {activePage === 'upload' && (
          <UploadPostPage
            onBack={() => setActivePage('creator-dashboard')}
            onPostCreated={(postId) => {
              setSelectedPostId(postId);
              setActivePage('post-view');
            }}
          />
        )}

        {activePage === 'payouts' && (
          <PayoutsPage onBack={() => setActivePage('creator-dashboard')} />
        )}

        {activePage === 'notifications' && (
          <NotificationsPage />
        )}

        {activePage === 'settings' && (
          <SettingsPage />
        )}

        {activePage === 'admin-panel' && (
          <AdminPanelPage onSelectPost={handleSelectPost} />
        )}

        {activePage === 'auth' && (
          <AuthPages onSuccess={() => setActivePage('explore')} />
        )}

        {activePage === 'terms' && <TermsPage />}
        {activePage === 'privacy' && <PrivacyPage />}
        {activePage === 'dmca' && <DmcaPage />}
      </main>

      {/* Mobile App Bottom Nav */}
      <MobileBottomNav activePage={activePage} setActivePage={setActivePage} />

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface-card/60 backdrop-blur text-xs text-gray-400 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-amber-600 flex items-center justify-center shadow-glow-gold">
                <Shield className="w-4 h-4 text-black font-extrabold" />
              </div>
              <span className="font-black text-white text-sm tracking-tight">
                VIEW<span className="text-primary-400">PAY</span>
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-[11px] text-gray-400">Premium Creator Monetization Platform</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs">
              <button onClick={() => setActivePage('explore')} className="hover:text-white transition-colors">
                Explore
              </button>
              <button onClick={() => setActivePage('wallet')} className="hover:text-white transition-colors text-emerald-400 font-semibold">
                E-Code Deposit
              </button>
              <button onClick={() => setActivePage('terms')} className="hover:text-white transition-colors">
                Terms of Service (18+)
              </button>
              <button onClick={() => setActivePage('privacy')} className="hover:text-white transition-colors">
                Privacy Policy
              </button>
              <button onClick={() => setActivePage('dmca')} className="hover:text-white transition-colors">
                DMCA Notice
              </button>
            </div>
          </div>

          <div className="border-t border-surface-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
            <div>
              © 2026 Viewpay Inc. All rights reserved. Strictly 18+ adult compliance. All payments in USD ($).
            </div>
            <div className="flex items-center space-x-3">
              <span className="flex items-center"><Lock className="w-3 h-3 mr-1 text-cyan-400" /> AES-256 GCM</span>
              <span>•</span>
              <span className="flex items-center"><CreditCard className="w-3 h-3 mr-1 text-primary-400" /> Razer Gold & Apple Verified</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
