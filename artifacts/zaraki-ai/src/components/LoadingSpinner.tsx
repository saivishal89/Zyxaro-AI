import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

export function LoadingSpinner({ size = 'md', className = '', label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-blue-500/20 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_12px_rgba(34,211,238,0.4)]`}
        role="status"
        aria-label="Loading"
      />
      {label && <span className="text-xs font-mono text-zinc-400 animate-pulse">{label}</span>}
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6 animate-pulse" id="chat-loading-skeleton">
      <div className="flex gap-4 items-start">
        <div className="w-9 h-9 rounded-xl bg-blue-900/30 border border-blue-500/20 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-blue-950/40 rounded w-1/4" />
          <div className="h-16 bg-blue-950/30 rounded-xl w-3/4 border border-blue-900/20" />
        </div>
      </div>
      <div className="flex gap-4 items-start flex-row-reverse">
        <div className="w-9 h-9 rounded-xl bg-purple-900/30 border border-purple-500/20 shrink-0" />
        <div className="flex-1 space-y-2 flex flex-col items-end">
          <div className="h-4 bg-purple-950/40 rounded w-1/4" />
          <div className="h-20 bg-purple-950/30 rounded-xl w-2/3 border border-purple-900/20" />
        </div>
      </div>
      <div className="flex gap-4 items-start">
        <div className="w-9 h-9 rounded-xl bg-blue-900/30 border border-blue-500/20 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-blue-950/40 rounded w-1/5" />
          <div className="h-28 bg-blue-950/30 rounded-xl w-5/6 border border-blue-900/20" />
        </div>
      </div>
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="w-full p-3 space-y-3 animate-pulse" id="sidebar-loading-skeleton">
      <div className="h-9 bg-blue-950/40 rounded-lg w-full border border-blue-900/20" />
      <div className="space-y-2 pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 bg-zinc-900/50 rounded-lg w-full border border-zinc-800/40" />
        ))}
      </div>
    </div>
  )
}
