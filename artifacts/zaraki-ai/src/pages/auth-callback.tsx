import React, { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Sparkles, CheckCircle2, AlertCircle, Lock, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth-context'
import { validatePassword } from '../lib/rate-limiter'
import { LoadingSpinner } from '../components/LoadingSpinner'

export default function AuthCallback() {
  const [, setLocation] = useLocation()
  const { updatePassword } = useAuth()
  const [isRecovery, setIsRecovery] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Recovery form state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submittingPassword, setSubmittingPassword] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'))

    const isRecoveryType =
      urlParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery'

    if (isRecoveryType) {
      setIsRecovery(true)
      setLoading(false)
      return
    }

    // Standard OAuth or verification link exchange
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message)
        setLoading(false)
      } else if (session) {
        setSuccess(true)
        setLoading(false)
        setTimeout(() => {
          setLocation('/')
        }, 1500)
      } else {
        // Fallback check
        setTimeout(() => {
          setLocation('/')
        }, 2000)
      }
    })
  }, [setLocation])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const check = validatePassword(newPassword)
    if (!check.valid) {
      setError(check.error || 'Password requirement not met')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmittingPassword(true)
    try {
      const { error: resetErr } = await updatePassword(newPassword)
      if (resetErr) {
        setError(resetErr.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          setLocation('/')
        }, 2000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setSubmittingPassword(false)
    }
  }

  return (
    <div
      id="auth-callback-page"
      className="min-h-screen w-full bg-[#03081A] text-zinc-200 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans"
    >
      <div className="max-w-md w-full bg-zinc-950/80 border border-blue-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.15)] text-center relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
          <Sparkles className="w-7 h-7" />
        </div>

        {isRecovery ? (
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Create New Password</h1>
            <p className="text-xs text-zinc-400 mb-6">
              Enter your new secure password to restore access to Zaraki AI.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="py-4 space-y-3">
                <div className="flex items-center justify-center text-emerald-400 gap-2 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  Password updated!
                </div>
                <p className="text-xs text-zinc-400">Redirecting to Zaraki workspace...</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      id="reset-new-password"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 chars, uppercase & number"
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-cyan-400 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      id="reset-confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-cyan-400 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  id="reset-submit-btn"
                  type="submit"
                  disabled={submittingPassword}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50"
                >
                  {submittingPassword ? (
                    <LoadingSpinner size="sm" label="Updating..." />
                  ) : (
                    <>
                      <span>Set New Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Authenticating Session</h1>
            <p className="text-xs text-zinc-400 mb-6">
              Verifying cryptographic tokens with the authentication gateway...
            </p>

            {loading && <LoadingSpinner size="lg" label="Synchronizing profile..." />}

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="text-emerald-400 flex items-center justify-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                Authentication verified! Entering Zaraki AI...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
