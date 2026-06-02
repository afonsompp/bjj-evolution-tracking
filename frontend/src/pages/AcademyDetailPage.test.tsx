import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const academyState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))
const membershipState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean } }))
const perms = vi.hoisted(() => ({ value: { canManageMembers: false, canManageClasses: false, canEditAcademy: false } }))
const mut = vi.hoisted(() => ({ join: vi.fn(), leave: vi.fn() }))

vi.mock('../features/academy/hooks/useAcademy', () => ({ useAcademy: () => academyState.value }))
vi.mock('../features/profile/useProfile', () => ({ useProfile: () => ({ data: { id: 'me' } }) }))
vi.mock('../features/academy/hooks/useMembership', () => ({ useMembership: () => membershipState.value }))
vi.mock('../features/academy/hooks/useAcademyMembers', () => ({ useAcademyMembers: () => ({ data: { totalElements: 0 } }) }))
vi.mock('../features/academy/permissions/useAcademyPermissions', () => ({ useAcademyPermissions: () => perms.value }))
vi.mock('../features/academy/hooks/useJoinAcademy', () => ({
  useJoinAcademy: () => ({ mutate: mut.join, isPending: false, isSuccess: false }),
  useLeaveAcademy: () => ({ mutate: mut.leave, isPending: false, isError: false }),
}))
vi.mock('../features/academy/sections/ScheduleSection', () => ({ ScheduleSection: () => <div>schedule-section</div> }))
vi.mock('../features/academy/sections/MembersSection', () => ({ MembersSection: () => <div>members-section</div> }))
vi.mock('../features/academy/sections/ClassesSection', () => ({ ClassesSection: () => <div>classes-section</div> }))
vi.mock('../features/academy/sections/SettingsSection', () => ({ SettingsSection: () => <div>settings-section</div> }))
vi.mock('../features/academy/sections/GraduationHistorySection', () => ({ GraduationHistorySection: () => <div>grad-section</div> }))
vi.mock('../features/academy/sections/AttendanceHistorySection', () => ({ AttendanceHistorySection: () => <div>att-section</div> }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import AcademyDetailPage from './AcademyDetailPage'

const opts = { path: '/academies/:id', route: '/academies/a1' }

beforeEach(() => {
  vi.clearAllMocks()
  academyState.value = { data: { id: 'a1', name: 'Evolution', address: 'Rua X' }, isLoading: false, isError: false }
  membershipState.value = { data: undefined, isLoading: false }
  perms.value = { canManageMembers: false, canManageClasses: false, canEditAcademy: false }
})

describe('AcademyDetailPage', () => {
  it('shows a spinner while the academy loads', () => {
    academyState.value = { data: undefined, isLoading: true, isError: false }
    const { container } = renderWithProviders(<AcademyDetailPage />, opts)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders an error when the academy fails to load', () => {
    academyState.value = { data: undefined, isLoading: false, isError: true }
    renderWithProviders(<AcademyDetailPage />, opts)
    expect(screen.getByText('Failed to load academy details.')).toBeInTheDocument()
  })

  it('shows a join button for a non-member and requests to join', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AcademyDetailPage />, opts)
    expect(screen.getByRole('heading', { name: 'Evolution' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Request to Join' }))
    expect(mut.join).toHaveBeenCalled()
  })

  it('shows the member badge and the schedule for an active member', () => {
    membershipState.value = { data: { status: 'ACTIVE', role: 'STUDENT' }, isLoading: false }
    renderWithProviders(<AcademyDetailPage />, opts)
    expect(screen.getByText('Member')).toBeInTheDocument()
    expect(screen.getByText('schedule-section')).toBeInTheDocument()
  })

  it('leaves the academy through the confirmation modal', async () => {
    const user = userEvent.setup()
    membershipState.value = { data: { status: 'ACTIVE', role: 'STUDENT' }, isLoading: false }
    renderWithProviders(<AcademyDetailPage />, opts)

    await user.click(screen.getByRole('button', { name: 'Leave' }))
    // Modal confirm is the second "Leave" button.
    const leaveButtons = screen.getAllByRole('button', { name: 'Leave' })
    await user.click(leaveButtons[leaveButtons.length - 1])
    expect(mut.leave).toHaveBeenCalled()
  })
})
