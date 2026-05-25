import { apiClient } from '../../../api/client'
import type {
  AcademyMenberClassViewResponse,
  AcademyRequest,
  AcademyResponse,
  CheckInResponse,
  ClassTemplateRequest,
  ClassTemplateResponse,
  GenerateClassesRequest,
  Page,
  ScheduledClassRequest,
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

  create: (body: AcademyRequest) =>
    apiClient.post<AcademyResponse>('/academies', body).then((r) => r.data),

  update: (id: string, body: AcademyRequest) =>
    apiClient.put<AcademyResponse>(`/academies/${id}`, body).then((r) => r.data),

  // ── Classes ──────────────────────────────────────────────
  getSchedule: (id: string, startDate: string, endDate: string, page = 0, size = 20) =>
    apiClient
      .get<Page<ScheduledClassResponse>>(`/academies/${id}/classes`, {
        params: { startDate, endDate, page, size },
      })
      .then((r) => r.data),

  listClasses: (
    academyId: string,
    startDate?: string,
    endDate?: string,
    page = 0,
    size = 30,
  ) =>
    apiClient
      .get<Page<ScheduledClassResponse>>(`/academies/${academyId}/classes`, {
        params: { startDate, endDate, page, size },
      })
      .then((r) => r.data),

  createClass: (academyId: string, body: ScheduledClassRequest) =>
    apiClient
      .post<ScheduledClassResponse>(`/academies/${academyId}/classes`, body)
      .then((r) => r.data),

  updateClass: (academyId: string, classId: number, body: ScheduledClassRequest) =>
    apiClient
      .put<ScheduledClassResponse>(`/academies/${academyId}/classes/${classId}`, body)
      .then((r) => r.data),

  getClass: (academyId: string, classId: string) =>
    apiClient
      .get<ScheduledClassResponse>(`/academies/${academyId}/classes/${classId}`)
      .then((r) => r.data),

  cancelClass: (academyId: string, classId: number) =>
    apiClient
      .patch<void>(`/academies/${academyId}/classes/${classId}/cancel`)
      .then((r) => r.data),

  closeClass: (academyId: string, classId: number) =>
    apiClient
      .patch<void>(`/academies/${academyId}/classes/${classId}/close`)
      .then((r) => r.data),

  // ── Attendance ───────────────────────────────────────────
  selfCheckIn: (academyId: string, classId: number) =>
    apiClient
      .post<CheckInResponse>(`/academies/${academyId}/classes/${classId}/attendances/me`)
      .then((r) => r.data),

  cancelMyCheckIn: (academyId: string, classId: number) =>
    apiClient
      .patch<CheckInResponse>(`/academies/${academyId}/classes/${classId}/attendances/me/cancel`)
      .then((r) => r.data),

  listAttendances: (academyId: string, classId: number, page = 0, size = 50) =>
    apiClient
      .get<Page<CheckInResponse>>(`/academies/${academyId}/classes/${classId}/attendances`, {
        params: { page, size },
      })
      .then((r) => r.data),

  confirmAttendance: (academyId: string, classId: number, studentId: string) =>
    apiClient
      .patch<CheckInResponse>(
        `/academies/${academyId}/classes/${classId}/attendances/${studentId}/confirm`,
      )
      .then((r) => r.data),

  removeAttendance: (academyId: string, classId: number, studentId: string) =>
    apiClient
      .delete<void>(`/academies/${academyId}/classes/${classId}/attendances/${studentId}`)
      .then((r) => r.data),

  registerStudentAttendance: (academyId: string, classId: number, studentId: string) =>
    apiClient
      .post<CheckInResponse>(`/academies/${academyId}/classes/${classId}/attendances`, { studentId })
      .then((r) => r.data),

  getMyAttendances: (academyId?: string, page = 0, size = 100) =>
    apiClient
      .get<Page<AcademyMenberClassViewResponse>>('/attendances', {
        params: { academyId, page, size },
      })
      .then((r) => r.data),

  // ── Templates ────────────────────────────────────────────
  listTemplates: (academyId: string, page = 0, size = 20) =>
    apiClient
      .get<Page<ClassTemplateResponse>>(`/academies/${academyId}/templates`, {
        params: { page, size },
      })
      .then((r) => r.data),

  getTemplate: (academyId: string, templateId: string) =>
    apiClient
      .get<ClassTemplateResponse>(`/academies/${academyId}/templates/${templateId}`)
      .then((r) => r.data),

  createTemplate: (academyId: string, body: ClassTemplateRequest) =>
    apiClient
      .post<ClassTemplateResponse>(`/academies/${academyId}/templates`, body)
      .then((r) => r.data),

  updateTemplate: (academyId: string, templateId: string, body: ClassTemplateRequest) =>
    apiClient
      .put<ClassTemplateResponse>(`/academies/${academyId}/templates/${templateId}`, body)
      .then((r) => r.data),

  deleteTemplate: (academyId: string, templateId: string) =>
    apiClient
      .delete<void>(`/academies/${academyId}/templates/${templateId}`)
      .then((r) => r.data),

  generateFromTemplate: (
    academyId: string,
    templateId: string,
    body: GenerateClassesRequest,
  ) =>
    apiClient
      .post<ScheduledClassResponse[]>(
        `/academies/${academyId}/templates/${templateId}/generate`,
        body,
      )
      .then((r) => r.data),
}
