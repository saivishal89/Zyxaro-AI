import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  usage_tier: 'free' | 'pro' | 'enterprise'
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isEmailVerified: boolean
  isAuthenticated: boolean
  isSupabaseReady: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithGithub: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>) => Promise<void>
  deleteAccount: () => Promise<void>
  resendVerificationEmail: () => Promise<{ error: AuthError | null }>
  setOnboardingCompleted: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (!error && data) {
        setProfile(data as Profile)
      }
    } catch (err) {
      console.error('[Zaraki AI] Failed to fetch user profile:', err)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Database/Auth is running in guest mode. Connect Supabase to enable cloud accounts.' } as AuthError }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Database/Auth is running in guest mode. Connect Supabase to enable cloud accounts.' } as AuthError }
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Google OAuth requires Supabase credentials.' } as AuthError }
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error }
  }

  const signInWithGithub = async () => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'GitHub OAuth requires Supabase credentials.' } as AuthError }
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error }
  }

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Password reset requires configured Supabase.' } as AuthError }
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    return { error }
  }

  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase is not configured.' } as AuthError }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  const updateProfile = async (updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>) => {
    if (!user || !isSupabaseConfigured) return
    await supabase.from('profiles').update(updates).eq('id', user.id)
    await fetchProfile(user.id)
  }

  const deleteAccount = async () => {
    if (!user) return
    if (isSupabaseConfigured) {
      await supabase.from('profiles').delete().eq('id', user.id)
      await supabase.auth.signOut()
    }
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('zyx_') || key.startsWith('zrk_') || key.startsWith('sb-'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  const resendVerificationEmail = async () => {
    if (!user?.email || !isSupabaseConfigured) {
      return { error: { message: 'No valid user session found' } as AuthError }
    }
    const { error } = await supabase.auth.resend({ type: 'signup', email: user.email })
    return { error }
  }

  const setOnboardingCompleted = async () => {
    if (user && isSupabaseConfigured) {
      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)
      await fetchProfile(user.id)
    } else {
      localStorage.setItem('zrk_onboarding_completed', 'true')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isEmailVerified: user?.email_confirmed_at != null,
        isAuthenticated: user != null,
        isSupabaseReady: isSupabaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithGithub,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        deleteAccount,
        resendVerificationEmail,
        setOnboardingCompleted,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
