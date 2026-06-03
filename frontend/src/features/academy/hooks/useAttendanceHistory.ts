import { useQuery } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { attendanceKeys } from '../api/keys'

interface HistoryOpts {
  page?: number
  size?: number
  startDate?: string
  endDate?: string
  enabled?: boolean
}

/** A member's attendance history within one academy (instructor/owner, or self). */
export function useMemberAttendances(
  academyId: string | undefined,
  userId: string | undefined,
  { page = 0, size = 20, startDate, endDate, enabled = true }: HistoryOpts = {},
) {
  return useQuery({
    queryKey: attendanceKeys.byMember(academyId!, userId!, page, size, startDate, endDate),
    queryFn: () =>
      academyApi.listMemberAttendances(academyId!, userId!, page, size, startDate, endDate),
    enabled: !!academyId && !!userId && enabled,
  })
}

/** The signed-in user's attendance history across all academies. */
export function useMyAllAttendances(
  userId: string | undefined,
  { page = 0, size = 20, startDate, endDate, enabled = true }: HistoryOpts = {},
) {
  return useQuery({
    queryKey: attendanceKeys.myAll(userId!, page, size, startDate, endDate),
    queryFn: () => academyApi.getMyAttendances(undefined, page, size, startDate, endDate),
    enabled: !!userId && enabled,
  })
}
