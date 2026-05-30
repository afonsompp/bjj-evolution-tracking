import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useProfile } from '../profile/useProfile'
import { LoaderIcon } from '../../assets/icons'

type Props = {
  children: ReactNode
}

/**
 * Route guard. Only ADMIN users may pass; everyone else is redirected to the
 * dashboard. The backend enforces this independently — this is just UX.
 */
export function RequireAdmin({ children }: Props) {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoaderIcon size={24} className="text-[var(--text-muted)]" />
      </div>
    )
  }

  if (profile?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
