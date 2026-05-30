import { useQuery } from '@tanstack/react-query'
import { membersApi } from '../api/membersApi'
import { memberKeys } from '../api/keys'
import type { MemberStatus } from '../../../types/api'

export function useAcademyMembers(
  academyId: string | undefined,
  opts: { query?: string; status?: MemberStatus; page?: number; size?: number; enabled?: boolean } = {},
) {
  const { query = '', status, page = 0, size = 20, enabled = true } = opts
  return useQuery({
    queryKey: academyId
      ? memberKeys.list(academyId, query, status, page)
      : memberKeys.list('__none__', query, status, page),
    queryFn: () => membersApi.list(academyId!, query, status, page, size),
    enabled: !!academyId && enabled,
  })
}
