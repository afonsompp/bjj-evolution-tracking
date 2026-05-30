import { useQuery } from '@tanstack/react-query'
import { membersApi } from '../api/membersApi'
import { memberKeys } from '../api/keys'

export function useMembership(
  academyId: string | undefined,
  userId: string | undefined,
) {
  return useQuery({
    queryKey:
      academyId && userId
        ? memberKeys.one(academyId, userId)
        : memberKeys.one('__none__', '__none__'),
    queryFn: () => membersApi.get(academyId!, userId!),
    enabled: !!academyId && !!userId,
    retry: false,
  })
}
