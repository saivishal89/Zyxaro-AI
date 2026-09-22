import { useState, useRef } from 'react';
import { useZyxaro } from '@/lib/context';
import { chunkText, extractTextFromFile } from '@/lib/ragEngine';
import { RAGDocument } from '@/lib/types';
import { X, BookOpen, Upload, Trash2, CheckCircle, Database, FileText, Plus, FileCode } from 'lucide-react';

export function RagDrawer() {
  const { ragDocs, addRagDocument, deleteRagDocument, isRagEnabled, setIsRagEnabled, isRagOpen, setIsRagOpen } = useZyxaro();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);

  if (!isRagOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const content = await extractTextFromFile(file);
        const chunks = chunkText(content);
        const newDoc: RAGDocument = {
          id: `rag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          content,
          chunks,
          addedAt: Date.now(),
          sizeBytes: file.size
        };
        addRagDocument(newDoc);
      } catch (err) {
        console.error(`Failed to process document ${file.name}:`, err);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddPastedText = () => {
    if (!pastedText.trim()) return;
    const title = pastedTitle.trim() || `Pasted Snippet (${new Date().toLocaleTimeString()})`;
    const chunks = chunkText(pastedText);
    const newDoc: RAGDocument = {
      id: `rag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: title,
      content: pastedText,
      chunks,
      addedAt: Date.now(),
      sizeBytes: new Blob([pastedText]).size
    };
    addRagDocument(newDoc);
    setPastedText('');
    setPastedTitle('');
    setShowPasteBox(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A1024] border-l border-white/10 w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display tracking-wider text-white">RAG KNOWLEDGE BASE</h2>
              <p className="text-xs text-muted-foreground">Local document retrieval engine for grounding responses</p>
            </div>
          </div>
          <button
            onClick={() => setIsRagOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-white/10 bg-[#03081A]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">Enable RAG Grounding</span>
          </div>
          <button
            onClick={() => setIsRagEnabled(!isRagEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              isRagEnabled ? 'bg-emerald-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isRagEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Upload & Paste Buttons */}
        <div className="p-4 space-y-3 border-b border-white/10">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,.json,.csv,.js,.ts,.py,.html,.css,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="border border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all group"
            >
              <Upload className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="text-xs font-bold text-white tracking-wider">
                {isUploading ? 'Indexing...' : 'Upload PDF/Docs'}
              </span>
              <span className="text-[10px] text-emerald-300/70 mt-0.5">
                PDF, TXT, MD, CSV, Code
              </span>
            </button>

            <button
              onClick={() => setShowPasteBox(!showPasteBox)}
              className="border border-blue-500/40 hover:border-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all group"
            >
              <FileCode className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="text-xs font-bold text-white tracking-wider">
                Paste Text / Snippet
              </span>
              <span className="text-[10px] text-blue-300/70 mt-0.5">
                Raw text, notes, JSON
              </span>
            </button>
          </div>

          {showPasteBox && (
            <div className="bg-[#03081A] border border-blue-500/30 rounded-xl p-3 space-y-2 animate-in fade-in duration-200">
              <input
                type="text"
                value={pastedTitle}
                onChange={e => setPastedTitle(e.target.value)}
                placeholder="Document Title (e.g., API Specs)"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
              />
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Paste text content or document data here..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-blue-400 custom-scrollbar"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowPasteBox(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPastedText}
                  disabled={!pastedText.trim()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  Index Text into RAG
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Indexed Documents ({ragDocs.length})
          </h3>

          {ragDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs leading-relaxed px-4">
              No knowledge documents added yet.<br />Upload PDFs, text files, or paste documents above to ground AI responses with automatic context.
            </div>
          ) : (
            ragDocs.map(doc => (
              <div
                key={doc.id}
                className="bg-[#03081A] border border-white/10 rounded-xl p-3.5 flex items-center justify-between hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white truncate">{doc.name}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="text-emerald-300 font-mono">{doc.chunks.length} chunks</span>
                      <span>•</span>
                      <span>{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteRagDocument(doc.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-all ml-2"
                  title="Remove document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 text-[11px] text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" /> RAG Semantic Index Active
          </span>
          <span className="font-mono text-white/80">{ragDocs.reduce((acc, d) => acc + d.chunks.length, 0)} Chunks</span>
        </div>

      </div>
    </div>
  );
}

