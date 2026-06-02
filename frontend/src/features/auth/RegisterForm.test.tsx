import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/renderWithProviders'

const { signUp } = vi.hoisted(() => ({ signUp: vi.fn() }))
vi.mock('../../lib/auth/authClient', () => ({ authClient: { signUp } }))

import RegisterForm from './RegisterForm'

beforeEach(() => vi.clearAllMocks())

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  { email = 'me@example.com', password = 'password1', confirm = 'password1' } = {},
) {
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm Password'), confirm)
}

describe('RegisterForm', () => {
  it('rejects passwords shorter than 8 characters without calling signUp', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    await fill(user, { password: 'short', confirm: 'short' })
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('rejects mismatched passwords', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm />)

    await fill(user, { password: 'password1', confirm: 'password2' })
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('signs up and shows the verification screen on success', async () => {
    const user = userEvent.setup()
    signUp.mockResolvedValue({ error: null })
    renderWithProviders(<RegisterForm />)

    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(signUp).toHaveBeenCalledWith('me@example.com', 'password1')
    expect(await screen.findByText('Verification email sent!')).toBeInTheDocument()
  })

  it('surfaces a sign-up error and keeps the form visible', async () => {
    const user = userEvent.setup()
    signUp.mockResolvedValue({ error: { message: 'Email already registered' } })
    renderWithProviders(<RegisterForm />)

    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(await screen.findByText('Email already registered')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })
})
