import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { create } = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('../api/academyApi', () => ({ academyApi: { create } }))

import { useCreateAcademy } from './useCreateAcademy'
import { academyKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())

describe('useCreateAcademy', () => {
  it('creates an academy then invalidates the academy root key', async () => {
    create.mockResolvedValue({ id: 'a1' })
    const { result, client } = renderHookWithClient(() => useCreateAcademy())
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const body = { name: 'Evolution', address: 'Rua X' } as never
    await result.current.mutateAsync(body)

    expect(create).toHaveBeenCalledWith(body)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: academyKeys.all })
  })
})
