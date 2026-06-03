import axios from 'axios'
import { apiClient } from '../../../api/client'
import type {
  AcademyMemberRequest,
  AcademyMemberResponse,
  GraduationHistoryResponse,
  GraduationRequest,
  MemberStatus,
  Page,
} from '../../../types/api'

export const membersApi = {
  listMine: (status: MemberStatus | undefined, page: number, size: number) =>
    apiClient
      .get<Page<AcademyMemberResponse>>('/academies/memberships', {
        params: { status, page, size },
      })
      .then((r) => r.data),

  list: (
    academyId: string,
    query: string | undefined,
    status: MemberStatus | undefined,
    page: number,
    size: number,
  ) =>
    apiClient
      .get<Page<AcademyMemberResponse>>(`/academies/${academyId}/members`, {
        params: { query: query || undefined, status, page, size },
      })
      .then((r) => r.data),

  // Returns null when the user has no membership (404) so callers can treat
  // "not a member" as a normal state instead of a query error. This also lets
  // the membership query update after leaving/being removed, where the GET
  // starts returning 404.
  get: (academyId: string, userId: string): Promise<AcademyMemberResponse | null> =>
    apiClient
      .get<AcademyMemberResponse>(`/academies/${academyId}/members/${userId}`)
      .then((r) => r.data)
      .catch((error) => {
        if (axios.isAxiosError(error) && error.response?.status === 404) return null
        throw error
      }),

  join: (academyId: string) =>
    apiClient
      .post<AcademyMemberResponse>(`/academies/${academyId}/members/join`)
      .then((r) => r.data),

  leave: (academyId: string) =>
    apiClient.delete(`/academies/${academyId}/members/me`).then(() => undefined),

  approve: (academyId: string, userId: string) =>
    apiClient
      .patch<AcademyMemberResponse>(`/academies/${academyId}/members/${userId}/approve`)
      .then((r) => r.data),

  reject: (academyId: string, userId: string) =>
    apiClient
      .patch(`/academies/${academyId}/members/${userId}/reject`)
      .then(() => undefined),

  remove: (academyId: string, userId: string) =>
    apiClient
      .delete(`/academies/${academyId}/members/${userId}`)
      .then(() => undefined),

  graduate: (academyId: string, userId: string, body: GraduationRequest) =>
    apiClient
      .post<AcademyMemberResponse>(`/academies/${academyId}/members/${userId}/graduate`, body)
      .then((r) => r.data),

  listGraduations: (academyId: string, page: number, size: number) =>
    apiClient
      .get<Page<GraduationHistoryResponse>>(`/academies/${academyId}/members/graduations`, {
        params: { page, size },
      })
      .then((r) => r.data),

  listMyGraduations: (academyId: string, userId: string, page: number, size: number) =>
    apiClient
      .get<Page<GraduationHistoryResponse>>(`/academies/${academyId}/members/${userId}/graduations`, {
        params: { page, size },
      })
      .then((r) => r.data),

  listAllMyGraduations: (page: number, size: number) =>
    apiClient
      .get<Page<GraduationHistoryResponse>>('/academies/memberships/graduations', {
        params: { page, size },
      })
      .then((r) => r.data),

  updateMember: (academyId: string, userId: string, body: AcademyMemberRequest) =>
    apiClient
      .put<AcademyMemberResponse>(`/academies/${academyId}/members/${userId}`, body)
      .then((r) => r.data),
}
