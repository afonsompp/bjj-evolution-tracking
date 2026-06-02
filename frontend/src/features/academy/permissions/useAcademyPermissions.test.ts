import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const { useAcademyRole } = vi.hoisted(() => ({ useAcademyRole: vi.fn() }))
vi.mock('./useAcademyRole', () => ({ useAcademyRole }))

import { useAcademyPermissions } from './useAcademyPermissions'
import { capabilitiesFor } from './capabilities'

beforeEach(() => vi.clearAllMocks())

describe('useAcademyPermissions', () => {
  it('spreads the capability matrix for the resolved role and echoes role + isLoading', () => {
    useAcademyRole.mockReturnValue({ role: 'STUDENT', isLoading: false })
    const { result } = renderHook(() => useAcademyPermissions('a1'))

    expect(result.current).toMatchObject(capabilitiesFor('STUDENT'))
    expect(result.current.role).toBe('STUDENT')
    expect(result.current.isLoading).toBe(false)
    // STUDENT can view but not manage.
    expect(result.current.canViewSchedule).toBe(true)
    expect(result.current.canManageClasses).toBe(false)
  })

  it('grants full access for an OWNER', () => {
    useAcademyRole.mockReturnValue({ role: 'OWNER', isLoading: false })
    const { result } = renderHook(() => useAcademyPermissions('a1'))
    expect(result.current).toMatchObject(capabilitiesFor('OWNER'))
    expect(result.current.canEditAcademy).toBe(true)
  })

  it('forwards the loading flag from useAcademyRole', () => {
    useAcademyRole.mockReturnValue({ role: 'GUEST', isLoading: true })
    const { result } = renderHook(() => useAcademyPermissions('a1'))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.canViewSchedule).toBe(false)
  })
})
