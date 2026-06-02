import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { list } = vi.hoisted(() => ({ list: vi.fn() }))
vi.mock('../api/techniqueApi', () => ({ techniqueApi: { list } }))

import { useTechniques, useTechniqueSearch } from './useTechniques'
import { techniqueKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())

describe('useTechniques', () => {
  it('lists techniques with query/page/size (default size 20) and keys by query+page', async () => {
    list.mockResolvedValue({ content: [] })
    const { result, client } = renderHookWithClient(() => useTechniques('arm', 1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(list).toHaveBeenCalledWith('arm', 1, 20)
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(techniqueKeys.list('arm', 1))
  })
})

describe('useTechniqueSearch (infinite)', () => {
  it('fetches the first page from pageParam 0 and exposes a next page when not last', async () => {
    list.mockResolvedValue({ content: [{ id: 1 }], last: false, number: 0 })
    const { result } = renderHookWithClient(() => useTechniqueSearch('arm', 10))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(list).toHaveBeenCalledWith('arm', 0, 10)
    expect(result.current.hasNextPage).toBe(true)
  })

  it('reports no next page when the page is the last one', async () => {
    list.mockResolvedValue({ content: [{ id: 1 }], last: true, number: 0 })
    const { result } = renderHookWithClient(() => useTechniqueSearch('arm', 10))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(false)
  })

  it('advances pageParam to number + 1 when fetching the next page', async () => {
    // Keyed by page so the result is stable regardless of how many times React
    // Query calls the queryFn (avoids the brittleness of mockResolvedValueOnce).
    list.mockImplementation((_q: string, page: number) =>
      Promise.resolve(
        page === 0
          ? { content: [{ id: 1 }], last: false, number: 0 }
          : { content: [{ id: 2 }], last: true, number: 1 },
      ),
    )
    const { result } = renderHookWithClient(() => useTechniqueSearch('arm', 10))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await result.current.fetchNextPage()

    // getNextPageParam derived the next param (number + 1 = 1) from the first
    // page and fed it back into the queryFn.
    await waitFor(() => expect(list).toHaveBeenCalledWith('arm', 1, 10))
  })
})
