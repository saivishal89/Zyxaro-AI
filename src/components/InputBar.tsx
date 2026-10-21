import { useState, useRef, useEffect } from 'react';
import { Plus, Mic, Send, X, FileText, Image as ImageIcon, Camera, File, FileSpreadsheet, LayoutTemplate, HardDrive, Download, Sparkles, BookOpen } from 'lucide-react';
import { exportGlobalData } from '@/lib/export';
import { useZyxaro } from '@/lib/context';
import { extractTextFromFile, chunkText, scanFileInBackground } from '@/lib/ragEngine';
import { RAGDocument } from '@/lib/types';

interface AttachedFile {
  name: string;
  content: string; // base64 or text
  type: string;
  ragIndexed?: boolean;
}

interface InputBarProps {
  onSend: (text: string, files: AttachedFile[]) => void;
  disabled?: boolean;
  isGenerating?: boolean;
}

export function InputBar({ onSend, disabled }: InputBarProps) {
  const [text, setText] = useState('');
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [indexingNotification, setIndexingNotification] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { sessions, notes, addRagDocument } = useZyxaro();

  // Resize textarea automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const notifyIndexing = (msg: string) => {
    setIndexingNotification(msg);
    setTimeout(() => setIndexingNotification(null), 4000);
  };

  const processFileForRag = (file: File) => {
    // Add file chip immediately for instant UX
    setFiles(prev => [...prev, {
      name: file.name,
      content: `[Attached File: ${file.name}]`,
      type: file.type || 'file',
      ragIndexed: true
    }]);

    // Dispatch non-blocking background scanner
    scanFileInBackground(file, addRagDocument, (statusMsg) => {
      notifyIndexing(statusMsg);
    });
  };

  const handleSend = () => {
    if ((text.trim() || files.length > 0) && !disabled) {
      onSend(text, files);
      setText('');
      setFiles([]);
      setPopupOpen(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(file => {
      processFileForRag(file);
    });
    setPopupOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    // If user pastes a large document/text block (>400 chars), auto index into RAG
    if (pasted && pasted.length > 400) {
      const title = `Pasted Document (${new Date().toLocaleTimeString()})`;
      const chunks = chunkText(pasted);
      const doc: RAGDocument = {
        id: `rag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: title,
        content: pasted,
        chunks,
        addedAt: Date.now(),
        sizeBytes: new Blob([pasted]).size
      };
      addRagDocument(doc);
      notifyIndexing(`⚡ Pasted Text Auto-Indexed into RAG (${chunks.length} chunks)`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    droppedFiles.forEach(file => processFileForRag(file));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input requires Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };
    
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto mb-6 px-4"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Indexing notification banner */}
      {indexingNotification && (
        <div className="mb-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <BookOpen className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>{indexingNotification}</span>
        </div>
      )}

      {/* File chips */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-medium">
              <File className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[150px]">{f.name}</span>
              {f.ragIndexed && (
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded font-bold">RAG</span>
              )}
              <button onClick={() => removeFile(i)} className="hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Popup Menu */}
      {isPopupOpen && (
        <div className="absolute bottom-full left-4 mb-3 bg-[#03081A]/85 border border-white/15 rounded-2xl p-3 shadow-2xl backdrop-blur-2xl z-20 w-[300px]">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => { fileInputRef.current!.accept = "*/*"; fileInputRef.current?.click(); }} className="flex flex-col items-center gap-1.5 p-2 hover:bg-white/10 rounded-xl text-xs text-foreground/80 hover:text-white transition-colors">
              <File className="w-5 h-5 text-blue-400" /> Any File
            </button>
            <button onClick={() => { fileInputRef.current!.accept = "image/*"; fileInputRef.current?.click(); }} className="flex flex-col items-center gap-1.5 p-2 hover:bg-white/10 rounded-xl text-xs text-foreground/80 hover:text-white transition-colors">
              <ImageIcon className="w-5 h-5 text-emerald-400" /> Image
            </button>
            <button onClick={() => { fileInputRef.current!.accept = "image/*"; fileInputRef.current!.capture = "environment"; fileInputRef.current?.click(); }} className="flex flex-col items-center gap-1.5 p-2 hover:bg-white/10 rounded-xl text-xs text-foreground/80 hover:text-white transition-colors">
              <Camera className="w-5 h-5 text-pink-400" /> Camera
            </button>
            <button onClick={() => { fileInputRef.current!.accept = ".pdf"; fileInputRef.current?.click(); }} className="flex flex-col items-center gap-1.5 p-2 hover:bg-white/10 rounded-xl text-xs text-foreground/80 hover:text-white transition-colors">
              <FileText className="w-5 h-5 text-rose-400" /> PDF Document
            </button>
            <button onClick={() => { fileInputRef.current!.accept = ".doc,.docx,.txt,.md"; fileInputRef.current?.click(); }} className="flex flex-col items-center gap-1.5 p-2 hover:bg-white/10 rounded-xl text-xs text-foreground/80 hover:text-white transition-colors">
              <FileText className="w-5 h-5 text-cyan-400" /> Word/Text
            </button>
            <button onClick={() => { fileInputRef.current!.accept = ".xls,.xlsx,.csv"; fileInputRef.current?.click(); }} className="flex flex-col items-center gap-1.5 p-2 hover:bg-white/10 rounded-xl text-xs text-foreground/80 hover:text-white transition-colors">
              <FileSpreadsheet className="w-5 h-5 text-green-400" /> Excel/CSV
            </button>
            <button onClick={() => { fileInputRef.current!.accept = ".ppt,.pptx"; fileInputRef.current?.click(); }} className="flex flex-col items-center gap-1.5 p-2 hover:bg-white/10 rounded-xl text-xs text-foreground/80 hover:text-white transition-colors">
              <LayoutTemplate className="w-5 h-5 text-amber-400" /> PPT
            </button>
            <button onClick={() => { fileInputRef.current!.accept = "*/*"; fileInputRef.current?.click(); }} className="flex flex-col items-center gap-1.5 p-2 hover:bg-white/10 rounded-xl text-xs text-foreground/80 hover:text-white transition-colors">
              <HardDrive className="w-5 h-5 text-indigo-400" /> Drive
            </button>
            <button onClick={() => { exportGlobalData(sessions, notes); setPopupOpen(false); }} className="flex flex-col items-center gap-1.5 p-2 hover:bg-white/10 rounded-xl text-xs text-foreground/80 hover:text-white transition-colors">
              <Download className="w-5 h-5 text-yellow-400" /> Export
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload} 
            multiple
          />
        </div>
      )}

      {/* Main Input Container */}
      <div className={`flex items-end gap-2 bg-white/[0.02] border rounded-2xl p-2.5 backdrop-blur-md shadow-2xl transition-all ${
        isDragOver ? 'border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-400/50' : 'border-white/20 hover:border-white/35 focus-within:border-blue-400/60 focus-within:bg-white/[0.05] focus-within:ring-1 focus-within:ring-blue-400/40'
      }`}>
        <button 
          onClick={() => setPopupOpen(!isPopupOpen)}
          className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${isPopupOpen ? 'bg-white/20 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
          title="Attach PDF, Document, or File for RAG Grounding"
        >
          <Plus className="w-5 h-5" />
        </button>
        
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask ZYXARO anything... (Upload or paste PDFs/docs for RAG context)"
          className="flex-1 max-h-[200px] min-h-[42px] bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-white placeholder:text-slate-400/70 py-2.5 custom-scrollbar text-sm font-sans"
          rows={1}
          disabled={disabled}
        />
        
        <button 
          onClick={toggleMic}
          className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${isListening ? 'text-rose-400 bg-rose-500/20 animate-pulse border border-rose-500/30' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
          title="Voice input"
        >
          <Mic className="w-5 h-5" />
        </button>
        
        <button 
          onClick={handleSend}
          disabled={disabled || (!text.trim() && files.length === 0)}
          className="p-2.5 rounded-xl flex-shrink-0 bg-blue-600/70 hover:bg-blue-500/90 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

