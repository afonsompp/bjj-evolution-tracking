import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { useTranslation } from '../lib/i18n/I18nContext'
import type { ProfileResponse } from '../types/api'
import ProfileForm from '../features/profile/ProfileForm'
import { useAuth } from '../features/auth/AuthContext'

export default function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { translate } = useTranslation()
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () =>
      apiClient.get<ProfileResponse>('/profiles').then(r => r.data),
    retry: false,
  })

  if (isLoading) return <p className="text-sm text-zinc-500">Loading…</p>

  if (profile) {
    navigate('/dashboard', { replace: true })
    return null
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-bold">{translate('profile.onboardingTitle')}</h1>
      <ProfileForm />
    </div>
  )
}
