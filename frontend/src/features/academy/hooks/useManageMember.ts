import { useMutation, useQueryClient } from '@tanstack/react-query'
import { membersApi } from '../api/membersApi'
import { memberKeys } from '../api/keys'

export function useApproveMember(academyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => membersApi.approve(academyId!, userId),
    onSuccess: () => {
      if (!academyId) return
      qc.invalidateQueries({ queryKey: memberKeys.byAcademy(academyId) })
    },
  })
}

export function useRejectMember(academyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => membersApi.remove(academyId!, userId),
    onSuccess: () => {
      if (!academyId) return
      qc.invalidateQueries({ queryKey: memberKeys.byAcademy(academyId) })
    },
  })
}
