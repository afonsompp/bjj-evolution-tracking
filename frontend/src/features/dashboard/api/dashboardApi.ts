import { apiClient } from '../../../api/client'
import type { DashboardResponse } from '../../../types/api'

export const dashboardApi = {
  get: (days: number) =>
    apiClient
      .get<DashboardResponse>('/trainings/dashboard', { params: { days } })
      .then((r) => r.data),
}
