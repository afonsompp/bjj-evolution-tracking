import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from '../lib/i18n/I18nContext'
import { supabase } from '../lib/supabase'
import { readAuthUrlError } from '../lib/auth/authUrlError'

type Status = 'confirming' | 'error'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { translate } = useTranslation()
  // Read any link error eagerly so we never flash the "confirming" state for an
  // already-failed link (and avoid a synchronous setState inside the effect).
  const [{ status, message }, setState] = useState<{ status: Status; message: string }>(() => {
    const urlError = readAuthUrlError()
    return urlError ? { status: 'error', message: urlError } : { status: 'confirming', message: '' }
  })

  useEffect(() => {
    if (readAuthUrlError()) return

    // The Supabase client turns the link's tokens into a session asynchronously
    // (detectSessionInUrl). Poll until it lands, then move the now-confirmed
    // user into onboarding; give up after a few seconds for invalid links.
    let active = true
    const deadline = Date.now() + 5000

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!active) return
      if (session) {
        navigate('/onboarding', { replace: true })
        return
      }
      if (Date.now() > deadline) {
        setState({ status: 'error', message: translate('auth.confirmLinkInvalid') })
        return
      }
      setTimeout(check, 250)
    }
    check()

    return () => {
      active = false
    }
  }, [navigate, translate])

  if (status === 'confirming') {
    return <p className="text-center text-sm text-[var(--text-muted)]">{translate('auth.confirming')}</p>
  }

  return (
    <div className="text-center text-sm text-[var(--text-muted)]">
      <p className="mb-2 text-red-400">{message}</p>
      <p>
        <Link to="/login" className="text-[var(--text-primary)] hover:opacity-80">
          {translate('auth.backToSignIn')}
        </Link>
      </p>
    </div>
  )
}
