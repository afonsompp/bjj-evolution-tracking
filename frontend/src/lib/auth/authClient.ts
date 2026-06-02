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

// Where Supabase sends users after they click the confirmation link in their
// email. The dedicated callback route turns the link's tokens into a session.
function confirmationRedirectTo(): string {
  return `${window.location.origin}/auth/callback`
}

// Where the password-recovery email link lands; that page lets the user set a
// new password against the recovery session Supabase establishes from the link.
function recoveryRedirectTo(): string {
  return `${window.location.origin}/reset-password`
}

export const authClient = {
  async signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: { message: error.message, code: error.code } }
    return { error: null }
  },

  async signUp(email: string, password: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: confirmationRedirectTo() },
    })
    if (error) return { error: { message: error.message, code: error.code } }
    return { error: null }
  },

  async requestPasswordReset(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: recoveryRedirectTo(),
    })
    if (error) return { error: { message: error.message, code: error.code } }
    return { error: null }
  },

  async updatePassword(password: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: { message: error.message, code: error.code } }
    return { error: null }
  },

  async resendConfirmation(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: confirmationRedirectTo() },
    })
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
