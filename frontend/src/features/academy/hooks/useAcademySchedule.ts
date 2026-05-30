import { useQuery } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { academyKeys } from '../api/keys'

export function useAcademySchedule(
  id: string | undefined,
  enabled: boolean,
  startDate?: string,
  endDate?: string,
  page = 0,
  size = 20,
) {
  return useQuery({
    queryKey: id
      ? [...academyKeys.schedule(id), startDate ?? '', endDate ?? '', page, size]
      : academyKeys.schedule('__none__'),
    queryFn: () => {
      const start = startDate
        ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const end = endDate
        ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      return academyApi.getSchedule(id!, start, end, page, size)
    },
    enabled: !!id && enabled,
  })
}
