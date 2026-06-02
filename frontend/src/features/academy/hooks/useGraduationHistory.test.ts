import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../../test/queryWrapper'

const { listGraduations, listMyGraduations, listAllMyGraduations } = vi.hoisted(() => ({
  listGraduations: vi.fn(),
  listMyGraduations: vi.fn(),
  listAllMyGraduations: vi.fn(),
}))
vi.mock('../api/membersApi', () => ({
  membersApi: { listGraduations, listMyGraduations, listAllMyGraduations },
}))

import {
  useAcademyGraduations,
  useMyGraduations,
  useMyAllGraduations,
} from './useGraduationHistory'
import { memberKeys } from '../api/keys'

beforeEach(() => vi.clearAllMocks())

describe('useAcademyGraduations', () => {
  it('lists academy graduations and keys by academy + page', async () => {
    listGraduations.mockResolvedValue({ content: [] })
    const { result, client } = renderHookWithClient(() => useAcademyGraduations('a1', 2, 10))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listGraduations).toHaveBeenCalledWith('a1', 2, 10)
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(memberKeys.graduations('a1', 2))
  })

  it('does not fetch without an academy id', () => {
    const { result } = renderHookWithClient(() => useAcademyGraduations(undefined))
    expect(listGraduations).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useMyGraduations', () => {
  it('lists my graduations within an academy', async () => {
    listMyGraduations.mockResolvedValue({ content: [] })
    const { result } = renderHookWithClient(() => useMyGraduations('a1', 'u9', 1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listMyGraduations).toHaveBeenCalledWith('a1', 'u9', 1, 20)
  })

  it('does not fetch without academy or user id', () => {
    const a = renderHookWithClient(() => useMyGraduations(undefined, 'u9'))
    const b = renderHookWithClient(() => useMyGraduations('a1', undefined))
    expect(listMyGraduations).not.toHaveBeenCalled()
    expect(a.result.current.fetchStatus).toBe('idle')
    expect(b.result.current.fetchStatus).toBe('idle')
  })
})

describe('useMyAllGraduations', () => {
  it('lists my graduations across all academies', async () => {
    listAllMyGraduations.mockResolvedValue({ content: [] })
    const { result, client } = renderHookWithClient(() => useMyAllGraduations('u9', 1, 25))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listAllMyGraduations).toHaveBeenCalledWith(1, 25)
    const keys = client.getQueryCache().getAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(memberKeys.myGraduationsAll('u9', 1))
  })

  it('does not fetch without a user id', () => {
    const { result } = renderHookWithClient(() => useMyAllGraduations(undefined))
    expect(listAllMyGraduations).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })
})
