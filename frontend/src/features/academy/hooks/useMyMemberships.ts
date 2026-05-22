import { useQuery } from '@tanstack/react-query'
import { membersApi } from '../api/membersApi'
import { memberKeys } from '../api/keys'
import type { MemberStatus } from '../../../types/api'

export function useMyMemberships(status?: MemberStatus, page = 0, size = 50) {
  return useQuery({
    queryKey: memberKeys.myMemberships(status),
    queryFn: () => membersApi.listMine(status, page, size),
  })
}
