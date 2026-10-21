import React, { useState, useEffect } from 'react'
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { validateEmail, validatePassword, authRateLimiter } from '../lib/rate-limiter'
import { LoadingSpinner } from './LoadingSpinner'

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'check-email'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: AuthMode
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithGithub,
    resetPassword,
    isSupabaseReady,
  } = useAuth()

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }, [isOpen, initialMode])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const res = provider === 'google' ? await signInWithGoogle() : await signInWithGithub()
      if (res.error) {
        setErrorMessage(res.error.message)
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : `Failed to connect with ${provider}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    // Check rate limit
    const rateCheck = authRateLimiter.check()
    if (!rateCheck.allowed) {
      const sec = Math.ceil(rateCheck.retryAfterMs / 1000)
      setErrorMessage(`Too many authentication attempts. Please wait ${sec}s before retrying.`)
      return
    }

    // Email validation
    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) {
      setErrorMessage(emailCheck.error || 'Invalid email')
      return
    }

    if (mode === 'forgot-password') {
      setLoading(true)
      try {
        const { error } = await resetPassword(email)
        if (error) {
          setErrorMessage(error.message)
        } else {
          setSuccessMessage('Password reset instructions sent. Please check your inbox.')
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Error sending reset email')
      } finally {
        setLoading(false)
      }
      return
    }

    // Password validation for login & signup
    if (mode === 'signup') {
      const passCheck = validatePassword(password)
      if (!passCheck.valid) {
        setErrorMessage(passCheck.error || 'Password requirement not met')
        return
      }
      if (!displayName.trim()) {
        setErrorMessage('Please enter your name or callsign')
        return
      }

      setLoading(true)
      try {
        const { error } = await signUpWithEmail(email, password, displayName)
        if (error) {
          setErrorMessage(error.message)
        } else {
          setMode('check-email')
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Error during sign up')
      } finally {
        setLoading(false)
      }
      return
    }

    if (mode === 'login') {
      if (!password) {
        setErrorMessage('Please enter your password')
        return
      }
      setLoading(true)
      try {
        const { error } = await signInWithEmail(email, password)
        if (error) {
          setErrorMessage(error.message)
        } else {
          onClose()
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Error during sign in')
      } finally {
        setLoading(false)
      }
    }
  }

  // Password requirements state
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md bg-[#070D21]/95 border border-blue-500/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(34,211,238,0.15)] text-zinc-200 overflow-hidden"
      >
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="auth-modal-close-button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-cyan-500/30 text-cyan-400 mb-3 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {mode === 'login' && 'Sign in to Zaraki AI'}
            {mode === 'signup' && 'Create your Zaraki AI Account'}
            {mode === 'forgot-password' && 'Reset your password'}
            {mode === 'check-email' && 'Verify your email'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'login' && 'Synchronize your conversations, models, and RAG knowledge vault.'}
            {mode === 'signup' && 'Access multi-model orchestration, vector memory, and intelligence suites.'}
            {mode === 'forgot-password' && 'Enter your verified account email to receive recovery instructions.'}
            {mode === 'check-email' && `We sent a confirmation link to ${email || 'your email'}.`}
          </p>
        </div>

        {!isSupabaseReady && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Supabase is not configured yet. App is operating in local guest mode.</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            id="auth-error-message"
            className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            id="auth-success-message"
            className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {mode === 'check-email' ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              <Mail className="w-8 h-8" />
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Click the link inside the confirmation email to activate your account and access all cloud intelligence features.
            </p>
            <div className="pt-2">
              <button
                id="auth-check-email-back-btn"
                onClick={() => setMode('login')}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* OAuth Buttons (login & signup) */}
            {(mode === 'login' || mode === 'signup') && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  id="auth-google-oauth-btn"
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-500 text-xs font-medium text-zinc-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  id="auth-github-oauth-btn"
                  type="button"
                  onClick={() => handleOAuth('github')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-500 text-xs font-medium text-zinc-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-zinc-800 w-full" />
                <span className="bg-[#070D21] px-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  Or with email
                </span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Callsign / Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      id="auth-signup-name-input"
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Satoshi"
                      className="w-full bg-zinc-900/80 border border-zinc-700/80 focus:border-cyan-400 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-zinc-900/80 border border-zinc-700/80 focus:border-cyan-400 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {mode !== 'forgot-password' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-300">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        id="auth-forgot-password-link"
                        onClick={() => {
                          setMode('forgot-password')
                          setErrorMessage(null)
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      id="auth-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-900/80 border border-zinc-700/80 focus:border-cyan-400 rounded-xl py-2 pl-9 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Password strength criteria for signup */}
              {mode === 'signup' && (
                <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-[11px] space-y-1">
                  <div className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider mb-1">
                    Password requirements:
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={hasMinLength ? 'text-emerald-400' : 'text-zinc-500'}>
                      {hasMinLength ? '✓' : '○'} At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={hasUppercase ? 'text-emerald-400' : 'text-zinc-500'}>
                      {hasUppercase ? '✓' : '○'} One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={hasNumber ? 'text-emerald-400' : 'text-zinc-500'}>
                      {hasNumber ? '✓' : '○'} One number
                    </span>
                  </div>
                </div>
              )}

              <button
                id="auth-submit-button"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:brightness-110 text-white font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.35)] disabled:opacity-50"
              >
                {loading ? (
                  <LoadingSpinner size="sm" label="Authenticating..." />
                ) : (
                  <>
                    <span>
                      {mode === 'login' && 'Sign In'}
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'forgot-password' && 'Send Reset Link'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle Mode Footer */}
            <div className="mt-5 text-center text-xs text-zinc-400">
              {mode === 'login' && (
                <p>
                  Don't have an account?{' '}
                  <button
                    id="auth-switch-to-signup"
                    onClick={() => {
                      setMode('signup')
                      setErrorMessage(null)
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
                  >
                    Sign up now
                  </button>
                </p>
              )}
              {mode === 'signup' && (
                <p>
                  Already registered?{' '}
                  <button
                    id="auth-switch-to-login"
                    onClick={() => {
                      setMode('login')
                      setErrorMessage(null)
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              )}
              {mode === 'forgot-password' && (
                <p>
                  Remembered your password?{' '}
                  <button
                    id="auth-switch-from-forgot-to-login"
                    onClick={() => {
                      setMode('login')
                      setErrorMessage(null)
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </p>
              )}
            </div>

            {/* Legal Links */}
            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center text-[10px] text-zinc-500">
              By proceeding, you agree to Zaraki AI's{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-cyan-400 underline transition-colors"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-cyan-400 underline transition-colors"
              >
                Privacy Policy
              </a>
              .
            </div>
          </>
        )}
      </div>
    </div>
  )
}
