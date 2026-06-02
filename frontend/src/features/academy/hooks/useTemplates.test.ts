import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { listTemplates, getTemplate } = vi.hoisted(() => ({
  listTemplates: vi.fn(),
  getTemplate: vi.fn(),
}))
vi.mock('../api/academyApi', () => ({ academyApi: { listTemplates, getTemplate } }))

import { useTemplates, useTemplate } from './useTemplates'
import { academyKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())

describe('useTemplates', () => {
  it('lists templates for an academy page (default page 0)', async () => {
    listTemplates.mockResolvedValue({ content: [] })
    const { result } = renderHookWithClient(() => useTemplates('a1'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listTemplates).toHaveBeenCalledWith('a1', 0)
  })

  it('keys the query by academy templates + page', () => {
    listTemplates.mockResolvedValue({})
    const { client } = renderHookWithClient(() => useTemplates('a1', 3))
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual([...academyKeys.templates('a1'), 3])
  })

  it('does not fetch without an academy id', () => {
    const { result } = renderHookWithClient(() => useTemplates(undefined))
    expect(listTemplates).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useTemplate', () => {
  it('fetches a single template by id', async () => {
    const tpl = { id: 't1' }
    getTemplate.mockResolvedValue(tpl)
    const { result } = renderHookWithClient(() => useTemplate('a1', 't1'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getTemplate).toHaveBeenCalledWith('a1', 't1')
    expect(result.current.data).toBe(tpl)
  })

  it('does not fetch when academy or template id is missing', () => {
    const a = renderHookWithClient(() => useTemplate(undefined, 't1'))
    const b = renderHookWithClient(() => useTemplate('a1', undefined))
    expect(getTemplate).not.toHaveBeenCalled()
    expect(a.result.current.fetchStatus).toBe('idle')
    expect(b.result.current.fetchStatus).toBe('idle')
  })
})
