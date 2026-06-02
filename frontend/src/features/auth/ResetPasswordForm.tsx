import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from '../../lib/i18n/I18nContext'
import { authClient } from '../../lib/auth/authClient'
import { supabase } from '../../lib/supabase'
import { readAuthUrlError } from '../../lib/auth/authUrlError'

type Status = 'verifying' | 'ready' | 'error'

export default function ResetPasswordForm() {
  const navigate = useNavigate()
  const { translate } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Read any link error eagerly so we never flash the form for a dead link
  // (and avoid a synchronous setState inside the effect).
  const [{ status, message }, setState] = useState<{ status: Status; message: string }>(() => {
    const urlError = readAuthUrlError()
    return urlError ? { status: 'error', message: urlError } : { status: 'verifying', message: '' }
  })

  useEffect(() => {
    if (readAuthUrlError()) return

    // The recovery link's token becomes a session asynchronously
    // (detectSessionInUrl). Wait for it before showing the form, since
    // updating the password needs that session.
    let active = true
    const deadline = Date.now() + 5000

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!active) return
      if (session) {
        setState({ status: 'ready', message: '' })
        return
      }
      if (Date.now() > deadline) {
        setState({ status: 'error', message: translate('auth.resetLinkInvalid') })
        return
      }
      setTimeout(check, 250)
    }
    check()

    return () => {
      active = false
    }
  }, [translate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError(translate('auth.passwordTooShort'))
      return
    }
    if (password !== confirmPassword) {
      setError(translate('auth.passwordsMismatch'))
      return
    }

    setError('')
    setLoading(true)

    const { error: updateError } = await authClient.updatePassword(password)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // The recovery session is now a normal session — send them into the app.
    navigate('/dashboard', { replace: true })
  }

  if (status === 'verifying') {
    return <p className="text-center text-sm text-[var(--text-muted)]">{translate('auth.verifyingResetLink')}</p>
  }

  if (status === 'error') {
    return (
      <div className="text-center text-sm text-[var(--text-muted)]">
        <p className="mb-2 text-red-400">{message}</p>
        <p>
          <Link to="/forgot-password" className="text-[var(--text-primary)] hover:opacity-80">
            {translate('auth.requestNewLink')}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">{translate('auth.chooseNewPassword')}</p>

      <div>
        <label htmlFor="password" className="block text-sm text-[var(--text-muted)]">{translate('auth.newPassword')}</label>
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
        <label htmlFor="confirmPassword" className="block text-sm text-[var(--text-muted)]">{translate('auth.confirmNewPassword')}</label>
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
        {loading ? translate('auth.updating') : translate('auth.updatePassword')}
      </button>
    </form>
  )
}
