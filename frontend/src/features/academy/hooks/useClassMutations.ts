import { useMutation, useQueryClient } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { academyKeys } from '../api/keys'
import type { ScheduledClassRequest } from '../../../types/api'

export function useCreateClass(academyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ScheduledClassRequest) => academyApi.createClass(academyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academyKeys.classes(academyId) })
      qc.invalidateQueries({ queryKey: academyKeys.schedule(academyId) })
    },
  })
}

export function useUpdateClass(academyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ classId, body }: { classId: number; body: ScheduledClassRequest }) =>
      academyApi.updateClass(academyId, classId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academyKeys.classes(academyId) })
      qc.invalidateQueries({ queryKey: academyKeys.schedule(academyId) })
    },
  })
}

export function useCancelClass(academyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (classId: number) => academyApi.cancelClass(academyId, classId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academyKeys.classes(academyId) })
      qc.invalidateQueries({ queryKey: academyKeys.schedule(academyId) })
    },
  })
}
