import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { getById } = vi.hoisted(() => ({ getById: vi.fn() }))
vi.mock('../api/academyApi', () => ({ academyApi: { getById } }))

import { useAcademy } from './useAcademy'
import { academyKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())

describe('useAcademy', () => {
  it('fetches the academy by id and returns its data', async () => {
    const academy = { id: 'a1', name: 'Evolution' }
    getById.mockResolvedValue(academy)

    const { result } = renderHookWithClient(() => useAcademy('a1'))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getById).toHaveBeenCalledWith('a1')
    expect(result.current.data).toBe(academy)
  })

  it('keys the query by academy id', () => {
    getById.mockResolvedValue({})
    const { client } = renderHookWithClient(() => useAcademy('a1'))
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(academyKeys.detail('a1'))
  })

  it('does not fetch when id is undefined', () => {
    const { result } = renderHookWithClient(() => useAcademy(undefined))
    expect(getById).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })
})
