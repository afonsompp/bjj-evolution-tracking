import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHookWithClient } from '../../../test/queryWrapper'

const api = vi.hoisted(() => ({
  selfCheckIn: vi.fn(),
  cancelMyCheckIn: vi.fn(),
  confirmAttendance: vi.fn(),
  removeAttendance: vi.fn(),
  registerStudentAttendance: vi.fn(),
  closeClass: vi.fn(),
}))
vi.mock('../api/academyApi', () => ({ academyApi: api }))

import {
  useSelfCheckIn,
  useCancelMyCheckIn,
  useConfirmAttendance,
  useRemoveAttendance,
  useRegisterAttendance,
  useCloseClass,
} from './useAttendanceMutations'
import { academyKeys, attendanceKeys } from '../api/keys'

const ACADEMY = 'acad-1'
const CLASS = 77

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useSelfCheckIn', () => {
  it('checks in then invalidates my-attendances for the academy', async () => {
    api.selfCheckIn.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useSelfCheckIn(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync(CLASS)

    expect(api.selfCheckIn).toHaveBeenCalledWith(ACADEMY, CLASS)
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: attendanceKeys.myAttendances(ACADEMY),
    })
  })
})

describe('useCancelMyCheckIn', () => {
  it('cancels then invalidates my-attendances for the academy', async () => {
    api.cancelMyCheckIn.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useCancelMyCheckIn(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync(CLASS)

    expect(api.cancelMyCheckIn).toHaveBeenCalledWith(ACADEMY, CLASS)
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: attendanceKeys.myAttendances(ACADEMY),
    })
  })
})

describe('per-class attendance mutations', () => {
  it('useConfirmAttendance invalidates the class roster', async () => {
    api.confirmAttendance.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() =>
      useConfirmAttendance(ACADEMY, CLASS),
    )
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync('student-9')

    expect(api.confirmAttendance).toHaveBeenCalledWith(ACADEMY, CLASS, 'student-9')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: attendanceKeys.forClass(CLASS) })
  })

  it('useRemoveAttendance invalidates the class roster', async () => {
    api.removeAttendance.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() =>
      useRemoveAttendance(ACADEMY, CLASS),
    )
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync('student-9')

    expect(api.removeAttendance).toHaveBeenCalledWith(ACADEMY, CLASS, 'student-9')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: attendanceKeys.forClass(CLASS) })
  })

  it('useRegisterAttendance invalidates the class roster', async () => {
    api.registerStudentAttendance.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() =>
      useRegisterAttendance(ACADEMY, CLASS),
    )
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync('student-9')

    expect(api.registerStudentAttendance).toHaveBeenCalledWith(ACADEMY, CLASS, 'student-9')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: attendanceKeys.forClass(CLASS) })
  })
})

describe('useCloseClass', () => {
  it('closes then invalidates both the classes list and the schedule', async () => {
    api.closeClass.mockResolvedValue(undefined)
    const { result, client } = renderHookWithClient(() => useCloseClass(ACADEMY))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await result.current.mutateAsync(CLASS)

    expect(api.closeClass).toHaveBeenCalledWith(ACADEMY, CLASS)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: academyKeys.classes(ACADEMY) })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: academyKeys.schedule(ACADEMY) })
  })
})
