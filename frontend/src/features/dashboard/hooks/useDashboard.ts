import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboardApi'

export const dashboardKeys = {
  byDays: (days: number) => ['dashboard', days] as const,
}

export function useDashboard(days: number) {
  return useQuery({
    queryKey: dashboardKeys.byDays(days),
    queryFn: () => dashboardApi.get(days),
  })
}
