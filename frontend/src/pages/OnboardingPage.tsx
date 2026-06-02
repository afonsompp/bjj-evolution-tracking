import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../lib/i18n/I18nContext'
import { useProfile } from '../features/profile/useProfile'
import ProfileForm from '../features/profile/ProfileForm'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { translate } = useTranslation()
  const { data: profile, isLoading } = useProfile()

  if (isLoading) return <p className="text-sm text-[var(--text-muted)]">Loading…</p>

  if (profile) {
    navigate('/dashboard', { replace: true })
    return null
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-bold text-[var(--text-primary)]">{translate('profile.onboardingTitle')}</h1>
      <ProfileForm />
    </div>
  )
}
