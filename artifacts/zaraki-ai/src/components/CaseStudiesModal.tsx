import { useZyxaro } from '@/lib/context';
import { Briefcase, X, Star, CheckCircle2, TrendingUp, Users } from 'lucide-react';

export function CaseStudiesModal() {
  const { isCaseStudiesOpen, setIsCaseStudiesOpen } = useZyxaro();

  if (!isCaseStudiesOpen) return null;

  const caseStudies = [
    {
      title: 'Simultaneous Multi-Model Code Audit',
      role: 'Senior Software Architect',
      result: 'Discovered subtle memory leak in under 3 seconds by comparing GPT-4o, Claude 3.5 Sonnet, and DeepSeek R1 simultaneously.',
      metric: '90% faster debugging',
    },
    {
      title: 'Local Document Synthesis with Privacy',
      role: 'Legal Compliance Researcher',
      result: 'Uploaded 50-page contract into local RAG knowledge base. Parsed locally without sending raw contract to third-party databases.',
      metric: '100% Privacy Compliance',
    },
    {
      title: 'Sub-500ms Real-Time Market Intelligence',
      role: 'Financial Analyst',
      result: 'Queried 5 AI providers in parallel for instant market sentiment verification and exported directly to PowerPoint (.pptx).',
      metric: 'Instant PPT Export',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#070F2B] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#03081A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-100">Use Cases & Social Proof</h2>
              <p className="text-xs text-slate-400">Proven Results • Rated ★ 4.9/5 by 10,000+ Researchers</p>
            </div>
          </div>
          <button
            onClick={() => setIsCaseStudiesOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Social Proof Header Badge */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="font-bold text-sm text-slate-100">4.9 / 5.0 Rating</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
              <Users className="w-4 h-4" />
              <span>10,000+ Active Researchers</span>
            </div>
          </div>

          {/* Case Studies List */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Featured Research Case Studies</h4>
            {caseStudies.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-amber-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    {item.title}
                  </h5>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {item.metric}
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{item.result}</p>
                <div className="text-[11px] text-slate-400 italic">— Verified {item.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#03081A] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Empowering parallel research globally
          </span>
          <button
            onClick={() => setIsCaseStudiesOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold transition-all"
          >
            Explore Stack
          </button>
        </div>
      </div>
    </div>
  );
}
