import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { createClass, updateClass, cancelClass } = vi.hoisted(() => ({
  createClass: vi.fn(),
  updateClass: vi.fn(),
  cancelClass: vi.fn(),
}))
vi.mock('../api/academyApi', () => ({
  academyApi: { createClass, updateClass, cancelClass },
}))

import { useCreateClass, useUpdateClass, useCancelClass } from './useClassMutations'
import { academyKeys } from '../api/keys'

const ACADEMY = 'a1'
const CLASSES_KEY = { queryKey: academyKeys.classes(ACADEMY) }
const SCHEDULE_KEY = { queryKey: academyKeys.schedule(ACADEMY) }
beforeEach(() => vi.clearAllMocks())

describe('useCreateClass', () => {
  it('creates then invalidates classes + schedule', async () => {
    createClass.mockResolvedValue({ id: 1 })
    const { result, client } = renderHookWithClient(() => useCreateClass(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const body = { title: 'Fundamentals' } as never
    await result.current.mutateAsync(body)

    expect(createClass).toHaveBeenCalledWith(ACADEMY, body)
    expect(invalidate).toHaveBeenCalledWith(CLASSES_KEY)
    expect(invalidate).toHaveBeenCalledWith(SCHEDULE_KEY)
  })
})

describe('useUpdateClass', () => {
  it('updates a class by id then invalidates classes + schedule', async () => {
    updateClass.mockResolvedValue({ id: 5 })
    const { result, client } = renderHookWithClient(() => useUpdateClass(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const body = { title: 'Advanced' } as never
    await result.current.mutateAsync({ classId: 5, body })

    expect(updateClass).toHaveBeenCalledWith(ACADEMY, 5, body)
    expect(invalidate).toHaveBeenCalledWith(CLASSES_KEY)
    expect(invalidate).toHaveBeenCalledWith(SCHEDULE_KEY)
  })
})

describe('useCancelClass', () => {
  it('cancels a class then invalidates classes + schedule', async () => {
    cancelClass.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useCancelClass(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync(9)

    expect(cancelClass).toHaveBeenCalledWith(ACADEMY, 9)
    expect(invalidate).toHaveBeenCalledWith(CLASSES_KEY)
    expect(invalidate).toHaveBeenCalledWith(SCHEDULE_KEY)
  })
})
