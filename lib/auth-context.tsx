'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from './supabase-client'
import { User } from './types'
import { getUserProfile } from './database-client'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any, user?: User | null }>
  signUp: (email: string, password: string, userData: { name: string; role: string; phone?: string; address?: string }) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session on page load
    const getInitialSession = async () => {
      console.log('Checking for existing session...')
      
      // Try to fetch session from API route which has access to cookies
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          console.log('Session API returned:', data)
          if (data.profile) {
            setUser(data.profile)
            setSupabaseUser(data.user || null)
            console.log('Loaded user from session:', data.profile)
          }
        }
      } catch (err) {
        console.error('Session check error:', err)
      }
      
      setLoading(false)
    }

    getInitialSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      console.log('API login response status:', res.status)
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        return { error: new Error(body.error || 'Login failed') }
      }

      const body = await res.json()
      console.log('Login API returned:', body)
      
      const profile = body.profile as User
      console.log('Setting user state to:', profile)
      
      setSupabaseUser(body.user)
      setUser(profile)

      return { error: null, user: profile }
    } catch (err: any) {
      console.error('signIn error:', err)
      return { error: err }
    }
  }

  const signUp = async (email: string, password: string, userData: { name: string; role: string; phone?: string; address?: string }) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          address: userData.address,
        }
      }
    })
    return { error }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setSupabaseUser(null)
      window.location.href = '/login'
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { error: new Error('No user logged in') }
    
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    
    if (!error) {
      setUser({ ...user, ...updates })
    }
    
    return { error }
  }

  const value = {
    user,
    supabaseUser,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
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
