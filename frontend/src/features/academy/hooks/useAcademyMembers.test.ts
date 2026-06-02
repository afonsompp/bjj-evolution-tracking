import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { list } = vi.hoisted(() => ({ list: vi.fn() }))
vi.mock('../api/membersApi', () => ({ membersApi: { list } }))

import { useAcademyMembers } from './useAcademyMembers'
import { memberKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())

describe('useAcademyMembers', () => {
  it('passes query/status/page/size through to membersApi.list', async () => {
    const page = { content: [] }
    list.mockResolvedValue(page)

    const { result } = renderHookWithClient(() =>
      useAcademyMembers('a1', { query: 'joao', status: 'ACTIVE', page: 2, size: 10 }),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(list).toHaveBeenCalledWith('a1', 'joao', 'ACTIVE', 2, 10)
    expect(result.current.data).toBe(page)
  })

  it('applies the default opts (empty query, page 0, size 20)', async () => {
    list.mockResolvedValue({})
    const { result } = renderHookWithClient(() => useAcademyMembers('a1'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(list).toHaveBeenCalledWith('a1', '', undefined, 0, 20)
  })

  it('keys the query by academy/query/status/page', () => {
    list.mockResolvedValue({})
    const { client } = renderHookWithClient(() =>
      useAcademyMembers('a1', { query: 'x', status: 'PENDING', page: 1 }),
    )
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(memberKeys.list('a1', 'x', 'PENDING', 1))
  })

  it('does not fetch without an academy id or when disabled', () => {
    const a = renderHookWithClient(() => useAcademyMembers(undefined))
    const b = renderHookWithClient(() => useAcademyMembers('a1', { enabled: false }))
    expect(list).not.toHaveBeenCalled()
    expect(a.result.current.fetchStatus).toBe('idle')
    expect(b.result.current.fetchStatus).toBe('idle')
  })
})
