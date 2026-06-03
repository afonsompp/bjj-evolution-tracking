import { useMutation, useQueryClient } from '@tanstack/react-query'
import { membersApi } from '../api/membersApi'
import { memberKeys } from '../api/keys'
import type { AcademyMemberRequest, GraduationRequest } from '../../../types/api'

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
    mutationFn: (userId: string) => membersApi.reject(academyId!, userId),
    onSuccess: () => {
      if (!academyId) return
      qc.invalidateQueries({ queryKey: memberKeys.byAcademy(academyId) })
    },
  })
}

export function useRemoveMember(academyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => membersApi.remove(academyId!, userId),
    onSuccess: () => {
      if (!academyId) return
      qc.invalidateQueries({ queryKey: memberKeys.byAcademy(academyId) })
    },
  })
}

export function useGraduateMember(academyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: GraduationRequest }) =>
      membersApi.graduate(academyId!, userId, body),
    onSuccess: () => {
      if (!academyId) return
      qc.invalidateQueries({ queryKey: memberKeys.byAcademy(academyId) })
    },
  })
}

export function useChangeRole(academyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: AcademyMemberRequest }) =>
      membersApi.updateMember(academyId!, userId, body),
    onSuccess: () => {
      if (!academyId) return
      qc.invalidateQueries({ queryKey: memberKeys.byAcademy(academyId) })
    },
  })
}
