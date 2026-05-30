import { apiClient } from '../../../api/client'
import type { ProfileRequest, ProfileResponse } from '../../../types/api'

export const profileApi = {
  getMe: () =>
    apiClient.get<ProfileResponse>('/profiles').then((r) => r.data),

  upsertMe: (body: ProfileRequest) =>
    apiClient.post<ProfileResponse>('/profiles', body).then((r) => r.data),

  uploadPhoto: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<ProfileResponse>('/profiles/photo', form).then((r) => r.data)
  },

  removePhoto: () =>
    apiClient.delete<ProfileResponse>('/profiles/photo').then((r) => r.data),
}
