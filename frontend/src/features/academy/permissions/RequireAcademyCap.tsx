import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAcademyPermissions } from './useAcademyPermissions'
import type { Capability } from './capabilities'
import { LoaderIcon } from '../../../assets/icons'

type Props = {
  cap: Capability
  children: ReactNode
}

/**
 * Route guard. Requires the current user to have `cap` on the :id academy
 * from the URL. Redirects to /academies/:id (visitor view) if not allowed.
 */
export function RequireAcademyCap({ cap, children }: Props) {
  const { id } = useParams<{ id: string }>()
  const perms = useAcademyPermissions(id)

  if (perms.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoaderIcon size={24} className="text-[var(--text-muted)]" />
      </div>
    )
  }

  if (!perms[cap]) {
    return <Navigate to={id ? `/academies/${id}` : '/academies'} replace />
  }

  return <>{children}</>
}
