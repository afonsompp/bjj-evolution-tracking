import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const memberA = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))
const emptyResult = { data: undefined, isLoading: false, isError: false }
vi.mock('../hooks/useAttendanceHistory', () => ({
  useMemberAttendances: () => memberA.value,
  useMyAllAttendances: () => emptyResult,
}))

import { AttendanceHistorySection } from './AttendanceHistorySection'

const entry = (id: string, status: string) => ({
  id,
  status,
  scheduledClass: {
    classType: 'REGULAR',
    academyName: 'Evolution',
    instructor: { name: 'Coach', secondName: null },
    startTime: '2026-05-01T19:00:00Z',
  },
})

beforeEach(() => {
  vi.clearAllMocks()
  memberA.value = { data: undefined, isLoading: false, isError: false }
})

describe('AttendanceHistorySection (member variant)', () => {
  it('shows a spinner while loading', () => {
    memberA.value = { data: undefined, isLoading: true, isError: false }
    const { container } = renderWithProviders(
      <AttendanceHistorySection variant="member" academyId="a1" userId="u1" />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders an error message on failure', () => {
    memberA.value = { data: undefined, isLoading: false, isError: true }
    renderWithProviders(<AttendanceHistorySection variant="member" academyId="a1" userId="u1" />)
    expect(screen.getByText('Failed to load attendance history.')).toBeInTheDocument()
  })

  it('shows the empty state when there is no attendance', () => {
    memberA.value = { data: { content: [], totalElements: 0, totalPages: 0 }, isLoading: false, isError: false }
    renderWithProviders(<AttendanceHistorySection variant="member" academyId="a1" userId="u1" />)
    expect(screen.getByText('No attendance recorded yet.')).toBeInTheDocument()
  })

  it('lists attendance entries with class type and localized status', () => {
    memberA.value = {
      data: { content: [entry('e1', 'CONFIRMED')], totalElements: 1, totalPages: 1 },
      isLoading: false,
      isError: false,
    }
    renderWithProviders(<AttendanceHistorySection variant="member" academyId="a1" userId="u1" />)
    expect(screen.getByText('Regular')).toBeInTheDocument()
    expect(screen.getByText('Coach')).toBeInTheDocument()
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })

  it('paginates when there is more than one page', async () => {
    const user = userEvent.setup()
    memberA.value = {
      data: { content: [entry('e1', 'CONFIRMED')], totalElements: 40, totalPages: 2 },
      isLoading: false,
      isError: false,
    }
    renderWithProviders(<AttendanceHistorySection variant="member" academyId="a1" userId="u1" />)

    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })
})
