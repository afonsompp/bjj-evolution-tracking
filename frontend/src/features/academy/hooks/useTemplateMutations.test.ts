import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHookWithClient } from '../../../test/queryWrapper'

const {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateFromTemplate,
} = vi.hoisted(() => ({
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  generateFromTemplate: vi.fn(),
}))
vi.mock('../api/academyApi', () => ({
  academyApi: { createTemplate, updateTemplate, deleteTemplate, generateFromTemplate },
}))

import {
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useGenerateFromTemplate,
} from './useTemplateMutations'
import { academyKeys } from '../api/keys'

const ACADEMY = 'a1'
beforeEach(() => vi.clearAllMocks())

describe('useCreateTemplate', () => {
  it('creates a template then invalidates the templates list', async () => {
    createTemplate.mockResolvedValue({ id: 't1' })
    const { result, client } = renderHookWithClient(() => useCreateTemplate(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const body = { name: 'Weekly' } as never
    await result.current.mutateAsync(body)

    expect(createTemplate).toHaveBeenCalledWith(ACADEMY, body)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: academyKeys.templates(ACADEMY) })
  })
})

describe('useUpdateTemplate', () => {
  it('updates a template by id then invalidates the templates list', async () => {
    updateTemplate.mockResolvedValue({ id: 't1' })
    const { result, client } = renderHookWithClient(() => useUpdateTemplate(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const body = { name: 'Updated' } as never
    await result.current.mutateAsync({ templateId: 't1', body })

    expect(updateTemplate).toHaveBeenCalledWith(ACADEMY, 't1', body)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: academyKeys.templates(ACADEMY) })
  })
})

describe('useDeleteTemplate', () => {
  it('deletes a template then invalidates the templates list', async () => {
    deleteTemplate.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useDeleteTemplate(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync('t1')

    expect(deleteTemplate).toHaveBeenCalledWith(ACADEMY, 't1')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: academyKeys.templates(ACADEMY) })
  })
})

describe('useGenerateFromTemplate', () => {
  it('generates classes then invalidates classes + schedule (not templates)', async () => {
    generateFromTemplate.mockResolvedValue({ count: 4 })
    const { result, client } = renderHookWithClient(() => useGenerateFromTemplate(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const body = { from: '2026-01-01', to: '2026-02-01' } as never
    await result.current.mutateAsync({ templateId: 't1', body })

    expect(generateFromTemplate).toHaveBeenCalledWith(ACADEMY, 't1', body)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: academyKeys.classes(ACADEMY) })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: academyKeys.schedule(ACADEMY) })
    const invalidated = invalidate.mock.calls.map((c) => c[0]?.queryKey)
    expect(invalidated).not.toContainEqual(academyKeys.templates(ACADEMY))
  })
})
