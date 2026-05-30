import { useMutation, useQueryClient } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { academyKeys, attendanceKeys } from '../api/keys'

export function useSelfCheckIn(academyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (classId: number) => academyApi.selfCheckIn(academyId, classId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.myAttendances(academyId) })
    },
  })
}

export function useCancelMyCheckIn(academyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (classId: number) => academyApi.cancelMyCheckIn(academyId, classId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.myAttendances(academyId) })
    },
  })
}

export function useConfirmAttendance(academyId: string, classId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (studentId: string) =>
      academyApi.confirmAttendance(academyId, classId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.forClass(classId) })
    },
  })
}

export function useRemoveAttendance(academyId: string, classId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (studentId: string) =>
      academyApi.removeAttendance(academyId, classId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.forClass(classId) })
    },
  })
}

export function useRegisterAttendance(academyId: string, classId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (studentId: string) =>
      academyApi.registerStudentAttendance(academyId, classId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.forClass(classId) })
    },
  })
}

export function useCloseClass(academyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (classId: number) => academyApi.closeClass(academyId, classId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academyKeys.classes(academyId) })
      qc.invalidateQueries({ queryKey: academyKeys.schedule(academyId) })
    },
  })
}
