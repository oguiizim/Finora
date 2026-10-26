export interface AuthUser {
  id: number
  name: string
  active: boolean
}

export interface AuthSession {
  user: AuthUser
  access_token: string
  refresh_token: string
}

const storageKey = 'finora.session'

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) as AuthSession : null
  } catch {
    return null
  }
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(storageKey, JSON.stringify(session))
  window.dispatchEvent(new Event('finora:auth-change'))
}

export function clearSession() {
  localStorage.removeItem(storageKey)
  window.dispatchEvent(new Event('finora:auth-change'))
}
