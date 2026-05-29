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

export function useUploadPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadPhoto(file),
    onSuccess: (data) => {
      qc.setQueryData(profileKeys.me, data)
    },
  })
}

export function useRemovePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: profileApi.removePhoto,
    onSuccess: (data) => {
      qc.setQueryData(profileKeys.me, data)
    },
  })
}
