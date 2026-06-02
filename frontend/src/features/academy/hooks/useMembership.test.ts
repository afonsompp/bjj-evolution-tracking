import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../api/membersApi', () => ({ membersApi: { get } }))

import { useMembership } from './useMembership'
import { memberKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())

describe('useMembership', () => {
  it('fetches a membership by academy + user and keys by both', async () => {
    const membership = { role: 'STUDENT', status: 'ACTIVE' }
    get.mockResolvedValue(membership)

    const { result, client } = renderHookWithClient(() => useMembership('a1', 'u9'))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(get).toHaveBeenCalledWith('a1', 'u9')
    expect(result.current.data).toBe(membership)
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(memberKeys.one('a1', 'u9'))
  })

  it('does not fetch when academy or user id is missing', () => {
    const a = renderHookWithClient(() => useMembership(undefined, 'u9'))
    const b = renderHookWithClient(() => useMembership('a1', undefined))
    expect(get).not.toHaveBeenCalled()
    expect(a.result.current.fetchStatus).toBe('idle')
    expect(b.result.current.fetchStatus).toBe('idle')
  })
})
