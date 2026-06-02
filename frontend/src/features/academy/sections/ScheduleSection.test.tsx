import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const scheduleState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean } }))
const myAttendances = vi.hoisted(() => ({ value: { data: { content: [] as unknown[] } } }))
const profileState = vi.hoisted(() => ({ value: { data: { id: 'me' } } as { data: { id: string } } }))
const { checkIn, cancelCheckIn } = vi.hoisted(() => ({ checkIn: vi.fn(), cancelCheckIn: vi.fn() }))

vi.mock('../hooks/useAcademySchedule', () => ({ useAcademySchedule: () => scheduleState.value }))
vi.mock('../hooks/useAttendance', () => ({ useMyAttendances: () => myAttendances.value }))
vi.mock('../../profile/useProfile', () => ({ useProfile: () => profileState.value }))
vi.mock('../hooks/useAttendanceMutations', () => ({
  useSelfCheckIn: () => ({ mutate: checkIn, isPending: false, variables: undefined }),
  useCancelMyCheckIn: () => ({ mutate: cancelCheckIn, isPending: false, variables: undefined }),
}))

import { ScheduleSection } from './ScheduleSection'

// Far-future so it lands in the "upcoming" (startTime > now) bucket.
const futureClass = {
  id: 5,
  classType: 'REGULAR',
  trainingType: 'GI',
  status: 'PUBLISHED',
  startTime: '2099-06-01T19:00:00Z',
  durationMinutes: 60,
  instructor: { id: 'i1', name: 'Coach', photoUrl: null },
}

beforeEach(() => {
  vi.clearAllMocks()
  scheduleState.value = { data: { content: [], totalPages: 0 }, isLoading: false }
  myAttendances.value = { data: { content: [] } }
  profileState.value = { data: { id: 'me' } }
})

describe('ScheduleSection', () => {
  it('shows the empty state when there are no upcoming classes', () => {
    renderWithProviders(<ScheduleSection academyId="a1" />)
    expect(screen.getByText('No upcoming classes scheduled.')).toBeInTheDocument()
  })

  it('renders an upcoming class with a check-in button and checks in', async () => {
    const user = userEvent.setup()
    scheduleState.value = { data: { content: [futureClass], totalPages: 1 }, isLoading: false }
    renderWithProviders(<ScheduleSection academyId="a1" />)

    expect(screen.getByText('Coach')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Check in' }))
    expect(checkIn).toHaveBeenCalledWith(5)
  })

  it('shows an Instructor badge instead of check-in for the class instructor', () => {
    scheduleState.value = { data: { content: [futureClass], totalPages: 1 }, isLoading: false }
    profileState.value = { data: { id: 'i1' } }
    renderWithProviders(<ScheduleSection academyId="a1" />)

    expect(screen.getByText('Instructor')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check in' })).not.toBeInTheDocument()
  })

  it('reflects a confirmed attendance status', () => {
    scheduleState.value = { data: { content: [futureClass], totalPages: 1 }, isLoading: false }
    myAttendances.value = { data: { content: [{ scheduledClass: { id: 5 }, status: 'CONFIRMED' }] } }
    renderWithProviders(<ScheduleSection academyId="a1" />)

    expect(screen.getByText('Confirmed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check in' })).not.toBeInTheDocument()
  })
})
