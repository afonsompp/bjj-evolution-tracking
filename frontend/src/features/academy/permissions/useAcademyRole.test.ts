import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const { useProfile } = vi.hoisted(() => ({ useProfile: vi.fn() }))
const { useMembership } = vi.hoisted(() => ({ useMembership: vi.fn() }))
vi.mock('../../profile/useProfile', () => ({ useProfile }))
vi.mock('../hooks/useMembership', () => ({ useMembership }))

import { useAcademyRole } from './useAcademyRole'

const profile = (over: object = {}) => ({ data: { id: 'u1', role: 'CUSTOMER' }, isLoading: false, ...over })
const membership = (over: object = {}) => ({ data: undefined, isLoading: false, ...over })

beforeEach(() => {
  vi.clearAllMocks()
  useProfile.mockReturnValue(profile())
  useMembership.mockReturnValue(membership())
})

describe('useAcademyRole', () => {
  it('passes the signed-in user id to useMembership', () => {
    renderHook(() => useAcademyRole('a1'))
    expect(useMembership).toHaveBeenCalledWith('a1', 'u1')
  })

  it('resolves ADMIN from the global role regardless of membership', () => {
    useProfile.mockReturnValue(profile({ data: { id: 'u1', role: 'ADMIN' } }))
    const { result } = renderHook(() => useAcademyRole('a1'))
    expect(result.current.role).toBe('ADMIN')
  })

  it('resolves the membership role for an active member', () => {
    useMembership.mockReturnValue(membership({ data: { role: 'INSTRUCTOR', status: 'ACTIVE' } }))
    const { result } = renderHook(() => useAcademyRole('a1'))
    expect(result.current.role).toBe('INSTRUCTOR')
  })

  it('falls back to GUEST when the membership is not active', () => {
    useMembership.mockReturnValue(membership({ data: { role: 'STUDENT', status: 'PENDING' } }))
    const { result } = renderHook(() => useAcademyRole('a1'))
    expect(result.current.role).toBe('GUEST')
  })

  it('is loading while the profile is loading', () => {
    useProfile.mockReturnValue(profile({ data: undefined, isLoading: true }))
    const { result } = renderHook(() => useAcademyRole('a1'))
    expect(result.current.isLoading).toBe(true)
  })

  it('waits on membership loading only when an academy + profile are present', () => {
    useMembership.mockReturnValue(membership({ isLoading: true }))

    const withAcademy = renderHook(() => useAcademyRole('a1'))
    expect(withAcademy.result.current.isLoading).toBe(true)

    const noAcademy = renderHook(() => useAcademyRole(undefined))
    expect(noAcademy.result.current.isLoading).toBe(false)
  })
})
