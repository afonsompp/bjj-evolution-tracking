import { vi, describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '../../test/queryWrapper'

const { getMe, upsertMe, uploadPhoto, removePhoto } = vi.hoisted(() => ({
  getMe: vi.fn(),
  upsertMe: vi.fn(),
  uploadPhoto: vi.fn(),
  removePhoto: vi.fn(),
}))
vi.mock('./api/profileApi', () => ({
  profileApi: { getMe, upsertMe, uploadPhoto, removePhoto },
}))

import {
  useProfile,
  useUpsertProfile,
  useUploadPhoto,
  useRemovePhoto,
  profileKeys,
} from './useProfile'

beforeEach(() => vi.clearAllMocks())

describe('useProfile', () => {
  it('fetches the current profile under the me key', async () => {
    const me = { id: 'u1', name: 'Afonso' }
    getMe.mockResolvedValue(me)
    const { result } = renderHookWithClient(() => useProfile())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getMe).toHaveBeenCalled()
    expect(result.current.data).toBe(me)
  })
})

describe('useUpsertProfile', () => {
  it('writes the upsert response straight into the me cache', async () => {
    const saved = { id: 'u1', name: 'Updated' }
    upsertMe.mockResolvedValue(saved)
    const { result, client } = renderHookWithClient(() => useUpsertProfile())

    await result.current.mutateAsync({ name: 'Updated' } as never)

    // upsertMe is passed to useMutation as a bare reference, so React Query
    // also hands it a context object as the 2nd arg — assert just the variables.
    expect(upsertMe.mock.calls[0][0]).toEqual({ name: 'Updated' })
    expect(client.getQueryData(profileKeys.me)).toBe(saved)
  })
})

describe('useUploadPhoto', () => {
  it('uploads a file and seeds the me cache with the response', async () => {
    const withPhoto = { id: 'u1', photoUrl: 'https://x/p.png' }
    uploadPhoto.mockResolvedValue(withPhoto)
    const { result, client } = renderHookWithClient(() => useUploadPhoto())

    const file = new File(['x'], 'p.png', { type: 'image/png' })
    await result.current.mutateAsync(file)

    expect(uploadPhoto).toHaveBeenCalledWith(file)
    expect(client.getQueryData(profileKeys.me)).toBe(withPhoto)
  })
})

describe('useRemovePhoto', () => {
  it('removes the photo and seeds the me cache with the response', async () => {
    const without = { id: 'u1', photoUrl: null }
    removePhoto.mockResolvedValue(without)
    const { result, client } = renderHookWithClient(() => useRemovePhoto())

    await result.current.mutateAsync(undefined as never)

    expect(removePhoto).toHaveBeenCalled()
    expect(client.getQueryData(profileKeys.me)).toBe(without)
  })
})
