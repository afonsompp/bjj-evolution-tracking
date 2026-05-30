import { apiClient } from '../../../api/client'
import type {
  Page,
  TechniqueRequest,
  TechniqueResponse,
} from '../../../types/api'

export const techniqueApi = {
  list: (query: string | undefined, page: number, size: number) =>
    apiClient
      .get<Page<TechniqueResponse>>('/techniques', {
        params: { query: query || undefined, page, size },
      })
      .then((r) => r.data),

  create: (body: TechniqueRequest) =>
    apiClient.post<TechniqueResponse>('/techniques', body).then((r) => r.data),

  update: (id: number, body: TechniqueRequest) =>
    apiClient
      .put<TechniqueResponse>(`/techniques/${id}`, body)
      .then((r) => r.data),

  remove: (id: number) =>
    apiClient.delete(`/techniques/${id}`).then(() => undefined),
}
