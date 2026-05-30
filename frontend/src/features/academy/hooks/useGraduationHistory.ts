import { useQuery } from '@tanstack/react-query'
import { membersApi } from '../api/membersApi'
import { memberKeys } from '../api/keys'

export function useAcademyGraduations(academyId: string | undefined, page = 0, size = 20) {
  return useQuery({
    queryKey: memberKeys.graduations(academyId!, page),
    queryFn: () => membersApi.listGraduations(academyId!, page, size),
    enabled: !!academyId,
  })
}

export function useMyGraduations(academyId: string | undefined, userId: string | undefined, page = 0, size = 20) {
  return useQuery({
    queryKey: memberKeys.myGraduations(academyId!, userId!, page),
    queryFn: () => membersApi.listMyGraduations(academyId!, userId!, page, size),
    enabled: !!academyId && !!userId,
  })
}

export function useMyAllGraduations(userId: string | undefined, page = 0, size = 20) {
  return useQuery({
    queryKey: memberKeys.myGraduationsAll(userId!, page),
    queryFn: () => membersApi.listAllMyGraduations(page, size),
    enabled: !!userId,
  })
}
