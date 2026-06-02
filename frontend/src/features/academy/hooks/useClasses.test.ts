import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { listClasses, getClass } = vi.hoisted(() => ({
  listClasses: vi.fn(),
  getClass: vi.fn(),
}))
vi.mock('../api/academyApi', () => ({ academyApi: { listClasses, getClass } }))

import { useClasses, useClass } from './useClasses'
import { academyKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())

describe('useClasses', () => {
  it('lists classes with bounds + pagination (default size 30)', async () => {
    listClasses.mockResolvedValue({ content: [] })
    const { result } = renderHookWithClient(() =>
      useClasses('a1', { startDate: '2026-01-01', endDate: '2026-02-01', page: 1 }),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listClasses).toHaveBeenCalledWith('a1', '2026-01-01', '2026-02-01', 1, 30)
  })

  it('keys the query by academy + bounds + page', () => {
    listClasses.mockResolvedValue({})
    const { client } = renderHookWithClient(() =>
      useClasses('a1', { startDate: '2026-01-01', endDate: '2026-02-01', page: 1 }),
    )
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual([
      ...academyKeys.classes('a1'),
      '2026-01-01',
      '2026-02-01',
      1,
    ])
  })

  it('does not fetch without an academy id', () => {
    const { result } = renderHookWithClient(() => useClasses(undefined))
    expect(listClasses).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useClass', () => {
  it('fetches a single class by id', async () => {
    const cls = { id: 5 }
    getClass.mockResolvedValue(cls)
    const { result } = renderHookWithClient(() => useClass('a1', '5'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getClass).toHaveBeenCalledWith('a1', '5')
    expect(result.current.data).toBe(cls)
  })

  it('does not fetch when academy or class id is missing', () => {
    const a = renderHookWithClient(() => useClass(undefined, '5'))
    const b = renderHookWithClient(() => useClass('a1', undefined))
    expect(getClass).not.toHaveBeenCalled()
    expect(a.result.current.fetchStatus).toBe('idle')
    expect(b.result.current.fetchStatus).toBe('idle')
  })
})
