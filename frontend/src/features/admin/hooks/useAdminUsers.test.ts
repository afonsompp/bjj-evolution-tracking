import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { searchUsers, updateUserRole } = vi.hoisted(() => ({
  searchUsers: vi.fn(),
  updateUserRole: vi.fn(),
}))
vi.mock('../api/adminApi', () => ({ adminApi: { searchUsers, updateUserRole } }))

import { useAdminUserSearch, useUpdateUserRole, adminKeys } from './useAdminUsers'

beforeEach(() => vi.clearAllMocks())

describe('useAdminUserSearch', () => {
  it('searches users with query/page/size (default size 20) and keys by query+page', async () => {
    searchUsers.mockResolvedValue({ content: [] })
    const { result, client } = renderHookWithClient(() => useAdminUserSearch('ana', 1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(searchUsers).toHaveBeenCalledWith('ana', 1, 20)
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(adminKeys.search('ana', 1))
  })
})

describe('useUpdateUserRole', () => {
  it('updates the role then invalidates all admin-user queries', async () => {
    updateUserRole.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useUpdateUserRole())
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync({ userId: 'u9', role: 'ADMIN' })

    expect(updateUserRole).toHaveBeenCalledWith('u9', 'ADMIN')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: adminKeys.all })
  })
})
