import type { MemberRole, UserRole } from '../../../types/api'

export type AcademyCapabilities = {
  canViewSchedule: boolean
  canManageClasses: boolean
  canManageMembers: boolean
  canEditAcademy: boolean
  canPromoteMember: boolean
  canManageBilling: boolean
}

export type Capability = keyof AcademyCapabilities

export type EffectiveRole = MemberRole | 'ADMIN' | 'GUEST'

const FULL_ACCESS: AcademyCapabilities = {
  canViewSchedule: true,
  canManageClasses: true,
  canManageMembers: true,
  canEditAcademy: true,
  canPromoteMember: true,
  canManageBilling: true,
}

const NO_ACCESS: AcademyCapabilities = {
  canViewSchedule: false,
  canManageClasses: false,
  canManageMembers: false,
  canEditAcademy: false,
  canPromoteMember: false,
  canManageBilling: false,
}

const CAPABILITY_MATRIX: Record<EffectiveRole, AcademyCapabilities> = {
  ADMIN: FULL_ACCESS,
  OWNER: FULL_ACCESS,
  MANAGER: {
    canViewSchedule: true,
    canManageClasses: true,
    canManageMembers: true,
    canEditAcademy: false,
    canPromoteMember: false,
    canManageBilling: false,
  },
  INSTRUCTOR: {
    canViewSchedule: true,
    canManageClasses: true,
    canManageMembers: true,
    canEditAcademy: false,
    canPromoteMember: false,
    canManageBilling: false,
  },
  STUDENT: {
    canViewSchedule: true,
    canManageClasses: false,
    canManageMembers: false,
    canEditAcademy: false,
    canPromoteMember: false,
    canManageBilling: false,
  },
  GUEST: NO_ACCESS,
}

export function resolveEffectiveRole(
  globalRole: UserRole | undefined,
  membershipRole: MemberRole | undefined,
  isActiveMember: boolean,
): EffectiveRole {
  if (globalRole === 'ADMIN') return 'ADMIN'
  if (isActiveMember && membershipRole) return membershipRole
  return 'GUEST'
}

export function capabilitiesFor(role: EffectiveRole): AcademyCapabilities {
  return CAPABILITY_MATRIX[role]
}
