import React from 'react'
import { Shield, ArrowLeft, Lock, Database, Eye, RefreshCw, Mail } from 'lucide-react'
import { FloatingLines } from '@/components/FloatingLines'

export default function PrivacyPolicy() {
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
              <span className="text-zinc-400 text-xs font-mono uppercase">Privacy Policy</span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">Effective: October 2026</span>
        </header>

        {/* Hero */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-cyan-400 border border-cyan-500/20">
            <Shield className="w-3.5 h-3.5" />
            <span>Zero-Retention Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy & Data Security Charter
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Zaraki AI is engineered around privacy-first principles. We believe your research queries, model syntheses, and proprietary datasets belong entirely to you.
          </p>
        </div>

        {/* Content Sections */}
        <div className="grid gap-6">
          <section className="p-6 rounded-2xl bg-zinc-950/60 border border-blue-500/20 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2.5 text-white font-semibold text-base">
              <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
                <Database className="w-4 h-4" />
              </div>
              <h2>1. Information We Collect</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              We collect minimal information necessary to deliver multi-model AI synthesis:
            </p>
            <ul className="text-xs sm:text-sm text-zinc-400 space-y-1.5 list-disc pl-5">
              <li><strong className="text-zinc-200">Account Credentials:</strong> Email address and authentication tokens via Supabase Auth when you sign in or register.</li>
              <li><strong className="text-zinc-200">User Settings:</strong> Custom API keys provided by you are stored securely in your local browser storage (<code className="text-cyan-400">localStorage</code>) and are never transmitted to our telemetry servers.</li>
              <li><strong className="text-zinc-200">Conversation Data:</strong> When authenticated, conversations and messages are persisted in your dedicated PostgreSQL database isolated by Row Level Security (RLS).</li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-zinc-950/60 border border-blue-500/20 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2.5 text-white font-semibold text-base">
              <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
                <Lock className="w-4 h-4" />
              </div>
              <h2>2. How We Protect Your Data (Row Level Security)</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Every database record is locked by PostgreSQL Row Level Security (RLS) policies. Only your authenticated user session (<code className="text-cyan-400">auth.uid() = user_id</code>) has access to read, update, or delete your intelligence logs. No other user or unauthorized process can access your transcripts.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-zinc-950/60 border border-blue-500/20 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2.5 text-white font-semibold text-base">
              <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
                <Eye className="w-4 h-4" />
              </div>
              <h2>3. AI Model Providers & Third Parties</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              When executing prompts through multi-model orchestration, your prompt is routed through the selected provider endpoints (e.g. OpenAI, Anthropic, Google Gemini, Groq, Mistral, or custom OpenRouter endpoints). Prompt processing by upstream providers is governed by their respective API data policies. We do not use your inputs to train public foundational models.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-zinc-950/60 border border-blue-500/20 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2.5 text-white font-semibold text-base">
              <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h2>4. Data Custody, Export, and Right to Deletion</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Under GDPR, CCPA, and global privacy standards, you maintain absolute sovereignty over your records:
            </p>
            <ul className="text-xs sm:text-sm text-zinc-400 space-y-1.5 list-disc pl-5">
              <li><strong className="text-zinc-200">Data Export:</strong> Download all conversations and notes in JSON format at any time from your Account Settings.</li>
              <li><strong className="text-zinc-200">Account Deletion:</strong> Permanently purge your account and all associated tables with one click in the Danger Zone settings.</li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-zinc-950/60 border border-blue-500/20 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2.5 text-white font-semibold text-base">
              <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
                <Mail className="w-4 h-4" />
              </div>
              <h2>5. Contact & Privacy Inquiries</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              If you have any questions or data protection requests regarding Zaraki AI, please submit an issue on our GitHub repository or contact our security officer at <a href="mailto:privacy@zaraki.ai" className="text-cyan-400 hover:underline">privacy@zaraki.ai</a>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="pt-8 pb-12 text-center text-xs text-zinc-500 border-t border-zinc-800">
          <p>© 2026 Zaraki AI. Multi-Model Intelligence System. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
