import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }))
vi.mock('../features/auth/AuthContext', () => ({ useAuth: () => ({ signOut }) }))

const profileState = vi.hoisted(() => ({ value: {} as { data: unknown; error: unknown } }))
vi.mock('../features/profile/useProfile', () => ({ useProfile: () => profileState.value }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import AppLayout from './AppLayout'

beforeEach(() => {
  vi.clearAllMocks()
  profileState.value = { data: { role: 'CUSTOMER', name: 'Ana', photoUrl: null }, error: null }
})

// Sidebar and mobile chrome both render in jsdom, so labels/controls appear
// more than once — assertions tolerate duplicates.
describe('AppLayout', () => {
  it('renders the primary navigation for a regular user', () => {
    renderWithProviders(<AppLayout />)
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Training').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Academies').length).toBeGreaterThan(0)
  })

  it('hides admin-only links for a non-admin', () => {
    renderWithProviders(<AppLayout />)
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    expect(screen.queryByText('Techniques')).not.toBeInTheDocument()
  })

  it('shows admin-only links for an admin', () => {
    profileState.value = { data: { role: 'ADMIN', name: 'Boss', photoUrl: null }, error: null }
    renderWithProviders(<AppLayout />)
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Techniques').length).toBeGreaterThan(0)
  })

  it('signs out and redirects to login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppLayout />)

    await user.click(screen.getAllByRole('button', { name: /My Account/ })[0])
    await user.click(screen.getAllByRole('button', { name: 'Sign out' })[0])

    expect(signOut).toHaveBeenCalled()
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/login'))
  })

  it('switches the UI language to Portuguese', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppLayout />)

    await user.click(screen.getAllByRole('button', { name: /My Account/ })[0])
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'pt-BR')

    expect(screen.getAllByText('Treinos').length).toBeGreaterThan(0)
  })
})
