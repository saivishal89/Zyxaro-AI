import { useState, useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import { parseMarkdown, getCodeFromBlock, getLangFromBlock } from '@/lib/markdown';
import { sanitizeModelOutput } from '@/lib/ragEngine';
import { Copy, Share, Volume2, ThumbsUp, ThumbsDown, RotateCcw, StickyNote, FileText, Presentation, FileDown, Code2, Play } from 'lucide-react';
import { useZyxaro } from '@/lib/context';
import { exportToDoc, exportToPpt } from '@/lib/export';
import { CodePreview } from './CodePreview';
import { CodePreviewPanel } from './CodePreviewPanel';

interface MessageBubbleProps {
  message: Message;
  onRetry?: () => void;
  onLike?: (id: string, state: boolean) => void;
  onDislike?: (id: string, state: boolean) => void;
}

function extractRunnableCode(content: string): { code: string; language: string } | null {
  const match = content.match(/```(html|jsx|tsx|react|js|css)\n([\s\S]*?)```/i);
  if (match && match[2].trim().length > 15) {
    return { language: match[1].toLowerCase(), code: match[2].trim() };
  }
  return null;
}

export function MessageBubble({ message, onRetry, onLike, onDislike }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const { notes, setNotes } = useZyxaro();
  const contentRef = useRef<HTMLDivElement>(null);
  const [previewCode, setPreviewCode] = useState<{ code: string; language: string } | null>(null);

  const runnableCode = !isUser ? extractRunnableCode(message.content) : null;
  const [showLivePreview, setShowLivePreview] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'ZYXARO AI Output', text: message.content });
    } else {
      handleCopy();
    }
  };

  const handleReadAloud = () => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      } else {
        // basic markdown stripping for tts
        const plainText = message.content.replace(/[#*`_]/g, '');
        const utterance = new SpeechSynthesisUtterance(plainText);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleSaveNote = () => {
    const title = message.content.substring(0, 45).replace(/[#*`_]/g, '') + '...';
    setNotes([{
      id: `note_${Date.now()}`,
      title,
      content: message.content,
      savedAt: Date.now()
    }, ...notes]);
  };

  // Attach click handlers to code block copy & preview buttons
  useEffect(() => {
    if (isUser || !contentRef.current) return;

    const container = contentRef.current;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Find the closest button
      const copyBtn = target.closest('.code-copy-btn') as HTMLElement | null;
      const previewBtn = target.closest('.code-preview-btn') as HTMLElement | null;

      if (copyBtn) {
        const blockId = copyBtn.getAttribute('data-code-id');
        if (blockId) {
          const code = getCodeFromBlock(blockId);
          if (code) {
            navigator.clipboard.writeText(code);
            // Visual feedback
            const span = copyBtn.querySelector('span');
            if (span) {
              const original = span.textContent;
              span.textContent = 'Copied!';
              copyBtn.classList.add('code-btn-success');
              setTimeout(() => {
                span.textContent = original;
                copyBtn.classList.remove('code-btn-success');
              }, 2000);
            }
          }
        }
      }

      if (previewBtn) {
        const blockId = previewBtn.getAttribute('data-code-id');
        if (blockId) {
          const code = getCodeFromBlock(blockId);
          const lang = getLangFromBlock(blockId);
          if (code && lang) {
            setPreviewCode({ code, language: lang });
          }
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [isUser, message.content]);

  if (isUser) {
    let displayContent = message.content
      .replace(/^\[(?:Automatic Web Content Retrieved from|MCP Live Ground-Truth Context from) [^\]]+\][\s\S]*?\[End of (?:Web|Live) Content\]\n\n/, '')
      .replace(/^\[RAG KNOWLEDGE CONTEXT ACTIVATED\][\s\S]*?\[USER INSTRUCTION\]:?\s*/i, '')
      .replace(/^\[INTERNAL (?:RETRIEVAL|GROUNDING)[^\]]*\][\s\S]*?\[(?:GROUNDING RULES|STRICT INSTRUCTION)\]:[^\n]*\n*/i, '');

    return (
      <div className="flex flex-col items-end mb-6 w-full group">
        {message.ragSources && message.ragSources.length > 0 && (
          <div className="mb-1.5 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full">
            <span className="font-bold">📚 RAG Context:</span>
            <span>{message.ragSources.join(', ')}</span>
          </div>
        )}
        <div className="max-w-[80%] bg-primary/20 border border-primary/30 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-[0_4px_20px_rgba(96,165,250,0.1)]">
          {message.isImage && <div className="text-xs text-primary/70 font-mono mb-1">/image generated</div>}
          <div className="whitespace-pre-wrap">{displayContent}</div>
        </div>
      </div>
    );
  }

  // AI Message
  if (!message.isImage && (!message.content || message.content.trim() === '')) {
    return null;
  }

  const cleanContent = sanitizeModelOutput(message.content);

  return (
    <>
      <div className="flex justify-start mb-8 w-full group">
        <div className="max-w-[85%] bg-[#0A1024]/80 backdrop-blur-md border border-white/10 hover:border-primary/30 transition-colors rounded-2xl rounded-tl-sm px-6 py-4 shadow-xl">
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-3 border-b border-white/5 pb-2">
            {message.provider && (
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-white/10 text-foreground uppercase border border-white/10">
                {message.provider}
              </span>
            )}
            {message.topic && (
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-secondary/20 text-secondary uppercase border border-secondary/30">
                {message.topic}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto font-mono">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Content */}
          {message.isImage ? (
            <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
              <img src={message.content} alt="Generated by AI" className="w-full h-auto object-contain" />
            </div>
          ) : (
            <div className="space-y-3">
              <div 
                ref={contentRef}
                className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(cleanContent) }}
              />

              {/* Clean Citations/References - No raw chunks exposed */}
              {message.ragSources && message.ragSources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Sources:
                  </span>
                  {message.ragSources.map((src, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">
                      {src}
                    </span>
                  ))}
                </div>
              )}

              {runnableCode && (
                <CodePreviewPanel code={runnableCode.code} language={runnableCode.language} />
              )}
            </div>
          )}


          {/* Action Bar (Hover revealed) */}
          <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ActionButton icon={<Copy className="w-3.5 h-3.5" />} label="Copy" onClick={handleCopy} />
              <ActionButton icon={<Share className="w-3.5 h-3.5" />} label="Share" onClick={handleShare} />
              <ActionButton icon={<Volume2 className="w-3.5 h-3.5" />} label="Read Aloud" onClick={handleReadAloud} />
              
              <div className="h-4 w-[1px] bg-white/10 mx-1" />
              
              <ActionButton 
                icon={<ThumbsUp className="w-3.5 h-3.5" />} 
                active={message.liked}
                activeColor="text-green-400 bg-green-400/10"
                onClick={() => onLike?.(message.id, !message.liked)} 
              />
              <ActionButton 
                icon={<ThumbsDown className="w-3.5 h-3.5" />} 
                active={message.disliked}
                activeColor="text-red-400 bg-red-400/10"
                onClick={() => onDislike?.(message.id, !message.disliked)} 
              />
              
              <div className="h-4 w-[1px] bg-white/10 mx-1" />
              
              <ActionButton icon={<RotateCcw className="w-3.5 h-3.5" />} label="Retry" onClick={onRetry} />
              <ActionButton icon={<StickyNote className="w-3.5 h-3.5" />} label="Note" onClick={handleSaveNote} />
              
              <div className="flex-1" />
              
              <ActionButton icon={<Presentation className="w-3.5 h-3.5 text-orange-300" />} label="PPT" onClick={() => exportToPpt(message.content)} />
              <ActionButton icon={<FileText className="w-3.5 h-3.5 text-blue-300" />} label="DOC" onClick={() => exportToDoc(message.content)} />
              <ActionButton icon={<FileDown className="w-3.5 h-3.5 text-red-300" />} label="PDF" onClick={() => window.print()} />
            </div>
        </div>
      </div>

      {/* Code Preview Modal */}
      {previewCode && (
        <CodePreview
          code={previewCode.code}
          language={previewCode.language}
          onClose={() => setPreviewCode(null)}
        />
      )}
    </>
  );
}

function ActionButton({ icon, label, onClick, active, activeColor }: { icon: React.ReactNode, label?: string, onClick?: () => void, active?: boolean, activeColor?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-all ${
        active && activeColor 
          ? activeColor 
          : 'text-muted-foreground hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}
