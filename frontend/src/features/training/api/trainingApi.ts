import { apiClient } from '../../../api/client'
import type {
  Page,
  TrainingRequest,
  TrainingResponse,
} from '../../../types/api'

export const trainingApi = {
  list: (page: number, size: number, startDate?: string, endDate?: string) =>
    apiClient
      .get<Page<TrainingResponse>>('/trainings', { params: { page, size, startDate, endDate } })
      .then((r) => r.data),

  get: (id: string | number) =>
    apiClient
      .get<TrainingResponse>(`/trainings/${id}`)
      .then((r) => r.data),

  create: (body: TrainingRequest) =>
    apiClient.post<TrainingResponse>('/trainings', body).then((r) => r.data),

  update: (id: string | number, body: TrainingRequest) =>
    apiClient.put<TrainingResponse>(`/trainings/${id}`, body).then((r) => r.data),

  remove: (id: number) =>
    apiClient.delete(`/trainings/${id}`).then(() => undefined),
}
