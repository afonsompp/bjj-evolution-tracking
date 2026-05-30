import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/adminApi'
import type { UserRole } from '../../../types/api'

export const adminKeys = {
  all: ['admin', 'users'] as const,
  search: (query: string, page: number) => ['admin', 'users', 'search', query, page] as const,
}

export function useAdminUserSearch(query: string, page: number, size = 20) {
  return useQuery({
    queryKey: adminKeys.search(query, page),
    queryFn: () => adminApi.searchUsers(query, page, size),
  })
}

export function useUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      // Re-fetch the current search so the row reflects the new role.
      qc.invalidateQueries({ queryKey: adminKeys.all })
    },
  })
}
