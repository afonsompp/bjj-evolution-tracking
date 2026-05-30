import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../lib/i18n/I18nContext'

export default function ErrorPage() {
  const { translate } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-7xl font-bold text-[var(--text-subtle)]">500</p>
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        {translate('error.title')}
      </h1>
      <p className="text-sm text-[var(--text-muted)]">
        {translate('error.description')}
      </p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[var(--text-primary)] px-5 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90"
        >
          {translate('error.retry')}
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="rounded-lg border border-[var(--border-card)] px-5 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          {translate('error.goHome')}
        </button>
      </div>
    </div>
  )
}
