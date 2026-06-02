import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { approve, reject, graduate, updateMember } = vi.hoisted(() => ({
  approve: vi.fn(),
  reject: vi.fn(),
  graduate: vi.fn(),
  updateMember: vi.fn(),
}))
vi.mock('../api/membersApi', () => ({
  membersApi: { approve, reject, graduate, updateMember },
}))

import {
  useApproveMember,
  useRejectMember,
  useGraduateMember,
  useChangeRole,
} from './useManageMember'
import { memberKeys } from '../api/keys'

const ACADEMY = 'a1'
beforeEach(() => vi.clearAllMocks())

describe('useApproveMember', () => {
  it('approves a member then invalidates the academy members key', async () => {
    approve.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useApproveMember(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync('u9')

    expect(approve).toHaveBeenCalledWith(ACADEMY, 'u9')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: memberKeys.byAcademy(ACADEMY) })
  })

  it('skips invalidation without an academy id', async () => {
    approve.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useApproveMember(undefined))
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await result.current.mutateAsync('u9')
    expect(invalidate).not.toHaveBeenCalled()
  })
})

describe('useRejectMember', () => {
  it('rejects a member then invalidates the academy members key', async () => {
    reject.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useRejectMember(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync('u9')

    expect(reject).toHaveBeenCalledWith(ACADEMY, 'u9')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: memberKeys.byAcademy(ACADEMY) })
  })
})

describe('useGraduateMember', () => {
  it('graduates a member with belt/stripe body then invalidates', async () => {
    graduate.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useGraduateMember(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const body = { belt: 'BLUE', stripe: 0 } as never
    await result.current.mutateAsync({ userId: 'u9', body })

    expect(graduate).toHaveBeenCalledWith(ACADEMY, 'u9', body)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: memberKeys.byAcademy(ACADEMY) })
  })
})

describe('useChangeRole', () => {
  it('updates a member role then invalidates', async () => {
    updateMember.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useChangeRole(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const body = { role: 'INSTRUCTOR' } as never
    await result.current.mutateAsync({ userId: 'u9', body })

    expect(updateMember).toHaveBeenCalledWith(ACADEMY, 'u9', body)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: memberKeys.byAcademy(ACADEMY) })
  })
})
