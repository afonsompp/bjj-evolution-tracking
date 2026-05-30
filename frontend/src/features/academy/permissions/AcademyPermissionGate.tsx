import type { ReactNode } from 'react'
import { useAcademyPermissions } from './useAcademyPermissions'
import type { Capability } from './capabilities'

type Props = {
  academyId: string | undefined
  require: Capability
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Declarative permission boundary. Renders children only when the current user
 * has the required capability on the given academy. Use for buttons/sections;
 * for routes, use RequireAcademyCap.
 */
export function AcademyPermissionGate({ academyId, require, fallback = null, children }: Props) {
  const perms = useAcademyPermissions(academyId)
  if (perms.isLoading) return null
  return perms[require] ? <>{children}</> : <>{fallback}</>
}
