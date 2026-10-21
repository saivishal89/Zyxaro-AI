import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  Shield,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Trash2,
  Sparkles,
  KeyRound,
  FileJson,
} from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { validatePassword } from '../lib/rate-limiter'
import { useZyxaro } from '../lib/context'
import { LoadingSpinner } from './LoadingSpinner'

interface AccountSettingsProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = 'profile' | 'security' | 'data' | 'danger'

export function AccountSettings({ isOpen, onClose }: AccountSettingsProps) {
  const { user, profile, updateProfile, updatePassword, deleteAccount, signOut } = useAuth()
  const { sessions, notes } = useZyxaro()

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [displayName, setDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile?.display_name || user?.user_metadata?.full_name || '')
      setStatusMessage(null)
      setNewPassword('')
      setConfirmPassword('')
      setDeleteConfirmation('')
    }
  }, [isOpen, profile, user])

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatusMessage(null)
    try {
      await updateProfile({ display_name: displayName })
      setStatusMessage({ type: 'success', text: 'Profile updated successfully.' })
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMessage(null)

    const passCheck = validatePassword(newPassword)
    if (!passCheck.valid) {
      setStatusMessage({ type: 'error', text: passCheck.error || 'Password invalid.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    setLoading(true)
    try {
      const { error } = await updatePassword(newPassword)
      if (error) {
        setStatusMessage({ type: 'error', text: error.message })
      } else {
        setStatusMessage({ type: 'success', text: 'Password successfully changed.' })
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to change password.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = () => {
    try {
      const exportData = {
        app: 'Zaraki AI',
        version: '1.0.0',
        exported_at: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
          display_name: profile?.display_name,
        },
        conversations: sessions || [],
        notes: notes || [],
      }

      const jsonStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zaraki-ai-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatusMessage({ type: 'success', text: 'Data package downloaded successfully.' })
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to generate data export.',
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setStatusMessage({ type: 'error', text: 'You must type DELETE to confirm removal.' })
      return
    }

    setLoading(true)
    try {
      await deleteAccount()
      onClose()
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete account.',
      })
      setLoading(false)
    }
  }

  return (
    <div
      id="account-settings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        id="account-settings-card"
        className="relative w-full max-w-2xl bg-[#070D21]/95 border border-blue-500/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(34,211,238,0.15)] text-zinc-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Account & Vault Settings</h2>
              <p className="text-xs text-zinc-400">Manage security credentials, backups, and preferences</p>
            </div>
          </div>
          <button
            id="account-settings-close-btn"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 pt-4 pb-2 border-b border-zinc-800/80 overflow-x-auto text-xs font-mono">
          <button
            id="account-tab-profile"
            onClick={() => {
              setActiveTab('profile')
              setStatusMessage(null)
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white font-medium shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Profile
          </button>
          <button
            id="account-tab-security"
            onClick={() => {
              setActiveTab('security')
              setStatusMessage(null)
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white font-medium shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Security
          </button>
          <button
            id="account-tab-data"
            onClick={() => {
              setActiveTab('data')
              setStatusMessage(null)
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'data'
                ? 'bg-blue-600 text-white font-medium shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Data Backup
          </button>
          <button
            id="account-tab-danger"
            onClick={() => {
              setActiveTab('danger')
              setStatusMessage(null)
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'danger'
                ? 'bg-red-950/80 border border-red-500/40 text-red-300 font-medium'
                : 'text-red-400/70 hover:text-red-300 hover:bg-red-500/5'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Danger Zone
          </button>
        </div>

        {/* Status Feedback */}
        {statusMessage && (
          <div
            id="account-settings-status"
            className={`my-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/50 border border-red-500/40 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="py-4 overflow-y-auto flex-1">
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Email address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'guest@zaraki.local'}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-zinc-400 font-mono cursor-not-allowed"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Primary identifier managed by Supabase Auth.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Display Name / Callsign</label>
                <input
                  id="account-display-name-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-cyan-400 rounded-xl py-2 px-3 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Subscription Tier
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Tier determines multi-model routing quotas and vector store capacity.
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono uppercase font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  {profile?.usage_tier || 'Free Tier'}
                </span>
              </div>

              <button
                id="account-save-profile-btn"
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-medium transition-all cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">New Password</label>
                <input
                  id="account-new-password-input"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters, uppercase & number"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-cyan-400 rounded-xl py-2 px-3 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Confirm New Password</label>
                <input
                  id="account-confirm-password-input"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-cyan-400 rounded-xl py-2 px-3 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <button
                id="account-update-password-btn"
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-medium transition-all cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-2">
                <div className="font-semibold text-white flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-cyan-400" />
                  Self-Custody Data Export
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Export all your intelligence history, synthesized prompt templates, scratchpad notes, and model routing records as a JSON file.
                </p>
                <div className="text-[11px] font-mono text-zinc-500 pt-1">
                  Includes {sessions?.length || 0} conversation threads and notes.
                </div>
              </div>

              <button
                id="account-export-data-btn"
                onClick={handleExportData}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-mono text-xs font-medium flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
              >
                <Download className="w-4 h-4" />
                Download JSON Backup
              </button>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-xs space-y-2">
                <div className="font-semibold text-red-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Irreversible Account & Data Deletion
                </div>
                <p className="text-red-300/80 leading-relaxed">
                  This will permanently delete your user profile, purge all messages, remove RAG embeddings, and reset your local device cache. This action cannot be reversed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Type <span className="font-mono text-red-400 font-bold">DELETE</span> to confirm:
                </label>
                <input
                  id="account-delete-confirm-input"
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-zinc-900 border border-red-900/60 focus:border-red-500 rounded-xl py-2 px-3 text-sm text-red-200 font-mono focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <button
                  id="account-confirm-delete-btn"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'DELETE' || loading}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {loading ? 'Deleting...' : 'Permanently Delete Account'}
                </button>

                <button
                  id="account-sign-out-btn"
                  onClick={async () => {
                    await signOut()
                    onClose()
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-medium transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
