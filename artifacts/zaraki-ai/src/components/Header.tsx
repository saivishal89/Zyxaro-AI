import { useState } from 'react';
import { useZyxaro } from '@/lib/context';
import { useAuth } from '@/lib/auth-context';
import { Settings, LogOut, User as UserIcon, Key, Shield, UserCheck } from 'lucide-react';
import { StarBorder } from './StarBorder';
import { AuthModal } from './AuthModal';
import { AccountSettings } from './AccountSettings';

export function Header() {
  const { setConfigOpen, setIsApiKeyModalOpen } = useZyxaro();
  const { user, profile, signOut, isSupabaseReady } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-transparent border-b border-white/10 backdrop-blur-sm z-10 relative">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => (window.location.href = '/')}
          >
            <span className="text-primary text-xl animate-pulse">⚡</span>
            <h1 className="font-display font-bold text-xl sm:text-2xl tracking-widest text-foreground glow-text">
              ZYXARO
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 border border-white/10 rounded-full py-1 pl-2 pr-2">
              <button
                id="header-user-account-btn"
                onClick={() => setAccountSettingsOpen(true)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                title="Open Account & Security Settings"
              >
                {user.user_metadata?.avatar_url || profile?.avatar_url ? (
                  <img
                    src={user.user_metadata?.avatar_url || profile?.avatar_url || ''}
                    alt="User Avatar"
                    className="w-6 h-6 rounded-full border border-blue-400/50 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-300">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[120px] truncate">
                  {displayName}
                </span>
              </button>

              <button
                id="header-sign-out-btn"
                onClick={async () => {
                  await signOut();
                }}
                title="Sign Out"
                className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-white/5 cursor-pointer ml-1"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="header-sign-in-btn"
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-blue-500/25 transition-all border border-blue-400/30 active:scale-95 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Developer API Keys Button */}
          <button
            id="header-api-keys-btn"
            onClick={() => setIsApiKeyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/15 border border-white/10 hover:border-blue-500/40 text-xs font-semibold text-slate-300 hover:text-blue-300 shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Zaraki Developer API Keys"
          >
            <Key className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">API Keys</span>
          </button>

          {/* Config Button */}
          <StarBorder
            as="button"
            color="#3B82F6"
            speed="6s"
            onClick={() => setConfigOpen(true)}
            style={{ fontSize: '0.8rem', fontWeight: 600, color: '#93C5FD' }}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Config</span>
          </StarBorder>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Account Settings Modal */}
      <AccountSettings
        isOpen={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
      />
    </>
  );
}
