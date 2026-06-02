import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const membersState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))
const { approveMutate, rejectMutate } = vi.hoisted(() => ({ approveMutate: vi.fn(), rejectMutate: vi.fn() }))

vi.mock('../hooks/useAcademyMembers', () => ({ useAcademyMembers: () => membersState.value }))
vi.mock('../hooks/useManageMember', () => ({
  useApproveMember: () => ({ mutate: approveMutate, isPending: false, variables: undefined }),
  useRejectMember: () => ({ mutate: rejectMutate, isPending: false, variables: undefined }),
}))

import { PendingRequestsPanel } from './PendingRequestsPanel'

const member = (id: string, name: string, nickname?: string) => ({
  user: { id, name, secondName: null, nickname, photoUrl: null },
})

beforeEach(() => {
  vi.clearAllMocks()
  membersState.value = { data: { content: [] }, isLoading: false, isError: false }
})

describe('PendingRequestsPanel', () => {
  it('shows a spinner while loading', () => {
    membersState.value = { data: undefined, isLoading: true, isError: false }
    const { container } = renderWithProviders(<PendingRequestsPanel academyId="a1" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.queryByText('Pending Requests')).not.toBeInTheDocument()
  })

  it('renders an error message on failure', () => {
    membersState.value = { data: undefined, isLoading: false, isError: true }
    renderWithProviders(<PendingRequestsPanel academyId="a1" />)
    expect(screen.getByText('Failed to load pending requests.')).toBeInTheDocument()
  })

  it('shows the empty state and a zero count when there are no requests', () => {
    renderWithProviders(<PendingRequestsPanel academyId="a1" />)
    expect(screen.getByText('No pending requests.')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('lists pending members with the count badge', () => {
    membersState.value = {
      data: { content: [member('u1', 'Ana', 'aninha'), member('u2', 'Bruno')] },
      isLoading: false,
      isError: false,
    }
    renderWithProviders(<PendingRequestsPanel academyId="a1" />)
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('@aninha')).toBeInTheDocument()
    expect(screen.getByText('Bruno')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('approves and rejects by member id', async () => {
    const user = userEvent.setup()
    membersState.value = { data: { content: [member('u1', 'Ana')] }, isLoading: false, isError: false }
    renderWithProviders(<PendingRequestsPanel academyId="a1" />)

    await user.click(screen.getByRole('button', { name: 'Approve' }))
    expect(approveMutate).toHaveBeenCalledWith('u1')

    await user.click(screen.getByRole('button', { name: 'Reject' }))
    expect(rejectMutate).toHaveBeenCalledWith('u1')
  })
})
