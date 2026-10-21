import React from 'react'
import { FileText, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Scale, Terminal } from 'lucide-react'
import { FloatingLines } from '@/components/FloatingLines'

export default function TermsOfService() {
  return (
    <div className="relative min-h-screen w-full bg-[#03081A] text-zinc-200 font-sans p-6 sm:p-10 overflow-y-auto">
      {/* Background Starfield Canvas */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <FloatingLines
          enabledWaves={['top', 'middle', 'bottom']}
          lineCount={[6, 10, 14]}
          lineDistance={[8, 6, 4]}
          linesGradient={['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa']}
          bendRadius={5}
          bendStrength={-0.3}
          animationSpeed={0.4}
          mixBlendMode="screen"
        />
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header */}
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Terminal</span>
            </a>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold text-lg font-mono">⚡ ZARAKI AI</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400 text-xs font-mono uppercase">Terms of Service</span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">Effective: October 2026</span>
        </header>

        {/* Hero */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-cyan-400 border border-cyan-500/20">
            <Scale className="w-3.5 h-3.5" />
            <span>Operational Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service & Usage Agreement
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Welcome to Zaraki AI. By accessing or using our multi-model intelligence interface, APIs, and associated toolsets, you agree to comply with the terms below.
          </p>
        </div>

        {/* Content Sections */}
        <div className="grid gap-6">
          <section className="p-6 rounded-2xl bg-zinc-950/60 border border-blue-500/20 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2.5 text-white font-semibold text-base">
              <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h2>1. Acceptance of Terms</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              By using Zaraki AI, you certify that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree, you must discontinue use immediately.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-zinc-950/60 border border-blue-500/20 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2.5 text-white font-semibold text-base">
              <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
                <Terminal className="w-4 h-4" />
              </div>
              <h2>2. Description of Services & Bring-Your-Own-Key (BYOK)</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Zaraki AI provides multi-model AI orchestration, prompt synthesis, vector RAG retrieval, and developer toolkits. You may connect third-party provider keys (OpenAI, Anthropic, Gemini, Groq, Mistral, Ollama). You are solely responsible for compliance with provider quotas, usage fees, and acceptable use policies.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-zinc-950/60 border border-blue-500/20 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2.5 text-white font-semibold text-base">
              <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2>3. Acceptable Use Policy</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              You agree not to use Zaraki AI for:
            </p>
            <ul className="text-xs sm:text-sm text-zinc-400 space-y-1.5 list-disc pl-5">
              <li>Generating malicious software, automated exploits, or unauthorized intrusion scripts.</li>
              <li>Circumventing safety boundaries or terms imposed by foundational LLM providers.</li>
              <li>Conducting automated denial-of-service attempts or overloading the routing grid.</li>
              <li>Infringing intellectual property or distributing defamatory or prohibited content.</li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-zinc-950/60 border border-blue-500/20 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2.5 text-white font-semibold text-base">
              <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2>4. Intellectual Property & Synthesis Ownership</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              All outputs, conversation logs, and generated artifacts created through your account are your property. Zaraki AI claims no intellectual property rights over code or text generated by your queries.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-zinc-950/60 border border-blue-500/20 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2.5 text-white font-semibold text-base">
              <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
                <Scale className="w-4 h-4" />
              </div>
              <h2>5. Limitation of Liability</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Zaraki AI is provided "as is" without warranty of any kind. AI models may hallucinate or generate inaccurate outputs; you are advised to verify all critical code and technical recommendations before deployment to production environments.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="pt-8 pb-12 text-center text-xs text-zinc-500 border-t border-zinc-800">
          <p>© 2026 Zaraki AI. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
