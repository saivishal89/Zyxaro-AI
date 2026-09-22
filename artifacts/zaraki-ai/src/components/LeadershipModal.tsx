import { useZyxaro } from '@/lib/context';
import { Crown, X, Globe, Sparkles, Shield, Rocket, MapPin, Award } from 'lucide-react';

export function LeadershipModal() {
  const { isLeadershipOpen, setIsLeadershipOpen } = useZyxaro();

  if (!isLeadershipOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#070F2B] border border-yellow-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#03081A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
              <Crown className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-100">Leadership & Executive Office</h2>
              <p className="text-xs text-slate-400">ZYXARO AI Stack Leadership Team</p>
            </div>
          </div>
          <button
            onClick={() => setIsLeadershipOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Executive Profile Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-blue-500/10 border border-yellow-500/30 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-3xl font-extrabold text-black shadow-lg shadow-yellow-500/20 border border-yellow-300/40">
                CSV
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h3 className="font-display font-extrabold text-xl text-yellow-200">Chikoti Sai Vishal</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                  CEO & Founder
                </span>
              </div>
              <p className="text-slate-300 font-medium mb-3">Chief Executive Officer, ZYXARO AI Labs</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Global AI Operations
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-yellow-400" />
                  Local-First Visionary
                </span>
              </div>
            </div>
          </div>

          {/* Mission & Vision */}
          <div>
            <h4 className="font-bold text-slate-200 text-sm mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Executive Vision
            </h4>
            <p className="leading-relaxed text-slate-300">
              Under the strategic leadership of <strong>Chikoti Sai Vishal</strong>, ZYXARO AI was designed with a single uncompromising mission: democratizing access to multi-model artificial intelligence without sacrificing user data privacy or independence.
            </p>
          </div>

          {/* Key Strategic Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col items-center text-center">
              <Rocket className="w-5 h-5 text-blue-400 mb-1.5" />
              <strong className="text-slate-200 text-xs mb-1">Parallel Speed</strong>
              <span className="text-[11px] text-slate-400">Sub-500ms multi-model query engine</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col items-center text-center">
              <Shield className="w-5 h-5 text-cyan-400 mb-1.5" />
              <strong className="text-slate-200 text-xs mb-1">Zero Backend</strong>
              <span className="text-[11px] text-slate-400">100% browser localStorage data sovereignty</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col items-center text-center">
              <Globe className="w-5 h-5 text-emerald-400 mb-1.5" />
              <strong className="text-slate-200 text-xs mb-1">18 AI Providers</strong>
              <span className="text-[11px] text-slate-400">Unified OpenAI & Anthropic standards</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#03081A] flex items-center justify-between text-xs text-slate-400">
          <span>Executive Office • Chikoti Sai Vishal (CEO)</span>
          <button
            onClick={() => setIsLeadershipOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
