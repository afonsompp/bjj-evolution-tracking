import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { list, get } = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn() }))
vi.mock('../api/trainingApi', () => ({
  trainingApi: { list, get },
}))

import { useTrainings, useTraining } from './useTrainings'
import { trainingKeys } from '../api/keys'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTrainings', () => {
  it('delegates to trainingApi.list with the same args and returns the data', async () => {
    const page = { content: [{ id: 1 }], totalElements: 1 }
    list.mockResolvedValue(page)

    const { result } = renderHookWithClient(() =>
      useTrainings(1, 20, '2026-01-01', '2026-12-31'),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(list).toHaveBeenCalledWith(1, 20, '2026-01-01', '2026-12-31')
    expect(result.current.data).toBe(page)
  })

  it('keys the query by page/size/date so distinct filters cache separately', () => {
    const { client } = renderHookWithClient(() => useTrainings(2, 10, '2026-01-01'))
    list.mockResolvedValue({})
    // The query registered under the composed key exists in the cache.
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(trainingKeys.list(2, 10, '2026-01-01', undefined))
  })
})

describe('useTraining', () => {
  it('fetches by id when enabled', async () => {
    const training = { id: 9 }
    get.mockResolvedValue(training)

    const { result } = renderHookWithClient(() => useTraining('9'))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(get).toHaveBeenCalledWith('9')
    expect(result.current.data).toBe(training)
  })

  it('does not fetch when id is undefined', () => {
    const { result } = renderHookWithClient(() => useTraining(undefined))
    expect(get).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('does not fetch when explicitly disabled, even with an id', () => {
    const { result } = renderHookWithClient(() => useTraining('9', false))
    expect(get).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })
})
