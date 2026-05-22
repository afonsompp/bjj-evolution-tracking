import { apiClient } from '../../../api/client'
import type { ProfileRequest, ProfileResponse } from '../../../types/api'

export const profileApi = {
  getMe: () =>
    apiClient.get<ProfileResponse>('/profiles').then((r) => r.data),

  upsertMe: (body: ProfileRequest) =>
    apiClient.post<ProfileResponse>('/profiles', body).then((r) => r.data),
}
