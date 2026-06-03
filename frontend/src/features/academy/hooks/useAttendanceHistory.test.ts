import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { listMemberAttendances, getMyAttendances } = vi.hoisted(() => ({
  listMemberAttendances: vi.fn(),
  getMyAttendances: vi.fn(),
}))
vi.mock('../api/academyApi', () => ({
  academyApi: { listMemberAttendances, getMyAttendances },
}))

import { useMemberAttendances, useMyAllAttendances } from './useAttendanceHistory'
import { attendanceKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())

describe('useMemberAttendances', () => {
  it("fetches one member's history within an academy", async () => {
    listMemberAttendances.mockResolvedValue({ content: [] })
    const { result, client } = renderHookWithClient(() =>
      useMemberAttendances('a1', 'u9', { page: 2, size: 10, startDate: '2026-06-01', endDate: '2026-06-30' }),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listMemberAttendances).toHaveBeenCalledWith('a1', 'u9', 2, 10, '2026-06-01', '2026-06-30')
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(attendanceKeys.byMember('a1', 'u9', 2, 10, '2026-06-01', '2026-06-30'))
  })

  it('does not fetch without academy or user id', () => {
    const a = renderHookWithClient(() => useMemberAttendances(undefined, 'u9'))
    const b = renderHookWithClient(() => useMemberAttendances('a1', undefined))
    expect(listMemberAttendances).not.toHaveBeenCalled()
    expect(a.result.current.fetchStatus).toBe('idle')
    expect(b.result.current.fetchStatus).toBe('idle')
  })
})

describe('useMyAllAttendances', () => {
  it('fetches across all academies (no academy id) for the user', async () => {
    getMyAttendances.mockResolvedValue({ content: [] })
    const { result, client } = renderHookWithClient(() =>
      useMyAllAttendances('u9', { page: 1, size: 25 }),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getMyAttendances).toHaveBeenCalledWith(undefined, 1, 25, undefined, undefined)
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(attendanceKeys.myAll('u9', 1, 25))
  })

  it('does not fetch without a user id', () => {
    const { result } = renderHookWithClient(() => useMyAllAttendances(undefined))
    expect(getMyAttendances).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })
})
