import { apiClient } from '../../../api/client'
import type {
  AcademyRequest,
  AcademyResponse,
  Page,
  ScheduledClassResponse,
} from '../../../types/api'

export const academyApi = {
  search: (query: string | undefined, page: number, size: number) =>
    apiClient
      .get<Page<AcademyResponse>>('/academies/search', {
        params: { query: query || undefined, page, size },
      })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<AcademyResponse>(`/academies/${id}`).then((r) => r.data),

  update: (id: string, body: AcademyRequest) =>
    apiClient.put<AcademyResponse>(`/academies/${id}`, body).then((r) => r.data),

  getSchedule: (id: string, startDate: string, endDate: string, size = 20) =>
    apiClient
      .get<Page<ScheduledClassResponse>>(`/academies/${id}/classes`, {
        params: { startDate, endDate, size },
      })
      .then((r) => r.data),
}
