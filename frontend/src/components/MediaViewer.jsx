import React from 'react';
import { Lock, Play, ShieldAlert, Sparkles } from 'lucide-react';

export function MediaViewer({ 
  mediaUrl, 
  previewUrl, 
  mediaType = 'photo', 
  isLocked = false, 
  price = 0, 
  title = '',
  onUnlockClick 
}) {
  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  return (
    <div 
      className="relative w-full overflow-hidden rounded-2xl bg-black border border-surface-border select-none"
      onContextMenu={handleContextMenu}
    >
      {/* Blurred background when locked */}
      {isLocked ? (
        <div className="relative aspect-[4/3] sm:aspect-video w-full flex items-center justify-center overflow-hidden">
          <img
            src={previewUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=50'}
            alt="Locked Preview"
            className="w-full h-full object-cover locked-blur filter blur-2xl scale-110 opacity-70"
            draggable="false"
          />

          {/* Locked Overlay Card */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-16 h-16 rounded-3xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center text-primary-400 mb-3 shadow-glow-gold animate-bounce">
              <Lock className="w-8 h-8" />
            </div>

            <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30 text-xs font-bold uppercase tracking-wider mb-2">
              Premium Locked Media
            </span>

            <h3 className="text-lg font-black text-white max-w-sm mb-1 line-clamp-1">
              {title || 'Exclusive Content'}
            </h3>

            <p className="text-xs text-gray-400 max-w-xs mb-5">
              Unlock this high-resolution {mediaType === 'video' ? 'video' : 'photo set'} instantly with your Viewpay balance or subscribe to the creator.
            </p>

            <button
              onClick={onUnlockClick}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-400 hover:to-amber-400 text-black font-extrabold text-sm rounded-xl shadow-glow-gold flex items-center space-x-2 transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Unlock for ${price.toFixed(2)} USD</span>
            </button>
          </div>
        </div>
      ) : (
        /* Unlocked Media View */
        <div className="relative aspect-[4/3] sm:aspect-video w-full flex items-center justify-center bg-black">
          {mediaType === 'video' ? (
            <video
              src={mediaUrl}
              controls
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              className="w-full h-full object-contain max-h-[650px]"
              poster={previewUrl}
              onContextMenu={handleContextMenu}
            >
              Your browser does not support HTML5 video streaming.
            </video>
          ) : (
            <img
              src={mediaUrl || previewUrl}
              alt={title}
              className="w-full h-full object-contain max-h-[650px]"
              draggable="false"
              onContextMenu={handleContextMenu}
            />
          )}

          {/* Subtle DRM Watermark */}
          <div className="absolute bottom-2 right-3 pointer-events-none opacity-40 hover:opacity-75 transition-opacity text-[10px] text-gray-300 font-mono tracking-wider bg-black/60 px-2 py-0.5 rounded backdrop-blur">
            Protected by Viewpay Secure Stream
          </div>
        </div>
      )}
    </div>
  );
}
