
import { useState } from 'react';
import { Message } from '@/lib/types';
import { X, GitCompare, ArrowRightLeft, Sparkles } from 'lucide-react';
import { PROVIDERS } from '@/lib/providers';

interface OutputDiffModalProps {
  msgA: Message;
  msgB: Message;
  isBlindMode?: boolean;
  onClose: () => void;
}

interface DiffLine {
  type: 'same' | 'added' | 'removed';
  contentA?: string;
  contentB?: string;
  lineNumA?: number;
  lineNumB?: number;
}

function getProviderName(providerId?: string, fallback: string = 'Model'): string {
  if (!providerId) return fallback;
  const p = PROVIDERS.find(x => x.id === providerId);
  return p ? p.name : providerId.toUpperCase();
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  words1.forEach(w => {
    if (words2.has(w)) intersection++;
  });

  const union = new Set([...words1, ...words2]).size;
  return union === 0 ? 0 : Math.round((intersection / union) * 100);
}

function generateDiffLines(textA: string, textB: string): DiffLine[] {
  const linesA = textA.split('\n');
  const linesB = textB.split('\n');
  const maxLines = Math.max(linesA.length, linesB.length);
  const diffs: DiffLine[] = [];

  let lineAIndex = 1;
  let lineBIndex = 1;

  for (let i = 0; i < maxLines; i++) {
    const a = linesA[i];
    const b = linesB[i];

    if (a === b && a !== undefined) {
      diffs.push({ type: 'same', contentA: a, contentB: b, lineNumA: lineAIndex++, lineNumB: lineBIndex++ });
    } else {
      if (a !== undefined) {
        diffs.push({ type: 'removed', contentA: a, lineNumA: lineAIndex++ });
      }
      if (b !== undefined) {
        diffs.push({ type: 'added', contentB: b, lineNumB: lineBIndex++ });
      }
    }
  }

  return diffs;
}

export function OutputDiffModal({ msgA, msgB, isBlindMode, onClose }: OutputDiffModalProps) {
  const [viewMode, setViewMode] = useState<'sideBySide' | 'inline'>('sideBySide');

  const labelA = isBlindMode ? 'Model Alpha' : getProviderName(msgA.provider, 'Model A');
  const labelB = isBlindMode ? 'Model Beta' : getProviderName(msgB.provider, 'Model B');

  const similarityScore = calculateSimilarity(msgA.content, msgB.content);
  const diffLines = generateDiffLines(msgA.content, msgB.content);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0A1024] border border-blue-500/30 rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display tracking-wider text-white flex items-center gap-2">
                RESPONSE DIFF INSPECTOR
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                  {similarityScore}% Match
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Comparing <span className="text-blue-400 font-semibold">{labelA}</span> vs <span className="text-purple-400 font-semibold">{labelB}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'sideBySide' ? 'inline' : 'sideBySide')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition-all border border-white/10"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{viewMode === 'sideBySide' ? 'Side-by-Side' : 'Inline Unified'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar font-mono text-xs leading-relaxed">
          {viewMode === 'sideBySide' ? (
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Column A */}
              <div className="bg-[#03081A] border border-white/10 rounded-xl p-4 overflow-y-auto">
                <div className="sticky top-0 bg-[#03081A]/90 backdrop-blur pb-2 mb-2 border-b border-white/10 font-bold text-blue-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{labelA}</span>
                  <span className="text-[10px] text-muted-foreground">{msgA.content.length} chars</span>
                </div>
                <div className="space-y-1">
                  {msgA.content.split('\n').map((line, idx) => (
                    <div key={idx} className="flex gap-2 hover:bg-white/5 px-1 py-0.5 rounded">
                      <span className="text-slate-600 select-none w-6 text-right font-mono">{idx + 1}</span>
                      <span className="text-slate-200 whitespace-pre-wrap flex-1">{line}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column B */}
              <div className="bg-[#03081A] border border-white/10 rounded-xl p-4 overflow-y-auto">
                <div className="sticky top-0 bg-[#03081A]/90 backdrop-blur pb-2 mb-2 border-b border-white/10 font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{labelB}</span>
                  <span className="text-[10px] text-muted-foreground">{msgB.content.length} chars</span>
                </div>
                <div className="space-y-1">
                  {msgB.content.split('\n').map((line, idx) => (
                    <div key={idx} className="flex gap-2 hover:bg-white/5 px-1 py-0.5 rounded">
                      <span className="text-slate-600 select-none w-6 text-right font-mono">{idx + 1}</span>
                      <span className="text-slate-200 whitespace-pre-wrap flex-1">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#03081A] border border-white/10 rounded-xl p-4 space-y-1">
              {diffLines.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 px-2 py-1 rounded font-mono ${line.type === 'added'
                      ? 'bg-green-500/10 text-green-300 border-l-2 border-green-500'
                      : line.type === 'removed'
                        ? 'bg-red-500/10 text-red-300 border-l-2 border-red-500'
                        : 'text-slate-300'
                    }`}
                >
                  <span className="text-slate-600 w-8 select-none">
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                  </span>
                  <span className="whitespace-pre-wrap flex-1">
                    {line.type === 'added' ? line.contentB : line.contentA}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Line-by-line diff generated automatically</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
