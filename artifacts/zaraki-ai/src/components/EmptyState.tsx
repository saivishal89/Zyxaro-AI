import React from 'react'
import { MessageSquare, FileText, Clock, Sparkles, FolderPlus } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  id?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  id = 'empty-state-container',
}: EmptyStateProps) {
  return (
    <div
      id={id}
      className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto rounded-2xl border border-blue-500/10 bg-gradient-to-b from-blue-950/20 to-transparent backdrop-blur-sm"
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
        {icon || <Sparkles className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-1">{title}</h3>
      <p className="text-sm text-zinc-400 mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl text-xs font-mono font-medium tracking-wide uppercase bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:brightness-110 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function EmptyChatState({ onNewChat }: { onNewChat?: () => void }) {
  return (
    <EmptyState
      id="empty-chat-state"
      icon={<MessageSquare className="w-7 h-7" />}
      title="No conversation selected"
      description="Start a new multi-model intelligence thread or select one from the history sidebar."
      actionLabel={onNewChat ? 'Start New Chat' : undefined}
      onAction={onNewChat}
    />
  )
}

export function EmptyNotesState({ onNewNote }: { onNewNote?: () => void }) {
  return (
    <EmptyState
      id="empty-notes-state"
      icon={<FileText className="w-7 h-7" />}
      title="Scratchpad is empty"
      description="Capture thoughts, synthesized code, and research snippets as you chat."
      actionLabel={onNewNote ? 'Create First Note' : undefined}
      onAction={onNewNote}
    />
  )
}

export function EmptySessionsState({ onNewSession }: { onNewSession?: () => void }) {
  return (
    <EmptyState
      id="empty-sessions-state"
      icon={<Clock className="w-7 h-7" />}
      title="No prior sessions recorded"
      description="All conversations and queries are encrypted and stored in your profile."
      actionLabel={onNewSession ? 'New Session' : undefined}
      onAction={onNewSession}
    />
  )
}
