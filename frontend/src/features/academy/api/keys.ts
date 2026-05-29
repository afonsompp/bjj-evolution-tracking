import type { MemberStatus } from '../../../types/api'

export const academyKeys = {
  all: ['academy'] as const,
  detail: (id: string) => [...academyKeys.all, 'detail', id] as const,
  schedule: (id: string) => [...academyKeys.all, 'schedule', id] as const,
  search: (query: string, page: number) =>
    [...academyKeys.all, 'search', query, page] as const,
  classes: (academyId: string) => [...academyKeys.all, 'classes', academyId] as const,
  templates: (academyId: string) => [...academyKeys.all, 'templates', academyId] as const,
}

export const attendanceKeys = {
  forClass: (classId: number | string) =>
    ['attendance', 'class', classId.toString()] as const,
  myAttendances: (academyId?: string) =>
    ['attendance', 'mine', academyId ?? 'all'] as const,
}

export const memberKeys = {
  all: ['academy-member'] as const,
  byAcademy: (academyId: string) =>
    [...memberKeys.all, 'byAcademy', academyId] as const,
  list: (academyId: string, query: string, status: MemberStatus | undefined, page: number) =>
    [...memberKeys.byAcademy(academyId), 'list', query, status ?? 'ALL', page] as const,
  one: (academyId: string, userId: string) =>
    [...memberKeys.byAcademy(academyId), 'one', userId] as const,
  myMemberships: (status?: MemberStatus) =>
    [...memberKeys.all, 'mine', status ?? 'ALL'] as const,
  graduations: (academyId: string, page: number) =>
    [...memberKeys.byAcademy(academyId), 'graduations', page] as const,
  myGraduations: (academyId: string, userId: string, page: number) =>
    [...memberKeys.byAcademy(academyId), 'graduations', userId, page] as const,
  myGraduationsAll: (userId: string, page: number) =>
    [...memberKeys.all, 'graduations', 'mine-all', userId, page] as const,
}
