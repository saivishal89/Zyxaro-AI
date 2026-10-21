import { useState } from 'react';
import { useZyxaro } from '@/lib/context';
import { MessageSquare, StickyNote, X, Plus, Pin, Search, Edit3, Image, BookOpen, Folder, Trash2, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Sidebar() {
  const { 
    sessions, setSessions, 
    activeSessionId, setActiveSessionId,
    notes, setNotes,
    togglePinSession, renameSession
  } = useZyxaro();
  
  const [tab, setTab] = useState<'recents' | 'pinned' | 'notes' | 'projects'>('recents');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const createSession = () => {
    const id = `sess_${Date.now()}`;
    const newSession = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(id);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      renameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    togglePinSession(id);
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(notes.filter(n => n.id !== id));
  };

  // Search Filter
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedSessions = filteredSessions.filter(s => s.pinned);
  const recentSessions = filteredSessions.filter(s => !s.pinned);

  return (
    <div className="w-[280px] h-full flex flex-col bg-transparent border-r border-white/10 backdrop-blur-sm flex-shrink-0 text-slate-200 select-none">
      {/* Top New Chat Button */}
      <div className="p-3 border-b border-white/10 space-y-2">
        <button
          onClick={createSession}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/70 to-indigo-600/70 hover:from-blue-600/90 hover:to-indigo-600/90 text-white font-semibold text-xs shadow-lg shadow-blue-500/15 border border-blue-400/30 backdrop-blur-md transition-all active:scale-95"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </div>
          <span className="text-[10px] text-blue-200 font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/10">⌘N</span>
        </button>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] backdrop-blur-md transition-all font-sans shadow-inner"
          />
        </div>
      </div>

      {/* Navigation Categories */}
      <div className="px-2 py-2 border-b border-white/10 flex flex-wrap gap-1 text-[11px] font-semibold text-slate-400">
        <button
          onClick={() => setTab('recents')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all border ${
            tab === 'recents' ? 'bg-blue-500/20 text-blue-300 border-blue-400/40 backdrop-blur-md shadow-sm' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/15 text-slate-400 hover:text-slate-200 backdrop-blur-sm'
          }`}
        >
          <MessageSquare className="w-3 h-3" />
          <span>Recents</span>
        </button>

        <button
          onClick={() => setTab('pinned')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all border ${
            tab === 'pinned' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 backdrop-blur-md shadow-sm' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/15 text-slate-400 hover:text-slate-200 backdrop-blur-sm'
          }`}
        >
          <Pin className="w-3 h-3" />
          <span>Pinned ({sessions.filter(s => s.pinned).length})</span>
        </button>

        <button
          onClick={() => setTab('notes')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all border ${
            tab === 'notes' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 backdrop-blur-md shadow-sm' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/15 text-slate-400 hover:text-slate-200 backdrop-blur-sm'
          }`}
        >
          <StickyNote className="w-3 h-3" />
          <span>Library</span>
        </button>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {tab === 'notes' ? (
          <>
            {notes.length === 0 ? (
              <div className="text-center text-slate-500 text-xs mt-8">
                <StickyNote className="w-6 h-6 mx-auto mb-2 opacity-40" />
                No saved notes in library.
              </div>
            ) : (
              notes.map(n => (
                <div key={n.id} className="group relative p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.08] backdrop-blur-md transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-200 truncate pr-4">{n.title}</span>
                    <button onClick={e => deleteNote(n.id, e)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 font-mono">{n.content}</p>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedSessions.length > 0 && (
              <div className="mb-3 space-y-1.5">
                <div className="px-2 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Pin className="w-3 h-3" />
                  <span>Pinned Chats</span>
                </div>
                {pinnedSessions.map(s => renderSessionItem(s))}
              </div>
            )}

            {/* Recents Section */}
            {recentSessions.length === 0 && pinnedSessions.length === 0 ? (
              <div className="text-center text-slate-500 text-xs mt-10">
                <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-40" />
                No chat history yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {pinnedSessions.length > 0 && recentSessions.length > 0 && (
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Recent Conversations
                  </div>
                )}
                {recentSessions.map(s => renderSessionItem(s))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  function renderSessionItem(s: any) {
    const isActive = activeSessionId === s.id;
    const isEditing = editingId === s.id;

    return (
      <div
        key={s.id}
        onClick={() => setActiveSessionId(s.id)}
        className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border backdrop-blur-md ${
          isActive
            ? 'bg-blue-500/20 border-blue-400/50 text-white shadow-lg shadow-blue-500/15 ring-1 ring-blue-500/30'
            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-slate-300 shadow-sm hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />

          {isEditing ? (
            <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full bg-black/60 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                autoFocus
              />
              <button onClick={e => handleSaveRename(s.id, e)} className="text-emerald-400 hover:text-emerald-300">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold truncate">{s.title || 'New Chat'}</span>
              <span className="text-[10px] text-slate-500">
                {formatDistanceToNow(s.createdAt, { addSuffix: true })}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => handleTogglePin(s.id, e)}
              className={`p-1 rounded hover:bg-white/10 transition-colors ${s.pinned ? 'text-amber-400' : 'text-slate-400'}`}
              title={s.pinned ? 'Unpin Chat' : 'Pin Chat'}
            >
              <Pin className="w-3 h-3" />
            </button>
            <button
              onClick={e => handleStartRename(s.id, s.title, e)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Rename Chat"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={e => deleteSession(s.id, e)}
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
              title="Delete Chat"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  }
}
