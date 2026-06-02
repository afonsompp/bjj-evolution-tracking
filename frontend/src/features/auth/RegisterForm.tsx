import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../lib/i18n/I18nContext'
import { authClient } from '../../lib/auth/authClient'

export default function RegisterForm() {
  const { translate } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')

  const validate = () => {
    if (!email.includes('@')) return translate('auth.invalidEmail')
    if (password.length < 8) return translate('auth.passwordTooShort')
    if (password !== confirmPassword) return translate('auth.passwordsMismatch')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setError('')
    setLoading(true)

    const { error: signUpError } = await authClient.signUp(email, password)

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setVerificationSent(true)
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

  if (verificationSent) {
    return (
      <div className="text-center text-sm text-[var(--text-muted)]">
        <p className="mb-2 text-[var(--text-primary)]">{translate('auth.verificationSent')}</p>
        <p>{translate('auth.verificationSentHint')}</p>
        <p className="mt-4 text-xs text-[var(--text-subtle)]">
          {translate('auth.didntGetIt')}{' '}
          {resendState === 'sent' ? (
            <span className="text-[var(--text-primary)]">{translate('auth.emailResent')}</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendState === 'sending'}
              className="text-[var(--text-primary)] underline hover:opacity-80 disabled:opacity-50"
            >
              {resendState === 'sending' ? translate('auth.resending') : translate('auth.resendEmail')}
            </button>
          )}
        </p>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm text-[var(--text-muted)]">{translate('auth.email')}</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
          placeholder={translate('auth.emailPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm text-[var(--text-muted)]">{translate('auth.password')}</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm text-[var(--text-muted)]">{translate('auth.confirmPassword')}</label>
        <input
          id="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 w-full rounded border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-[var(--text-primary)] px-3 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90 disabled:opacity-50"
      >
        {loading ? translate('auth.creatingAccount') : translate('auth.createAccount')}
      </button>

      <p className="text-center text-xs text-[var(--text-subtle)]">
        {translate('auth.haveAccount')}{' '}
        <Link to="/login" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">{translate('auth.signIn')}</Link>
      </p>
    </form>
  )
}
