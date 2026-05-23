import { useQuery } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { attendanceKeys } from '../api/keys'

export function useClassAttendance(
  academyId: string | undefined,
  classId: number | undefined,
) {
  return useQuery({
    queryKey: attendanceKeys.forClass(classId ?? 0),
    queryFn: () => academyApi.listAttendances(academyId!, classId!),
    enabled: !!academyId && !!classId,
  })
}

export function useMyAttendances(academyId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.myAttendances(academyId),
    queryFn: () => academyApi.getMyAttendances(academyId),
    enabled: !!academyId && enabled,
  })
}
