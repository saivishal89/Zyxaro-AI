import React, { useState } from 'react'
import { Mail, AlertCircle, X, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { LoadingSpinner } from './LoadingSpinner'

export function EmailVerificationBanner() {
  const { user, isEmailVerified, resendVerificationEmail } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Don't show if user is not logged in, or is already verified, or user dismissed for this session
  if (!user || isEmailVerified || dismissed) {
    return null
  }

  const handleResend = async () => {
    setSending(true)
    setErrorMessage(null)
    setSentSuccess(false)
    try {
      const { error } = await resendVerificationEmail()
      if (error) {
        setErrorMessage(error.message)
      } else {
        setSentSuccess(true)
        setTimeout(() => setSentSuccess(false), 8000)
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send verification email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      id="email-verification-banner"
      className="w-full bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-amber-950/80 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs z-40 backdrop-blur-md"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="truncate text-amber-200">
          <span className="font-semibold text-amber-100">Please verify your email:</span>
          <span className="ml-1 text-amber-300 font-mono hidden sm:inline">{user.email}</span>
          <span className="ml-1 text-amber-200/80 hidden md:inline">
            — Check your inbox to activate full cloud sync & features.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {sentSuccess ? (
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verification email sent!
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={sending}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-100 border border-amber-500/30 font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {sending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Mail className="w-3 h-3" />
                Resend link
              </>
            )}
          </button>
        )}

        {errorMessage && (
          <span className="text-[11px] text-red-400 max-w-xs truncate hidden lg:inline">
            {errorMessage}
          </span>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-amber-400/70 hover:text-amber-200 rounded hover:bg-amber-500/10 transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
