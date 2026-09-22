import { useEffect, useState } from 'react';
import { useZyxaro } from '@/lib/context';
import { Settings, LogOut, User as UserIcon, Key } from 'lucide-react';
import { StarBorder } from './StarBorder';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { APP_URL } from '@/lib/constants';

export function Header() {
  const { setConfigOpen, setIsApiKeyModalOpen } = useZyxaro();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${APP_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-transparent border-b border-white/10 backdrop-blur-sm z-10 relative">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
          <span className="text-primary text-xl animate-pulse">⚡</span>
          <h1 className="font-display font-bold text-xl sm:text-2xl tracking-widest text-foreground glow-text">ZYXARO</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 rounded-full py-1 px-3">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="User Avatar"
                className="w-6 h-6 rounded-full border border-blue-400/50"
              />
            ) : (
              <UserIcon className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-xs font-medium text-slate-200 hidden sm:inline">
              {user.user_metadata?.full_name || user.email}
            </span>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-red-400 transition-colors p-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-blue-500/25 transition-all border border-blue-400/30 active:scale-95 disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="hidden xs:inline">{loading ? 'Connecting...' : 'Sign in'}</span>
          </button>
        )}

        {/* Developer API Keys Button */}
        <button
          onClick={() => setIsApiKeyModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/15 border border-white/10 hover:border-blue-500/40 text-xs font-semibold text-slate-300 hover:text-blue-300 shadow-sm transition-all active:scale-95"
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
  );
}
