import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { listMine } = vi.hoisted(() => ({ listMine: vi.fn() }))
vi.mock('../api/membersApi', () => ({ membersApi: { listMine } }))

import { useMyMemberships } from './useMyMemberships'
import { memberKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())

describe('useMyMemberships', () => {
  it('lists my memberships with status filter + pagination', async () => {
    listMine.mockResolvedValue([])
    const { result } = renderHookWithClient(() => useMyMemberships('ACTIVE', 1, 100))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listMine).toHaveBeenCalledWith('ACTIVE', 1, 100)
  })

  it('defaults to no status, page 0, size 50', async () => {
    listMine.mockResolvedValue([])
    const { result } = renderHookWithClient(() => useMyMemberships())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listMine).toHaveBeenCalledWith(undefined, 0, 50)
  })

  it('keys the query by status only', () => {
    listMine.mockResolvedValue([])
    const { client } = renderHookWithClient(() => useMyMemberships('PENDING'))
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(memberKeys.myMemberships('PENDING'))
  })
})
