import { useMutation, useQueryClient } from '@tanstack/react-query'
import { membersApi } from '../api/membersApi'
import { memberKeys } from '../api/keys'

export function useJoinAcademy(academyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => membersApi.join(academyId!),
    onSuccess: () => {
      if (!academyId) return
      qc.invalidateQueries({ queryKey: memberKeys.byAcademy(academyId) })
      qc.invalidateQueries({ queryKey: memberKeys.all })
    },
  })
}

export function useLeaveAcademy(academyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => membersApi.leave(academyId!),
    onSuccess: () => {
      if (!academyId) return
      qc.invalidateQueries({ queryKey: memberKeys.byAcademy(academyId) })
      qc.invalidateQueries({ queryKey: memberKeys.all })
    },
  })
}
