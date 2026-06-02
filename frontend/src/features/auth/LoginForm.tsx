import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authClient } from '../../lib/auth/authClient'

export default function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNeedsConfirmation(false)
    setResendState('idle')
    setLoading(true)

    const { error: signInError } = await authClient.signIn(email, password)

    if (signInError) {
      if (signInError.code === 'invalid_credentials') {
        setError('Invalid email or password.')
      } else if (signInError.code === 'email_not_confirmed') {
        setError('Please confirm your email before logging in.')
        setNeedsConfirmation(true)
      } else {
        setError(signInError.message)
      }
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  const handleResend = async () => {
    setResendState('sending')
    const { error: resendError } = await authClient.resendConfirmation(email)
    if (resendError) {
      setError(resendError.message)
      setResendState('idle')
      return
    }
    setResendState('sent')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm text-[var(--text-muted)]">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm text-[var(--text-muted)]">Password</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
        />
        <div className="mt-1">
          <Link to="/forgot-password" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            Forgot password?
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {needsConfirmation && (
        <p className="text-xs text-[var(--text-muted)]">
          {resendState === 'sent' ? (
            <span className="text-[var(--text-primary)]">Confirmation email resent.</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendState === 'sending'}
              className="text-[var(--text-primary)] underline hover:opacity-80 disabled:opacity-50"
            >
              {resendState === 'sending' ? 'Resending…' : 'Resend confirmation email'}
            </button>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-[var(--text-primary)] px-3 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>

      <p className="text-center text-xs text-[var(--text-subtle)]">
        Don't have an account?{' '}
        <Link to="/register" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          Register
        </Link>
      </p>
    </form>
  )
}
