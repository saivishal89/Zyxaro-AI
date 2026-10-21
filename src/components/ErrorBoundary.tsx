import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Zaraki AI] Uncaught runtime error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  private handleClearCache = () => {
    try {
      sessionStorage.clear()
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('zyx_') || key.startsWith('zrk_'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
    } catch {
      // ignore
    }
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="error-boundary-fallback"
          className="min-h-screen bg-[#03081A] text-zinc-200 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.08)_0,transparent_70%)] pointer-events-none" />

          <div className="max-w-xl w-full bg-zinc-950/80 border border-red-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.15)] relative z-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              {this.props.fallbackTitle || 'Neural Interface Exception'}
            </h1>
            <p className="text-sm text-zinc-400 mb-6">
              A critical rendering fault occurred. The Zaraki runtime caught the error safely to prevent session corruption.
            </p>

            {this.state.error && (
              <div className="bg-black/60 border border-red-900/30 rounded-xl p-3 mb-6 text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-300 font-semibold mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] font-mono text-zinc-500 whitespace-pre-wrap leading-tight">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-mono font-medium tracking-wide bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:brightness-110 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Application
              </button>

              <button
                onClick={this.handleClearCache}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-medium tracking-wide bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                Clear Cache & Restart
              </button>

              <a
                href="/"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-medium tracking-wide bg-transparent border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
