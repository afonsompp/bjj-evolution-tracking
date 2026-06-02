import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { join, leave } = vi.hoisted(() => ({ join: vi.fn(), leave: vi.fn() }))
vi.mock('../api/membersApi', () => ({ membersApi: { join, leave } }))

import { useJoinAcademy, useLeaveAcademy } from './useJoinAcademy'
import { memberKeys } from '../api/keys'

const ACADEMY = 'a1'
beforeEach(() => vi.clearAllMocks())

describe('useJoinAcademy', () => {
  it('joins then invalidates the academy members + all-members keys', async () => {
    join.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useJoinAcademy(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync()

    expect(join).toHaveBeenCalledWith(ACADEMY)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: memberKeys.byAcademy(ACADEMY) })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: memberKeys.all })
  })
})

describe('useLeaveAcademy', () => {
  it('leaves then invalidates the academy members + all-members keys', async () => {
    leave.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useLeaveAcademy(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync()

    expect(leave).toHaveBeenCalledWith(ACADEMY)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: memberKeys.byAcademy(ACADEMY) })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: memberKeys.all })
  })

  it('skips invalidation when there is no academy id', async () => {
    leave.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useLeaveAcademy(undefined))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync()

    expect(invalidate).not.toHaveBeenCalled()
  })
})
