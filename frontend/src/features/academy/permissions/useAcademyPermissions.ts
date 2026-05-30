import { useAcademyRole } from './useAcademyRole'
import { capabilitiesFor, type AcademyCapabilities, type EffectiveRole } from './capabilities'

export type AcademyPermissionsResult = AcademyCapabilities & {
  role: EffectiveRole
  isLoading: boolean
}

export function useAcademyPermissions(
  academyId: string | undefined,
): AcademyPermissionsResult {
  const { role, isLoading } = useAcademyRole(academyId)
  return { ...capabilitiesFor(role), role, isLoading }
}
