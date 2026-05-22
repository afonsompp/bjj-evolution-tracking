import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi } from './api/profileApi'

export const profileKeys = {
  me: ['profile'] as const,
}

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: profileApi.getMe,
    retry: false,
  })
}

export function useUpsertProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: profileApi.upsertMe,
    onSuccess: (data) => {
      qc.setQueryData(profileKeys.me, data)
    },
  })
}
