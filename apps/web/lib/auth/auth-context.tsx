'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthState, AuthUser } from './types'
import { AuthService } from './auth-utils'
import { Session } from '@supabase/supabase-js'

const AuthContext = createContext<AuthState | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const session = await AuthService.getCurrentSession()
        const user = await AuthService.getCurrentUser()

        setSession(session)
        setUser(user as AuthUser)
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        const typedSession = session as Session | null
        setSession(typedSession)
        setUser(typedSession?.user as AuthUser || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await AuthService.signIn(email, password)
      if (result.error) {
        return { error: result.error }
      }
      return {}
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await AuthService.signUp(email, password)
      if (result.error) {
        return { error: result.error }
      }
      return {}
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await AuthService.signOut()
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const result = await AuthService.signInWithGoogle()
      if (result.error) {
        return { error: result.error }
      }
      return {}
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    const result = await AuthService.resetPassword(email)
    if (result.error) {
      return { error: result.error }
    }
    return {}
  }

  const updatePassword = async (password: string) => {
    const result = await AuthService.updatePassword(password)
    if (result.error) {
      return { error: result.error }
    }
    return {}
  }

  const value: AuthState = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}