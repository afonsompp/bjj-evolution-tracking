import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/renderWithProviders'

const { updatePassword } = vi.hoisted(() => ({ updatePassword: vi.fn() }))
vi.mock('../../lib/auth/authClient', () => ({ authClient: { updatePassword } }))

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('../../lib/supabase', () => ({ supabase: { auth: { getSession } } }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import ResetPasswordForm from './ResetPasswordForm'

beforeEach(() => {
  vi.clearAllMocks()
  window.location.hash = ''
  getSession.mockResolvedValue({ data: { session: { access_token: 't' } } })
})

async function fillPasswords(
  user: ReturnType<typeof userEvent.setup>,
  { pwd = 'password1', confirm = 'password1' } = {},
) {
  await user.type(await screen.findByLabelText('New Password'), pwd)
  await user.type(screen.getByLabelText('Confirm New Password'), confirm)
}

describe('ResetPasswordForm', () => {
  it('shows the form once the recovery session is established', async () => {
    renderWithProviders(<ResetPasswordForm />)
    expect(await screen.findByLabelText('New Password')).toBeInTheDocument()
  })

  it('shows the link error and offers a new link when the URL carries an error', async () => {
    window.location.hash = '#error=access_denied&error_description=Email+link+is+invalid+or+has+expired'
    getSession.mockResolvedValue({ data: { session: null } })
    renderWithProviders(<ResetPasswordForm />)

    expect(await screen.findByText('Email link is invalid or has expired')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Request a new link' })).toBeInTheDocument()
    expect(screen.queryByLabelText('New Password')).not.toBeInTheDocument()
  })

  it('rejects a short password without calling updatePassword', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordForm />)

    await fillPasswords(user, { pwd: 'short', confirm: 'short' })
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('rejects mismatched passwords', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordForm />)

    await fillPasswords(user, { pwd: 'password1', confirm: 'password2' })
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('updates the password and navigates to the dashboard', async () => {
    const user = userEvent.setup()
    updatePassword.mockResolvedValue({ error: null })
    renderWithProviders(<ResetPasswordForm />)

    await fillPasswords(user)
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(updatePassword).toHaveBeenCalledWith('password1')
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true }))
  })
})
