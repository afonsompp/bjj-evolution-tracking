import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'
import type { ScheduledClassResponse } from '../../../types/api'

const attendanceState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean } }))
const membersState = vi.hoisted(() => ({ value: {} as { data: unknown } }))
const m = vi.hoisted(() => ({
  confirm: vi.fn(),
  remove: vi.fn(),
  register: vi.fn(),
  close: vi.fn(),
}))

vi.mock('../hooks/useAttendance', () => ({ useClassAttendance: () => attendanceState.value }))
vi.mock('../hooks/useAcademyMembers', () => ({ useAcademyMembers: () => membersState.value }))
vi.mock('../hooks/useAttendanceMutations', () => ({
  useConfirmAttendance: () => ({ mutate: m.confirm, isPending: false }),
  useRemoveAttendance: () => ({ mutate: m.remove, isPending: false }),
  useRegisterAttendance: () => ({ mutate: m.register, isPending: false }),
  useCloseClass: () => ({ mutate: m.close, isPending: false }),
}))

import { AttendanceModal } from './AttendanceModal'

const cls = {
  id: 7,
  classType: 'REGULAR',
  status: 'PUBLISHED',
  startTime: '2026-06-01T19:00:00Z',
  instructor: { id: 'inst-1' },
} as unknown as ScheduledClassResponse

const attendee = (id: string, name: string, status: string) => ({
  id: `att-${id}`,
  status,
  checkInTime: null,
  student: { id, name, secondName: null, photoUrl: null },
})

beforeEach(() => {
  vi.clearAllMocks()
  attendanceState.value = { data: { content: [] }, isLoading: false }
  membersState.value = { data: { content: [] } }
})

describe('AttendanceModal', () => {
  it('shows the empty state when there are no attendees', () => {
    renderWithProviders(<AttendanceModal academyId="a1" cls={cls} onClose={vi.fn()} />)
    expect(screen.getByText('No attendees yet.')).toBeInTheDocument()
  })

  it('lists attendees with their localized status', () => {
    attendanceState.value = {
      data: { content: [attendee('u1', 'Ana', 'CONFIRMED'), attendee('u2', 'Bruno', 'REGISTERED')] },
      isLoading: false,
    }
    renderWithProviders(<AttendanceModal academyId="a1" cls={cls} onClose={vi.fn()} />)
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
    expect(screen.getByText('Registered')).toBeInTheDocument()
  })

  it('offers Confirm only for REGISTERED attendees and confirms by student id', async () => {
    const user = userEvent.setup()
    attendanceState.value = {
      data: { content: [attendee('u2', 'Bruno', 'REGISTERED')] },
      isLoading: false,
    }
    renderWithProviders(<AttendanceModal academyId="a1" cls={cls} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(m.confirm).toHaveBeenCalledWith('u2')
  })

  it('does not offer Confirm for an already-confirmed attendee', () => {
    attendanceState.value = {
      data: { content: [attendee('u1', 'Ana', 'CONFIRMED')] },
      isLoading: false,
    }
    renderWithProviders(<AttendanceModal academyId="a1" cls={cls} onClose={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
  })

  it('excludes already-registered students and the instructor from the add list, and registers the picked one', async () => {
    const user = userEvent.setup()
    attendanceState.value = { data: { content: [attendee('u1', 'Ana', 'CONFIRMED')] }, isLoading: false }
    membersState.value = {
      data: {
        content: [
          { user: { id: 'u1', name: 'Ana', secondName: null } }, // already registered
          { user: { id: 'inst-1', name: 'Coach', secondName: null } }, // instructor
          { user: { id: 'u3', name: 'Carla', secondName: null } }, // eligible
        ],
      },
    }
    renderWithProviders(<AttendanceModal academyId="a1" cls={cls} onClose={vi.fn()} />)

    const select = screen.getByRole('combobox')
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent?.trim())
    expect(options).toContain('Carla')
    expect(options).not.toContain('Coach')

    await user.selectOptions(select, 'u3')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(m.register).toHaveBeenCalledWith('u3', expect.anything())
  })

  it('does not offer Confirm for a canceled class', () => {
    const canceledCls = { ...cls, status: 'CANCELED' } as unknown as ScheduledClassResponse
    attendanceState.value = {
      data: { content: [attendee('u2', 'Bruno', 'REGISTERED')] },
      isLoading: false,
    }
    renderWithProviders(<AttendanceModal academyId="a1" cls={canceledCls} onClose={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
  })

  it('hides the add-student control and shows a notice for a draft class', () => {
    const draftCls = { ...cls, status: 'DRAFT' } as unknown as ScheduledClassResponse
    membersState.value = { data: { content: [{ user: { id: 'u3', name: 'Carla', secondName: null } }] } }
    renderWithProviders(<AttendanceModal academyId="a1" cls={draftCls} onClose={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByText('Publish this class to register attendance.')).toBeInTheDocument()
  })

  it('runs the close-class confirmation flow', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AttendanceModal academyId="a1" cls={cls} onClose={vi.fn()} />)

    // First click reveals the confirmation; the mutation only fires on confirm.
    await user.click(screen.getByRole('button', { name: 'Close class' }))
    expect(m.close).not.toHaveBeenCalled()

    const buttons = screen.getAllByRole('button', { name: 'Close class' })
    await user.click(buttons[buttons.length - 1])
    expect(m.close).toHaveBeenCalledWith(7, expect.anything())
  })
})
