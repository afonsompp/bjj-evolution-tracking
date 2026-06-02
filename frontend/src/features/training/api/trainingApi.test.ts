import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock the axios instance so the api module is exercised in isolation, without
// pulling in the client's interceptors (auth, Sentry, router).
const { get, post, put, del } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}))
vi.mock('../../../api/client', () => ({
  apiClient: { get, post, put, delete: del },
}))

import { trainingApi } from './trainingApi'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('trainingApi.list', () => {
  it('GETs /trainings with pagination + date params and unwraps data', async () => {
    const page = { content: [], totalElements: 0 }
    get.mockResolvedValue({ data: page })

    const result = await trainingApi.list(2, 20, '2026-01-01', '2026-12-31')

    expect(get).toHaveBeenCalledWith('/trainings', {
      params: { page: 2, size: 20, startDate: '2026-01-01', endDate: '2026-12-31' },
    })
    expect(result).toBe(page)
  })

  it('passes undefined date bounds through untouched', async () => {
    get.mockResolvedValue({ data: {} })
    await trainingApi.list(0, 10)
    expect(get).toHaveBeenCalledWith('/trainings', {
      params: { page: 0, size: 10, startDate: undefined, endDate: undefined },
    })
  })
})

describe('trainingApi.get', () => {
  it('GETs a single training by id and unwraps data', async () => {
    const training = { id: 7 }
    get.mockResolvedValue({ data: training })

    const result = await trainingApi.get(7)

    expect(get).toHaveBeenCalledWith('/trainings/7')
    expect(result).toBe(training)
  })
})

describe('trainingApi.create', () => {
  it('POSTs the body to /trainings and unwraps data', async () => {
    const body = { sessionDate: '2026-06-01' } as never
    const created = { id: 99 }
    post.mockResolvedValue({ data: created })

    const result = await trainingApi.create(body)

    expect(post).toHaveBeenCalledWith('/trainings', body)
    expect(result).toBe(created)
  })
})

describe('trainingApi.update', () => {
  it('PUTs the body to /trainings/:id and unwraps data', async () => {
    const body = { sessionDate: '2026-06-02' } as never
    const updated = { id: 5 }
    put.mockResolvedValue({ data: updated })

    const result = await trainingApi.update(5, body)

    expect(put).toHaveBeenCalledWith('/trainings/5', body)
    expect(result).toBe(updated)
  })
})

describe('trainingApi.remove', () => {
  it('DELETEs /trainings/:id and resolves to undefined', async () => {
    del.mockResolvedValue({ data: '' })

    const result = await trainingApi.remove(5)

    expect(del).toHaveBeenCalledWith('/trainings/5')
    expect(result).toBeUndefined()
  })
})
