import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authClient, type AuthUser, type AuthSession } from '../../lib/auth/authClient'

interface AuthContextValue {
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authClient.getSession().then(({ session }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { unsubscribe } = authClient.onAuthStateChange((session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    await authClient.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// Colocated with the provider by design; this hook isn't a component, so the
// fast-refresh rule (HMR only) doesn't apply.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
