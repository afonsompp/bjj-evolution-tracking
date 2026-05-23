import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../lib/i18n/I18nContext'

export default function NotFoundPage() {
  const { translate } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-7xl font-bold text-[var(--text-subtle)]">404</p>
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        {translate('notFound.title')}
      </h1>
      <p className="text-sm text-[var(--text-muted)]">
        {translate('notFound.description')}
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-2 rounded-lg bg-[var(--text-primary)] px-5 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90"
      >
        {translate('notFound.goHome')}
      </button>
    </div>
  )
}
