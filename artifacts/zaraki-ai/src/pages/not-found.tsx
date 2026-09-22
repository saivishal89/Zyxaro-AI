import { AlertTriangle, Home, Settings, HelpCircle, Shield, Zap, Crown } from 'lucide-react';
import { FloatingLines } from '@/components/FloatingLines';
import { StarBorder } from '@/components/StarBorder';

export default function NotFound() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-6 bg-[#03081A] text-foreground font-sans overflow-hidden">
      {/* Background Starfield Canvas */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <FloatingLines
          enabledWaves={['top', 'middle', 'bottom']}
          lineCount={[8, 12, 16]}
          lineDistance={[8, 6, 4]}
          linesGradient={['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']}
          bendRadius={5}
          bendStrength={-0.5}
          animationSpeed={0.6}
          mixBlendMode="screen"
        />
      </div>

      {/* Top Header / Breadcrumbs */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-bold text-xl">⚡ ZYXARO AI</span>
          <span className="text-slate-500 text-sm">/</span>
          <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">404 Error</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>sub-500ms Guarantee</span>
          </div>
        </div>
      </header>

      {/* Main 404 Hero Section */}
      <main className="my-auto flex flex-col items-center text-center max-w-2xl px-4 py-12">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/40 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10 animate-bounce">
          <AlertTriangle className="w-10 h-10 text-blue-400" />
        </div>

        <h1 className="font-display font-extrabold text-5xl sm:text-6xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-cyan-400 glow-text mb-4">
          404 // ROUTE NOT FOUND
        </h1>

        <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-lg leading-relaxed">
          The requested signal coordinates do not exist in the ZYXARO multi-model spatial grid. Return to the core research terminal below.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <StarBorder
            as="a"
            href="/"
            color="#3B82F6"
            speed="5s"
            style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFFFFF', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Home className="w-4 h-4 text-blue-400" />
            <span>Return to Workspace</span>
          </StarBorder>

          <a
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-sm font-semibold border border-white/10 transition-all"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Configure AI Keys</span>
          </a>
        </div>
      </main>

      {/* Footer / CEO Attribution */}
      <footer className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between py-4 border-t border-white/10 text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-400" />
          <span>ZYXARO AI Stack — Founded by <strong className="text-slate-200">Chikoti Sai Vishal (CEO)</strong></span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            100% Local Privacy
          </span>
          <span>•</span>
          <span>sub-500ms Engine</span>
        </div>
      </footer>
    </div>
  );
}
