import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../api/dashboardApi', () => ({ dashboardApi: { get } }))

import { useDashboard, dashboardKeys } from './useDashboard'

beforeEach(() => vi.clearAllMocks())

describe('useDashboard', () => {
  it('fetches metrics for the given day window and keys by days', async () => {
    const metrics = { sessions: 12 }
    get.mockResolvedValue(metrics)

    const { result, client } = renderHookWithClient(() => useDashboard(30))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(get).toHaveBeenCalledWith(30)
    expect(result.current.data).toBe(metrics)
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(dashboardKeys.byDays(30))
  })

  it('keys distinct day windows separately', () => {
    get.mockResolvedValue({})
    const { client } = renderHookWithClient(() => useDashboard(7))
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(dashboardKeys.byDays(7))
    expect(keys).not.toContainEqual(dashboardKeys.byDays(30))
  })
})
