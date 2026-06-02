import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { search } = vi.hoisted(() => ({ search: vi.fn() }))
vi.mock('../api/academyApi', () => ({ academyApi: { search } }))

import { useAcademySearch } from './useAcademySearch'
import { academyKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())

describe('useAcademySearch', () => {
  it('delegates to academyApi.search with query/page/size', async () => {
    const page = { content: [] }
    search.mockResolvedValue(page)

    const { result } = renderHookWithClient(() => useAcademySearch('gracie', 1, 15))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(search).toHaveBeenCalledWith('gracie', 1, 15)
    expect(result.current.data).toBe(page)
  })

  it('defaults size to 20', async () => {
    search.mockResolvedValue({})
    const { result } = renderHookWithClient(() => useAcademySearch('gracie', 0))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(search).toHaveBeenCalledWith('gracie', 0, 20)
  })

  it('keys the query by query + page (size is not part of the key)', () => {
    search.mockResolvedValue({})
    const { client } = renderHookWithClient(() => useAcademySearch('gracie', 3))
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(academyKeys.search('gracie', 3))
  })
})
