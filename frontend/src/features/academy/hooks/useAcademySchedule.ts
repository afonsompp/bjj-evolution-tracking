import { useQuery } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { academyKeys } from '../api/keys'

export function useAcademySchedule(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: id ? academyKeys.schedule(id) : academyKeys.schedule('__none__'),
    queryFn: () => {
      const start = new Date().toISOString().slice(0, 10)
      const end = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      return academyApi.getSchedule(id!, start, end)
    },
    enabled: !!id && enabled,
  })
}
