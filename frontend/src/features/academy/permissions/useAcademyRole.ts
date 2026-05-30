import { useProfile } from '../../profile/useProfile'
import { useMembership } from '../hooks/useMembership'
import {
  resolveEffectiveRole,
  type EffectiveRole,
} from './capabilities'

export type AcademyRoleResult = {
  role: EffectiveRole
  isLoading: boolean
}

export function useAcademyRole(academyId: string | undefined): AcademyRoleResult {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: membership, isLoading: membershipLoading } = useMembership(
    academyId,
    profile?.id,
  )

  const role = resolveEffectiveRole(
    profile?.role,
    membership?.role,
    membership?.status === 'ACTIVE',
  )

  return {
    role,
    isLoading: profileLoading || (!!academyId && !!profile?.id && membershipLoading),
  }
}
