import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../api/auth'
import api from '../api/client'

interface AuthContextType {
  user: User | null
  token: string | null
  setToken: (token: string | null) => void
  logout: () => void
  isAdmin: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(!!localStorage.getItem('token'))

  const setToken = (t: string | null) => {
    setTokenState(t)
    if (t) localStorage.setItem('token', t)
    else localStorage.removeItem('token')
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    if (!token) { setUser(null); setLoading(false); return }
    setLoading(true)
    api.get<User>('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [token])

  return (
    <AuthContext.Provider value={{ user, token, setToken, logout, isAdmin: user?.RoleID === 3, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
