import { useZyxaro } from '@/lib/context';
import { HelpCircle, X, ChevronDown, ShieldCheck, Zap, Key, Database, FileText } from 'lucide-react';
import { useState } from 'react';

export function FaqModal() {
  const { isFaqOpen, setIsFaqOpen } = useZyxaro();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!isFaqOpen) return null;

  const faqs = [
    {
      q: 'How does ZYXARO AI query 18 AI providers simultaneously?',
      a: 'ZYXARO AI uses a browser-native parallel asynchronous dispatch engine (Promise.all). When you type a prompt, requests are sent directly from your browser to all active provider APIs in parallel.',
      icon: Zap,
    },
    {
      q: 'Is my data and API key private?',
      a: '100% Yes. All API keys, chat sessions, RAG documents, and notes are stored strictly in your browser\'s localStorage. ZYXARO AI has zero backend servers, zero databases, and zero tracking logs.',
      icon: ShieldCheck,
    },
    {
      q: 'What is the sub-500ms response time guarantee?',
      a: 'Because ZYXARO AI connects directly to model endpoints without passing through intermediate middleware servers, latency is minimized to raw provider response times—delivering parallel responses in under 500ms.',
      icon: Zap,
    },
    {
      q: 'How does the local RAG (Retrieval-Augmented Generation) Knowledge Base work?',
      a: 'You can upload TXT, MD, or JSON documents into the RAG drawer. Text is chunked locally in the browser and contextually injected into model prompts for accurate, document-grounded answers.',
      icon: Database,
    },
    {
      q: 'How do I obtain API keys for providers like OpenAI, Anthropic, or Groq?',
      a: 'Click the Config button (top right) to enter your API keys. You can get free or paid API keys directly from OpenAI (platform.openai.com), Anthropic (console.anthropic.com), or Groq (console.groq.com).',
      icon: Key,
    },
    {
      q: 'Can I export research reports to PowerPoint, PDF, or Word?',
      a: 'Yes! ZYXARO AI includes built-in document generation using pptxgenjs. You can export multi-model comparison responses directly to PPTX slides, Markdown, or PDF formatted documents.',
      icon: FileText,
    },
    {
      q: 'Who created and leads ZYXARO AI?',
      a: 'ZYXARO AI is founded and led by CEO Chikoti Sai Vishal as a state-of-the-art local-first research platform designed for maximum AI accessibility, speed, and privacy.',
      icon: HelpCircle,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#070F2B] border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#03081A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-100">Frequently Asked Questions</h2>
              <p className="text-xs text-slate-400">Everything you need to know about ZYXARO AI</p>
            </div>
          </div>
          <button
            onClick={() => setIsFaqOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-3">
          {faqs.map((faq, idx) => {
            const Icon = faq.icon;
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-white/10 rounded-xl bg-white/[0.02] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-slate-200 hover:text-blue-400 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{faq.q}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-300 border-t border-white/5 leading-relaxed bg-blue-950/20">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#03081A] flex items-center justify-between text-xs text-slate-400">
          <span>Need more help? Check the Config panel</span>
          <button
            onClick={() => setIsFaqOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
