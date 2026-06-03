import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const activeState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))
const pendingState = vi.hoisted(() => ({ value: { data: { totalElements: 0 } } as { data: unknown } }))
const perms = vi.hoisted(() => ({ value: { canManageMembers: true, canEditAcademy: false } }))
const mut = vi.hoisted(() => ({ remove: vi.fn(), graduate: vi.fn(), changeRole: vi.fn() }))

vi.mock('../../auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 'me' } }) }))
vi.mock('../hooks/useAcademyMembers', () => ({
  useAcademyMembers: (_id: string, opts?: { status?: string }) =>
    opts?.status === 'PENDING' ? pendingState.value : activeState.value,
}))
vi.mock('../permissions/useAcademyPermissions', () => ({ useAcademyPermissions: () => perms.value }))
vi.mock('../hooks/useManageMember', () => ({
  useRemoveMember: () => ({ mutate: mut.remove, isPending: false }),
  useGraduateMember: () => ({ mutate: mut.graduate, isPending: false }),
  useChangeRole: () => ({ mutate: mut.changeRole, isPending: false }),
}))
vi.mock('../components/PendingRequestsPanel', () => ({ PendingRequestsPanel: () => <div>pending-panel</div> }))
vi.mock('./GraduationHistorySection', () => ({ GraduationHistorySection: () => <div>grad-section</div> }))
vi.mock('./AttendanceHistorySection', () => ({ AttendanceHistorySection: () => <div>att-section</div> }))

import { MembersSection } from './MembersSection'

const member = (over: Record<string, unknown> = {}) => ({
  user: { id: 'u1', name: 'Ana', secondName: 'Silva', nickname: 'aninha', photoUrl: null },
  role: 'STUDENT',
  belt: 'PURPLE',
  beltStripe: 2,
  status: 'ACTIVE',
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  activeState.value = { data: { content: [], totalElements: 0, totalPages: 0 }, isLoading: false, isError: false }
  pendingState.value = { data: { totalElements: 0 } }
  perms.value = { canManageMembers: true, canEditAcademy: false }
})

describe('MembersSection', () => {
  it('renders an error message on failure', () => {
    activeState.value = { data: undefined, isLoading: false, isError: true }
    renderWithProviders(<MembersSection academyId="a1" />)
    expect(screen.getByText('Failed to load members.')).toBeInTheDocument()
  })

  it('shows the empty state when there are no active members', () => {
    renderWithProviders(<MembersSection academyId="a1" />)
    expect(screen.getByText('No active members')).toBeInTheDocument()
  })

  it('lists members with belt and role', () => {
    activeState.value = {
      data: { content: [member()], totalElements: 1, totalPages: 1 },
      isLoading: false, isError: false,
    }
    renderWithProviders(<MembersSection academyId="a1" />)
    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
    expect(screen.getByText('@aninha')).toBeInTheDocument()
    expect(screen.getByText(/Purple/)).toBeInTheDocument()
    expect(screen.getByText('STUDENT')).toBeInTheDocument()
  })

  it('renders the pending panel only when there are pending requests', () => {
    activeState.value = { data: { content: [member()], totalElements: 1, totalPages: 1 }, isLoading: false, isError: false }
    pendingState.value = { data: { totalElements: 3 } }
    renderWithProviders(<MembersSection academyId="a1" />)
    expect(screen.getByText('pending-panel')).toBeInTheDocument()
  })

  it('hides management actions without the manage capability', () => {
    perms.value = { canManageMembers: false, canEditAcademy: false }
    activeState.value = { data: { content: [member()], totalElements: 1, totalPages: 1 }, isLoading: false, isError: false }
    renderWithProviders(<MembersSection academyId="a1" />)
    expect(screen.queryByRole('button', { name: 'Graduate' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
  })

  it('removes a member through the confirmation modal', async () => {
    const user = userEvent.setup()
    activeState.value = { data: { content: [member()], totalElements: 1, totalPages: 1 }, isLoading: false, isError: false }
    renderWithProviders(<MembersSection academyId="a1" />)

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.getByText('Remove member')).toBeInTheDocument()

    // Two buttons named "Remove" now exist (row icon + modal confirm); the modal's is last.
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' })
    await user.click(removeButtons[removeButtons.length - 1])
    expect(mut.remove).toHaveBeenCalledWith('u1', expect.anything())
  })

  it('graduates a member with the chosen belt', async () => {
    const user = userEvent.setup()
    activeState.value = { data: { content: [member()], totalElements: 1, totalPages: 1 }, isLoading: false, isError: false }
    renderWithProviders(<MembersSection academyId="a1" />)

    await user.click(screen.getByRole('button', { name: 'Graduate' }))
    expect(screen.getByText('Graduate Member')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(mut.graduate).toHaveBeenCalledWith(
      { userId: 'u1', body: { newBelt: 'PURPLE', newStripe: 2 } },
      expect.anything(),
    )
  })
})
