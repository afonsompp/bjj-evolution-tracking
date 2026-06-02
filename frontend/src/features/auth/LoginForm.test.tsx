import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/renderWithProviders'

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }))
vi.mock('../../lib/auth/authClient', () => ({ authClient: { signIn } }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import LoginForm from './LoginForm'

beforeEach(() => vi.clearAllMocks())

async function fillCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email'), 'me@example.com')
  await user.type(screen.getByLabelText('Password'), 'secret123')
}

describe('LoginForm', () => {
  it('signs in with the entered credentials and navigates to the dashboard', async () => {
    const user = userEvent.setup()
    signIn.mockResolvedValue({ error: null })
    renderWithProviders(<LoginForm />)

    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(signIn).toHaveBeenCalledWith('me@example.com', 'secret123')
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dashboard'))
  })

  it('maps invalid_credentials to a friendly message and stays put', async () => {
    const user = userEvent.setup()
    signIn.mockResolvedValue({ error: { code: 'invalid_credentials', message: 'nope' } })
    renderWithProviders(<LoginForm />)

    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('maps email_not_confirmed to its own message', async () => {
    const user = userEvent.setup()
    signIn.mockResolvedValue({ error: { code: 'email_not_confirmed', message: 'x' } })
    renderWithProviders(<LoginForm />)

    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(
      await screen.findByText('Please confirm your email before logging in.'),
    ).toBeInTheDocument()
  })

  it('falls back to the raw error message for unknown error codes', async () => {
    const user = userEvent.setup()
    signIn.mockResolvedValue({ error: { code: 'rate_limited', message: 'Too many attempts' } })
    renderWithProviders(<LoginForm />)

    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(await screen.findByText('Too many attempts')).toBeInTheDocument()
  })
})
