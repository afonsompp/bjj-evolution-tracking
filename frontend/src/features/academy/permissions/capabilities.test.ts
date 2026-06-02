import { describe, it, expect } from 'vitest'
import {
  resolveEffectiveRole,
  capabilitiesFor,
  type AcademyCapabilities,
  type Capability,
  type EffectiveRole,
} from './capabilities'

const ALL_CAPS: Capability[] = [
  'canViewSchedule',
  'canManageClasses',
  'canManageMembers',
  'canEditAcademy',
  'canPromoteMember',
  'canManageBilling',
]

function granted(caps: AcademyCapabilities): Capability[] {
  return ALL_CAPS.filter((c) => caps[c])
}

describe('resolveEffectiveRole', () => {
  it('returns ADMIN for a global admin regardless of membership', () => {
    expect(resolveEffectiveRole('ADMIN', undefined, false)).toBe('ADMIN')
    expect(resolveEffectiveRole('ADMIN', 'STUDENT', true)).toBe('ADMIN')
  })

  it('returns the membership role for an active member', () => {
    expect(resolveEffectiveRole('CUSTOMER', 'OWNER', true)).toBe('OWNER')
    expect(resolveEffectiveRole('CUSTOMER', 'STUDENT', true)).toBe('STUDENT')
  })

  it('returns GUEST when membership is inactive', () => {
    expect(resolveEffectiveRole('CUSTOMER', 'OWNER', false)).toBe('GUEST')
  })

  it('returns GUEST when there is no membership role', () => {
    expect(resolveEffectiveRole('CUSTOMER', undefined, true)).toBe('GUEST')
    expect(resolveEffectiveRole(undefined, undefined, false)).toBe('GUEST')
  })
})

describe('capabilitiesFor', () => {
  it('grants everything to ADMIN and OWNER', () => {
    expect(granted(capabilitiesFor('ADMIN'))).toEqual(ALL_CAPS)
    expect(granted(capabilitiesFor('OWNER'))).toEqual(ALL_CAPS)
  })

  it('lets MANAGER and INSTRUCTOR manage classes and members but not the academy', () => {
    for (const role of ['MANAGER', 'INSTRUCTOR'] as EffectiveRole[]) {
      const caps = capabilitiesFor(role)
      expect(granted(caps)).toEqual([
        'canViewSchedule',
        'canManageClasses',
        'canManageMembers',
      ])
      expect(caps.canEditAcademy).toBe(false)
      expect(caps.canPromoteMember).toBe(false)
      expect(caps.canManageBilling).toBe(false)
    }
  })

  it('lets STUDENT only view the schedule', () => {
    expect(granted(capabilitiesFor('STUDENT'))).toEqual(['canViewSchedule'])
  })

  it('grants nothing to GUEST', () => {
    expect(granted(capabilitiesFor('GUEST'))).toEqual([])
  })

  it('only ADMIN/OWNER can edit the academy, promote, or manage billing', () => {
    const privileged = (['ADMIN', 'OWNER', 'MANAGER', 'INSTRUCTOR', 'STUDENT', 'GUEST'] as EffectiveRole[])
      .filter((r) => capabilitiesFor(r).canEditAcademy)
    expect(privileged).toEqual(['ADMIN', 'OWNER'])
  })
})
