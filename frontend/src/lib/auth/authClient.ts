import { supabase } from '../supabase'

export interface AuthUser {
  id: string
  email?: string
}

export interface AuthSession {
  accessToken: string
  user: AuthUser
}

export interface AuthError {
  message: string
  code?: string
}

function toAuthSession(raw: { access_token: string; user: { id: string; email?: string } }): AuthSession {
  return {
    accessToken: raw.access_token,
    user: { id: raw.user.id, email: raw.user.email },
  }
}

export const authClient = {
  async signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: { message: error.message, code: error.code } }
    return { error: null }
  },

  async signUp(email: string, password: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: { message: error.message, code: error.code } }
    return { error: null }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  },

  async getSession(): Promise<{ session: AuthSession | null }> {
    const { data: { session } } = await supabase.auth.getSession()
    return { session: session ? toAuthSession(session) : null }
  },

  onAuthStateChange(callback: (session: AuthSession | null) => void): { unsubscribe: () => void } {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session ? toAuthSession(session) : null)
    })
    return { unsubscribe: () => subscription.unsubscribe() }
  },
}
