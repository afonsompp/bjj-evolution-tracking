import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { create, update, remove } = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
vi.mock('../api/trainingApi', () => ({
  trainingApi: { create, update, remove },
}))

import { useCreateTraining, useUpdateTraining, useDeleteTraining } from './useManageTraining'
import { trainingKeys } from '../api/keys'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useCreateTraining', () => {
  it('creates then invalidates the list and dashboard caches', async () => {
    create.mockResolvedValue({ id: 1 })
    const { result, client } = renderHookWithClient(() => useCreateTraining())
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const body = { sessionDate: '2026-06-01' } as never
    await result.current.mutateAsync(body)

    expect(create).toHaveBeenCalledWith(body)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: trainingKeys.all })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: trainingKeys.dashboard })
  })
})

describe('useUpdateTraining', () => {
  it('updates then invalidates list, dashboard, and the single-item cache', async () => {
    update.mockResolvedValue({ id: 5 })
    const { result, client } = renderHookWithClient(() => useUpdateTraining('5'))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const body = { sessionDate: '2026-06-02' } as never
    await result.current.mutateAsync(body)

    expect(update).toHaveBeenCalledWith('5', body)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: trainingKeys.all })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: trainingKeys.dashboard })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: trainingKeys.one('5') })
  })

  it('skips the single-item invalidation when there is no id', async () => {
    update.mockResolvedValue({ id: 0 })
    const { result, client } = renderHookWithClient(() => useUpdateTraining(undefined))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync({} as never)

    const invalidatedKeys = invalidate.mock.calls.map((c) => c[0]?.queryKey)
    expect(invalidatedKeys).toContainEqual(trainingKeys.all)
    expect(invalidatedKeys).toContainEqual(trainingKeys.dashboard)
    expect(invalidatedKeys).not.toContainEqual(trainingKeys.one('__none__'))
  })
})

describe('useDeleteTraining', () => {
  it('removes then invalidates the list and dashboard caches', async () => {
    remove.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useDeleteTraining())
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync(42)

    expect(remove).toHaveBeenCalledWith(42)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: trainingKeys.all })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: trainingKeys.dashboard })
  })
})
