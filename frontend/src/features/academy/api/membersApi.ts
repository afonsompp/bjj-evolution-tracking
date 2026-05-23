import { apiClient } from '../../../api/client'
import type {
  AcademyMemberRequest,
  AcademyMemberResponse,
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

  get: (academyId: string, userId: string) =>
    apiClient
      .get<AcademyMemberResponse>(`/academies/${academyId}/members/${userId}`)
      .then((r) => r.data),

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

  remove: (academyId: string, userId: string) =>
    apiClient
      .delete(`/academies/${academyId}/members/${userId}`)
      .then(() => undefined),

  graduate: (academyId: string, userId: string, body: GraduationRequest) =>
    apiClient
      .post<AcademyMemberResponse>(`/academies/${academyId}/members/${userId}/graduate`, body)
      .then((r) => r.data),

  updateMember: (academyId: string, userId: string, body: AcademyMemberRequest) =>
    apiClient
      .put<AcademyMemberResponse>(`/academies/${academyId}/members/${userId}`, body)
      .then((r) => r.data),
}
