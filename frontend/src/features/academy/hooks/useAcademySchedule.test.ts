import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { getSchedule } = vi.hoisted(() => ({ getSchedule: vi.fn() }))
vi.mock('../api/academyApi', () => ({ academyApi: { getSchedule } }))

import { useAcademySchedule } from './useAcademySchedule'
import { academyKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.useRealTimers())

describe('useAcademySchedule', () => {
  it('forwards explicit date bounds and pagination', async () => {
    getSchedule.mockResolvedValue({ content: [] })
    const { result } = renderHookWithClient(() =>
      useAcademySchedule('a1', true, '2026-01-01', '2026-03-01', 1, 50),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getSchedule).toHaveBeenCalledWith('a1', '2026-01-01', '2026-03-01', 1, 50)
  })

  it('defaults to a -7d / +90d window when no dates are given', async () => {
    // Fake only Date so React Query's promise scheduling still uses real timers.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'))
    getSchedule.mockResolvedValue({ content: [] })

    const { result } = renderHookWithClient(() => useAcademySchedule('a1', true))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getSchedule).toHaveBeenCalledWith('a1', '2026-05-25', '2026-08-30', 0, 20)
  })

  it('composes the query key with bounds + pagination', () => {
    getSchedule.mockResolvedValue({})
    const { client } = renderHookWithClient(() =>
      useAcademySchedule('a1', true, '2026-01-01', '2026-03-01', 1, 50),
    )
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual([
      ...academyKeys.schedule('a1'),
      '2026-01-01',
      '2026-03-01',
      1,
      50,
    ])
  })

  it('does not fetch without an id or when disabled', () => {
    const a = renderHookWithClient(() => useAcademySchedule(undefined, true))
    const b = renderHookWithClient(() => useAcademySchedule('a1', false))
    expect(getSchedule).not.toHaveBeenCalled()
    expect(a.result.current.fetchStatus).toBe('idle')
    expect(b.result.current.fetchStatus).toBe('idle')
  })
})
