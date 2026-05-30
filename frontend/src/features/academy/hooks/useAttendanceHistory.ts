import { useQuery } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { attendanceKeys } from '../api/keys'

/** A member's attendance history within one academy (instructor/owner, or self). */
export function useMemberAttendances(
  academyId: string | undefined,
  userId: string | undefined,
  page = 0,
  size = 20,
) {
  return useQuery({
    queryKey: attendanceKeys.byMember(academyId!, userId!, page),
    queryFn: () => academyApi.listMemberAttendances(academyId!, userId!, page, size),
    enabled: !!academyId && !!userId,
  })
}

/** The signed-in user's attendance history across all academies. */
export function useMyAllAttendances(userId: string | undefined, page = 0, size = 20) {
  return useQuery({
    queryKey: attendanceKeys.myAll(userId!, page),
    queryFn: () => academyApi.getMyAttendances(undefined, page, size),
    enabled: !!userId,
  })
}
