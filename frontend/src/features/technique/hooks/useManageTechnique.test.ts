import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { create, update, remove } = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
vi.mock('../api/techniqueApi', () => ({ techniqueApi: { create, update, remove } }))

import {
  useCreateTechnique,
  useUpdateTechnique,
  useDeleteTechnique,
} from './useManageTechnique'
import { techniqueKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())

describe('useCreateTechnique', () => {
  it('creates then invalidates the techniques root key', async () => {
    create.mockResolvedValue({ id: 1 })
    const { result, client } = renderHookWithClient(() => useCreateTechnique())
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const body = { name: 'Armbar' } as never
    await result.current.mutateAsync(body)

    expect(create).toHaveBeenCalledWith(body)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: techniqueKeys.all })
  })
})

describe('useUpdateTechnique', () => {
  it('updates by id then invalidates the techniques root key', async () => {
    update.mockResolvedValue({ id: 5 })
    const { result, client } = renderHookWithClient(() => useUpdateTechnique())
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const body = { name: 'Kimura' } as never
    await result.current.mutateAsync({ id: 5, body })

    expect(update).toHaveBeenCalledWith(5, body)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: techniqueKeys.all })
  })
})

describe('useDeleteTechnique', () => {
  it('removes by id then invalidates the techniques root key', async () => {
    remove.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useDeleteTechnique())
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync(7)

    expect(remove).toHaveBeenCalledWith(7)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: techniqueKeys.all })
  })
})
