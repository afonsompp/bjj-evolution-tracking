import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const searchState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))
const updateState = vi.hoisted(() => ({
  value: {} as { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean; variables: unknown },
}))
const profileState = vi.hoisted(() => ({ value: { data: { id: 'me' } } as { data: { id: string } } }))

vi.mock('../features/admin/hooks/useAdminUsers', () => ({
  useAdminUserSearch: () => searchState.value,
  useUpdateUserRole: () => updateState.value,
}))
vi.mock('../features/profile/useProfile', () => ({ useProfile: () => profileState.value }))

import AdminUsersPage from './AdminUsersPage'

const updateMutate = vi.fn()
const user = (over: Record<string, unknown> = {}) => ({
  id: 'u1', name: 'Ana', secondName: null, nickname: 'aninha', email: 'ana@x.com',
  role: 'CUSTOMER', photoUrl: null, ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  searchState.value = { data: { content: [], totalElements: 0, totalPages: 0 }, isLoading: false, isError: false }
  updateState.value = { mutate: updateMutate, isPending: false, isError: false, variables: undefined }
  profileState.value = { data: { id: 'me' } }
})

describe('AdminUsersPage', () => {
  it('prompts to search when there are no results yet', () => {
    renderWithProviders(<AdminUsersPage />)
    expect(screen.getByText('Search for a user')).toBeInTheDocument()
  })

  it('renders an error message on failure', () => {
    searchState.value = { data: undefined, isLoading: false, isError: true }
    renderWithProviders(<AdminUsersPage />)
    expect(screen.getByText('Failed to load users. Try again later.')).toBeInTheDocument()
  })

  it('lists users and changes a role', async () => {
    const ev = userEvent.setup()
    searchState.value = {
      data: { content: [user()], totalElements: 1, totalPages: 1 },
      isLoading: false, isError: false,
    }
    renderWithProviders(<AdminUsersPage />)

    expect(screen.getByText(/Ana/)).toBeInTheDocument()
    await ev.selectOptions(screen.getByRole('combobox'), 'ADMIN')
    expect(updateMutate).toHaveBeenCalledWith({ userId: 'u1', role: 'ADMIN' })
  })

  it('locks the role selector for the signed-in admin (self)', () => {
    searchState.value = {
      data: { content: [user({ id: 'me', name: 'Me' })], totalElements: 1, totalPages: 1 },
      isLoading: false, isError: false,
    }
    renderWithProviders(<AdminUsersPage />)
    expect(screen.getByText('(you)')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('shows an error when a role update fails', () => {
    searchState.value = { data: { content: [user()], totalElements: 1, totalPages: 1 }, isLoading: false, isError: false }
    updateState.value = { mutate: updateMutate, isPending: false, isError: true, variables: undefined }
    renderWithProviders(<AdminUsersPage />)
    expect(screen.getByText('Failed to update role. Try again.')).toBeInTheDocument()
  })
})
