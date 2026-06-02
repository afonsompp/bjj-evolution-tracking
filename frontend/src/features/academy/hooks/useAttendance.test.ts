import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { listAttendances, getMyAttendances } = vi.hoisted(() => ({
  listAttendances: vi.fn(),
  getMyAttendances: vi.fn(),
}))
vi.mock('../api/academyApi', () => ({
  academyApi: { listAttendances, getMyAttendances },
}))

import { useClassAttendance, useMyAttendances } from './useAttendance'
import { attendanceKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())

describe('useClassAttendance', () => {
  it('lists the class roster and keys by class id', async () => {
    const roster = [{ studentId: 's1' }]
    listAttendances.mockResolvedValue(roster)

    const { result, client } = renderHookWithClient(() => useClassAttendance('a1', 77))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listAttendances).toHaveBeenCalledWith('a1', 77)
    expect(result.current.data).toBe(roster)
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(attendanceKeys.forClass(77))
  })

  it('does not fetch when academy or class id is missing', () => {
    const a = renderHookWithClient(() => useClassAttendance(undefined, 77))
    const b = renderHookWithClient(() => useClassAttendance('a1', undefined))
    expect(listAttendances).not.toHaveBeenCalled()
    expect(a.result.current.fetchStatus).toBe('idle')
    expect(b.result.current.fetchStatus).toBe('idle')
  })
})

describe('useMyAttendances', () => {
  it('fetches the signed-in user attendances for an academy', async () => {
    getMyAttendances.mockResolvedValue([])
    const { result } = renderHookWithClient(() => useMyAttendances('a1'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getMyAttendances).toHaveBeenCalledWith('a1')
  })

  it('does not fetch without an academy id or when disabled', () => {
    const a = renderHookWithClient(() => useMyAttendances(undefined))
    const b = renderHookWithClient(() => useMyAttendances('a1', false))
    expect(getMyAttendances).not.toHaveBeenCalled()
    expect(a.result.current.fetchStatus).toBe('idle')
    expect(b.result.current.fetchStatus).toBe('idle')
  })
})
