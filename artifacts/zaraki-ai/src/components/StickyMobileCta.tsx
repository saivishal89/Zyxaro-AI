import { useZyxaro } from '@/lib/context';
import { Plus, Settings, BookOpen, HelpCircle, Crown } from 'lucide-react';

export function StickyMobileCta() {
  const { 
    setSessions, 
    setActiveSessionId, 
    setConfigOpen, 
    setIsRagOpen, 
    setIsFaqOpen,
    setIsLeadershipOpen
  } = useZyxaro();

  const createNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: 'New Session',
      createdAt: Date.now(),
      messages: [],
    };
    setSessions([newSession]);
    setActiveSessionId(newSession.id);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#03081A]/95 border-t border-white/10 backdrop-blur-lg px-3 py-2 flex items-center justify-around shadow-2xl">
      <button
        onClick={createNewSession}
        className="flex flex-col items-center gap-1 text-slate-300 hover:text-blue-400 text-[10px] font-semibold transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
          <Plus className="w-4 h-4" />
        </div>
        <span>New Chat</span>
      </button>

      <button
        onClick={() => setConfigOpen(true)}
        className="flex flex-col items-center gap-1 text-slate-300 hover:text-blue-400 text-[10px] font-semibold transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
          <Settings className="w-4 h-4" />
        </div>
        <span>Providers</span>
      </button>

      <button
        onClick={() => setIsRagOpen(true)}
        className="flex flex-col items-center gap-1 text-slate-300 hover:text-emerald-400 text-[10px] font-semibold transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <BookOpen className="w-4 h-4" />
        </div>
        <span>RAG Docs</span>
      </button>

      <button
        onClick={() => setIsFaqOpen(true)}
        className="flex flex-col items-center gap-1 text-slate-300 hover:text-purple-400 text-[10px] font-semibold transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
          <HelpCircle className="w-4 h-4" />
        </div>
        <span>FAQ</span>
      </button>

      <button
        onClick={() => setIsLeadershipOpen(true)}
        className="flex flex-col items-center gap-1 text-slate-300 hover:text-yellow-400 text-[10px] font-semibold transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-yellow-600/30 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
          <Crown className="w-4 h-4" />
        </div>
        <span>CEO</span>
      </button>
    </div>
  );
}
