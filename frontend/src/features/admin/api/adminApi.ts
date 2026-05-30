import { apiClient } from '../../../api/client'
import type { AdminUserResponse, Page, ProfileResponse, UserRole } from '../../../types/api'

export const adminApi = {
  searchUsers: (query: string | undefined, page: number, size: number) =>
    apiClient
      .get<Page<AdminUserResponse>>('/admin/users', {
        params: { query: query || undefined, page, size },
      })
      .then((r) => r.data),

  updateUserRole: (userId: string, role: UserRole) =>
    apiClient
      .patch<ProfileResponse>(`/profiles/${userId}/role`, { role })
      .then((r) => r.data),
}
