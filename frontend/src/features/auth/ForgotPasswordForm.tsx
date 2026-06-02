import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../lib/i18n/I18nContext'
import { authClient } from '../../lib/auth/authClient'

export default function ForgotPasswordForm() {
  const { translate } = useTranslation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setError(translate('auth.invalidEmail'))
      return
    }

    setError('')
    setLoading(true)

    const { error: resetError } = await authClient.requestPasswordReset(email)

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center text-sm text-[var(--text-muted)]">
        <p className="mb-2 text-[var(--text-primary)]">{translate('auth.checkEmail')}</p>
        <p>{translate('auth.resetSentHint')}</p>
        <p className="mt-4 text-xs text-[var(--text-subtle)]">
          <Link to="/login" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            {translate('auth.backToSignIn')}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        {translate('auth.forgotHint')}
      </p>

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

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-[var(--text-primary)] px-3 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90 disabled:opacity-50"
      >
        {loading ? translate('auth.sending') : translate('auth.sendResetLink')}
      </button>

      <p className="text-center text-xs text-[var(--text-subtle)]">
        {translate('auth.rememberedIt')}{' '}
        <Link to="/login" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">{translate('auth.signIn')}</Link>
      </p>
    </form>
  )
}
