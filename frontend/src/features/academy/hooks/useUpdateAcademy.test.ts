import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { update } = vi.hoisted(() => ({ update: vi.fn() }))
vi.mock('../api/academyApi', () => ({ academyApi: { update } }))

import { useUpdateAcademy } from './useUpdateAcademy'
import { academyKeys } from '../api/keys'

const ACADEMY = 'a1'
beforeEach(() => vi.clearAllMocks())

describe('useUpdateAcademy', () => {
  it('updates, seeds the detail cache with the response, and invalidates root', async () => {
    const updated = { id: ACADEMY, name: 'New Name' }
    update.mockResolvedValue(updated)
    const { result, client } = renderHookWithClient(() => useUpdateAcademy(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const setData = vi.spyOn(client, 'setQueryData')

    const body = { name: 'New Name', address: 'Rua Y' } as never
    await result.current.mutateAsync(body)

    expect(update).toHaveBeenCalledWith(ACADEMY, body)
    expect(setData).toHaveBeenCalledWith(academyKeys.detail(ACADEMY), updated)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: academyKeys.all })
    // The detail cache should now hold the fresh academy without a refetch.
    expect(client.getQueryData(academyKeys.detail(ACADEMY))).toBe(updated)
  })

  it('skips cache writes when there is no academy id', async () => {
    update.mockResolvedValue({ id: 'x' })
    const { result, client } = renderHookWithClient(() => useUpdateAcademy(undefined))
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const setData = vi.spyOn(client, 'setQueryData')

    await result.current.mutateAsync({} as never)

    expect(setData).not.toHaveBeenCalled()
    expect(invalidate).not.toHaveBeenCalled()
  })
})
