import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { clearSession, getSession, saveSession, type AuthSession } from '#/lib/auth.ts'
import { apiFetch } from '#/domains/transactions/queries.ts'

type AuthContextValue = {
  session: AuthSession | null
  isAuthenticated: boolean
  signIn: (data: { name: string; password: string }) => Promise<void>
  signUp: (data: { name: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getSession())

  useEffect(() => {
    const sync = () => setSession(getSession())
    window.addEventListener('finora:auth-change', sync)
    return () => window.removeEventListener('finora:auth-change', sync)
  }, [])

  const authenticate = async (path: '/auth/login' | '/auth/register', data: { name: string; password: string }) => {
    const next = await apiFetch<AuthSession>(path, { method: 'POST', body: JSON.stringify(data) })
    saveSession(next)
    setSession(next)
  }

  const signOut = async () => {
    try { await apiFetch('/auth/logout', { method: 'POST' }) } finally { clearSession(); setSession(null) }
  }

  return <AuthContext.Provider value={{ session, isAuthenticated: Boolean(session), signIn: (data) => authenticate('/auth/login', data), signUp: (data) => authenticate('/auth/register', data), signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
