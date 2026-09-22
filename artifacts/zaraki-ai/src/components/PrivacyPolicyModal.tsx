import { useZyxaro } from '@/lib/context';
import { ShieldCheck, X, Lock, ServerOff, Cpu, Key, CheckCircle } from 'lucide-react';

export function PrivacyPolicyModal() {
  const { isPrivacyOpen, setIsPrivacyOpen } = useZyxaro();

  if (!isPrivacyOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#070F2B] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#03081A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-100">Local-First Privacy Guarantee</h2>
              <p className="text-xs text-slate-400">Zero Server Data Storage • 100% Client-Side Privacy</p>
            </div>
          </div>
          <button
            onClick={() => setIsPrivacyOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
            <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-cyan-200 mb-1">Our Core Privacy Pledge</h3>
              <p>ZYXARO AI operates entirely inside your web browser. Your API keys, research notes, documents, and chat messages never leave your device to any central ZYXARO server.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
              <ServerOff className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-200 mb-0.5">Zero Middleware Servers</strong>
                <span>All requests travel direct from your browser to AI model providers.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
              <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-200 mb-0.5">Browser LocalStorage</strong>
                <span>API keys are stored strictly in your browser's private storage.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-200 mb-0.5">Local RAG Parsing</strong>
                <span>Uploaded RAG documents are parsed and chunked locally.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-200 mb-0.5">Total Ownership</strong>
                <span>Clear your keys or sessions anytime with 1-click in Config.</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="font-semibold text-slate-200 mb-1 text-xs">Direct Provider Connections</h4>
            <p className="text-slate-400">
              When querying AI providers (OpenAI, Anthropic, Groq, Mistral, etc.), your browser communicates with their secure HTTPS endpoints using your own credentials.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#03081A] flex items-center justify-between text-xs text-slate-400">
          <span>Protected under ZYXARO AI Privacy Protocol</span>
          <button
            onClick={() => setIsPrivacyOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
